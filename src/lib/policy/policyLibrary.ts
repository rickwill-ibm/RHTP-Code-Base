/**
 * Policy library loader + indices (Policy Engine increment PE-3).
 *
 * Mock mode loads the bundled seed (`data/policy-library.seed.json`, produced
 * from real Aetna CPBs + UHC PA lists by `tools/seed/parse_policies.py`) and
 * runs every record back through the ingestion adapters, so even the seed path
 * exercises the same normalization a live payer feed would. Non-mock callers
 * pass their own already-ingested policies via {@link buildLibrary}.
 */
import type { NormalizedPolicy } from './types';
import { ingestRecords, type RawPolicyRecord } from './ingest';
import seed from './data/policy-library.seed.json';

export interface LoadedLibrary {
  version: string;
  sourceCorpus?: string;
  policies: NormalizedPolicy[];
  /** CPT/HCPCS code → policies that govern it. */
  byCode: Map<string, NormalizedPolicy[]>;
  /** Aetna CPB number → policy. */
  byNumber: Map<string, NormalizedPolicy>;
  findByCode(code: string): NormalizedPolicy[];
  findByNumber(number: string): NormalizedPolicy | undefined;
}

/** All CPT/HCPCS codes a policy governs, across every bucket / PA list. */
export function governedCodes(p: NormalizedPolicy): string[] {
  const out = new Set<string>();
  if (p.codes) {
    for (const bucket of [
      p.codes.cptCovered,
      p.codes.cptNotCovered,
      p.codes.cptOther,
      p.codes.hcpcsCovered,
      p.codes.hcpcsNotCovered,
      p.codes.hcpcsOther,
    ]) {
      for (const c of bucket) out.add(c);
    }
  }
  if (p.allPaCodes) for (const c of p.allPaCodes) out.add(c);
  return [...out];
}

function index(policies: NormalizedPolicy[]): LoadedLibrary {
  const byCode = new Map<string, NormalizedPolicy[]>();
  const byNumber = new Map<string, NormalizedPolicy>();
  for (const p of policies) {
    if (p.number) byNumber.set(p.number, p);
    for (const c of governedCodes(p)) {
      const list = byCode.get(c) ?? [];
      list.push(p);
      byCode.set(c, list);
    }
  }
  return {
    version: '1.0',
    policies,
    byCode,
    byNumber,
    findByCode: (code) => byCode.get(code) ?? [],
    findByNumber: (n) => byNumber.get(n),
  };
}

/** Build a library from already-normalized policies (non-mock / injected). */
export function buildLibrary(policies: NormalizedPolicy[]): LoadedLibrary {
  return index(policies);
}

/** Build a library from raw source records by running them through adapters. */
export function ingestLibrary(records: RawPolicyRecord[]): {
  library: LoadedLibrary;
  skipped: number;
} {
  const { policies, skipped } = ingestRecords(records);
  return { library: index(policies), skipped };
}

let mockCache: LoadedLibrary | null = null;

/** The bundled mock library (real parsed Aetna + UHC corpus). Memoized. */
export function loadMockLibrary(): LoadedLibrary {
  if (mockCache) return mockCache;
  const records = (seed as { policies: RawPolicyRecord[] }).policies;
  const { policies } = ingestRecords(records);
  mockCache = index(policies);
  mockCache.sourceCorpus = (seed as { sourceCorpus?: string }).sourceCorpus;
  return mockCache;
}
