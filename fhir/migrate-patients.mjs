#!/usr/bin/env node
/**
 * TCOC → HAPI FHIR R4 Patient Migration Script
 *
 * Converts all patients in src/lib/patientRegistry.ts into FHIR R4 resources
 * and uploads them to the local HAPI FHIR server via FHIR transaction bundles.
 *
 * Prerequisites:
 *   • HAPI FHIR server running at http://localhost:8080/fhir
 *     (docker compose -f fhir/docker-compose.yml up -d)
 *
 * Usage:
 *   node fhir/migrate-patients.mjs [--fhir-url http://localhost:8080/fhir]
 *
 * Each patient yields the following FHIR R4 resources:
 *   • Patient            — demographics, identifiers, contact
 *   • Observation (×N)  — care gaps surfaced as clinical observations
 *   • Flag (×N)         — CDS alert cards as FHIR Flags
 *   • RiskAssessment     — RAF score + ER risk %
 */

import { argv } from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

// ─── Configuration ────────────────────────────────────────────────────────────
const argIdx = argv.indexOf('--fhir-url');
const FHIR_BASE = argIdx !== -1 ? argv[argIdx + 1] : 'http://localhost:8080/fhir';

// ─── Source patient data (mirrors src/lib/patientRegistry.ts) ─────────────────
const PATIENTS = [
  {
    platformId: 'MARIA_SD_001',
    fhirId: 'patient-maria-001',
    ehrMrn: 'MARIA_SD_001',
    name: 'Maria Redhawk',
    age: 34,
    gender: 'F',
    dob: '1992-06-15',
    phone: '(605) 555-0234',
    location: 'Martin, SD 57551',
    pcp: 'Bennett County Health',
    careManager: 'Sarah Johnson',
    organization: 'Bennett County Health (CAH)',
    contract: 'SD Medicaid',
    rafScore: 2.18,
    riskTier: 'Moderate',
    erRiskPct: 42,
    hccSuspects: 3,
    hccValue: 12400,
    pmpm: 1240,
    pmpmTarget: 780,
    episodeType: 'Postpartum Health',
    language: 'English',
    careGaps: [
      { id: 'mg-1', domain: 'Clinical', name: 'HbA1c Lab', status: 'Open', daysOpen: 38 },
      { id: 'mg-2', domain: 'Clinical', name: 'Edinburgh PND Screening', status: 'Open', daysOpen: 427 },
      { id: 'mg-4', domain: 'BH', name: 'Postpartum Depression Follow-up', status: 'In Progress', daysOpen: 427 },
      { id: 'mg-6', domain: 'Social', name: 'Transportation Barrier Resolution', status: 'In Progress', daysOpen: 38 },
      { id: 'mg-7', domain: 'Social', name: 'Childcare Subsidy Enrollment', status: 'Open', daysOpen: 60 },
    ],
    cdsCards: [
      { id: 'cds-maria-1', indicator: 'critical', summary: 'Edinburgh PND overdue 427 days — postpartum depression untreated', detail: 'Postpartum depression screening shows Edinburgh PND score 11 (Moderate). Immediate follow-up required.' },
      { id: 'cds-maria-2', indicator: 'warning', summary: 'HbA1c gap 38 days — pre-diabetes monitoring critical', detail: 'Pre-diabetic HbA1c recheck is 38 days overdue. Consider NEMT enrollment.' },
    ],
  },
  {
    platformId: 'PAT-0042',
    fhirId: 'patient-dorothy-042',
    ehrMrn: 'MRN-0042',
    name: 'Dorothy Simmons',
    age: 75,
    gender: 'F',
    dob: '1951-03-14',
    phone: '(417) 555-0198',
    location: 'Ozark Regional FQHC Service Area',
    pcp: 'Dr. Whitfield',
    careManager: 'Sarah Johnson',
    organization: 'Ozark Regional FQHC',
    contract: 'MSSP Trk 3',
    rafScore: 3.42,
    riskTier: 'Critical',
    erRiskPct: 84,
    hccSuspects: 4,
    hccValue: 24800,
    pmpm: 2840,
    pmpmTarget: 890,
    episodeType: 'COPD Exacerbation',
    language: 'English',
    careGaps: [
      { id: 'gap-1', domain: 'Clinical', name: 'Spirometry (COPD)', status: 'Open', daysOpen: 42 },
      { id: 'gap-4', domain: 'Clinical', name: 'A1C Recheck', status: 'Open', daysOpen: 61 },
      { id: 'gap-7', domain: 'BH', name: 'PHQ-9 Follow-up', status: 'In Progress', daysOpen: 21 },
      { id: 'gap-9', domain: 'Social', name: 'Transport Referral — Active', status: 'In Progress', daysOpen: 18 },
    ],
    cdsCards: [
      { id: 'cds-dorothy-1', indicator: 'critical', summary: 'PHQ-9 14 — BH referral open since Mar 15, not engaged', detail: 'Moderate depression. BH referral to Cascade Valley BH sent Mar 15 — not engaged.' },
      { id: 'cds-dorothy-2', indicator: 'warning', summary: 'COPD Exacerbation — spirometry overdue 42 days', detail: 'Active COPD exacerbation episode. Follow-up within 7 days required per care plan.' },
    ],
  },
  {
    platformId: 'PAT-0087',
    fhirId: 'patient-james-087',
    ehrMrn: 'MRN-0087',
    name: 'James Wilson',
    age: 58,
    gender: 'M',
    dob: '1968-07-14',
    phone: '(605) 555-0223',
    location: 'Rural Route 2, Winner SD 57580',
    pcp: 'Dr. Okonkwo',
    careManager: 'Sarah Johnson',
    organization: 'Winner Regional Medical Center',
    contract: 'Medicaid RHTP Track 3',
    rafScore: 2.8,
    riskTier: 'High',
    erRiskPct: 67,
    hccSuspects: 3,
    hccValue: 18600,
    pmpm: 1840,
    pmpmTarget: 1200,
    episodeType: 'Diabetes · CHF',
    language: 'English',
    careGaps: [
      { id: 'jw-1', domain: 'Clinical', name: 'A1C Recheck (Diabetes)', status: 'Open', daysOpen: 45 },
      { id: 'jw-2', domain: 'Clinical', name: 'BNP Lab Panel (CHF)', status: 'Open', daysOpen: 22 },
      { id: 'jw-5', domain: 'BH', name: 'PHQ-9 Follow-up', status: 'Open', daysOpen: 30 },
      { id: 'jw-6', domain: 'Social', name: 'Transportation — Specialist Visits', status: 'Open', daysOpen: 45 },
    ],
    cdsCards: [
      { id: 'cds-james-1', indicator: 'warning', summary: 'A1C overdue 45 days — diabetes management gap', detail: 'Diabetic A1C recheck is 45 days overdue. Bundle labs to reduce patient travel burden.' },
      { id: 'cds-james-2', indicator: 'warning', summary: 'BNP panel overdue 22 days — CHF monitoring gap', detail: 'CHF monitoring BNP panel is 22 days overdue. Active CHF episode (89 days).' },
    ],
  },
  {
    platformId: 'PAT-0103',
    fhirId: 'patient-robert-103',
    ehrMrn: 'MRN-0103',
    name: 'Robert Chen',
    age: 62,
    gender: 'M',
    dob: '1964-11-03',
    phone: '(605) 555-0334',
    location: '847 Oak Street, Rapid City SD 57701',
    pcp: 'Dr. Castillo',
    careManager: 'Sarah Johnson',
    organization: 'Rapid City Regional Health',
    contract: 'Medicaid RHTP Track 3',
    rafScore: 1.9,
    riskTier: 'High',
    erRiskPct: 52,
    hccSuspects: 2,
    hccValue: 11200,
    pmpm: 980,
    pmpmTarget: 750,
    episodeType: 'Hypertension · CKD',
    language: 'English / Mandarin',
    careGaps: [
      { id: 'rc-1', domain: 'Clinical', name: 'BP Control Check', status: 'Open', daysOpen: 28 },
      { id: 'rc-2', domain: 'Clinical', name: 'eGFR / Creatinine (CKD)', status: 'Open', daysOpen: 42 },
      { id: 'rc-4', domain: 'BH', name: 'AUDIT-C Follow-up Counseling', status: 'Open', daysOpen: 21 },
    ],
    cdsCards: [
      { id: 'cds-robert-1', indicator: 'warning', summary: 'BP control check overdue 28 days — hypertension gap', detail: 'Last BP reading 158/96. Target <130/80. CKD makes BP control critical.' },
      { id: 'cds-robert-2', indicator: 'warning', summary: 'eGFR overdue 42 days — CKD monitoring gap', detail: 'CKD monitoring labs overdue. Last eGFR 42 (Stage 3b). Nephrology referral recommended.' },
    ],
  },
  {
    platformId: 'PAT-0156',
    fhirId: 'patient-lisa-156',
    ehrMrn: 'MRN-0156',
    name: 'Lisa Thompson',
    age: 41,
    gender: 'F',
    dob: '1985-05-19',
    phone: '(605) 555-0412',
    location: '223 Pine Ave, Sioux Falls SD 57104',
    pcp: 'Dr. Torres',
    careManager: 'Sarah Johnson',
    organization: 'Sioux Falls Community Health',
    contract: 'Medicaid RHTP Track 3',
    rafScore: 1.4,
    riskTier: 'Moderate',
    erRiskPct: 31,
    hccSuspects: 1,
    hccValue: 5800,
    pmpm: 620,
    pmpmTarget: 480,
    episodeType: 'Asthma · Obesity',
    language: 'English',
    careGaps: [
      { id: 'lt-1', domain: 'Clinical', name: 'Asthma Action Plan Update', status: 'Open', daysOpen: 35 },
      { id: 'lt-2', domain: 'Clinical', name: 'BMI / Weight Management Referral', status: 'In Progress', daysOpen: 60 },
      { id: 'lt-3', domain: 'BH', name: 'PHQ-9 Annual Screening', status: 'Open', daysOpen: 18 },
      { id: 'lt-4', domain: 'Social', name: 'Nutrition Counseling Enrollment', status: 'Open', daysOpen: 45 },
    ],
    cdsCards: [
      { id: 'cds-lisa-1', indicator: 'info', summary: 'Asthma action plan update overdue 35 days', detail: 'Annual asthma action plan review is 35 days overdue. Consider spirometry.' },
      { id: 'cds-lisa-2', indicator: 'info', summary: 'Weight management referral in progress — BMI elevated', detail: 'BMI elevated. SNAP-Ed nutrition counseling eligible.' },
    ],
  },
];

// ─── FHIR R4 Resource Builders ────────────────────────────────────────────────

function buildGender(g) {
  return g === 'M' ? 'male' : g === 'F' ? 'female' : 'unknown';
}

/** Build a FHIR R4 Patient resource */
function buildPatient(p) {
  const [family, ...givenParts] = p.name.split(' ').reverse();
  const given = givenParts.reverse();
  return {
    resourceType: 'Patient',
    id: p.fhirId,
    identifier: [
      { system: 'urn:tcoc:platform-id', value: p.platformId },
      { system: 'urn:tcoc:ehr-mrn', value: p.ehrMrn },
    ],
    name: [{ use: 'official', family, given }],
    gender: buildGender(p.gender),
    birthDate: p.dob,
    telecom: [{ system: 'phone', value: p.phone, use: 'home' }],
    address: [{ use: 'home', text: p.location }],
    communication: [
      {
        language: {
          coding: [{ system: 'urn:ietf:bcp:47', code: p.language.startsWith('English') ? 'en' : 'zh' }],
          text: p.language,
        },
        preferred: true,
      },
    ],
    extension: [
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/raf-score',
        valueDecimal: p.rafScore,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/risk-tier',
        valueString: p.riskTier,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/er-risk-pct',
        valueInteger: p.erRiskPct,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/care-manager',
        valueString: p.careManager,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/episode-type',
        valueString: p.episodeType,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/pmpm',
        valueDecimal: p.pmpm,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/pmpm-target',
        valueDecimal: p.pmpmTarget,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/contract',
        valueString: p.contract,
      },
    ],
    managingOrganization: { display: p.organization },
    generalPractitioner: [{ display: p.pcp }],
  };
}

/** Build a FHIR R4 Observation for a care gap */
function buildCareGapObservation(p, gap) {
  const statusMap = {
    Open: 'preliminary',
    'In Progress': 'registered',
    Closed: 'final',
    Waived: 'cancelled',
  };
  const categoryCode = gap.domain === 'Clinical' ? '11503-0' : gap.domain === 'BH' ? '75626-2' : '75630-4';
  return {
    resourceType: 'Observation',
    id: `${p.fhirId}-gap-${gap.id}`,
    status: statusMap[gap.status] ?? 'preliminary',
    category: [
      {
        coding: [
          { system: 'http://loinc.org', code: categoryCode, display: gap.domain + ' Care Gap' },
        ],
      },
    ],
    code: { text: gap.name },
    subject: { reference: `Patient/${p.fhirId}` },
    valueInteger: gap.daysOpen,
    note: [{ text: `Care gap open for ${gap.daysOpen} days. Domain: ${gap.domain}. Status: ${gap.status}.` }],
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-gap-domain', valueString: gap.domain },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-gap-status', valueString: gap.status },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-gap-days-open', valueInteger: gap.daysOpen },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/tcoc-gap-id', valueString: gap.id },
    ],
  };
}

/** Build a FHIR R4 Flag for a CDS alert card */
function buildCdsFlag(p, card) {
  const severityMap = { critical: 'error', warning: 'warning', info: 'information' };
  return {
    resourceType: 'Flag',
    id: `${p.fhirId}-flag-${card.id}`,
    status: 'active',
    category: [
      {
        coding: [
          { system: 'http://terminology.hl7.org/CodeSystem/flag-category', code: 'clinical', display: 'Clinical' },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://tcoc.example.org/fhir/CodeSystem/cds-indicator',
          code: card.indicator,
          display: severityMap[card.indicator],
        },
      ],
      text: card.summary,
    },
    subject: { reference: `Patient/${p.fhirId}` },
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/cds-detail', valueString: card.detail },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/tcoc-cds-id', valueString: card.id },
    ],
  };
}

/** Build a FHIR R4 RiskAssessment */
function buildRiskAssessment(p) {
  return {
    resourceType: 'RiskAssessment',
    id: `${p.fhirId}-risk`,
    status: 'final',
    subject: { reference: `Patient/${p.fhirId}` },
    prediction: [
      {
        outcome: { text: 'Emergency Room Visit' },
        probabilityDecimal: p.erRiskPct / 100,
        rationale: `Predicted ER risk ${p.erRiskPct}% based on RAF score ${p.rafScore} and clinical profile.`,
      },
    ],
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/raf-score', valueDecimal: p.rafScore },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/hcc-suspects', valueInteger: p.hccSuspects },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/hcc-value', valueDecimal: p.hccValue },
    ],
  };
}

/** Assemble a FHIR transaction Bundle for one patient */
function buildTransactionBundle(p) {
  const entries = [];

  // Patient resource (upsert via conditional PUT)
  entries.push({
    resource: buildPatient(p),
    request: { method: 'PUT', url: `Patient/${p.fhirId}` },
  });

  // Care gap observations
  for (const gap of p.careGaps) {
    const obs = buildCareGapObservation(p, gap);
    entries.push({ resource: obs, request: { method: 'PUT', url: `Observation/${obs.id}` } });
  }

  // CDS alert flags
  for (const card of p.cdsCards) {
    const flag = buildCdsFlag(p, card);
    entries.push({ resource: flag, request: { method: 'PUT', url: `Flag/${flag.id}` } });
  }

  // Risk assessment
  const risk = buildRiskAssessment(p);
  entries.push({ resource: risk, request: { method: 'PUT', url: `RiskAssessment/${risk.id}` } });

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries,
  };
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function postBundle(bundle) {
  const res = await fetch(FHIR_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function waitForServer(maxAttempts = 30) {
  console.log(`⏳  Waiting for HAPI FHIR server at ${FHIR_BASE} …`);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${FHIR_BASE}/metadata`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        console.log('✅  Server is ready.\n');
        return;
      }
    } catch {
      // not ready yet
    }
    await sleep(3000);
    process.stdout.write('.');
  }
  throw new Error(`Server not reachable after ${maxAttempts} attempts. Is docker compose running?`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   TCOC → HAPI FHIR R4  Patient Migration                ║');
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log(`FHIR base URL : ${FHIR_BASE}`);
  console.log(`Patients      : ${PATIENTS.length}\n`);

  await waitForServer();

  let success = 0;
  let failed = 0;

  for (const p of PATIENTS) {
    process.stdout.write(`  → ${p.name.padEnd(20)} (${p.platformId}) … `);
    try {
      const bundle = buildTransactionBundle(p);
      const result = await postBundle(bundle);
      const resourceCount = result.entry?.length ?? '?';
      console.log(`✅  ${resourceCount} resources`);
      success++;
    } catch (err) {
      console.log(`❌  ${err.message}`);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────────────────`);
  console.log(`  Migrated : ${success} / ${PATIENTS.length} patients`);
  if (failed > 0) console.log(`  Failed   : ${failed}`);
  console.log(`\n  View patients : ${FHIR_BASE}/Patient?_count=20`);
  console.log(`  HAPI web UI   : ${FHIR_BASE.replace('/fhir', '')}`);
}

main().catch((err) => {
  console.error('\n💥  Fatal:', err.message);
  process.exit(1);
});
