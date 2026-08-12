"use client";

/**
 * Review Policy Logic — the human-in-the-loop gate between what the
 * Intelligent Policy Engine's LLM extraction produced and what DTR is
 * allowed to use for a real coverage decision.
 *
 * A freshly-ingested policy is invisible to DTR (services/policy-engine
 * filters GET /policies to status:"approved" only) until a clinical
 * reviewer traces its extracted logic against the source document here and
 * approves it. Approved policies also resurface here automatically once
 * they're overdue for re-review or their source document changes on disk —
 * see services/policy-engine/src/policy-review.mjs for the full mechanism.
 *
 * This screen has two modes, both in this file: a queue landing list
 * (PolicyReviewQueueList) and a per-policy logic-tree detail view
 * (PolicyReviewDetailPanel), toggled by local state — mirroring the shape
 * DtrTreeView.tsx uses for the patient-facing version of this same tree.
 */

import { useEffect, useState } from "react";
import {
  fetchReviewQueue,
  fetchPolicyReviewDetail,
  approvePolicy,
  rejectPolicy,
  type PolicyQueueEntry,
  type PolicyReviewDetail,
  type CriteriaGroupDetail,
} from "@/lib/dtr/policyReview";
import { useSmartContext } from "@/lib/smart/SmartContext";
import { usePaStore } from "@/lib/pa/usePaStore";
import PolicyRuleSummary from "@/components/shared/PolicyRuleSummary";
import { toast } from "sonner";

export default function PolicyReviewView() {
  const { reviewFocusPolicyId, setReviewFocusPolicyId } = usePaStore();
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(reviewFocusPolicyId);

  // Consume the one-shot deep-link from the Ingest screen, then clear it so
  // navigating back to the queue and returning later doesn't re-trigger it.
  useEffect(() => {
    if (reviewFocusPolicyId) {
      setSelectedPolicyId(reviewFocusPolicyId);
      setReviewFocusPolicyId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return selectedPolicyId ? (
    <PolicyReviewDetailPanel policyId={selectedPolicyId} onBack={() => setSelectedPolicyId(null)} />
  ) : (
    <PolicyReviewQueueList onSelect={setSelectedPolicyId} />
  );
}

// ── Queue landing list ───────────────────────────────────────────────────

function PolicyReviewQueueList({ onSelect }: { onSelect: (policyId: string) => void }) {
  const [queue, setQueue] = useState<PolicyQueueEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { queue } = await fetchReviewQueue();
      setQueue(queue);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach Policy Engine");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Policy Logic</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Every policy the Intelligent Policy Engine extracts lands here first, invisible to DTR, until
            a clinical reviewer traces its logic against the source document and approves it. Approved
            policies resurface here automatically once they&apos;re due for re-review or their source
            document changes on disk — nothing stays trusted forever without a fresh look.
          </p>
        </div>
        <button onClick={() => void load()} className="text-xs font-semibold text-[#1669c1] hover:underline whitespace-nowrap">
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-5 py-6 text-sm text-gray-400">Loading…</div>
        ) : error ? (
          <div className="px-5 py-4 text-sm text-red-600">
            <strong>Couldn&apos;t reach Policy Engine:</strong> {error}
          </div>
        ) : queue && queue.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {queue.map((p) => (
              <button
                key={p.policyId}
                onClick={() => onSelect(p.policyId)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{p.policyTitle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.policyId} {p.payer ? `· ${p.payer}` : ""} · CPT {p.governedCptCodes.join(", ") || "none"}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <QueueReasonBadge entry={p} />
                  <span className="text-xs font-bold text-[#1669c1] whitespace-nowrap">Review →</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Nothing needs attention right now — every ingested policy is approved and up to date.
          </div>
        )}
      </div>
    </div>
  );
}

function QueueReasonBadge({ entry }: { entry: PolicyQueueEntry }) {
  if (entry.status === "pending_review") return <Badge tone="blue">PENDING REVIEW</Badge>;
  if (entry.status === "needs_revision") return <Badge tone="amber">NEEDS REVISION</Badge>;
  if (entry.sourceChanged) return <Badge tone="red">SOURCE FILE CHANGED</Badge>;
  if (entry.isOverdue) return <Badge tone="amber">OVERDUE FOR REVIEW</Badge>;
  return <Badge tone="gray">{entry.status.replace("_", " ").toUpperCase()}</Badge>;
}

function Badge({ tone, children }: { tone: "blue" | "amber" | "red" | "green" | "gray"; children: React.ReactNode }) {
  const cls = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    green: "border-green-200 bg-green-50 text-green-700",
    gray: "border-gray-200 bg-gray-50 text-gray-600",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}

// ── Per-policy logic-tree detail ────────────────────────────────────────

function PolicyReviewDetailPanel({ policyId, onBack }: { policyId: string; onBack: () => void }) {
  const { context } = useSmartContext();
  const defaultReviewerName = (context?.idTokenClaims?.["name"] as string) ?? "Dr. Jacob P. Aagaard MD";

  const [detail, setDetail] = useState<PolicyReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewerName, setReviewerName] = useState(defaultReviewerName);
  const [comment, setComment] = useState("");
  const [cadenceDays, setCadenceDays] = useState(180);
  const [flaggedGroups, setFlaggedGroups] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSourceText, setShowSourceText] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchPolicyReviewDetail(policyId);
      setDetail(d);
      setCadenceDays(d.reviewCadenceDays);
      setFlaggedGroups(new Set());
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load policy");
    } finally {
      setLoading(false);
    }
  }

  function toggleFlag(groupId: number) {
    setFlaggedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function handleApprove() {
    if (!detail) return;
    if (flaggedGroups.size > 0) {
      toast.error("Groups are flagged for revision — reject with comments instead of approving.");
      return;
    }
    if (!reviewerName.trim()) {
      toast.error("Reviewer name is required.");
      return;
    }
    setSubmitting("approve");
    try {
      await approvePolicy(detail.policyId, reviewerName.trim(), comment.trim() || undefined, cadenceDays);
      toast.success(`${detail.policyTitle} approved — now live for DTR.`);
      onBack();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleReject() {
    if (!detail) return;
    const flagNote =
      flaggedGroups.size > 0 ? `Flagged groups: ${[...flaggedGroups].sort((a, b) => a - b).join(", ")}. ` : "";
    const fullComment = (flagNote + comment.trim()).trim();
    if (!fullComment) {
      toast.error("A comment is required to reject — explain what needs to change.");
      return;
    }
    if (!reviewerName.trim()) {
      toast.error("Reviewer name is required.");
      return;
    }
    setSubmitting("reject");
    try {
      await rejectPolicy(detail.policyId, reviewerName.trim(), fullComment);
      toast.success(`${detail.policyTitle} sent back for revision.`);
      onBack();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div>
        <BackLink onBack={onBack} />
        <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm flex flex-col items-center gap-4 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
          <p className="text-sm font-semibold">Loading policy…</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div>
        <BackLink onBack={onBack} />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <strong>Error:</strong> {error ?? "Policy not found"}
        </div>
      </div>
    );
  }

  const requiredGroups = detail.criteriaGroups.filter((g) => g.required !== false);
  const optionalGroups = detail.criteriaGroups.filter((g) => g.required === false);

  return (
    <div>
      <BackLink onBack={onBack} />

      <div className="mb-5 rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-blue-50/40 px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold text-gray-900 text-lg">{detail.policyTitle}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {detail.payer ?? "Payer unknown"} · CPT {detail.governedCptCodes.join(", ") || "none extracted"}
              {detail.effectiveDate ? ` · Effective ${detail.effectiveDate}` : ""}
              {detail.extractionProvider && (
                <> · Extracted via {detail.extractionProvider === "openai" ? "OpenAI" : "Groq"} ({detail.extractionModel})</>
              )}
            </p>
          </div>
          <StatusHeaderBadge detail={detail} />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Approval requires <strong>all {requiredGroups.length} required</strong> group{requiredGroups.length === 1 ? "" : "s"} below
          {optionalGroups.length > 0 ? ` (${optionalGroups.length} supportive, non-blocking)` : ""}.
        </p>
        {detail.sourceFile && (
          <p className="text-xs text-gray-400 mt-1">
            Source file: {detail.sourceFile}
            {detail.sourceChanged ? " — changed on disk since last approval, re-verify against the updated document" : ""}
          </p>
        )}
        {detail.sourcePolicyText && (
          <button onClick={() => setShowSourceText((v) => !v)} className="text-xs font-semibold text-[#1669c1] hover:underline mt-2">
            {showSourceText ? "Hide full source document text ▲" : "Show full source document text ▼"}
          </button>
        )}
        {showSourceText && detail.sourcePolicyText && (
          <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap">
            {detail.sourcePolicyText}
          </pre>
        )}
      </div>

      <div className="space-y-3 mb-5">
        {detail.criteriaGroups.map((g) => (
          <ReviewGroupCard key={g.id} group={g} flagged={flaggedGroups.has(g.id)} onToggleFlag={() => toggleFlag(g.id)} />
        ))}
      </div>

      {detail.notes && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Notes extracted from policy</p>
          <p className="text-sm text-gray-600">{detail.notes}</p>
        </div>
      )}

      {detail.reviewHistory.length > 0 && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400"
          >
            <span>Review history ({detail.reviewHistory.length})</span>
            <span>{showHistory ? "▲" : "▼"}</span>
          </button>
          {showHistory && (
            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {[...detail.reviewHistory].reverse().map((h, i) => (
                <div key={i} className="px-5 py-3 text-sm">
                  <span className={`font-bold ${h.action === "approved" ? "text-green-700" : "text-amber-700"}`}>
                    {h.action === "approved" ? "Approved" : "Rejected"}
                  </span>
                  <span className="text-gray-500"> by {h.reviewerName} · {formatDateTime(h.timestamp)}</span>
                  {h.comment && <p className="text-xs text-gray-500 mt-1">{h.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Reviewer</label>
            <input
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Review cadence (days)</label>
            <input
              type="number"
              min={1}
              value={cadenceDays}
              onChange={(e) => setCadenceDays(Number(e.target.value) || 180)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">This policy resurfaces here automatically after this many days.</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Comment {flaggedGroups.size === 0 && <span className="normal-case font-normal text-gray-400">(required to reject)</span>}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="What's wrong, or notes for the record…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => void handleReject()}
            disabled={submitting !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {submitting === "reject" ? "Sending back…" : "Reject / Send back"}
          </button>
          <button
            onClick={() => void handleApprove()}
            disabled={submitting !== null || flaggedGroups.size > 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1669c1] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f52a0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting === "approve" ? "Approving…" : "Approve for use in DTR"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewGroupCard({
  group,
  flagged,
  onToggleFlag,
}: {
  group: CriteriaGroupDetail;
  flagged: boolean;
  onToggleFlag: () => void;
}) {
  const required = group.required !== false;
  return (
    <div className={`rounded-xl border overflow-hidden ${flagged ? "border-red-300" : "border-gray-200"}`}>
      <div className={`flex items-center justify-between px-5 py-4 ${flagged ? "bg-red-50/60" : "bg-white"}`}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Group {group.id}</span>
          <span className="text-sm font-bold text-gray-900">{group.title}</span>
        </div>
        <Badge tone={required ? "blue" : "gray"}>{required ? "REQUIRED" : "OPTIONAL"}</Badge>
      </div>
      <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 space-y-2">
        <PolicyRuleSummary description={group.description} fhirQuery={group.fhirQuery} sourceExcerpt={group.sourceExcerpt} />
        {group.candidateCodes && group.candidateCodes.length > 0 && (
          <p className="text-xs text-gray-500">Candidate codes: {group.candidateCodes.map((c) => c.code).join(", ")}</p>
        )}
        {group.documentationRequired && <p className="text-xs text-gray-500">Documentation required: {group.documentationRequired}</p>}
        <label className="flex items-center gap-2 text-xs text-gray-500 pt-1">
          <input type="checkbox" checked={flagged} onChange={onToggleFlag} className="accent-red-600" />
          Flag this group for revision
        </label>
      </div>
    </div>
  );
}

function StatusHeaderBadge({ detail }: { detail: PolicyReviewDetail }) {
  if (detail.status === "pending_review") return <Badge tone="blue">PENDING REVIEW</Badge>;
  if (detail.status === "needs_revision") return <Badge tone="amber">NEEDS REVISION</Badge>;
  if (detail.sourceChanged) return <Badge tone="red">SOURCE FILE CHANGED</Badge>;
  if (detail.isOverdue) return <Badge tone="amber">OVERDUE{detail.nextReviewDue ? ` · WAS DUE ${formatDate(detail.nextReviewDue)}` : ""}</Badge>;
  return <Badge tone="green">APPROVED{detail.nextReviewDue ? ` · DUE ${formatDate(detail.nextReviewDue)}` : ""}</Badge>;
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} className="mb-4 text-xs font-bold text-[#1669c1] hover:underline">
      ← Back to Review Queue
    </button>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
