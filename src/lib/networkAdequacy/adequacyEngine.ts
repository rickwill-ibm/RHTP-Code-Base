/**
 * Network Adequacy engine (increment NA-1).
 *
 * Pure + deterministic. Computes adequacy metrics by county × specialty × LOB
 * from providers + geography + standards, derives prioritized gaps, validates a
 * cell against the CMS standards (time/distance, in-network %, wait-time, ratio,
 * target), and recommends augmentation. The interactive assistant reasons over
 * these outputs, so every answer is grounded and reproducible.
 */
import type {
  AdequacyInput,
  AdequacyMetric,
  AdequacyStandard,
  AugmentCandidate,
  Gap,
  Lob,
  Severity,
  ValidationCheck,
  ValidationResult,
} from './types';

const LOBS: Lob[] = ['Medicaid', 'Medicare', 'Commercial'];

/** Great-circle distance in miles. */
export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function standardFor(input: AdequacyInput, specialty: string): AdequacyStandard | undefined {
  return input.standards.find((s) => s.specialty === specialty);
}

function waitFor(input: AdequacyInput, county: string, specialty: string, lob: Lob): number | null {
  const w = input.waitTimes?.find(
    (x) => x.county === county && x.specialty === specialty && x.lob === lob
  );
  return w ? w.avgWaitDays : null;
}

export interface CellKey {
  county: string;
  specialty: string;
  lob: Lob;
}

/** Compute the adequacy metric for one county×specialty×LOB cell. */
export function computeCell(input: AdequacyInput, key: CellKey): AdequacyMetric | null {
  const geo = input.geo.find((g) => g.name === key.county);
  const std = standardFor(input, key.specialty);
  if (!geo || !std) return null;
  const memberCount = geo.members[key.lob] ?? 0;

  const matching = input.providers.filter(
    (p) => p.specialty === key.specialty && p.lobs.includes(key.lob) && p.acceptingNewPatients
  );
  // Distance (access) is cross-county: nearest matching provider to the centroid.
  const withDist = matching.map((p) => ({ p, d: haversineMiles(geo.lat, geo.lng, p.lat, p.lng) }));
  const nearest = withDist.length ? Math.min(...withDist.map((x) => x.d)) : null;
  // Ratio (capacity) is in-county: the plan's contracted providers for this
  // county's members (cross-county providers serve their own populations).
  const providerCount = matching.filter((p) => p.county === key.county).length;

  const providersPer100k = memberCount > 0 ? (providerCount / memberCount) * 100000 : 0;
  const ratioScore =
    std.requiredPer100k > 0 ? Math.min(100, (providersPer100k / std.requiredPer100k) * 100) : 100;
  const distanceScore =
    nearest === null
      ? 0
      : nearest <= std.maxDistanceMiles
        ? 100
        : Math.max(0, 100 - (nearest - std.maxDistanceMiles) * 5);
  const adequacyPct = Math.round(0.5 * distanceScore + 0.5 * ratioScore);

  return {
    county: key.county,
    state: geo.state,
    specialty: key.specialty,
    lob: key.lob,
    adequacyPct,
    targetPct: std.targetAdequacyPct,
    nearestDistanceMiles: nearest === null ? null : Math.round(nearest * 10) / 10,
    providersPer100k: Math.round(providersPer100k * 10) / 10,
    avgWaitDays: waitFor(input, key.county, key.specialty, key.lob),
    memberProviderRatio: providerCount > 0 ? Math.round(memberCount / providerCount) : null,
    providerCount,
    memberCount,
    gapStatus: adequacyPct < std.targetAdequacyPct,
  };
}

/** Compute metrics for every county×specialty×LOB that has members. */
export function computeMetrics(
  input: AdequacyInput,
  opts?: { lob?: Lob; specialty?: string; state?: string; county?: string }
): AdequacyMetric[] {
  const out: AdequacyMetric[] = [];
  for (const geo of input.geo) {
    if (opts?.state && geo.state !== opts.state) continue;
    if (opts?.county && geo.name !== opts.county) continue;
    for (const std of input.standards) {
      if (opts?.specialty && std.specialty !== opts.specialty) continue;
      for (const lob of LOBS) {
        if (opts?.lob && lob !== opts.lob) continue;
        if ((geo.members[lob] ?? 0) === 0) continue;
        const m = computeCell(input, { county: geo.name, specialty: std.specialty, lob });
        if (m) out.push(m);
      }
    }
  }
  return out;
}

function severityOf(pct: number): Severity {
  if (pct < 50) return 'critical';
  if (pct < 70) return 'high';
  if (pct < 85) return 'medium';
  return 'low';
}

/** Derive prioritized gaps from metrics (default sort: severity, then population). */
export function computeGaps(
  input: AdequacyInput,
  opts?: { lob?: Lob; specialty?: string; state?: string; county?: string }
): Gap[] {
  const metrics = computeMetrics(input, opts).filter((m) => m.gapStatus);
  const gaps: Gap[] = metrics.map((m) => {
    const std = standardFor(input, m.specialty)!;
    const required = Math.ceil((std.requiredPer100k * m.memberCount) / 100000);
    return {
      county: m.county,
      state: m.state,
      specialty: m.specialty,
      lob: m.lob,
      severity: severityOf(m.adequacyPct),
      currentPct: m.adequacyPct,
      requiredPct: m.targetPct,
      affectedPopulation: Math.round((m.memberCount * (m.targetPct - m.adequacyPct)) / 100),
      shortfallProviders: Math.max(0, required - m.providerCount),
    };
  });
  const rank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return gaps.sort(
    (a, b) => rank[a.severity] - rank[b.severity] || b.affectedPopulation - a.affectedPopulation
  );
}

/** Validate a cell against the applicable CMS standards. */
export function validateCell(input: AdequacyInput, key: CellKey): ValidationResult | null {
  const m = computeCell(input, key);
  const std = standardFor(input, key.specialty);
  if (!m || !std) return null;
  const checks: ValidationCheck[] = [
    {
      standard: 'time-distance',
      pass: m.nearestDistanceMiles !== null && m.nearestDistanceMiles <= std.maxDistanceMiles,
      actual: m.nearestDistanceMiles,
      required: std.maxDistanceMiles,
      detail: `nearest in-network provider ${m.nearestDistanceMiles ?? '—'} mi vs ${std.maxDistanceMiles} mi standard`,
    },
    {
      standard: 'ratio',
      pass: m.providersPer100k >= std.requiredPer100k,
      actual: m.providersPer100k,
      required: std.requiredPer100k,
      detail: `${m.providersPer100k}/100k vs ${std.requiredPer100k}/100k required`,
    },
    {
      standard: 'in-network-90',
      pass: m.adequacyPct >= std.minInNetworkPct,
      actual: m.adequacyPct,
      required: std.minInNetworkPct,
      detail: `adequacy ${m.adequacyPct}% vs ${std.minInNetworkPct}% in-network access`,
    },
    {
      standard: 'wait-time',
      pass: m.avgWaitDays === null ? true : m.avgWaitDays <= std.maxWaitDays,
      actual: m.avgWaitDays,
      required: std.maxWaitDays,
      detail:
        m.avgWaitDays === null
          ? `wait-time not measured (treated as pass; secret-shopper feed pending)`
          : `avg wait ${m.avgWaitDays}d vs ${std.maxWaitDays}d standard`,
    },
    {
      standard: 'adequacy-target',
      pass: m.adequacyPct >= std.targetAdequacyPct,
      actual: m.adequacyPct,
      required: std.targetAdequacyPct,
      detail: `adequacy ${m.adequacyPct}% vs ${std.targetAdequacyPct}% target`,
    },
  ];
  return {
    county: key.county,
    specialty: key.specialty,
    lob: key.lob,
    compliant: checks.every((c) => c.pass),
    checks,
  };
}

/** Estimate the adequacy lift from adding one in-network provider at the county centroid. */
export function recommendAugmentation(input: AdequacyInput, key: CellKey): AugmentCandidate | null {
  const before = computeCell(input, key);
  const geo = input.geo.find((g) => g.name === key.county);
  if (!before || !geo) return null;
  const augmented: AdequacyInput = {
    ...input,
    providers: [
      ...input.providers,
      {
        npi: '0000000000',
        name: 'Augment candidate',
        specialty: key.specialty,
        county: key.county,
        lat: geo.lat,
        lng: geo.lng,
        lobs: [key.lob],
        acceptingNewPatients: true,
        status: 'active',
      },
    ],
  };
  const after = computeCell(augmented, key)!;
  return {
    specialty: key.specialty,
    county: key.county,
    lob: key.lob,
    adequacyLiftPct: after.adequacyPct - before.adequacyPct,
    newAdequacyPct: after.adequacyPct,
    rationale: `Adding 1 ${key.specialty} provider accepting ${key.lob} in ${key.county} raises adequacy ${before.adequacyPct}% → ${after.adequacyPct}%.`,
  };
}
