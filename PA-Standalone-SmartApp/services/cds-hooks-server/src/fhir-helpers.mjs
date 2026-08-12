/**
 * fhir-helpers.mjs — lightweight FHIR R4 fetch utilities.
 */

export async function fhirGet(base, path, token) {
  const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const headers = { "Accept": "application/fhir+json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`FHIR ${res.status} GET ${url}`);
  return res.json();
}

/**
 * fetchActiveCoverage — returns the first active Coverage for a patient.
 */
export async function fetchActiveCoverage(emrBase, patientId, token) {
  const bundle = await fhirGet(emrBase, `Coverage?patient=${patientId}&status=active`, token);
  return bundle.entry?.[0]?.resource ?? null;
}

/**
 * extractCptCodesFromBundle — pulls CPT codes from a draftOrders Bundle entry list.
 */
export function extractCptCodes(draftOrders) {
  const codes = [];
  for (const entry of draftOrders?.entry ?? []) {
    const res = entry.resource;
    if (!res) continue;
    for (const coding of res.code?.coding ?? []) {
      if (coding.system?.includes("cpt") || coding.system?.includes("ama-assn")) {
        codes.push(coding.code);
      }
    }
  }
  return codes;
}
