/**
 * Client for the HITL policy-review workflow — the gate between what the
 * Intelligent Policy Engine's LLM extraction produced and what DTR is
 * actually allowed to use for a real coverage decision. See
 * services/policy-engine/src/policy-review.mjs for the server-side rules,
 * including the review-cadence and source-file-change staleness mechanism.
 */

const POLICY_ENGINE_URL =
  process.env.NEXT_PUBLIC_POLICY_ENGINE_URL ?? "http://localhost:8083";

export type PolicyReviewStatus = "pending_review" | "approved" | "needs_revision";

export interface PolicyQueueEntry {
  policyId: string;
  policyTitle: string;
  payer?: string;
  governedCptCodes: string[];
  status: PolicyReviewStatus;
  sourceFile: string | null;
  reviewCadenceDays: number;
  nextReviewDue: string | null;
  isOverdue: boolean;
  sourceChanged: boolean;
  needsAttention: boolean;
  lastReviewedAt: string | null;
  lastReviewedBy: string | null;
}

export interface ReviewHistoryEntry {
  action: "approved" | "rejected";
  reviewerName: string;
  comment: string | null;
  timestamp: string;
  reviewCadenceDays?: number;
}

export interface CriteriaGroupDetail {
  id: number;
  title: string;
  required?: boolean;
  description?: string;
  fhirQuery?: {
    resourceType?: string;
    searchParam?: string;
    system?: string;
    codes?: string[];
    valueComparison?: string | null;
  };
  candidateCodes?: { code: string; system?: string; display?: string }[];
  documentationRequired?: string;
  sourceExcerpt?: string;
}

export interface PolicyReviewDetail {
  policyId: string;
  policyTitle: string;
  payer?: string;
  effectiveDate?: string;
  governedCptCodes: string[];
  criteriaGroups: CriteriaGroupDetail[];
  notes?: string;
  /** Which LLM actually produced this extraction — "openai" (GPT-4o) or
   * "groq" (a free, no-credit-card alternative). Absent on policies ingested
   * before this field existed. */
  extractionProvider?: "openai" | "groq";
  extractionModel?: string;
  status: PolicyReviewStatus;
  sourcePolicyText?: string;
  sourceFile: string | null;
  reviewCadenceDays: number;
  reviewHistory: ReviewHistoryEntry[];
  nextReviewDue: string | null;
  isOverdue: boolean;
  sourceChanged: boolean;
  needsAttention: boolean;
  lastReviewedAt: string | null;
  lastReviewedBy: string | null;
}

export interface AuditLogEntry {
  policyId: string;
  policyTitle: string;
  payer?: string;
  action: "approved" | "rejected";
  reviewerName: string;
  comment: string | null;
  timestamp: string;
  reviewCadenceDays: number | null;
  nextReviewDue: string | null;
  isCurrent: boolean;
  isOverdue: boolean;
}

/** Everything currently awaiting a clinical reviewer: never-reviewed
 * extractions, policies sent back for revision, approved policies overdue
 * for re-review, and approved policies whose source file changed on disk
 * since the last approval. */
export async function fetchReviewQueue(): Promise<{ queue: PolicyQueueEntry[]; defaultReviewCadenceDays: number }> {
  const res = await fetch(`${POLICY_ENGINE_URL}/policies/review-queue`);
  if (!res.ok) throw new Error(`Failed to load review queue (${res.status})`);
  return res.json();
}

/** Every ingested policy with its current review status — used for the
 * status badges on the Ingest screen's policy list. */
export async function fetchPolicyStatusList(): Promise<PolicyQueueEntry[]> {
  const res = await fetch(`${POLICY_ENGINE_URL}/policies/status`);
  if (!res.ok) throw new Error(`Failed to load policy statuses (${res.status})`);
  const body = await res.json();
  return body.policies ?? [];
}

/** Full detail for one policy, including source text, per-group source
 * excerpts, and review history — the data behind the logic-tree screen. */
export async function fetchPolicyReviewDetail(policyId: string): Promise<PolicyReviewDetail> {
  const res = await fetch(`${POLICY_ENGINE_URL}/policies/${encodeURIComponent(policyId)}`);
  if (!res.ok) throw new Error(`Policy ${policyId} not found (${res.status})`);
  return res.json();
}

export async function approvePolicy(
  policyId: string,
  reviewerName: string,
  comment?: string,
  reviewCadenceDays?: number
): Promise<{ success: boolean; policy: PolicyReviewDetail }> {
  const res = await fetch(`${POLICY_ENGINE_URL}/policies/${encodeURIComponent(policyId)}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewerName, comment, reviewCadenceDays }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `Approve failed (${res.status})`);
  return body;
}

export async function rejectPolicy(
  policyId: string,
  reviewerName: string,
  comment: string
): Promise<{ success: boolean; policy: PolicyReviewDetail }> {
  const res = await fetch(`${POLICY_ENGINE_URL}/policies/${encodeURIComponent(policyId)}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewerName, comment }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `Reject failed (${res.status})`);
  return body;
}

export interface AuditLogFilters {
  policyId?: string;
  reviewerName?: string;
  action?: "approved" | "rejected";
}

/** Flattened, permanent history of every review decision across every
 * policy — one row per approve/reject event, most recent first. */
export async function fetchAuditLog(filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams();
  if (filters.policyId) params.set("policyId", filters.policyId);
  if (filters.reviewerName) params.set("reviewerName", filters.reviewerName);
  if (filters.action) params.set("action", filters.action);
  const qs = params.toString();
  const res = await fetch(`${POLICY_ENGINE_URL}/audit-log${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`Failed to load audit log (${res.status})`);
  const body = await res.json();
  return body.entries ?? [];
}
