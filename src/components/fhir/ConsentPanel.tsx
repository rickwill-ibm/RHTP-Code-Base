'use client';

/** Displays consent + purpose-of-use context (plan Slice 1 §6.1 / §7). */
export interface ConsentInfo {
  status: string;
  purpose: string;
  scope: string;
  granularBoundaries?: string[]; // e.g. "42 CFR Part 2", "tribal sovereignty"
}

export function ConsentPanel({ consent }: { consent: ConsentInfo }): React.ReactElement {
  return (
    <section
      aria-label="Consent and data-access context"
      className="rounded border border-slate-200 p-3 text-sm"
    >
      <h3 className="mb-1 font-semibold text-slate-800">Data access &amp; consent</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        <dt className="text-slate-500">Consent status</dt>
        <dd>{consent.status}</dd>
        <dt className="text-slate-500">Purpose of use</dt>
        <dd>{consent.purpose}</dd>
        <dt className="text-slate-500">Scope</dt>
        <dd className="font-mono text-xs">{consent.scope}</dd>
      </dl>
      {consent.granularBoundaries?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {consent.granularBoundaries.map((b) => (
            <span key={b} className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
              {b}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default ConsentPanel;
