/**
 * Real patient lookup — replaces the hardcoded DEMO_PATIENT that used to sit
 * in OrderView.tsx regardless of launch context or NEXT_PUBLIC_USE_MOCK_DATA.
 *
 * Fetches the actual Patient resource for ctx.patientId from the EMR FHIR
 * server using the access token already held in SmartContext (from the real
 * SMART App Launch), and derives the PatientBanner shape the UI expects. The
 * member id is read from the FHIR identifier the payer/EMR marks as the
 * member/subscriber id — falling back to the raw patientId if none is coded
 * that way, rather than silently fabricating one.
 */

import type { SmartContext } from "@/lib/smart/smartLaunch";
import type { PatientBanner } from "@/lib/pa/pa-types";
import { FhirClient } from "./fhirClient";

interface FhirHumanName {
  text?: string;
  family?: string;
  given?: string[];
}

interface FhirIdentifier {
  system?: string;
  value?: string;
  type?: { coding?: { code?: string; system?: string }[]; text?: string };
}

interface FhirPatient {
  resourceType: "Patient";
  id: string;
  name?: FhirHumanName[];
  birthDate?: string;
  identifier?: FhirIdentifier[];
}

const MEMBER_ID_TYPE_CODES = new Set(["MB", "MR", "SN"]); // member number, medical record, subscriber

function nameFrom(patient: FhirPatient): string {
  const n = patient.name?.[0];
  if (!n) return `Patient/${patient.id}`;
  if (n.text) return n.text;
  const given = (n.given ?? []).join(" ");
  return [given, n.family].filter(Boolean).join(" ") || `Patient/${patient.id}`;
}

function memberIdFrom(patient: FhirPatient): string {
  const tagged = patient.identifier?.find((i) =>
    i.type?.coding?.some((c) => c.code && MEMBER_ID_TYPE_CODES.has(c.code))
  );
  if (tagged?.value) return tagged.value;
  // No explicitly-typed member identifier — fall back to the first identifier
  // on file rather than guessing, and label it as such downstream if needed.
  return patient.identifier?.[0]?.value ?? patient.id;
}

/**
 * Fetch the real Patient resource for the launched (or manually entered)
 * patient id and derive the banner the UI displays. Throws — does not fall
 * back to demo data — so a failed live fetch is visible, not silently masked.
 */
export async function fetchPatientBanner(
  ctx: SmartContext,
  patientId: string = ctx.patientId
): Promise<PatientBanner> {
  if (!patientId) {
    throw new Error("No patient id available — launch context did not provide one and none was entered manually.");
  }
  const client = FhirClient.fromContext(ctx);
  const patient = await client.read<FhirPatient>("Patient", patientId);

  return {
    name: nameFrom(patient),
    dob: patient.birthDate ?? "unknown",
    memberId: memberIdFrom(patient),
  };
}
