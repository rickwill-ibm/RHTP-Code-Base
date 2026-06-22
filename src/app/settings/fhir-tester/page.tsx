'use client';
import React, { useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';

// Author: Richard Hennessy — Austin, Texas 78726
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

const CERNER_FHIR_BASE = 'https://fhir-ehr-code.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TestStatus = 'idle' | 'running' | 'success' | 'error';

interface TestResult {
  status: TestStatus;
  statusCode?: number;
  latencyMs?: number;
  requestPayload?: string;
  responseBody?: string;
  errorMessage?: string;
  timestamp?: string;
}

type ActiveTab = 'patient' | 'order' | 'cds';

// ─── Mock Cerner sandbox responses ────────────────────────────────────────────

const MOCK_PATIENT_RESPONSE = {
  resourceType: 'Patient',
  id: 'patient-001',
  meta: { versionId: '1', lastUpdated: '2026-04-16T10:00:00Z', profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'] },
  identifier: [{ use: 'usual', type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }] }, system: 'urn:oid:1.2.840.114350.1.13.0.1.7.5.737384.0', value: 'MRN-00123456' }],
  name: [{ use: 'official', family: 'Hernandez', given: ['Maria', 'Elena'] }],
  gender: 'female',
  birthDate: '1958-03-22',
  address: [{ use: 'home', line: ['4521 Maple Grove Blvd'], city: 'Kansas City', state: 'MO', postalCode: '64108' }],
  telecom: [{ system: 'phone', value: '(816) 555-0192', use: 'home' }],
};

const MOCK_ORDER_RESPONSE = {
  resourceType: 'ServiceRequest',
  id: 'sr-20260416-001',
  meta: { versionId: '1', lastUpdated: '2026-04-16T22:19:45Z' },
  status: 'active',
  intent: 'order',
  category: [{ coding: [{ system: 'http://snomed.info/sct', code: '306206005', display: 'Referral to service' }] }],
  code: { coding: [{ system: 'http://snomed.info/sct', code: '103696004', display: 'Patient referral to cardiologist' }], text: 'Cardiology Referral' },
  subject: { reference: 'Patient/patient-001', display: 'Maria Elena Hernandez' },
  encounter: { reference: 'Encounter/enc-20260416-001' },
  requester: { reference: 'Practitioner/pract-002', display: 'Dr. James Whitfield' },
  authoredOn: '2026-04-16T22:19:45Z',
  priority: 'routine',
  note: [{ text: 'Cardiology consult for uncontrolled hypertension and new onset chest pain.' }],
};

const MOCK_CDS_RESPONSE = {
  cards: [
    {
      summary: 'HCC Suspect: Type 2 Diabetes with CKD Stage 3 — not coded this year',
      indicator: 'info',
      source: { label: 'TCOC CDS Engine', url: `${SITE_URL}/api/cds-hooks/patient-view` },
      detail: 'RAF delta if captured: +0.42 (~$3,200 revenue). Submission deadline: Dec 31, 2026.',
      suggestions: [{ label: 'Add HCC coding to encounter', uuid: 'sug-001a', actions: [{ type: 'create', description: 'Create ServiceRequest for HCC documentation — E11.65 + N18.3' }] }],
    },
    {
      summary: '6 open HEDIS care gaps — 2 overdue by >90 days',
      indicator: 'info',
      source: { label: 'TCOC Care Gap Engine', url: `${SITE_URL}/api/cds-hooks/patient-view` },
      detail: 'Overdue: Diabetic Eye Exam (due 2026-01-15), Nephropathy Monitoring (due 2026-02-01).',
      links: [{ label: 'View Care Gap Detail', url: '/patient-detail', type: 'absolute' }],
    },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function simulateRequest(delayMs: number, mockResponse: object, statusCode = 200): Promise<{ statusCode: number; body: string; latencyMs: number }> {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve({ statusCode, body: JSON.stringify(mockResponse, null, 2), latencyMs: delayMs });
    }, delayMs)
  );
}

function StatusPill({ status }: { status: TestStatus }) {
  if (status === 'idle') return <span className="text-xs text-carbon-gray-50">—</span>;
  if (status === 'running') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0043ce]">
      <span className="w-2 h-2 rounded-full bg-[#0043ce] animate-pulse" />Running
    </span>
  );
  if (status === 'success') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#198038]">
      <Icon name="CheckCircleIcon" size={14} className="text-[#198038]" />Pass
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#da1e28]">
      <Icon name="XCircleIcon" size={14} className="text-[#da1e28]" />Fail
    </span>
  );
}

function LatencyBadge({ ms }: { ms?: number }) {
  if (!ms) return null;
  const color = ms < 300 ? 'text-[#198038] bg-[#defbe6]' : ms < 800 ? 'text-[#b45309] bg-[#fef3c7]' : 'text-[#da1e28] bg-[#fff1f1]';
  return <span className={`text-2xs font-semibold px-1.5 py-0.5 ${color}`}>{ms}ms</span>;
}

function ResponsePanel({ result }: { result: TestResult }) {
  const [showReq, setShowReq] = useState(false);
  if (result.status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-carbon-gray-50 border border-dashed border-carbon-gray-20 bg-carbon-gray-10">
        <Icon name="BeakerIcon" size={28} className="mb-2 opacity-40" />
        <p className="text-xs">Run a test to see the response</p>
      </div>
    );
  }
  if (result.status === 'running') {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-carbon-gray-50 border border-carbon-gray-20 bg-carbon-gray-10">
        <div className="w-6 h-6 border-2 border-[#0043ce] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs">Sending request to Cerner sandbox…</p>
      </div>
    );
  }
  return (
    <div className="border border-carbon-gray-20 bg-white">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-carbon-gray-20 bg-carbon-gray-10">
        <StatusPill status={result.status} />
        {result.statusCode && (
          <span className={`text-xs font-mono font-semibold px-2 py-0.5 ${result.status === 'success' ? 'bg-[#defbe6] text-[#198038]' : 'bg-[#fff1f1] text-[#da1e28]'}`}>
            HTTP {result.statusCode}
          </span>
        )}
        <LatencyBadge ms={result.latencyMs} />
        {result.timestamp && <span className="ml-auto text-2xs text-carbon-gray-50">{result.timestamp}</span>}
        {result.requestPayload && (
          <button onClick={() => setShowReq(!showReq)} className="text-2xs text-carbon-blue hover:underline ml-2">
            {showReq ? 'Hide request' : 'Show request'}
          </button>
        )}
      </div>
      {showReq && result.requestPayload && (
        <div className="px-4 py-3 border-b border-carbon-gray-20 bg-[#f6f2ff]">
          <p className="text-2xs font-semibold text-carbon-gray-50 mb-1.5 uppercase tracking-widest">Request Payload</p>
          <pre className="text-xs font-mono text-carbon-gray-100 overflow-x-auto whitespace-pre-wrap">{result.requestPayload}</pre>
        </div>
      )}
      <div className="px-4 py-3">
        <p className="text-2xs font-semibold text-carbon-gray-50 mb-1.5 uppercase tracking-widest">
          {result.status === 'error' ? 'Error' : 'Response Body'}
        </p>
        <pre className="text-xs font-mono text-carbon-gray-100 overflow-x-auto whitespace-pre-wrap max-h-72">
          {result.status === 'error' ? result.errorMessage : result.responseBody}
        </pre>
      </div>
    </div>
  );
}

// ─── Patient Lookup Tab ────────────────────────────────────────────────────────

function PatientLookupTab() {
  const [patientId, setPatientId] = useState('patient-001');
  const [includeConditions, setIncludeConditions] = useState(true);
  const [includeMeds, setIncludeMeds] = useState(false);
  const [includeObs, setIncludeObs] = useState(false);
  const [result, setResult] = useState<TestResult>({ status: 'idle' });

  const run = useCallback(async () => {
    if (!patientId.trim()) return;
    setResult({ status: 'running' });
    const params = new URLSearchParams();
    if (includeConditions) params.set('_revinclude', 'Condition:patient');
    if (includeMeds) params.set('_revinclude:iterate', 'MedicationRequest:patient');
    if (includeObs) params.set('_revinclude:iterate', 'Observation:patient');
    const url = `${CERNER_FHIR_BASE}/Patient/${patientId.trim()}?${params.toString()}`;
    const delay = 280 + Math.floor(Math.random() * 180);
    const res = await simulateRequest(delay, MOCK_PATIENT_RESPONSE, 200);
    setResult({
      status: 'success',
      statusCode: res.statusCode,
      latencyMs: res.latencyMs,
      requestPayload: `GET ${url}\nAccept: application/fhir+json\nAuthorization: Bearer mock-access-token-xyz`,
      responseBody: res.body,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [patientId, includeConditions, includeMeds, includeObs]);

  const tests = [
    { label: 'Patient Read', endpoint: `/Patient/${patientId || '{id}'}`, method: 'GET', description: 'Fetch patient demographics and identifiers' },
    { label: 'Condition Search', endpoint: `/Condition?patient=${patientId || '{id}'}&category=problem-list-item`, method: 'GET', description: 'Active problem list conditions' },
    { label: 'Coverage Read', endpoint: `/Coverage?patient=${patientId || '{id}'}`, method: 'GET', description: 'Insurance / payer coverage details' },
  ];

  return (
    <div className="space-y-5">
      {/* Config */}
      <div className="bg-white border border-carbon-gray-20 p-5">
        <h3 className="text-sm font-semibold text-carbon-gray-100 mb-4 flex items-center gap-2">
          <Icon name="UserIcon" size={16} className="text-carbon-blue" />
          Patient Lookup Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-carbon-gray-70 mb-1.5">Patient ID (FHIR logical ID)</label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. patient-001"
              className="w-full border border-carbon-gray-20 px-3 py-2 text-xs font-mono text-carbon-gray-100 focus:outline-none focus:border-carbon-blue bg-carbon-gray-10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-carbon-gray-70 mb-1.5">FHIR Base URL</label>
            <input
              type="text"
              value={CERNER_FHIR_BASE}
              readOnly
              className="w-full border border-carbon-gray-20 px-3 py-2 text-xs font-mono text-carbon-gray-50 bg-carbon-gray-10 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center gap-2 text-xs text-carbon-gray-70 cursor-pointer">
            <input type="checkbox" checked={includeConditions} onChange={(e) => setIncludeConditions(e.target.checked)} className="accent-carbon-blue" />
            Include Conditions
          </label>
          <label className="flex items-center gap-2 text-xs text-carbon-gray-70 cursor-pointer">
            <input type="checkbox" checked={includeMeds} onChange={(e) => setIncludeMeds(e.target.checked)} className="accent-carbon-blue" />
            Include Medications
          </label>
          <label className="flex items-center gap-2 text-xs text-carbon-gray-70 cursor-pointer">
            <input type="checkbox" checked={includeObs} onChange={(e) => setIncludeObs(e.target.checked)} className="accent-carbon-blue" />
            Include Observations
          </label>
        </div>
        <button
          onClick={run}
          disabled={result.status === 'running'}
          className="flex items-center gap-2 px-4 py-2 bg-carbon-blue text-white text-xs font-semibold hover:bg-[#0043ce] transition-colors disabled:opacity-50"
        >
          <Icon name="PlayIcon" size={14} />
          {result.status === 'running' ? 'Running…' : 'Run Patient Lookup'}
        </button>
      </div>

      {/* Quick test matrix */}
      <div className="bg-white border border-carbon-gray-20 p-5">
        <h3 className="text-xs font-semibold text-carbon-gray-70 uppercase tracking-widest mb-3">Available Endpoints</h3>
        <div className="space-y-0">
          {tests.map((t) => (
            <div key={t.label} className="flex items-center gap-3 py-2.5 border-b border-carbon-gray-10 last:border-0">
              <span className="text-2xs font-semibold bg-[#d0e2ff] text-[#0043ce] px-1.5 py-0.5 w-10 text-center flex-shrink-0">{t.method}</span>
              <code className="text-xs font-mono text-carbon-gray-100 flex-1 truncate">{t.endpoint}</code>
              <span className="text-xs text-carbon-gray-50 hidden md:block">{t.description}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsePanel result={result} />
    </div>
  );
}

// ─── Order Submission Tab ──────────────────────────────────────────────────────

const ORDER_TEMPLATES = [
  { id: 'cardiology', label: 'Cardiology Referral', code: '103696004', display: 'Patient referral to cardiologist', system: 'http://snomed.info/sct', priority: 'routine' },
  { id: 'nephrology', label: 'Nephrology Referral', code: '306281000', display: 'Patient referral to nephrologist', system: 'http://snomed.info/sct', priority: 'routine' },
  { id: 'hcc-doc', label: 'HCC Documentation Order', code: 'E11.65', display: 'T2DM with CKD Stage 3 documentation', system: 'http://hl7.org/fhir/sid/icd-10-cm', priority: 'urgent' },
  { id: 'wellness', label: 'Annual Wellness Visit', code: 'G0439', display: 'Annual wellness visit, includes a personalized prevention plan', system: 'https://www.cms.gov/Medicare/Coding/MedHCPCSGenInfo', priority: 'routine' },
];

function OrderSubmissionTab() {
  const [selectedTemplate, setSelectedTemplate] = useState(ORDER_TEMPLATES[0].id);
  const [patientId, setPatientId] = useState('patient-001');
  const [encounterId, setEncounterId] = useState('enc-20260416-001');
  const [note, setNote] = useState('Cardiology consult for uncontrolled hypertension and new onset chest pain.');
  const [result, setResult] = useState<TestResult>({ status: 'idle' });

  const template = ORDER_TEMPLATES.find((t) => t.id === selectedTemplate) || ORDER_TEMPLATES[0];

  const buildPayload = () => ({
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    category: [{ coding: [{ system: 'http://snomed.info/sct', code: '306206005', display: 'Referral to service' }] }],
    code: { coding: [{ system: template.system, code: template.code, display: template.display }], text: template.label },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    requester: { reference: 'Practitioner/pract-002', display: 'Dr. James Whitfield' },
    authoredOn: new Date().toISOString(),
    priority: template.priority,
    note: note ? [{ text: note }] : undefined,
  });

  const run = useCallback(async () => {
    setResult({ status: 'running' });
    const payload = buildPayload();
    const delay = 320 + Math.floor(Math.random() * 200);
    const res = await simulateRequest(delay, MOCK_ORDER_RESPONSE, 201);
    setResult({
      status: 'success',
      statusCode: res.statusCode,
      latencyMs: res.latencyMs,
      requestPayload: `POST ${CERNER_FHIR_BASE}/ServiceRequest\nContent-Type: application/fhir+json\nAuthorization: Bearer mock-access-token-xyz\n\n${JSON.stringify(payload, null, 2)}`,
      responseBody: res.body,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [selectedTemplate, patientId, encounterId, note]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-carbon-gray-20 p-5">
        <h3 className="text-sm font-semibold text-carbon-gray-100 mb-4 flex items-center gap-2">
          <Icon name="ClipboardDocumentListIcon" size={16} className="text-carbon-blue" />
          ServiceRequest Submission
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-carbon-gray-70 mb-1.5">Order Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full border border-carbon-gray-20 px-3 py-2 text-xs text-carbon-gray-100 focus:outline-none focus:border-carbon-blue bg-carbon-gray-10"
            >
              {ORDER_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-carbon-gray-70 mb-1.5">Patient ID</label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full border border-carbon-gray-20 px-3 py-2 text-xs font-mono text-carbon-gray-100 focus:outline-none focus:border-carbon-blue bg-carbon-gray-10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-carbon-gray-70 mb-1.5">Encounter ID</label>
            <input
              type="text"
              value={encounterId}
              onChange={(e) => setEncounterId(e.target.value)}
              className="w-full border border-carbon-gray-20 px-3 py-2 text-xs font-mono text-carbon-gray-100 focus:outline-none focus:border-carbon-blue bg-carbon-gray-10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-carbon-gray-70 mb-1.5">Priority</label>
            <input
              type="text"
              value={template.priority}
              readOnly
              className="w-full border border-carbon-gray-20 px-3 py-2 text-xs font-mono text-carbon-gray-50 bg-carbon-gray-10 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-carbon-gray-70 mb-1.5">Clinical Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full border border-carbon-gray-20 px-3 py-2 text-xs text-carbon-gray-100 focus:outline-none focus:border-carbon-blue bg-carbon-gray-10 resize-none"
          />
        </div>
        {/* Payload preview */}
        <div className="mb-4 p-3 bg-carbon-gray-10 border-l-2 border-carbon-blue">
          <p className="text-2xs font-semibold text-carbon-gray-50 uppercase tracking-widest mb-1.5">Payload Preview</p>
          <pre className="text-xs font-mono text-carbon-gray-70 overflow-x-auto whitespace-pre-wrap max-h-36">
            {JSON.stringify(buildPayload(), null, 2)}
          </pre>
        </div>
        <button
          onClick={run}
          disabled={result.status === 'running'}
          className="flex items-center gap-2 px-4 py-2 bg-carbon-blue text-white text-xs font-semibold hover:bg-[#0043ce] transition-colors disabled:opacity-50"
        >
          <Icon name="PaperAirplaneIcon" size={14} />
          {result.status === 'running' ? 'Submitting…' : 'Submit Order to Sandbox'}
        </button>
      </div>

      <ResponsePanel result={result} />
    </div>
  );
}

// ─── CDS Hooks Tab ─────────────────────────────────────────────────────────────

const CDS_HOOK_CONFIGS = [
  {
    id: 'patient-view',
    hookType: 'patient-view',
    label: 'Patient View',
    serviceUrl: `${SITE_URL}/api/cds-hooks/patient-view`,
    description: 'Fires when provider opens patient chart. Returns risk tier, care gaps, HCC suspects.',
    contextFields: { patientId: 'patient-001', userId: 'Practitioner/pract-002' },
  },
  {
    id: 'encounter-start',
    hookType: 'encounter-start',
    label: 'Encounter Start',
    serviceUrl: `${SITE_URL}/api/cds-hooks/encounter-start`,
    description: 'Fires at encounter creation. Surfaces HEDIS/STARS/MIPS gaps and recommended orders.',
    contextFields: { patientId: 'patient-001', encounterId: 'enc-20260416-001', userId: 'Practitioner/pract-002' },
  },
  {
    id: 'order-sign',
    hookType: 'order-sign',
    label: 'Order Sign',
    serviceUrl: `${SITE_URL}/api/cds-hooks/order-sign`,
    description: 'Fires before order signing. Validates clinical indication, confirms network tier.',
    contextFields: { patientId: 'patient-001', encounterId: 'enc-20260416-001', userId: 'Practitioner/pract-002', draftOrders: { resourceType: 'Bundle', entry: [] } },
  },
];

function CdsHooksTab() {
  const [selectedHook, setSelectedHook] = useState(CDS_HOOK_CONFIGS[0].id);
  const [patientId, setPatientId] = useState('patient-001');
  const [encounterId, setEncounterId] = useState('enc-20260416-001');
  const [result, setResult] = useState<TestResult>({ status: 'idle' });

  const hook = CDS_HOOK_CONFIGS.find((h) => h.id === selectedHook) || CDS_HOOK_CONFIGS[0];

  const buildRequest = () => ({
    hookInstance: `test-${Date.now()}`,
    hook: hook.hookType,
    fhirServer: CERNER_FHIR_BASE,
    fhirAuthorization: { access_token: 'mock-access-token-xyz', token_type: 'Bearer', expires_in: 3600, scope: 'patient/*.read patient/ServiceRequest.write launch/patient openid fhirUser', subject: 'pract-002' },
    context: { patientId, encounterId, userId: 'Practitioner/pract-002' },
    prefetch: {
      patient: { resourceType: 'Patient', id: patientId },
    },
  });

  const run = useCallback(async () => {
    setResult({ status: 'running' });
    const payload = buildRequest();
    const delay = 350 + Math.floor(Math.random() * 250);
    const res = await simulateRequest(delay, MOCK_CDS_RESPONSE, 200);
    setResult({
      status: 'success',
      statusCode: res.statusCode,
      latencyMs: res.latencyMs,
      requestPayload: `POST ${hook.serviceUrl}\nContent-Type: application/json\n\n${JSON.stringify(payload, null, 2)}`,
      responseBody: res.body,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [selectedHook, patientId, encounterId]);

  return (
    <div className="space-y-5">
      {/* Hook selector */}
      <div className="bg-white border border-carbon-gray-20 p-5">
        <h3 className="text-sm font-semibold text-carbon-gray-100 mb-4 flex items-center gap-2">
          <Icon name="CpuChipIcon" size={16} className="text-carbon-blue" />
          CDS Hook Call Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {CDS_HOOK_CONFIGS.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHook(h.id)}
              className={`text-left p-3 border transition-colors ${selectedHook === h.id ? 'border-carbon-blue bg-[#d0e2ff]/20' : 'border-carbon-gray-20 hover:border-carbon-gray-50 bg-carbon-gray-10'}`}
            >
              <p className={`text-xs font-semibold mb-0.5 ${selectedHook === h.id ? 'text-carbon-blue' : 'text-carbon-gray-100'}`}>{h.label}</p>
              <p className="text-2xs text-carbon-gray-50 leading-relaxed">{h.description}</p>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-carbon-gray-70 mb-1.5">Patient ID</label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full border border-carbon-gray-20 px-3 py-2 text-xs font-mono text-carbon-gray-100 focus:outline-none focus:border-carbon-blue bg-carbon-gray-10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-carbon-gray-70 mb-1.5">Encounter ID</label>
            <input
              type="text"
              value={encounterId}
              onChange={(e) => setEncounterId(e.target.value)}
              className="w-full border border-carbon-gray-20 px-3 py-2 text-xs font-mono text-carbon-gray-100 focus:outline-none focus:border-carbon-blue bg-carbon-gray-10"
            />
          </div>
        </div>
        {/* Service URL */}
        <div className="mb-4 flex items-center gap-2 p-3 bg-carbon-gray-10 border border-carbon-gray-20">
          <Icon name="LinkIcon" size={14} className="text-carbon-gray-50 flex-shrink-0" />
          <code className="text-xs font-mono text-carbon-gray-70 break-all">{hook.serviceUrl}</code>
        </div>
        {/* Request preview */}
        <div className="mb-4 p-3 bg-carbon-gray-10 border-l-2 border-[#6929c4]">
          <p className="text-2xs font-semibold text-carbon-gray-50 uppercase tracking-widest mb-1.5">CDS Hooks Request Preview</p>
          <pre className="text-xs font-mono text-carbon-gray-70 overflow-x-auto whitespace-pre-wrap max-h-36">
            {JSON.stringify(buildRequest(), null, 2)}
          </pre>
        </div>
        <button
          onClick={run}
          disabled={result.status === 'running'}
          className="flex items-center gap-2 px-4 py-2 bg-[#6929c4] text-white text-xs font-semibold hover:bg-[#491d8b] transition-colors disabled:opacity-50"
        >
          <Icon name="BoltIcon" size={14} />
          {result.status === 'running' ? 'Calling Hook…' : 'Fire CDS Hook'}
        </button>
      </div>

      {/* Cards preview if success */}
      {result.status === 'success' && result.responseBody && (
        <div className="bg-white border border-carbon-gray-20 p-5">
          <h3 className="text-xs font-semibold text-carbon-gray-70 uppercase tracking-widest mb-3">Returned CDS Cards</h3>
          <div className="space-y-3">
            {MOCK_CDS_RESPONSE.cards.map((card, i) => (
              <div key={i} className={`p-3 border-l-4 ${card.indicator === 'info' ? 'border-[#0043ce] bg-[#edf5ff]' : 'border-[#f1c21b] bg-[#fef3c7]'}`}>
                <p className="text-xs font-semibold text-carbon-gray-100 mb-1">{card.summary}</p>
                <p className="text-xs text-carbon-gray-70">{card.detail}</p>
                <p className="text-2xs text-carbon-gray-50 mt-1">Source: {card.source.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ResponsePanel result={result} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FhirTesterPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('patient');

  const tabs: { key: ActiveTab; label: string; icon: string; badge?: string }[] = [
    { key: 'patient', label: 'Patient Lookup', icon: 'UserIcon' },
    { key: 'order', label: 'Order Submission', icon: 'ClipboardDocumentListIcon' },
    { key: 'cds', label: 'CDS Hook Calls', icon: 'CpuChipIcon' },
  ];

  return (
    <AppLayout
      pageTitle="FHIR API Tester"
      breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'FHIR API Tester' }]}
    >
      <div className="flex-1 overflow-y-auto bg-carbon-gray-10 p-6">
        {/* Header */}
        <div className="bg-[#0f3460] text-white px-5 py-4 mb-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="BeakerIcon" size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold">Live FHIR API Tester — Cerner Sandbox</h2>
            <p className="text-xs text-white/70 mt-0.5">
              Validate patient lookup, ServiceRequest order submission, and CDS Hooks calls against the configured Cerner R4 sandbox. All requests are simulated against mock data.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <span className="text-2xs font-semibold bg-white/15 px-2 py-1">FHIR R4 · CDS Hooks 2.0</span>
            <span className="text-2xs text-white/50">Sandbox Mode</span>
          </div>
        </div>

        {/* Sandbox config strip */}
        <div className="bg-white border border-carbon-gray-20 px-5 py-3 mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <Icon name="ServerIcon" size={14} className="text-carbon-gray-50" />
            <span className="text-2xs text-carbon-gray-50">FHIR Base:</span>
            <code className="text-2xs font-mono text-carbon-gray-70">{CERNER_FHIR_BASE}</code>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="KeyIcon" size={14} className="text-carbon-gray-50" />
            <span className="text-2xs text-carbon-gray-50">Token:</span>
            <code className="text-2xs font-mono text-[#198038]">mock-access-token-xyz</code>
            <span className="text-2xs font-semibold bg-[#defbe6] text-[#198038] px-1.5 py-0.5">Active</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="w-2 h-2 rounded-full bg-[#198038] animate-pulse" />
            <span className="text-2xs text-[#198038] font-medium">Sandbox Connected</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-carbon-gray-20 mb-5 bg-white">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-carbon-blue text-carbon-blue bg-[#d0e2ff]/20'
                  : 'border-transparent text-carbon-gray-50 hover:text-carbon-gray-100 hover:bg-carbon-gray-10'
              }`}
            >
              <Icon name={t.icon as any} size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'patient' && <PatientLookupTab />}
        {activeTab === 'order' && <OrderSubmissionTab />}
        {activeTab === 'cds' && <CdsHooksTab />}
      </div>
    </AppLayout>
  );
}
