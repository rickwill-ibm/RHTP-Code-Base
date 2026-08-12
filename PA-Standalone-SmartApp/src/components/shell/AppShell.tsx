"use client";

import { usePaStore, type AppView } from "@/lib/pa/usePaStore";
import { useSmartContext } from "@/lib/smart/SmartContext";
import OrderView from "@/components/views/OrderView";
import CrdChecklistView from "@/components/views/CrdChecklistView";
import DtrTreeView from "@/components/views/DtrTreeView";
import ReviewSubmitView from "@/components/views/ReviewSubmitView";
import PaPortalView from "@/components/views/PaPortalView";
import CaseDetailView from "@/components/views/CaseDetailView";
import WorklistView from "@/components/views/WorklistView";
import PolicyIngestView from "@/components/views/PolicyIngestView";
import PolicyReviewView from "@/components/views/PolicyReviewView";
import AuditLogView from "@/components/views/AuditLogView";
import PatientRecordDrawer from "@/components/shared/PatientRecordDrawer";

const NAV_STEPS: { view: AppView; label: string; step: number }[] = [
  { view: "order", label: "Order & CRD Trigger", step: 1 },
  { view: "checklist", label: "CRD Checklist", step: 2 },
  { view: "dtr", label: "DTR Match", step: 3 },
  { view: "review", label: "Review & Submit", step: 4 },
  { view: "portal", label: "PA Portal", step: 5 },
  { view: "case", label: "Case Detail", step: 6 },
  { view: "worklist", label: "Worklist", step: 7 },
  { view: "policies", label: "Ingest Policy", step: 8 },
  { view: "policyReview", label: "Review Policy Logic", step: 9 },
  { view: "auditLog", label: "Audit Log", step: 10 },
];

const VIEW_COMPONENT: Record<AppView, React.ComponentType> = {
  order: OrderView,
  checklist: CrdChecklistView,
  dtr: DtrTreeView,
  review: ReviewSubmitView,
  portal: PaPortalView,
  case: CaseDetailView,
  worklist: WorklistView,
  policies: PolicyIngestView,
  policyReview: PolicyReviewView,
  auditLog: AuditLogView,
};

export default function AppShell() {
  const { context } = useSmartContext();
  const { view, setView } = usePaStore();
  const Active = VIEW_COMPONENT[view];

  // Derive provider display name from SMART context if available
  const providerName = (context?.idTokenClaims?.["name"] as string) ?? "Dr. Jacob P. Aagaard MD";
  const initials = providerName.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App header */}
      <header className="bg-gradient-to-b from-[#5d7a94] to-[#4a6580] text-white px-8 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-[22px] tracking-tight">Provider Portal</span>
          <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
            CRD · DTR · PAS — SMART on FHIR Prior Authorization
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-[#dfe7ee] text-[#4a6580] text-xs font-bold">
            {initials}
          </div>
          <span className="text-sm font-semibold">{providerName}</span>
        </div>
      </header>

      {/* Nav strip */}
      <nav className="flex overflow-x-auto border-b border-gray-200 bg-white px-6 gap-1">
        {NAV_STEPS.map((s) => (
          <button
            key={s.view}
            onClick={() => setView(s.view)}
            className={`flex items-center gap-2 border-b-[3px] px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${view === s.view ? "border-[#1669c1] text-[#1669c1]" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold ${view === s.view ? "bg-[#1669c1] text-white" : "bg-gray-100 text-gray-400"}`}>
              {s.step}
            </span>
            {s.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-[1180px] px-6 py-8 pb-20">
        <Active />
      </main>

      {/* Mounted once at the shell level, not per-view, so opening it never
          disturbs `view`/navigation state or re-triggers a CRD/DTR fetch. */}
      <PatientRecordDrawer />
    </div>
  );
}
