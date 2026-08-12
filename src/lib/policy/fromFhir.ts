/**
 * FHIR → Policy Engine input projections (Policy Engine increment PE-5).
 *
 * Turns the resources the BFF already reads (Condition, Coverage,
 * ServiceRequest) into the engine's {@link MemberContext} / {@link OrderContext}.
 * ICD-10 codings are surfaced as `code` (so criteria matching works); other
 * systems (SNOMED) are surfaced as `display` only, so they are never mistaken
 * for an ICD-10 match.
 */
import type { MemberContext, MemberDiagnosis, OrderContext } from './types';

interface Coding {
  system?: string;
  code?: string;
  display?: string;
}
interface CodeableConcept {
  text?: string;
  coding?: Coding[];
}

const ICD10_SYSTEMS = [
  'http://hl7.org/fhir/sid/icd-10-cm',
  'http://hl7.org/fhir/sid/icd-10',
  'urn:oid:2.16.840.1.113883.6.90',
];
const CPT_SYSTEMS = ['http://www.ama-assn.org/go/cpt', 'urn:oid:2.16.840.1.113883.6.12'];
const HCPCS_SYSTEMS = [
  'urn:oid:2.16.840.1.113883.6.285',
  'https://bluebutton.cms.gov/resources/codesystem/hcpcs',
];

function isIcd10(system?: string): boolean {
  return !!system && ICD10_SYSTEMS.some((s) => system.toLowerCase().startsWith(s));
}

export function conditionToDiagnosis(cond: { code?: CodeableConcept }): MemberDiagnosis {
  const codings = cond.code?.coding ?? [];
  const icd = codings.find((c) => isIcd10(c.system));
  return {
    code: icd?.code, // only when genuinely ICD-10
    display: cond.code?.text ?? codings[0]?.display ?? icd?.display,
  };
}

export function toMemberContext(
  memberId: string,
  conditions: { code?: CodeableConcept }[],
  opts?: { payer?: string; plan?: string }
): MemberContext {
  return {
    memberId,
    payer: opts?.payer,
    plan: opts?.plan,
    diagnoses: conditions.map(conditionToDiagnosis),
  };
}

export function serviceRequestToOrder(sr: { code?: CodeableConcept }): OrderContext {
  const codings = sr.code?.coding ?? [];
  const cpt = codings.find((c) => CPT_SYSTEMS.some((s) => (c.system ?? '').startsWith(s)));
  const hcpcs = codings.find((c) => HCPCS_SYSTEMS.some((s) => (c.system ?? '').startsWith(s)));
  const chosen = cpt ?? hcpcs ?? codings[0];
  return {
    code: chosen?.code ?? '',
    codeSystem: cpt ? 'CPT' : hcpcs ? 'HCPCS' : undefined,
    display: sr.code?.text ?? chosen?.display,
  };
}
