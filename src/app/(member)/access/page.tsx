'use client';

/**
 * Patient Access (plan Slice 1 — CORE). A member views their Coverage, clinical
 * conditions, and prior-authorization status — all through the BFF (/api/fhir),
 * never FHIR directly. Human-readable statuses; consent context surfaced.
 */
import { useCallback, useEffect, useState } from 'react';
import { fhirGet, getJson } from '@/lib/client/bff';
import {
  toCoverageVM,
  toConditionVM,
  toPaStatusVM,
  type CoverageVM,
  type ConditionVM,
  type PaStatusVM,
} from '@/lib/fhir/viewModels';
import { ConsentPanel } from '@/components/fhir/ConsentPanel';
import { ProvenanceBadge } from '@/components/fhir/ProvenanceBadge';
import { OperationOutcomeView } from '@/components/fhir/OperationOutcomeView';
import type { OperationOutcome } from '@/lib/fhir/operationOutcome';
import { flag } from '@/lib/flags/flags';

// Patient id comes from the SMART session context; falls back to the seeded member.
const DEFAULT_PATIENT = 'MARIA_SD_001';

interface Bundle {
  entry?: { resource?: Record<string, unknown> }[];
}

export default function PatientAccessPage(): React.ReactElement {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [coverage, setCoverage] = useState<CoverageVM[]>([]);
  const [conditions, setConditions] = useState<ConditionVM[]>([]);
  const [paStatus, setPaStatus] = useState<PaStatusVM[]>([]);
  const [error, setError] = useState<OperationOutcome | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (patientId: string) => {
    setLoading(true);
    setError(null);
    const cov = await fhirGet<Bundle>(`Coverage?beneficiary=Patient/${patientId}`);
    const cond = await fhirGet<Bundle>(`Condition?subject=Patient/${patientId}`);
    const pa = await fhirGet<Bundle>(`ClaimResponse?patient=Patient/${patientId}`);
    if (cov.data) setCoverage((cov.data.entry ?? []).map((e) => toCoverageVM(e.resource ?? {})));
    if (cond.data)
      setConditions((cond.data.entry ?? []).map((e) => toConditionVM(e.resource ?? {})));
    if (pa.data) setPaStatus((pa.data.entry ?? []).map((e) => toPaStatusVM(e.resource ?? {})));
    const firstErr = cov.error ?? cond.error ?? pa.error;
    if (firstErr) setError(firstErr);
    setLoading(false);
  }, []);

  useEffect(() => {
    getJson<{ authenticated: boolean; patient?: string }>('/api/auth/session').then((r) => {
      const ok = !!r.data?.authenticated;
      setAuthed(ok);
      if (ok) void load(r.data?.patient ?? DEFAULT_PATIENT);
    });
  }, [load]);

  if (!flag('patientAccess')) return <main className="p-6">Patient Access is not enabled.</main>;

  if (authed === false) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Your health information</h1>
        <p className="mt-2 text-sm text-slate-600">
          Please sign in to view your coverage, conditions, and prior-authorization status.
        </p>
        <a
          href="/api/auth/login"
          className="mt-3 inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          Sign in (SMART)
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your health information</h1>
        <ProvenanceBadge source="Payer FHIR (Patient Access API)" />
      </header>

      <ConsentPanel
        consent={{
          status: 'active',
          purpose: 'patient-request',
          scope: 'patient/*.read',
          granularBoundaries: ['42 CFR Part 2'],
        }}
      />

      {error ? <OperationOutcomeView outcome={error} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      <Section title="Coverage">
        {coverage.length === 0 ? (
          <Empty />
        ) : (
          coverage.map((c) => (
            <Row key={c.id} left={c.type || 'Coverage'} right={`${c.payer} · ${c.status}`} />
          ))
        )}
      </Section>

      <Section title="Conditions">
        {conditions.length === 0 ? (
          <Empty />
        ) : (
          conditions.map((c) => <Row key={c.id} left={c.display} right={c.clinicalStatus} />)
        )}
      </Section>

      <Section title="Prior-authorization status">
        {paStatus.length === 0 ? (
          <Empty />
        ) : (
          paStatus.map((p) => (
            <div key={p.id} className="border-b py-2 text-sm last:border-0">
              <div className="flex justify-between">
                <span>{p.service || 'Service'}</span>
                <StatusPill status={p.status} />
              </div>
              {p.denialReasons.length ? (
                <ul className="mt-1 list-disc pl-5 text-xs text-red-700">
                  {p.denialReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="rounded border border-slate-200 p-3">{children}</div>
    </section>
  );
}
function Row({ left, right }: { left: string; right: string }): React.ReactElement {
  return (
    <div className="flex justify-between border-b py-2 text-sm last:border-0">
      <span>{left}</span>
      <span className="text-slate-600">{right}</span>
    </div>
  );
}
function Empty(): React.ReactElement {
  return <p className="text-sm text-slate-400">No records.</p>;
}
function StatusPill({ status }: { status: PaStatusVM['status'] }): React.ReactElement {
  const style =
    status === 'approved'
      ? 'bg-green-50 text-green-700'
      : status === 'denied'
        ? 'bg-red-50 text-red-700'
        : status === 'pending'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-slate-100 text-slate-600';
  return <span className={`rounded px-2 py-0.5 text-xs capitalize ${style}`}>{status}</span>;
}
