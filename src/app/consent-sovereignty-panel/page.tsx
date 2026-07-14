'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import { getFhirMockMode, getFhirClient } from '@/lib/services/fhirClient';

// ─── Static mock/fallback data ────────────────────────────────────────────────

const CONSENT_RECORDS_MOCK = [
  { id: 'cns-001', patient: 'Maria Redhawk', patientId: 'PAT-0006', mrn: 'MRN-0006', type: 'Data Sharing', scope: 'Clinical + Claims + SDOH', grantedTo: 'Bennett County Health Network', status: 'ACTIVE', grantedDate: '2024-03-12', expiresDate: '2025-03-12', method: 'Electronic', fhirConsent: 'Consent/cns-001' },
  { id: 'cns-002', patient: 'Maria Redhawk', patientId: 'PAT-0006', mrn: 'MRN-0006', type: 'Research', scope: 'De-identified Clinical', grantedTo: 'RHTP Research Registry', status: 'ACTIVE', grantedDate: '2024-03-12', expiresDate: '2026-03-12', method: 'Electronic', fhirConsent: 'Consent/cns-002' },
  { id: 'cns-003', patient: 'Maria Redhawk', patientId: 'PAT-0006', mrn: 'MRN-0006', type: 'BH Data', scope: 'Behavioral Health Records', grantedTo: 'CCBHC — Clay County', status: 'REVOKED', grantedDate: '2023-11-01', expiresDate: '2024-11-01', method: 'Paper', fhirConsent: 'Consent/cns-003' },
  { id: 'cns-004', patient: 'Dorothy Simmons', patientId: 'PAT-0042', mrn: 'MRN-0042', type: 'Data Sharing', scope: 'Clinical + Claims', grantedTo: 'Jackson County Memorial', status: 'ACTIVE', grantedDate: '2024-01-08', expiresDate: '2025-01-08', method: 'Electronic', fhirConsent: 'Consent/cns-004' },
  { id: 'cns-005', patient: 'James Whitfield', patientId: 'PAT-0019', mrn: 'MRN-0019', type: 'Data Sharing', scope: 'Clinical Only', grantedTo: 'Bennett County Health Network', status: 'EXPIRED', grantedDate: '2023-06-15', expiresDate: '2024-06-15', method: 'Electronic', fhirConsent: 'Consent/cns-005' },
  { id: 'cns-006', patient: 'Rosa Gutierrez', patientId: 'PAT-0031', mrn: 'MRN-0031', type: 'SDOH Sharing', scope: 'Social Needs Data', grantedTo: 'Unite Us Network', status: 'ACTIVE', grantedDate: '2024-05-20', expiresDate: '2025-05-20', method: 'Electronic', fhirConsent: 'Consent/cns-006' },
  { id: 'cns-007', patient: 'Thomas Begay', patientId: 'PAT-0055', mrn: 'MRN-0055', type: 'Data Sharing', scope: 'Clinical + Claims + SDOH', grantedTo: 'Bennett County Health Network', status: 'PENDING', grantedDate: '—', expiresDate: '—', method: 'Pending Signature', fhirConsent: '—' },
];

const DATA_SOVEREIGNTY_RULES = [
  { rule: 'BH 42 CFR Part 2', description: 'Substance use records require explicit consent before any disclosure', status: 'ENFORCED', scope: 'All BH data', lastAudit: '2024-12-01' },
  { rule: 'HIPAA Minimum Necessary', description: 'Only minimum necessary data shared per request purpose', status: 'ENFORCED', scope: 'All data types', lastAudit: '2024-12-01' },
  { rule: 'Tribal Data Sovereignty', description: 'Native American patient data governed by tribal agreements', status: 'ENFORCED', scope: 'Tribal members', lastAudit: '2024-11-15' },
  { rule: 'CCPA — California Residents', description: 'Right to know, delete, and opt-out for CA residents', status: 'ENFORCED', scope: 'CA residents', lastAudit: '2024-11-30' },
  { rule: 'Cross-Org Sharing Block', description: 'No data shared outside RHTP network without explicit consent', status: 'ENFORCED', scope: 'All patients', lastAudit: '2024-12-01' },
  { rule: 'Pediatric Data Protection', description: 'Patients under 18 require guardian consent for all sharing', status: 'ENFORCED', scope: 'Minors', lastAudit: '2024-11-20' },
];

// ─── FHIR → display shape mapper ─────────────────────────────────────────────

type ConsentRecord = {
  id: string; patient: string; patientId: string; mrn: string;
  type: string; scope: string; grantedTo: string; status: string;
  grantedDate: string; expiresDate: string; method: string; fhirConsent: string;
};

function mapFhirConsent(resource: any): ConsentRecord {
  // FHIR status → display status
  const statusMap: Record<string, string> = {
    active: 'ACTIVE',
    inactive: 'EXPIRED',
    rejected: 'REVOKED',
    'entered-in-error': 'REVOKED',
    proposed: 'PENDING',
    draft: 'PENDING',
  };

  const ext = (url: string) =>
    resource.extension?.find((e: any) => e.url === url)?.valueString ?? '';

  const patientDisplay: string = resource.patient?.display ?? resource.patient?.reference ?? '';
  const patientRef: string = resource.patient?.reference ?? '';
  // derive a PAT-XXXX from the FHIR id if no display ID is available
  const fhirPatientId = patientRef.replace('Patient/', '');
  const patientIdDisplay =
    fhirPatientId === 'patient-maria-001' ? 'PAT-0006' :
    fhirPatientId === 'patient-dorothy-042' ? 'PAT-0042' :
    fhirPatientId;

  const period = resource.provision?.period ?? {};
  const grantedTo = resource.organization?.[0]?.display ?? '—';

  return {
    id: resource.id ?? '',
    patient: patientDisplay,
    patientId: patientIdDisplay,
    mrn: patientIdDisplay.replace('PAT', 'MRN'),
    type: ext('http://tcoc.example.org/fhir/StructureDefinition/consent-type') || resource.scope?.coding?.[0]?.display || 'Consent',
    scope: ext('http://tcoc.example.org/fhir/StructureDefinition/consent-scope-text') || '—',
    grantedTo,
    status: statusMap[resource.status] ?? resource.status?.toUpperCase() ?? 'UNKNOWN',
    grantedDate: resource.dateTime?.split('T')[0] ?? '—',
    expiresDate: period.end ?? '—',
    method: ext('http://tcoc.example.org/fhir/StructureDefinition/consent-method') || 'Electronic',
    fhirConsent: `Consent/${resource.id}`,
  };
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: '#defbe6', text: '#0e6027', dot: '#198038' },
  REVOKED: { bg: '#fff1f1', text: '#da1e28', dot: '#da1e28' },
  EXPIRED: { bg: '#f4f4f4', text: '#4d5358', dot: '#8d8d8d' },
  PENDING: { bg: '#fdf6dd', text: '#b45309', dot: '#f1c21b' },
  ENFORCED: { bg: '#defbe6', text: '#0e6027', dot: '#198038' },
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function ConsentSovereigntyPanelPage() {
  const [activeTab, setActiveTab] = useState<'consents' | 'sovereignty' | 'audit'>('consents');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>(CONSENT_RECORDS_MOCK);
  const [fhirSource, setFhirSource] = useState(false);
  const fhirLoadedRef = useRef(false);

  // Live FHIR: fetch all Consent resources on mount
  useEffect(() => {
    if (getFhirMockMode() || fhirLoadedRef.current) return;
    fhirLoadedRef.current = true;
    getFhirClient()
      .search('Consent', { _count: 50 })
      .then((bundle: any) => {
        const entries: any[] = bundle?.entry ?? [];
        const resources = entries
          .map((e: any) => e?.resource)
          .filter((r: any) => r?.resourceType === 'Consent');
        if (resources.length > 0) {
          setConsentRecords(resources.map(mapFhirConsent));
          setFhirSource(true);
        }
      })
      .catch(() => { /* non-fatal — keep mock data */ });
  }, []);

  const statuses = ['All', 'ACTIVE', 'REVOKED', 'EXPIRED', 'PENDING'];
  const filtered = consentRecords.filter((r) => {
    const matchSearch = r.patient.toLowerCase().includes(search.toLowerCase()) || r.patientId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = consentRecords.filter((r) => r.status === 'ACTIVE').length;
  const revokedCount = consentRecords.filter((r) => r.status === 'REVOKED').length;
  const expiredCount = consentRecords.filter((r) => r.status === 'EXPIRED').length;
  const pendingCount = consentRecords.filter((r) => r.status === 'PENDING').length;

  return (
    <AppLayout
      pageTitle="Consent & Sovereignty Panel"
      breadcrumbs={[{ label: 'CDP & Agentic Automation' }, { label: 'Consent & Sovereignty Panel' }]}
    >
      {/* KPI Strip */}
      {fhirSource && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-xs font-semibold px-1.5 py-0.5 bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba]">FHIR R4</span>
          <span className="text-xs text-[#0e6027]">{consentRecords.length} consent records loaded from HAPI FHIR</span>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Consents', value: activeCount.toString(), icon: 'ShieldCheckIcon', color: 'text-[#198038]', bg: 'bg-[#defbe6]' },
          { label: 'Revoked', value: revokedCount.toString(), icon: 'XCircleIcon', color: 'text-[#da1e28]', bg: 'bg-[#fff1f1]' },
          { label: 'Expired', value: expiredCount.toString(), icon: 'ClockIcon', color: 'text-[#4d5358]', bg: 'bg-[#f4f4f4]' },
          { label: 'Pending Signature', value: pendingCount.toString(), icon: 'PencilSquareIcon', color: 'text-[#b45309]', bg: 'bg-[#fdf6dd]' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-carbon-gray-20 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon name={kpi.icon as any} size={20} className={kpi.color} />
            </div>
            <div>
              <p className="text-xs text-carbon-gray-50">{kpi.label}</p>
              <p className="text-xl font-bold text-carbon-gray-100">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-carbon-gray-20">
        {(['consents', 'sovereignty', 'audit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === t ? 'border-[#6929c4] text-[#6929c4]' : 'border-transparent text-carbon-gray-50 hover:text-carbon-gray-100'
            }`}
          >
            {t === 'consents' ? 'Consent Registry' : t === 'sovereignty' ? 'Data Sovereignty Rules' : 'Audit Log'}
          </button>
        ))}
      </div>

      {activeTab === 'consents' && (
        <div className="bg-white border border-carbon-gray-20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-carbon-gray-20 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-carbon-gray-100">Patient Consent Records</p>
              {fhirSource && (
                <span className="text-xs font-semibold px-1.5 py-0.5 bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba]">FHIR R4</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-carbon-gray-50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-carbon-gray-20 focus:outline-none focus:border-[#6929c4] w-44"
                />
              </div>
              <div className="flex gap-1">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2 py-1 text-2xs font-semibold transition-colors ${
                      statusFilter === s ? 'bg-[#6929c4] text-white' : 'bg-carbon-gray-10 text-carbon-gray-70 hover:bg-carbon-gray-20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-carbon-gray-10 border-b border-carbon-gray-20">
                {['Patient', 'Type', 'Scope', 'Granted To', 'Status', 'Granted', 'Expires', 'FHIR Resource'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-carbon-gray-70 uppercase tracking-wide text-2xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec, i) => {
                const sc = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG['EXPIRED'];
                return (
                  <tr key={rec.id} className={`border-b border-carbon-gray-10 hover:bg-carbon-gray-10 transition-colors ${i % 2 === 0 ? '' : 'bg-carbon-gray-10/30'}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-carbon-gray-100">{rec.patient}</p>
                      <p className="text-2xs text-carbon-gray-50">{rec.patientId}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-carbon-gray-70">{rec.type}</td>
                    <td className="px-4 py-3 text-carbon-gray-50">{rec.scope}</td>
                    <td className="px-4 py-3 text-carbon-gray-70">{rec.grantedTo}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                        <span className="px-1.5 py-0.5 text-2xs font-semibold" style={{ background: sc.bg, color: sc.text }}>{rec.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-carbon-gray-50">{rec.grantedDate}</td>
                    <td className="px-4 py-3 text-carbon-gray-50">{rec.expiresDate}</td>
                    <td className="px-4 py-3 font-mono text-carbon-gray-50 text-2xs">{rec.fhirConsent}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sovereignty' && (
        <div className="bg-white border border-carbon-gray-20">
          <div className="px-4 py-3 border-b border-carbon-gray-20">
            <p className="text-sm font-semibold text-carbon-gray-100">Data Sovereignty & Governance Rules</p>
            <p className="text-xs text-carbon-gray-50 mt-0.5">All rules enforced by the Consent Enforcer agent — violations blocked in real time</p>
          </div>
          <div className="divide-y divide-carbon-gray-10">
            {DATA_SOVEREIGNTY_RULES.map((rule) => {
              const sc = STATUS_CONFIG[rule.status];
              return (
                <div key={rule.rule} className="px-4 py-4 flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#defbe6] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="ShieldCheckIcon" size={16} className="text-[#198038]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-carbon-gray-100">{rule.rule}</span>
                      <span className="px-1.5 py-0.5 text-2xs font-semibold" style={{ background: sc.bg, color: sc.text }}>{rule.status}</span>
                    </div>
                    <p className="text-xs text-carbon-gray-50 mt-0.5">{rule.description}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-2xs text-carbon-gray-50">
                      <span>Scope: <span className="font-medium text-carbon-gray-70">{rule.scope}</span></span>
                      <span>Last Audit: <span className="font-medium text-carbon-gray-70">{rule.lastAudit}</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white border border-carbon-gray-20">
          <div className="px-4 py-3 border-b border-carbon-gray-20">
            <p className="text-sm font-semibold text-carbon-gray-100">Consent Audit Log</p>
          </div>
          <div className="divide-y divide-carbon-gray-10">
            {[
              { time: '2024-12-01 14:32', event: 'Consent GRANTED', patient: 'Maria Redhawk', detail: 'Data Sharing — Bennett County Health Network', actor: 'Patient Portal', icon: 'CheckCircleIcon', color: '#198038' },
              { time: '2024-12-01 11:07', event: 'Share BLOCKED', patient: 'Thomas Begay', detail: 'Cross-org share blocked — no active consent on file', actor: 'Consent Enforcer Agent', icon: 'XCircleIcon', color: '#da1e28' },
              { time: '2024-11-28 09:15', event: 'Consent REVOKED', patient: 'Maria Redhawk', detail: 'BH Data — CCBHC Clay County revoked by patient', actor: 'Care Manager Portal', icon: 'MinusCircleIcon', color: '#da1e28' },
              { time: '2024-11-20 16:44', event: 'Consent EXPIRED', patient: 'James Whitfield', detail: 'Data Sharing — Bennett County Health Network expired', actor: 'System', icon: 'ClockIcon', color: '#8d8d8d' },
              { time: '2024-11-15 10:22', event: 'Tribal Rule ENFORCED', patient: 'Maria Redhawk', detail: 'Tribal data sovereignty rule applied — share restricted', actor: 'Consent Enforcer Agent', icon: 'ShieldCheckIcon', color: '#6929c4' },
              { time: '2024-11-10 08:55', event: 'Consent GRANTED', patient: 'Rosa Gutierrez', detail: 'SDOH Sharing — Unite Us Network', actor: 'Patient Portal', icon: 'CheckCircleIcon', color: '#198038' },
            ].map((entry, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <Icon name={entry.icon as any} size={16} style={{ color: entry.color }} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-carbon-gray-100">{entry.event}</span>
                    <span className="text-xs text-carbon-gray-70">— {entry.patient}</span>
                  </div>
                  <p className="text-xs text-carbon-gray-50 mt-0.5">{entry.detail}</p>
                  <p className="text-2xs text-carbon-gray-30 mt-0.5">{entry.time} · {entry.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
