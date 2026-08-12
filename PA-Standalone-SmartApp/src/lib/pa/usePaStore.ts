/**
 * Central Zustand store for the PA workflow.
 *
 * Holds all transient UI state for the CRD → DTR → PAS flow
 * plus the persistent case list for the PA Portal.
 */

import { create } from "zustand";
import type {
  CrdResultEntry,
  DtrResultEntry,
  DtrGroup,
  PaCase,
  PaOrder,
  PatientBanner,
  SubmissionChannel,
  PaStatus,
} from "@/lib/pa/pa-types";
import {
  buildCdexDocumentReference,
  summarizeDocumentReference,
  type UploadedFileMeta,
} from "@/lib/dtr/cdexDocumentReference";

export type AppView =
  | "order"
  | "checklist"
  | "dtr"
  | "review"
  | "portal"
  | "case"
  | "worklist"
  | "policies"
  | "policyReview"
  | "auditLog";

interface PaStore {
  // ── Navigation ──────────────────────────────────────────────────────────
  view: AppView;
  setView: (v: AppView) => void;
  /**
   * When set, PolicyReviewView opens directly on this policy's logic-tree
   * detail (instead of the queue landing list) the next time it mounts, then
   * clears itself. Lets the Ingest screen's "Review before it goes live →"
   * button deep-link straight to the policy it just extracted.
   */
  reviewFocusPolicyId: string | null;
  setReviewFocusPolicyId: (id: string | null) => void;
  goToPolicyReview: (policyId: string) => void;
  /**
   * Full patient chart drawer — deliberately independent of `view`. Opening
   * it must not navigate away from whatever step (Order, DTR, etc.) the
   * reviewer is currently on, since the whole point is cross-referencing the
   * chart without losing your place in the CRD/DTR pipeline.
   */
  patientRecordOpen: boolean;
  openPatientRecord: () => void;
  closePatientRecord: () => void;

  // ── Order ───────────────────────────────────────────────────────────────
  order: PaOrder | null;
  patient: PatientBanner | null;
  patientLoading: boolean;
  patientError: string | null;
  setOrder: (o: PaOrder) => void;
  setPatient: (p: PatientBanner) => void;
  setPatientLoading: (v: boolean) => void;
  setPatientError: (e: string | null) => void;

  // ── CRD (one result per procedure on the order) ────────────────────────
  crdLoading: boolean;
  crdResults: CrdResultEntry[] | null;
  crdError: string | null;
  setCrdLoading: (v: boolean) => void;
  setCrdResults: (r: CrdResultEntry[]) => void;
  setCrdError: (e: string) => void;

  // ── DTR (one match result per procedure on the order) ──────────────────
  dtrLoading: boolean;
  dtrResults: DtrResultEntry[] | null;
  dtrError: string | null;
  setDtrLoading: (v: boolean) => void;
  setDtrResults: (r: DtrResultEntry[]) => void;
  setDtrError: (e: string) => void;
  /**
   * Resolve a DTR requirement-group gap (for a specific procedure's policy
   * tree, identified by cptCode) with an uploaded file. Builds a Da Vinci
   * CDex-conformant DocumentReference from the file metadata (Dev Plan
   * Workstream B) — the group's displayed evidence text is always derived
   * from that resource, not a bare filename string.
   */
  resolveDtrGap: (cptCode: string, groupId: number, file: UploadedFileMeta) => void;

  // ── Submission ───────────────────────────────────────────────────────────
  channel: SubmissionChannel;
  setChannel: (c: SubmissionChannel) => void;
  submitLoading: boolean;
  setSubmitLoading: (v: boolean) => void;
  submittedCase: PaCase | null;
  setSubmittedCase: (c: PaCase) => void;

  // ── PA Portal ────────────────────────────────────────────────────────────
  cases: PaCase[];
  addCase: (c: PaCase) => void;
  updateCaseStatus: (authId: string, status: PaStatus) => void;
  activePortalTab: string;
  setActivePortalTab: (t: string) => void;

  // ── Case Detail ──────────────────────────────────────────────────────────
  activeCaseId: string | null;
  setActiveCaseId: (id: string) => void;
  activeCaseTab: string;
  setActiveCaseTab: (t: string) => void;

  // ── Reset workflow (start new request) ──────────────────────────────────
  resetWorkflow: () => void;
}

// ── Seed mock cases (must be declared before create() to avoid TDZ) ───────────

const MOCK_CASES: PaCase[] = [
  {
    authId: "AUTH-88213",
    patient: "Priya Natarajan",
    memberId: "5518820",
    service: "CT Angiography, Chest",
    cpt: "71275",
    dateRequested: "07/28/2026",
    channel: "FHIR",
    status: "Approved",
    checklist: [
      { label: "Patient Enrolled", detail: "Active coverage verified", pass: true, source: "pa" },
      { label: "Patient Eligible", detail: "Eligibility confirmed", pass: true, source: "pa" },
      { label: "Provider In-Network", detail: "Confirmed in-network", pass: true, source: "emr" },
      { label: "Prior Authorization Required", detail: "YES", pass: true, source: null },
    ],
    dtr: [
      { title: "Clinical Indication Documented", status: "met", evidence: "Suspected PE, D-dimer elevated 07/20/2026", source: "emr" },
      { title: "Conservative Imaging Attempted First", status: "met", evidence: "Chest X-ray non-diagnostic 07/19/2026", source: "emr" },
      { title: "Ordering Specialty Match", status: "met", evidence: "Ordered by pulmonology", source: "pa" },
    ],
    submission: { channel: "fhir", paNumber: "AUTH-88213", payloadType: "FHIR PAS Bundle (Claim/$submit)", timestamp: "07/28/2026 9:14 AM", payerEndpoint: "https://payer-fhir.example-payer.com/R4/Claim/$submit" },
    timeline: [
      { status: "Submitted", ts: "07/28/2026 9:14 AM", color: "blue" },
      { status: "Pended", ts: "07/28/2026 9:15 AM", color: "amber" },
      { status: "Approved", ts: "07/29/2026 2:03 PM", color: "green" },
    ],
  },
  {
    authId: "AUTH-88190",
    patient: "Marcus Bell",
    memberId: "4471902",
    service: "MRI Lumbar Spine w/o Contrast",
    cpt: "72148",
    dateRequested: "07/21/2026",
    channel: "EDI",
    status: "Pended",
    checklist: [
      { label: "Patient Enrolled", detail: "Active coverage verified", pass: true, source: "pa" },
      { label: "Patient Eligible", detail: "Eligibility confirmed", pass: true, source: "pa" },
      { label: "Provider In-Network", detail: "Confirmed in-network", pass: true, source: "emr" },
      { label: "Prior Authorization Required", detail: "YES", pass: true, source: null },
    ],
    dtr: [
      { title: "6 Weeks Conservative Therapy", status: "met", evidence: "PT notes on file 05/02–06/18/2026", source: "emr" },
      { title: "Neurological Deficit or Red Flag", status: "gap", evidence: "Not yet documented", source: null },
    ],
    submission: { channel: "edi", paNumber: "AUTH-88190", payloadType: "X12 275/278 (EDI)", timestamp: "07/21/2026 8:02 AM", payerEndpoint: "Clearinghouse: Availity → Payer EDI Gateway (275/278)" },
    timeline: [
      { status: "Submitted", ts: "07/21/2026 8:02 AM", color: "blue" },
      { status: "Pended", ts: "07/21/2026 8:10 AM", color: "amber" },
    ],
  },
  {
    authId: "AUTH-88175",
    patient: "Wanda Brooks",
    memberId: "3390117",
    service: "Total Knee Arthroplasty",
    cpt: "27447",
    dateRequested: "07/10/2026",
    channel: "FHIR",
    status: "Partially Approved / Modified",
    checklist: [
      { label: "Patient Enrolled", detail: "Active coverage verified", pass: true, source: "pa" },
      { label: "Patient Eligible", detail: "Eligibility confirmed", pass: true, source: "pa" },
      { label: "Provider In-Network", detail: "Confirmed in-network", pass: true, source: "emr" },
      { label: "Prior Authorization Required", detail: "YES", pass: true, source: null },
    ],
    dtr: [
      { title: "Radiographic Evidence of Joint Damage", status: "met", evidence: "Kellgren-Lawrence Grade 3, X-ray 06/28/2026", source: "emr" },
      { title: "Failed Conservative Treatment ≥ 3 Months", status: "met", evidence: "NSAIDs + PT 03/2026–06/2026", source: "emr" },
      { title: "Post-Acute Setting Requested", status: "met", evidence: "Inpatient rehab requested; approved for outpatient PT instead", source: "pa" },
    ],
    submission: { channel: "fhir", paNumber: "AUTH-88175", payloadType: "FHIR PAS Bundle (Claim/$submit)", timestamp: "07/10/2026 10:22 AM", payerEndpoint: "https://payer-fhir.example-payer.com/R4/Claim/$submit" },
    timeline: [
      { status: "Submitted", ts: "07/10/2026 10:22 AM", color: "blue" },
      { status: "Pended", ts: "07/10/2026 10:40 AM", color: "amber" },
      { status: "Partially Approved / Modified", ts: "07/12/2026 11:15 AM", color: "teal" },
    ],
  },
  {
    authId: "AUTH-88150",
    patient: "Thomas Okafor",
    memberId: "2287744",
    service: "Outpatient Sleep Study",
    cpt: "95810",
    dateRequested: "07/02/2026",
    channel: "EDI",
    status: "Denied",
    checklist: [
      { label: "Patient Enrolled", detail: "Active coverage verified", pass: true, source: "pa" },
      { label: "Patient Eligible", detail: "Eligibility confirmed", pass: true, source: "pa" },
      { label: "Provider In-Network", detail: "Confirmed in-network", pass: true, source: "emr" },
      { label: "Prior Authorization Required", detail: "YES", pass: true, source: null },
    ],
    dtr: [
      { title: "Epworth Sleepiness Scale ≥ 10", status: "gap", evidence: "Score of 6 — below threshold", source: "emr" },
      { title: "Home Sleep Test Attempted First", status: "gap", evidence: "No home sleep test on record", source: null },
    ],
    submission: { channel: "edi", paNumber: "AUTH-88150", payloadType: "X12 275/278 (EDI)", timestamp: "07/02/2026 1:05 PM", payerEndpoint: "Clearinghouse: Availity → Payer EDI Gateway (275/278)" },
    timeline: [
      { status: "Submitted", ts: "07/02/2026 1:05 PM", color: "blue" },
      { status: "Pended", ts: "07/02/2026 1:20 PM", color: "amber" },
      { status: "Denied", ts: "07/03/2026 9:47 AM", color: "red" },
    ],
  },
];

export const usePaStore = create<PaStore>((set, get) => ({
  // Navigation
  view: "order",
  setView: (v) => set({ view: v }),
  reviewFocusPolicyId: null,
  setReviewFocusPolicyId: (id) => set({ reviewFocusPolicyId: id }),
  goToPolicyReview: (policyId) => set({ view: "policyReview", reviewFocusPolicyId: policyId }),
  patientRecordOpen: false,
  openPatientRecord: () => set({ patientRecordOpen: true }),
  closePatientRecord: () => set({ patientRecordOpen: false }),

  // Order
  order: null,
  patient: null,
  patientLoading: false,
  patientError: null,
  setOrder: (o) => set({ order: o }),
  setPatient: (p) => set({ patient: p, patientError: null }),
  setPatientLoading: (v) => set({ patientLoading: v }),
  setPatientError: (e) => set({ patientError: e, patientLoading: false }),

  // CRD — one result entry per procedure on the order
  crdLoading: false,
  crdResults: null,
  crdError: null,
  setCrdLoading: (v) => set({ crdLoading: v }),
  setCrdResults: (r) => set({ crdResults: r, crdError: null }),
  setCrdError: (e) => set({ crdError: e, crdLoading: false }),

  // DTR — one match result per procedure on the order
  dtrLoading: false,
  dtrResults: null,
  dtrError: null,
  setDtrLoading: (v) => set({ dtrLoading: v }),
  setDtrResults: (r) => set({ dtrResults: r, dtrError: null }),
  setDtrError: (e) => set({ dtrError: e, dtrLoading: false }),
  resolveDtrGap: (cptCode, groupId, file) =>
    set((s) => {
      if (!s.dtrResults) return {};
      const dtrResults = s.dtrResults.map((dtr) => {
        if (dtr.cptCode !== cptCode) return dtr;
        const groups: DtrGroup[] = dtr.groups.map((g) => {
          if (g.id !== groupId) return g;
          const documentReference = buildCdexDocumentReference(file, {
            patientId: s.patient?.memberId ?? "unknown",
            groupId: g.id,
            groupTitle: g.title,
          });
          return {
            ...g,
            status: "met" as const,
            uploadedDocumentReference: documentReference,
            uploadedEvidence: summarizeDocumentReference(documentReference),
          };
        });
        const allMet = groups.every((g) => g.status === "met");
        return { ...dtr, groups, allMet };
      });
      return { dtrResults };
    }),

  // Submission
  channel: "fhir",
  setChannel: (c) => set({ channel: c }),
  submitLoading: false,
  setSubmitLoading: (v) => set({ submitLoading: v }),
  submittedCase: null,
  setSubmittedCase: (c) =>
    set((s) => ({
      submittedCase: c,
      cases: [c, ...s.cases.filter((x) => x.authId !== c.authId)],
    })),

  // PA Portal
  cases: MOCK_CASES,
  addCase: (c) =>
    set((s) => ({
      cases: [c, ...s.cases.filter((x) => x.authId !== c.authId)],
    })),
  updateCaseStatus: (authId, status) =>
    set((s) => ({
      cases: s.cases.map((c) => (c.authId === authId ? { ...c, status } : c)),
    })),
  activePortalTab: "All",
  setActivePortalTab: (t) => set({ activePortalTab: t }),

  // Case Detail
  activeCaseId: "AUTH-88213",
  setActiveCaseId: (id) => set({ activeCaseId: id }),
  activeCaseTab: "checklist",
  setActiveCaseTab: (t) => set({ activeCaseTab: t }),

  // Reset
  resetWorkflow: () =>
    set({
      view: "order",
      order: null,
      patientLoading: false,
      patientError: null,
      crdLoading: false,
      crdResults: null,
      crdError: null,
      dtrLoading: false,
      dtrResults: null,
      dtrError: null,
      channel: "fhir",
      submitLoading: false,
      submittedCase: null,
    }),
}));

