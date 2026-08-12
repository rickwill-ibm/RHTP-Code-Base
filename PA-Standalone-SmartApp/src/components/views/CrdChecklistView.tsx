"use client";

import { usePaStore, type AppView } from "@/lib/pa/usePaStore";
import { useSmartContext } from "@/lib/smart/SmartContext";
import { runDtrMatch } from "@/lib/dtr/dtrService";
import type { CrdCheckResult, CrdResultEntry, DtrResultEntry, PaOrder } from "@/lib/pa/pa-types";
import { toast } from "sonner";

const SOURCE_BADGE: Record<string, string> = {
  emr: "bg-blue-50 text-blue-700 border-blue-200",
  pa: "bg-purple-50 text-purple-700 border-purple-200",
  guideline: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function CrdChecklistView() {
  const { context } = useSmartContext();
  const { crdLoading, crdResults, crdError, order, patient, setView, setDtrLoading, setDtrResults, setDtrError } = usePaStore();

  async function handleProceedToDtr() {
    if (!order || !crdResults || !context) return;
    setDtrLoading(true);
    setView("dtr");
    try {
      // Full DTR means every procedure on the order gets matched against its
      // own policy — not just the first one.
      const results: DtrResultEntry[] = await Promise.all(
        order.procedures.map((proc) => runDtrMatch(context, proc.cpt, proc.cptDesc))
      );
      setDtrResults(results);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "DTR match failed";
      setDtrError(msg);
      toast.error(msg);
    } finally {
      setDtrLoading(false);
    }
  }

  if (crdLoading) {
    return (
      <div>
        <PageHead patient={patient} order={order} />
        <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm flex flex-col items-center gap-4 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
          <p className="text-sm font-semibold">Running CRD checks against payer coverage rules…</p>
          <p className="text-xs">Verifying enrollment, eligibility, network status &amp; guideline conflicts for every procedure</p>
        </div>
      </div>
    );
  }

  if (crdError) {
    return (
      <div>
        <PageHead patient={patient} order={order} />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <strong>CRD Error:</strong> {crdError}
        </div>
      </div>
    );
  }

  if (!crdResults || crdResults.length === 0) {
    return (
      <EmptyBlock
        title="CRD Checklist"
        msg="No CRD results yet. Go to Step 1 and submit an order — jumping to this tab directly skips the fetch."
        setView={setView}
      />
    );
  }

  const allPass = crdResults.every((entry) => checksFor(entry.result).every((c) => c.pass));
  const paRequiredAny = crdResults.some((entry) => entry.result.paRequired.required);
  const clearedCount = crdResults.filter((entry) => checksFor(entry.result).every((c) => c.pass)).length;

  return (
    <div>
      <PageHead patient={patient} order={order} />

      {crdResults.length > 1 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-3 shadow-sm">
          <span className="text-sm font-bold text-gray-700">{clearedCount} of {crdResults.length} procedures fully cleared</span>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-[#1e8e5a] transition-all" style={{ width: `${(clearedCount / crdResults.length) * 100}%` }} />
          </div>
        </div>
      )}

      {crdResults.map((entry) => (
        <ProcedureChecklist key={entry.cpt} entry={entry} />
      ))}

      {allPass && paRequiredAny && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-gray-500 max-w-lg">
            All coverage requirements are satisfied for every procedure and prior authorization is required.
            Continue to Documentation Templates and Rules (DTR) to match medical necessity criteria.
          </p>
          <button onClick={handleProceedToDtr} className="inline-flex items-center gap-2 rounded-lg bg-[#1669c1] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f52a0] transition-colors whitespace-nowrap">
            Proceed to DTR →
          </button>
        </div>
      )}
    </div>
  );
}

function checksFor(result: CrdCheckResult) {
  return [result.patientEnrolled, result.patientEligible, result.providerInNetwork, result.noConflictingGuideline, result.paRequired];
}

function ProcedureChecklist({ entry }: { entry: CrdResultEntry }) {
  const checks = checksFor(entry.result);
  const allPass = checks.every((c) => c.pass);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          CPT {entry.cpt} — {entry.cptDesc}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${allPass ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {checks.filter((c) => c.pass).length} of {checks.length} checks passed
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {checks.map((item) => (
          <div key={item.label} className="flex gap-4 items-start px-5 py-4">
            <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] ${item.pass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              {item.pass
                ? <svg className="h-3.5 w-3.5 text-green-600" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              }
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900">{item.label}</span>
                {item.source && (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SOURCE_BADGE[item.source] ?? ""}`}>
                    {item.source === "pa" ? "Patient Access" : item.source === "emr" ? "EMR" : "Guideline"}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5 font-semibold">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyBlock({ title, msg, setView }: { title: string; msg: string; setView: (v: AppView) => void }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">{title}</h1>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        <p className="mb-4">{msg}</p>
        <button
          onClick={() => setView("order")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1669c1] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f52a0] transition-colors"
        >
          ← Back to Order & CRD Trigger
        </button>
      </div>
    </div>
  );
}

function PageHead({ patient, order }: { patient: { name: string } | null; order: PaOrder | null }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold text-gray-900">CRD Checklist</h1>
      {patient && order && (
        <p className="text-sm text-gray-500 mt-1">
          Coverage Requirements Discovery results for <strong>{patient.name}</strong> —{" "}
          {order.procedures.length} procedure{order.procedures.length > 1 ? "s" : ""}: {order.procedures.map((p) => `CPT ${p.cpt}`).join(", ")}
        </p>
      )}
    </div>
  );
}
