/**
 * Policy ingestion — adapter interface + registry (Policy Engine increment PE-2).
 *
 * The engine is source-agnostic. Getting a new payer or state Medicaid agency
 * into the library is exactly: write an adapter that turns that source's
 * extracted records into a {@link NormalizedPolicy}, then register it. Nothing
 * downstream (engine, UI, evidence record) changes.
 *
 * A "raw record" is whatever a source-specific *extractor* emits — e.g. the
 * reference `tools/seed/parse_policies.py` output, a payer policy API response,
 * or a future FHIR PlanDefinition / CQL importer. Adapters validate and coerce
 * it; they never trust field presence blindly.
 */
import type { NormalizedPolicy } from '../types';
import { aetnaCpbAdapter } from './aetnaCpb';
import { uhcPaListAdapter } from './uhcPaList';
import { genericPaListAdapter } from './genericPaList';

export type RawPolicyRecord = Record<string, unknown>;

export interface PolicyIngestionAdapter {
  /** Stable id, e.g. "aetna-cpb" / "uhc-pa-list". */
  id: string;
  source: string;
  sourceType: string;
  /** Does this adapter recognize the raw record? */
  canIngest(raw: RawPolicyRecord): boolean;
  /** Normalize a recognized raw record into the common model. Throws on invalid. */
  normalize(raw: RawPolicyRecord): NormalizedPolicy;
}

/**
 * Built-in adapters, tried in order. UHC-specific first, then the generic
 * PA-list adapter for any other payer/state agency. Extend via registerAdapter.
 */
const registry: PolicyIngestionAdapter[] = [
  aetnaCpbAdapter,
  uhcPaListAdapter,
  genericPaListAdapter,
];

export function registerAdapter(adapter: PolicyIngestionAdapter): void {
  if (registry.some((a) => a.id === adapter.id)) return;
  registry.push(adapter);
}

export function listAdapters(): readonly PolicyIngestionAdapter[] {
  return registry;
}

/** Pick the first adapter that recognizes this record. */
export function selectAdapter(raw: RawPolicyRecord): PolicyIngestionAdapter | null {
  return registry.find((a) => a.canIngest(raw)) ?? null;
}

/**
 * Normalize one raw record via the first matching adapter.
 * Returns null (does not throw) when no adapter recognizes the record, so a
 * batch ingest can skip-and-log rather than abort.
 */
export function ingestRecord(raw: RawPolicyRecord): NormalizedPolicy | null {
  const adapter = selectAdapter(raw);
  if (!adapter) return null;
  return adapter.normalize(raw);
}

/** Normalize a batch; returns the normalized policies and the skipped count. */
export function ingestRecords(records: RawPolicyRecord[]): {
  policies: NormalizedPolicy[];
  skipped: number;
} {
  const policies: NormalizedPolicy[] = [];
  let skipped = 0;
  for (const r of records) {
    const p = ingestRecord(r);
    if (p) policies.push(p);
    else skipped += 1;
  }
  return { policies, skipped };
}

export { aetnaCpbAdapter } from './aetnaCpb';
export { uhcPaListAdapter } from './uhcPaList';
export { genericPaListAdapter } from './genericPaList';
