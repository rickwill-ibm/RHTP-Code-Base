"use client";

import { useRef } from "react";
import { usePaStore } from "@/lib/pa/usePaStore";
import type { DtrGroup } from "@/lib/pa/pa-types";

export default function DtrTreeView() {
  const { dtrLoading, dtrResult, dtrError, resolveDtrGap, setView } = usePaStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingGroupId = useRef<number | null>(null);

  function handleUploadClick(groupId: number) {
    pendingGroupId.current = groupId;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || pendingGroupId.current == null) return;
    resolveDtrGap(
      pendingGroupId.current,
      `Uploaded: ${file.name} — pending clinical confirmation`
    );
    e.target.value = "";
    pendingGroupId.current = null;
  }

  if (dtrLoading) {
    return (
      <LoadingBlock
        title="DTR — Medical Necessity Match"
        msg="Fetching Questionnaire Package and matching criteria…"
      />
    );
  }

  if (dtrError) {
    return <ErrorBlock title="DTR — Medical Necessity Match" error={dtrError} />;
  }

  if (!dtrResult) return null;

  const metCount = dtrResult.groups.filter((g) => g.status === "met").length;
  const pct = Math.round((metCount / dtrResult.groups.length) * 100);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">DTR — Medical Necessity Match</h1>
        <p className="text-sm text-gray-500 mt-1">
          Documentation Templates and Rules · evidence merged from EMR and Payer Patient Access API
        </p>
      </div>

      {/* Root policy node */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-blue-50/40 px-5 py-4">
        <div>
          <p className="font-bold text-gray-900">{dtrResult.policyTitle}</p>
          <p className="text-xs text-gray-400 mt-0.5">Root policy node · requirement groups must each resolve to Met</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2">
          <span className="text-sm font-bold text-gray-700">{metCount} of {dtrResult.groups.length} requirement groups met</span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-[#1e8e5a] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Requirement group tree */}
      <div className="space-y-3 mb-5">
        {dtrResult.groups.map((group) => (
          <GroupCard key={group.id} group={group} onUpload={handleUploadClick} />
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500 max-w-lg">
          {dtrResult.allMet
            ? "All requirement groups are met. Ready to build the prior authorization submission."
            : "Resolve the remaining gap by uploading supporting documentation to continue."}
        </p>
        <button
          onClick={() => setView("review")}
          disabled={!dtrResult.allMet}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1669c1] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f52a0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Continue to Submit →
        </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
    </div>
  );
}

function GroupCard({ group, onUpload }: { group: DtrGroup; onUpload: (id: number) => void }) {
  const isMet = group.status === "met";

  return (
    <div className={`rounded-xl border overflow-hidden ${isMet ? "border-gray-200" : "border-amber-200"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 ${isMet ? "bg-white" : "bg-amber-50/60"}`}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Group {group.id}</span>
          <span className="text-sm font-bold text-gray-900">{group.title}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${isMet ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isMet ? "Met" : "GAP"}
        </span>
      </div>

      {/* Body */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
        {isMet && group.leaf && (
          <div>
            <span className="inline-block rounded-md border border-gray-200 bg-white px-2 py-0.5 font-mono text-xs font-bold text-gray-800">
              {group.leaf.code}
            </span>
            <p className="text-sm text-gray-700 mt-1.5">{group.leaf.label}</p>
            <p className="text-xs text-gray-400 mt-1">
              <strong className="text-gray-600">Evidence:</strong> {group.uploadedEvidence ?? group.leaf.evidence}
              {group.leaf.source && (
                <span className="ml-2 inline-block rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                  {group.leaf.source === "pa" ? "Patient Access" : group.leaf.source === "emr" ? "EMR" : "Uploaded"}
                </span>
              )}
            </p>
          </div>
        )}

        {isMet && group.uploadedEvidence && !group.leaf && (
          <p className="text-sm font-semibold text-green-700">{group.uploadedEvidence}</p>
        )}

        {!isMet && group.candidateCodes && (
          <div>
            <p className="text-xs text-gray-500 mb-3">Acceptable diagnosis codes (any one required):</p>
            <ul className="space-y-1.5 mb-4">
              {group.candidateCodes.map((c) => (
                <li key={c.code} className="flex items-center gap-2.5 text-sm text-gray-500">
                  <span className="h-2 w-2 rounded-full border-[1.5px] border-red-300 flex-shrink-0" />
                  <code className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-xs text-gray-800">{c.code}</code>
                  {c.label}
                </li>
              ))}
            </ul>
            <p className="text-xs italic text-gray-400 mb-3">No matching diagnosis found in EMR or Patient Access data.</p>
            <button
              onClick={() => onUpload(group.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#1669c1] px-4 py-2 text-xs font-bold text-[#1669c1] hover:bg-blue-50 transition-colors"
            >
              Upload Supporting Documentation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingBlock({ title, msg }: { title: string; msg: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">{title}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm flex flex-col items-center gap-4 text-gray-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
        <p className="text-sm font-semibold">{msg}</p>
      </div>
    </div>
  );
}

function ErrorBlock({ title, error }: { title: string; error: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">{title}</h1>
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <strong>Error:</strong> {error}
      </div>
    </div>
  );
}
