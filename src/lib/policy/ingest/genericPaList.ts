/**
 * Generic prior-authorization list ingestion adapter (increment GT-9).
 *
 * Ingests ANY payer or state-agency PA-requirement list — not just UHC — as long
 * as an extractor emits records with sourceType
 * "prior-authorization-requirements-list". Preserves the record's own `source`
 * (e.g. "Texas Medicaid", "Aetna", a state agency) instead of forcing a payer.
 * This is the "ingest any state agency policy" path.
 */
import type { NormalizedPolicy, PaListItem } from '../types';
import type { PolicyIngestionAdapter, RawPolicyRecord } from './index';

function coercePaItems(v: unknown): PaListItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => x as Record<string, unknown>)
    .filter((x) => typeof x?.category === 'string' && Array.isArray(x?.codes))
    .map((x) => ({
      category: String(x.category),
      codes: (x.codes as unknown[]).filter((c): c is string => typeof c === 'string'),
      effectiveDate: x.effectiveDate == null ? null : String(x.effectiveDate),
    }));
}

export const genericPaListAdapter: PolicyIngestionAdapter = {
  id: 'generic-pa-list',
  source: 'generic',
  sourceType: 'prior-authorization-requirements-list',

  canIngest(raw: RawPolicyRecord): boolean {
    return (
      raw?.sourceType === 'prior-authorization-requirements-list' && Array.isArray(raw?.paItems)
    );
  },

  normalize(raw: RawPolicyRecord): NormalizedPolicy {
    const paItems = coercePaItems(raw.paItems);
    const allPaCodes = Array.from(new Set(paItems.flatMap((i) => i.codes))).sort();
    const source = String(raw.source ?? raw.agency ?? 'Unknown payer/agency');
    const plan = raw.plan ? String(raw.plan) : String(raw.program ?? source);

    return {
      policyId: String(raw.policyId ?? `palist-${plan.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
      source,
      sourceType: 'prior-authorization-requirements-list',
      title: String(raw.title ?? `${source} — Prior Authorization Requirements (${plan})`),
      category: String(raw.category ?? 'Payer/agency PA-required code list'),
      requiresPA: true,
      determinationBasis: 'code-on-pa-required-list',
      plan,
      effectiveDate: raw.effectiveDate == null ? null : String(raw.effectiveDate),
      paItems,
      allPaCodes,
      sourceFile: raw.sourceFile ? String(raw.sourceFile) : undefined,
    };
  },
};
