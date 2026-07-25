'use client';

/** Shows the source/lineage of a projected value (plan §7 provenance). */
export function ProvenanceBadge({
  source,
  correlationId,
}: {
  source: string;
  correlationId?: string;
}): React.ReactElement {
  return (
    <span
      className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
      title={correlationId ? `correlation: ${correlationId}` : undefined}
    >
      <span aria-hidden>⛓</span>
      <span>source: {source}</span>
    </span>
  );
}

export default ProvenanceBadge;
