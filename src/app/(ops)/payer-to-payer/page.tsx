'use client';

/**
 * Payer-to-Payer (plan Slice 3). Long-running workflow: start a bulk export from
 * the prior payer, poll status, then import into the Member 360.
 */
import { useState } from 'react';
import { postJson, getJson } from '@/lib/client/bff';
import { StatusTimeline, type TimelineStep } from '@/components/fhir/StatusTimeline';
import { flag } from '@/lib/flags/flags';
import AppLayout from '@/components/AppLayout';

export default function PayerToPayerPage(): React.ReactElement {
  const [priorPayer, setPriorPayer] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [state, setState] = useState<string>('');

  const steps: TimelineStep[] = [
    { label: 'Consent captured', state: priorPayer ? 'done' : 'pending' },
    { label: 'Export requested', state: jobId ? 'done' : priorPayer ? 'current' : 'pending' },
    {
      label: `Export ${state || 'in progress'}`,
      state: state === 'completed' ? 'done' : jobId ? 'current' : 'pending',
    },
    { label: 'Imported to Member 360', state: state === 'completed' ? 'current' : 'pending' },
  ];

  async function start(): Promise<void> {
    const r = await postJson<{ jobId?: string }>('/api/bulk/start', {
      priorPayer,
      memberMatch: {},
    });
    if (r.data?.jobId) setJobId(r.data.jobId);
  }
  async function poll(): Promise<void> {
    if (!jobId) return;
    const r = await getJson<{ state?: string }>(
      `/api/bulk/status?jobId=${encodeURIComponent(jobId)}`
    );
    setState(r.data?.state ?? 'unknown');
  }

  if (!flag('payerToPayer')) return <main className="p-6">Payer-to-Payer is not enabled.</main>;

  return (
    <AppLayout>
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Payer-to-Payer data exchange</h1>
      <div className="flex gap-2">
        <input
          value={priorPayer}
          onChange={(e) => setPriorPayer(e.target.value)}
          placeholder="Previous payer"
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <button
          onClick={start}
          disabled={!priorPayer}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Start exchange
        </button>
        <button
          onClick={poll}
          disabled={!jobId}
          className="rounded border px-4 py-2 text-sm disabled:opacity-50"
        >
          Refresh status
        </button>
      </div>
      {jobId ? <p className="font-mono text-xs text-slate-500">job: {jobId}</p> : null}
      <div className="rounded border border-slate-200 p-4">
        <StatusTimeline steps={steps} />
      </div>
      <p className="text-xs text-slate-400">
        5-year claims history is pulled asynchronously; duplicate callbacks are applied
        idempotently.
      </p>
    </main>
    </AppLayout>
  );
}
