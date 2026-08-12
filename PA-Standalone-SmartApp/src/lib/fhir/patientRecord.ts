/**
 * Full patient chart — unfiltered, cross-resource-type lookup, distinct from
 * DTR's narrow queries.
 *
 * DTR (services/policy-engine/src/fhir-evaluator.mjs) only ever asks for the
 * specific code-filtered resources a policy criterion group cares about
 * (`?patient=X&code=A,B`), so a gap can mean "not documented" or it can mean
 * "documented, but not what this one policy rule happened to look for." This
 * module answers a different question — "what does this patient's chart
 * actually contain" — by querying every resource type below with only a
 * `patient` filter, no `code` filter. The mock FHIR server's generic search
 * route (services/mock-fhir-server/src/index.mjs) only requires `patient`;
 * `code` has always been optional there, this is just the first caller that
 * takes advantage of that.
 *
 * Resource types are scoped to what current seed data (the real Rachel Green
 * bundles + infra/seed/generate-patient.mjs) can actually populate, so every
 * section rendered has a real chance of showing data — empty sections are
 * simply omitted rather than shown as permanent blanks.
 */

import type { SmartContext } from "@/lib/smart/smartLaunch";
import { FhirClient } from "./fhirClient";

export interface PatientRecordItem {
  id: string;
  resourceType: string;
  code: string | null;
  display: string;
  date: string | null;
  status: string | null;
  performerName: string | null;
  source: "emr" | "pa";
}

export interface PatientRecordSection {
  resourceType: string;
  label: string;
  items: PatientRecordItem[];
}

interface FhirBundle {
  resourceType: "Bundle";
  total?: number;
  entry?: { resource: Record<string, unknown> }[];
}

// resourceType -> human section label. Order here is display order.
const RESOURCE_TYPES: { resourceType: string; label: string }[] = [
  { resourceType: "Condition", label: "Conditions" },
  { resourceType: "Observation", label: "Observations" },
  { resourceType: "Procedure", label: "Procedures" },
  { resourceType: "Encounter", label: "Encounters" },
  { resourceType: "MedicationRequest", label: "Medications" },
  { resourceType: "DiagnosticReport", label: "Diagnostic Reports" },
  { resourceType: "Immunization", label: "Immunizations" },
  { resourceType: "AllergyIntolerance", label: "Allergies" },
  { resourceType: "Coverage", label: "Coverage" },
];

/**
 * Fetch the patient's full chart: every resource type in RESOURCE_TYPES,
 * queried by patient only (no code filter). Tries EMR first for each type;
 * if EMR returns nothing, falls back to payer Patient Access — the same
 * EMR-then-payer fallback fhir-evaluator.mjs already uses for DTR matching,
 * reused here for consistency. Types that come back empty from both are
 * simply left out of the result, not rendered as empty sections.
 */
export async function fetchPatientRecord(
  ctx: SmartContext,
  patientId: string = ctx.patientId
): Promise<PatientRecordSection[]> {
  const emrClient = FhirClient.fromContext(ctx);
  const payerClient = FhirClient.forPayer(ctx);

  const sections = await Promise.all(
    RESOURCE_TYPES.map(async ({ resourceType, label }) => {
      let items = await searchOne(emrClient, resourceType, patientId, "emr");
      if (items.length === 0) {
        items = await searchOne(payerClient, resourceType, patientId, "pa");
      }
      return { resourceType, label, items: mostRecentFirst(items) };
    })
  );

  return sections.filter((s) => s.items.length > 0);
}

async function searchOne(
  client: FhirClient,
  resourceType: string,
  patientId: string,
  source: "emr" | "pa"
): Promise<PatientRecordItem[]> {
  try {
    const bundle = await client.search<FhirBundle>(resourceType, { patient: patientId });
    return (bundle.entry ?? []).map((e) => toItem(e.resource, resourceType, source));
  } catch {
    // A resource type this FHIR server doesn't recognize, or a transient
    // failure, shouldn't blank out the whole chart — just omit that section.
    return [];
  }
}

function toItem(resource: Record<string, unknown>, resourceType: string, source: "emr" | "pa"): PatientRecordItem {
  const { code, display } = extractLabel(resource, resourceType);
  return {
    id: String(resource.id ?? ""),
    resourceType,
    code,
    display,
    date: extractDate(resource),
    status: (resource.status as string) ?? (resource.clinicalStatus as { coding?: { code?: string }[] })?.coding?.[0]?.code ?? null,
    performerName: extractPerformerName(resource),
    source,
  };
}

interface Coding {
  code?: string;
  display?: string;
  system?: string;
}
interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

function firstCoding(cc: CodeableConcept | undefined): Coding | undefined {
  return cc?.coding?.[0];
}

function labelFrom(cc: CodeableConcept | undefined, fallback: string): { code: string | null; display: string } {
  const coding = firstCoding(cc);
  return {
    code: coding?.code ?? null,
    display: cc?.text ?? coding?.display ?? fallback,
  };
}

function extractLabel(resource: Record<string, unknown>, resourceType: string): { code: string | null; display: string } {
  switch (resourceType) {
    case "Condition":
    case "Procedure":
    case "DiagnosticReport":
    case "AllergyIntolerance":
      return labelFrom(resource.code as CodeableConcept, resourceType);
    case "Observation": {
      const base = labelFrom(resource.code as CodeableConcept, "Observation");
      const vq = resource.valueQuantity as { value?: number; unit?: string } | undefined;
      if (vq?.value !== undefined) {
        return { ...base, display: `${base.display} — ${vq.value}${vq.unit ? ` ${vq.unit}` : ""}` };
      }
      const vcc = resource.valueCodeableConcept as CodeableConcept | undefined;
      if (vcc) {
        const v = labelFrom(vcc, "");
        return { ...base, display: v.display ? `${base.display} — ${v.display}` : base.display };
      }
      return base;
    }
    case "MedicationRequest":
      return labelFrom(resource.medicationCodeableConcept as CodeableConcept, "Medication");
    case "Immunization":
      return labelFrom(resource.vaccineCode as CodeableConcept, "Immunization");
    case "Encounter": {
      const types = resource.type as CodeableConcept[] | undefined;
      const t = labelFrom(types?.[0], "");
      const cls = resource.class as Coding | undefined;
      return { code: t.code, display: t.display || cls?.display || "Encounter" };
    }
    case "Coverage": {
      const payor = resource.payor as { display?: string }[] | undefined;
      const network = resource.network as string | undefined;
      return { code: null, display: payor?.[0]?.display ?? network ?? "Coverage" };
    }
    default:
      return { code: null, display: resourceType };
  }
}

function extractDate(resource: Record<string, unknown>): string | null {
  const period = resource.period as { start?: string } | undefined;
  const performedPeriod = resource.performedPeriod as { start?: string } | undefined;
  return (
    (resource.effectiveDateTime as string) ??
    (resource.performedDateTime as string) ??
    (resource.occurrenceDateTime as string) ??
    (resource.recordedDate as string) ??
    (resource.onsetDateTime as string) ??
    (resource.authoredOn as string) ??
    period?.start ??
    performedPeriod?.start ??
    null
  );
}

function extractPerformerName(resource: Record<string, unknown>): string | null {
  // Inline `.display` only — no separate Practitioner resolution here. This
  // is a broad, single-pass chart summary across up to 9 resource types; the
  // per-criterion DTR match screen already does the fuller Practitioner
  // lookup (fhir-evaluator.mjs's enrichEvidence) for the handful of matched
  // resources that actually feed a submission, which is where a resolved
  // name matters most. Showing nothing here (rather than fabricating a name)
  // when only a bare reference exists is intentional.
  const participant = resource.participant as { individual?: { display?: string } }[] | undefined;
  const performer = resource.performer as ({ display?: string; actor?: { display?: string } } | { reference?: string; display?: string })[] | undefined;
  const recorder = resource.recorder as { display?: string } | undefined;
  const asserter = resource.asserter as { display?: string } | undefined;
  const requester = resource.requester as { display?: string } | undefined;

  return (
    participant?.[0]?.individual?.display ??
    (performer?.[0] as { display?: string; actor?: { display?: string } } | undefined)?.display ??
    (performer?.[0] as { actor?: { display?: string } } | undefined)?.actor?.display ??
    recorder?.display ??
    asserter?.display ??
    requester?.display ??
    null
  );
}

function mostRecentFirst(items: PatientRecordItem[]): PatientRecordItem[] {
  return [...items].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
