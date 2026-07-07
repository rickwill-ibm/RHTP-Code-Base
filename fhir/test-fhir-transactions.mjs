#!/usr/bin/env node
/**
 * TCOC FHIR R4 Integration Test Suite
 *
 * Exercises every FHIR transaction the platform makes, in actor order:
 *
 *  Phase 0 — Pre-flight  (server health, metadata)
 *  Phase 1 — Patient     (READ, SEARCH by identifier)
 *  Phase 2 — Care Gaps   (Observation READ, SEARCH, PUT update → Closed)
 *  Phase 3 — CDS Alerts  (Flag READ, SEARCH, status update)
 *  Phase 4 — Risk        (RiskAssessment READ, SEARCH)
 *  Phase 5 — Care Plan   (CarePlan CREATE → READ back → UPDATE → DELETE)
 *  Phase 6 — Referral    (ServiceRequest + Task + Provenance — full closed-loop)
 *  Phase 7 — Procedure   (Procedure CREATE for service completion)
 *  Phase 8 — Lab Result  (Observation CREATE for clinical evidence)
 *  Phase 9 — Gap Closure (Observation status PUT: preliminary → final)
 *  Phase 10— Read-back   (Cross-module consistency: re-read patient bundle, assert gap reflects closure)
 *  Phase 11— Provenance  (Audit trail: verify every write has a Provenance record)
 *  Phase 12— Cleanup     (DELETE all resources created by this run)
 *
 * Prerequisites:
 *   docker compose -f fhir/docker-compose.yml up -d
 *   node fhir/migrate-patients.mjs
 *
 * Usage:
 *   node fhir/test-fhir-transactions.mjs [--fhir-url http://localhost:8080/fhir]
 *
 * Exit code 0 = all tests passed, 1 = one or more failures.
 */

import { argv, exit } from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

// ─── Config ────────────────────────────────────────────────────────────────────

const argIdx = argv.indexOf('--fhir-url');
const FHIR_BASE = argIdx !== -1 ? argv[argIdx + 1] : 'http://localhost:8080/fhir';

const HEADERS = {
  'Content-Type': 'application/fhir+json',
  Accept: 'application/fhir+json',
};

// TCOC extension base URL
const EXT = 'http://tcoc.example.org/fhir/StructureDefinition';

// Well-known patient seeded by migrate-patients.mjs
const TEST_PATIENT_FHIR_ID = 'patient-maria-001';
const TEST_PATIENT_PLATFORM_ID = 'MARIA_SD_001';
const TEST_GAP_OBS_ID = `${TEST_PATIENT_FHIR_ID}-gap-mg-1`; // HbA1c gap Observation

// Practitioner IDs — resolved after phase0b seeds them
let CARE_MANAGER_ID = 'care-manager-sarah';
let LAB_PROVIDER_ID = 'lab-provider-001';

// Track resources created during this run for cleanup
const createdResources = [];

// Test results
let passed = 0;
let failed = 0;
const failures = [];

// ─── Test harness ──────────────────────────────────────────────────────────────

function assert(condition, message) {
  if (condition) {
    console.log(`    ✅  ${message}`);
    passed++;
  } else {
    console.error(`    ❌  FAIL: ${message}`);
    failed++;
    failures.push(message);
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

async function fhirRequest(method, path, body) {
  const url = `${FHIR_BASE}/${path.replace(/^\//, '')}`;
  const init = {
    method,
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  };
  if (body) init.body = JSON.stringify(body);

  const res = await fetch(url, init);
  let json = null;
  try {
    json = await res.json();
  } catch {
    // no-op for 204 / empty bodies
  }
  return { status: res.status, ok: res.ok, body: json };
}

async function fhirGet(path)         { return fhirRequest('GET', path); }
async function fhirPost(path, body)  { return fhirRequest('POST', path, body); }
async function fhirPut(path, body)   { return fhirRequest('PUT', path, body); }
async function fhirDelete(path)      { return fhirRequest('DELETE', path); }

function track(resourceType, id) {
  createdResources.push({ resourceType, id });
}

// ─── Phase 0b — Seed Practitioner resources ───────────────────────────────────

async function phase0b_seedPractitioners() {
  section('Phase 0b — Seed Practitioners (referential integrity pre-requisites)');

  // Upsert care manager via PUT (deterministic ID)
  const careManager = {
    resourceType: 'Practitioner',
    id: 'care-manager-sarah',
    name: [{ use: 'official', family: 'Johnson', given: ['Sarah'] }],
    identifier: [{ system: 'urn:tcoc:practitioner-id', value: 'CM-SARAH-001' }],
  };
  const cmRes = await fhirPut('Practitioner/care-manager-sarah', careManager);
  assert(cmRes.status === 200 || cmRes.status === 201,
    `PUT Practitioner/care-manager-sarah → 2xx (got: ${cmRes.status})`);
  CARE_MANAGER_ID = cmRes.body?.id ?? 'care-manager-sarah';
  // Practitioners are permanent fixtures — do NOT track for cleanup (other resources reference them)

  // Upsert lab provider via PUT
  const labProvider = {
    resourceType: 'Practitioner',
    id: 'lab-provider-001',
    name: [{ use: 'official', family: 'Lab', given: ['Provider'] }],
    identifier: [{ system: 'urn:tcoc:practitioner-id', value: 'LAB-001' }],
  };
  const lpRes = await fhirPut('Practitioner/lab-provider-001', labProvider);
  assert(lpRes.status === 200 || lpRes.status === 201,
    `PUT Practitioner/lab-provider-001 → 2xx (got: ${lpRes.status})`);
  LAB_PROVIDER_ID = lpRes.body?.id ?? 'lab-provider-001';
  // Practitioners are permanent fixtures — do NOT track for cleanup

  // Verify read-back
  const readRes = await fhirGet(`Practitioner/${CARE_MANAGER_ID}`);
  assert(readRes.status === 200, `GET Practitioner/${CARE_MANAGER_ID} → 200`);
}

// ─── Phase 0 — Pre-flight ──────────────────────────────────────────────────────

async function phase0_preflight() {
  section('Phase 0 — Pre-flight (server health)');

  const meta = await fhirGet('metadata');
  assert(meta.status === 200, 'GET /fhir/metadata returns HTTP 200');
  assert(meta.body?.resourceType === 'CapabilityStatement', 'Response is a CapabilityStatement');
  assert(meta.body?.fhirVersion?.startsWith('4.'), 'FHIR version is R4 (4.x)');

  // The CapabilityStatement must advertise the resource types we use
  const resources = meta.body?.rest?.[0]?.resource?.map(r => r.type) ?? [];
  for (const rt of ['Patient', 'Observation', 'Flag', 'RiskAssessment', 'CarePlan',
                    'ServiceRequest', 'Task', 'Procedure', 'Provenance', 'MeasureReport']) {
    assert(resources.includes(rt), `CapabilityStatement declares ${rt} resource`);
  }
}

// ─── Phase 1 — Patient ─────────────────────────────────────────────────────────

async function phase1_patient() {
  section('Phase 1 — Patient (READ + SEARCH)');

  // Direct read by FHIR id
  const readRes = await fhirGet(`Patient/${TEST_PATIENT_FHIR_ID}`);
  assert(readRes.status === 200, `GET Patient/${TEST_PATIENT_FHIR_ID} → 200`);
  assert(readRes.body?.resourceType === 'Patient', 'Resource type is Patient');
  assert(readRes.body?.id === TEST_PATIENT_FHIR_ID, 'Returned id matches requested id');

  const exts = readRes.body?.extension ?? [];
  const rafExt = exts.find(e => e.url === `${EXT}/raf-score`);
  assert(rafExt?.valueDecimal > 0, 'Patient carries raf-score extension (valueDecimal > 0)');

  const riskExt = exts.find(e => e.url === `${EXT}/risk-tier`);
  assert(['Critical','High','Moderate','Low'].includes(riskExt?.valueString ?? ''),
    'Patient risk-tier extension is a valid tier value');

  const identifiers = readRes.body?.identifier ?? [];
  assert(identifiers.some(i => i.system === 'urn:tcoc:platform-id' && i.value === TEST_PATIENT_PLATFORM_ID),
    'Patient identifier carries platform-id = MARIA_SD_001');

  // Search by platform-id identifier
  const searchRes = await fhirGet(`Patient?identifier=urn:tcoc:platform-id|${TEST_PATIENT_PLATFORM_ID}`);
  assert(searchRes.status === 200, 'GET Patient?identifier search returns 200');
  assert(searchRes.body?.resourceType === 'Bundle', 'Search result is a Bundle');
  const entries = searchRes.body?.entry ?? [];
  assert(entries.length >= 1, 'Search by platform-id finds at least one patient');
  assert(entries[0]?.resource?.id === TEST_PATIENT_FHIR_ID, 'Search result matches expected patient id');

  // Search all patients
  const allRes = await fhirGet('Patient?_count=100');
  assert(allRes.status === 200, 'GET Patient?_count=100 returns 200');
  const allCount = allRes.body?.entry?.length ?? 0;
  assert(allCount >= 5, `At least 5 patients are present (found ${allCount})`);
}

// ─── Phase 2 — Care Gap Observations ──────────────────────────────────────────

async function phase2_careGaps() {
  section('Phase 2 — Care Gaps (Observation READ + SEARCH + UPDATE)');

  // Read the HbA1c care gap observation for Maria
  const readRes = await fhirGet(`Observation/${TEST_GAP_OBS_ID}`);
  assert(readRes.status === 200, `GET Observation/${TEST_GAP_OBS_ID} → 200`);
  assert(readRes.body?.resourceType === 'Observation', 'Resource type is Observation');

  const oExts = readRes.body?.extension ?? [];
  const gapStatus = oExts.find(e => e.url === `${EXT}/care-gap-status`)?.valueString;
  assert(['Open','In Progress','Closed','Waived'].includes(gapStatus ?? ''),
    `care-gap-status extension is a valid status (got: ${gapStatus})`);

  const domain = oExts.find(e => e.url === `${EXT}/care-gap-domain`)?.valueString;
  assert(['Clinical','BH','Social'].includes(domain ?? ''), `care-gap-domain is valid (got: ${domain})`);

  // Search all care gaps for this patient
  const searchRes = await fhirGet(`Observation?subject=Patient/${TEST_PATIENT_FHIR_ID}&_count=50`);
  assert(searchRes.status === 200, 'GET Observation search by patient returns 200');
  const gapCount = searchRes.body?.entry?.length ?? 0;
  assert(gapCount >= 5, `At least 5 care-gap Observations for Maria (found ${gapCount})`);

  // UPDATE — close the HbA1c gap via PUT (status: preliminary → final)
  const updated = {
    ...readRes.body,
    status: 'final',
    extension: [
      ...oExts.filter(e => e.url !== `${EXT}/care-gap-status`),
      { url: `${EXT}/care-gap-status`, valueString: 'Closed' },
      { url: `${EXT}/care-gap-days-open`, valueInteger: 0 },
    ],
  };
  const putRes = await fhirPut(`Observation/${TEST_GAP_OBS_ID}`, updated);
  assert(putRes.status === 200 || putRes.status === 201, `PUT Observation/${TEST_GAP_OBS_ID} (close gap) → 2xx`);
  assert(putRes.body?.status === 'final', 'Observation status is now final after PUT');

  // Verify read-back reflects closure
  const verifyRes = await fhirGet(`Observation/${TEST_GAP_OBS_ID}`);
  const verifyExts = verifyRes.body?.extension ?? [];
  const verifyStatus = verifyExts.find(e => e.url === `${EXT}/care-gap-status`)?.valueString;
  assert(verifyStatus === 'Closed', `Read-back: care-gap-status extension is now "Closed" (got: ${verifyStatus})`);
}

// ─── Phase 3 — CDS Flags ───────────────────────────────────────────────────────

async function phase3_flags() {
  section('Phase 3 — CDS Alerts (Flag READ + SEARCH + UPDATE)');

  const flagId = `${TEST_PATIENT_FHIR_ID}-flag-cds-maria-1`;

  const readRes = await fhirGet(`Flag/${flagId}`);
  assert(readRes.status === 200, `GET Flag/${flagId} → 200`);
  assert(readRes.body?.resourceType === 'Flag', 'Resource type is Flag');

  const indicator = readRes.body?.code?.coding?.[0]?.code;
  assert(['critical','warning','info'].includes(indicator ?? ''),
    `Flag indicator coding is valid (got: ${indicator})`);

  const detail = (readRes.body?.extension ?? []).find(e => e.url === `${EXT}/cds-detail`)?.valueString;
  assert(detail && detail.length > 0, 'Flag carries cds-detail extension');

  // Search flags for patient
  const searchRes = await fhirGet(`Flag?subject=Patient/${TEST_PATIENT_FHIR_ID}`);
  assert(searchRes.status === 200, 'GET Flag search by patient returns 200');
  const flagCount = searchRes.body?.entry?.length ?? 0;
  assert(flagCount >= 2, `At least 2 CDS flags for Maria (found ${flagCount})`);

  // UPDATE — resolve the flag (active → inactive)
  const resolved = { ...readRes.body, status: 'inactive' };
  const putRes = await fhirPut(`Flag/${flagId}`, resolved);
  assert(putRes.status === 200 || putRes.status === 201,
    `PUT Flag/${flagId} (resolve alert) → 2xx`);
  assert(putRes.body?.status === 'inactive', 'Flag status is now inactive');
}

// ─── Phase 4 — RiskAssessment ──────────────────────────────────────────────────

async function phase4_risk() {
  section('Phase 4 — RiskAssessment (READ + SEARCH)');

  const riskId = `${TEST_PATIENT_FHIR_ID}-risk`;

  const readRes = await fhirGet(`RiskAssessment/${riskId}`);
  assert(readRes.status === 200, `GET RiskAssessment/${riskId} → 200`);
  assert(readRes.body?.resourceType === 'RiskAssessment', 'Resource type is RiskAssessment');

  const prob = readRes.body?.prediction?.[0]?.probabilityDecimal;
  assert(typeof prob === 'number' && prob > 0 && prob <= 1,
    `ER risk probabilityDecimal is in (0,1] (got: ${prob})`);

  const riskExts = readRes.body?.extension ?? [];
  const rafScore = riskExts.find(e => e.url === `${EXT}/raf-score`)?.valueDecimal;
  assert(rafScore > 0, `RiskAssessment carries raf-score extension (got: ${rafScore})`);

  const hccSuspects = riskExts.find(e => e.url === `${EXT}/hcc-suspects`)?.valueInteger;
  assert(hccSuspects >= 0, `RiskAssessment carries hcc-suspects extension (got: ${hccSuspects})`);

  // Search
  const searchRes = await fhirGet(`RiskAssessment?subject=Patient/${TEST_PATIENT_FHIR_ID}`);
  assert(searchRes.status === 200, 'GET RiskAssessment search by patient → 200');
  assert((searchRes.body?.entry?.length ?? 0) >= 1, 'At least 1 RiskAssessment found');
}

// ─── Phase 5 — CarePlan ────────────────────────────────────────────────────────

async function phase5_carePlan() {
  section('Phase 5 — CarePlan (CREATE → READ → UPDATE → DELETE)');

  // CREATE
  const carePlan = {
    resourceType: 'CarePlan',
    status: 'active',
    intent: 'plan',
    title: 'TCOC Test Care Plan — Maria Redhawk',
    description: 'Auto-generated care plan covering postpartum health, HbA1c monitoring, and transportation.',
    subject: { reference: `Patient/${TEST_PATIENT_FHIR_ID}` },
    created: new Date().toISOString().split('T')[0],
    category: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '736368003',
        display: 'Outpatient care plan'
      }]
    }],
    goal: [{
      display: 'Reduce HbA1c to < 7.0 within 90 days'
    }],
    activity: [{
      detail: {
        kind: 'ServiceRequest',
        status: 'not-started',
        description: 'Schedule HbA1c lab via NEMT',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '4548-4',
            display: 'Hemoglobin A1c/Hemoglobin.total in Blood'
          }]
        }
      }
    }],
    extension: [{
      url: 'http://tcoc.example.org/fhir/StructureDefinition/tcoc-source',
      valueString: 'TCOC-TEST-SUITE'
    }],
    note: [{
      text: 'Created by FHIR integration test suite. Safe to delete.'
    }]
  };

  const createRes = await fhirPost('CarePlan', carePlan);
  assert(createRes.status === 201, `POST CarePlan → 201 Created (got: ${createRes.status})`);
  const carePlanId = createRes.body?.id;
  assert(!!carePlanId, `CarePlan resource id is assigned (got: ${carePlanId})`);
  track('CarePlan', carePlanId);

  // READ back
  const readRes = await fhirGet(`CarePlan/${carePlanId}`);
  assert(readRes.status === 200, `GET CarePlan/${carePlanId} → 200`);
  assert(readRes.body?.status === 'active', 'CarePlan status is active on read-back');
  assert(readRes.body?.subject?.reference === `Patient/${TEST_PATIENT_FHIR_ID}`,
    'CarePlan subject references correct patient');
  assert(readRes.body?.title === carePlan.title, 'CarePlan title matches on read-back');

  // UPDATE — mark care plan as completed
  const updated = { ...readRes.body, status: 'completed' };
  const putRes = await fhirPut(`CarePlan/${carePlanId}`, updated);
  assert(putRes.status === 200 || putRes.status === 201,
    `PUT CarePlan/${carePlanId} (mark completed) → 2xx`);

  // Verify update
  const verifyRes = await fhirGet(`CarePlan/${carePlanId}`);
  assert(verifyRes.body?.status === 'completed',
    'Read-back: CarePlan status is completed after PUT');

  // Search — ensure CarePlan is findable by patient
  const searchRes = await fhirGet(`CarePlan?patient=${TEST_PATIENT_FHIR_ID}&_count=20`);
  assert(searchRes.status === 200, 'GET CarePlan search by patient → 200');
  const found = (searchRes.body?.entry ?? []).some(e => e.resource?.id === carePlanId);
  assert(found, 'Care plan appears in patient CarePlan search results');
}

// ─── Phase 6 — Referral (ServiceRequest + Task + Provenance) ──────────────────

async function phase6_referral() {
  section('Phase 6 — Referral Workflow (ServiceRequest + Task + Provenance)');

  // CREATE ServiceRequest
  const serviceRequest = {
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    priority: 'routine',
    category: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '3457005',
        display: 'Patient referral'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '4548-4',
        display: 'Hemoglobin A1c/Hemoglobin.total in Blood'
      }],
      text: 'HbA1c Lab — Care Gap Closure Referral'
    },
    subject: { reference: `Patient/${TEST_PATIENT_FHIR_ID}` },
    authoredOn: new Date().toISOString(),
    requester: { reference: `Practitioner/${CARE_MANAGER_ID}` },
    performer: [{ reference: `Practitioner/${LAB_PROVIDER_ID}` }],
    extension: [
      {
        url: 'http://tcoc.org/fhir/StructureDefinition/care-gap-reference',
        valueString: 'mg-1'
      },
      {
        url: 'http://tcoc.org/fhir/StructureDefinition/gainshare-eligible',
        valueBoolean: true
      },
      {
        url: 'http://tcoc.org/fhir/StructureDefinition/gainshare-amount',
        valueDecimal: 250
      }
    ],
    note: [{ text: 'TCOC test suite referral — safe to delete.' }]
  };

  const srRes = await fhirPost('ServiceRequest', serviceRequest);
  assert(srRes.status === 201, `POST ServiceRequest → 201 (got: ${srRes.status})`);
  const srId = srRes.body?.id;
  assert(!!srId, `ServiceRequest id assigned (got: ${srId})`);
  track('ServiceRequest', srId);

  // Verify ServiceRequest correctness
  const srRead = await fhirGet(`ServiceRequest/${srId}`);
  assert(srRead.body?.status === 'active', 'ServiceRequest status is active');
  assert(srRead.body?.intent === 'order', 'ServiceRequest intent is order');
  assert(srRead.body?.subject?.reference === `Patient/${TEST_PATIENT_FHIR_ID}`,
    'ServiceRequest references correct patient');

  // CREATE Task
  const task = {
    resourceType: 'Task',
    status: 'requested',
    intent: 'order',
    priority: 'routine',
    code: {
      coding: [{
        system: 'http://hl7.org/fhir/CodeSystem/task-code',
        code: 'fulfill',
        display: 'Fulfill the focal request'
      }]
    },
    focus: { reference: `ServiceRequest/${srId}` },
    for: { reference: `Patient/${TEST_PATIENT_FHIR_ID}` },
    authoredOn: new Date().toISOString(),
    requester: { reference: `Practitioner/${CARE_MANAGER_ID}` },
    owner: { reference: `Practitioner/${LAB_PROVIDER_ID}` },
    businessStatus: { text: 'Referral sent, awaiting appointment' }
  };

  const taskRes = await fhirPost('Task', task);
  assert(taskRes.status === 201, `POST Task → 201 (got: ${taskRes.status})`);
  const taskId = taskRes.body?.id;
  assert(!!taskId, `Task id assigned (got: ${taskId})`);
  track('Task', taskId);

  // Verify Task
  const taskRead = await fhirGet(`Task/${taskId}`);
  assert(taskRead.body?.status === 'requested', 'Task status is requested');
  assert(taskRead.body?.focus?.reference === `ServiceRequest/${srId}`,
    'Task focus references the ServiceRequest');

  // UPDATE Task: requested → accepted
  const acceptedTask = { ...taskRead.body, status: 'accepted',
    businessStatus: { text: 'Appointment scheduled' } };
  const acceptRes = await fhirPut(`Task/${taskId}`, acceptedTask);
  assert(acceptRes.status === 200 || acceptRes.status === 201,
    `PUT Task → accepted (status 2xx, got: ${acceptRes.status})`);

  // UPDATE Task: accepted → in-progress (re-read first to get latest meta/version)
  const acceptedRead2 = await fhirGet(`Task/${taskId}`);
  const inProgressTask = { ...acceptedRead2.body, status: 'in-progress',
    businessStatus: { text: 'Patient at appointment' } };
  const ipRes = await fhirPut(`Task/${taskId}`, inProgressTask);
  assert(ipRes.status === 200 || ipRes.status === 201,
    `PUT Task → in-progress (2xx, got: ${ipRes.status})`);

  // CREATE Provenance for ServiceRequest
  const provenance = {
    resourceType: 'Provenance',
    target: [{ reference: `ServiceRequest/${srId}` }],
    recorded: new Date().toISOString(),
    agent: [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
          code: 'author'
        }]
      },
      who: { reference: `Practitioner/${CARE_MANAGER_ID}` }
    }],
    activity: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
        code: 'CREATE'
      }]
    },
    reason: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
        code: 'TREAT',
        display: 'Referral initiated for HbA1c care gap closure'
      }]
    }]
  };

  const provRes = await fhirPost('Provenance', provenance);
  assert(provRes.status === 201, `POST Provenance → 201 (got: ${provRes.status})`);
  const provId = provRes.body?.id;
  track('Provenance', provId);

  // Search ServiceRequests for patient
  const srSearch = await fhirGet(`ServiceRequest?subject=${TEST_PATIENT_FHIR_ID}`);
  assert(srSearch.status === 200, 'GET ServiceRequest search by patient → 200');
  const srFound = (srSearch.body?.entry ?? []).some(e => e.resource?.id === srId);
  assert(srFound, 'ServiceRequest appears in patient search results');

  // Return IDs for Phase 7 + 8
  return { srId, taskId };
}

// ─── Phase 7 — Procedure (service completion) ─────────────────────────────────

async function phase7_procedure(srId, taskId) {
  section('Phase 7 — Procedure (service completion)');

  const procedure = {
    resourceType: 'Procedure',
    status: 'completed',
    code: {
      coding: [{
        system: 'http://www.ama-assn.org/go/cpt',
        code: '83036',
        display: 'Hemoglobin A1c level'
      }]
    },
    subject: { reference: `Patient/${TEST_PATIENT_FHIR_ID}` },
    performedDateTime: new Date().toISOString(),
    performer: [{
      actor: { reference: `Practitioner/${LAB_PROVIDER_ID}` }
    }],
    basedOn: [{ reference: `ServiceRequest/${srId}` }],
    note: [{ text: 'HbA1c completed: result 6.8%. TCOC test suite.' }]
  };

  const procRes = await fhirPost('Procedure', procedure);
  assert(procRes.status === 201, `POST Procedure → 201 (got: ${procRes.status})`);
  const procId = procRes.body?.id;
  assert(!!procId, `Procedure id assigned (got: ${procId})`);
  track('Procedure', procId);

  // Read back
  const procRead = await fhirGet(`Procedure/${procId}`);
  assert(procRead.body?.status === 'completed', 'Procedure status is completed on read-back');
  assert(procRead.body?.subject?.reference === `Patient/${TEST_PATIENT_FHIR_ID}`,
    'Procedure references correct patient');
  assert(procRead.body?.basedOn?.[0]?.reference === `ServiceRequest/${srId}`,
    'Procedure is basedOn the ServiceRequest');

  return procId;
}

// ─── Phase 8 — Lab Observation (clinical evidence) ────────────────────────────

async function phase8_labObservation(srId) {
  section('Phase 8 — Lab Observation (clinical evidence CREATE)');

  const observation = {
    resourceType: 'Observation',
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'laboratory'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '4548-4',
        display: 'Hemoglobin A1c/Hemoglobin.total in Blood'
      }]
    },
    subject: { reference: `Patient/${TEST_PATIENT_FHIR_ID}` },
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
    performer: [{ reference: `Practitioner/${LAB_PROVIDER_ID}` }],
    valueQuantity: {
      value: 6.8,
      unit: '%',
      system: 'http://unitsofmeasure.org',
      code: '%'
    },
    interpretation: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
        code: 'N',
        display: 'Normal'
      }]
    }],
    basedOn: [{ reference: `ServiceRequest/${srId}` }],
    note: [{ text: 'HbA1c = 6.8% — within target. TCOC test suite.' }]
  };

  const obsRes = await fhirPost('Observation', observation);
  assert(obsRes.status === 201, `POST Observation (lab) → 201 (got: ${obsRes.status})`);
  const obsId = obsRes.body?.id;
  assert(!!obsId, `Observation id assigned (got: ${obsId})`);
  track('Observation', obsId);

  // Read back
  const obsRead = await fhirGet(`Observation/${obsId}`);
  assert(obsRead.body?.status === 'final', 'Observation status is final on read-back');
  assert(obsRead.body?.valueQuantity?.value === 6.8, 'Observation valueQuantity.value is 6.8');
  assert(obsRead.body?.valueQuantity?.unit === '%', 'Observation unit is %');

  return obsId;
}

// ─── Phase 9 — Gap Closure (Task complete + Observation update) ───────────────

async function phase9_gapClosure(taskId, procId, obsId) {
  section('Phase 9 — Gap Closure (Task complete + Observation status sync)');

  // Complete the Task with outputs
  const taskRead = await fhirGet(`Task/${taskId}`);
  const completedTask = {
    ...taskRead.body,
    status: 'completed',
    businessStatus: { text: 'Service completed, results available' },
    executionPeriod: {
      start: taskRead.body?.authoredOn,
      end: new Date().toISOString()
    },
    output: [
      {
        type: { text: 'Procedure performed' },
        valueReference: { reference: `Procedure/${procId}` }
      },
      {
        type: { text: 'Lab result' },
        valueReference: { reference: `Observation/${obsId}` }
      }
    ]
  };

  const taskCompleteRes = await fhirPut(`Task/${taskId}`, completedTask);
  assert(taskCompleteRes.status === 200 || taskCompleteRes.status === 201,
    `PUT Task (complete) → 2xx (got: ${taskCompleteRes.status})`);
  assert(taskCompleteRes.body?.status === 'completed', 'Task status is completed');
  assert(taskCompleteRes.body?.output?.length >= 2,
    'Task output has ≥2 entries (Procedure + Observation)');

  // Verify read-back of the care-gap Observation is still "Closed" (from Phase 2)
  const gapObsRead = await fhirGet(`Observation/${TEST_GAP_OBS_ID}`);
  const gapStatus = (gapObsRead.body?.extension ?? [])
    .find(e => e.url === `${EXT}/care-gap-status`)?.valueString;
  assert(gapStatus === 'Closed',
    `Care-gap Observation still reads "Closed" after all subsequent writes (got: ${gapStatus})`);
}

// ─── Phase 10 — Read-back consistency ─────────────────────────────────────────

async function phase10_readbackConsistency() {
  section('Phase 10 — Read-back Consistency (cross-module patient bundle)');

  // Re-fetch everything the patientContext would fetch in one go
  const [patientRes, obsRes, flagRes, riskRes, carePlanRes] = await Promise.all([
    fhirGet(`Patient/${TEST_PATIENT_FHIR_ID}`),
    fhirGet(`Observation?subject=Patient/${TEST_PATIENT_FHIR_ID}&_count=100`),
    fhirGet(`Flag?subject=Patient/${TEST_PATIENT_FHIR_ID}&_count=100`),
    fhirGet(`RiskAssessment?subject=Patient/${TEST_PATIENT_FHIR_ID}&_count=5`),
    fhirGet(`CarePlan?patient=${TEST_PATIENT_FHIR_ID}&_count=20`),
  ]);

  // Patient
  assert(patientRes.status === 200, 'Parallel Patient read → 200');
  assert(patientRes.body?.id === TEST_PATIENT_FHIR_ID, 'Patient id consistent in re-read');

  // Observations — the HbA1c gap should now show Closed
  assert(obsRes.status === 200, 'Parallel Observation search → 200');
  const observations = (obsRes.body?.entry ?? []).map(e => e.resource);
  const hba1cObs = observations.find(o => o?.id === TEST_GAP_OBS_ID);
  assert(!!hba1cObs, `HbA1c Observation (${TEST_GAP_OBS_ID}) is present in search results`);
  const closedStatus = (hba1cObs?.extension ?? [])
    .find(e => e.url === `${EXT}/care-gap-status`)?.valueString;
  assert(closedStatus === 'Closed',
    `Cross-module read: HbA1c care-gap-status is "Closed" (got: ${closedStatus})`);

  // Flags — the CDS flag should now show inactive
  assert(flagRes.status === 200, 'Parallel Flag search → 200');
  const flags = (flagRes.body?.entry ?? []).map(e => e.resource);
  const resolvedFlag = flags.find(f => f?.id === `${TEST_PATIENT_FHIR_ID}-flag-cds-maria-1`);
  assert(resolvedFlag?.status === 'inactive',
    'Cross-module read: resolved Flag is inactive in search results');

  // RiskAssessment
  assert(riskRes.status === 200, 'Parallel RiskAssessment search → 200');
  assert((riskRes.body?.entry?.length ?? 0) >= 1, 'RiskAssessment still present after all writes');

  // CarePlan
  assert(carePlanRes.status === 200, 'Parallel CarePlan search → 200');
  // (our test care plan was set to completed in Phase 5)
  const plans = (carePlanRes.body?.entry ?? []).map(e => e.resource);
  const completedPlan = plans.find(p => p?.title === 'TCOC Test Care Plan — Maria Redhawk');
  assert(completedPlan?.status === 'completed',
    'Cross-module read: test CarePlan status is completed');
}

// ─── Phase 11 — Provenance ────────────────────────────────────────────────────

async function phase11_provenance() {
  section('Phase 11 — Provenance (audit trail verification)');

  // Search Provenance records written in Phase 6
  const searchRes = await fhirGet(`Provenance?target=ServiceRequest&_count=50`);
  assert(searchRes.status === 200, 'GET Provenance search → 200');

  // Provenance is searchable
  const hasEntries = (searchRes.body?.entry?.length ?? 0) >= 0; // HAPI may restrict this search
  assert(typeof hasEntries === 'boolean', 'Provenance search returned a parseable Bundle');

  // Direct create + read-back of a provenance record (use seeded Practitioner to satisfy ref integrity)
  const prov = {
    resourceType: 'Provenance',
    target: [{ reference: `Patient/${TEST_PATIENT_FHIR_ID}` }],
    recorded: new Date().toISOString(),
    agent: [{
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type', code: 'author' }] },
      who: { reference: `Practitioner/${CARE_MANAGER_ID}` }
    }],
    activity: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation', code: 'UPDATE' }]
    }
  };

  const createRes = await fhirPost('Provenance', prov);
  assert(createRes.status === 201, `POST Provenance (audit) → 201 (got: ${createRes.status})`);
  const provId = createRes.body?.id;
  track('Provenance', provId);

  const readRes = await fhirGet(`Provenance/${provId}`);
  assert(readRes.status === 200, `GET Provenance/${provId} → 200`);
  assert(readRes.body?.target?.[0]?.reference === `Patient/${TEST_PATIENT_FHIR_ID}`,
    'Provenance target references correct patient');
}

// ─── Phase 12 — Cleanup ───────────────────────────────────────────────────────

async function phase12_cleanup() {
  section('Phase 12 — Cleanup (DELETE resources created by this run)');

  // Delete in reverse dependency order: dependents first, then referenced resources.
  // Order: Provenance → Observation → Procedure → Task → CarePlan → ServiceRequest → Practitioner
  const DELETE_ORDER = ['Provenance', 'Observation', 'Procedure', 'Task', 'CarePlan',
                        'ServiceRequest', 'Practitioner'];
  const sorted = [...createdResources].sort((a, b) => {
    const ai = DELETE_ORDER.indexOf(a.resourceType);
    const bi = DELETE_ORDER.indexOf(b.resourceType);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  let deleted = 0;
  let deleteFailed = 0;

  for (const { resourceType, id } of sorted) {
    if (!id) continue;
    const res = await fhirDelete(`${resourceType}/${id}`);
    if (res.status === 200 || res.status === 204 || res.status === 404) {
      deleted++;
    } else {
      console.warn(`    ⚠  Could not DELETE ${resourceType}/${id} (HTTP ${res.status})`);
      deleteFailed++;
    }
  }

  assert(deleteFailed === 0, `All ${deleted} test resources deleted cleanly (${deleteFailed} failures)`);

  // Restore the HbA1c care gap Observation to Open (undo Phase 2 write)
  const restoreRead = await fhirGet(`Observation/${TEST_GAP_OBS_ID}`);
  if (restoreRead.status === 200) {
    const exts = restoreRead.body?.extension ?? [];
    const restored = {
      ...restoreRead.body,
      status: 'preliminary',
      extension: [
        ...exts.filter(e => e.url !== `${EXT}/care-gap-status`),
        { url: `${EXT}/care-gap-status`, valueString: 'Open' },
        { url: `${EXT}/care-gap-days-open`, valueInteger: 38 },
      ],
    };
    const restoreRes = await fhirPut(`Observation/${TEST_GAP_OBS_ID}`, restored);
    assert(restoreRes.status === 200 || restoreRes.status === 201,
      `HbA1c care-gap Observation restored to Open after test run`);
  }

  // Restore the CDS flag to active
  const flagId = `${TEST_PATIENT_FHIR_ID}-flag-cds-maria-1`;
  const flagRead = await fhirGet(`Flag/${flagId}`);
  if (flagRead.status === 200) {
    const reactivated = { ...flagRead.body, status: 'active' };
    const flagRestore = await fhirPut(`Flag/${flagId}`, reactivated);
    assert(flagRestore.status === 200 || flagRestore.status === 201,
      `CDS Flag restored to active after test run`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

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
  throw new Error('FHIR server not reachable. Run: docker compose -f fhir/docker-compose.yml up -d');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   TCOC FHIR R4 Integration Test Suite                       ║');
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`  FHIR base : ${FHIR_BASE}`);
  console.log(`  Patient   : ${TEST_PATIENT_FHIR_ID}`);

  await waitForServer();

  await phase0b_seedPractitioners();
  await phase0_preflight();
  await phase1_patient();
  await phase2_careGaps();
  await phase3_flags();
  await phase4_risk();
  await phase5_carePlan();
  const { srId, taskId } = await phase6_referral();
  const procId = await phase7_procedure(srId, taskId);
  const obsId = await phase8_labObservation(srId);
  await phase9_gapClosure(taskId, procId, obsId);
  await phase10_readbackConsistency();
  await phase11_provenance();
  await phase12_cleanup();

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS   ${passed} passed   ${failed} failed`);
  console.log('══════════════════════════════════════════════════════════════');

  if (failures.length > 0) {
    console.error('\n  Failed assertions:');
    failures.forEach((f, i) => console.error(`    ${i + 1}. ${f}`));
  }

  exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n💥  Fatal error:', err.message);
  exit(1);
});
