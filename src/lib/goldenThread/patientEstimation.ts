/**
 * Patient Estimation stage (increment GT-6).
 *
 * Stage 4 of the Golden Thread: a Good Faith Estimate (No Surprises Act) for the
 * member's out-of-pocket cost, plus a transparent propensity-to-pay band. Pure
 * and deterministic — uses a supplied benefit design + a mock allowed-amount
 * table; no wall-clock or external calls. Decision-support only.
 */
export interface BenefitDesign {
  deductibleRemaining: number; // $ remaining before coverage pays
  coinsuranceRate: number; // 0..1 member share after deductible
  copay?: number; // flat copay if applicable
  outOfPocketRemaining: number; // $ until OOP max
}

export interface EstimateInput {
  code: string;
  display?: string;
  allowedAmount: number; // negotiated/allowed amount for the service
  benefit: BenefitDesign;
}

export type PayPropensityBand = 'low' | 'medium' | 'high';

export interface PatientEstimateVM {
  code: string;
  display?: string;
  allowedAmount: number;
  appliedToDeductible: number;
  coinsurance: number;
  copay: number;
  memberResponsibility: number;
  planPays: number;
  propensityToPay: { band: PayPropensityBand; note: string };
  disclaimer: string;
}

const DISCLAIMER =
  'Good Faith Estimate (No Surprises Act) — an estimate, not a bill. Actual cost depends on services rendered and final adjudication.';

/** Mock allowed amounts for demo services ($). */
export const MOCK_ALLOWED_AMOUNTS: Record<string, number> = {
  '72148': 1150, // MRI lumbar w/o contrast
  '75561': 2400, // cardiac MRI
  '70450': 700, // CT head w/o contrast
};

function payBand(
  memberResponsibility: number,
  oopRemaining: number
): {
  band: PayPropensityBand;
  note: string;
} {
  // Higher member responsibility relative to OOP headroom → lower propensity to pay.
  if (memberResponsibility <= 100)
    return { band: 'high', note: 'Low out-of-pocket — likely paid promptly.' };
  if (memberResponsibility <= 500 || memberResponsibility <= oopRemaining * 0.5)
    return { band: 'medium', note: 'Moderate out-of-pocket — offer payment options.' };
  return {
    band: 'low',
    note: 'High out-of-pocket — proactively offer a payment plan / financial counseling.',
  };
}

export function estimatePatientCost(input: EstimateInput): PatientEstimateVM {
  const { allowedAmount, benefit } = input;
  const appliedToDeductible = Math.min(allowedAmount, Math.max(0, benefit.deductibleRemaining));
  const afterDeductible = allowedAmount - appliedToDeductible;
  const copay = benefit.copay ?? 0;
  const coinsurance = Math.round(afterDeductible * benefit.coinsuranceRate);
  let memberResponsibility = appliedToDeductible + coinsurance + copay;
  // never exceed the member's remaining out-of-pocket maximum
  memberResponsibility = Math.min(memberResponsibility, benefit.outOfPocketRemaining);
  const planPays = Math.max(0, allowedAmount - memberResponsibility);

  return {
    code: input.code,
    display: input.display,
    allowedAmount,
    appliedToDeductible,
    coinsurance,
    copay,
    memberResponsibility,
    planPays,
    propensityToPay: payBand(memberResponsibility, benefit.outOfPocketRemaining),
    disclaimer: DISCLAIMER,
  };
}
