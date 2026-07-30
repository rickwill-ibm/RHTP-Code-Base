"use client";

import { usePaStore } from "@/lib/pa/usePaStore";
import { useSmartContext } from "@/lib/smart/SmartContext";
import { runCrdChecks } from "@/lib/crd/crdService";
import { toast } from "sonner";

/** Mock order seeded from the design spec. Real EHR passes order via SMART context. */
const DEMO_ORDER = {
  procedure: "Bariatric Surgery",
  cpt: "43644",
  cptDesc: "Laparoscopy, surgical, gastric restrictive procedure with gastric bypass and Roux-en-Y gastroenterostomy",
  orderingProvider: "Dr. Jacob P. Aagaard MD",
  facility: "Metro General Surgical Associates",
  orderDate: new Date().toLocaleDateString("en-US"),
};
const DEMO_PATIENT = { name: "Rachel Green", dob: "12/19/1957", memberId: "1234567" };

export default function OrderView() {
  const { context } = useSmartContext();
  const { setView, setOrder, setPatient, setCrdLoading, setCrdResult, setCrdError } = usePaStore();

  async function handleCrdCheck() {
    setOrder(DEMO_ORDER);
    setPatient(DEMO_PATIENT);
    setCrdLoading(true);
    setView("checklist");

    try {
      const result = await runCrdChecks(context!, DEMO_ORDER.cpt);
      setCrdResult(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "CRD check failed";
      setCrdError(msg);
      toast.error(msg);
    } finally {
      setCrdLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Order captured via EMR CDS Hooks — check Coverage Requirements Discovery (CRD) before scheduling.
        </p>
      </div>

      {/* Patient banner */}
      <div className="mb-5 flex flex-wrap items-center gap-7 rounded-lg border border-gray-200 border-l-[5px] border-l-[#5d7a94] bg-gradient-to-b from-gray-50 to-blue-50/40 px-5 py-4">
        <div className="font-bold text-lg text-gray-900">{DEMO_PATIENT.name}</div>
        <div className="text-sm text-gray-500"><span className="font-semibold text-gray-700">DOB:</span> {DEMO_PATIENT.dob}</div>
        <div className="text-sm text-gray-500"><span className="font-semibold text-gray-700">Member ID:</span> {DEMO_PATIENT.memberId}</div>
      </div>

      {/* Order details card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Order Details</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          {[
            { label: "Procedure", value: DEMO_ORDER.procedure },
            { label: "CPT Code", value: DEMO_ORDER.cpt, sub: DEMO_ORDER.cptDesc },
            { label: "Ordering Provider", value: DEMO_ORDER.orderingProvider },
            { label: "Facility", value: DEMO_ORDER.facility },
            { label: "Order Date", value: DEMO_ORDER.orderDate },
            { label: "Source", value: "EMR CDS Hooks order-sign workflow" },
          ].map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{f.label}</dt>
              <dd className="text-sm font-semibold text-gray-900">{f.value}</dd>
              {f.sub && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{f.sub}</p>}
            </div>
          ))}
        </dl>
      </div>

      {/* CTA card */}
      <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm text-center">
        <p className="text-sm text-gray-500 mb-5 max-w-lg mx-auto">
          Before this order is signed, run a real-time Coverage Requirements Discovery (CRD) check against the payer
          to confirm eligibility, network status, and prior authorization requirements.
        </p>
        <button
          onClick={handleCrdCheck}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1669c1] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#0f52a0] transition-colors"
        >
          Check Prior Auth Requirements (CRD)
        </button>
      </div>
    </div>
  );
}
