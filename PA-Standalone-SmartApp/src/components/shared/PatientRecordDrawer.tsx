"use client";

/**
 * Full patient chart drawer — slides over whatever screen (Order, DTR, etc.)
 * the reviewer is currently on, without navigating away from it. Backed by
 * lib/fhir/patientRecord.ts, which queries every resource type unfiltered
 * (no code filter), unlike DTR's narrow per-criterion queries. This is
 * deliberately not a numbered workflow step — see
 * Patient_Record_Visibility_and_Test_Seeding_Plan.md §2.1 for why.
 */

import { useEffect, useState } from "react";
import { usePaStore } from "@/lib/pa/usePaStore";
import { useSmartContext } from "@/lib/smart/SmartContext";
import { fetchPatientRecord, type PatientRecordSection, type PatientRecordItem } from "@/lib/fhir/patientRecord";

export default function PatientRecordDrawer() {
  const { patientRecordOpen, closePatientRecord, patient } = usePaStore();
  const { context } = useSmartContext();
  const [sections, setSections] = useState<PatientRecordSection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientRecordOpen || !context) return;
    // Fetch on open, not on mount — this is look-up-on-demand data, not part
    // of the CRD/DTR pipeline, so it shouldn't add a network round trip to
    // screens that never open the drawer.
    setLoading(true);
    setError(null);
    fetchPatientRecord(context)
      .then(setSections)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load patient record"))
      .finally(() => setLoading(false));
  }, [patientRecordOpen, context]);

  if (!patientRecordOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={closePatientRecord} />

      {/* Panel */}
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Full Patient Record</p>
            <h2 className="text-lg font-bold text-gray-900">{patient?.name ?? "Patient chart"}</h2>
            {patient && (
              <p className="text-xs text-gray-500 mt-0.5">
                DOB: {patient.dob} · Member ID: {patient.memberId}
              </p>
            )}
          </div>
          <button
            onClick={closePatientRecord}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close patient record"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-xs text-gray-400 mb-5">
            Unfiltered chart data from EMR and Payer Patient Access — every resource on file for this patient, not
            just what a specific policy rule matched on.
          </p>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
              <p className="text-sm font-semibold">Loading full patient record…</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && !error && sections && sections.length === 0 && (
            <p className="text-sm text-gray-400 italic">No resources found for this patient in EMR or Patient Access.</p>
          )}

          {!loading && !error && sections?.map((s) => <RecordSection key={s.resourceType} section={s} />)}
        </div>
      </div>
    </div>
  );
}

function RecordSection({ section }: { section: PatientRecordSection }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
        {section.label} <span className="font-normal normal-case text-gray-300">({section.items.length})</span>
      </p>
      <div className="space-y-2">
        {section.items.map((item) => (
          <RecordItemRow key={`${item.resourceType}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function RecordItemRow({ item }: { item: PatientRecordItem }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {item.code && (
            <span className="mr-2 inline-block rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-gray-800">
              {item.code}
            </span>
          )}
          <span className="text-sm text-gray-800">{item.display}</span>
        </div>
        <span className="inline-block flex-shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
          {item.source === "pa" ? "Patient Access" : "EMR"}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
        {item.date && <span>{formatDate(item.date)}</span>}
        {item.status && <span className="capitalize">{item.status}</span>}
        {item.performerName && <span>{item.performerName}</span>}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
