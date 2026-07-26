/**
 * Eligibility stage (increment GT-6).
 *
 * Stage 1 of the Golden Thread: confirm active coverage and answer "does this
 * service require PA?" using the Policy Engine determination (net of any
 * gold-card exemption). Pure; projects to a small view model.
 */
export interface CoverageInfo {
  status: string; // "active" | …
  payer: string;
  plan?: string;
  type?: string;
}

export interface EligibilityVM {
  active: boolean;
  payer: string;
  plan?: string;
  type?: string;
  requiresPA: boolean;
  goldCardApplied: boolean;
  note: string;
}

export function runEligibility(
  coverage: CoverageInfo,
  input: { requiresPA: boolean; goldCardApplied: boolean }
): EligibilityVM {
  const active = coverage.status?.toLowerCase() === 'active';
  const note = !active
    ? 'Coverage is not active — resolve eligibility before proceeding.'
    : input.goldCardApplied
      ? 'Active coverage. Provider is gold-carded for this service — PA exempt.'
      : input.requiresPA
        ? 'Active coverage. This service requires prior authorization.'
        : 'Active coverage. No prior authorization required for this service.';
  return {
    active,
    payer: coverage.payer,
    plan: coverage.plan,
    type: coverage.type,
    requiresPA: input.goldCardApplied ? false : input.requiresPA,
    goldCardApplied: input.goldCardApplied,
    note,
  };
}
