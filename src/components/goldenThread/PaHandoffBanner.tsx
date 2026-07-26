'use client';

/**
 * Stage-3 handoff banner. When Prior Authorization is entered from the Golden
 * Thread (`/prior-auth?order=…&evidence=…`), this shows the incoming order +
 * Evidence Record context so stage 3 continues the same thread. Reads the query
 * from the URL on mount (no Suspense boundary needed).
 */
import { useEffect, useState } from 'react';

export function PaHandoffBanner(): React.ReactElement | null {
  const [ctx, setCtx] = useState<{ order?: string; evidence?: string } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const order = q.get('order') ?? undefined;
    const evidence = q.get('evidence') ?? undefined;
    if (order || evidence) setCtx({ order, evidence });
  }, []);

  if (!ctx) return null;
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <span className="font-medium">Continuing the Golden Thread — stage 3.</span>{' '}
      {ctx.order ? (
        <>
          Order <span className="font-mono">{ctx.order}</span>.{' '}
        </>
      ) : null}
      {ctx.evidence ? (
        <a
          className="text-blue-700 underline"
          href={`/evidence/${encodeURIComponent(ctx.evidence)}`}
        >
          View Evidence Record
        </a>
      ) : null}
    </div>
  );
}
