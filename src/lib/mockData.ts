// Backend integration point: replace mock adapters with live API calls in Phase 2

export type RiskTier = 'Critical' | 'High' | 'Moderate' | 'Low';
export type AttributionStatus = 'Confirmed' | 'Provisional' | 'Disputed' | 'Dropped';
export type HCCStatus = 'Surfaced' | 'Evidence Reviewed' | 'Clinician Review' | 'Documented' | 'Submitted' | 'Confirmed' | 'Rejected';
export type GapStatus = 'Open' | 'In Progress' | 'Closed' | 'Excluded' | 'Expired';
export type AlertTier = 'Critical' | 'Important' | 'Informational';
export type ProgramType = 'MSSP ACO' | 'ACO REACH' | 'Commercial VBC' | 'Medicaid MCO';
export type NetworkTier = 'Preferred' | 'In-Network' | 'Out-of-Network';
export type UserRole = 'care_manager' | 'physician';

export interface Contract {
  id: string;
  name: string;
  payer: string;
  programType: ProgramType;
  contractPeriod: string;
  attributedLives: number;
  pmpmTarget: number;
  pmpmActual: number;
  gapClosureRate: number;
  gapClosureTarget: number;
  rafCaptureRate: number;
  starsRating: number;
  activeAlerts: number;
  openHCCSuspects: number;
  hccRevenueAtRisk: number;
  performanceStatus: 'On Track' | 'At Risk' | 'Below Target';
  expiresInDays: number | null;
  lastUpdated: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  mrn: string;
  riskTier: RiskTier;
  rafScore: number;
  rafScoreDelta: number;
  predictedErRisk: number;
  openHCCSuspects: number;
  hccSuspectValue: number;
  openCareGaps: number;
  lastContactDate: string;
  attributionStatus: AttributionStatus;
  pmpmCost: number;
  pmpmTarget: number;
  primaryCareProvider: string;
  activeAlerts: number;
  carePlanStatus: 'Active' | 'Pending' | 'None';
  contractId: string;
  phone: string;
  address: string;
  insuranceId: string;
  payer: string;
  enrollmentDate: string;
}

export interface HCCSuspect {
  id: string;
  patientId: string;
  hccCode: string;
  hccDescription: string;
  icdCode: string;
  icdDescription: string;
  estimatedRafDelta: number;
  estimatedRevenueDelta: number;
  status: HCCStatus;
  evidenceSources: string[];
  lastEncounterDate: string;
  suspectConfidence: number;
  assignedPhysician: string;
  submissionDeadline: string;
  dataSource: 'EMR' | 'Claims' | 'HIE' | 'LPR';
  freshnessDate: string;
}

export interface CareGap {
  id: string;
  patientId: string;
  measureId: string;
  measureName: string;
  program: 'HEDIS' | 'STARS' | 'MIPS';
  status: GapStatus;
  dueDate: string;
  daysOpen: number;
  lastActionDate: string;
  assignedTo: string;
  notes: string;
  closureRequirement: string;
}

export interface UtilizationAlert {
  id: string;
  patientId: string;
  tier: AlertTier;
  type: 'Predicted ER Risk' | 'Avoidable Admission' | 'High-Cost Imaging' | 'Poly-Pharmacy' | 'SNF Readmission Risk';
  description: string;
  riskScore: number;
  estimatedCost: number;
  createdDate: string;
  source: 'LPR' | 'CDS Hooks' | 'Claims' | 'EMR';
  status: 'Active' | 'Escalated' | 'Intervention Assigned' | 'Resolved' | 'Dismissed';
  freshnessDate: string;
}

export interface CostEnvelope {
  patientId: string;
  contractId: string;
  period: string;
  inpatient: number;
  er: number;
  specialty: number;
  pharmacy: number;
  postAcute: number;
  primaryCare: number;
  total: number;
  targetTotal: number;
  pmpm: number;
  pmpmTarget: number;
}

export interface Provider {
  id: string;
  npi: string;
  name: string;
  specialty: string;
  networkTier: NetworkTier;
  costPercentile: number;
  qualityScore: number;
  acceptingNewPatients: boolean;
  affiliatedFacility: string;
  distance: number;
  starsRating: number;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  boardCertified: boolean;
  languagesSpoken: string[];
  avgWaitDays: number;
  patientSatisfaction: number;
  vbcAligned: boolean;
}

// ── CONTRACTS ──────────────────────────────────────────────
export const mockContracts: Contract[] = [
  {
    id: 'contract-001',
    name: 'Medicare MSSP Track 3',
    payer: 'CMS / Medicare',
    programType: 'MSSP ACO',
    contractPeriod: 'Jan 2025 – Dec 2025',
    attributedLives: 4872,
    pmpmTarget: 890.00,
    pmpmActual: 847.32,
    gapClosureRate: 0.743,
    gapClosureTarget: 0.80,
    rafCaptureRate: 0.812,
    starsRating: 4.0,
    activeAlerts: 38,
    openHCCSuspects: 214,
    hccRevenueAtRisk: 1284000,
    performanceStatus: 'At Risk',
    expiresInDays: 260,
    lastUpdated: '2026-04-15T08:00:00Z',
  },
  {
    id: 'contract-002',
    name: 'ACO REACH Enhanced Track',
    payer: 'CMS / CMMI',
    programType: 'ACO REACH',
    contractPeriod: 'Jan 2025 – Dec 2025',
    attributedLives: 2341,
    pmpmTarget: 1120.00,
    pmpmActual: 1089.50,
    gapClosureRate: 0.821,
    gapClosureTarget: 0.78,
    rafCaptureRate: 0.891,
    starsRating: 4.5,
    activeAlerts: 12,
    openHCCSuspects: 87,
    hccRevenueAtRisk: 522000,
    performanceStatus: 'On Track',
    expiresInDays: 260,
    lastUpdated: '2026-04-15T07:45:00Z',
  },
  {
    id: 'contract-003',
    name: 'Anthem BlueCross Commercial VBC',
    payer: 'Anthem BlueCross',
    programType: 'Commercial VBC',
    contractPeriod: 'Jul 2025 – Jun 2026',
    attributedLives: 1890,
    pmpmTarget: 680.00,
    pmpmActual: 734.20,
    gapClosureRate: 0.612,
    gapClosureTarget: 0.75,
    rafCaptureRate: 0.703,
    starsRating: 3.5,
    activeAlerts: 61,
    openHCCSuspects: 156,
    hccRevenueAtRisk: 780000,
    performanceStatus: 'Below Target',
    expiresInDays: 447,
    lastUpdated: '2026-04-14T16:30:00Z',
  },
  {
    id: 'contract-004',
    name: 'UnitedHealth Community Plan',
    payer: 'UnitedHealthcare',
    programType: 'Medicaid MCO',
    contractPeriod: 'Apr 2025 – Mar 2026',
    attributedLives: 3210,
    pmpmTarget: 540.00,
    pmpmActual: 518.90,
    gapClosureRate: 0.689,
    gapClosureTarget: 0.70,
    rafCaptureRate: 0.762,
    starsRating: 3.0,
    activeAlerts: 29,
    openHCCSuspects: 132,
    hccRevenueAtRisk: 396000,
    performanceStatus: 'On Track',
    expiresInDays: 365,
    lastUpdated: '2026-04-15T09:15:00Z',
  },
  {
    id: 'contract-005',
    name: 'Humana Medicare Advantage',
    payer: 'Humana',
    programType: 'MSSP ACO',
    contractPeriod: 'Jan 2025 – Dec 2025',
    attributedLives: 1654,
    pmpmTarget: 980.00,
    pmpmActual: 1042.10,
    gapClosureRate: 0.541,
    gapClosureTarget: 0.72,
    rafCaptureRate: 0.634,
    starsRating: 2.5,
    activeAlerts: 74,
    openHCCSuspects: 203,
    hccRevenueAtRisk: 1624000,
    performanceStatus: 'Below Target',
    expiresInDays: 14,
    lastUpdated: '2026-04-15T06:00:00Z',
  },
  {
    id: 'contract-006',
    name: 'Cigna Total Care Partnership',
    payer: 'Cigna',
    programType: 'Commercial VBC',
    contractPeriod: 'Jan 2026 – Dec 2026',
    attributedLives: 987,
    pmpmTarget: 720.00,
    pmpmActual: 698.40,
    gapClosureRate: 0.774,
    gapClosureTarget: 0.75,
    rafCaptureRate: 0.843,
    starsRating: 4.0,
    activeAlerts: 8,
    openHCCSuspects: 44,
    hccRevenueAtRisk: 176000,
    performanceStatus: 'On Track',
    expiresInDays: 260,
    lastUpdated: '2026-04-15T10:00:00Z',
  },
];

// ── PATIENTS ──────────────────────────────────────────────
export const mockPatients: Patient[] = [
  {
    id: 'patient-001',
    name: 'Maria Reyes',
    dob: '03/14/1957',
    age: 69,
    gender: 'F',
    mrn: 'MRN-00847291',
    riskTier: 'Critical',
    rafScore: 3.58,
    rafScoreDelta: 0.24,
    predictedErRisk: 0.81,
    openHCCSuspects: 4,
    hccSuspectValue: 26400,
    openCareGaps: 6,
    lastContactDate: '2026-04-14',
    attributionStatus: 'Confirmed',
    pmpmCost: 2960.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. James Chen',
    activeAlerts: 6,
    carePlanStatus: 'Active',
    contractId: 'contract-001',
    phone: '(312) 555-0198',
    address: '1842 S. Fairfield Ave, Chicago, IL 60608',
    insuranceId: 'MCR-4472910',
    payer: 'CMS / Medicare Advantage',
    enrollmentDate: '2025-01-01',
  },
  {
    id: 'patient-002',
    name: 'Delroy Hutchinson',
    dob: '07/22/1952',
    age: 73,
    gender: 'M',
    mrn: 'MRN-198432',
    riskTier: 'Critical',
    rafScore: 2.89,
    rafScoreDelta: -0.12,
    predictedErRisk: 0.71,
    openHCCSuspects: 3,
    hccSuspectValue: 18600,
    openCareGaps: 4,
    lastContactDate: '2026-04-02',
    attributionStatus: 'Confirmed',
    pmpmCost: 2210.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. Sarah Nakamura',
    activeAlerts: 3,
    carePlanStatus: 'Active',
    contractId: 'contract-001',
    phone: '(773) 555-0289',
    address: '1203 S. Michigan Ave, Chicago, IL 60605',
    insuranceId: 'MCR-7734219',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-01-01',
  },
  {
    id: 'patient-003',
    name: 'Rosa Evangelista',
    dob: '11/05/1955',
    age: 70,
    gender: 'F',
    mrn: 'MRN-211654',
    riskTier: 'High',
    rafScore: 2.14,
    rafScoreDelta: 0.31,
    predictedErRisk: 0.58,
    openHCCSuspects: 2,
    hccSuspectValue: 12400,
    openCareGaps: 3,
    lastContactDate: '2026-04-08',
    attributionStatus: 'Confirmed',
    pmpmCost: 1640.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. James Whitfield',
    activeAlerts: 2,
    carePlanStatus: 'Active',
    contractId: 'contract-001',
    phone: '(312) 555-0374',
    address: '892 N. Pulaski Rd, Chicago, IL 60651',
    insuranceId: 'MCR-9012847',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-01-01',
  },
  {
    id: 'patient-004',
    name: 'Bernard Thibodeau',
    dob: '02/18/1960',
    age: 66,
    gender: 'M',
    mrn: 'MRN-187203',
    riskTier: 'High',
    rafScore: 1.87,
    rafScoreDelta: 0.05,
    predictedErRisk: 0.43,
    openHCCSuspects: 2,
    hccSuspectValue: 9800,
    openCareGaps: 5,
    lastContactDate: '2026-03-15',
    attributionStatus: 'Provisional',
    pmpmCost: 1290.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. Anil Patel',
    activeAlerts: 1,
    carePlanStatus: 'Pending',
    contractId: 'contract-001',
    phone: '(773) 555-0516',
    address: '3456 W. Irving Park Rd, Chicago, IL 60618',
    insuranceId: 'MCR-6628341',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-02-01',
  },
  {
    id: 'patient-005',
    name: 'Constance Abara',
    dob: '09/30/1958',
    age: 67,
    gender: 'F',
    mrn: 'MRN-223910',
    riskTier: 'High',
    rafScore: 1.64,
    rafScoreDelta: -0.08,
    predictedErRisk: 0.39,
    openHCCSuspects: 1,
    hccSuspectValue: 6200,
    openCareGaps: 2,
    lastContactDate: '2026-04-10',
    attributionStatus: 'Confirmed',
    pmpmCost: 1180.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. Sarah Nakamura',
    activeAlerts: 2,
    carePlanStatus: 'Active',
    contractId: 'contract-001',
    phone: '(312) 555-0628',
    address: '7102 S. Cottage Grove, Chicago, IL 60619',
    insuranceId: 'MCR-5541872',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-01-01',
  },
  {
    id: 'patient-006',
    name: 'Walter Przybylski',
    dob: '06/12/1963',
    age: 62,
    gender: 'M',
    mrn: 'MRN-194782',
    riskTier: 'Moderate',
    rafScore: 1.21,
    rafScoreDelta: 0.14,
    predictedErRisk: 0.22,
    openHCCSuspects: 1,
    hccSuspectValue: 4600,
    openCareGaps: 3,
    lastContactDate: '2026-03-22',
    attributionStatus: 'Confirmed',
    pmpmCost: 920.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. Anil Patel',
    activeAlerts: 1,
    carePlanStatus: 'Active',
    contractId: 'contract-001',
    phone: '(773) 555-0741',
    address: '2218 N. Kedzie Blvd, Chicago, IL 60647',
    insuranceId: 'MCR-4419023',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-01-01',
  },
  {
    id: 'patient-007',
    name: 'Yolanda Ferreira-Santos',
    dob: '04/28/1970',
    age: 55,
    gender: 'F',
    mrn: 'MRN-231847',
    riskTier: 'Moderate',
    rafScore: 0.98,
    rafScoreDelta: 0.02,
    predictedErRisk: 0.18,
    openHCCSuspects: 0,
    hccSuspectValue: 0,
    openCareGaps: 4,
    lastContactDate: '2026-04-01',
    attributionStatus: 'Confirmed',
    pmpmCost: 780.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. James Whitfield',
    activeAlerts: 0,
    carePlanStatus: 'None',
    contractId: 'contract-001',
    phone: '(312) 555-0853',
    address: '5610 W. Addison St, Chicago, IL 60641',
    insuranceId: 'MCR-3308914',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-03-01',
  },
  {
    id: 'patient-008',
    name: 'Clarence Drummond',
    dob: '08/14/1965',
    age: 60,
    gender: 'M',
    mrn: 'MRN-208341',
    riskTier: 'Moderate',
    rafScore: 0.87,
    rafScoreDelta: -0.04,
    predictedErRisk: 0.15,
    openHCCSuspects: 1,
    hccSuspectValue: 3800,
    openCareGaps: 2,
    lastContactDate: '2026-04-12',
    attributionStatus: 'Provisional',
    pmpmCost: 690.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. Anil Patel',
    activeAlerts: 1,
    carePlanStatus: 'None',
    contractId: 'contract-001',
    phone: '(773) 555-0964',
    address: '1847 E. 87th St, Chicago, IL 60617',
    insuranceId: 'MCR-2297105',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-01-01',
  },
  {
    id: 'patient-009',
    name: 'Ingrid Halvorsen',
    dob: '01/03/1972',
    age: 54,
    gender: 'F',
    mrn: 'MRN-215629',
    riskTier: 'Low',
    rafScore: 0.54,
    rafScoreDelta: 0.01,
    predictedErRisk: 0.07,
    openHCCSuspects: 0,
    hccSuspectValue: 0,
    openCareGaps: 1,
    lastContactDate: '2026-02-18',
    attributionStatus: 'Confirmed',
    pmpmCost: 420.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. Sarah Nakamura',
    activeAlerts: 0,
    carePlanStatus: 'None',
    contractId: 'contract-001',
    phone: '(312) 555-1076',
    address: '9340 S. Western Ave, Chicago, IL 60643',
    insuranceId: 'MCR-1186296',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-01-01',
  },
  {
    id: 'patient-010',
    name: 'Reginald Osei-Bonsu',
    dob: '12/20/1967',
    age: 58,
    gender: 'M',
    mrn: 'MRN-202918',
    riskTier: 'Low',
    rafScore: 0.61,
    rafScoreDelta: 0.06,
    predictedErRisk: 0.09,
    openHCCSuspects: 0,
    hccSuspectValue: 0,
    openCareGaps: 2,
    lastContactDate: '2026-04-05',
    attributionStatus: 'Confirmed',
    pmpmCost: 510.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. James Whitfield',
    activeAlerts: 0,
    carePlanStatus: 'None',
    contractId: 'contract-001',
    phone: '(773) 555-1188',
    address: '623 N. Clark St, Chicago, IL 60654',
    insuranceId: 'MCR-0075387',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-02-01',
  },
  {
    id: 'patient-011',
    name: 'Sylvia Montecinos',
    dob: '05/08/1950',
    age: 75,
    gender: 'F',
    mrn: 'MRN-219847',
    riskTier: 'Critical',
    rafScore: 3.18,
    rafScoreDelta: 0.24,
    predictedErRisk: 0.79,
    openHCCSuspects: 5,
    hccSuspectValue: 31000,
    openCareGaps: 7,
    lastContactDate: '2026-04-14',
    attributionStatus: 'Confirmed',
    pmpmCost: 3120.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. James Whitfield',
    activeAlerts: 6,
    carePlanStatus: 'Active',
    contractId: 'contract-001',
    phone: '(312) 555-1290',
    address: '2847 W. Fullerton Ave, Chicago, IL 60647',
    insuranceId: 'MCR-9903412',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-01-01',
  },
  {
    id: 'patient-012',
    name: 'Kwame Asantewaa',
    dob: '03/27/1957',
    age: 69,
    gender: 'M',
    mrn: 'MRN-226134',
    riskTier: 'High',
    rafScore: 1.73,
    rafScoreDelta: -0.15,
    predictedErRisk: 0.47,
    openHCCSuspects: 2,
    hccSuspectValue: 11200,
    openCareGaps: 3,
    lastContactDate: '2026-03-30',
    attributionStatus: 'Disputed',
    pmpmCost: 1380.00,
    pmpmTarget: 890.00,
    primaryCareProvider: 'Dr. Anil Patel',
    activeAlerts: 2,
    carePlanStatus: 'Pending',
    contractId: 'contract-001',
    phone: '(773) 555-1402',
    address: '4512 S. Drexel Blvd, Chicago, IL 60653',
    insuranceId: 'MCR-8892503',
    payer: 'CMS / Medicare',
    enrollmentDate: '2025-01-01',
  },
];

// ── HCC SUSPECTS ──────────────────────────────────────────
export const mockHCCSuspects: HCCSuspect[] = [
  {
    id: 'hcc-001',
    patientId: 'patient-001',
    hccCode: 'HCC 85',
    hccDescription: 'Congestive Heart Failure',
    icdCode: 'I50.32',
    icdDescription: 'Chronic diastolic (congestive) heart failure',
    estimatedRafDelta: 0.331,
    estimatedRevenueDelta: 7200,
    status: 'Clinician Review',
    evidenceSources: ['Echocardiogram 03/12/2026', 'BNP 842 pg/mL 03/28/2026', 'ED visit 02/14/2026'],
    lastEncounterDate: '2026-04-14',
    suspectConfidence: 0.91,
    assignedPhysician: 'Dr. James Chen',
    submissionDeadline: '2026-06-30',
    dataSource: 'EMR',
    freshnessDate: '2026-04-10',
  },
  {
    id: 'hcc-002',
    patientId: 'patient-001',
    hccCode: 'HCC 18',
    hccDescription: 'Diabetes with Chronic Complications',
    icdCode: 'E11.65',
    icdDescription: 'Type 2 diabetes mellitus with hyperglycemia',
    estimatedRafDelta: 0.302,
    estimatedRevenueDelta: 6600,
    status: 'Evidence Reviewed',
    evidenceSources: ['HbA1c 9.2% 04/10/2026', 'Labcorp outreach note 04/12/2026'],
    lastEncounterDate: '2026-04-14',
    suspectConfidence: 0.87,
    assignedPhysician: 'Dr. James Chen',
    submissionDeadline: '2026-06-30',
    dataSource: 'Claims',
    freshnessDate: '2026-04-08',
  },
  {
    id: 'hcc-003',
    patientId: 'patient-001',
    hccCode: 'HCC 111',
    hccDescription: 'Chronic Obstructive Pulmonary Disease',
    icdCode: 'J44.1',
    icdDescription: 'COPD with acute exacerbation',
    estimatedRafDelta: 0.346,
    estimatedRevenueDelta: 7560,
    status: 'Surfaced',
    evidenceSources: ['Medication reconciliation 04/14/2026', 'Claims overlap Warfarin/Coumadin 04/11/2026'],
    lastEncounterDate: '2026-04-14',
    suspectConfidence: 0.78,
    assignedPhysician: 'Dr. James Chen',
    submissionDeadline: '2026-06-30',
    dataSource: 'HIE',
    freshnessDate: '2026-04-05',
  },
  {
    id: 'hcc-004',
    patientId: 'patient-002',
    hccCode: 'HCC 85',
    hccDescription: 'Congestive Heart Failure',
    icdCode: 'I50.22',
    icdDescription: 'Chronic systolic (congestive) heart failure',
    estimatedRafDelta: 0.331,
    estimatedRevenueDelta: 7200,
    status: 'Documented',
    evidenceSources: ['Cardiology consult 04/01/2026', 'Echo 03/22/2026'],
    lastEncounterDate: '2026-04-01',
    suspectConfidence: 0.96,
    assignedPhysician: 'Dr. Sarah Nakamura',
    submissionDeadline: '2026-06-30',
    dataSource: 'EMR',
    freshnessDate: '2026-04-12',
  },
  {
    id: 'hcc-005',
    patientId: 'patient-001',
    hccCode: 'HCC 22',
    hccDescription: 'Morbid Obesity',
    icdCode: 'E66.01',
    icdDescription: 'Morbid (severe) obesity due to excess calories',
    estimatedRafDelta: 0.271,
    estimatedRevenueDelta: 5920,
    status: 'Surfaced',
    evidenceSources: ['Transportation screening 04/14/2026', 'Community outreach note 04/13/2026'],
    lastEncounterDate: '2026-04-14',
    suspectConfidence: 0.94,
    assignedPhysician: 'Dr. James Chen',
    submissionDeadline: '2026-06-30',
    dataSource: 'EMR',
    freshnessDate: '2026-04-10',
  },
];

// ── CARE GAPS ──────────────────────────────────────────────
export const mockCareGaps: CareGap[] = [
  {
    id: 'gap-001',
    patientId: 'patient-001',
    measureId: 'HEDIS-CDC-HbA1c',
    measureName: 'HbA1c Poor Control (>9%)',
    program: 'HEDIS',
    status: 'Open',
    dueDate: '2026-09-30',
    daysOpen: 105,
    lastActionDate: '2026-01-10',
    assignedTo: 'Care Manager',
    notes: 'Labcorp home draw requested. Maria needs transportation backup if home draw fails.',
    closureRequirement: 'HbA1c result < 9.0% documented in measurement year via Labcorp result feed',
  },
  {
    id: 'gap-002',
    patientId: 'patient-001',
    measureId: 'STARS-C01',
    measureName: 'Annual Wellness Visit',
    program: 'STARS',
    status: 'In Progress',
    dueDate: '2026-12-31',
    daysOpen: 45,
    lastActionDate: '2026-03-01',
    assignedTo: 'Dr. James Whitfield',
    notes: 'Annual visit bundled into Dr. Chen follow-up and PCP coordination workflow.',
    closureRequirement: 'AWV or comprehensive preventive visit billed with G0438/G0439',
  },
  {
    id: 'gap-003',
    patientId: 'patient-001',
    measureId: 'HEDIS-EED',
    measureName: 'Eye Exam for Diabetics',
    program: 'HEDIS',
    status: 'Open',
    dueDate: '2026-09-30',
    daysOpen: 180,
    lastActionDate: '2025-10-15',
    assignedTo: 'Care Manager',
    notes: 'Dr. Chen requested diabetic retinal follow-up after medication reconciliation.',
    closureRequirement: 'Retinal exam or dilated eye exam by qualified provider',
  },
  {
    id: 'gap-004',
    patientId: 'patient-001',
    measureId: 'MIPS-PREV-12',
    measureName: 'Colorectal Cancer Screening',
    program: 'MIPS',
    status: 'Open',
    dueDate: '2026-12-31',
    daysOpen: 62,
    lastActionDate: '2026-02-14',
    assignedTo: 'Dr. James Whitfield',
    notes: 'Deferred while acute diabetes and medication safety issues are prioritized.',
    closureRequirement: 'Colonoscopy, FIT, or stool DNA test documented',
  },
  {
    id: 'gap-005',
    patientId: 'patient-001',
    measureId: 'STARS-D12',
    measureName: 'Medication Adherence — Diabetes',
    program: 'STARS',
    status: 'Open',
    dueDate: '2026-12-31',
    daysOpen: 90,
    lastActionDate: '2026-01-25',
    assignedTo: 'Pharmacy',
    notes: 'Medication adherence impacted by duplicate anticoagulant confusion and transportation barriers.',
    closureRequirement: 'PDC ≥ 0.80 for diabetes medications in measurement year after medication reconciliation',
  },
  {
    id: 'gap-006',
    patientId: 'patient-001',
    measureId: 'HEDIS-CBP',
    measureName: 'Controlling Blood Pressure',
    program: 'HEDIS',
    status: 'Closed',
    dueDate: '2026-09-30',
    daysOpen: 0,
    lastActionDate: '2026-04-08',
    assignedTo: 'Dr. James Whitfield',
    notes: 'BP 128/76 documented at 04/08 visit. Measure closed.',
    closureRequirement: 'BP < 140/90 mmHg documented at last measurement',
  },
];

// ── UTILIZATION ALERTS ──────────────────────────────────────
export const mockAlerts: UtilizationAlert[] = [
  {
    id: 'alert-001',
    patientId: 'patient-001',
    tier: 'Critical',
    type: 'Predicted ER Risk',
    description: 'Model predicts 81% probability of avoidable ER visit within 30 days based on uncontrolled diabetes, duplicate anticoagulants, and transportation barriers.',
    riskScore: 0.84,
    estimatedCost: 3800,
    createdDate: '2026-04-13',
    source: 'LPR',
    status: 'Escalated',
    freshnessDate: '2026-04-15',
  },
  {
    id: 'alert-002',
    patientId: 'patient-001',
    tier: 'Important',
    type: 'Poly-Pharmacy',
    description: 'Duplicate anticoagulant therapy identified: Warfarin + Coumadin active concurrently. Dr. Chen review required before next fill.',
    riskScore: 0.62,
    estimatedCost: 1200,
    createdDate: '2026-04-10',
    source: 'Claims',
    status: 'Active',
    freshnessDate: '2026-04-10',
  },
  {
    id: 'alert-003',
    patientId: 'patient-001',
    tier: 'Important',
    type: 'High-Cost Imaging',
    description: 'Cardiac MRI ordered ($4,200). Alternative: Stress Echo ($890) may be clinically equivalent per cardiology guidelines.',
    riskScore: 0.0,
    estimatedCost: 4200,
    createdDate: '2026-04-14',
    source: 'CDS Hooks',
    status: 'Active',
    freshnessDate: '2026-04-14',
  },
  {
    id: 'alert-004',
    patientId: 'patient-002',
    tier: 'Critical',
    type: 'Avoidable Admission',
    description: 'Patient admitted 04/12 for CHF exacerbation. Prior authorization for home health not obtained. Readmission risk elevated.',
    riskScore: 0.71,
    estimatedCost: 18400,
    createdDate: '2026-04-12',
    source: 'LPR',
    status: 'Intervention Assigned',
    freshnessDate: '2026-04-15',
  },
];

// ── COST ENVELOPES ──────────────────────────────────────────
export const mockCostEnvelopes: CostEnvelope[] = [
  {
    patientId: 'patient-001',
    contractId: 'contract-001',
    period: 'YTD 2026',
    inpatient: 14200,
    er: 3800,
    specialty: 8400,
    pharmacy: 4200,
    postAcute: 2100,
    primaryCare: 1680,
    total: 34380,
    targetTotal: 10680,
    pmpm: 2840,
    pmpmTarget: 890,
  },
];

// ── PMPM TREND DATA ──────────────────────────────────────────
export const mockPmpmTrend = [
  { month: 'Apr 25', actual: 862, target: 890 },
  { month: 'May 25', actual: 878, target: 890 },
  { month: 'Jun 25', actual: 901, target: 890 },
  { month: 'Jul 25', actual: 923, target: 890 },
  { month: 'Aug 25', actual: 934, target: 890 },
  { month: 'Sep 25', actual: 912, target: 890 },
  { month: 'Oct 25', actual: 887, target: 890 },
  { month: 'Nov 25', actual: 869, target: 890 },
  { month: 'Dec 25', actual: 842, target: 890 },
  { month: 'Jan 26', actual: 831, target: 890 },
  { month: 'Feb 26', actual: 844, target: 890 },
  { month: 'Mar 26', actual: 847, target: 890 },
];

export const mockCostByCategory = [
  { month: 'Oct 25', inpatient: 3800, er: 980, specialty: 2100, pharmacy: 1040, postAcute: 520 },
  { month: 'Nov 25', inpatient: 3200, er: 1120, specialty: 1980, pharmacy: 1060, postAcute: 480 },
  { month: 'Dec 25', inpatient: 2800, er: 840, specialty: 2240, pharmacy: 1080, postAcute: 560 },
  { month: 'Jan 26', inpatient: 2600, er: 760, specialty: 2080, pharmacy: 1020, postAcute: 440 },
  { month: 'Feb 26', inpatient: 3100, er: 920, specialty: 2160, pharmacy: 1100, postAcute: 500 },
  { month: 'Mar 26', inpatient: 3400, er: 1040, specialty: 2280, pharmacy: 1120, postAcute: 580 },
];

export const mockGapClosureTrend = [
  { month: 'Apr 25', rate: 0.58 },
  { month: 'May 25', rate: 0.61 },
  { month: 'Jun 25', rate: 0.63 },
  { month: 'Jul 25', rate: 0.66 },
  { month: 'Aug 25', rate: 0.68 },
  { month: 'Sep 25', rate: 0.70 },
  { month: 'Oct 25', rate: 0.71 },
  { month: 'Nov 25', rate: 0.69 },
  { month: 'Dec 25', rate: 0.72 },
  { month: 'Jan 26', rate: 0.73 },
  { month: 'Feb 26', rate: 0.74 },
  { month: 'Mar 26', rate: 0.743 },
];

// ── PROVIDERS ──────────────────────────────────────────────
export const mockProviders: Provider[] = [
  {
    id: 'prov-001',
    npi: '1234567890',
    name: 'Dr. Amara Osei',
    specialty: 'Cardiology',
    networkTier: 'Preferred',
    costPercentile: 28,
    qualityScore: 94,
    acceptingNewPatients: true,
    affiliatedFacility: 'Northwestern Memorial Hospital',
    distance: 2.4,
    starsRating: 4.8,
    phone: '(312) 926-2000',
    address: '251 E. Huron St',
    city: 'Chicago',
    state: 'IL',
    zip: '60611',
    boardCertified: true,
    languagesSpoken: ['English', 'Twi'],
    avgWaitDays: 7,
    patientSatisfaction: 96,
    vbcAligned: true,
  },
  {
    id: 'prov-002',
    npi: '2345678901',
    name: 'Dr. Sofia Reinholt',
    specialty: 'Endocrinology',
    networkTier: 'Preferred',
    costPercentile: 35,
    qualityScore: 91,
    acceptingNewPatients: true,
    affiliatedFacility: 'University of Chicago Medicine',
    distance: 5.1,
    starsRating: 4.6,
    phone: '(773) 702-1000',
    address: '5841 S. Maryland Ave',
    city: 'Chicago',
    state: 'IL',
    zip: '60637',
    boardCertified: true,
    languagesSpoken: ['English', 'Spanish', 'Swedish'],
    avgWaitDays: 12,
    patientSatisfaction: 93,
    vbcAligned: true,
  },
  {
    id: 'prov-003',
    npi: '3456789012',
    name: 'Dr. Marcus Weatherington',
    specialty: 'Pulmonology',
    networkTier: 'In-Network',
    costPercentile: 52,
    qualityScore: 82,
    acceptingNewPatients: true,
    affiliatedFacility: 'Rush University Medical Center',
    distance: 3.8,
    starsRating: 4.2,
    phone: '(312) 942-5000',
    address: '1620 W. Harrison St',
    city: 'Chicago',
    state: 'IL',
    zip: '60612',
    boardCertified: true,
    languagesSpoken: ['English'],
    avgWaitDays: 18,
    patientSatisfaction: 88,
    vbcAligned: false,
  },
  {
    id: 'prov-004',
    npi: '4567890123',
    name: 'Dr. Priya Venkataraman',
    specialty: 'Nephrology',
    networkTier: 'Preferred',
    costPercentile: 22,
    qualityScore: 97,
    acceptingNewPatients: false,
    affiliatedFacility: 'Northwestern Memorial Hospital',
    distance: 2.4,
    starsRating: 4.9,
    phone: '(312) 926-8400',
    address: '675 N. St. Clair St',
    city: 'Chicago',
    state: 'IL',
    zip: '60611',
    boardCertified: true,
    languagesSpoken: ['English', 'Tamil', 'Hindi'],
    avgWaitDays: 21,
    patientSatisfaction: 98,
    vbcAligned: true,
  },
  {
    id: 'prov-005',
    npi: '5678901234',
    name: 'Dr. Jerome Blackwood',
    specialty: 'Orthopedics',
    networkTier: 'In-Network',
    costPercentile: 68,
    qualityScore: 78,
    acceptingNewPatients: true,
    affiliatedFacility: 'Advocate Illinois Masonic',
    distance: 4.2,
    starsRating: 3.9,
    phone: '(773) 975-1600',
    address: '836 W. Wellington Ave',
    city: 'Chicago',
    state: 'IL',
    zip: '60657',
    boardCertified: true,
    languagesSpoken: ['English'],
    avgWaitDays: 14,
    patientSatisfaction: 84,
    vbcAligned: false,
  },
  {
    id: 'prov-006',
    npi: '6789012345',
    name: 'Dr. Fatima Al-Rashidi',
    specialty: 'Ophthalmology',
    networkTier: 'Preferred',
    costPercentile: 31,
    qualityScore: 89,
    acceptingNewPatients: true,
    affiliatedFacility: 'Illinois Eye and Ear Infirmary',
    distance: 1.8,
    starsRating: 4.5,
    phone: '(312) 996-6500',
    address: '1855 W. Taylor St',
    city: 'Chicago',
    state: 'IL',
    zip: '60612',
    boardCertified: true,
    languagesSpoken: ['English', 'Arabic'],
    avgWaitDays: 9,
    patientSatisfaction: 92,
    vbcAligned: true,
  },
  {
    id: 'prov-007',
    npi: '7890123456',
    name: 'Dr. Thomas Kaczmarek',
    specialty: 'Gastroenterology',
    networkTier: 'In-Network',
    costPercentile: 61,
    qualityScore: 80,
    acceptingNewPatients: true,
    affiliatedFacility: 'Loyola University Medical Center',
    distance: 11.2,
    starsRating: 4.0,
    phone: '(708) 216-9000',
    address: '2160 S. First Ave',
    city: 'Maywood',
    state: 'IL',
    zip: '60153',
    boardCertified: true,
    languagesSpoken: ['English', 'Polish'],
    avgWaitDays: 16,
    patientSatisfaction: 86,
    vbcAligned: false,
  },
  {
    id: 'prov-008',
    npi: '8901234567',
    name: 'Dr. Nkechi Eze-Williams',
    specialty: 'Endocrinology',
    networkTier: 'Out-of-Network',
    costPercentile: 84,
    qualityScore: 88,
    acceptingNewPatients: true,
    affiliatedFacility: 'Private Practice',
    distance: 6.7,
    starsRating: 4.4,
    phone: '(312) 555-0199',
    address: '875 N. Michigan Ave, Ste 3400',
    city: 'Chicago',
    state: 'IL',
    zip: '60611',
    boardCertified: true,
    languagesSpoken: ['English', 'Igbo'],
    avgWaitDays: 5,
    patientSatisfaction: 91,
    vbcAligned: false,
  },
  {
    id: 'prov-009',
    npi: '9012345678',
    name: 'Dr. Carlos Mendez-Ruiz',
    specialty: 'Cardiology',
    networkTier: 'In-Network',
    costPercentile: 44,
    qualityScore: 85,
    acceptingNewPatients: true,
    affiliatedFacility: 'Stroger Hospital of Cook County',
    distance: 3.1,
    starsRating: 4.1,
    phone: '(312) 864-6000',
    address: '1969 Ogden Ave',
    city: 'Chicago',
    state: 'IL',
    zip: '60612',
    boardCertified: true,
    languagesSpoken: ['English', 'Spanish'],
    avgWaitDays: 10,
    patientSatisfaction: 87,
    vbcAligned: true,
  },
  {
    id: 'prov-010',
    npi: '0123456789',
    name: 'Dr. Linda Kowalczyk',
    specialty: 'Geriatrics',
    networkTier: 'Preferred',
    costPercentile: 19,
    qualityScore: 96,
    acceptingNewPatients: false,
    affiliatedFacility: 'Rush University Medical Center',
    distance: 3.8,
    starsRating: 4.9,
    phone: '(312) 942-6200',
    address: '1620 W. Harrison St',
    city: 'Chicago',
    state: 'IL',
    zip: '60612',
    boardCertified: true,
    languagesSpoken: ['English', 'Polish'],
    avgWaitDays: 28,
    patientSatisfaction: 97,
    vbcAligned: true,
  },
];

// ── HIGH COST PATIENTS for Financial Dashboard ──────────────
export const mockHighCostPatients = [
  { id: 'patient-011', name: 'Sylvia Montecinos', riskTier: 'Critical' as RiskTier, pmpm: 3120, target: 890, variance: 2230, topDriver: 'Inpatient', interventionStatus: 'Active' },
  { id: 'patient-001', name: 'Margaret Okonkwo', riskTier: 'Critical' as RiskTier, pmpm: 2840, target: 890, variance: 1950, topDriver: 'Specialty', interventionStatus: 'Active' },
  { id: 'patient-002', name: 'Delroy Hutchinson', riskTier: 'Critical' as RiskTier, pmpm: 2210, target: 890, variance: 1320, topDriver: 'Inpatient', interventionStatus: 'In Progress' },
  { id: 'patient-003', name: 'Rosa Evangelista', riskTier: 'High' as RiskTier, pmpm: 1640, target: 890, variance: 750, topDriver: 'ER', interventionStatus: 'Active' },
  { id: 'patient-004', name: 'Bernard Thibodeau', riskTier: 'High' as RiskTier, pmpm: 1290, target: 890, variance: 400, topDriver: 'Post-Acute', interventionStatus: 'Pending' },
  { id: 'patient-012', name: 'Kwame Asantewaa', riskTier: 'High' as RiskTier, pmpm: 1380, target: 890, variance: 490, topDriver: 'Specialty', interventionStatus: 'None' },
  { id: 'patient-005', name: 'Constance Abara', riskTier: 'High' as RiskTier, pmpm: 1180, target: 890, variance: 290, topDriver: 'Pharmacy', interventionStatus: 'Active' },
  { id: 'patient-006', name: 'Walter Przybylski', riskTier: 'Moderate' as RiskTier, pmpm: 920, target: 890, variance: 30, topDriver: 'Specialty', interventionStatus: 'None' },
];

// ── REFERRALS ──────────────────────────────────────────────
export const mockReferrals: any[] = [
  {
    id: 'ref-001',
    patientId: 'patient-001',
    patientName: 'Margaret Okonkwo',
    referralDate: '2026-04-20',
    specialty: 'Cardiology',
    urgency: 'STAT',
    status: 'In Progress',
    assignedProvider: 'Dr. Amara Osei',
    providerId: 'prov-041',
    providerTier: 'Preferred',
    icdCode: 'I20.9',
    icdDescription: 'Angina pectoris, unspecified',
    submissionChannel: 'EHR Portal',
    submittedDate: '2026-04-21',
    appointmentDate: '2026-04-28',
    closedDate: null,
    outcome: null,
    coordinatorName: 'Linda Marsh',
    notes: 'Patient reports intermittent chest pain. Urgent cardiac workup ordered.',
    daysOpen: 9,
  },
  {
    id: 'ref-002',
    patientId: 'patient-002',
    patientName: 'Delroy Hutchinson',
    referralDate: '2026-04-18',
    specialty: 'Endocrinology',
    urgency: 'Urgent',
    status: 'Assigned',
    assignedProvider: 'Dr. Sofia Reinholt',
    providerId: 'prov-017',
    providerTier: 'In-Network',
    icdCode: 'E11.65',
    icdDescription: 'Type 2 diabetes mellitus with hyperglycemia',
    submissionChannel: 'Fax',
    submittedDate: '2026-04-19',
    appointmentDate: null,
    closedDate: null,
    outcome: null,
    coordinatorName: 'James Park',
    notes: 'A1C 8.2%. Specialist consultation for insulin management.',
    daysOpen: 11,
  },
  {
    id: 'ref-003',
    patientId: 'patient-003',
    patientName: 'Rosa Evangelista',
    referralDate: '2026-04-10',
    specialty: 'Nephrology',
    urgency: 'Urgent',
    status: 'Completed',
    assignedProvider: 'Dr. Priya Venkataraman',
    providerId: 'prov-022',
    providerTier: 'Preferred',
    icdCode: 'N18.3',
    icdDescription: 'Chronic kidney disease, stage 3',
    submissionChannel: 'EHR Portal',
    submittedDate: '2026-04-11',
    appointmentDate: '2026-04-19',
    closedDate: '2026-04-22',
    outcome: 'Seen',
    coordinatorName: 'Linda Marsh',
    notes: 'eGFR 45. Follow-up nephrology visit completed. 90-day recheck recommended.',
    daysOpen: 12,
  },
  {
    id: 'ref-004',
    patientId: 'patient-004',
    patientName: 'Curtis Beaumont',
    referralDate: '2026-04-22',
    specialty: 'Pulmonology',
    urgency: 'Routine',
    status: 'Pending',
    assignedProvider: null,
    providerId: null,
    providerTier: null,
    icdCode: 'J44.1',
    icdDescription: 'Chronic obstructive pulmonary disease with acute exacerbation',
    submissionChannel: null,
    submittedDate: null,
    appointmentDate: null,
    closedDate: null,
    outcome: null,
    coordinatorName: 'James Park',
    notes: 'COPD exacerbation. Pulmonology consult requested for medication adjustment.',
    daysOpen: 7,
  },
  {
    id: 'ref-005',
    patientId: 'patient-005',
    patientName: 'Yolanda Ferreira',
    referralDate: '2026-04-08',
    specialty: 'Orthopedics',
    urgency: 'Routine',
    status: 'Awaiting EMR',
    assignedProvider: 'Dr. Kevin Nakashima',
    providerId: 'prov-033',
    providerTier: 'In-Network',
    icdCode: 'M17.11',
    icdDescription: 'Primary osteoarthritis, right knee',
    submissionChannel: 'Phone',
    submittedDate: '2026-04-09',
    appointmentDate: null,
    closedDate: null,
    outcome: null,
    coordinatorName: 'Sandra Wei',
    notes: 'Knee OA. Awaiting prior auth before scheduling injection appointment.',
    daysOpen: 21,
  },
  {
    id: 'ref-006',
    patientId: 'patient-006',
    patientName: 'Harold Simmons',
    referralDate: '2026-04-05',
    specialty: 'Gastroenterology',
    urgency: 'Routine',
    status: 'Cancelled',
    assignedProvider: null,
    providerId: null,
    providerTier: null,
    icdCode: 'K57.30',
    icdDescription: 'Diverticulosis of large intestine without perforation or abscess',
    submissionChannel: 'Fax',
    submittedDate: '2026-04-06',
    appointmentDate: null,
    closedDate: '2026-04-15',
    outcome: 'Cancelled',
    coordinatorName: 'Sandra Wei',
    notes: 'Patient declined specialist visit. Managing symptomatically with PCP.',
    daysOpen: 10,
  },
];

// ── STARS MEASURES ──────────────────────────────────────────
export const mockSTARSMeasures: any[] = [
  {
    id: 'stars-001',
    measureId: 'C01',
    measureName: 'Breast Cancer Screening',
    domain: 'Screening',
    contractName: 'MA-H1234 Silver Plan',
    currentRating: 3,
    targetRating: 4,
    gapCount: 99,
    bonusEstimate: 247500,
    deadline: '2024-09-30',
    status: 'open',
  },
  {
    id: 'stars-002',
    measureId: 'C02',
    measureName: 'Colorectal Cancer Screening',
    domain: 'Screening',
    contractName: 'MA-H1234 Silver Plan',
    currentRating: 3,
    targetRating: 4,
    gapCount: 146,
    bonusEstimate: 182000,
    deadline: '2024-09-30',
    status: 'in-progress',
  },
  {
    id: 'stars-003',
    measureId: 'D01',
    measureName: 'Diabetes Care — HbA1c Control',
    domain: 'Diabetes',
    contractName: 'MA-H5678 Gold Plan',
    currentRating: 4,
    targetRating: 5,
    gapCount: 72,
    bonusEstimate: 180000,
    deadline: '2024-10-31',
    status: 'open',
  },
  {
    id: 'stars-004',
    measureId: 'MED',
    measureName: 'Medication Adherence — Diabetes',
    domain: 'Medication Adherence',
    contractName: 'MA-H5678 Gold Plan',
    currentRating: 2,
    targetRating: 4,
    gapCount: 203,
    bonusEstimate: 103500,
    deadline: '2024-12-31',
    status: 'open',
  },
];

// ── HEDIS MEASURES ────────────────────────────
export const mockHEDISMeasures: any[] = [
  {
    id: 'hedis-001',
    measureId: 'CDC-H9',
    measureName: 'Diabetes: HbA1c Poor Control',
    domain: 'Diabetes',
    contractName: 'Commercial-PPO-2024',
    complianceRate: 18,
    targetRate: 15,
    patientsDue: 380,
    patientsCompliant: 312,
    dueDate: '2024-09-30',
    evidenceTypes: ['Lab Result', 'Claims'],
    status: 'open',
  },
  {
    id: 'hedis-002',
    measureId: 'CBP',
    measureName: 'Controlling High Blood Pressure',
    domain: 'Cardiovascular',
    contractName: 'Medicare Advantage-H1234',
    complianceRate: 64,
    targetRate: 70,
    patientsDue: 620,
    patientsCompliant: 397,
    dueDate: '2024-10-15',
    evidenceTypes: ['Clinical Documentation', 'Claims'],
    status: 'in-progress',
  },
  {
    id: 'hedis-003',
    measureId: 'COL',
    measureName: 'Colorectal Cancer Screening',
    domain: 'Screening',
    contractName: 'Commercial-PPO-2024',
    complianceRate: 71,
    targetRate: 75,
    patientsDue: 520,
    patientsCompliant: 369,
    dueDate: '2024-11-30',
    evidenceTypes: ['Lab Result', 'Radiology', 'Claims'],
    status: 'open',
  },
  {
    id: 'hedis-004',
    measureId: 'FUH',
    measureName: 'Follow-Up After Hospitalization for Mental Illness',
    domain: 'Behavioral Health',
    contractName: 'Medicaid-MCO-2024',
    complianceRate: 48,
    targetRate: 65,
    patientsDue: 124,
    patientsCompliant: 60,
    dueDate: '2024-09-15',
    evidenceTypes: ['Encounter', 'Claims'],
    status: 'open',
  },
];

// ── MIPS ADJUSTMENTS ──────────────────────────
export const mockMIPSAdjustments: any[] = [
  {
    id: 'mips-001',
    noticeId: 'MIPS-2023-001',
    performanceYear: '2023',
    compositeScore: 82,
    adjustmentPct: 1.88,
    adjustmentAmount: 67400,
    qualityScore: 85,
    promotingInteropScore: 90,
    improvementActScore: 40,
    costScore: 72,
    deadline: '2024-06-30',
    status: 'closed',
    appealEligible: false,
  },
  {
    id: 'mips-002',
    noticeId: 'MIPS-2023-002',
    performanceYear: '2023',
    compositeScore: 58,
    adjustmentPct: -4.5,
    adjustmentAmount: -112000,
    qualityScore: 55,
    promotingInteropScore: 68,
    improvementActScore: 20,
    costScore: 48,
    deadline: '2024-08-15',
    status: 'in-review',
    appealEligible: true,
  },
  {
    id: 'mips-003',
    noticeId: 'MIPS-2023-003',
    performanceYear: '2023',
    compositeScore: 61,
    adjustmentPct: -2.25,
    adjustmentAmount: -91000,
    qualityScore: 60,
    promotingInteropScore: 72,
    improvementActScore: 20,
    costScore: 53,
    deadline: '2024-09-01',
    status: 'open',
    appealEligible: true,
  },
];


// ── CARE PLANS ──────────────────────────────────────────────
export type CarePlanStatus = 'Active' | 'Draft' | 'Completed' | 'Cancelled' | 'On Hold';
export type GoalStatus = 'In Progress' | 'Achieved' | 'Not Started' | 'Cancelled';
export type InterventionStatus = 'Scheduled' | 'Active' | 'Completed' | 'Cancelled' | 'Pending';
export type CarePlanTemplate = 'Cardiology' | 'Endocrinology' | 'Pulmonology' | 'Nephrology' | 'Orthopedics' | 'Neurology' | 'Custom';

export interface CarePlanGoal {
  id: string;
  description: string;
  target: string;
  current?: string;
  status: GoalStatus;
  dueDate: string;
  progress: number; // 0-100
  notes?: string;
  interventions?: CarePlanIntervention[]; // FHIR-aligned: goals can have associated interventions
}

export interface CarePlanIntervention {
  id: string;
  type: 'Referral' | 'Monitoring' | 'Appointment' | 'Medication' | 'Education' | 'Procedure';
  description: string;
  status: InterventionStatus;
  scheduledDate?: string;
  completedDate?: string;
  provider?: string;
  frequency?: string;
  notes?: string;
}

export interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  relationship: 'Primary' | 'Consultant' | 'Care Manager' | 'Specialist' | 'Support';
  phone?: string;
  email?: string;
  networkTier?: NetworkTier; // Network status for the provider
  npi?: string; // National Provider Identifier
}

export interface CarePlan {
  id: string;
  patientId: string;
  title: string;
  description: string;
  status: CarePlanStatus;
  template?: CarePlanTemplate;
  createdDate: string;
  startDate: string;
  endDate?: string;
  lastUpdated: string;
  createdBy: string;
  addresses: string[]; // ICD-10 codes or condition descriptions
  goals: CarePlanGoal[];
  interventions: CarePlanIntervention[];
  careTeam: CareTeamMember[];
  clinicalNotes: {
    date: string;
    author: string;
    note: string;
  }[];
  sharedWith: string[]; // List of providers/systems the plan has been shared with
}

export const mockCarePlans: CarePlan[] = [
  {
    id: 'careplan-001',
    patientId: 'patient-001',
    title: 'Hypertension Management',
    description: 'Comprehensive management of uncontrolled hypertension with specialist consultation and home monitoring program.',
    status: 'Active',
    template: 'Cardiology',
    createdDate: '2026-05-20',
    startDate: '2026-05-20',
    endDate: '2026-11-20',
    lastUpdated: '2026-05-20',
    createdBy: 'Dr. James Whitfield',
    addresses: ['I10 - Essential Hypertension', 'Medication non-response'],
    goals: [
      {
        id: 'goal-001',
        description: 'Blood Pressure Control',
        target: '<140/90 mmHg',
        current: '165/95 mmHg',
        status: 'In Progress',
        dueDate: '2026-08-20',
        progress: 40,
        notes: 'Patient reports good medication compliance. BP trending down slowly.',
      },
      {
        id: 'goal-002',
        description: 'Sodium Intake Reduction',
        target: '<2000mg/day',
        current: '~3500mg/day (estimated)',
        status: 'In Progress',
        dueDate: '2026-08-20',
        progress: 20,
        notes: 'Dietitian consultation scheduled. Patient education materials provided.',
      },
    ],
    interventions: [
      {
        id: 'intervention-001',
        type: 'Referral',
        description: 'Cardiology Consultation',
        status: 'Scheduled',
        scheduledDate: '2026-06-01',
        provider: 'Dr. Emily Chen',
        notes: 'Evaluation for medication adjustment or additional therapy.',
      },
      {
        id: 'intervention-002',
        type: 'Monitoring',
        description: 'Home BP Monitoring',
        status: 'Active',
        scheduledDate: '2026-05-20',
        frequency: 'Twice daily',
        notes: 'Patient provided with home BP monitor. Last reading: 162/93 (May 19, 8:00 AM)',
      },
      {
        id: 'intervention-003',
        type: 'Appointment',
        description: 'Follow-up Appointment',
        status: 'Scheduled',
        scheduledDate: '2026-06-15',
        provider: 'Dr. James Whitfield',
        notes: 'Review cardiology consultation and adjust treatment plan.',
      },
      {
        id: 'intervention-004',
        type: 'Medication',
        description: 'Medication Review',
        status: 'Pending',
        notes: 'Pending cardiology input. Current: Lisinopril 20mg daily.',
      },
    ],
    careTeam: [
      {
        id: 'team-001',
        name: 'Dr. James Whitfield',
        role: 'Primary Care Physician',
        relationship: 'Primary',
        phone: '(312) 555-0100',
      },
      {
        id: 'team-002',
        name: 'Dr. Emily Chen',
        role: 'Cardiologist',
        specialty: 'Cardiology',
        relationship: 'Consultant',
        phone: '(312) 555-0200',
      },
      {
        id: 'team-003',
        name: 'Angela Torres, NP',
        role: 'Care Manager',
        relationship: 'Care Manager',
        phone: '(312) 555-0150',
      },
    ],
    clinicalNotes: [
      {
        date: '2026-05-20',
        author: 'Dr. James Whitfield',
        note: 'Patient reports medication compliance. BP remains elevated despite 6 months on Lisinopril 20mg. Referring to cardiology for evaluation of medication adjustment or additional therapy. Home BP monitoring initiated.',
      },
    ],
    sharedWith: ['Dr. Emily Chen (Cardiology)', 'Patient Portal'],
  },
  {
    id: 'careplan-002',
    patientId: 'patient-001',
    title: 'Diabetes Care Plan',
    description: 'Type 2 diabetes management with focus on glycemic control and prevention of complications.',
    status: 'Active',
    template: 'Endocrinology',
    createdDate: '2026-01-15',
    startDate: '2026-01-15',
    endDate: '2027-01-15',
    lastUpdated: '2026-05-18',
    createdBy: 'Dr. James Whitfield',
    addresses: ['E11.9 - Type 2 Diabetes Mellitus', 'Suboptimal glycemic control'],
    goals: [
      {
        id: 'goal-003',
        description: 'HbA1c Control',
        target: '<7.0%',
        current: '7.8%',
        status: 'In Progress',
        dueDate: '2026-07-15',
        progress: 60,
        notes: 'Improved from 8.2% three months ago. Continue current regimen.',
      },
      {
        id: 'goal-004',
        description: 'Daily Blood Glucose Monitoring',
        target: 'Fasting <130 mg/dL',
        current: 'Avg 145 mg/dL',
        status: 'In Progress',
        dueDate: '2026-07-15',
        progress: 50,
      },
      {
        id: 'goal-005',
        description: 'Diabetic Retinopathy Screening',
        target: 'Annual exam completed',
        current: 'Completed 2026-03-10',
        status: 'Achieved',
        dueDate: '2026-03-31',
        progress: 100,
        notes: 'No retinopathy detected. Next screening due March 2027.',
      },
    ],
    interventions: [
      {
        id: 'intervention-005',
        type: 'Education',
        description: 'Diabetes Self-Management Education',
        status: 'Completed',
        scheduledDate: '2026-02-01',
        completedDate: '2026-02-15',
        notes: '4-session program completed. Patient demonstrates good understanding.',
      },
      {
        id: 'intervention-006',
        type: 'Monitoring',
        description: 'Continuous Glucose Monitoring',
        status: 'Active',
        frequency: 'Daily',
        notes: 'Patient using CGM device. Data reviewed weekly.',
      },
      {
        id: 'intervention-007',
        type: 'Appointment',
        description: 'Quarterly Diabetes Check',
        status: 'Scheduled',
        scheduledDate: '2026-07-15',
        provider: 'Dr. James Whitfield',
      },
    ],
    careTeam: [
      {
        id: 'team-004',
        name: 'Dr. James Whitfield',
        role: 'Primary Care Physician',
        relationship: 'Primary',
        phone: '(312) 555-0100',
      },
      {
        id: 'team-005',
        name: 'Sarah Mitchell, RD',
        role: 'Diabetes Educator',
        relationship: 'Support',
        phone: '(312) 555-0175',
      },
    ],
    clinicalNotes: [
      {
        date: '2026-05-18',
        author: 'Dr. James Whitfield',
        note: 'HbA1c improved to 7.8% from 8.2%. Patient adherent to medication and diet plan. Continue current management. Next HbA1c in 2 months.',
      },
      {
        date: '2026-03-10',
        author: 'Dr. James Whitfield',
        note: 'Annual diabetic retinopathy screening completed. No retinopathy detected. Patient counseled on importance of continued glycemic control.',
      },
    ],
    sharedWith: ['Patient Portal', 'Diabetes Educator'],
  },
];

// Care Plan Templates for quick creation
export const carePlanTemplates = {
  Cardiology: {
    title: 'Cardiology Referral Care Plan',
    defaultGoals: [
      { description: 'Blood Pressure Control', target: '<140/90 mmHg' },
      { description: 'Medication Optimization', target: 'Effective BP control with minimal side effects' },
    ],
    defaultInterventions: [
      { type: 'Referral' as const, description: 'Cardiology Consultation' },
      { type: 'Monitoring' as const, description: 'Home BP Monitoring', frequency: 'Twice daily' },
      { type: 'Appointment' as const, description: 'Follow-up Appointment' },
    ],
  },
  Endocrinology: {
    title: 'Endocrinology Referral Care Plan',
    defaultGoals: [
      { description: 'HbA1c Control', target: '<7.0%' },
      { description: 'Blood Glucose Monitoring', target: 'Fasting <130 mg/dL' },
    ],
    defaultInterventions: [
      { type: 'Referral' as const, description: 'Endocrinology Consultation' },
      { type: 'Monitoring' as const, description: 'Blood Glucose Monitoring', frequency: 'Daily' },
      { type: 'Education' as const, description: 'Diabetes Self-Management Education' },
    ],
  },
  Pulmonology: {
    title: 'Pulmonology Referral Care Plan',
    defaultGoals: [
      { description: 'Respiratory Function', target: 'Improved lung function tests' },
      { description: 'Symptom Management', target: 'Reduced dyspnea episodes' },
    ],
    defaultInterventions: [
      { type: 'Referral' as const, description: 'Pulmonology Consultation' },
      { type: 'Monitoring' as const, description: 'Peak Flow Monitoring', frequency: 'Daily' },
      { type: 'Medication' as const, description: 'Inhaler Technique Review' },
    ],
  },
  Nephrology: {
    title: 'Nephrology Referral Care Plan',
    defaultGoals: [
      { description: 'Kidney Function Preservation', target: 'Stable eGFR' },
      { description: 'Blood Pressure Control', target: '<130/80 mmHg' },
    ],
    defaultInterventions: [
      { type: 'Referral' as const, description: 'Nephrology Consultation' },
      { type: 'Monitoring' as const, description: 'Kidney Function Labs', frequency: 'Monthly' },
      { type: 'Education' as const, description: 'Kidney Disease Education' },
    ],
  },
  Orthopedics: {
    title: 'Orthopedics Referral Care Plan',
    defaultGoals: [
      { description: 'Pain Management', target: 'Pain level <3/10' },
      { description: 'Functional Improvement', target: 'Improved mobility and ADLs' },
    ],
    defaultInterventions: [
      { type: 'Referral' as const, description: 'Orthopedic Consultation' },
      { type: 'Referral' as const, description: 'Physical Therapy' },
      { type: 'Medication' as const, description: 'Pain Management Review' },
    ],
  },
  Neurology: {
    title: 'Neurology Referral Care Plan',
    defaultGoals: [
      { description: 'Neurological Assessment', target: 'Complete neurological evaluation' },
      { description: 'Symptom Control', target: 'Reduced symptom frequency/severity' },
    ],
    defaultInterventions: [
      { type: 'Referral' as const, description: 'Neurology Consultation' },
      { type: 'Procedure' as const, description: 'Neurological Imaging' },
      { type: 'Appointment' as const, description: 'Follow-up Appointment' },
    ],
  },
};

// ─── SHARED REFERRAL STORE ──────────────────────────────────────────────────────
// This store is shared between MD Smart Launch and Specialist Portal
export type ReferralUrgency = 'routine' | 'urgent' | 'asap' | 'stat';
export type ReferralStatus = 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface Referral {
  referralId: string;
  serviceRequestId: string;
  patientName: string;
  patientId: string;
  patientDOB: string;
  patientMRN?: string;
  referringProvider: string;
  referringOrganization?: string;
  referralDate: string;
  urgency: ReferralUrgency;
  careGap?: {
    measure: string;
    description: string;
    daysOpen: number;
    gainshareAmount: number;
    targetCriteria: string;
    currentValue: string;
    requiredLab?: {
      name: string;
      loincCode: string;
      targetRange: string;
      unit: string;
      example: string;
    };
  };
  specialistType: string;
  clinicalNotes: string;
  status: ReferralStatus;
  appointmentDate?: string;
  clinicalContext?: {
    primaryDiagnosis: string;
    icd10: string;
    [key: string]: any;
  };
}

// Quality metrics tracking
export interface QualityMetrics {
  measureId: string;
  measureName: string;
  program: 'HEDIS' | 'STARS' | 'MIPS';
  numerator: number;
  denominator: number;
  rate: number;
  target: number;
  gapsClosed: number;
  gapsOpen: number;
  lastUpdated: string;
}

// Gainshare tracking
export interface GainshareRecord {
  referralId: string;
  patientId: string;
  patientName: string;
  measureId: string;
  measureName: string;
  closureDate: string;
  totalAmount: number;
  providerShare: number; // 60%
  specialistShare: number; // 40%
  providerId: string;
  providerName: string;
  specialistId: string;
  specialistName: string;
  status: 'pending' | 'approved' | 'paid';
}

// In-memory store for referrals (simulates shared state)
// NOW WITH GAP CLOSURE AND QUALITY METRICS TRACKING
class ReferralStore {
  private referrals: Referral[] = [
    {
      referralId: 'ref-001',
      serviceRequestId: 'sr-001',
      patientName: 'Maria Reyes',
      patientId: 'patient-001',
      patientDOB: '1957-03-14',
      patientMRN: 'MRN-00847291',
      referringProvider: 'Dr. James Chen, MD',
      referringOrganization: 'UHG Super Orchestration Controller',
      referralDate: '2026-05-20',
      urgency: 'urgent',
      specialistType: 'Labcorp',
      clinicalNotes: 'Maria requires urgent HbA1c closure workflow. Route lab through Labcorp and return result into SMART app.',
      careGap: {
        measure: 'HEDIS-CDC-HbA1c',
        description: 'HbA1c Poor Control (>9%)',
        daysOpen: 112,
        gainshareAmount: 450,
        targetCriteria: 'HbA1c <9.0%',
        currentValue: 'HbA1c 9.2% (2026-04-10)',
        requiredLab: {
          name: 'Hemoglobin A1C',
          loincCode: '4548-4',
          targetRange: '<9.0%',
          unit: '%',
          example: '8.1'
        }
      },
      status: 'pending',
      appointmentDate: undefined,
      clinicalContext: {
        primaryDiagnosis: 'Type 2 Diabetes with chronic complications',
        icd10: 'E11.65',
        lastA1C: '9.2%',
        medications: ['Metformin 500mg BID', 'Warfarin 5mg daily', 'Coumadin 5mg daily']
      }
    },
    {
      referralId: 'ref-002',
      serviceRequestId: 'sr-002',
      patientName: 'Mary Johnson',
      patientId: 'patient-002',
      patientDOB: '1962-07-22',
      referringProvider: 'Dr. Michael Rodriguez, MD',
      referringOrganization: 'Community Health Center',
      referralDate: '2026-05-22',
      urgency: 'routine',
      specialistType: 'Cardiology',
      clinicalNotes: 'Patient needs cardiovascular risk assessment and statin therapy initiation.',
      careGap: {
        measure: 'HEDIS SPC-438',
        description: 'Statin Therapy - CVD',
        daysOpen: 89,
        gainshareAmount: 380,
        targetCriteria: 'Statin prescribed and filled',
        currentValue: 'No active statin therapy'
      },
      status: 'scheduled',
      appointmentDate: '2026-06-05',
      clinicalContext: {
        primaryDiagnosis: 'Atherosclerotic Heart Disease',
        icd10: 'I25.10',
        lastLDL: '142 mg/dL',
        medications: ['Aspirin 81mg QD', 'Metoprolol 50mg BID']
      }
    },
    {
      referralId: 'ref-003',
      serviceRequestId: 'sr-003',
      patientName: 'Robert Williams',
      patientId: 'patient-003',
      patientDOB: '1955-11-08',
      referringProvider: 'Dr. Sarah Chen, MD',
      referringOrganization: 'Primary Care Clinic',
      referralDate: '2026-05-18',
      urgency: 'routine',
      specialistType: 'Cardiology',
      clinicalNotes: 'Hypertension not controlled on current regimen. Needs specialist evaluation.',
      careGap: {
        measure: 'HEDIS CBP-236',
        description: 'Controlling Hypertension',
        daysOpen: 134,
        gainshareAmount: 320,
        targetCriteria: 'BP <140/90 mmHg',
        currentValue: 'BP 158/96 (2026-04-01)'
      },
      status: 'in-progress',
      appointmentDate: '2026-05-28',
      clinicalContext: {
        primaryDiagnosis: 'Essential Hypertension',
        icd10: 'I10',
        lastBP: '158/96',
        medications: ['Lisinopril 10mg QD', 'HCTZ 25mg QD']
      }
    }
  ];

  private listeners: Array<() => void> = [];

  // Quality metrics tracking (initialized with Margaret's measures)
  private qualityMetrics: QualityMetrics[] = [
    {
      measureId: 'HEDIS-CDC-HbA1c',
      measureName: 'HbA1c Poor Control (>9%)',
      program: 'HEDIS',
      numerator: 142,
      denominator: 487,
      rate: 0.291,
      target: 0.25,
      gapsClosed: 0,
      gapsOpen: 1,
      lastUpdated: new Date().toISOString(),
    },
    {
      measureId: 'STARS-C01',
      measureName: 'Annual Wellness Visit',
      program: 'STARS',
      numerator: 3621,
      denominator: 4872,
      rate: 0.743,
      target: 0.80,
      gapsClosed: 0,
      gapsOpen: 1,
      lastUpdated: new Date().toISOString(),
    },
    {
      measureId: 'HEDIS-EED',
      measureName: 'Eye Exam for Diabetics',
      program: 'HEDIS',
      numerator: 2891,
      denominator: 4872,
      rate: 0.593,
      target: 0.70,
      gapsClosed: 0,
      gapsOpen: 1,
      lastUpdated: new Date().toISOString(),
    },
    {
      measureId: 'MIPS-PREV-12',
      measureName: 'Colorectal Cancer Screening',
      program: 'MIPS',
      numerator: 3142,
      denominator: 4872,
      rate: 0.645,
      target: 0.75,
      gapsClosed: 0,
      gapsOpen: 1,
      lastUpdated: new Date().toISOString(),
    },
    {
      measureId: 'STARS-D12',
      measureName: 'Medication Adherence — Diabetes',
      program: 'STARS',
      numerator: 3456,
      denominator: 4872,
      rate: 0.709,
      target: 0.80,
      gapsClosed: 0,
      gapsOpen: 1,
      lastUpdated: new Date().toISOString(),
    },
  ];

  // Gainshare records
  private gainshareRecords: GainshareRecord[] = [];

  getAllReferrals(): Referral[] {
    return [...this.referrals];
  }

  getReferralById(id: string): Referral | undefined {
    return this.referrals.find(r => r.referralId === id);
  }

  addReferral(referral: Referral): void {
    this.referrals.push(referral);
    this.notifyListeners();
  }

  updateReferral(id: string, updates: Partial<Referral>): void {
    const index = this.referrals.findIndex(r => r.referralId === id);
    if (index !== -1) {
      this.referrals[index] = { ...this.referrals[index], ...updates };
      this.notifyListeners();
    }
  }

  // NEW: Close a care gap and update quality metrics
  closeGap(referralId: string, specialistId: string, specialistName: string): void {
    const referral = this.getReferralById(referralId);
    if (!referral || !referral.careGap) {
      console.error('Referral or care gap not found');
      return;
    }

    // Update referral status
    this.updateReferral(referralId, { status: 'completed' });

    // Update quality metrics
    const metric = this.qualityMetrics.find(m => m.measureId === referral.careGap!.measure);
    if (metric) {
      metric.numerator += 1;
      metric.rate = metric.numerator / metric.denominator;
      metric.gapsClosed += 1;
      metric.gapsOpen = Math.max(0, metric.gapsOpen - 1);
      metric.lastUpdated = new Date().toISOString();
    }

    // Update care gap status in mockCareGaps
    const gapIndex = mockCareGaps.findIndex(g => g.measureId === referral.careGap!.measure && g.patientId === referral.patientId);
    if (gapIndex !== -1) {
      mockCareGaps[gapIndex].status = 'Closed';
      mockCareGaps[gapIndex].lastActionDate = new Date().toISOString().split('T')[0];
      mockCareGaps[gapIndex].daysOpen = 0;
    }

    // Create gainshare record (60/40 split)
    const totalAmount = referral.careGap.gainshareAmount;
    const providerShare = Math.round(totalAmount * 0.6);
    const specialistShare = Math.round(totalAmount * 0.4);

    const gainshareRecord: GainshareRecord = {
      referralId,
      patientId: referral.patientId,
      patientName: referral.patientName,
      measureId: referral.careGap.measure,
      measureName: referral.careGap.description,
      closureDate: new Date().toISOString().split('T')[0],
      totalAmount,
      providerShare,
      specialistShare,
      providerId: 'dr-whitfield-001',
      providerName: referral.referringProvider,
      specialistId,
      specialistName,
      status: 'approved',
    };

    this.gainshareRecords.push(gainshareRecord);

    console.log(`✅ Gap closed: ${referral.careGap.description}`);
    console.log(`💰 Gainshare: Provider $${providerShare} | Specialist $${specialistShare}`);

    this.notifyListeners();
  }

  // Get quality metrics
  getQualityMetrics(): QualityMetrics[] {
    return [...this.qualityMetrics];
  }

  // Get gainshare records
  getGainshareRecords(): GainshareRecord[] {
    return [...this.gainshareRecords];
  }

  // Get gainshare by provider
  getProviderGainshare(providerId: string): number {
    return this.gainshareRecords
      .filter(r => r.providerId === providerId && r.status === 'approved')
      .reduce((sum, r) => sum + r.providerShare, 0);
  }

  // Get gainshare by specialist
  getSpecialistGainshare(specialistId: string): number {
    return this.gainshareRecords
      .filter(r => r.specialistId === specialistId && r.status === 'approved')
      .reduce((sum, r) => sum + r.specialistShare, 0);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Reset demo data for next demo run
  resetDemo(): void {
    console.log('🔄 Resetting demo data...');
    
    // Clear ALL referrals for Maria Reyes (patient-001) created during demo
    // Keep only the initial 3 sample referrals for other patients
    this.referrals = this.referrals.filter(r => {
      // Remove all Maria referrals
      if (r.patientId === 'patient-001' || r.patientName === 'Maria Reyes') {
        return false;
      }
      // Keep initial sample referrals for other patients
      return r.referralId === 'ref-001' ||
             r.referralId === 'ref-002' ||
             r.referralId === 'ref-003';
    });
    
    // Reset remaining referral statuses to pending
    this.referrals.forEach(r => {
      r.status = 'pending';
      r.appointmentDate = undefined;
    });
    
    // Clear gainshare records
    this.gainshareRecords = [];
    
    // Reset quality metrics to initial state
    this.qualityMetrics = [
      {
        measureId: 'HEDIS-CDC-HbA1c',
        measureName: 'HbA1c Poor Control (>9%)',
        program: 'HEDIS',
        numerator: 142,
        denominator: 487,
        rate: 0.291,
        target: 0.25,
        gapsClosed: 0,
        gapsOpen: 1,
        lastUpdated: new Date().toISOString(),
      },
      {
        measureId: 'STARS-C01',
        measureName: 'Annual Wellness Visit',
        program: 'STARS',
        numerator: 3621,
        denominator: 4872,
        rate: 0.743,
        target: 0.80,
        gapsClosed: 0,
        gapsOpen: 1,
        lastUpdated: new Date().toISOString(),
      },
      {
        measureId: 'HEDIS-EED',
        measureName: 'Eye Exam for Diabetics',
        program: 'HEDIS',
        numerator: 2891,
        denominator: 4872,
        rate: 0.593,
        target: 0.70,
        gapsClosed: 0,
        gapsOpen: 1,
        lastUpdated: new Date().toISOString(),
      },
      {
        measureId: 'MIPS-PREV-12',
        measureName: 'Colorectal Cancer Screening',
        program: 'MIPS',
        numerator: 3142,
        denominator: 4872,
        rate: 0.645,
        target: 0.75,
        gapsClosed: 0,
        gapsOpen: 1,
        lastUpdated: new Date().toISOString(),
      },
      {
        measureId: 'STARS-D12',
        measureName: 'Medication Adherence — Diabetes',
        program: 'STARS',
        numerator: 3456,
        denominator: 4872,
        rate: 0.709,
        target: 0.80,
        gapsClosed: 0,
        gapsOpen: 1,
        lastUpdated: new Date().toISOString(),
      },
    ];
    
    // Reset care gaps to Open status
    mockCareGaps.forEach(gap => {
      if (gap.patientId === 'patient-001') {
        gap.status = gap.measureId === 'HEDIS-CBP' ? 'Closed' : 'Open';
        gap.daysOpen = gap.measureId === 'HEDIS-CBP' ? 0 : Math.floor(Math.random() * 100) + 20;
      }
    });
    
    console.log('✅ Demo data reset complete');
    console.log(`   - Referrals: ${this.referrals.length} (initial state)`);
    console.log(`   - Gainshare records: ${this.gainshareRecords.length}`);
    console.log(`   - Quality metrics: ${this.qualityMetrics.length} (reset to baseline)`);
    console.log(`   - Care gaps: Reset to Open status`);
    
    this.notifyListeners();
  }
}

// Export singleton instance
export const referralStore = new ReferralStore();

// ─── SPECIALIST PROVIDERS ──────────────────────────────────────────────────────
// Mock specialist provider data for auto-populating attestation forms
export interface SpecialistProvider {
  id: string;
  name: string;
  npi: string;
  specialty: string;
  organization: string;
}

export const mockSpecialistProviders: SpecialistProvider[] = [
  {
    id: 'specialist-001',
    name: 'Dr. Emily Rodriguez',
    npi: '1234567890',
    specialty: 'Endocrinology',
    organization: 'Chicago Diabetes & Endocrine Center'
  },
  {
    id: 'specialist-002',
    name: 'Dr. Michael Chen',
    npi: '2345678901',
    specialty: 'Cardiology',
    organization: 'Heart & Vascular Institute'
  },
  {
    id: 'specialist-003',
    name: 'Dr. Sarah Johnson',
    npi: '3456789012',
    specialty: 'Nephrology',
    organization: 'Kidney Care Specialists'
  },
  {
    id: 'specialist-004',
    name: 'Dr. James Williams',
    npi: '4567890123',
    specialty: 'Pulmonology',
    organization: 'Respiratory Health Center'
  }
];

// Get current specialist (simulates logged-in user)
export const getCurrentSpecialist = (): SpecialistProvider => {
  // In a real app, this would come from auth context
  // For demo, return the first specialist (Endocrinologist)
  return mockSpecialistProviders[0];
};


// ── EPISODES OF CARE ──────────────────────────────────────────────────────────
export type EpisodeStatus = 'Active' | 'Closed' | 'Maintenance';
export type EpisodeCategory = 'Surgical' | 'Medical' | 'Chronic Care' | 'Preventive';
export type EventType = 'ER' | 'Inpatient' | 'SNF' | 'Home Health' | 'Outpatient' | 'Procedure' | 'Lab' | 'Medication';

export interface EpisodeEvent {
  id: string;
  episodeId: string;
  eventDate: string;
  eventType: EventType;
  careSetting: string;
  description: string;
  cost: number;
  provider: string;
  facility: string;
  duration?: number; // for stays (in days)
  outcome?: string;
}

export interface Episode {
  id: string;
  patientId: string;
  patientName: string;
  patientDOB: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  patientMRN: string;
  
  episodeType: string;
  episodeCategory: EpisodeCategory;
  
  startDate: string;
  endDate: string | null;
  duration: number; // days
  status: EpisodeStatus;
  
  totalCost: number;
  targetCost: number;
  costVariance: number; // percentage
  
  utilizationScore: number; // 0-100
  
  events: EpisodeEvent[];
  
  qualityMetrics: {
    complications: boolean;
    readmission30Day: boolean;
    patientSatisfaction: number; // 1-5
    carePlanAdherence: number; // percentage
  };
  
  assignedCareManager: string;
  primaryProvider: string;
}

export const mockEpisodes: Episode[] = [
  {
    id: 'ep-001',
    patientId: 'patient-001',
    patientName: 'Margaret Okonkwo',
    patientDOB: '03/14/1948',
    patientAge: 78,
    patientGender: 'F',
    patientMRN: 'MRN-204817',
    episodeType: 'CHF Exacerbation',
    episodeCategory: 'Medical',
    startDate: '2026-03-15',
    endDate: '2026-06-13',
    duration: 90,
    status: 'Closed',
    totalCost: 32650,
    targetCost: 28000,
    costVariance: 16.6,
    utilizationScore: 72,
    events: [
      {
        id: 'ev-001',
        episodeId: 'ep-001',
        eventDate: '2026-03-15',
        eventType: 'ER',
        careSetting: 'Emergency Department',
        description: 'CHF exacerbation, SOB, edema',
        cost: 2400,
        provider: 'Dr. Emergency',
        facility: 'County Hospital ER',
      },
      {
        id: 'ev-002',
        episodeId: 'ep-001',
        eventDate: '2026-03-15',
        eventType: 'Inpatient',
        careSetting: 'Acute Care Hospital',
        description: 'Admitted for CHF management',
        cost: 18500,
        provider: 'Dr. James Whitfield',
        facility: 'County Hospital',
        duration: 5,
        outcome: 'Stabilized, discharged to SNF',
      },
      {
        id: 'ev-003',
        episodeId: 'ep-001',
        eventDate: '2026-03-20',
        eventType: 'SNF',
        careSetting: 'Skilled Nursing Facility',
        description: 'Post-acute care and rehabilitation',
        cost: 8200,
        provider: 'SNF Care Team',
        facility: 'Riverside Rehabilitation Center',
        duration: 14,
        outcome: 'Improved, transitioned to home health',
      },
      {
        id: 'ev-004',
        episodeId: 'ep-001',
        eventDate: '2026-04-03',
        eventType: 'Home Health',
        careSetting: 'Home Health Services',
        description: 'Nursing visits and medication management',
        cost: 3100,
        provider: 'Home Health RN',
        facility: 'Community Home Health',
        duration: 30,
        outcome: 'Stable, transitioned to outpatient',
      },
      {
        id: 'ev-005',
        episodeId: 'ep-001',
        eventDate: '2026-05-15',
        eventType: 'Outpatient',
        careSetting: 'Cardiology Clinic',
        description: 'Follow-up cardiology visit',
        cost: 450,
        provider: 'Dr. Emily Chen',
        facility: 'Heart & Vascular Institute',
        outcome: 'Stable, episode closed',
      },
    ],
    qualityMetrics: {
      complications: false,
      readmission30Day: false,
      patientSatisfaction: 4.5,
      carePlanAdherence: 85,
    },
    assignedCareManager: 'Linda Marsh',
    primaryProvider: 'Dr. James Whitfield',
  },
  {
    id: 'ep-002',
    patientId: 'patient-002',
    patientName: 'Mary Johnson',
    patientDOB: '07/22/1962',
    patientAge: 63,
    patientGender: 'F',
    patientMRN: 'MRN-305928',
    episodeType: 'Hip Replacement',
    episodeCategory: 'Surgical',
    startDate: '2026-02-10',
    endDate: '2026-05-10',
    duration: 90,
    status: 'Closed',
    totalCost: 28450,
    targetCost: 25000,
    costVariance: 13.8,
    utilizationScore: 78,
    events: [
      {
        id: 'ev-006',
        episodeId: 'ep-002',
        eventDate: '2026-02-10',
        eventType: 'Procedure',
        careSetting: 'Operating Room',
        description: 'Total hip arthroplasty',
        cost: 22000,
        provider: 'Dr. Sarah Martinez',
        facility: 'Regional Medical Center',
        duration: 1,
        outcome: 'Successful surgery',
      },
      {
        id: 'ev-007',
        episodeId: 'ep-002',
        eventDate: '2026-02-11',
        eventType: 'Inpatient',
        careSetting: 'Acute Care Hospital',
        description: 'Post-operative recovery',
        cost: 4200,
        provider: 'Dr. Sarah Martinez',
        facility: 'Regional Medical Center',
        duration: 3,
        outcome: 'Discharged to home with PT',
      },
      {
        id: 'ev-008',
        episodeId: 'ep-002',
        eventDate: '2026-02-14',
        eventType: 'Home Health',
        careSetting: 'Physical Therapy',
        description: 'Home physical therapy sessions',
        cost: 1800,
        provider: 'PT Services',
        facility: 'Home Health PT',
        duration: 45,
        outcome: 'Good progress',
      },
      {
        id: 'ev-009',
        episodeId: 'ep-002',
        eventDate: '2026-04-01',
        eventType: 'Outpatient',
        careSetting: 'Orthopedic Clinic',
        description: '6-week follow-up',
        cost: 450,
        provider: 'Dr. Sarah Martinez',
        facility: 'Orthopedic Specialists',
        outcome: 'Healing well',
      },
    ],
    qualityMetrics: {
      complications: false,
      readmission30Day: false,
      patientSatisfaction: 4.8,
      carePlanAdherence: 92,
    },
    assignedCareManager: 'Linda Marsh',
    primaryProvider: 'Dr. Sarah Martinez',
  },
  {
    id: 'ep-003',
    patientId: 'patient-003',
    patientName: 'Robert Williams',
    patientDOB: '11/08/1955',
    patientAge: 70,
    patientGender: 'M',
    patientMRN: 'MRN-407139',
    episodeType: 'Pneumonia',
    episodeCategory: 'Medical',
    startDate: '2026-04-05',
    endDate: '2026-04-25',
    duration: 20,
    status: 'Closed',
    totalCost: 18200,
    targetCost: 20000,
    costVariance: -9.0,
    utilizationScore: 85,
    events: [
      {
        id: 'ev-010',
        episodeId: 'ep-003',
        eventDate: '2026-04-05',
        eventType: 'ER',
        careSetting: 'Emergency Department',
        description: 'Fever, cough, SOB - pneumonia',
        cost: 1800,
        provider: 'Dr. Emergency',
        facility: 'County Hospital ER',
      },
      {
        id: 'ev-011',
        episodeId: 'ep-003',
        eventDate: '2026-04-05',
        eventType: 'Inpatient',
        careSetting: 'Acute Care Hospital',
        description: 'Admitted for IV antibiotics',
        cost: 14200,
        provider: 'Dr. Michael Chen',
        facility: 'County Hospital',
        duration: 4,
        outcome: 'Improved, discharged home',
      },
      {
        id: 'ev-012',
        episodeId: 'ep-003',
        eventDate: '2026-04-20',
        eventType: 'Outpatient',
        careSetting: 'Primary Care',
        description: 'Follow-up visit',
        cost: 200,
        provider: 'Dr. Sarah Chen',
        facility: 'Primary Care Clinic',
        outcome: 'Resolved, episode closed',
      },
    ],
    qualityMetrics: {
      complications: false,
      readmission30Day: false,
      patientSatisfaction: 4.2,
      carePlanAdherence: 88,
    },
    assignedCareManager: 'Linda Marsh',
    primaryProvider: 'Dr. Sarah Chen',
  },
  {
    id: 'ep-004',
    patientId: 'patient-004',
    patientName: 'James Anderson',
    patientDOB: '05/30/1952',
    patientAge: 74,
    patientGender: 'M',
    patientMRN: 'MRN-508240',
    episodeType: 'Diabetes Management',
    episodeCategory: 'Chronic Care',
    startDate: '2026-01-01',
    endDate: null,
    duration: 148,
    status: 'Active',
    totalCost: 8450,
    targetCost: 12000,
    costVariance: -29.6,
    utilizationScore: 92,
    events: [
      {
        id: 'ev-013',
        episodeId: 'ep-004',
        eventDate: '2026-01-15',
        eventType: 'Outpatient',
        careSetting: 'Endocrinology',
        description: 'Initial diabetes consultation',
        cost: 450,
        provider: 'Dr. Emily Rodriguez',
        facility: 'Chicago Diabetes Center',
      },
      {
        id: 'ev-014',
        episodeId: 'ep-004',
        eventDate: '2026-02-01',
        eventType: 'Lab',
        careSetting: 'Laboratory',
        description: 'A1C, lipid panel, kidney function',
        cost: 280,
        provider: 'Lab Services',
        facility: 'Quest Diagnostics',
      },
      {
        id: 'ev-015',
        episodeId: 'ep-004',
        eventDate: '2026-03-01',
        eventType: 'Outpatient',
        careSetting: 'Endocrinology',
        description: 'Follow-up visit',
        cost: 350,
        provider: 'Dr. Emily Rodriguez',
        facility: 'Chicago Diabetes Center',
      },
      {
        id: 'ev-016',
        episodeId: 'ep-004',
        eventDate: '2026-04-15',
        eventType: 'Outpatient',
        careSetting: 'Ophthalmology',
        description: 'Diabetic eye exam',
        cost: 420,
        provider: 'Dr. Vision',
        facility: 'Eye Care Center',
      },
      {
        id: 'ev-017',
        episodeId: 'ep-004',
        eventDate: '2026-05-01',
        eventType: 'Medication',
        careSetting: 'Pharmacy',
        description: 'Insulin and oral medications',
        cost: 1200,
        provider: 'Pharmacy',
        facility: 'CVS Pharmacy',
      },
    ],
    qualityMetrics: {
      complications: false,
      readmission30Day: false,
      patientSatisfaction: 4.6,
      carePlanAdherence: 94,
    },
    assignedCareManager: 'Linda Marsh',
    primaryProvider: 'Dr. Emily Rodriguez',
  },
  {
    id: 'ep-005',
    patientId: 'patient-005',
    patientName: 'Patricia Davis',
    patientDOB: '09/12/1958',
    patientAge: 67,
    patientGender: 'F',
    patientMRN: 'MRN-609351',
    episodeType: 'COPD Exacerbation',
    episodeCategory: 'Medical',
    startDate: '2026-03-20',
    endDate: null,
    duration: 70,
    status: 'Maintenance',
    totalCost: 24800,
    targetCost: 22000,
    costVariance: 12.7,
    utilizationScore: 68,
    events: [
      {
        id: 'ev-018',
        episodeId: 'ep-005',
        eventDate: '2026-03-20',
        eventType: 'ER',
        careSetting: 'Emergency Department',
        description: 'COPD exacerbation, respiratory distress',
        cost: 2200,
        provider: 'Dr. Emergency',
        facility: 'County Hospital ER',
      },
      {
        id: 'ev-019',
        episodeId: 'ep-005',
        eventDate: '2026-03-20',
        eventType: 'Inpatient',
        careSetting: 'Acute Care Hospital',
        description: 'Admitted for respiratory support',
        cost: 16500,
        provider: 'Dr. James Williams',
        facility: 'County Hospital',
        duration: 6,
        outcome: 'Stabilized, discharged home',
      },
      {
        id: 'ev-020',
        episodeId: 'ep-005',
        eventDate: '2026-03-26',
        eventType: 'Home Health',
        careSetting: 'Home Health Services',
        description: 'Respiratory therapy and nursing',
        cost: 2800,
        provider: 'Home Health RN',
        facility: 'Community Home Health',
        duration: 21,
      },
      {
        id: 'ev-021',
        episodeId: 'ep-005',
        eventDate: '2026-04-20',
        eventType: 'Outpatient',
        careSetting: 'Pulmonology',
        description: 'Follow-up pulmonology visit',
        cost: 380,
        provider: 'Dr. James Williams',
        facility: 'Respiratory Health Center',
      },
      {
        id: 'ev-022',
        episodeId: 'ep-005',
        eventDate: '2026-05-15',
        eventType: 'Outpatient',
        careSetting: 'Pulmonology',
        description: 'Maintenance visit',
        cost: 320,
        provider: 'Dr. James Williams',
        facility: 'Respiratory Health Center',
        outcome: 'Stable, ongoing maintenance',
      },
    ],
    qualityMetrics: {
      complications: false,
      readmission30Day: false,
      patientSatisfaction: 4.0,
      carePlanAdherence: 78,
    },
    assignedCareManager: 'Linda Marsh',
    primaryProvider: 'Dr. James Williams',
  },
];
