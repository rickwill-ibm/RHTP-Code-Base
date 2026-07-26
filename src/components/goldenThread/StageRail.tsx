/**
 * Golden Thread status rail (increment GT-5). Presentational; renders the four
 * stages with the current one highlighted and completed ones checked.
 */
import { FC_STAGES, type FcStage } from '@/lib/goldenThread';

export interface StageRailProps {
  current: FcStage;
  completed: FcStage[];
  skipped?: FcStage[];
}

export function StageRail({
  current,
  completed,
  skipped = [],
}: StageRailProps): React.ReactElement {
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Financial clearance stages">
      {FC_STAGES.map((s, i) => {
        const isDone = completed.includes(s.key);
        const isCurrent = current === s.key;
        const isSkipped = skipped.includes(s.key);
        const state = isSkipped ? 'skipped' : isCurrent ? 'current' : isDone ? 'done' : 'pending';
        const cls =
          state === 'current'
            ? 'border-amber-400 bg-amber-50 text-amber-900'
            : state === 'done'
              ? 'border-green-300 bg-green-50 text-green-800'
              : state === 'skipped'
                ? 'border-slate-200 bg-slate-50 text-slate-400 line-through'
                : 'border-slate-200 bg-white text-slate-500';
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>
              {i + 1}. {s.label}
              {state === 'done' ? ' ✓' : ''}
            </span>
            {i < FC_STAGES.length - 1 ? <span className="text-slate-300">→</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
