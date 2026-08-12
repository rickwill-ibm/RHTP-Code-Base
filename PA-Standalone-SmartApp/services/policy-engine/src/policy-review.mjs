/**
 * policy-review.mjs
 *
 * Human-in-the-loop review/approval workflow for ingested policies, plus the
 * audit log and review-cadence/staleness mechanism built on top of it.
 *
 * A policy written by policy-ingestor.mjs's ingestPolicyText() always starts
 * life with status: "pending_review". GET /policies (index.mjs) — the
 * endpoint DTR actually reads, via the frontend's policyLookup.findPolicyIdForCpt()
 * — only returns status: "approved" policies, so nothing an LLM just
 * extracted can govern a real coverage decision until a clinical reviewer
 * explicitly approves it via the endpoints in this file.
 *
 * Staleness: every approval carries a reviewCadenceDays (default below,
 * overridable per approval). nextReviewDue/isOverdue are NEVER stored — they
 * are recomputed on every read from the most recent "approved" entry in
 * reviewHistory, so they can't drift out of sync and need no cron/scheduler
 * to stay accurate.
 *
 * Source-file change detection: many payers publish policies as files in a
 * directory that gets updated in place when the policy changes, rather than
 * emitting an event anywhere an app could subscribe to. So instead of only
 * relying on a time-based cadence, an approved policy that was ingested from
 * a file in policies/seeds/ (via POST /ingest or /ingest/upload) also
 * snapshots that file's mtime at approval time. If the file's mtime moves
 * forward afterward — i.e. someone replaced it with an updated version — the
 * policy is flagged sourceChanged:true and resurfaces in the review queue
 * immediately, independent of the cadence timer. Pasted-text ingestions
 * (POST /ingest/text) have no backing file and fall back to cadence-only.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const POLICIES_DIR = resolve(__dir, "../policies");
const SEEDS_DIR = resolve(__dir, "../policies/seeds");

export const DEFAULT_REVIEW_CADENCE_DAYS = parseInt(process.env.POLICY_REVIEW_CADENCE_DAYS ?? "180", 10);

function policyPath(policyId) {
  return resolve(POLICIES_DIR, `${policyId}.json`);
}

function readPolicyRaw(policyId) {
  const p = policyPath(policyId);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function writePolicyRaw(policyId, policy) {
  writeFileSync(policyPath(policyId), JSON.stringify(policy, null, 2), "utf-8");
}

function allPolicyIds() {
  if (!existsSync(POLICIES_DIR)) return [];
  return readdirSync(POLICIES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

/** Current mtime (ms) of a policy's source file in policies/seeds/, or null
 * if it has no source file (pasted-text ingestion) or the file is gone. */
function currentSourceMtime(sourceFile) {
  if (!sourceFile) return null;
  const p = resolve(SEEDS_DIR, sourceFile);
  if (!existsSync(p)) return null;
  return statSync(p).mtimeMs;
}

/**
 * Derived review-status fields for a policy — recomputed fresh from
 * reviewHistory + the live filesystem on every call, never stored.
 *
 * Policies ingested before this HITL gate existed have no `status` field at
 * all; those default to "approved" here so pre-existing demo policies keep
 * working rather than silently vanishing from DTR. They simply have no
 * review history until someone explicitly reviews them going forward.
 */
export function computeReviewStatus(policy) {
  const status = policy.status ?? "approved";
  const history = policy.reviewHistory ?? [];
  const lastApproval = [...history].reverse().find((h) => h.action === "approved");
  const lastEvent = history[history.length - 1] ?? null;

  let nextReviewDue = null;
  let isOverdue = false;
  if (lastApproval) {
    const cadence = lastApproval.reviewCadenceDays ?? policy.reviewCadenceDays ?? DEFAULT_REVIEW_CADENCE_DAYS;
    nextReviewDue = new Date(new Date(lastApproval.timestamp).getTime() + cadence * 86400000).toISOString();
    isOverdue = status === "approved" && Date.now() > new Date(nextReviewDue).getTime();
  }

  let sourceChanged = false;
  if (status === "approved" && policy.sourceFile) {
    const mtime = currentSourceMtime(policy.sourceFile);
    if (mtime != null && policy.lastApprovedSourceMtime != null && mtime > policy.lastApprovedSourceMtime) {
      sourceChanged = true;
    }
  }

  return {
    status,
    nextReviewDue,
    isOverdue,
    sourceChanged,
    needsAttention: status !== "approved" || isOverdue || sourceChanged,
    lastReviewedAt: lastEvent?.timestamp ?? null,
    lastReviewedBy: lastEvent?.reviewerName ?? null,
  };
}

function summarize(policy) {
  return {
    policyId: policy.policyId,
    policyTitle: policy.policyTitle,
    payer: policy.payer,
    governedCptCodes: policy.governedCptCodes ?? [],
    sourceFile: policy.sourceFile ?? null,
    reviewCadenceDays: policy.reviewCadenceDays ?? DEFAULT_REVIEW_CADENCE_DAYS,
    ...computeReviewStatus(policy),
  };
}

/** Everything that currently needs a reviewer's attention: never-reviewed,
 * sent back for revision, overdue for re-review, or whose source file
 * changed on disk since it was last approved. */
export function listReviewQueue() {
  const rank = { pending_review: 0, needs_revision: 1, approved: 2 };
  return allPolicyIds()
    .map(readPolicyRaw)
    .filter(Boolean)
    .map(summarize)
    .filter((s) => s.needsAttention)
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
}

/** Every ingested policy with its current review status — used by the
 * Ingest screen's "Policies Currently Ingested" list so a just-ingested,
 * still-pending policy doesn't just disappear from view. */
export function listAllWithStatus() {
  return allPolicyIds().map(readPolicyRaw).filter(Boolean).map(summarize);
}

/** Full policy detail (source text, per-group source excerpts, full review
 * history) plus computed status fields — the data behind the logic-tree
 * review screen. */
export function getPolicyWithReviewStatus(policyId) {
  const policy = readPolicyRaw(policyId);
  if (!policy) return null;
  const { status, ...rest } = computeReviewStatus(policy);
  return {
    ...policy,
    status,
    reviewCadenceDays: policy.reviewCadenceDays ?? DEFAULT_REVIEW_CADENCE_DAYS,
    reviewHistory: policy.reviewHistory ?? [],
    ...rest,
  };
}

export function approvePolicy(policyId, { reviewerName, comment, reviewCadenceDays }) {
  const policy = readPolicyRaw(policyId);
  if (!policy) throw new Error(`Policy ${policyId} not found`);
  if (!reviewerName?.trim()) throw new Error("reviewerName is required");

  const cadence =
    Number.isFinite(reviewCadenceDays) && reviewCadenceDays > 0
      ? Math.round(reviewCadenceDays)
      : policy.reviewCadenceDays ?? DEFAULT_REVIEW_CADENCE_DAYS;
  const timestamp = new Date().toISOString();

  policy.status = "approved";
  policy.reviewCadenceDays = cadence;
  policy.lastApprovedSourceMtime = currentSourceMtime(policy.sourceFile) ?? policy.lastApprovedSourceMtime ?? null;
  policy.reviewHistory = [
    ...(policy.reviewHistory ?? []),
    { action: "approved", reviewerName: reviewerName.trim(), comment: comment?.trim() || null, timestamp, reviewCadenceDays: cadence },
  ];

  writePolicyRaw(policyId, policy);
  return getPolicyWithReviewStatus(policyId);
}

export function rejectPolicy(policyId, { reviewerName, comment }) {
  const policy = readPolicyRaw(policyId);
  if (!policy) throw new Error(`Policy ${policyId} not found`);
  if (!reviewerName?.trim()) throw new Error("reviewerName is required");
  if (!comment?.trim()) throw new Error("comment is required when rejecting a policy");

  const timestamp = new Date().toISOString();
  policy.status = "needs_revision";
  policy.reviewHistory = [
    ...(policy.reviewHistory ?? []),
    { action: "rejected", reviewerName: reviewerName.trim(), comment: comment.trim(), timestamp },
  ];

  writePolicyRaw(policyId, policy);
  return getPolicyWithReviewStatus(policyId);
}

/** Flatten reviewHistory across every policy into one event list — the data
 * behind the Audit Log screen. One row per historical approve/reject
 * action, not per policy, so a policy's full review lifecycle is visible. */
export function getAuditLog({ policyId, reviewerName, action } = {}) {
  const rows = [];
  for (const id of allPolicyIds()) {
    const policy = readPolicyRaw(id);
    if (!policy) continue;
    const history = policy.reviewHistory ?? [];
    const status = policy.status ?? "approved";
    history.forEach((entry, idx) => {
      const isCurrent = idx === history.length - 1;
      let nextReviewDue = null;
      let isOverdue = false;
      if (entry.action === "approved") {
        const cadence = entry.reviewCadenceDays ?? policy.reviewCadenceDays ?? DEFAULT_REVIEW_CADENCE_DAYS;
        nextReviewDue = new Date(new Date(entry.timestamp).getTime() + cadence * 86400000).toISOString();
        isOverdue = isCurrent && status === "approved" && Date.now() > new Date(nextReviewDue).getTime();
      }
      rows.push({
        policyId: policy.policyId,
        policyTitle: policy.policyTitle,
        payer: policy.payer,
        action: entry.action,
        reviewerName: entry.reviewerName,
        comment: entry.comment ?? null,
        timestamp: entry.timestamp,
        reviewCadenceDays: entry.reviewCadenceDays ?? null,
        nextReviewDue,
        isCurrent,
        isOverdue,
      });
    });
  }

  const filtered = rows.filter(
    (r) =>
      (!policyId || r.policyId === policyId) &&
      (!reviewerName || r.reviewerName.toLowerCase().includes(String(reviewerName).toLowerCase())) &&
      (!action || r.action === action)
  );
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return filtered;
}
