'use client';

/**
 * Reviewer work-queue inbox (reviewer UI).
 *
 * Lists work items derived from persisted Evidence Records, grouped by
 * disposition, with SLA due dates and breach flags. Each item links to its
 * Evidence Record. Client component — reads through the BFF only.
 */
import { useEffect, useState } from 'react';
import { getJson } from '@/lib/client/bff';
import type { WorkItem, QueueName } from '@/lib/goldenThread';

interface WorkQueueResponse {
  count: number;
  groups: Record<QueueName, WorkItem[]>;
}

const QUEUE_META: { key: QueueName; label: string; tone: string }[] = [
  { key: 'high-risk-review', label: 'High-risk review', tone: 'border-red-300 bg-red-50' },
  { key: 'ready-to-submit', label: 'Ready to submit', tone: 'border-blue-300 bg-blue-50' },
  { key: 'more-info', label: 'More info requested', tone: 'border-amber-300 bg-amber-50' },
  { key: 'denied-appeal', label: 'Denied — appeal', tone: 'border-rose-300 bg-rose-50' },
  { key: 'auto-cleared', label: 'Auto-cleared', tone: 'border-green-300 bg-green-50' },
];

function nowIso(): string {
  return new Date().toISOString();
}

function ItemRow({ item }: { item: WorkItem }): React.ReactElement {
  const breached = Date.parse(nowIso()) > Date.parse(item.dueBy);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white p-2 text-sm">
      <div>
        <span className="font-medium">{item.code}</span> · member {item.memberId}
        {typeof item.propensityScore === 'number' ? (
          <span className="ml-2 text-xs text-slate-500">propensity {item.propensityScore}</span>
        ) : null}
        <span className="block text-xs text-slate-500">{item.note}</span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            breached ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          SLA {item.slaHours}h · due {item.dueBy.slice(0, 10)}
          {breached ? ' · BREACHED' : ''}
        </span>
        <a
          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-blue-700 hover:bg-slate-50"
          href={`/evidence/${encodeURIComponent(item.evidenceId)}`}
        >
          View evidence
        </a>
      </div>
    </li>
  );
}

export default function WorkQueuePage(): React.ReactElement {
  const [data, setData] = useState<WorkQueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<WorkQueueResponse>('/api/work-queue').then((r) => {
      if (r.ok && r.data) setData(r.data);
      else setError(r.error?.issue?.[0]?.diagnostics ?? 'Failed to load work queue');
    });
  }, []);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Prior-Authorization work queue</h1>
        <p className="mt-1 text-sm text-slate-600">
          Reviewer inbox — items routed by disposition from persisted Evidence Records, with
          CMS-0057-F SLA timers (72h expedited / 7d standard).
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      {!data ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : data.count === 0 ? (
        <p className="text-sm text-slate-500">
          No items yet. Run a clearance from{' '}
          <a className="text-blue-700 underline" href="/financial-clearance">
            Financial Clearance
          </a>{' '}
          to populate the queue.
        </p>
      ) : (
        QUEUE_META.map((q) => {
          const items = data.groups[q.key] ?? [];
          if (items.length === 0) return null;
          return (
            <section key={q.key} className={`rounded-lg border p-3 ${q.tone}`} aria-label={q.label}>
              <h2 className="mb-2 text-sm font-semibold">
                {q.label} <span className="font-normal text-slate-500">({items.length})</span>
              </h2>
              <ul className="space-y-2">
                {items.map((it) => (
                  <ItemRow key={it.evidenceId} item={it} />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </main>
  );
}
