"use client";

import { usePaStore } from "@/lib/pa/usePaStore";

const WORKLIST_ITEMS = [
  { id: "WL-001", patient: "Dorothy Haynes", service: "Cardiac Stress Test (CPT 93015)", age: "4 days", priority: "High", assignee: null },
  { id: "WL-002", patient: "Samuel Park", service: "Spinal Fusion (CPT 22612)", age: "2 days", priority: "High", assignee: "Dr. Smith" },
  { id: "WL-003", patient: "Loretta Vega", service: "CT Abdomen/Pelvis (CPT 74178)", age: "1 day", priority: "Normal", assignee: null },
  { id: "WL-004", patient: "Claude Jennings", service: "Home Health Services (CPT 99601)", age: "6 hours", priority: "Normal", assignee: null },
];

const PRIORITY_STYLE: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Normal: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function WorklistView() {
  const { setView } = usePaStore();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Back-Office Worklist</h1>
        <p className="text-sm text-gray-500 mt-1">
          Orders that could not be fully automated at point-of-care — requiring staff-driven resolution.
        </p>
      </div>

      {/* Filters row */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {WORKLIST_ITEMS.filter((i) => i.priority === "High").length} High Priority
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
          {WORKLIST_ITEMS.length} Total Items
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
          {WORKLIST_ITEMS.filter((i) => !i.assignee).length} Unassigned
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Case ID", "Patient", "Service", "Age", "Priority", "Assignee", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1669c1]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {WORKLIST_ITEMS.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-[#1669c1]">{item.id}</td>
                <td className="px-4 py-3 text-gray-700">{item.patient}</td>
                <td className="px-4 py-3 text-gray-700">{item.service}</td>
                <td className="px-4 py-3 text-gray-500">{item.age}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${PRIORITY_STYLE[item.priority]}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {item.assignee ?? <span className="italic text-gray-300">Unassigned</span>}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setView("order")}
                    className="text-xs font-semibold text-[#1669c1] hover:underline"
                  >
                    Work →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Items age out after 6 months per data retention policy (CMS-0057-F compliance).
        Staff overrides are Provenance-tagged in the audit trail.
      </p>
    </div>
  );
}
