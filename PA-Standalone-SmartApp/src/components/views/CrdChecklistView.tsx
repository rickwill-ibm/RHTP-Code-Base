"use client";

import { usePaStore } from "@/lib/pa/usePaStore";
import { useSmartContext } from "@/lib/smart/SmartContext";
import { runDtrMatch } from "@/lib/dtr/dtrService";
import { toast } from "sonner";

const SOURCE_BADGE: Record<string, string> = {
  emr: "bg-blue-50 text-blue-700 border-blue-200",
  pa: "bg-purple-50 text-purple-700 border-purple-200",
  guideline: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function CrdChecklistView() {
  const { context } = useSmartContext();
  const { crdLoading, crdResult, crdError, order, patient, setView, setDtrLoading, setDtrResult, setDtrError } = usePaStore();

  async function handleProceedToDtr() {
    if (!order) return;
    setDtrLoading(true);
    setView("dtr");
    try {
      const result = await runDtrMatch(context!, order.cpt, order.procedure);
      setDtrResult(result);
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
          <p className="text-xs">Verifying enrollment, eligibility, network status &amp; guideline conflicts</p>
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

  if (!crdResult) return null;

  const checks = [
    crdResult.patientEnrolled,
    crdResult.patientEligible,
    crdResult.providerInNetwork,
    crdResult.noConflictingGuideline,
    crdResult.paRequired,
  ];
  const allPass = checks.every((c) => c.pass);

  return (
    <div>
      <PageHead patient={patient} order={order} />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Part I · Coverage Determination Results</span>
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

      {allPass && crdResult.paRequired.required && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-gray-500 max-w-lg">
            All coverage requirements are satisfied and prior authorization is required.
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

function PageHead({ patient, order }: { patient: { name: string } | null; order: { procedure: string; cpt: string } | null }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold text-gray-900">CRD Checklist</h1>
      {patient && order && (
        <p className="text-sm text-gray-500 mt-1">
          Coverage Requirements Discovery results for <strong>{patient.name}</strong> — {order.procedure} (CPT {order.cpt})
        </p>
      )}
    </div>
  );
}
