/**
 * Structured medical-necessity criteria (increment GT-9 / #3) — a CQL-style seam.
 *
 * The shipped engine screens medical necessity by an ICD-10 covered-set match.
 * Real policies have richer logic ("indication A requires a supporting diagnosis
 * AND a failed prior therapy"). This module models criteria as a small,
 * composable predicate tree that a rules author (or a CQL importer) can populate,
 * and evaluates a member's facts against it.
 *
 * Pure + deterministic. The example ruleset below is a hand-authored PROOF OF
 * CONCEPT for Aetna CPB #0520 and MUST be clinically SME-reviewed before use —
 * it is not a substitute for the full policy text.
 */

export type Predicate =
  | { kind: 'hasDiagnosisIn'; icd10: string[] } // member carries a dx sharing a ≥3-char root
  | { kind: 'ageAtLeast'; years: number }
  | { kind: 'ageBelow'; years: number }
  | { kind: 'priorTherapyFailed'; therapy: string }
  | { kind: 'all'; of: Predicate[] }
  | { kind: 'any'; of: Predicate[] }
  | { kind: 'not'; of: Predicate };

export interface CriteriaRule {
  indication: string; // e.g. "A. Thoracic aortic disease"
  predicate: Predicate;
}

export interface CriteriaSet {
  policyId: string;
  number?: string;
  smeReviewed: boolean; // gate: never auto-approve on an unreviewed set
  rules: CriteriaRule[];
}

export interface CriteriaMemberFacts {
  diagnoses: { code?: string }[];
  ageYears?: number;
  priorTherapies?: string[]; // free-text therapy identifiers the member has failed
}

export interface CriteriaEvaluation {
  met: boolean; // any rule satisfied
  smeReviewed: boolean;
  satisfiedIndications: string[];
  evaluatedIndications: string[];
}

function normIcd(code: string): string {
  return code.toUpperCase().replace(/\./g, '');
}
function icdShares(memberCode: string, target: string): boolean {
  const a = normIcd(memberCode);
  const b = normIcd(target);
  if (a.length < 3 || b.length < 3) return false;
  return a.slice(0, 3) === b.slice(0, 3) && (a === b || a.startsWith(b) || b.startsWith(a));
}

export function evaluatePredicate(p: Predicate, facts: CriteriaMemberFacts): boolean {
  switch (p.kind) {
    case 'hasDiagnosisIn':
      return facts.diagnoses.some((d) =>
        d.code ? p.icd10.some((t) => icdShares(d.code as string, t)) : false
      );
    case 'ageAtLeast':
      return typeof facts.ageYears === 'number' && facts.ageYears >= p.years;
    case 'ageBelow':
      return typeof facts.ageYears === 'number' && facts.ageYears < p.years;
    case 'priorTherapyFailed':
      return (facts.priorTherapies ?? []).some((t) => t.toLowerCase() === p.therapy.toLowerCase());
    case 'all':
      return p.of.every((q) => evaluatePredicate(q, facts));
    case 'any':
      return p.of.some((q) => evaluatePredicate(q, facts));
    case 'not':
      return !evaluatePredicate(p.of, facts);
    default:
      return false;
  }
}

export function evaluateCriteria(set: CriteriaSet, facts: CriteriaMemberFacts): CriteriaEvaluation {
  const satisfied = set.rules
    .filter((r) => evaluatePredicate(r.predicate, facts))
    .map((r) => r.indication);
  return {
    met: satisfied.length > 0,
    smeReviewed: set.smeReviewed,
    satisfiedIndications: satisfied,
    evaluatedIndications: set.rules.map((r) => r.indication),
  };
}

/**
 * PROOF OF CONCEPT criteria for Aetna Cardiac MRI CPB #0520. Encodes a few
 * indications as structured rules (beyond the covered-set screen). NOT
 * SME-reviewed — `smeReviewed: false` blocks auto-approval on this set.
 */
export const CARDIAC_MRI_0520_CRITERIA: CriteriaSet = {
  policyId: 'aetna-cpb-0520',
  number: '0520',
  smeReviewed: false,
  rules: [
    { indication: 'M. Cardiomyopathy', predicate: { kind: 'hasDiagnosisIn', icd10: ['I42'] } },
    {
      indication: 'N. Myocarditis',
      predicate: { kind: 'hasDiagnosisIn', icd10: ['I40', 'I41', 'I51.4'] },
    },
    {
      indication: 'H. Atrial fibrillation with a failed rate-control therapy',
      predicate: {
        kind: 'all',
        of: [
          { kind: 'hasDiagnosisIn', icd10: ['I48'] },
          { kind: 'priorTherapyFailed', therapy: 'rate-control' },
        ],
      },
    },
    {
      indication: 'F. Congenital heart disease (pediatric)',
      predicate: { kind: 'ageBelow', years: 18 },
    },
  ],
};
