/**
 * Dev-mock demonstration stubs (mock data demonstration).
 *
 * When ALLOW_DEV_MOCK_AUTH=true and the WSO2/Ballerina backbone is not present,
 * the operation-driven flows ($member-match, CRD, $questionnaire-package, bulk
 * export, PAS) have no server to answer them. These canned responses let ALL
 * FOUR provisions be demonstrated offline on mock data. They are gated strictly
 * by devMockEnabled() and never fire in production.
 *
 * Per-patient mock data:
 *   MARIA_SD_001 — lumbar MRI / postpartum / rural SD
 *   PAT-0042     — Dorothy Simmons / COPD+CHF+T2DM / Cardiac MRI
 *   PAT-0087     — James Wilson / CHF+T2DM / BNP panel + echocardiogram
 *   PAT-0103     — Robert Chen / CKD+diabetes / nephrology referral
 *   PAT-0156     — Lisa Thompson / asthma / pulmonology referral
 */
import { serverEnv } from './env';
import type { CdsCard } from './cdsClient';

export function devMockEnabled(): boolean {
  return serverEnv().allowDevMockAuth === true;
}

// ─── Per-patient profiles ─────────────────────────────────────────────────────

interface PatientProfile {
  name: string;
  dob: string;
  gender: string;
  priorPayer: string;
  priorMemberId: string;
  priorCoverageStart: string;
  priorCoverageEnd: string;
  eobCount: number;
  claimCount: number;
  claimResponseCount: number;  // PA history transferred
  conditionCount: number;
  medicationCount: number;
  observationCount: number;
  procedureCount: number;
  encounterCount: number;
  coverageCount: number;
  paHistory: Array<{ service: string; cpt: string; decision: 'approved' | 'denied'; denialReason?: string; authNumber?: string; date: string }>;
  newConditionsAdded: number;
  coverageGapsResolved: number;
  /** Primary PA scenario for DTR / CRD / PAS */
  paScenario: {
    cptCode: string;
    procedureName: string;
    policyTitle: string;
    allMet: boolean;
  };
}

const PATIENT_PROFILES: Record<string, PatientProfile> = {
  MARIA_SD_001: {
    name: 'Maria Redhawk',
    dob: '1992-06-15',
    gender: 'female',
    priorPayer: 'Aetna Medicaid SD',
    priorMemberId: 'AETNA-MBR-00182734',
    priorCoverageStart: '2019-01-01',
    priorCoverageEnd: '2024-01-31',
    eobCount: 412,
    claimCount: 388,
    claimResponseCount: 19,
    conditionCount: 8,
    medicationCount: 12,
    observationCount: 64,
    procedureCount: 31,
    encounterCount: 87,
    coverageCount: 3,
    paHistory: [
      { service: 'MRI Lumbar Spine w/o Contrast', cpt: '72148', decision: 'denied', denialReason: 'Conservative therapy not documented', date: '2023-08-12' },
      { service: 'Physical Therapy (16 sessions)', cpt: '97110', decision: 'approved', authNumber: 'AT-2022-00441', date: '2022-03-04' },
      { service: 'Prenatal Ultrasound — 20-Week Anatomy', cpt: '76805', decision: 'approved', authNumber: 'AT-2022-00882', date: '2022-06-18' },
    ],
    newConditionsAdded: 3,
    coverageGapsResolved: 1,
    paScenario: { cptCode: '72148', procedureName: 'MRI Lumbar Spine w/o Contrast', policyTitle: 'MRI Lumbar Spine — Medical Necessity Policy (CPT 72148)', allMet: false },
  },
  'PAT-0042': {
    name: 'Dorothy Simmons',
    dob: '1951-03-14',
    gender: 'female',
    priorPayer: 'UnitedHealthcare Community Plan MO',
    priorMemberId: 'UHC-MBR-00487291',
    priorCoverageStart: '2019-01-01',
    priorCoverageEnd: '2023-12-31',
    eobCount: 847,
    claimCount: 791,
    claimResponseCount: 42,
    conditionCount: 14,
    medicationCount: 31,
    observationCount: 156,
    procedureCount: 67,
    encounterCount: 203,
    coverageCount: 4,
    paHistory: [
      { service: 'Cardiac MRI w/ and w/o contrast', cpt: '75561', decision: 'denied', denialReason: 'Echocardiogram not attempted first', date: '2023-04-19' },
      { service: 'Cardiac MRI — resubmission after echo', cpt: '75561', decision: 'approved', authNumber: 'UHC-2023-04881', date: '2023-07-02' },
      { service: 'Home health aide (12 visits)', cpt: '99500', decision: 'approved', authNumber: 'UHC-2022-18934', date: '2022-09-14' },
      { service: 'Spirometry (COPD monitoring)', cpt: '94010', decision: 'approved', authNumber: 'UHC-2023-00221', date: '2023-01-08' },
    ],
    newConditionsAdded: 4,
    coverageGapsResolved: 2,
    paScenario: { cptCode: '75561', procedureName: 'Cardiac MRI w/ and w/o contrast', policyTitle: 'Cardiac MRI — Medical Necessity Policy (CPT 75561)', allMet: false },
  },
  'PAT-0087': {
    name: 'James Wilson',
    dob: '1968-07-14',
    gender: 'male',
    priorPayer: 'Molina Healthcare of South Dakota',
    priorMemberId: 'MOL-MBR-00294817',
    priorCoverageStart: '2019-01-01',
    priorCoverageEnd: '2023-06-30',
    eobCount: 531,
    claimCount: 502,
    claimResponseCount: 27,
    conditionCount: 9,
    medicationCount: 19,
    observationCount: 98,
    procedureCount: 44,
    encounterCount: 134,
    coverageCount: 3,
    paHistory: [
      { service: 'BNP / Pro-BNP Lab Panel (CHF monitoring)', cpt: '83880', decision: 'approved', authNumber: 'MOL-2022-03312', date: '2022-11-22' },
      { service: 'Echocardiogram (complete)', cpt: '93306', decision: 'denied', denialReason: 'Not medically necessary — stable CHF', date: '2023-02-17' },
      { service: 'Diabetes education program (10 hrs)', cpt: '98960', decision: 'approved', authNumber: 'MOL-2021-00771', date: '2021-05-03' },
    ],
    newConditionsAdded: 2,
    coverageGapsResolved: 1,
    paScenario: { cptCode: '93306', procedureName: 'Echocardiogram (complete transthoracic)', policyTitle: 'Echocardiogram — Medical Necessity Policy (CPT 93306)', allMet: true },
  },
  'PAT-0103': {
    name: 'Robert Chen',
    dob: '1959-11-02',
    gender: 'male',
    priorPayer: 'Anthem BCBS South Dakota',
    priorMemberId: 'ANTH-MBR-00731028',
    priorCoverageStart: '2019-01-01',
    priorCoverageEnd: '2024-03-31',
    eobCount: 623,
    claimCount: 589,
    claimResponseCount: 33,
    conditionCount: 11,
    medicationCount: 22,
    observationCount: 112,
    procedureCount: 51,
    encounterCount: 161,
    coverageCount: 3,
    paHistory: [
      { service: 'Nephrology consult', cpt: '99243', decision: 'approved', authNumber: 'ANTH-2022-00992', date: '2022-08-30' },
      { service: 'Kidney biopsy', cpt: '50200', decision: 'denied', denialReason: 'Step therapy — ACE inhibitor trial required first', date: '2023-06-11' },
    ],
    newConditionsAdded: 3,
    coverageGapsResolved: 1,
    paScenario: { cptCode: '99243', procedureName: 'Nephrology office consultation', policyTitle: 'Specialty Consult — Medical Necessity Policy (CPT 99243)', allMet: true },
  },
  'PAT-0156': {
    name: 'Lisa Thompson',
    dob: '1974-05-28',
    gender: 'female',
    priorPayer: 'Meridian Health Plan SD',
    priorMemberId: 'MER-MBR-00118847',
    priorCoverageStart: '2019-01-01',
    priorCoverageEnd: '2023-09-30',
    eobCount: 289,
    claimCount: 271,
    claimResponseCount: 14,
    conditionCount: 6,
    medicationCount: 9,
    observationCount: 48,
    procedureCount: 22,
    encounterCount: 73,
    coverageCount: 2,
    paHistory: [
      { service: 'Pulmonology consult — severe asthma', cpt: '99244', decision: 'approved', authNumber: 'MER-2022-01104', date: '2022-04-20' },
      { service: 'Monoclonal antibody (dupilumab) — asthma', cpt: 'J0222', decision: 'denied', denialReason: 'Step therapy — 2 biologic trials required', date: '2023-03-15' },
    ],
    newConditionsAdded: 1,
    coverageGapsResolved: 1,
    paScenario: { cptCode: '99244', procedureName: 'Pulmonology office consultation', policyTitle: 'Specialty Consult — Medical Necessity Policy (CPT 99244)', allMet: true },
  },
};

function profileFor(patientId: string): PatientProfile {
  return PATIENT_PROFILES[patientId] ?? PATIENT_PROFILES['MARIA_SD_001'];
}

// ─── CRD ─────────────────────────────────────────────────────────────────────

/** CRD cards — patient-aware; defaults to lumbar MRI for MARIA_SD_001. */
export function devCrdCards(patientId?: string): CdsCard[] {
  const p = profileFor(patientId ?? 'MARIA_SD_001');
  return [
    {
      summary: `Prior authorization required: ${p.paScenario.procedureName} (CPT ${p.paScenario.cptCode})`,
      indicator: 'critical',
      detail: `Payer coverage policy requires documentation review. Complete the DTR questionnaire to proceed with ${p.paScenario.procedureName}.`,
      links: [{ label: 'Open documentation (DTR)', url: '/prior-auth', type: 'smart' }],
    },
    {
      summary: 'Alternative covered without prior authorization — see policy',
      indicator: 'info',
    },
  ];
}

// ─── DTR ─────────────────────────────────────────────────────────────────────

/** DTR policy evaluation — full per-patient scenarios. */
export function devDtrEvaluation(patientId: string, cptCode: string): unknown {
  const p = profileFor(patientId);

  if (patientId === 'PAT-0042' || cptCode === '75561') {
    return {
      policyTitle: 'Cardiac MRI — Medical Necessity Policy (CPT 75561)',
      cptCode,
      allMet: false,
      groups: [
        {
          id: 1, title: 'Echocardiogram Performed First', status: 'met', required: true,
          description: 'Standard echocardiogram must be attempted before advanced cardiac imaging.',
          fhirQuery: { resourceType: 'Procedure', searchParam: 'code', system: 'http://www.ama-assn.org/go/cpt', codes: ['93306', '93307'] },
          sourceExcerpt: 'Cardiac MRI is appropriate when echocardiogram has been performed and clinical question remains unanswered.',
          leaf: { code: 'CPT 93306', label: 'Echocardiogram — complete', evidence: 'Echocardiogram performed 2026-03-12, EF 35%', source: 'emr', recordedDate: '2026-03-12', performerName: 'Dr. Nakamura' },
        },
        {
          id: 2, title: 'Documented Cardiac Condition (CHF / CAD / Cardiomyopathy)', status: 'met', required: true,
          description: 'A documented cardiac diagnosis must be present justifying advanced imaging.',
          fhirQuery: { resourceType: 'Condition', searchParam: 'code', system: 'http://hl7.org/fhir/sid/icd-10-cm', codes: ['I50.32', 'I25.10', 'I42.0'] },
          sourceExcerpt: 'Cardiac MRI is indicated for patients with known or suspected structural heart disease.',
          leaf: { code: 'I50.32', label: 'Chronic diastolic heart failure', evidence: 'Active diagnosis since 2019-03', source: 'emr' },
        },
        {
          id: 3, title: 'Clinical Justification — Beyond Echocardiogram', status: 'gap', required: true,
          description: 'Documentation must explain why echocardiogram is insufficient and what clinical question MRI will answer.',
          fhirQuery: { resourceType: 'Condition', searchParam: 'code', system: 'http://hl7.org/fhir/sid/icd-10-cm', codes: ['I50.32'] },
          sourceExcerpt: 'Clinical note must document specific question that requires cardiac MRI beyond echocardiogram findings.',
          candidateCodes: [
            { code: 'I50.32', system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Chronic diastolic CHF — EF 35%' },
            { code: 'I25.10', system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Atherosclerotic heart disease' },
          ],
        },
      ],
    };
  }

  if (patientId === 'PAT-0087' || cptCode === '93306') {
    return {
      policyTitle: 'Echocardiogram — Medical Necessity Policy (CPT 93306)',
      cptCode,
      allMet: true,
      groups: [
        {
          id: 1, title: 'Documented Heart Failure or Cardiac Symptom', status: 'met', required: true,
          description: 'Echocardiogram is appropriate for documented CHF or new cardiac symptoms.',
          leaf: { code: 'I50.9', label: 'Heart failure, unspecified', evidence: 'CHF active since 2021-06-11', source: 'emr' },
          sourceExcerpt: 'Echocardiogram indicated for evaluation and monitoring of known or suspected heart failure.',
          fhirQuery: { resourceType: 'Condition', searchParam: 'code', system: 'http://hl7.org/fhir/sid/icd-10-cm', codes: ['I50.9', 'I50.32', 'I50.1'] },
        },
        {
          id: 2, title: 'Not Repeated Within 12 Months Without New Indication', status: 'met', required: true,
          description: 'Repeat echocardiogram requires new clinical indication if performed within 12 months.',
          leaf: { code: 'CPT 93306', label: 'Last echo: 2025-06-01', evidence: 'Prior echo > 12 months ago', source: 'claims' },
          sourceExcerpt: 'Routine repeat echocardiogram within 12 months of prior study requires documentation of changed clinical status.',
          fhirQuery: { resourceType: 'Procedure', searchParam: 'code', system: 'http://www.ama-assn.org/go/cpt', codes: ['93306'] },
        },
      ],
    };
  }

  // Default: Maria's lumbar MRI
  return mariaMock(cptCode);
}

// ─── $member-match ────────────────────────────────────────────────────────────

/** A canned $member-match result identifying the seeded demo member. */
export function devMemberMatch(patientId?: string): unknown {
  const p = profileFor(patientId ?? 'MARIA_SD_001');
  return {
    resourceType: 'Parameters',
    parameter: [
      {
        name: 'MemberPatient',
        resource: {
          resourceType: 'Patient',
          id: patientId ?? 'MARIA_SD_001',
          name: [{ family: p.name.split(' ').pop(), given: [p.name.split(' ')[0]] }],
          birthDate: p.dob,
          gender: p.gender,
          identifier: [{ system: 'https://rhtp.example/prior-payer-id', value: p.priorMemberId }],
        },
      },
    ],
  };
}

// ─── Bulk Export ──────────────────────────────────────────────────────────────

export function devBulkStart(): { jobId: string } {
  return { jobId: 'dev-p2p-job-001' };
}

/**
 * Enriched poll result — completed with full 5-year resource inventory.
 * Patient-aware: each patient gets their own prior-payer history.
 */
export function devBulkStatus(patientId?: string): {
  state: string;
  completedAt: string;
  priorPayer: string;
  memberMatchedId: string;
  coveragePeriod: { start: string; end: string };
  fileUrls: string[];
  resourceCounts: Record<string, number>;
  paHistory: Array<{ service: string; cpt: string; decision: string; denialReason?: string; authNumber?: string; date: string }>;
  newConditionsAdded: number;
  coverageGapsResolved: number;
} {
  const p = profileFor(patientId ?? 'MARIA_SD_001');
  return {
    state: 'completed',
    completedAt: new Date(Date.now() - 8000).toISOString(),
    priorPayer: p.priorPayer,
    memberMatchedId: p.priorMemberId,
    coveragePeriod: { start: p.priorCoverageStart, end: p.priorCoverageEnd },
    fileUrls: [
      '/dev/export/eob.ndjson',
      '/dev/export/coverage.ndjson',
      '/dev/export/pa-history.ndjson',
      '/dev/export/clinical.ndjson',
    ],
    resourceCounts: {
      ExplanationOfBenefit: p.eobCount,
      Coverage: p.coverageCount,
      Claim: p.claimCount,
      ClaimResponse: p.claimResponseCount,
      Condition: p.conditionCount,
      MedicationRequest: p.medicationCount,
      Observation: p.observationCount,
      Procedure: p.procedureCount,
      Encounter: p.encounterCount,
    },
    paHistory: p.paHistory,
    newConditionsAdded: p.newConditionsAdded,
    coverageGapsResolved: p.coverageGapsResolved,
  };
}

// ─── Work Queue seed ──────────────────────────────────────────────────────────

/** Seeded work-queue items for demo — one per key patient scenario. */
export function devWorkQueueItems(): Array<{
  id: string; memberId: string; code: string; queue: string;
  netOutcome: string; requiresPA: boolean; propensityScore: number; propensityBand: string;
  submittedAt: string; slaDueAt: string; slaBreached: boolean;
}> {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();
  return [
    { id: 'wq-001', memberId: 'MARIA_SD_001', code: '72148', queue: 'high-risk-review',   netOutcome: 'requires-review', requiresPA: true,  propensityScore: 0.71, propensityBand: 'high',   submittedAt: hoursAgo(4),  slaDueAt: hoursFromNow(68), slaBreached: false },
    { id: 'wq-002', memberId: 'PAT-0042',     code: '75561', queue: 'more-info',          netOutcome: 'more-info',       requiresPA: true,  propensityScore: 0.48, propensityBand: 'medium', submittedAt: hoursAgo(26), slaDueAt: hoursFromNow(46), slaBreached: false },
    { id: 'wq-003', memberId: 'PAT-0087',     code: '93306', queue: 'ready-to-submit',    netOutcome: 'approved',        requiresPA: false, propensityScore: 0.12, propensityBand: 'low',    submittedAt: hoursAgo(2),  slaDueAt: hoursFromNow(70), slaBreached: false },
    { id: 'wq-004', memberId: 'PAT-0103',     code: '99243', queue: 'auto-cleared',       netOutcome: 'pa-exempt-gold-card', requiresPA: false, propensityScore: 0.08, propensityBand: 'low', submittedAt: hoursAgo(1),  slaDueAt: hoursFromNow(71), slaBreached: false },
    { id: 'wq-005', memberId: 'PAT-0042',     code: '94010', queue: 'denied-appeal',      netOutcome: 'denied',          requiresPA: true,  propensityScore: 0.82, propensityBand: 'high',   submittedAt: hoursAgo(78), slaDueAt: hoursAgo(6),     slaBreached: true  },
  ];
}

// ─── PAS ─────────────────────────────────────────────────────────────────────

/** A canned approved ClaimResponse for the human-approved PAS submission. */
export function devClaimResponseApproved(approvedBy: string, patientId?: string): unknown {
  const pid = patientId ?? 'MARIA_SD_001';
  const p = profileFor(pid);
  return {
    resourceType: 'ClaimResponse',
    id: `dev-cr-approved-${pid}`,
    status: 'active',
    type: { text: p.paScenario.procedureName },
    use: 'preauthorization',
    patient: { reference: `Patient/${pid}` },
    outcome: 'complete',
    disposition: `Prior authorization approved (dev demo). Reviewed by ${approvedBy}.`,
    insurance: [{ sequence: 1, focal: true, coverage: { reference: 'Coverage/cov-1' } }],
    item: [{ itemSequence: 1, adjudication: [{ category: { text: 'benefit' }, reason: { text: 'Approved — criteria met' } }] }],
    addItem: [{ productOrService: { coding: [{ system: 'http://www.ama-assn.org/go/cpt', code: p.paScenario.cptCode, display: p.paScenario.procedureName }] } }],
  };
}

// ─── DTR Questionnaire Package ────────────────────────────────────────────────

/** A DTR $questionnaire-package Bundle wrapping the seeded MRI questionnaire. */
export function devQuestionnairePackage(): unknown {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      {
        resource: {
          resourceType: 'Questionnaire',
          id: 'Q_MRI_LUMBAR',
          url: 'http://example.org/Questionnaire/mri-lumbar',
          status: 'active',
          title: 'MRI Lumbar Spine — Documentation Requirements (DTR)',
          item: [
            { linkId: 'q1', text: 'Conservative therapy attempted (>= 6 weeks)?', type: 'boolean', required: true },
            { linkId: 'q2', text: 'Neurological deficit present?', type: 'boolean', required: true },
            { linkId: 'q3', text: 'Relevant clinical notes', type: 'string' },
          ],
        },
      },
    ],
  };
}

// ─── Maria lumbar MRI (legacy default) ───────────────────────────────────────

function mariaMock(cptCode: string): unknown {
  return {
    policyTitle: 'MRI Lumbar Spine — Medical Necessity Policy (CPT 72148)',
    cptCode,
    allMet: false,
    groups: [
      {
        id: 1, title: '≥ 6 Weeks Conservative Therapy', status: 'met', required: true,
        description: 'Patient must have completed at least 6 weeks of conservative therapy without adequate relief prior to advanced imaging.',
        fhirQuery: { resourceType: 'Procedure', searchParam: 'code', system: 'http://snomed.info/sct', codes: ['229070002', '229070003'], valueComparison: '>= 6 weeks documented' },
        sourceExcerpt: 'Coverage is available for lumbar MRI when the member has completed a minimum 6-week trial of conservative therapy without satisfactory improvement.',
        leaf: { code: 'SNOMED 229070002', label: 'Physical therapy — lumbar region', evidence: 'PT sessions documented 02/10/2026 – 03/28/2026 (7 weeks)', source: 'emr', recordedDate: '2026-03-28', performerName: 'Dr. James Whitfield MD' },
      },
      {
        id: 2, title: 'Neurological Deficit or Red Flag Symptom', status: 'gap', required: true,
        description: 'Documentation must include at least one qualifying neurological deficit (radiculopathy, motor weakness, numbness/tingling) or a recognized red flag symptom.',
        fhirQuery: { resourceType: 'Condition', searchParam: 'code', system: 'http://hl7.org/fhir/sid/icd-10-cm', codes: ['M54.4', 'M54.3', 'G55', 'M47.816'] },
        sourceExcerpt: 'Advanced imaging is appropriate when neurological deficit, radiculopathy, or a red flag symptom is documented in the clinical record.',
        candidateCodes: [
          { code: 'M54.4', system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Lumbago with sciatica — right side' },
          { code: 'M54.3', system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Sciatica' },
          { code: 'G55', system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Nerve root and plexus compressions' },
          { code: 'M47.816', system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Spondylosis with radiculopathy — lumbar region' },
        ],
      },
      {
        id: 3, title: 'Ordering Provider Specialty Appropriate', status: 'met', required: false,
        description: 'Ordering provider must be a PCP, orthopedic surgeon, neurologist, or physiatrist.',
        sourceExcerpt: 'Requests from out-of-specialty providers are subject to additional review. PCP ordering is standard.',
        leaf: { code: 'NPI 1234567890', label: 'Dr. James Whitfield MD — Family Medicine / FQHC', evidence: 'PCP ordering — specialty confirmed in-network', source: 'emr' },
      },
    ],
  };
}
