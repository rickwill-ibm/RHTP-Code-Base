/**
 * PA domain types used across CRD · DTR · PAS layers.
 * These match the FHIR R4 / Da Vinci resource shapes used in the service layer.
 */

// ── CRD ─────────────────────────────────────────────────────────────────────

export interface CrdCheckResult {
  patientEnrolled: CheckItem;
  patientEligible: CheckItem;
  providerInNetwork: CheckItem;
  noConflictingGuideline: CheckItem;
  paRequired: CheckItem & { required: boolean };
}

export interface CheckItem {
  pass: boolean;
  label: string;
  detail: string;
  source: "emr" | "pa" | "guideline" | null;
}

// ── DTR ─────────────────────────────────────────────────────────────────────

export interface DtrGroup {
  id: number;
  title: string;
  status: "met" | "gap" | "pending";
  /** Primary leaf evidence for met groups */
  leaf?: DtrLeaf;
  /** Candidate codes for gap groups */
  candidateCodes?: CandidateCode[];
  /** Evidence from a CDex upload */
  uploadedEvidence?: string;
}

export interface DtrLeaf {
  code: string;
  label: string;
  evidence: string;
  source: "emr" | "pa" | "upload" | null;
}

export interface CandidateCode {
  code: string;
  system: "http://hl7.org/fhir/sid/icd-10-cm" | "http://www.ama-assn.org/go/cpt";
  label: string;
}

export interface DtrMatchResult {
  policyTitle: string;
  cptCode: string;
  groups: DtrGroup[];
  allMet: boolean;
}

// ── PAS ─────────────────────────────────────────────────────────────────────

export type SubmissionChannel = "fhir" | "edi";

export interface PasSubmission {
  channel: SubmissionChannel;
  paNumber: string;
  payerEndpoint: string;
  payloadType: string;
  timestamp: string;
}

export type PaStatus =
  | "Submitted"
  | "Pended"
  | "Approved"
  | "Partially Approved / Modified"
  | "Denied"
  | "Pending";

export interface PaCase {
  authId: string;
  patient: string;
  memberId: string;
  service: string;
  cpt: string;
  dateRequested: string;
  channel: "FHIR" | "EDI";
  status: PaStatus;
  checklist: CheckItem[];
  dtr: { title: string; status: "met" | "gap"; evidence: string; source: "emr" | "pa" | "upload" | null }[];
  submission: PasSubmission;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  status: string;
  ts: string;
  color: "blue" | "amber" | "green" | "teal" | "red" | "gray";
}

// ── Order ────────────────────────────────────────────────────────────────────

export interface PaOrder {
  procedure: string;
  cpt: string;
  cptDesc: string;
  orderingProvider: string;
  facility: string;
  orderDate: string;
}

export interface PatientBanner {
  name: string;
  dob: string;
  memberId: string;
}
