/**
 * FHIR → thread inputs (increment #1).
 *
 * Projects the resources the BFF reads for a member+order (Patient, Coverage,
 * Condition[], ServiceRequest) into the thread's inputs: MemberContext,
 * StageOrder, and CoverageInfo. Reuses the policy FHIR projections so ICD-10 vs
 * SNOMED handling is identical. Pure.
 */
import { toMemberContext, serviceRequestToOrder, type MemberContext } from '@/lib/policy';
import type { StageOrder } from './medicalNecessity';
import type { CoverageInfo } from './eligibility';

interface CodeableConcept {
  text?: string;
  coding?: { system?: string; code?: string; display?: string }[];
}
interface FhirCoverage {
  status?: string;
  type?: CodeableConcept;
  payor?: { display?: string }[];
  class?: { type?: CodeableConcept; name?: string }[];
}
interface FhirServiceRequest {
  code?: CodeableConcept;
  requester?: { identifier?: { value?: string }; display?: string };
  performer?: { identifier?: { value?: string } }[];
}

export interface ThreadInputs {
  member: MemberContext;
  order: StageOrder;
  coverage: CoverageInfo;
}

export function coverageToInfo(cov: FhirCoverage | undefined): CoverageInfo {
  return {
    status: cov?.status ?? 'unknown',
    payer: cov?.payor?.[0]?.display ?? 'Unknown payer',
    plan: cov?.class?.find((c) => c.type?.coding?.some((x) => x.code === 'plan'))?.name,
    type: cov?.type?.text ?? cov?.type?.coding?.[0]?.display,
  };
}

/** Extract a provider NPI from a ServiceRequest requester/performer identifier. */
export function providerNpiFrom(sr: FhirServiceRequest | undefined, fallback = 'unknown'): string {
  return (
    sr?.requester?.identifier?.value ??
    sr?.performer?.find((p) => p.identifier?.value)?.identifier?.value ??
    fallback
  );
}

export function projectThreadInputs(args: {
  memberId: string;
  conditions: { code?: CodeableConcept }[];
  serviceRequest: FhirServiceRequest;
  coverage?: FhirCoverage;
  providerNpi?: string;
}): ThreadInputs {
  const coverageInfo = coverageToInfo(args.coverage);
  const orderBase = serviceRequestToOrder(args.serviceRequest);
  const order: StageOrder = {
    code: orderBase.code,
    codeSystem: orderBase.codeSystem,
    display: orderBase.display,
    providerNpi: args.providerNpi ?? providerNpiFrom(args.serviceRequest),
    payer: coverageInfo.payer,
  };
  return {
    member: toMemberContext(args.memberId, args.conditions, {
      payer: coverageInfo.payer,
      plan: coverageInfo.plan,
    }),
    order,
    coverage: coverageInfo,
  };
}
