/**
 * Shared Domain Types
 *
 * These interfaces describe the shape of TCOC domain entities.
 * Components should import types from here — not from mockData.ts —
 * so they remain decoupled from the data source (mock vs live FHIR).
 *
 * The actual data lives in:
 *   - Mock mode:      src/lib/mockData.ts
 *   - Production:     FHIR R4 resources mapped by src/lib/services/fhirResourceMappers.ts
 */

// ─── Scalar Union Types ───────────────────────────────────────────────────────

export type UserRole = 'care_manager' | 'physician';
export type RiskTier = 'Critical' | 'High' | 'Moderate' | 'Low';
export type AttributionStatus = 'Confirmed' | 'Provisional' | 'Disputed' | 'Dropped';
export type HCCStatus =
  | 'Surfaced'
  | 'Evidence Reviewed'
  | 'Clinician Review'
  | 'Documented'
  | 'Submitted'
  | 'Confirmed'
  | 'Rejected';
export type GapStatus = 'Open' | 'In Progress' | 'Closed' | 'Excluded' | 'Expired';
export type AlertTier = 'Critical' | 'Important' | 'Informational';
export type ProgramType = 'MSSP ACO' | 'ACO REACH' | 'Commercial VBC' | 'Medicaid MCO';
export type NetworkTier = 'Preferred' | 'In-Network' | 'Out-of-Network';

// ─── Entity Interfaces ────────────────────────────────────────────────────────

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
  type:
    | 'Predicted ER Risk'
    | 'Avoidable Admission'
    | 'High-Cost Imaging'
    | 'Poly-Pharmacy'
    | 'SNF Readmission Risk';
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

// ─── Financial Summary Types ──────────────────────────────────────────────────

export interface PmpmDataPoint {
  month: string;
  actual: number;
  target: number;
  benchmark?: number;
}

export interface CostCategoryBreakdown {
  category: string;
  actual: number;
  target: number;
  percentOfTotal: number;
}
