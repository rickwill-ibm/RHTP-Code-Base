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

/** The FHIR search rule behind a criteria group, in the same shape the
 * Review Policy Logic screen already uses — reused here so DTR shows the
 * identical rule text a clinical reviewer already verified, not a
 * re-derived or re-worded version of it. */
export interface DtrFhirQuery {
  resourceType?: string;
  searchParam?: string;
  system?: string;
  codes?: string[];
  valueComparison?: string | null;
}

export interface DtrGroup {
  id: number;
  title: string;
  status: "met" | "gap" | "pending";
  /** Whether this group is mandatory for approval (vs. supportive/optional). */
  required?: boolean;
  /** Plain-English requirement text from the policy, for the "Policy Requirement" column. */
  description?: string;
  /** The FHIR rule behind this group, rendered in plain terms — same data the review screen shows. */
  fhirQuery?: DtrFhirQuery;
  /** Verbatim quote from the source policy document supporting this group, when the policy has one. */
  sourceExcerpt?: string;
  /** Primary leaf evidence for met groups */
  leaf?: DtrLeaf;
  /** Candidate codes for gap groups */
  candidateCodes?: CandidateCode[];
  /** Human-readable evidence summary from a CDex upload, derived from uploadedDocumentReference */
  uploadedEvidence?: string;
  /**
   * The Da Vinci CDex-conformant DocumentReference backing an uploaded gap
   * resolution (Dev Plan Workstream B). docStatus stays "preliminary" until a
   * clinician confirms it — the gap is not truly resolved until then.
   */
  uploadedDocumentReference?: import("@/lib/dtr/cdexDocumentReference").DocumentReference;
}

export interface DtrLeaf {
  code: string;
  label: string;
  evidence: string;
  source: "emr" | "pa" | "upload" | null;
  /** FHIR resource type the match came from (Condition, Observation, ...). */
  resourceType?: string;
  /**
   * The actual clinical visit date, resolved from the matched resource's
   * linked Encounter — distinct from recordedDate (when it was charted).
   * Only populated when the resource actually links to an Encounter.
   */
  dateOfService?: string | null;
  /** The resource's own date field (effectiveDateTime/recordedDate/onsetDateTime/authoredOn). */
  recordedDate?: string | null;
  /** Resolved performing/recording provider name, when the resource carries that provenance. */
  performerName?: string | null;
  /** FHIR reference for the resolved provider, e.g. "Practitioner/practitioner-aagaard". */
  performerReference?: string | null;
  /** FHIR reference for the linked Encounter, when present. */
  encounterReference?: string | null;
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
  /** Display summary — joined procedure names for multi-procedure orders. */
  service: string;
  /** Display summary — joined CPT codes for multi-procedure orders. */
  cpt: string;
  /** Full per-procedure detail, when the case originated from a real order. */
  procedures?: OrderProcedure[];
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

/** One procedure/service line on an order. An order may carry more than one —
 * CRD, DTR, and PAS all operate per-procedure and then roll up to the order. */
export interface OrderProcedure {
  cpt: string;
  cptSystem: "http://www.ama-assn.org/go/cpt" | "https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets";
  cptDesc: string;
}

export interface PaOrder {
  /** One or more procedures being requested together on this order. */
  procedures: OrderProcedure[];
  orderingProvider: string;
  facility: string;
  orderDate: string;
}

/** Per-procedure CRD result, keyed by the procedure's CPT code. */
export interface CrdResultEntry {
  cpt: string;
  cptDesc: string;
  result: CrdCheckResult;
}

/** Per-procedure DTR result — DtrMatchResult already carries its own cptCode. */
export type DtrResultEntry = DtrMatchResult;

export interface PatientBanner {
  name: string;
  dob: string;
  memberId: string;
}
