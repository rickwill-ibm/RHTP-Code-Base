// patientContext.types.ts — All types and interfaces for patient context

// ─── Types ────────────────────────────────────────────────────────────────────

export type EpisodeStatus = 'Active' | 'Stable' | 'Closed' | 'Escalated';
export type BHRiskLevel = 'Low' | 'Moderate' | 'High' | 'Crisis';
export type GapStatus = 'Open' | 'In Progress' | 'Closed' | 'Waived';
export type GapDomain = 'Clinical' | 'BH' | 'Social';

// ─── Gap Closure Store Types ──────────────────────────────────────────────────

export type HedisCompliance = 'MET' | 'NOT_MET' | 'PENDING';
export type GapClosureSource = 'PATIENT_DETAIL' | 'SMART_LAUNCH';
export type GapClosureStatus = 'OPEN' | 'CLOSING' | 'CLOSED';

export interface GapClosureEvidence {
  gapId: string;
  status: GapClosureStatus;
  closedAt?: string;
  closedFrom?: GapClosureSource;
  dateOfService?: string;
  performingProvider?: string;
  placeOfService?: string;
  procedureCode?: string;
  resultValue?: number;
  resultUnit?: string;
  hedisCompliance?: HedisCompliance;
  gainshare?: number;
  fhirObservationId?: string;
}

export interface GapClosureStoreValue {
  closures: Record<string, GapClosureEvidence>;
  mostRecentClosedGapByPatient: Record<string, string>;
  getGapClosure: (gapId: string) => GapClosureEvidence | undefined;
  getMostRecentClosedGapId: (patientId: string) => string | undefined;
  startClosing: (gapId: string) => void;
  submitClosure: (evidence: GapClosureEvidence) => void;
  isGapClosed: (gapId: string) => boolean;
  isGapClosing: (gapId: string) => boolean;
  /** Register the active patient IDs so closures are correctly attributed. */
  setActivePatientContext: (platformId: string, fhirId: string) => void;
  /**
   * Pre-populate fhirObservationId for gaps loaded from FHIR.
   * Only writes gaps that do not already have a submitted closure (CLOSING/CLOSED).
   */
  seedObservationIds: (updates: Record<string, GapClosureEvidence>) => void;
  /** PUT Task/{id} → completed after a gap closure succeeds. */
  completeTask: (gapId: string) => void;
}

export interface CareGap {
  id: string;
  domain: GapDomain;
  name: string;
  status: GapStatus;
  daysOpen: number;
  assignedTo: string;
  evidence?: string;
  closedDate?: string;
}

export interface PathwayStep {
  id: string;
  label: string;
  completed: boolean;
  date?: string;
  metric?: string;
}

export interface PatientSharedState {
  // Identity
  patientId: string;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  dob: string;
  pcp: string;
  careManager: string;
  careManagerInitials: string;
  organization: string;
  attribution: string;

  // Episode
  episodeType: string;
  episodeStatus: EpisodeStatus;
  episodeDaysActive: number;
  pmpm: number;
  pmpmTarget: number;
  rafScore: number;
  rafDelta: number;
  riskTier: string;
  erRiskPct: number;
  hccSuspects: number;
  hccValue: number;
  lastContact: string;
  attributionDetail: string;

  // BH
  phq9Score: number;
  phq9Trend: string;
  auditC: number;
  traumaFlag: boolean;
  bhRisk: BHRiskLevel;
  bhReferralStatus: string;
  bhReferralDate: string;
  bhProvider: string;
  pamScore: number;
  pamLabel: string;
  patientGoal: string;

  // Social Needs
  transportStatus: string;
  transportReferralId: string;
  referralStatus: string;
  referralDaysOpen: number;
  foodSecurity: string;
  housingStatus: string;
  language: string;
  literacy: string;
  cohortFlag: string;
  ruralDistance: string;
  disparityFlag: string;
  snapStatus: string;

  // Care Gaps
  careGaps: CareGap[];

  // Pathway Progress (Dorothy's whole-person journey)
  pathwaySteps: PathwayStep[];

  // Rich clinical data (from RegistryPatient, used by ClinicalTab)
  conditions?: import('./patientRegistry').ConditionEntry[];
  medications?: import('./patientRegistry').MedicationEntry[];
  recentOrders?: import('./patientRegistry').OrderEntry[];

  // Additional registry fields used by tabs
  riskLabel: string;
  bhScore: number | null;
  bhScoreLabel: string;
  aiCopilot: string;

  // Crisis
  crisisCount30d: number;
  lastCrisisDate: string | null;
  activeCrisis: boolean;
}
