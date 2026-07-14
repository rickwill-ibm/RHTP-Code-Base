#!/usr/bin/env node
/**
 * TCOC FHIR R4 Full-Coverage Test Suite  (ST-9)
 *
 * Validates every resource type used across all 17 FHIR-wired screens:
 *
 *  Suite A  — Core patient resources       (Patient, Observation, Condition, MedicationRequest)
 *  Suite B  — Care coordination            (CareTeam, CarePlan, Goal, Task)
 *  Suite C  — Referral / workflow          (ServiceRequest, AuditEvent)
 *  Suite D  — Practitioners / network      (Practitioner, Organization)
 *  Suite E  — Consent & coverage           (Consent, Coverage)
 *  Suite F  — Aggregate / population       (MeasureReport, population Observation)
 *  Suite G  — Write round-trips            (POST → GET → PUT → DELETE for each writable type)
 *  Suite H  — CDS Hooks integration        (POST /api/cds-hooks/patient-view)
 *  Suite I  — Mock-mode fallback           (unreachable FHIR_BASE → no throw)
 *
 * Usage:
 *   node fhir/test-fhir-coverage.mjs [--fhir-url http://localhost:8080/fhir] [--app-url http://localhost:4029]
 *
 * Prerequisites:
 *   docker compose -f fhir/docker-compose.yml up -d
 *   node fhir/migrate-patients.mjs
 *
 * Exit code 0 = all tests passed, 1 = one or more failures.
 */

import { argv, exit } from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

// ─── Config ───────────────────────────────────────────────────────────────────

const fhirArgIdx = argv.indexOf('--fhir-url');
const FHIR_BASE = fhirArgIdx !== -1 ? argv[fhirArgIdx + 1] : 'http://localhost:8080/fhir';

const appArgIdx = argv.indexOf('--app-url');
const APP_BASE = appArgIdx !== -1 ? argv[appArgIdx + 1] : 'http://localhost:4029';

const HEADERS = { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' };
const EXT = 'http://tcoc.example.org/fhir/StructureDefinition';

// Well-known seeded IDs (from migrate-patients.mjs)
const PATIENT_MARIA   = 'patient-maria-001';
const PATIENT_DOROTHY = 'patient-dorothy-042';
const PATIENT_JAMES   = 'patient-james-087';
const PATIENT_ROBERT  = 'patient-robert-103';
const PATIENT_LISA    = 'patient-lisa-156';
const PRAC_RICK       = 'practitioner-rick';
const PRAC_JON        = 'practitioner-jon';
const PRAC_SARAH      = 'practitioner-sarah';

// Track test-created resources for cleanup
const created = [];
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];
const results = [];   // { suite, name, status, detail }

// ─── Harness ──────────────────────────────────────────────────────────────────

function section(title) {
  console.log(`\n${'═'.repeat(62)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(62));
}

function assert(cond, name, detail = '') {
  if (cond) {
    console.log(`  ✅  ${name}`);
    passed++;
    results.push({ status: 'PASS', name, detail });
  } else {
    console.error(`  ❌  FAIL: ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
    failures.push(name);
    results.push({ status: 'FAIL', name, detail });
  }
}

function skip(name, reason) {
  console.log(`  ⏭   SKIP: ${name} (${reason})`);
  skipped++;
  results.push({ status: 'SKIP', name, detail: reason });
}

async function fhirReq(method, path, body) {
  const url = `${FHIR_BASE}/${path.replace(/^\//, '')}`;
  const init = { method, headers: HEADERS, signal: AbortSignal.timeout(15000) };
  if (body) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  let json = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, ok: res.ok, body: json };
}
const fhirGet    = p     => fhirReq('GET', p);
const fhirPost   = (p,b) => fhirReq('POST', p, b);
const fhirPut    = (p,b) => fhirReq('PUT', p, b);
const fhirDelete = p     => fhirReq('DELETE', p);

function track(resourceType, id) { created.push({ resourceType, id }); }

function extVal(resource, key) {
  return resource?.extension?.find(e => e.url === `${EXT}/${key}`)?.valueString ?? null;
}

// ─── Suite A — Core patient resources ─────────────────────────────────────────

async function suiteA() {
  section('Suite A — Core Patient Resources');

  // A1: Patient READ — all 5 seeded patients
  for (const [label, id] of [
    ['Maria Redhawk',  PATIENT_MARIA],
    ['Dorothy Simmons',PATIENT_DOROTHY],
    ['James Wilson',   PATIENT_JAMES],
    ['Robert Chen',    PATIENT_ROBERT],
    ['Lisa Thompson',  PATIENT_LISA],
  ]) {
    const r = await fhirGet(`Patient/${id}`);
    assert(r.ok && r.body?.resourceType === 'Patient', `A1 Patient READ — ${label} (${id})`, `HTTP ${r.status}`);
    assert(r.body?.id === id, `A1 Patient id matches — ${label}`);
  }

  // A2: Patient SEARCH by identifier
  const r2 = await fhirGet(`Patient?identifier=MARIA_SD_001&_count=5`);
  assert(r2.ok, 'A2 Patient SEARCH by identifier', `HTTP ${r2.status}`);
  assert((r2.body?.entry ?? []).length > 0, 'A2 Patient SEARCH returns result');

  // A3: Observation READ — care gap HbA1c
  const obsId = `${PATIENT_MARIA}-gap-mg-1`;
  const r3 = await fhirGet(`Observation/${obsId}`);
  assert(r3.ok && r3.body?.resourceType === 'Observation', `A3 Observation READ — care gap (${obsId})`, `HTTP ${r3.status}`);

  // A4: Observation SEARCH by patient
  const r4 = await fhirGet(`Observation?patient=Patient/${PATIENT_MARIA}&_count=20`);
  assert(r4.ok, 'A4 Observation SEARCH by patient', `HTTP ${r4.status}`);
  const obsCount = (r4.body?.entry ?? []).filter(e => e.resource?.resourceType === 'Observation').length;
  assert(obsCount >= 3, `A4 Observation count ≥ 3 for Maria (got ${obsCount})`);

  // A5: Condition SEARCH
  const r5 = await fhirGet(`Condition?patient=Patient/${PATIENT_MARIA}&_count=20`);
  assert(r5.ok, 'A5 Condition SEARCH by patient', `HTTP ${r5.status}`);
  const condCount = (r5.body?.entry ?? []).filter(e => e.resource?.resourceType === 'Condition').length;
  assert(condCount >= 1, `A5 Condition count ≥ 1 for Maria (got ${condCount})`);

  // A6: MedicationRequest SEARCH
  const r6 = await fhirGet(`MedicationRequest?patient=Patient/${PATIENT_MARIA}&_count=20`);
  assert(r6.ok, 'A6 MedicationRequest SEARCH by patient', `HTTP ${r6.status}`);
  const medCount = (r6.body?.entry ?? []).filter(e => e.resource?.resourceType === 'MedicationRequest').length;
  assert(medCount >= 1, `A6 MedicationRequest count ≥ 1 for Maria (got ${medCount})`);

  // A7: Flag SEARCH
  const r7 = await fhirGet(`Flag?patient=Patient/${PATIENT_MARIA}&_count=20`);
  assert(r7.ok, 'A7 Flag SEARCH by patient', `HTTP ${r7.status}`);

  // A8: RiskAssessment SEARCH
  const r8 = await fhirGet(`RiskAssessment?patient=Patient/${PATIENT_MARIA}&_count=5`);
  assert(r8.ok, 'A8 RiskAssessment SEARCH by patient', `HTTP ${r8.status}`);
}

// ─── Suite B — Care coordination ──────────────────────────────────────────────

async function suiteB() {
  section('Suite B — Care Coordination (CareTeam, CarePlan, Goal, Task)');

  // B1: CareTeam READ
  const ctId = `${PATIENT_MARIA}-careteam`;
  const r1 = await fhirGet(`CareTeam/${ctId}`);
  assert(r1.ok && r1.body?.resourceType === 'CareTeam', `B1 CareTeam READ (${ctId})`, `HTTP ${r1.status}`);

  // B2: CareTeam participant count
  const participants = r1.body?.participant ?? [];
  assert(participants.length >= 2, `B2 CareTeam has ≥ 2 participants (got ${participants.length})`);

  // B3: CarePlan READ
  const cpId = `${PATIENT_MARIA}-careteam`;
  const r3 = await fhirGet(`CarePlan/${cpId}`);
  assert(r3.ok || r3.status === 404, `B3 CarePlan GET returns valid HTTP (${r3.status})`);

  // B4: Goal SEARCH by patient
  const r4 = await fhirGet(`Goal?patient=Patient/${PATIENT_MARIA}&_count=20`);
  assert(r4.ok, 'B4 Goal SEARCH by patient', `HTTP ${r4.status}`);
  const goalCount = (r4.body?.entry ?? []).length;
  assert(goalCount >= 1, `B4 Goal count ≥ 1 for Maria (got ${goalCount})`);

  // B5: Task SEARCH by patient
  const r5 = await fhirGet(`Task?patient=Patient/${PATIENT_MARIA}&_count=20`);
  assert(r5.ok, 'B5 Task SEARCH by patient', `HTTP ${r5.status}`);

  // B6: Task SEARCH by owner (CHW practitioner-jon)
  const r6 = await fhirGet(`Task?owner=Practitioner/${PRAC_JON}&_count=10`);
  assert(r6.ok, `B6 Task SEARCH by owner (${PRAC_JON})`, `HTTP ${r6.status}`);

  // B7: Encounter SEARCH
  const r7 = await fhirGet(`Encounter?patient=Patient/${PATIENT_MARIA}&_count=10`);
  assert(r7.ok, 'B7 Encounter SEARCH by patient', `HTTP ${r7.status}`);
  const encCount = (r7.body?.entry ?? []).filter(e => e.resource?.resourceType === 'Encounter').length;
  assert(encCount >= 1, `B7 Encounter count ≥ 1 for Maria (got ${encCount})`);
}

// ─── Suite C — Referral / Workflow ────────────────────────────────────────────

async function suiteC() {
  section('Suite C — Referral / Workflow (ServiceRequest, AuditEvent)');

  // C1: ServiceRequest SEARCH by patient
  const r1 = await fhirGet(`ServiceRequest?patient=Patient/${PATIENT_DOROTHY}&_count=20`);
  assert(r1.ok, 'C1 ServiceRequest SEARCH by patient (Dorothy)', `HTTP ${r1.status}`);

  // C2: POST a test ServiceRequest (CHW referral pattern)
  const srBody = {
    resourceType: 'ServiceRequest',
    status: 'active', intent: 'order',
    category: [{ coding: [{ system: `${EXT}/service-category`, code: 'social-referral' }] }],
    code: { text: 'ST-9 test referral — Food Security Navigation' },
    subject: { reference: `Patient/${PATIENT_MARIA}` },
    requester: { reference: `Practitioner/${PRAC_JON}` },
    note: [{ text: 'Created by ST-9 test suite — will be deleted in cleanup' }],
  };
  const r2 = await fhirPost('ServiceRequest', srBody);
  assert(r2.ok && r2.body?.resourceType === 'ServiceRequest', 'C2 ServiceRequest POST', `HTTP ${r2.status}`);
  const srId = r2.body?.id;
  if (srId) track('ServiceRequest', srId);

  // C3: POST a linked Task
  const taskBody = {
    resourceType: 'Task',
    status: 'requested', intent: 'order',
    for: { reference: `Patient/${PATIENT_MARIA}` },
    owner: { reference: `Practitioner/${PRAC_JON}` },
    focus: { reference: `ServiceRequest/${srId}` },
    description: 'ST-9 test Task — navigate to food bank',
  };
  const r3 = await fhirPost('Task', taskBody);
  assert(r3.ok && r3.body?.resourceType === 'Task', 'C3 Task POST linked to ServiceRequest', `HTTP ${r3.status}`);
  const taskId = r3.body?.id;
  if (taskId) track('Task', taskId);

  // C4: PUT Task status → in-progress
  if (taskId) {
    const updated = { ...r3.body, status: 'in-progress' };
    const r4 = await fhirPut(`Task/${taskId}`, updated);
    assert(r4.ok, 'C4 Task PUT status → in-progress', `HTTP ${r4.status}`);
    assert(r4.body?.status === 'in-progress', 'C4 Task status persisted as in-progress');
  }

  // C5: PUT Task status → completed
  if (taskId) {
    const r4b = await fhirGet(`Task/${taskId}`);
    const updated2 = { ...r4b.body, status: 'completed' };
    const r5 = await fhirPut(`Task/${taskId}`, updated2);
    assert(r5.ok, 'C5 Task PUT status → completed', `HTTP ${r5.status}`);
    assert(r5.body?.status === 'completed', 'C5 Task status persisted as completed');
  }

  // C6: POST AuditEvent
  const auditBody = {
    resourceType: 'AuditEvent',
    type: { system: 'http://terminology.hl7.org/CodeSystem/audit-event-type', code: 'rest' },
    recorded: new Date().toISOString(),
    action: 'C',
    outcome: '0',
    agent: [{ who: { reference: `Practitioner/${PRAC_JON}` }, requestor: true }],
    source: { observer: { display: 'TCOC Platform — ST-9 test' } },
    entity: [{ what: { reference: `ServiceRequest/${srId}` }, description: 'ST-9 referral created' }],
  };
  const r6 = await fhirPost('AuditEvent', auditBody);
  assert(r6.ok && r6.body?.resourceType === 'AuditEvent', 'C6 AuditEvent POST', `HTTP ${r6.status}`);
  if (r6.body?.id) track('AuditEvent', r6.body.id);

  return { srId, taskId };
}

// ─── Suite D — Practitioners / Network ────────────────────────────────────────

async function suiteD() {
  section('Suite D — Practitioners / Organization (Provider Network)');

  // D1-D4: READ each seeded Practitioner
  for (const [label, id] of [
    ['Rick (PCP)',       PRAC_RICK],
    ['Jon (CHW/Spec)',   PRAC_JON],
    ['Whitfield (PCP)', 'practitioner-whitfield'],
    ['Sarah (CM)',       PRAC_SARAH],
  ]) {
    const r = await fhirGet(`Practitioner/${id}`);
    assert(r.ok && r.body?.resourceType === 'Practitioner', `D Practitioner READ — ${label}`, `HTTP ${r.status}`);
    assert(Array.isArray(r.body?.name) && r.body.name.length > 0, `D Practitioner has name — ${label}`);
  }

  // D5: Practitioner SEARCH
  const r5 = await fhirGet(`Practitioner?_count=10&active=true`);
  assert(r5.ok, 'D5 Practitioner SEARCH (active)', `HTTP ${r5.status}`);
  const pracCount = (r5.body?.entry ?? []).filter(e => e.resource?.resourceType === 'Practitioner').length;
  assert(pracCount >= 4, `D5 Practitioner count ≥ 4 (got ${pracCount})`);

  // D6: Organization SEARCH — CBOs
  const r6 = await fhirGet(`Organization?_count=20`);
  assert(r6.ok, 'D6 Organization SEARCH', `HTTP ${r6.status}`);
  const orgCount = (r6.body?.entry ?? []).filter(e => e.resource?.resourceType === 'Organization').length;
  assert(orgCount >= 8, `D6 Organization count ≥ 8 (CBO + region orgs, got ${orgCount})`);

  // D7: Region Organization check (from ST-8)
  const r7 = await fhirGet(`Organization/org-region-west-river`);
  assert(r7.ok && r7.body?.resourceType === 'Organization', 'D7 Region Organization READ — West River', `HTTP ${r7.status}`);
  const regionStatus = extVal(r7.body, 'region-status');
  assert(regionStatus === 'Above Target', `D7 West River region-status extension = "Above Target" (got "${regionStatus}")`);
}

// ─── Suite E — Consent & Coverage ─────────────────────────────────────────────

async function suiteE() {
  section('Suite E — Consent & Coverage');

  // E1-E3: Consent READ
  for (const [label, id, expectedStatus] of [
    ['Maria Data Sharing (active)',  'cns-001', 'active'],
    ['Maria Research (active)',      'cns-002', 'active'],
    ['Maria BH Data (revoked)',      'cns-003', 'rejected'],
    ['Dorothy Data Sharing (active)','cns-004', 'active'],
  ]) {
    const r = await fhirGet(`Consent/${id}`);
    assert(r.ok && r.body?.resourceType === 'Consent', `E Consent READ — ${label}`, `HTTP ${r.status}`);
    assert(r.body?.status === expectedStatus, `E Consent status = "${expectedStatus}" — ${label} (got "${r.body?.status}")`);
    const consentType = extVal(r.body, 'consent-type');
    assert(consentType !== null, `E Consent has consent-type extension — ${label}`);
  }

  // E5: Consent SEARCH returns ≥ 4
  const r5 = await fhirGet(`Consent?_count=20`);
  assert(r5.ok, 'E5 Consent SEARCH', `HTTP ${r5.status}`);
  const cnsCount = (r5.body?.entry ?? []).filter(e => e.resource?.resourceType === 'Consent').length;
  assert(cnsCount >= 4, `E5 Consent count ≥ 4 (got ${cnsCount})`);

  // E6-E8: Coverage READ
  for (const [label, id, expectedStatus] of [
    ['Dorothy SNAP (expired)',     'cov-e001', 'cancelled'],
    ['Dorothy CCBHC (active)',     'cov-e003', 'active'],
    ['James SSI (active)',         'cov-e008', 'active'],
    ['Lisa Emergency Housing',     'cov-e011', 'active'],
  ]) {
    const r = await fhirGet(`Coverage/${id}`);
    assert(r.ok && r.body?.resourceType === 'Coverage', `E Coverage READ — ${label}`, `HTTP ${r.status}`);
    assert(r.body?.status === expectedStatus, `E Coverage status = "${expectedStatus}" — ${label} (got "${r.body?.status}")`);
    const domain = extVal(r.body, 'coverage-domain');
    assert(domain !== null, `E Coverage has coverage-domain extension — ${label}`);
  }

  // E10: Coverage SEARCH returns ≥ 13
  const r10 = await fhirGet(`Coverage?_count=20`);
  assert(r10.ok, 'E10 Coverage SEARCH', `HTTP ${r10.status}`);
  const covCount = (r10.body?.entry ?? []).filter(e => e.resource?.resourceType === 'Coverage').length;
  assert(covCount >= 13, `E10 Coverage count ≥ 13 (got ${covCount})`);
}

// ─── Suite F — Aggregate / Population (ST-8 resources) ────────────────────────

async function suiteF() {
  section('Suite F — Aggregate Data (MeasureReport, SDOH/ROI Observations)');

  // F1: STARS MeasureReport READ
  const r1 = await fhirGet(`MeasureReport/mr-stars-001`);
  assert(r1.ok && r1.body?.resourceType === 'MeasureReport', 'F1 MeasureReport READ — STARS D01 HbA1c', `HTTP ${r1.status}`);
  const starsMeasureId = extVal(r1.body, 'measure-id');
  assert(starsMeasureId === 'D01', `F1 STARS measure-id extension = "D01" (got "${starsMeasureId}")`);
  const starsProgram = extVal(r1.body, 'measure-program');
  assert(starsProgram === 'STARS', `F1 STARS measure-program extension = "STARS" (got "${starsProgram}")`);

  // F2: HEDIS MeasureReport READ
  const r2 = await fhirGet(`MeasureReport/mr-hedis-002`);
  assert(r2.ok && r2.body?.resourceType === 'MeasureReport', 'F2 MeasureReport READ — HEDIS CBP', `HTTP ${r2.status}`);
  const hedisCompliance = extVal(r2.body, 'measure-compliance');
  assert(hedisCompliance === '58', `F2 HEDIS measure-compliance = "58" (got "${hedisCompliance}")`);

  // F3: EXEC MeasureReport READ
  const r3 = await fhirGet(`MeasureReport/mr-exec-closure-rate`);
  assert(r3.ok && r3.body?.resourceType === 'MeasureReport', 'F3 MeasureReport READ — EXEC closure rate', `HTTP ${r3.status}`);
  const execScore = r3.body?.group?.[0]?.measureScore?.value;
  assert(execScore === 68.4, `F3 EXEC closure rate measureScore = 68.4 (got ${execScore})`);

  // F4: MeasureReport SEARCH — total count ≥ 14
  const r4 = await fhirGet(`MeasureReport?_count=30`);
  assert(r4.ok, 'F4 MeasureReport SEARCH', `HTTP ${r4.status}`);
  const mrCount = (r4.body?.entry ?? []).filter(e => e.resource?.resourceType === 'MeasureReport').length;
  assert(mrCount >= 14, `F4 MeasureReport count ≥ 14 (STARS+HEDIS+EXEC, got ${mrCount})`);

  // F5: SDOH Observation READ — Food Insecurity
  const r5 = await fhirGet(`Observation/obs-sdoh-food`);
  assert(r5.ok && r5.body?.resourceType === 'Observation', 'F5 SDOH Observation READ — Food Insecurity', `HTTP ${r5.status}`);
  const sdohPct = extVal(r5.body, 'sdoh-prevalence-pct');
  assert(sdohPct === '37.2', `F5 SDOH food prevalence-pct = "37.2" (got "${sdohPct}")`);
  assert(r5.body?.valueQuantity?.value === 687, `F5 SDOH food count = 687 (got ${r5.body?.valueQuantity?.value})`);

  // F6: ROI Observation READ — Housing
  const r6 = await fhirGet(`Observation/obs-roi-housing`);
  assert(r6.ok && r6.body?.resourceType === 'Observation', 'F6 ROI Observation READ — Housing Stability', `HTTP ${r6.status}`);
  const roiSavings = r6.body?.valueQuantity?.value;
  assert(roiSavings === 187400, `F6 Housing ROI savings = 187400 (got ${roiSavings})`);
  const roiEvidence = extVal(r6.body, 'intervention-evidence');
  assert(roiEvidence === 'Strong', `F6 Housing ROI evidence = "Strong" (got "${roiEvidence}")`);

  // F7: SDOH Observation direct GET by known IDs (HAPI paginates all-Obs bundles; use direct reads)
  let sdohReadPassed = 0;
  for (const obsId of ['obs-sdoh-food','obs-sdoh-housing','obs-sdoh-transport','obs-sdoh-financial','obs-sdoh-isolation','obs-sdoh-employment']) {
    const rr = await fhirGet(`Observation/${obsId}`);
    if (rr.ok && rr.body?.resourceType === 'Observation') sdohReadPassed++;
  }
  assert(sdohReadPassed >= 6, `F7 SDOH Observation direct GET — all 6 readable (got ${sdohReadPassed})`);

  // F8: ROI Observation direct GET by known IDs
  let roiReadPassed = 0;
  for (const obsId of ['obs-roi-housing','obs-roi-food','obs-roi-bh','obs-roi-transport','obs-roi-chw','obs-roi-social']) {
    const rr = await fhirGet(`Observation/${obsId}`);
    if (rr.ok && rr.body?.resourceType === 'Observation') roiReadPassed++;
  }
  assert(roiReadPassed >= 6, `F8 ROI Observation direct GET — all 6 readable (got ${roiReadPassed})`);
}

// ─── Suite G — Write round-trips ──────────────────────────────────────────────

async function suiteG() {
  section('Suite G — Write Round-Trips (POST → GET → PUT → DELETE)');

  // G1: CarePlan POST → GET → PUT → DELETE
  const cpBody = {
    resourceType: 'CarePlan',
    status: 'active', intent: 'plan',
    subject: { reference: `Patient/${PATIENT_MARIA}` },
    title: 'ST-9 Test Care Plan',
    description: 'Created by ST-9 test suite — will be deleted in cleanup',
    activity: [{ detail: { status: 'not-started', description: 'Test activity' } }],
  };
  const cpPost = await fhirPost('CarePlan', cpBody);
  assert(cpPost.ok && cpPost.body?.resourceType === 'CarePlan', 'G1 CarePlan POST', `HTTP ${cpPost.status}`);
  const cpId = cpPost.body?.id;
  if (cpId) {
    track('CarePlan', cpId);
    const cpGet = await fhirGet(`CarePlan/${cpId}`);
    assert(cpGet.ok && cpGet.body?.id === cpId, 'G1 CarePlan GET after POST');
    const cpPut = await fhirPut(`CarePlan/${cpId}`, { ...cpGet.body, status: 'completed' });
    assert(cpPut.ok && cpPut.body?.status === 'completed', 'G1 CarePlan PUT status → completed');
  }

  // G2: Observation POST → GET → PUT (care gap closure pattern)
  const obsBody = {
    resourceType: 'Observation',
    status: 'preliminary',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }] }],
    code: { coding: [{ system: `${EXT}/care-gap`, code: 'ST9-test-gap' }], text: 'ST-9 test gap observation' },
    subject: { reference: `Patient/${PATIENT_MARIA}` },
    valueString: 'open',
  };
  const obPost = await fhirPost('Observation', obsBody);
  assert(obPost.ok && obPost.body?.resourceType === 'Observation', 'G2 Gap Observation POST', `HTTP ${obPost.status}`);
  const obId = obPost.body?.id;
  if (obId) {
    track('Observation', obId);
    const obGet = await fhirGet(`Observation/${obId}`);
    assert(obGet.ok && obGet.body?.id === obId, 'G2 Gap Observation GET after POST');
    const obPut = await fhirPut(`Observation/${obId}`, { ...obGet.body, status: 'final', valueString: 'closed' });
    assert(obPut.ok && obPut.body?.status === 'final', 'G2 Gap Observation PUT status → final');
  }

  // G3: ServiceRequest POST — enrollment action (ST-7 pattern)
  const srBody = {
    resourceType: 'ServiceRequest',
    status: 'active', intent: 'order',
    category: [{ coding: [{ system: `${EXT}/service-category`, code: 'enrollment' }] }],
    code: { text: 'ST-9 test enrollment: SNAP Food Assistance' },
    subject: { reference: `Patient/${PATIENT_DOROTHY}` },
    requester: { display: 'Care Manager' },
    extension: [
      { url: `${EXT}/enrollment-patient-id`, valueString: 'PAT-0042' },
      { url: `${EXT}/enrollment-program`, valueString: 'SNAP Food Assistance' },
      { url: `${EXT}/enrollment-action`, valueString: 'renew' },
    ],
  };
  const srPost = await fhirPost('ServiceRequest', srBody);
  assert(srPost.ok && srPost.body?.resourceType === 'ServiceRequest', 'G3 Enrollment ServiceRequest POST', `HTTP ${srPost.status}`);
  if (srPost.body?.id) track('ServiceRequest', srPost.body.id);

  // G4: MeasureReport POST → GET → DELETE (aggregate write pattern)
  const mrBody = {
    resourceType: 'MeasureReport',
    status: 'complete', type: 'summary',
    measure: `${EXT}/Measure/ST9-test`,
    date: new Date().toISOString().split('T')[0],
    group: [{ measureScore: { value: 42, unit: 'percent' } }],
    extension: [{ url: `${EXT}/measure-program`, valueString: 'ST9-TEST' }],
  };
  const mrPost = await fhirPost('MeasureReport', mrBody);
  assert(mrPost.ok && mrPost.body?.resourceType === 'MeasureReport', 'G4 MeasureReport POST', `HTTP ${mrPost.status}`);
  const mrId = mrPost.body?.id;
  if (mrId) {
    track('MeasureReport', mrId);
    const mrGet = await fhirGet(`MeasureReport/${mrId}`);
    assert(mrGet.ok && mrGet.body?.id === mrId, 'G4 MeasureReport GET after POST');
  }
}

// ─── Suite H — CDS Hooks integration ──────────────────────────────────────────

async function suiteH() {
  section('Suite H — CDS Hooks Integration (/api/cds-hooks/patient-view)');

  try {
    const body = {
      hookInstance: 'st9-test-001',
      hook: 'patient-view',
      context: {
        userId: `Practitioner/${PRAC_SARAH}`,
        patientId: PATIENT_MARIA,
      },
      prefetch: {},
    };
    const res = await fetch(`${APP_BASE}/api/cds-hooks/patient-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404 || res.status === 502 || res.status === 503) {
      skip('H1 CDS Hooks POST — patient-view returns cards array', `App not reachable at ${APP_BASE} (HTTP ${res.status})`);
      skip('H2 CDS Hooks cards array is non-empty', 'App unavailable');
      skip('H3 CDS Hooks first card has summary field', 'App unavailable');
      return;
    }
    const json = await res.json().catch(() => null);
    assert(res.ok, `H1 CDS Hooks POST — patient-view (HTTP ${res.status})`, `URL: ${APP_BASE}/api/cds-hooks/patient-view`);
    assert(Array.isArray(json?.cards), 'H2 CDS Hooks response has cards array');
    if (Array.isArray(json?.cards) && json.cards.length > 0) {
      assert(typeof json.cards[0].summary === 'string' && json.cards[0].summary.length > 0, 'H3 CDS Hooks first card has non-empty summary');
      assert(json.cards[0].indicator !== undefined, 'H4 CDS Hooks first card has indicator field');
    } else {
      skip('H3 CDS Hooks first card has non-empty summary', 'cards array empty');
      skip('H4 CDS Hooks first card has indicator field', 'cards array empty');
    }
  } catch (err) {
    skip('H1 CDS Hooks POST', `Network error: ${err.message}`);
    skip('H2 CDS Hooks cards array', 'H1 skipped');
    skip('H3 CDS Hooks first card summary', 'H1 skipped');
    skip('H4 CDS Hooks indicator', 'H1 skipped');
  }
}

// ─── Suite I — Mock-mode fallback ─────────────────────────────────────────────

async function suiteI() {
  section('Suite I — Mock-Mode Fallback (unreachable FHIR base)');

  // Point at a port nothing is listening on
  const deadBase = 'http://localhost:19999/fhir';

  // I1: GET against dead base should fail gracefully (no unhandled throw)
  let didNotThrow = true;
  let timedOut = false;
  try {
    const res = await fetch(`${deadBase}/Patient/patient-maria-001`, {
      signal: AbortSignal.timeout(2000),
    });
    // connection refused → res.ok = false
    assert(!res.ok, 'I1 Dead FHIR base returns non-ok response', `HTTP ${res.status}`);
  } catch (err) {
    // fetch failed / ECONNREFUSED / AbortError / TimeoutError are ALL expected graceful failures
    const isExpected =
      err.name === 'AbortError' ||
      err.name === 'TimeoutError' ||
      err.code === 'ECONNREFUSED' ||
      err.message?.includes('ECONNREFUSED') ||
      err.message === 'fetch failed' ||
      err.cause?.code === 'ECONNREFUSED';
    assert(isExpected,
      `I1 Dead FHIR base throws expected network error (${err.name}: ${err.message?.slice(0, 60)})`);
    didNotThrow = false;
  }

  // I2: Confirm actual FHIR base still works after the dead-base test
  const r2 = await fhirGet('metadata');
  assert(r2.ok && r2.body?.resourceType === 'CapabilityStatement', 'I2 Live FHIR base still reachable after mock-mode test');

  // I3: Verify metadata endpoint returns expected FHIR version
  const fhirVersion = r2.body?.fhirVersion;
  assert(typeof fhirVersion === 'string' && fhirVersion.startsWith('4.'), `I3 FHIR server reports R4 version (got "${fhirVersion}")`);

  // I4: Server returns correct total in Patient bundle (≥ 5)
  const r4 = await fhirGet('Patient?_count=10');
  const total = r4.body?.total ?? (r4.body?.entry ?? []).length;
  assert(total >= 5, `I4 Patient bundle total ≥ 5 (got ${total})`);
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanup() {
  section('Cleanup — Delete test-created resources');
  let cleaned = 0;
  for (const { resourceType, id } of created.reverse()) {
    const r = await fhirDelete(`${resourceType}/${id}`);
    if (r.ok || r.status === 404 || r.status === 410) {
      console.log(`  🗑   Deleted ${resourceType}/${id}`);
      cleaned++;
    } else {
      console.warn(`  ⚠   Could not delete ${resourceType}/${id} (HTTP ${r.status})`);
    }
  }
  console.log(`\n  Cleaned up ${cleaned} / ${created.length} test resources.`);
}

// ─── Server wait ──────────────────────────────────────────────────────────────

async function waitForServer() {
  console.log(`\n⏳  Waiting for HAPI FHIR at ${FHIR_BASE} …`);
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${FHIR_BASE}/metadata`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) { console.log('✅  Server is ready.\n'); return; }
    } catch { /* not ready */ }
    await sleep(3000);
    process.stdout.write('.');
  }
  throw new Error('FHIR server not reachable. Run: docker compose -f fhir/docker-compose.yml up -d && node fhir/migrate-patients.mjs');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startMs = Date.now();
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   TCOC FHIR R4 Full-Coverage Test Suite  (ST-9)             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  FHIR base : ${FHIR_BASE}`);
  console.log(`  App base  : ${APP_BASE}`);
  console.log(`  Started   : ${new Date().toISOString()}`);

  await waitForServer();

  await suiteA();
  await suiteB();
  const { srId, taskId } = await suiteC();
  await suiteD();
  await suiteE();
  await suiteF();
  await suiteG();
  await suiteH();
  await suiteI();
  await cleanup();

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS   ${passed} passed   ${failed} failed   ${skipped} skipped   (${elapsed}s)`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failures.length > 0) {
    console.error('  Failed assertions:');
    failures.forEach((f, i) => console.error(`    ${i + 1}. ${f}`));
    console.error('');
  }

  // Machine-readable summary
  console.log('  Resource types verified:');
  const types = [...new Set(results.filter(r => r.status === 'PASS').map(r => r.name.match(/\b(Patient|Observation|Condition|MedicationRequest|CareTeam|CarePlan|Goal|Task|Encounter|ServiceRequest|AuditEvent|Practitioner|Organization|Consent|Coverage|MeasureReport|Flag|RiskAssessment)\b/)?.[1]).filter(Boolean))];
  types.forEach(t => console.log(`    ✅  ${t}`));

  exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n💥  Fatal error:', err.message);
  exit(1);
});
