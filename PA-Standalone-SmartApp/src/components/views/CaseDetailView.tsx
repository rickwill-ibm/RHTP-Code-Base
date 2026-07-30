"use client";

import { usePaStore } from "@/lib/pa/usePaStore";
import type { PaCase } from "@/lib/pa/pa-types";

const SUBTABS = [
  { key: "checklist", label: "Checklist" },
  { key: "dtr", label: "DTR Snapshot" },
  { key: "submission", label: "Submission" },
  { key: "evidence", label: "Evidence Record" },
  { key: "timeline", label: "Adjudication Timeline" },
];

const TIMELINE_DOT: Record<string, string> = {
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  green: "bg-green-600",
  teal: "bg-teal-600",
  red: "bg-red-500",
  gray: "bg-gray-400",
};

export default function CaseDetailView() {
  const { cases, activeCaseId, activeCaseTab, setActiveCaseTab, setView } = usePaStore();
  const c = cases.find((x) => x.authId === activeCaseId) ?? cases[0];

  if (!c) return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
      No case selected. <button className="text-[#1669c1] font-semibold ml-1" onClick={() => setView("portal")}>Go to PA Portal</button>
    </div>
  );

  return (
    <div>
      <div className="mb-5">
        <button onClick={() => setView("portal")} className="text-sm font-semibold text-[#1669c1] hover:underline mb-2 block">← Back to PA Portal</button>
        <h1 className="text-2xl font-bold text-gray-900">Case Detail</h1>
      </div>

      {/* Summary bar */}
      <CaseSummaryBar c={c} />

      {/* Sub-tabs */}
      <div className="flex gap-0 overflow-x-auto border border-b-0 border-gray-200 rounded-t-xl bg-white px-2">
        {SUBTABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveCaseTab(t.key)}
            className={`border-b-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${activeCaseTab === t.key ? "border-[#1669c1] text-[#1669c1]" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="border border-gray-200 rounded-b-xl bg-white p-5 shadow-sm">
        {activeCaseTab === "checklist" && <ChecklistPanel c={c} />}
        {activeCaseTab === "dtr" && <DtrPanel c={c} />}
        {activeCaseTab === "submission" && <SubmissionPanel c={c} />}
        {activeCaseTab === "evidence" && <EvidencePanel c={c} />}
        {activeCaseTab === "timeline" && <TimelinePanel c={c} />}
      </div>
    </div>
  );
}

function CaseSummaryBar({ c }: { c: PaCase }) {
  const STATUS_STYLE: Record<string, string> = {
    Approved: "bg-green-50 text-green-700 border-green-200",
    Pended: "bg-amber-50 text-amber-700 border-amber-200",
    "Partially Approved / Modified": "bg-teal-50 text-teal-700 border-teal-200",
    Denied: "bg-red-50 text-red-700 border-red-200",
    Submitted: "bg-blue-50 text-blue-700 border-blue-200",
    Pending: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div>
        <p className="font-bold text-lg text-gray-900">{c.authId} · {c.patient}</p>
        <p className="text-xs text-gray-400 mt-0.5">{c.service} (CPT {c.cpt}) · Requested {c.dateRequested}</p>
      </div>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLE[c.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />{c.status}
      </span>
    </div>
  );
}

function ChecklistPanel({ c }: { c: PaCase }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Part I · CRD Checklist (read-only)</p>
      <div className="divide-y divide-gray-100">
        {c.checklist.map((item) => (
          <div key={item.label} className="flex items-start gap-3 py-3">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-green-200 bg-green-50">
              <svg className="h-3 w-3 text-green-600" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DtrPanel({ c }: { c: PaCase }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Part II · DTR Snapshot (read-only)</p>
      <div className="divide-y divide-gray-100">
        {c.dtr.map((g) => (
          <div key={g.title} className="flex items-start gap-3 py-3">
            <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${g.status === "met" ? "bg-green-50 border-green-200 text-green-600" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
              {g.status === "met"
                ? <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : "!"}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-gray-900">{g.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${g.status === "met" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  {g.status === "met" ? "Met" : "GAP"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5"><strong>Evidence:</strong> {g.evidence}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionPanel({ c }: { c: PaCase }) {
  const rows = [
    ["Payload Type", c.submission.payloadType],
    ["Submitted", c.submission.timestamp],
    ["Payer Endpoint", c.submission.payerEndpoint],
    ["Channel", c.channel],
  ];
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Submission Details</p>
      <dl className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-3 text-sm">
        {rows.map(([k, v]) => (
          <><dt key={`dt-${k}`} className="text-gray-400 font-semibold">{k}</dt><dd key={`dd-${k}`} className="font-semibold text-gray-800 break-all">{v}</dd></>
        ))}
      </dl>
    </div>
  );
}

function EvidencePanel({ c }: { c: PaCase }) {
  return (
    <div className="flex gap-5 items-start flex-wrap">
      <div className="text-4xl">📄</div>
      <div className="flex-1 min-w-[220px]">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">Immutable Snapshot</span>
        <p className="text-sm text-gray-500 mb-4 max-w-lg">
          A point-in-time PDF snapshot of the submitted PAS Bundle and the medical necessity match criteria at the moment of submission.
          This record does not change even if payer policy is later updated.
        </p>
        <button
          onClick={() => alert(`Evidence_Record_${c.authId}.pdf — simulated download (immutable snapshot)`)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#1669c1] hover:text-[#1669c1] transition-colors"
        >
          Download Evidence PDF
        </button>
      </div>
    </div>
  );
}

function TimelinePanel({ c }: { c: PaCase }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-5">Adjudication Timeline</p>
      <ol className="relative ml-3 border-l-2 border-gray-200 space-y-7">
        {c.timeline.map((t, i) => (
          <li key={i} className="relative pl-7">
            <span className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full border-2 border-white ${TIMELINE_DOT[t.color] ?? "bg-gray-400"}`} />
            <p className="text-sm font-bold text-gray-900">{t.status}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.ts}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
