// patientRegistry.ts — Single source of truth for all canonical patients
// Every patient-facing screen reads from this registry via getPatientById(id)
// FHIR ID mapping bridges EHR launch context to platform patient IDs

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CareGapEntry {
  id: string;
  domain: 'Clinical' | 'BH' | 'Social';
  name: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Waived';
  daysOpen: number;
  assignedTo: string;
}

export interface ConditionEntry {
  key: string;
  code: string;
  name: string;
  onset: string;
  status: string;
  source: string;
}

export interface MedicationEntry {
  key: string;
  name: string;
  dose: string;
  frequency: string;
  prescriber: string;
  lastFill: string;
  adherence: number | null;
  ddi: boolean;
}

export interface OrderEntry {
  key: string;
  type: string;
  name: string;
  result: string;
  date: string;
  status: string;
  flag: string | null;
}

export interface PathwayStepEntry {
  id: string;
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
  date?: string;
  metric?: string;
}

export interface CdsCardEntry {
  id: string;
  indicator: 'critical' | 'warning' | 'info';
  summary: string;
  detail: string;
}

export interface HouseholdDependentRec {
  name: string; relation: string; age: number; dob: string; plan: string; consent: string;
  gaps: { label: string; urgency: 'critical' | 'high' | 'due'; detail: string }[];
  coordinatedOutreach?: string;
}
export interface HouseholdCaregiverRec {
  name: string; relation: string; age: number; condition: string; clinicalMetric: string;
  pharmacy: string; prescriber: string;
  meds: { name: string; dose: string; indication: string }[];
  consentScopeItems: string[]; consentExclusions: string[];
}
export interface Household { dependents?: HouseholdDependentRec[]; caregiverFor?: HouseholdCaregiverRec[]; }

export interface RegistryPatient {
  // FHIR / Platform identity
  platformId: string;
  fhirId: string;
  ehrMrn: string;

  /**
   * mockOnly = true  → patient is always loaded from mock data.
   *                    Visible regardless of the FHIR/Mock toggle.
   * mockOnly = false → patient is loaded from live FHIR only.
   *                    Hidden when the toggle is set to Mock Data.
   */
  mockOnly?: boolean;

  // Demographics
  name: string;
  age: number;
  gender: string;
  dob: string;
  location: string;
  phone: string;

  // Attribution
  pcp: string;
  careManager: string;
  careManagerInitials: string;
  organization: string;
  contract: string;
  attribution: string;

  // Clinical summary
  rafScore: number;
  riskTier: 'Critical' | 'High' | 'Moderate' | 'Low';
  riskLabel: string;
  erRiskPct: number;
  hccSuspects: number;
  hccValue: number;
  openCareGaps: number;
  episodeType: string;
  episodeStatus: 'Active' | 'Stable' | 'Closed' | 'Escalated';
  episodeDaysActive: number;
  pmpm: number;
  pmpmTarget: number;
  lastContact: string;

  // BH
  bhScreeningLabel: string;
  bhScore: number | null;
  bhScoreLabel: string;
  auditC: number;
  bhRisk: 'Low' | 'Moderate' | 'High' | 'Crisis';
  bhReferralStatus: string;
  bhProvider: string;
  burdenScore: string;
  patientGoal: string;

  // Social
  transportStatus: string;
  foodSecurity: string;
  housingStatus: string;
  language: string;
  ruralDistance: string;
  disparityFlag: string;
  cohortFlag: string;
  snapStatus: string;
  digitalAccess: string;

  // Unified care gaps (Clinical + BH + Social)
  careGaps: CareGapEntry[];

  // Whole-person pathway
  pathwaySteps: PathwayStepEntry[];

  // AI Copilot synthesis
  aiCopilot: string;

  // Patient-specific CDS cards for SMART launch
  cdsCards: CdsCardEntry[];

  // Per-patient clinical data (shown in ClinicalTab)
  conditions?: ConditionEntry[];
  medications?: MedicationEntry[];
  recentOrders?: OrderEntry[];

  // Per-patient care plan domains (shown in WholePersonCarePlanTab)
  carePlanDomains?: CarePlanDomain[];

  // Recent encounters from FHIR (Encounter resources)
  recentEncounters?: {
    id: string; date: string; type: string; setting: string;
    provider: string; reason: string; status: string;
  }[];

  // Goals from FHIR (Goal resources)
  fhirGoals?: { id: string; description: string; status: string; dueDate: string; note: string }[];

  // Household / whole-family scenario (mock; drives family-sofia + caregiver-elena)
  household?: Household;

  // Care-journey mapping (references a template in uhg/data/journeys.ts)
  journey?: { id: string; currentDay: number };
}

export interface CarePlanGoal {
  goal: string;
  status: string;
  owner: string;
  dueDate: string;
  tasks: string[];
}

export interface CarePlanDomain {
  domain: string;
  color: string;
  icon: string;
  goals: CarePlanGoal[];
}

// ─── FHIR ID Mapping Table ────────────────────────────────────────────────────
// Bridge between EHR FHIR patient IDs and platform IDs

export const FHIR_ID_MAP: Record<string, string> = {
  // FHIR ID → Platform ID
  'patient/maria-redhawk-001': 'MARIA_SD_001',
  'patient-maria-001': 'MARIA_SD_001',
  'patient/dorothy-simmons-042': 'PAT-0042',
  'patient-dorothy-042': 'PAT-0042',
  'patient/james-wilson-087': 'PAT-0087',
  'patient-james-087': 'PAT-0087',
  'patient/robert-chen-103': 'PAT-0103',
  'patient-robert-103': 'PAT-0103',
  'patient/lisa-thompson-156': 'PAT-0156',
  'patient-lisa-156': 'PAT-0156',
  // Legacy / alternate FHIR IDs
  'patient-001': 'PAT-0042',
  'patient-002': 'PAT-0087',
  'patient-003': 'PAT-0103',
  'patient-004': 'PAT-0156',
};

/**
 * Platform ID → canonical FHIR patient ID.
 * Used by PatientContextProvider to translate a platform ID (e.g. "MARIA_SD_001")
 * into the FHIR resource ID needed for server queries.
 */
export const PLATFORM_TO_FHIR_ID_MAP: Record<string, string> = {
  'MARIA_SD_001': 'patient-maria-001',
  'PAT-0042': 'patient-dorothy-042',
  'PAT-0087': 'patient-james-087',
  'PAT-0103': 'patient-robert-103',
  'PAT-0156': 'patient-lisa-156',
};

// ─── Patient Registry ─────────────────────────────────────────────────────────

const PATIENT_REGISTRY: RegistryPatient[] = [
  // ── Maria Redhawk — Mock Data Only (always visible, never reads FHIR) ────────
  {
    mockOnly: true,
    platformId: 'MARIA_SD_001',
    journey: { id: 'POSTPARTUM_90D', currentDay: 34 },
    household: {
      dependents: [
        { name: 'Sophia Redhawk', relation: 'Daughter', age: 2, dob: 'June 2024', plan: 'SD CHIP', consent: 'Parent proxy - ACTIVE',
          gaps: [
            { label: 'Well-Child 24-Month Visit', urgency: 'high', detail: '21 days overdue - transportation barrier (47 mi)' },
            { label: 'Immunizations (DTaP, MMR)', urgency: 'due', detail: 'Bundle with well-child visit' },
          ],
          coordinatedOutreach: 'Maria postpartum check-in + Sophia well-child - one SMS, one outreach' },
      ],
      caregiverFor: [
        { name: 'Elena Redhawk', relation: 'Mother', age: 66, condition: 'Heart disease + Type 2 diabetes', clinicalMetric: 'A1C 8.1% - DM management',
          pharmacy: 'Martin Pharmacy', prescriber: 'Bennett County Health',
          meds: [
            { name: 'Metformin', dose: '1000mg', indication: 'Type 2 Diabetes' },
            { name: 'Lisinopril', dose: '10mg', indication: 'Hypertension' },
          ],
          consentScopeItems: ['Medication list', 'Appointment scheduling', 'Refill coordination'],
          consentExclusions: ['Behavioral health records', 'Third-party disclosure'] },
      ],
    },
    fhirId: 'patient/maria-redhawk-001',
    ehrMrn: 'MARIA_SD_001',

    name: 'Maria Redhawk',
    age: 34,
    gender: 'F',
    dob: '1992-06-15',
    location: 'Martin, SD 57551',
    phone: '(605) 555-0234',

    pcp: 'Bennett County Health',
    careManager: 'Sarah Johnson',
    careManagerInitials: 'SJ',
    organization: 'Bennett County Health (CAH)',
    contract: 'SD Medicaid',
    attribution: 'Confirmed',

    rafScore: 2.18,
    riskTier: 'Moderate',
    riskLabel: 'Moderate — Pre-diabetic',
    erRiskPct: 42,
    hccSuspects: 3,
    hccValue: 12400,
    openCareGaps: 9,
    episodeType: 'Postpartum Health',
    episodeStatus: 'Active',
    episodeDaysActive: 427,
    pmpm: 1240,
    pmpmTarget: 780,
    lastContact: 'May 1, 2026',

    bhScreeningLabel: 'Edinburgh PND',
    bhScore: 11,
    bhScoreLabel: 'Edinburgh PND 11 — Moderate Postpartum Depression',
    auditC: 0,
    bhRisk: 'Moderate',
    bhReferralStatus: 'Referred (May 1, 2026)',
    bhProvider: 'Postpartum Support Group',
    burdenScore: 'PAM Score: 2 - Building Knowledge',
    patientGoal: "'Manage my health while caring for Sophia and Elena'",

    transportStatus: 'High Barrier — 47 miles to Winner Regional',
    foodSecurity: 'Moderate Insecurity — SNAP active, WIC expired',
    housingStatus: 'Rental Assistance Waitlist (Position 47)',
    language: 'English',
    ruralDistance: '47 miles to Winner Regional Healthcare',
    disparityFlag: 'Transportation · Childcare · Digital Divide',
    cohortFlag: 'Rural · Single Parent · Caregiver',
    snapStatus: 'SNAP active · WIC expired (May 1, 2025)',
    digitalAccess: 'Moderate Literacy',

    careGaps: [
      { id: 'mg-1', domain: 'Clinical', name: 'HbA1c Lab', status: 'Open', daysOpen: 38, assignedTo: 'Bennett County Health' },
      { id: 'mg-2', domain: 'Clinical', name: 'Edinburgh PND Screening', status: 'Open', daysOpen: 427, assignedTo: 'Sarah Johnson (Care Manager)' },
      { id: 'mg-3', domain: 'Clinical', name: 'Well-Child 24-Month Visit (Sophia)', status: 'Open', daysOpen: 21, assignedTo: 'Bennett County Health' },
      { id: 'mg-4', domain: 'BH', name: 'Postpartum Depression Follow-up', status: 'In Progress', daysOpen: 427, assignedTo: 'Postpartum Support Group' },
      { id: 'mg-5', domain: 'BH', name: 'Caregiver Burden Assessment', status: 'Open', daysOpen: 90, assignedTo: 'Sarah Johnson (Care Manager)' },
      { id: 'mg-6', domain: 'Social', name: 'Transportation Barrier Resolution', status: 'In Progress', daysOpen: 38, assignedTo: 'Sarah Johnson' },
      { id: 'mg-7', domain: 'Social', name: 'Childcare Subsidy Enrollment', status: 'Open', daysOpen: 60, assignedTo: 'Sarah Johnson' },
      { id: 'mg-8', domain: 'Social', name: 'WIC Re-enrollment', status: 'Open', daysOpen: 45, assignedTo: 'Sarah Johnson' },
      { id: 'mg-9', domain: 'Social', name: 'LIHEAP Application (Utility Assistance)', status: 'Open', daysOpen: 30, assignedTo: 'Sarah Johnson' },
    ],

    pathwaySteps: [
      { id: 'mps-1', label: 'PRAPARE Screening', status: 'completed', date: 'May 1, 2026', metric: '7 domains unmet' },
      { id: 'mps-2', label: 'Edinburgh PND Screening', status: 'completed', date: 'May 1, 2026', metric: 'Score 11 (Moderate)' },
      { id: 'mps-3', label: 'Childcare Subsidy Enrollment', status: 'in_progress', date: 'In progress', metric: '$487/month eligible' },
      { id: 'mps-4', label: 'HbA1c Lab Completion', status: 'pending', date: 'Due June 22, 2026', metric: 'Last: 6.2% (Pre-diabetic)' },
      { id: 'mps-5', label: 'WIC Re-enrollment', status: 'pending', metric: '$320/month benefit' },
    ],

    aiCopilot:
      'Transportation barrier (47 miles) is primary blocker affecting all clinical appointments. Postpartum depression (Edinburgh PND 11) untreated for 427 days - BH referral sent May 1 but not yet enrolled. Childcare subsidy ($487/mo) critical for appointment attendance. Pre-diabetes monitoring (HbA1c 6.2%) overdue. Multiple eligible benefits not enrolled: WIC ($320/mo), LIHEAP, Medicaid transport. Single parent with 2 young children (Sophia 24mo, Elena infant). Care Manager: Sarah Johnson.',

    cdsCards: [
      { id: 'cds-maria-1', indicator: 'critical', summary: 'Edinburgh PND overdue 427 days — postpartum depression untreated', detail: 'Postpartum depression screening shows Edinburgh PND score 11 (Moderate). Patient is 427 days postpartum with untreated moderate depression. BH referral sent May 1, 2026 to Postpartum Support Group — patient not yet enrolled. Immediate follow-up required for maternal mental health.' },
      { id: 'cds-maria-2', indicator: 'warning', summary: 'HbA1c gap 38 days — pre-diabetes monitoring critical', detail: 'Pre-diabetic HbA1c recheck is 38 days overdue. Last HbA1c: 6.2% (Pre-diabetic range). Due date: June 22, 2026. Primary barrier: 47-mile distance to Winner Regional Healthcare with no reliable transport. Consider NEMT enrollment and bundle with Well-Child visit.' },
      { id: 'cds-maria-3', indicator: 'warning', summary: 'Well-Child 24-month visit — Sophia overdue 21 days', detail: 'Daughter Sophia\'s 24-month well-child visit is 21 days overdue. Transportation barrier (47 miles) preventing appointment attendance. Bundle with Maria\'s HbA1c lab to reduce trips. Childcare coordination needed.' },
      { id: 'cds-maria-4', indicator: 'info', summary: 'Multiple eligible benefits not enrolled — $807/month total', detail: 'Maria is eligible for multiple benefits not currently enrolled: Childcare Subsidy ($487/mo), WIC Re-enrollment ($320/mo), LIHEAP (utility assistance), and Medicaid Non-Emergency Transport. Total monthly benefit value: $807. Enrollment would significantly improve care access and financial stability.' },
    ],

    conditions: [
      { key: 'mar-c1', code: 'O90.6', name: 'Postpartum mood disturbance', onset: '2025-07', status: 'Active', source: 'EMR' },
      { key: 'mar-c2', code: 'R73.09', name: 'Pre-diabetes (HbA1c 6.2%)', onset: '2024-11', status: 'Active', source: 'EMR' },
      { key: 'mar-c3', code: 'Z62.89', name: 'Caregiver stress — mother + infant', onset: '2025-06', status: 'Active', source: 'EMR' },
    ],
    medications: [
      { key: 'mar-m1', name: 'Prenatal Vitamin', dose: '1 tab', frequency: 'Daily', prescriber: 'Bennett County Health', lastFill: '2026-04-15', adherence: 0.88, ddi: false },
      { key: 'mar-m2', name: 'Sertraline', dose: '25mg', frequency: 'Daily', prescriber: 'Bennett County Health', lastFill: '2026-05-01', adherence: 0.72, ddi: false },
    ],
    recentOrders: [
      { key: 'mar-o1', type: 'Lab', name: 'HbA1c', result: '6.2% (Pre-diabetic)', date: '2025-12-10', status: 'Resulted', flag: 'High' },
      { key: 'mar-o2', type: 'Screening', name: 'Edinburgh PND', result: 'Score 11 (Moderate)', date: '2026-05-01', status: 'Resulted', flag: 'High' },
      { key: 'mar-o3', type: 'Referral', name: 'Postpartum Support Group', result: 'Awaiting enrollment', date: '2026-05-01', status: 'Pending', flag: null },
      { key: 'mar-o4', type: 'Well-Child', name: 'Sophia 24-Month Visit', result: 'Overdue 21 days', date: '2026-04-10', status: 'Ordered', flag: 'High' },
    ],
    carePlanDomains: [
      {
        domain: 'Clinical',
        color: '#0043ce',
        icon: 'HeartIcon',
        goals: [
          { goal: 'HbA1c recheck by June 22, 2026', status: 'open', owner: 'Bennett County Health', dueDate: '2026-06-22', tasks: ['NEMT enrollment for lab visit', 'Bundle with Sophia well-child', 'HbA1c result review with PCP'] },
        ],
      },
      {
        domain: 'Behavioral Health',
        color: '#6929c4',
        icon: 'SparklesIcon',
        goals: [
          { goal: 'Edinburgh PND score < 7 by Q4 2026', status: 'in-progress', owner: 'Postpartum Support Group', dueDate: '2026-10-31', tasks: ['Enroll in Postpartum Support Group', 'Weekly BH check-in', 'Sertraline titration review'] },
          { goal: 'Caregiver burden assessment completed', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['Schedule PAM assessment', 'Refer to respite care resources'] },
        ],
      },
      {
        domain: 'Social Needs',
        color: '#b45309',
        icon: 'HomeIcon',
        goals: [
          { goal: 'Transportation barrier resolved by Q3 2026', status: 'in-progress', owner: 'Sarah Johnson', dueDate: '2026-09-30', tasks: ['Medicaid NEMT benefit activated', 'Rideshare coordination for appointments'] },
          { goal: 'Childcare subsidy enrolled by Jun 2026', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['Complete DHS childcare application', 'Submit income verification'] },
          { goal: 'WIC re-enrollment by Jul 2026', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-07-31', tasks: ['Schedule WIC office appointment', 'Gather household income documents'] },
        ],
      },
    ],
  },

  // ── Dorothy Simmons — Preserved exactly ──────────────────────────────────
  {
    platformId: 'PAT-0042',
    journey: { id: 'COPD_30D', currentDay: 14 },
    household: {
      dependents: [],
      caregiverFor: [
        { name: 'Earl Simmons', relation: 'Husband', age: 78, condition: 'Vascular dementia + hypertension', clinicalMetric: 'BP 146/88 - borderline',
          pharmacy: 'Ozark Pharmacy', prescriber: 'Ozark Regional FQHC',
          meds: [
            { name: 'Donepezil', dose: '10mg', indication: 'Dementia' },
            { name: 'Lisinopril', dose: '20mg', indication: 'Hypertension' },
            { name: 'Amlodipine', dose: '5mg', indication: 'Hypertension' },
          ],
          consentScopeItems: ['Medication list', 'Appointment scheduling', 'Refill coordination'],
          consentExclusions: ['Behavioral health records', 'Third-party disclosure'] },
      ],
    },
    fhirId: 'patient/dorothy-simmons-042',
    ehrMrn: 'MRN-0042',

    name: 'Dorothy Simmons',
    age: 75,
    gender: 'F',
    dob: '1951-03-14',
    location: 'Ozark Regional FQHC Service Area',
    phone: '(417) 555-0198',

    pcp: 'Dr. Whitfield',
    careManager: 'Sarah Johnson',
    careManagerInitials: 'SJ',
    organization: 'Ozark Regional FQHC',
    contract: 'MSSP Trk 3',
    attribution: 'Confirmed · MSSP Trk 3',

    rafScore: 3.42,
    riskTier: 'Critical',
    riskLabel: 'Critical — 84% ER risk',
    erRiskPct: 84,
    hccSuspects: 4,
    hccValue: 24800,
    openCareGaps: 11,
    episodeType: 'COPD Exacerbation',
    episodeStatus: 'Active',
    episodeDaysActive: 14,
    pmpm: 2840,
    pmpmTarget: 890,
    lastContact: 'Mar 28, 2026',

    bhScreeningLabel: 'PHQ-9',
    bhScore: 14,
    bhScoreLabel: 'PHQ-9 14 — Moderate depression',
    auditC: 2,
    bhRisk: 'Moderate',
    bhReferralStatus: 'Open — referred Mar 15',
    bhProvider: 'Cascade Valley BH',
    burdenScore: 'PAM 1 — Overwhelmed',
    patientGoal: "'Stay home with my family'",

    transportStatus: 'Active — Unite Us #TU-48821',
    foodSecurity: 'Screened — no flag',
    housingStatus: 'Stable',
    language: 'English',
    ruralDistance: '38 miles to FQHC',
    disparityFlag: 'None identified',
    cohortFlag: 'Ag worker · Seasonal flag',
    snapStatus: 'Active',
    digitalAccess: 'Limited — phone only',

    careGaps: [
      { id: 'gap-1', domain: 'Clinical', name: 'Spirometry (COPD)', status: 'Open', daysOpen: 42, assignedTo: 'Dr. Whitfield' },
      { id: 'gap-2', domain: 'Clinical', name: 'Flu Vaccine', status: 'In Progress', daysOpen: 18, assignedTo: 'Sarah Johnson' },
      { id: 'gap-3', domain: 'Clinical', name: 'Medication Reconciliation', status: 'Open', daysOpen: 14, assignedTo: 'Sarah Johnson' },
      { id: 'gap-4', domain: 'Clinical', name: 'A1C Recheck', status: 'Open', daysOpen: 61, assignedTo: 'Dr. Whitfield' },
      { id: 'gap-5', domain: 'Clinical', name: 'Retinal Exam', status: 'Open', daysOpen: 90, assignedTo: 'Dr. Whitfield' },
      { id: 'gap-6', domain: 'Clinical', name: 'Nephropathy Screening', status: 'Open', daysOpen: 30, assignedTo: 'Dr. Whitfield' },
      { id: 'gap-7', domain: 'BH', name: 'PHQ-9 Follow-up', status: 'In Progress', daysOpen: 21, assignedTo: 'Cascade Valley BH' },
      { id: 'gap-8', domain: 'BH', name: 'Trauma Screening (ACE)', status: 'Open', daysOpen: 45, assignedTo: 'Sarah Johnson' },
      { id: 'gap-9', domain: 'Social', name: 'Transport Referral — Active', status: 'In Progress', daysOpen: 18, assignedTo: 'Maria Gonzalez' },
      { id: 'gap-10', domain: 'Social', name: 'Housing Stability Plan', status: 'Open', daysOpen: 33, assignedTo: 'Maria Gonzalez' },
      { id: 'gap-11', domain: 'Social', name: 'SNAP Re-certification', status: 'Open', daysOpen: 12, assignedTo: 'Maria Gonzalez' },
    ],

    pathwaySteps: [
      { id: 'ps-1', label: 'Food Insecurity Screening', status: 'completed', date: 'Jan 8', metric: 'SNAP enrolled' },
      { id: 'ps-2', label: 'SNAP Enrollment', status: 'completed', date: 'Feb 2', metric: 'Active' },
      { id: 'ps-3', label: 'BH Engagement', status: 'in_progress', date: 'Mar 15', metric: 'PHQ-9 14' },
      { id: 'ps-4', label: 'A1C Recheck', status: 'in_progress', metric: 'Goal: <7.0%' },
      { id: 'ps-5', label: 'Medication Reconciliation', status: 'pending', metric: 'COPD regimen' },
    ],

    aiCopilot:
      'PHQ-9 14 — BH referral open since Mar 15, not yet engaged. COPD exacerbation active — spirometry overdue 42 days. RAF 3.42 with 4 HCC suspects ($24,800 value). A1C 9.2% — diabetes poorly controlled. Priority: BH engagement + medication reconciliation this week.',

    cdsCards: [
      { id: 'cds-dorothy-1', indicator: 'critical', summary: 'PHQ-9 14 — BH referral open since Mar 15, not engaged', detail: 'Moderate depression (PHQ-9 14). BH referral to Cascade Valley BH sent Mar 15 — patient has not engaged. Immediate outreach required. FUH/FUM measure at risk.' },
      { id: 'cds-dorothy-2', indicator: 'warning', summary: 'COPD Exacerbation — spirometry overdue 42 days', detail: 'Active COPD exacerbation episode. Spirometry not completed in 42 days. Medication reconciliation also overdue. Follow-up within 7 days required per care plan.' },
      { id: 'cds-dorothy-3', indicator: 'info', summary: 'RAF 3.42 — 4 HCC suspects, $24,800 revenue at risk', detail: '4 HCC suspects identified: T2DM with CKD Stage 3, COPD, Major Depression, Cardiac. Documentation deadline Dec 31, 2026. Estimated RAF delta: +0.42 if all captured.' },
      { id: 'cds-dorothy-4', indicator: 'warning', summary: 'A1C 9.2% — diabetes poorly controlled', detail: 'Last A1C 9.2% (Feb 10). Target <7.0%. Retinal exam and nephropathy screening both overdue. Consider endocrinology referral given CKD Stage 3b (eGFR 42).' },
    ],

    conditions: [
      { key: 'dot-c1', code: 'I50.32', name: 'Chronic diastolic heart failure', onset: '2019-03', status: 'Active', source: 'EMR' },
      { key: 'dot-c2', code: 'E11.65', name: 'Type 2 diabetes mellitus with hyperglycemia', onset: '2014-07', status: 'Active', source: 'EMR' },
      { key: 'dot-c3', code: 'J44.1', name: 'COPD with acute exacerbation', onset: '2021-11', status: 'Active', source: 'HIE' },
      { key: 'dot-c4', code: 'I10', name: 'Essential (primary) hypertension', onset: '2012-03', status: 'Active', source: 'EMR' },
      { key: 'dot-c5', code: 'E66.01', name: 'Morbid obesity due to excess calories', onset: '2016-05', status: 'Active', source: 'EMR' },
      { key: 'dot-c6', code: 'N18.3', name: 'Chronic kidney disease, stage 3', onset: '2022-09', status: 'Active', source: 'Claims' },
      { key: 'dot-c7', code: 'F32.1', name: 'Major depressive disorder, single episode', onset: '2023-02', status: 'Active', source: 'EMR' },
    ],
    medications: [
      { key: 'dot-m1', name: 'Furosemide', dose: '40mg', frequency: 'Daily', prescriber: 'Dr. Whitfield', lastFill: '2026-04-01', adherence: 0.92, ddi: false },
      { key: 'dot-m2', name: 'Metformin HCl', dose: '1000mg', frequency: 'BID', prescriber: 'Dr. Whitfield', lastFill: '2026-03-28', adherence: 0.71, ddi: false },
      { key: 'dot-m3', name: 'Warfarin Sodium', dose: '5mg', frequency: 'Daily', prescriber: 'Dr. Whitfield', lastFill: '2026-04-08', adherence: 0.95, ddi: true },
      { key: 'dot-m4', name: 'Tiotropium bromide', dose: '18mcg', frequency: 'Daily inhaled', prescriber: 'Dr. Nakamura', lastFill: '2026-03-15', adherence: 0.68, ddi: false },
      { key: 'dot-m5', name: 'Lisinopril', dose: '20mg', frequency: 'Daily', prescriber: 'Dr. Whitfield', lastFill: '2026-04-01', adherence: 0.89, ddi: false },
      { key: 'dot-m6', name: 'Atorvastatin', dose: '40mg', frequency: 'Nightly', prescriber: 'Dr. Whitfield', lastFill: '2026-03-20', adherence: 0.84, ddi: false },
      { key: 'dot-m7', name: 'Ibuprofen OTC', dose: '400mg', frequency: 'PRN', prescriber: 'OTC', lastFill: '2026-04-10', adherence: null, ddi: true },
    ],
    recentOrders: [
      { key: 'dot-o1', type: 'Lab', name: 'HbA1c', result: '9.2%', date: '2026-03-15', status: 'Resulted', flag: 'High' },
      { key: 'dot-o2', type: 'Lab', name: 'BNP', result: '842 pg/mL', date: '2026-03-28', status: 'Resulted', flag: 'Critical' },
      { key: 'dot-o3', type: 'Imaging', name: 'Cardiac MRI', result: 'Pending', date: '2026-04-14', status: 'Ordered', flag: null },
      { key: 'dot-o4', type: 'Referral', name: 'Ophthalmology', result: 'Awaiting scheduling', date: '2026-02-14', status: 'Pending', flag: null },
      { key: 'dot-o5', type: 'Lab', name: 'eGFR / BMP', result: '38 mL/min', date: '2026-03-15', status: 'Resulted', flag: 'Low' },
      { key: 'dot-o6', type: 'Procedure', name: 'Echocardiogram', result: 'EF 35%', date: '2026-03-12', status: 'Resulted', flag: 'Low' },
    ],
    carePlanDomains: [
      {
        domain: 'Clinical',
        color: '#0043ce',
        icon: 'HeartIcon',
        goals: [
          { goal: 'A1C < 8.0 by Q3 2026', status: 'in-progress', owner: 'Dr. Whitfield', dueDate: '2026-09-30', tasks: ['Metformin titration', 'Diabetes education referral', 'A1C recheck in 90 days'] },
          { goal: 'BP < 130/80 by Q2 2026', status: 'open', owner: 'Dr. Whitfield', dueDate: '2026-06-30', tasks: ['Lisinopril 20mg titration', 'Home BP monitoring kit ordered'] },
          { goal: 'Spirometry completed by May 2026', status: 'open', owner: 'Dr. Whitfield', dueDate: '2026-05-31', tasks: ['Schedule spirometry at Ozark FQHC', 'COPD action plan update'] },
        ],
      },
      {
        domain: 'Behavioral Health',
        color: '#6929c4',
        icon: 'SparklesIcon',
        goals: [
          { goal: 'PHQ-9 score < 10 by Q3 2026', status: 'in-progress', owner: 'Cascade Valley BH', dueDate: '2026-09-30', tasks: ['Weekly BH counseling sessions', 'Antidepressant medication review', 'Safety plan documented'] },
        ],
      },
      {
        domain: 'Social Needs',
        color: '#b45309',
        icon: 'HomeIcon',
        goals: [
          { goal: 'Transport referral active by May 2026', status: 'completed', owner: 'Maria Gonzalez', dueDate: '2026-05-31', tasks: ['Unite Us TU-48821 activated', 'Transport coordinator assigned'] },
          { goal: 'SNAP re-certification by Jun 2026', status: 'open', owner: 'Maria Gonzalez', dueDate: '2026-06-30', tasks: ['Recertification paperwork submitted', 'DHS appointment confirmed'] },
        ],
      },
    ],
  },

  // ── James Wilson ──────────────────────────────────────────────────────────
  {
    platformId: 'PAT-0087',
    journey: { id: 'CHF_DM_120D', currentDay: 89 },
    household: {
      dependents: [],
      caregiverFor: [
        { name: 'Ruth Wilson', relation: 'Mother', age: 84, condition: 'Early-stage Alzheimer disease + Type 2 diabetes', clinicalMetric: 'A1C 7.9% - DM management',
          pharmacy: 'Winner Pharmacy', prescriber: 'Winner Regional Medical Center',
          meds: [
            { name: 'Donepezil', dose: '10mg', indication: 'Alzheimer disease' },
            { name: 'Metformin', dose: '1000mg', indication: 'Type 2 Diabetes' },
            { name: 'Lisinopril', dose: '10mg', indication: 'Hypertension' },
          ],
          consentScopeItems: ['Medication list', 'Appointment scheduling', 'Refill coordination'],
          consentExclusions: ['Behavioral health records', 'Third-party disclosure'] },
      ],
    },
    fhirId: 'patient/james-wilson-087',
    ehrMrn: 'MRN-0087',

    name: 'James Wilson',
    age: 58,
    gender: 'M',
    dob: '1968-07-14',
    location: 'Rural Route 2, Winner SD 57580',
    phone: '(605) 555-0223',

    pcp: 'Dr. Okonkwo',
    careManager: 'Sarah Johnson',
    careManagerInitials: 'SJ',
    organization: 'Winner Regional Medical Center',
    contract: 'Medicaid RHTP Track 3',
    attribution: 'Confirmed · Medicaid RHTP Track 3',

    rafScore: 2.8,
    riskTier: 'High',
    riskLabel: 'High — 67% ER risk',
    erRiskPct: 67,
    hccSuspects: 3,
    hccValue: 18600,
    openCareGaps: 7,
    episodeType: 'Diabetes · CHF',
    episodeStatus: 'Active',
    episodeDaysActive: 89,
    pmpm: 1840,
    pmpmTarget: 1200,
    lastContact: '3 weeks ago',

    bhScreeningLabel: 'PHQ-9',
    bhScore: 8,
    bhScoreLabel: 'PHQ-9 8 — Mild depression',
    auditC: 3,
    bhRisk: 'Low',
    bhReferralStatus: 'Not referred',
    bhProvider: '—',
    burdenScore: 'PAM 2 — Struggling',
    patientGoal: "'Manage my diabetes and stay out of the hospital'",

    transportStatus: 'Limited — 35 miles to clinic',
    foodSecurity: 'SNAP active',
    housingStatus: 'Stable — owns home',
    language: 'English',
    ruralDistance: '35 miles to Winner Regional',
    disparityFlag: 'Rural · Low income',
    cohortFlag: 'Diabetes · CHF · Rural SD',
    snapStatus: 'Active',
    digitalAccess: 'Smartphone — limited data plan',

    careGaps: [
      { id: 'jw-1', domain: 'Clinical', name: 'A1C Recheck (Diabetes)', status: 'Open', daysOpen: 45, assignedTo: 'Dr. Okonkwo' },
      { id: 'jw-2', domain: 'Clinical', name: 'BNP Lab Panel (CHF)', status: 'Open', daysOpen: 22, assignedTo: 'Dr. Okonkwo' },
      { id: 'jw-3', domain: 'Clinical', name: 'Retinal Exam', status: 'Open', daysOpen: 120, assignedTo: 'Dr. Okonkwo' },
      { id: 'jw-4', domain: 'Clinical', name: 'Nephropathy Screening', status: 'Open', daysOpen: 60, assignedTo: 'Dr. Okonkwo' },
      { id: 'jw-5', domain: 'BH', name: 'PHQ-9 Follow-up', status: 'Open', daysOpen: 30, assignedTo: 'Sarah Johnson' },
      { id: 'jw-6', domain: 'Social', name: 'Transportation — Specialist Visits', status: 'Open', daysOpen: 45, assignedTo: 'Sarah Johnson' },
      { id: 'jw-7', domain: 'Social', name: 'Medication Adherence Support', status: 'In Progress', daysOpen: 14, assignedTo: 'Sarah Johnson' },
    ],

    pathwaySteps: [
      { id: 'jwps-1', label: 'Diabetes Education', status: 'completed', date: 'Mar 1', metric: 'Completed' },
      { id: 'jwps-2', label: 'CHF Monitoring Setup', status: 'completed', date: 'Mar 15', metric: 'Daily weight log' },
      { id: 'jwps-3', label: 'A1C Recheck', status: 'in_progress', metric: 'Goal: <7.5%' },
      { id: 'jwps-4', label: 'Cardiology Referral', status: 'pending', metric: 'CHF management' },
      { id: 'jwps-5', label: 'BH Screening', status: 'pending', metric: 'PHQ-9 follow-up' },
    ],

    aiCopilot:
      'CHF + Diabetes dual management — A1C 45 days overdue, BNP panel 22 days overdue. PHQ-9 8 mild depression — consider BH referral given chronic disease burden. Transportation barrier (35 miles) affects specialist follow-up. Medication adherence support in progress.',

    cdsCards: [
      { id: 'cds-james-1', indicator: 'warning', summary: 'A1C overdue 45 days — diabetes management gap', detail: 'Diabetic A1C recheck is 45 days overdue. Last value not on record. Retinal exam and nephropathy screening also overdue. Bundle labs to reduce patient travel burden.' },
      { id: 'cds-james-2', indicator: 'warning', summary: 'BNP panel overdue 22 days — CHF monitoring gap', detail: 'CHF monitoring BNP panel is 22 days overdue. Patient has active CHF episode (89 days). Daily weight log active but no recent lab confirmation of fluid status.' },
      { id: 'cds-james-3', indicator: 'info', summary: 'PHQ-9 8 — mild depression, consider BH referral', detail: 'PHQ-9 score 8 indicates mild depression. Chronic disease burden (Diabetes + CHF) increases BH risk. Consider BH referral to address depression and improve medication adherence.' },
    ],

    conditions: [
      { key: 'jw-c1', code: 'I50.32', name: 'Chronic systolic heart failure', onset: '2022-01', status: 'Active', source: 'EMR' },
      { key: 'jw-c2', code: 'E11.9', name: 'Type 2 diabetes mellitus', onset: '2015-04', status: 'Active', source: 'EMR' },
      { key: 'jw-c3', code: 'I10', name: 'Essential (primary) hypertension', onset: '2013-08', status: 'Active', source: 'Claims' },
      { key: 'jw-c4', code: 'F32.0', name: 'Major depressive disorder, mild', onset: '2024-02', status: 'Active', source: 'EMR' },
    ],
    medications: [
      { key: 'jw-m1', name: 'Metformin HCl', dose: '1000mg', frequency: 'BID', prescriber: 'Dr. Okonkwo', lastFill: '2026-04-10', adherence: 0.74, ddi: false },
      { key: 'jw-m2', name: 'Carvedilol', dose: '12.5mg', frequency: 'BID', prescriber: 'Dr. Okonkwo', lastFill: '2026-04-01', adherence: 0.85, ddi: false },
      { key: 'jw-m3', name: 'Lisinopril', dose: '10mg', frequency: 'Daily', prescriber: 'Dr. Okonkwo', lastFill: '2026-04-01', adherence: 0.90, ddi: false },
      { key: 'jw-m4', name: 'Furosemide', dose: '20mg', frequency: 'Daily', prescriber: 'Dr. Okonkwo', lastFill: '2026-03-18', adherence: 0.78, ddi: false },
      { key: 'jw-m5', name: 'Atorvastatin', dose: '20mg', frequency: 'Nightly', prescriber: 'Dr. Okonkwo', lastFill: '2026-03-18', adherence: 0.82, ddi: false },
    ],
    recentOrders: [
      { key: 'jw-o1', type: 'Lab', name: 'HbA1c', result: 'Overdue 45 days', date: '2026-02-28', status: 'Ordered', flag: 'High' },
      { key: 'jw-o2', type: 'Lab', name: 'BNP Panel', result: 'Overdue 22 days', date: '2026-03-21', status: 'Ordered', flag: 'High' },
      { key: 'jw-o3', type: 'Lab', name: 'Retinal Exam', result: 'Overdue 120 days', date: '2025-12-01', status: 'Ordered', flag: 'High' },
      { key: 'jw-o4', type: 'Referral', name: 'Cardiology Consultation', result: 'Pending scheduling', date: '2026-04-01', status: 'Pending', flag: null },
    ],
    carePlanDomains: [
      {
        domain: 'Clinical',
        color: '#0043ce',
        icon: 'HeartIcon',
        goals: [
          { goal: 'A1C < 7.5% by Q3 2026', status: 'in-progress', owner: 'Dr. Okonkwo', dueDate: '2026-09-30', tasks: ['Metformin 1000mg BID compliance review', 'A1C lab recheck', 'Diabetes education reinforcement'] },
          { goal: 'CHF BNP panel current', status: 'open', owner: 'Dr. Okonkwo', dueDate: '2026-05-15', tasks: ['BNP + CBC lab order', 'Daily weight log review', 'Carvedilol dose assessment'] },
        ],
      },
      {
        domain: 'Behavioral Health',
        color: '#6929c4',
        icon: 'SparklesIcon',
        goals: [
          { goal: 'PHQ-9 follow-up completed', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['PHQ-9 re-assessment', 'BH referral if score > 10', 'Medication adherence counseling'] },
        ],
      },
      {
        domain: 'Social Needs',
        color: '#b45309',
        icon: 'HomeIcon',
        goals: [
          { goal: 'Transportation barrier addressed for specialist visits', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-07-31', tasks: ['Medicaid NEMT enrollment', 'Coordinate cardiology transport'] },
          { goal: 'Medication adherence support enrolled', status: 'in-progress', owner: 'Sarah Johnson', dueDate: '2026-05-31', tasks: ['Pill organizer provided', 'Weekly check-in calls scheduled'] },
        ],
      },
    ],
  },

  // ── Robert Chen ───────────────────────────────────────────────────────────
  {
    platformId: 'PAT-0103',
    journey: { id: 'CKD_180D', currentDay: 156 },
    household: {
      dependents: [
        { name: 'Kevin Chen', relation: 'Son', age: 20, dob: '2005', plan: 'Medicaid (student)', consent: 'Adult dependent - self-consent',
          gaps: [
            { label: 'Asthma PCP Re-establishment', urgency: 'high', detail: 'Lapsed PCP - controller refill at risk' },
          ],
          coordinatedOutreach: 'Robert HTN reminder + Kevin asthma refill - household batch' },
      ],
      caregiverFor: [
        { name: 'Mei Chen', relation: 'Mother', age: 88, condition: 'Post-stroke + hypertension', clinicalMetric: 'BP 158/92 - not at goal',
          pharmacy: 'Rapid City Pharmacy', prescriber: 'Rapid City Regional Health',
          meds: [
            { name: 'Amlodipine', dose: '10mg', indication: 'Hypertension' },
            { name: 'Atorvastatin', dose: '40mg', indication: 'Stroke prevention' },
            { name: 'Aspirin', dose: '81mg', indication: 'Antiplatelet' },
          ],
          consentScopeItems: ['Medication list', 'Appointment scheduling', 'Interpreter coordination (Mandarin)'],
          consentExclusions: ['Behavioral health records', 'Third-party disclosure'] },
      ],
    },
    fhirId: 'patient/robert-chen-103',
    ehrMrn: 'MRN-0103',

    name: 'Robert Chen',
    age: 62,
    gender: 'M',
    dob: '1964-11-03',
    location: '847 Oak Street, Rapid City SD 57701',
    phone: '(605) 555-0334',

    pcp: 'Dr. Castillo',
    careManager: 'Sarah Johnson',
    careManagerInitials: 'SJ',
    organization: 'Rapid City Regional Health',
    contract: 'Medicaid RHTP Track 3',
    attribution: 'Confirmed · Medicaid RHTP Track 3',

    rafScore: 1.9,
    riskTier: 'High',
    riskLabel: 'High — 52% ER risk',
    erRiskPct: 52,
    hccSuspects: 2,
    hccValue: 11200,
    openCareGaps: 5,
    episodeType: 'Hypertension · CKD',
    episodeStatus: 'Active',
    episodeDaysActive: 156,
    pmpm: 980,
    pmpmTarget: 750,
    lastContact: '6 weeks ago',

    bhScreeningLabel: 'AUDIT-C',
    bhScore: 4,
    bhScoreLabel: 'AUDIT-C 4 — Low-moderate alcohol risk',
    auditC: 4,
    bhRisk: 'Low',
    bhReferralStatus: 'Not referred',
    bhProvider: '—',
    burdenScore: 'PAM 3 — Beginning to take action',
    patientGoal: "'Control my blood pressure and protect my kidneys'",

    transportStatus: 'Adequate — urban location',
    foodSecurity: 'No flag',
    housingStatus: 'Stable — rents apartment',
    language: 'English / Mandarin',
    ruralDistance: '5 miles to clinic',
    disparityFlag: 'Asian American · Medicaid',
    cohortFlag: 'Hypertension · CKD · Urban SD',
    snapStatus: 'Not enrolled',
    digitalAccess: 'Smartphone + broadband',

    careGaps: [
      { id: 'rc-1', domain: 'Clinical', name: 'BP Control Check', status: 'Open', daysOpen: 28, assignedTo: 'Dr. Castillo' },
      { id: 'rc-2', domain: 'Clinical', name: 'eGFR / Creatinine (CKD)', status: 'Open', daysOpen: 42, assignedTo: 'Dr. Castillo' },
      { id: 'rc-3', domain: 'Clinical', name: 'Urine Albumin-to-Creatinine Ratio', status: 'Open', daysOpen: 60, assignedTo: 'Dr. Castillo' },
      { id: 'rc-4', domain: 'BH', name: 'AUDIT-C Follow-up Counseling', status: 'Open', daysOpen: 21, assignedTo: 'Sarah Johnson' },
      { id: 'rc-5', domain: 'Social', name: 'Medication Cost Assistance', status: 'In Progress', daysOpen: 14, assignedTo: 'Sarah Johnson' },
    ],

    pathwaySteps: [
      { id: 'rcps-1', label: 'Hypertension Education', status: 'completed', date: 'Feb 10', metric: 'Completed' },
      { id: 'rcps-2', label: 'CKD Monitoring Protocol', status: 'completed', date: 'Mar 1', metric: 'Active' },
      { id: 'rcps-3', label: 'BP Control Optimization', status: 'in_progress', metric: 'Target: <130/80' },
      { id: 'rcps-4', label: 'Nephrology Referral', status: 'pending', metric: 'CKD Stage 3' },
      { id: 'rcps-5', label: 'AUDIT-C Counseling', status: 'pending', metric: 'Low-moderate risk' },
    ],

    aiCopilot:
      'Hypertension + CKD Stage 3 — BP control check 28 days overdue, eGFR 42 days overdue. AUDIT-C 4 low-moderate alcohol risk — counseling recommended. Medication cost assistance in progress. Consider nephrology referral given CKD progression risk.',

    cdsCards: [
      { id: 'cds-robert-1', indicator: 'warning', summary: 'BP control check overdue 28 days — hypertension gap', detail: 'Blood pressure control check is 28 days overdue. Last reading 158/96. Target <130/80. CKD Stage 3 makes BP control critical for kidney protection.' },
      { id: 'cds-robert-2', indicator: 'warning', summary: 'eGFR overdue 42 days — CKD monitoring gap', detail: 'CKD monitoring labs (eGFR, creatinine, UACR) are overdue. Last eGFR 42 (Stage 3b). Nephrology referral recommended if eGFR continues to decline.' },
      { id: 'cds-robert-3', indicator: 'info', summary: 'AUDIT-C 4 — low-moderate alcohol risk, counseling recommended', detail: 'AUDIT-C score 4 indicates low-moderate alcohol use risk. Brief counseling recommended. Alcohol use can worsen hypertension and accelerate CKD progression.' },
    ],

    conditions: [
      { key: 'rc-c1', code: 'I10', name: 'Essential (primary) hypertension', onset: '2014-06', status: 'Active', source: 'EMR' },
      { key: 'rc-c2', code: 'N18.3', name: 'Chronic kidney disease, stage 3b', onset: '2020-10', status: 'Active', source: 'EMR' },
      { key: 'rc-c3', code: 'F10.10', name: 'Alcohol use disorder, mild', onset: '2023-05', status: 'Active', source: 'EMR' },
    ],
    medications: [
      { key: 'rc-m1', name: 'Amlodipine', dose: '10mg', frequency: 'Daily', prescriber: 'Dr. Castillo', lastFill: '2026-04-05', adherence: 0.87, ddi: false },
      { key: 'rc-m2', name: 'Losartan', dose: '100mg', frequency: 'Daily', prescriber: 'Dr. Castillo', lastFill: '2026-04-05', adherence: 0.81, ddi: false },
      { key: 'rc-m3', name: 'Atorvastatin', dose: '40mg', frequency: 'Nightly', prescriber: 'Dr. Castillo', lastFill: '2026-03-22', adherence: 0.79, ddi: false },
    ],
    recentOrders: [
      { key: 'rc-o1', type: 'Lab', name: 'BP Check', result: '158/96 mmHg', date: '2026-03-15', status: 'Resulted', flag: 'High' },
      { key: 'rc-o2', type: 'Lab', name: 'eGFR / Creatinine', result: 'eGFR 42 (Stage 3b)', date: '2026-02-28', status: 'Resulted', flag: 'Low' },
      { key: 'rc-o3', type: 'Lab', name: 'Urine UACR', result: 'Overdue 60 days', date: '2026-02-15', status: 'Ordered', flag: 'High' },
      { key: 'rc-o4', type: 'Referral', name: 'Nephrology', result: 'Pending referral', date: '2026-04-10', status: 'Pending', flag: null },
    ],
    carePlanDomains: [
      {
        domain: 'Clinical',
        color: '#0043ce',
        icon: 'HeartIcon',
        goals: [
          { goal: 'BP < 130/80 by Q3 2026', status: 'in-progress', owner: 'Dr. Castillo', dueDate: '2026-09-30', tasks: ['Amlodipine 10mg + Losartan 100mg continued', 'Home BP log weekly', 'Sodium-restricted diet counseling'] },
          { goal: 'eGFR stabilized ≥ 40 by Q4 2026', status: 'in-progress', owner: 'Dr. Castillo', dueDate: '2026-12-31', tasks: ['Quarterly eGFR monitoring', 'UACR lab ordered', 'Nephrology referral if eGFR < 35'] },
        ],
      },
      {
        domain: 'Behavioral Health',
        color: '#6929c4',
        icon: 'SparklesIcon',
        goals: [
          { goal: 'AUDIT-C counseling completed', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['Brief alcohol intervention session', 'Follow-up AUDIT-C in 3 months'] },
        ],
      },
      {
        domain: 'Social Needs',
        color: '#b45309',
        icon: 'HomeIcon',
        goals: [
          { goal: 'Medication cost assistance enrolled', status: 'in-progress', owner: 'Sarah Johnson', dueDate: '2026-05-31', tasks: ['Patient Assistance Program application submitted', 'Pharmacy discount card provided'] },
        ],
      },
    ],
  },

  // ── Lisa Thompson ─────────────────────────────────────────────────────────
  {
    platformId: 'PAT-0156',
    journey: { id: 'ASTHMA_OBESITY_365D', currentDay: 203 },
    household: {
      dependents: [
        { name: 'Mason Thompson', relation: 'Son', age: 7, dob: '2018', plan: 'CHIP', consent: 'Parent proxy - ACTIVE',
          gaps: [
            { label: 'Asthma Well-Child + Inhaler Technique', urgency: 'high', detail: 'Spacer technique review overdue' },
            { label: 'Immunizations (7-year catch-up)', urgency: 'due', detail: 'Catch-up DTaP / IPV' },
          ],
          coordinatedOutreach: 'Lisa asthma + Mason asthma - combined family asthma-action review' },
        { name: 'Ava Thompson', relation: 'Daughter', age: 4, dob: '2021', plan: 'CHIP', consent: 'Parent proxy - ACTIVE',
          gaps: [
            { label: 'Well-Child 4-Year Visit', urgency: 'due', detail: 'Vision + dental screening due' },
          ] },
      ],
      caregiverFor: [],
    },
    fhirId: 'patient/lisa-thompson-156',
    ehrMrn: 'MRN-0156',

    name: 'Lisa Thompson',
    age: 41,
    gender: 'F',
    dob: '1985-05-19',
    location: '223 Pine Ave, Sioux Falls SD 57104',
    phone: '(605) 555-0412',

    pcp: 'Dr. Torres',
    careManager: 'Sarah Johnson',
    careManagerInitials: 'SJ',
    organization: 'Sioux Falls Community Health',
    contract: 'Medicaid RHTP Track 3',
    attribution: 'Confirmed · Medicaid RHTP Track 3',

    rafScore: 1.4,
    riskTier: 'Moderate',
    riskLabel: 'Moderate — 31% ER risk',
    erRiskPct: 31,
    hccSuspects: 1,
    hccValue: 5800,
    openCareGaps: 4,
    episodeType: 'Asthma · Obesity',
    episodeStatus: 'Active',
    episodeDaysActive: 203,
    pmpm: 620,
    pmpmTarget: 480,
    lastContact: '5 weeks ago',

    bhScreeningLabel: 'PHQ-9',
    bhScore: 6,
    bhScoreLabel: 'PHQ-9 6 — Minimal symptoms',
    auditC: 1,
    bhRisk: 'Low',
    bhReferralStatus: 'Not referred',
    bhProvider: '—',
    burdenScore: 'PAM 3 — Beginning to take action',
    patientGoal: "'Lose weight and breathe easier'",

    transportStatus: 'Adequate — urban location',
    foodSecurity: 'SNAP active',
    housingStatus: 'Stable — rents apartment',
    language: 'English',
    ruralDistance: '3 miles to clinic',
    disparityFlag: 'Low income · Medicaid',
    cohortFlag: 'Asthma · Obesity · Urban SD',
    snapStatus: 'Active',
    digitalAccess: 'Smartphone + broadband',

    careGaps: [
      { id: 'lt-1', domain: 'Clinical', name: 'Asthma Action Plan Update', status: 'Open', daysOpen: 35, assignedTo: 'Dr. Torres' },
      { id: 'lt-2', domain: 'Clinical', name: 'BMI / Weight Management Referral', status: 'In Progress', daysOpen: 60, assignedTo: 'Dr. Torres' },
      { id: 'lt-3', domain: 'BH', name: 'PHQ-9 Annual Screening', status: 'Open', daysOpen: 18, assignedTo: 'Sarah Johnson' },
      { id: 'lt-4', domain: 'Social', name: 'Nutrition Counseling Enrollment', status: 'Open', daysOpen: 45, assignedTo: 'Sarah Johnson' },
    ],

    pathwaySteps: [
      { id: 'ltps-1', label: 'Asthma Education', status: 'completed', date: 'Jan 20', metric: 'Completed' },
      { id: 'ltps-2', label: 'Inhaler Technique Review', status: 'completed', date: 'Feb 5', metric: 'Corrected' },
      { id: 'ltps-3', label: 'Weight Management Program', status: 'in_progress', metric: 'Goal: -15 lbs' },
      { id: 'ltps-4', label: 'Nutrition Counseling', status: 'pending', metric: 'SNAP-Ed eligible' },
      { id: 'ltps-5', label: 'Asthma Action Plan Update', status: 'pending', metric: 'Annual review' },
    ],

    aiCopilot:
      'Asthma + Obesity — action plan update 35 days overdue, weight management referral in progress. PHQ-9 6 minimal symptoms — annual screening due. Nutrition counseling enrollment pending (SNAP-Ed eligible). Good engagement potential — urban location, broadband access.',

    cdsCards: [
      { id: 'cds-lisa-1', indicator: 'info', summary: 'Asthma action plan update overdue 35 days', detail: 'Annual asthma action plan review is 35 days overdue. Inhaler technique corrected Feb 5. Consider spirometry to assess current lung function and update rescue medication plan.' },
      { id: 'cds-lisa-2', indicator: 'info', summary: 'Weight management referral in progress — BMI elevated', detail: 'BMI elevated — weight management referral active. Patient goal: -15 lbs. SNAP-Ed nutrition counseling eligible. Consider structured weight management program enrollment.' },
      { id: 'cds-lisa-3', indicator: 'info', summary: 'PHQ-9 annual screening due', detail: 'Annual PHQ-9 depression screening is due. Last score 6 (minimal). Chronic disease burden (asthma + obesity) increases BH risk. Complete during next encounter.' },
    ],

    conditions: [
      { key: 'lt-c1', code: 'J45.50', name: 'Severe persistent asthma, uncomplicated', onset: '2012-03', status: 'Active', source: 'EMR' },
      { key: 'lt-c2', code: 'E66.9', name: 'Obesity, unspecified (BMI 38)', onset: '2018-09', status: 'Active', source: 'EMR' },
    ],
    medications: [
      { key: 'lt-m1', name: 'Fluticasone / Salmeterol', dose: '250/50mcg', frequency: 'BID inhaled', prescriber: 'Dr. Torres', lastFill: '2026-04-08', adherence: 0.76, ddi: false },
      { key: 'lt-m2', name: 'Albuterol HFA', dose: '90mcg', frequency: 'PRN', prescriber: 'Dr. Torres', lastFill: '2026-04-12', adherence: null, ddi: false },
      { key: 'lt-m3', name: 'Montelukast', dose: '10mg', frequency: 'Daily', prescriber: 'Dr. Torres', lastFill: '2026-03-30', adherence: 0.88, ddi: false },
    ],
    recentOrders: [
      { key: 'lt-o1', type: 'Lab', name: 'Spirometry', result: 'Overdue 35 days', date: '2026-03-28', status: 'Ordered', flag: 'High' },
      { key: 'lt-o2', type: 'Referral', name: 'Weight Management Program', result: 'In progress — -4 lbs since referral', date: '2026-02-20', status: 'Pending', flag: null },
      { key: 'lt-o3', type: 'Screening', name: 'PHQ-9 Annual', result: 'Due', date: '2026-04-15', status: 'Ordered', flag: null },
      { key: 'lt-o4', type: 'Referral', name: 'Nutrition Counseling (SNAP-Ed)', result: 'Pending enrollment', date: '2026-04-01', status: 'Pending', flag: null },
    ],
    carePlanDomains: [
      {
        domain: 'Clinical',
        color: '#0043ce',
        icon: 'HeartIcon',
        goals: [
          { goal: 'Asthma action plan updated by Jun 2026', status: 'open', owner: 'Dr. Torres', dueDate: '2026-06-30', tasks: ['Spirometry scheduled', 'Inhaler technique re-evaluation', 'Rescue medication plan updated'] },
          { goal: 'BMI reduction -15 lbs by Q4 2026', status: 'in-progress', owner: 'Dr. Torres', dueDate: '2026-12-31', tasks: ['Weight management program enrolled', 'Weekly weigh-in log', 'SNAP-Ed nutrition counseling'] },
        ],
      },
      {
        domain: 'Behavioral Health',
        color: '#6929c4',
        icon: 'SparklesIcon',
        goals: [
          { goal: 'PHQ-9 annual screening completed', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['PHQ-9 assessment scheduled', 'Review results with PCP'] },
        ],
      },
      {
        domain: 'Social Needs',
        color: '#b45309',
        icon: 'HomeIcon',
        goals: [
          { goal: 'Nutrition counseling enrollment by Jul 2026', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-07-31', tasks: ['SNAP-Ed program referral sent', 'Confirm enrollment with community partner'] },
        ],
      },
    ],
  },
];

// ─── Lookup Functions ─────────────────────────────────────────────────────────

/**
 * Get a patient by platform ID (e.g. 'MARIA_SD_001', 'PAT-0042')
 * Returns undefined if not found.
 */
export function getPatientById(platformId: string): RegistryPatient | undefined {
  return PATIENT_REGISTRY.find((p) => p.platformId === platformId);
}

/**
 * Get a patient by FHIR patient ID (from EHR launch context)
 * Resolves via FHIR_ID_MAP → platform ID → registry lookup
 */
export function getPatientByFhirId(fhirId: string): RegistryPatient | undefined {
  const platformId = FHIR_ID_MAP[fhirId];
  if (!platformId) return undefined;
  return getPatientById(platformId);
}

/**
 * Get a patient by EHR MRN
 */
export function getPatientByMrn(mrn: string): RegistryPatient | undefined {
  return PATIENT_REGISTRY.find((p) => p.ehrMrn === mrn);
}

/**
 * Resolve a FHIR patient ID to a platform ID.
 * Returns undefined if no mapping exists.
 */
export function resolveFhirToPlatformId(fhirId: string): string | undefined {
  return FHIR_ID_MAP[fhirId];
}

/**
 * Get all patients in the registry
 */
export function getAllPatients(): RegistryPatient[] {
  return PATIENT_REGISTRY;
}

/**
 * Get patients visible for the current data mode.
 *
 * useMock=true  → only patients tagged mockOnly:true (Maria only)
 * useMock=false → all patients (FHIR patients + Maria as demo anchor)
 *
 * Import getFhirMockMode from fhirClient to get the current runtime value,
 * or pass it directly from appContext.useMockData.
 */
export function getVisiblePatients(useMock: boolean): RegistryPatient[] {
  if (useMock) {
    // Mock mode: only show Maria (the guaranteed mock patient)
    return PATIENT_REGISTRY.filter((p) => p.mockOnly === true);
  }
  // Live FHIR mode: show everyone
  return PATIENT_REGISTRY;
}

export default PATIENT_REGISTRY;
