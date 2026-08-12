/**
 * fhir-client.mjs — typed FHIR R4 fetch for the policy engine.
 */

/**
 * fhirSearch — GET a FHIR search bundle.
 * Returns the array of matching resources (unwraps Bundle.entry[].resource).
 */
export async function fhirSearch(base, resourceType, params, token) {
  const qs = new URLSearchParams(params).toString();
  const url = `${base.replace(/\/$/, "")}/${resourceType}?${qs}`;
  const headers = { Accept: "application/fhir+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`FHIR ${res.status} GET ${url}`);
  const bundle = await res.json();
  return (bundle.entry ?? []).map((e) => e.resource).filter(Boolean);
}

/**
 * fhirRead — GET a single FHIR resource by id.
 */
export async function fhirRead(base, resourceType, id, token) {
  const url = `${base.replace(/\/$/, "")}/${resourceType}/${id}`;
  const headers = { Accept: "application/fhir+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`FHIR ${res.status} GET ${url}`);
  return res.json();
}

/**
 * mostRecentFirst — sort FHIR resources by effectiveDateTime / recordedDate / onsetDateTime descending.
 */
export function mostRecentFirst(resources) {
  return [...resources].sort((a, b) => {
    const da = a.effectiveDateTime ?? a.recordedDate ?? a.onsetDateTime ?? "";
    const db = b.effectiveDateTime ?? b.recordedDate ?? b.onsetDateTime ?? "";
    return db.localeCompare(da);
  });
}
