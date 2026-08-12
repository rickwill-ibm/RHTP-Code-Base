/**
 * fhir-evaluator.mjs
 *
 * Given a PolicyDefinition (from the ingestor) and a patient's FHIR data,
 * evaluates each criterion group against live FHIR queries and produces a
 * DtrMatchResult — the exact shape the PA app's DTR view expects.
 *
 * Each group's result now carries both sides of the DTR "logic tree" screen:
 *   - the policy requirement (description, fhirQuery, sourceExcerpt) — the
 *     same fields the Review Policy Logic screen already shows a clinical
 *     reviewer, reused here so the ordering provider sees the identical rule
 *     text instead of a bare code list
 *   - the patient-record match (leaf), enriched with Date of Service and
 *     performing provider when the matched FHIR resource actually carries
 *     that provenance (a linked Encounter, or a recorder/performer/asserter
 *     reference) — never fabricated when the resource has none
 */

import { fhirSearch, fhirRead, mostRecentFirst } from "./fhir-client.mjs";

const EMR_FHIR_BASE   = process.env.EMR_FHIR_BASE   ?? "http://localhost:8080/fhir";
const PAYER_FHIR_BASE = process.env.PAYER_FHIR_BASE  ?? "http://localhost:8082/fhir";

/**
 * evaluatePolicy — evaluate all criterion groups for a patient against FHIR.
 *
 * Returns a DtrMatchResult matching the PA app's pa-types.ts shape:
 * {
 *   policyTitle, cptCode, allMet,
 *   groups: [{ id, title, required, description, fhirQuery, sourceExcerpt,
 *              status, leaf?, candidateCodes?, uploadedEvidence? }]
 * }
 */
export async function evaluatePolicy(policy, patientId, cptCode, emrToken) {
  console.log(`[PolicyEvaluator] Evaluating ${policy.policyId} for patient ${patientId}`);

  const groups = [];

  for (const criterion of policy.criteriaGroups ?? []) {
    const result = await evaluateCriterion(criterion, patientId, emrToken);
    groups.push(result);
  }

  const allMet = groups.every((g) => !g.required || g.status === "met");

  return {
    policyTitle: `${policy.policyTitle} (CPT ${cptCode})`,
    cptCode,
    groups,
    allMet,
    policyId: policy.policyId,
    payer: policy.payer,
  };
}

/**
 * evaluateCriterion — query FHIR for one criterion group, then enrich
 * whatever it finds with Date of Service / performing provider before
 * returning both the requirement and the match to the caller.
 */
async function evaluateCriterion(criterion, patientId, emrToken) {
  const { id, title, required = true, description, fhirQuery, sourceExcerpt, candidateCodes = [], documentationRequired } = criterion;

  // Carried on every return path — this is the "left column" (policy
  // requirement) content, identical to what the Review Policy Logic screen
  // shows for the same group, so a provider reading DTR sees the same rule
  // a clinical reviewer already verified against the source document.
  const requirement = { id, title, required, description, fhirQuery, sourceExcerpt, documentationRequired };

  try {
    // Build FHIR search params
    const params = { patient: patientId };

    if (fhirQuery?.codes?.length) {
      const systemPrefix = fhirQuery.system
        ? `${fhirQuery.system}|`
        : "";
      params[fhirQuery.searchParam ?? "code"] = fhirQuery.codes
        .map((c) => `${systemPrefix}${c}`)
        .join(",");
    }

    // Try EMR first, then payer — track which base actually produced the
    // match (not just which was tried first) so the source badge shown to
    // the provider is accurate.
    let resources = [];
    let matchedBase = null;
    let matchedSource = null; // "emr" | "pa"

    try {
      const emrResources = await fhirSearch(EMR_FHIR_BASE, fhirQuery?.resourceType ?? "Condition", params, emrToken);
      if (emrResources.length > 0) {
        resources = emrResources;
        matchedBase = EMR_FHIR_BASE;
        matchedSource = "emr";
      }
    } catch (e) {
      console.warn(`[PolicyEvaluator] EMR query failed for group ${id}: ${e.message}`);
    }

    // If not found in EMR, try payer Patient Access
    if (resources.length === 0 && fhirQuery?.resourceType === "Condition") {
      try {
        // Map patient id to payer patient id (convention: append -payer)
        const payerParams = { ...params, patient: `${patientId}-payer` };
        const payerResources = await fhirSearch(PAYER_FHIR_BASE, "Condition", payerParams, emrToken);
        if (payerResources.length > 0) {
          resources = payerResources;
          matchedBase = PAYER_FHIR_BASE;
          matchedSource = "pa";
        }
      } catch {}
    }

    if (resources.length > 0) {
      // Prefer the most clinically recent match rather than whatever order
      // the FHIR server happened to return — mostRecentFirst() already
      // existed for this but was never actually called anywhere.
      const resource = mostRecentFirst(resources)[0];
      const coding = extractCoding(resource);
      const evidence = extractEvidence(resource);
      const enrichment = await enrichEvidence(matchedBase, resource, emrToken);

      // For Observations, check value comparison if required
      if (fhirQuery?.resourceType === "Observation" && fhirQuery.valueComparison) {
        const value = resource.valueQuantity?.value;
        if (value !== undefined) {
          const met = evaluateComparison(value, fhirQuery.valueComparison);
          if (!met) {
            return {
              ...requirement, status: "gap",
              candidateCodes,
              uploadedEvidence: null,
              fhirDetail: `${fhirQuery.resourceType} found but value ${value} does not satisfy ${fhirQuery.valueComparison}`,
            };
          }
          return {
            ...requirement, status: "met",
            leaf: {
              code: coding?.code ?? "obs",
              label: coding?.display ?? title,
              evidence: `${evidence} — value: ${value} ${resource.valueQuantity?.unit ?? ""}`,
              source: matchedSource,
              resourceType: resource.resourceType,
              recordedDate: extractDate(resource),
              ...enrichment,
            },
          };
        }
      }

      return {
        ...requirement, status: "met",
        leaf: {
          code: coding?.code ?? "found",
          label: coding?.display ?? title,
          evidence,
          source: matchedSource,
          resourceType: resource.resourceType,
          recordedDate: extractDate(resource),
          ...enrichment,
        },
      };
    }

    // Criterion GAP
    return {
      ...requirement, status: "gap",
      candidateCodes,
      uploadedEvidence: null,
      fhirDetail: `No matching ${fhirQuery?.resourceType ?? "resource"} found in EMR or payer data`,
    };

  } catch (err) {
    console.error(`[PolicyEvaluator] Error evaluating group ${id}:`, err.message);
    return {
      ...requirement, status: "gap",
      candidateCodes,
      uploadedEvidence: null,
      fhirDetail: `Evaluation error: ${err.message}`,
    };
  }
}

// ── Evidence enrichment (Date of Service / performing provider) ─────────────

/**
 * enrichEvidence — resolve Date of Service and performing provider for a
 * matched resource, when it actually carries that provenance. Never
 * fabricates a date or provider the resource doesn't have.
 *
 * DOS preference order: the matched resource's linked Encounter.period.start
 * (a real visit date) over the resource's own recordedDate/onsetDate (when
 * it was charted) — those are genuinely different things and are kept as
 * separate fields (dateOfService vs recordedDate) rather than conflated.
 */
async function enrichEvidence(base, resource, token) {
  let dateOfService = null;
  let performerName = null;
  let performerReference = null;
  const encounterReference = resource.encounter?.reference ?? null;

  if (encounterReference && base) {
    try {
      const [, encId] = encounterReference.split("/");
      const encounter = await fhirRead(base, "Encounter", encId, token);
      dateOfService = encounter.period?.start ?? encounter.period?.end ?? null;
      const participant = encounter.participant?.[0]?.individual;
      if (participant?.reference) {
        performerReference = participant.reference;
        // The seeded Encounter already inlines a display name on the
        // participant reference — cheap to use directly. Falls back to a
        // Practitioner lookup only if a real EHR doesn't inline one.
        performerName = participant.display ?? (await resolvePractitionerName(base, participant.reference, token));
      }
    } catch (e) {
      console.warn(`[PolicyEvaluator] Could not resolve encounter ${encounterReference}: ${e.message}`);
    }
  }

  if (!performerName && base) {
    const provider = firstProviderReference(resource);
    if (provider?.reference) {
      performerReference = performerReference ?? provider.reference;
      performerName = provider.display ?? (await resolvePractitionerName(base, provider.reference, token));
    }
  }

  return { dateOfService, performerName, performerReference, encounterReference };
}

/** Finds whichever provenance reference a resource actually carries —
 * different resource types use different fields for "who recorded/performed
 * this." Returns null (not a guess) when none exist. */
function firstProviderReference(resource) {
  if (resource.recorder?.reference) return resource.recorder;
  if (resource.asserter?.reference) return resource.asserter;
  if (Array.isArray(resource.performer) && resource.performer.length > 0) {
    const p = resource.performer[0];
    return p.actor?.reference ? p.actor : p.reference ? p : null;
  }
  if (resource.performer?.reference) return resource.performer;
  return null;
}

async function resolvePractitionerName(base, reference, token) {
  if (!reference) return null;
  const [resourceType, id] = String(reference).split("/");
  if (resourceType !== "Practitioner" || !id) return null;
  try {
    const practitioner = await fhirRead(base, "Practitioner", id, token);
    return formatPractitionerName(practitioner);
  } catch (e) {
    console.warn(`[PolicyEvaluator] Could not resolve practitioner ${reference}: ${e.message}`);
    return null;
  }
}

function formatPractitionerName(practitioner) {
  const name = practitioner?.name?.[0];
  if (!name) return null;
  const given = (name.given ?? []).join(" ");
  const family = name.family ?? "";
  const suffix = (name.suffix ?? []).join(", ");
  const full = [given, family].filter(Boolean).join(" ");
  if (!full) return null;
  return suffix ? `${full}, ${suffix}` : full;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractCoding(resource) {
  return (
    resource.code?.coding?.[0] ??
    resource.valueCodeableConcept?.coding?.[0] ??
    null
  );
}

/** The resource's own date field — when it was charted/recorded, NOT
 * necessarily the date of the actual clinical encounter/service. */
function extractDate(resource) {
  return resource.effectiveDateTime ?? resource.recordedDate ?? resource.onsetDateTime ?? resource.authoredOn ?? null;
}

function extractEvidence(resource) {
  const date = extractDate(resource);
  const type = resource.resourceType;
  if (type === "Observation" && resource.valueQuantity) {
    return `${resource.valueQuantity.value} ${resource.valueQuantity.unit}${date ? ` (${date})` : ""}`;
  }
  if (date) return `Documented ${date}`;
  return `${type} on record`;
}

function evaluateComparison(value, comparison) {
  const match = comparison.trim().match(/^(>=|<=|>|<|=)\s*(\d+(\.\d+)?)$/);
  if (!match) return true; // can't parse → assume met
  const [, op, threshold] = match;
  const t = parseFloat(threshold);
  switch (op) {
    case ">=": return value >= t;
    case "<=": return value <= t;
    case ">":  return value > t;
    case "<":  return value < t;
    case "=":  return value === t;
    default:   return true;
  }
}
