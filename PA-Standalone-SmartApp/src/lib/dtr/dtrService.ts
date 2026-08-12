/**
 * DTR service — retrieves the Questionnaire Package for a procedure,
 * pulls clinical data from EMR + payer Patient Access API,
 * and executes CQL criteria matching to produce a DtrMatchResult.
 *
 * Live mode calls the Policy Engine at NEXT_PUBLIC_POLICY_ENGINE_URL (:8083).
 * The policy engine:
 *   1. Loads the structured policy (ingested via LLM from seed text)
 *   2. Queries EMR FHIR (:8080) for each criterion group
 *   3. Falls back to payer FHIR (:8082) if not found in EMR
 *   4. Returns a DtrMatchResult with met/gap status per group
 *
 * In mock mode a full bariatric-surgery scenario is returned without any
 * network calls.
 */

import type { SmartContext } from "@/lib/smart/smartLaunch";
import type { DtrMatchResult } from "@/lib/pa/pa-types";
import { findPolicyIdForCpt } from "./policyLookup";

const POLICY_ENGINE_URL =
  process.env.NEXT_PUBLIC_POLICY_ENGINE_URL ?? "http://localhost:8083";

export async function runDtrMatch(
  ctx: SmartContext,
  cptCode: string,
  procedureName: string
): Promise<DtrMatchResult> {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  if (useMock) {
    await new Promise((r) => setTimeout(r, 600));
    return getMockDtrResult(cptCode, procedureName);
  }

  // ── Live path — ask the Policy Engine which ingested policy (if any)
  // governs this CPT, rather than a hardcoded CPT→policy map. Whatever has
  // been run through POST /ingest/text (Intelligent Policy Engine LLM
  // extraction) or POST /ingest (seed file) is immediately eligible — no code
  // change needed here when a new policy is ingested.
  const policyId = await findPolicyIdForCpt(cptCode);
  if (!policyId) {
    // No policy ingested for this CPT — return a single gap group so the UI
    // is usable while the policy library is being built out.
    return {
      policyTitle: `${procedureName} — Medical Necessity Policy (CPT ${cptCode})`,
      cptCode,
      groups: [
        {
          id: 1,
          title: "Policy Not Yet Ingested",
          status: "gap",
          candidateCodes: [],
          uploadedEvidence: undefined,
        },
      ],
      allMet: false,
    };
  }

  const res = await fetch(`${POLICY_ENGINE_URL}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      policyId,
      patientId: ctx.patientId,
      cptCode,
      emrToken: ctx.accessToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Policy Engine /evaluate ${res.status}: ${text}`);
  }

  const data = (await res.json()) as DtrMatchResult;

  // Normalise: policy engine may return extra fields we don't know about yet
  // (e.g. fhirDetail, documentationRequired) — pass through everything the
  // DtrMatchResult/DtrGroup/DtrLeaf types actually declare, including the
  // policy-requirement fields (description/fhirQuery/sourceExcerpt) and the
  // evidence-enrichment fields (dateOfService/performerName/etc.) added for
  // the two-column DTR logic tree. All of these are optional on the type, so
  // a policy or a resource that doesn't carry them just omits them here too.
  return {
    policyTitle: data.policyTitle,
    cptCode: data.cptCode,
    allMet: data.allMet,
    groups: data.groups.map((g) => ({
      id: g.id,
      title: g.title,
      status: g.status,
      required: g.required,
      description: g.description,
      fhirQuery: g.fhirQuery,
      sourceExcerpt: g.sourceExcerpt,
      leaf: g.leaf,
      candidateCodes: g.candidateCodes,
      uploadedEvidence: g.uploadedEvidence,
    })),
  };
}

// ── Mock ──────────────────────────────────────────────────────────────────────

function getMockDtrResult(
  cptCode: string,
  procedureName: string
): DtrMatchResult {
  const groups = [
    {
      id: 1,
      title: "Primary Obesity Diagnosis",
      status: "met" as const,
      leaf: {
        code: "ICD-10 E66.01",
        label: "Morbid (severe) obesity due to excess calories",
        evidence: "Diagnosed 10/1/2022",
        source: "emr" as const,
      },
    },
    {
      id: 2,
      title: "BMI ≥ 35",
      status: "met" as const,
      leaf: {
        code: "Z68.37",
        label: "Body mass index 37.0–37.9, adult",
        evidence: "BMI 37.1 — Room Air Temp reading",
        source: "emr" as const,
      },
    },
    {
      id: 3,
      title: "Qualifying Comorbidity",
      status: "gap" as const,
      candidateCodes: [
        {
          code: "I27.20",
          system: "http://hl7.org/fhir/sid/icd-10-cm" as const,
          label: "Pulmonary hypertension, unspecified",
        },
        {
          code: "I27.21",
          system: "http://hl7.org/fhir/sid/icd-10-cm" as const,
          label: "Secondary pulmonary arterial hypertension",
        },
        {
          code: "G47.33",
          system: "http://hl7.org/fhir/sid/icd-10-cm" as const,
          label: "Obstructive sleep apnea (adult) (pediatric)",
        },
        {
          code: "E10.10",
          system: "http://hl7.org/fhir/sid/icd-10-cm" as const,
          label: "Type 1 diabetes mellitus with ketoacidosis, without coma",
        },
      ],
    },
  ];

  return {
    policyTitle: `${procedureName} — Medical Necessity Policy (CPT ${cptCode})`,
    cptCode,
    groups,
    allMet: groups.every((g) => g.status === "met"),
  };
}
