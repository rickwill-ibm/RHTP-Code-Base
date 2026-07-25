'use client';

/** Lifecycle timeline for PA / P2P workflows (plan §7). Presentational. */
export interface TimelineStep {
  label: string;
  state: 'done' | 'current' | 'pending' | 'error';
  at?: string;
}

const DOT: Record<TimelineStep['state'], string> = {
  done: 'bg-green-500',
  current: 'bg-blue-500 ring-2 ring-blue-200',
  pending: 'bg-gray-300',
  error: 'bg-red-500',
};

export function StatusTimeline({ steps }: { steps: TimelineStep[] }): React.ReactElement {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[s.state]}`} aria-hidden />
          <span className={s.state === 'current' ? 'font-semibold' : ''}>{s.label}</span>
          {s.at ? <span className="ml-auto font-mono text-xs text-gray-500">{s.at}</span> : null}
        </li>
      ))}
    </ol>
  );
}

export default StatusTimeline;
