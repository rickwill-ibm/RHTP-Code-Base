/**
 * Generalized Policy Engine — evaluate() (Policy Engine increment PE-4).
 *
 * Pure, deterministic. Given a member, an ordered service, and a loaded policy
 * library, it returns a {@link CoverageDetermination}: does this need prior
 * authorization, is it criteria-gated medical necessity, are the member's
 * diagnoses sufficient, what is missing, and a propensity-to-deny score. The
 * determination threads into the Golden Thread Evidence Record and feeds
 * Da Vinci CRD → DTR → PAS.
 *
 * The engine knows nothing about Aetna or UHC specifically — it reasons over
 * the normalized model, so any adapter-supplied policy evaluates the same way.
 */
import type {
  CoverageDetermination,
  Deficiency,
  DeterminationOutcome,
  MemberContext,
  NormalizedPolicy,
  OrderContext,
  PolicyIndication,
  PolicyMatch,
} from './types';
import type { LoadedLibrary } from './policyLibrary';

/** Normalize an ICD-10 code for comparison: upper, no dots. */
function normIcd(code: string): string {
  return code.toUpperCase().replace(/\./g, '');
}

/** A member dx supports a covered ICD-10 when they share a ≥3-char root. */
function icdSupports(memberCode: string, coveredCode: string): boolean {
  const a = normIcd(memberCode);
  const b = normIcd(coveredCode);
  if (a.length < 3 || b.length < 3) return false;
  const root = a.slice(0, 3) === b.slice(0, 3);
  return root && (a === b || a.startsWith(b) || b.startsWith(a));
}

function classifyMatch(order: OrderContext, p: NormalizedPolicy): PolicyMatch | null {
  const code = order.code;
  if (p.codes) {
    if (p.codes.cptCovered.includes(code) || p.codes.hcpcsCovered.includes(code)) {
      return {
        policyId: p.policyId,
        source: p.source,
        title: p.title,
        number: p.number ?? null,
        url: p.url ?? null,
        basis: 'medical-necessity-criteria',
        matchedBucket: p.codes.cptCovered.includes(code) ? 'cptCovered' : 'hcpcsCovered',
        category: p.category,
      };
    }
    if (p.codes.cptNotCovered.includes(code) || p.codes.hcpcsNotCovered.includes(code)) {
      return {
        policyId: p.policyId,
        source: p.source,
        title: p.title,
        number: p.number ?? null,
        url: p.url ?? null,
        basis: 'experimental-investigational-not-covered',
        matchedBucket: p.codes.cptNotCovered.includes(code) ? 'cptNotCovered' : 'hcpcsNotCovered',
        category: p.category,
      };
    }
  }
  if (p.allPaCodes?.includes(code)) {
    return {
      policyId: p.policyId,
      source: p.source,
      title: p.title,
      number: p.number ?? null,
      url: p.url ?? null,
      basis: 'code-on-pa-required-list',
      matchedBucket: 'pa-list',
      category: p.paItems?.find((i) => i.codes.includes(code))?.category ?? p.category,
    };
  }
  return null;
}

export interface EvaluateOptions {
  /** Ignore an Aetna "other/related" mention that isn't a real governance match. */
  includeRelated?: boolean;
}

/**
 * Evaluate an order for a member against the library.
 * Deterministic: `evaluatedAt` is left undefined for the caller to stamp.
 */
export function evaluate(
  member: MemberContext,
  order: OrderContext,
  library: LoadedLibrary
): CoverageDetermination {
  const governing = library.findByCode(order.code);
  const matches: PolicyMatch[] = [];
  for (const p of governing) {
    const m = classifyMatch(order, p);
    if (m) matches.push(m);
  }

  const deficiencies: Deficiency[] = [];
  const indicationsConsidered: PolicyIndication[] = [];

  const experimentalMatch = matches.find(
    (m) => m.basis === 'experimental-investigational-not-covered'
  );
  const criteriaMatch = matches.find((m) => m.basis === 'medical-necessity-criteria');
  const paListMatch = matches.find((m) => m.basis === 'code-on-pa-required-list');

  let outcome: DeterminationOutcome;
  let requiresPA: boolean;
  let criteriaMet: boolean | null = null;
  let propensityToDeny: number;
  let rationale: string;

  if (experimentalMatch) {
    outcome = 'likely-denial-experimental';
    requiresPA = true;
    criteriaMet = false;
    propensityToDeny = 90;
    deficiencies.push({
      kind: 'experimental-service',
      detail: `${order.code} is listed as experimental/investigational or not covered under ${experimentalMatch.source} policy ${experimentalMatch.number ?? experimentalMatch.title}.`,
    });
    rationale = `Service ${order.code} maps to a not-covered / experimental determination — expect denial absent an exception request.`;
  } else if (criteriaMatch) {
    outcome = 'pa-required-criteria-review';
    requiresPA = true;
    const policy = library.byNumber.get(criteriaMatch.number ?? '') ?? governing[0];
    const covered = policy?.codes?.icd10Covered ?? [];
    for (const ind of policy?.indications ?? []) indicationsConsidered.push(ind);
    const supportingDx = member.diagnoses.filter((d) =>
      d.code ? covered.some((c) => icdSupports(d.code as string, c)) : false
    );
    criteriaMet = covered.length === 0 ? null : supportingDx.length > 0;
    if (criteriaMet === true) {
      propensityToDeny = 20;
      rationale = `Criteria-gated medical-necessity policy ${criteriaMatch.number ?? ''} applies; member carries a supporting diagnosis (${supportingDx
        .map((d) => d.code)
        .join(', ')}). Submit with documentation.`;
    } else if (criteriaMet === false) {
      propensityToDeny = 70;
      deficiencies.push({
        kind: 'missing-supporting-diagnosis',
        detail: `Policy ${criteriaMatch.number ?? criteriaMatch.title} covers ${order.code} only for specific indications; none of the member's coded diagnoses (${
          member.diagnoses
            .map((d) => d.code)
            .filter(Boolean)
            .join(', ') || 'none'
        }) match the covered ICD-10 set. Attach clinical documentation or an on-label diagnosis.`,
      });
      rationale = `Criteria-gated policy applies but no supporting diagnosis found — high denial risk until documentation closes the gap.`;
    } else {
      propensityToDeny = 40;
      rationale = `Criteria-gated policy applies; no ICD-10 code list published, so medical-necessity documentation must be reviewed manually.`;
    }
  } else if (paListMatch) {
    outcome = 'pa-required-list';
    requiresPA = true;
    propensityToDeny = 35;
    deficiencies.push({
      kind: 'missing-documentation',
      detail: `${order.code} appears on the ${paListMatch.source} ${paListMatch.category ?? ''} prior-authorization list — a PA request with clinical documentation is required before the service.`,
    });
    rationale = `Service ${order.code} requires prior authorization because it is on the payer's PA-required list (${paListMatch.category ?? 'listed'}).`;
  } else {
    outcome = 'no-policy-found';
    requiresPA = false;
    propensityToDeny = 10;
    rationale = `No policy in the loaded library governs ${order.code}. Confirm against the member's specific plan documents before assuming no PA is required.`;
  }

  return {
    order,
    memberId: member.memberId,
    outcome,
    requiresPA,
    criteriaMet,
    matchedPolicies: matches,
    indicationsConsidered,
    deficiencies,
    propensityToDeny,
    rationale,
  };
}
