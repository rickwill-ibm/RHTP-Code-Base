/**
 * DTR service — retrieves the Questionnaire Package for a procedure,
 * pulls clinical data from EMR + payer Patient Access API,
 * and executes CQL criteria matching to produce a DtrMatchResult.
 *
 * In mock mode a full bariatric-surgery scenario is returned.
 */

import type { SmartContext } from "@/lib/smart/smartLaunch";
import type { DtrMatchResult } from "@/lib/pa/pa-types";

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

  // Live path outline:
  // 1. GET DTR service $questionnaire-package?canonical=<policy-url>
  // 2. Pull US Core resources from EMR (Patient, Condition, Observation, etc.)
  // 3. Pull PDex Patient Access resources from payer
  // 4. Merge with clinical-source-wins rule + Provenance tagging
  // 5. Execute embedded CQL against merged FHIR bundle
  // 6. Map CQL results → DtrMatchResult groups
  throw new Error(
    "Live DTR execution not yet implemented — set NEXT_PUBLIC_USE_MOCK_DATA=true for local dev."
  );
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
