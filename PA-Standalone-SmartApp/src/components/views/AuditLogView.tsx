"use client";

/**
 * Audit Log — permanent, read-only record of every policy review decision:
 * who approved or rejected what, and when. Distinct from the Review Queue
 * (which only shows what currently needs attention) — this is the full
 * historical trail, flattened from every policy's reviewHistory by
 * GET /audit-log (services/policy-engine/src/policy-review.mjs). Nothing on
 * this screen is editable; approve/reject actions happen from Review Policy
 * Logic only.
 */

import { useEffect, useMemo, useState } from "react";
import { fetchAuditLog, type AuditLogEntry } from "@/lib/dtr/policyReview";

type SortKey = "timestamp" | "policyTitle" | "reviewerName" | "action";

export default function AuditLogView() {
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [policyFilter, setPolicyFilter] = useState("all");
  const [reviewerFilter, setReviewerFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState<"all" | "approved" | "rejected">("all");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setEntries(await fetchAuditLog());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach Policy Engine");
    } finally {
      setLoading(false);
    }
  }

  const policies = useMemo(() => Array.from(new Set((entries ?? []).map((e) => e.policyId))).sort(), [entries]);
  const reviewers = useMemo(() => Array.from(new Set((entries ?? []).map((e) => e.reviewerName))).sort(), [entries]);

  const filtered = useMemo(() => {
    let rows = entries ?? [];
    if (policyFilter !== "all") rows = rows.filter((r) => r.policyId === policyFilter);
    if (reviewerFilter !== "all") rows = rows.filter((r) => r.reviewerName === reviewerFilter);
    if (actionFilter !== "all") rows = rows.filter((r) => r.action === actionFilter);
    const sorted = [...rows].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      const cmp = av.localeCompare(bv);
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [entries, policyFilter, reviewerFilter, actionFilter, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function exportCsv() {
    const header = ["Policy #", "Policy Name", "Payer", "Action", "Reviewer", "Review Date", "Next Review Due", "Overdue", "Comment"];
    const rows = filtered.map((r) => [
      r.policyId,
      r.policyTitle,
      r.payer ?? "",
      r.action,
      r.reviewerName,
      new Date(r.timestamp).toISOString(),
      r.nextReviewDue ? new Date(r.nextReviewDue).toISOString() : "",
      r.isOverdue ? "yes" : "no",
      (r.comment ?? "").replace(/\n/g, " "),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policy-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Permanent, read-only record of every policy review decision — who approved or rejected what,
            and when. Derived directly from each policy&apos;s review history; nothing here is editable.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className="text-xs font-semibold text-[#1669c1] hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <button onClick={() => void load()} className="text-xs font-semibold text-[#1669c1] hover:underline">
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        <FilterSelect label="Policy" value={policyFilter} onChange={setPolicyFilter} options={["all", ...policies]} />
        <FilterSelect label="Reviewer" value={reviewerFilter} onChange={setReviewerFilter} options={["all", ...reviewers]} />
        <FilterSelect
          label="Action"
          value={actionFilter}
          onChange={(v) => setActionFilter(v as typeof actionFilter)}
          options={["all", "approved", "rejected"]}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-5 py-6 text-sm text-gray-400">Loading…</div>
        ) : error ? (
          <div className="px-5 py-4 text-sm text-red-600">
            <strong>Couldn&apos;t reach Policy Engine:</strong> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No review events match these filters yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <Th label="Policy #" onClick={() => toggleSort("policyTitle")} />
                  <th className="px-4 py-3">Policy Name</th>
                  <th className="px-4 py-3">Payer</th>
                  <Th label="Action" onClick={() => toggleSort("action")} />
                  <Th label="Reviewer" onClick={() => toggleSort("reviewerName")} />
                  <Th label="Review Date" onClick={() => toggleSort("timestamp")} />
                  <th className="px-4 py-3">Next Review Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r, i) => (
                  <tr key={`${r.policyId}-${r.timestamp}-${i}`} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{r.policyId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.policyTitle}</td>
                    <td className="px-4 py-3 text-gray-500">{r.payer ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${r.action === "approved" ? "text-green-700" : "text-amber-700"}`}>
                        {r.action === "approved" ? "Approved" : "Rejected"}
                      </span>
                      {r.comment && <p className="text-xs text-gray-400 mt-0.5 max-w-xs">{r.comment}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.reviewerName}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.nextReviewDue ? (
                        <span className={r.isOverdue ? "font-bold text-red-600" : "text-gray-500"}>
                          {new Date(r.nextReviewDue).toLocaleDateString("en-US", { dateStyle: "medium" })}
                          {r.isOverdue ? " · OVERDUE" : r.isCurrent ? " · current" : ""}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-600 whitespace-nowrap" onClick={onClick}>
      {label}
    </th>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-xs">
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? "All" : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function csvCell(value: string) {
  const needsQuote = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}
