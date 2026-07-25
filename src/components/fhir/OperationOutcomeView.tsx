'use client';

/**
 * Renders a FHIR OperationOutcome consistently across the app (plan F-5).
 */
import type { OperationOutcome, IssueSeverity } from '@/lib/fhir/operationOutcome';

const SEVERITY_STYLE: Record<IssueSeverity, string> = {
  fatal: 'border-red-300 bg-red-50 text-red-800',
  error: 'border-red-300 bg-red-50 text-red-800',
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
  information: 'border-blue-300 bg-blue-50 text-blue-800',
};

export function OperationOutcomeView({
  outcome,
}: {
  outcome: OperationOutcome;
}): React.ReactElement {
  return (
    <div role="alert" aria-live="polite" className="space-y-2">
      {outcome.issue.map((issue, i) => (
        <div
          key={i}
          className={`rounded border px-3 py-2 text-sm ${SEVERITY_STYLE[issue.severity]}`}
        >
          <span className="font-semibold capitalize">{issue.severity}</span>
          <span className="mx-1">·</span>
          <span className="font-mono text-xs">{issue.code}</span>
          {issue.diagnostics ? <div className="mt-1">{issue.diagnostics}</div> : null}
          {issue.expression?.length ? (
            <div className="mt-1 font-mono text-xs opacity-70">{issue.expression.join(', ')}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default OperationOutcomeView;
