"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { usePaStore } from "@/lib/pa/usePaStore";
import { useSmartContext } from "@/lib/smart/SmartContext";
import { runCrdChecks } from "@/lib/crd/crdService";
import { fetchPatientBanner } from "@/lib/fhir/patientLookup";
import type { CrdResultEntry, OrderProcedure } from "@/lib/pa/pa-types";
import { toast } from "sonner";

interface ProcedureFieldValues {
  procedures: { cpt: string; cptDesc: string; cptSystem: OrderProcedure["cptSystem"] }[];
}

const EMPTY_ROW = { cpt: "", cptDesc: "", cptSystem: "http://www.ama-assn.org/go/cpt" as const };

export default function OrderView() {
  const { context } = useSmartContext();
  const {
    patient, patientLoading, patientError,
    setPatient, setPatientLoading, setPatientError,
    setOrder, setCrdLoading, setCrdResults, setCrdError, setView,
    openPatientRecord,
  } = usePaStore();

  const [patientIdInput, setPatientIdInput] = useState(context?.patientId ?? "");
  const [orderingProvider, setOrderingProvider] = useState("");
  const [facility, setFacility] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } = useForm<ProcedureFieldValues>({
    defaultValues: { procedures: [EMPTY_ROW] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "procedures" });

  // Auto-load the patient the SMART launch actually handed us. No fallback to
  // demo data — a failed load is shown as an error with a retry, not masked.
  useEffect(() => {
    if (!context?.patientId) return;
    void loadPatient(context.patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.patientId]);

  async function loadPatient(id: string) {
    if (!context) return;
    setPatientLoading(true);
    try {
      const banner = await fetchPatientBanner(context, id);
      setPatient(banner);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load patient";
      setPatientError(msg);
      toast.error(msg);
    } finally {
      setPatientLoading(false);
    }
  }

  async function onSubmit(values: ProcedureFieldValues) {
    if (!context) return;
    if (!patient) {
      toast.error("Load a patient before running CRD.");
      return;
    }
    const procedures: OrderProcedure[] = values.procedures.map((p) => ({
      cpt: p.cpt.trim(),
      cptSystem: p.cptSystem,
      cptDesc: p.cptDesc.trim() || `Procedure ${p.cpt.trim()}`,
    }));

    setOrder({ procedures, orderingProvider: orderingProvider || "Not specified", facility: facility || "Not specified", orderDate: new Date().toLocaleDateString("en-US") });
    setCrdLoading(true);
    setView("checklist");
    setSubmitting(true);

    try {
      // Run CRD for every procedure on the order — "full CRD" for a
      // multi-procedure request means every code gets its own coverage
      // determination, not just the first one entered.
      const results: CrdResultEntry[] = await Promise.all(
        procedures.map(async (proc) => ({
          cpt: proc.cpt,
          cptDesc: proc.cptDesc,
          result: await runCrdChecks(context, proc.cpt),
        }))
      );
      setCrdResults(results);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "CRD check failed";
      setCrdError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setCrdLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter the patient and one or more procedures, then run Coverage Requirements Discovery (CRD) against the
          payer&apos;s real FHIR-based rules before scheduling.
        </p>
      </div>

      {/* Patient section — real FHIR lookup, no fabricated fallback */}
      <div className="mb-5 rounded-lg border border-gray-200 border-l-[5px] border-l-[#5d7a94] bg-gradient-to-b from-gray-50 to-blue-50/40 px-5 py-4">
        {patient ? (
          <div className="flex flex-wrap items-center gap-7">
            <div className="font-bold text-lg text-gray-900">{patient.name}</div>
            <div className="text-sm text-gray-500"><span className="font-semibold text-gray-700">DOB:</span> {patient.dob}</div>
            <div className="text-sm text-gray-500"><span className="font-semibold text-gray-700">Member ID:</span> {patient.memberId}</div>
            <button
              type="button"
              onClick={openPatientRecord}
              className="ml-auto text-xs font-semibold text-[#1669c1] hover:underline"
            >
              View Full Patient Record
            </button>
            <button
              type="button"
              onClick={() => loadPatient(patientIdInput)}
              className="text-xs font-semibold text-gray-500 hover:underline"
            >
              Switch patient
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Patient ID (FHIR)
              </label>
              <input
                value={patientIdInput}
                onChange={(e) => setPatientIdInput(e.target.value)}
                placeholder="e.g. patient-rachel-green"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={!patientIdInput || patientLoading}
              onClick={() => loadPatient(patientIdInput)}
              className="rounded-lg bg-[#1669c1] px-5 py-2 text-sm font-bold text-white hover:bg-[#0f52a0] transition-colors disabled:opacity-40"
            >
              {patientLoading ? "Loading…" : "Load Patient"}
            </button>
          </div>
        )}
        {patientError && !patientLoading && (
          <p className="mt-3 text-sm text-red-600">
            <strong>Couldn&apos;t load patient:</strong> {patientError}
            <span className="block text-xs text-gray-400 mt-0.5">
              Confirm the FHIR server is running and this patient id has been seeded (see infra/seed).
            </span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Procedures — one or more */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Procedure{fields.length > 1 ? "s" : ""} ({fields.length})
            </p>
            <button
              type="button"
              onClick={() => append(EMPTY_ROW)}
              className="text-xs font-bold text-[#1669c1] hover:underline"
            >
              + Add another procedure
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                <div className="w-28">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Code system</label>
                  <select {...register(`procedures.${i}.cptSystem` as const)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm">
                    <option value="http://www.ama-assn.org/go/cpt">CPT</option>
                    <option value="https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets">HCPCS</option>
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Code</label>
                  <input
                    {...register(`procedures.${i}.cpt` as const, { required: true, pattern: /^[A-Za-z0-9]{4,6}$/ })}
                    placeholder="43644"
                    className={`w-full rounded-md border px-2 py-2 text-sm font-mono ${errors.procedures?.[i]?.cpt ? "border-red-400" : "border-gray-300"}`}
                  />
                </div>
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Description (optional)</label>
                  <input
                    {...register(`procedures.${i}.cptDesc` as const)}
                    placeholder="Procedure description"
                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
                  />
                </div>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(i)} className="text-xs font-semibold text-red-500 hover:underline pb-2">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.procedures && (
            <p className="mt-2 text-xs text-red-600">Enter a valid procedure code (4–6 alphanumeric characters) for every row.</p>
          )}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Ordering provider</label>
              <input value={orderingProvider} onChange={(e) => setOrderingProvider(e.target.value)} placeholder="Dr. Jane Smith" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Facility</label>
              <input value={facility} onChange={(e) => setFacility(e.target.value)} placeholder="Facility name" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm text-center">
          <p className="text-sm text-gray-500 mb-5 max-w-lg mx-auto">
            Before this order is signed, run a real-time Coverage Requirements Discovery (CRD) check against the
            payer for every procedure above — eligibility, network status, and prior authorization requirements.
          </p>
          <button
            type="submit"
            disabled={!patient || submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1669c1] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#0f52a0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Running CRD…" : "Check Prior Auth Requirements (CRD)"}
          </button>
          {!patient && <p className="mt-2 text-xs text-gray-400">Load a patient above first.</p>}
        </div>
      </form>
    </div>
  );
}
