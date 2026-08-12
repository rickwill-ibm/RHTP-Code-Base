/**
 * FHIR → view-model projections (plan Slice 1 / blueprint §6.1).
 * Read-optimized, NON-authoritative. Raw FHIR is retained by the BFF for audit;
 * these VMs are for display only.
 */

// Minimal structural FHIR shapes (avoid inventing fields — see F-5).
interface Coding {
  system?: string;
  code?: string;
  display?: string;
}
interface CodeableConcept {
  text?: string;
  coding?: Coding[];
}
interface Reference {
  reference?: string;
  display?: string;
}

export interface CoverageVM {
  id: string;
  status: string;
  payer: string;
  type: string;
}
export function toCoverageVM(r: {
  id?: string;
  status?: string;
  type?: CodeableConcept;
  payor?: Reference[];
}): CoverageVM {
  return {
    id: r.id ?? '',
    status: r.status ?? 'unknown',
    payer: r.payor?.[0]?.display ?? 'Unknown payer',
    type: r.type?.text ?? codingText(r.type),
  };
}

export interface ConditionVM {
  id: string;
  display: string;
  clinicalStatus: string;
}
export function toConditionVM(r: {
  id?: string;
  code?: CodeableConcept;
  clinicalStatus?: CodeableConcept;
}): ConditionVM {
  return {
    id: r.id ?? '',
    display: r.code?.text ?? codingText(r.code),
    clinicalStatus: codingText(r.clinicalStatus) || 'unknown',
  };
}

export type PaStatusLabel = 'approved' | 'denied' | 'pending' | 'unknown';
export interface PaStatusVM {
  id: string;
  status: PaStatusLabel;
  service: string;
  denialReasons: string[];
}
/** Project a FHIR ClaimResponse into a human-readable PA status. */
export function toPaStatusVM(r: {
  id?: string;
  outcome?: string;
  type?: CodeableConcept;
  disposition?: string;
  error?: { code?: CodeableConcept }[];
}): PaStatusVM {
  const status: PaStatusLabel =
    r.outcome === 'complete'
      ? 'approved'
      : r.outcome === 'error'
        ? 'denied'
        : r.outcome
          ? 'pending'
          : 'unknown';
  return {
    id: r.id ?? '',
    status,
    service: r.type?.text ?? codingText(r.type),
    denialReasons: (r.error ?? []).map((e) => e.code?.text ?? codingText(e.code)).filter(Boolean),
  };
}

function codingText(c?: CodeableConcept): string {
  return c?.text ?? c?.coding?.[0]?.display ?? c?.coding?.[0]?.code ?? '';
}
