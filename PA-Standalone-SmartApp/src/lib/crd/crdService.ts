/**
 * CRD service — orchestrates the four Part I checks:
 *   1. Eligibility + enrollment (CoverageEligibilityRequest)
 *   2. Provider network status (PractitionerRole / PDex Plan-Net)
 *   3. Secondary guideline check (Milliman / InterQual stub)
 *   4. PA-required determination (CDS Hooks card)
 *
 * In mock mode all calls are short-circuited with local mock data.
 */

import type { SmartContext } from "@/lib/smart/smartLaunch";
import type { CrdCheckResult } from "@/lib/pa/pa-types";
import { fireCdsHook, parseCoverageInfoCard } from "./cdsHooksClient";

export async function runCrdChecks(
  ctx: SmartContext,
  cptCode: string
): Promise<CrdCheckResult> {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  if (useMock) {
    // Simulate network latency in dev
    await new Promise((r) => setTimeout(r, 800));
    return getMockCrdResult(cptCode);
  }

  // Live path — fire order-sign CDS Hook; parse Coverage Information card
  const hooksResponse = await fireCdsHook("order-sign", ctx, cptCode);
  return parseCoverageInfoCard(hooksResponse);
}

// ── Mock ──────────────────────────────────────────────────────────────────────

function getMockCrdResult(cptCode: string): CrdCheckResult {
  return {
    patientEnrolled: {
      pass: true,
      label: "Patient Enrolled",
      detail: "Active coverage verified",
      source: "pa",
    },
    patientEligible: {
      pass: true,
      label: "Patient Eligible",
      detail: "Eligibility confirmed for date of service",
      source: "pa",
    },
    providerInNetwork: {
      pass: true,
      label: "Provider In-Network",
      detail: "Dr. Jacob P. Aagaard MD confirmed in-network",
      source: "emr",
    },
    noConflictingGuideline: {
      pass: true,
      label: "No Conflicting Milliman/InterQual Guideline",
      detail: "Reviewed — no additional mitigating guideline found",
      source: "guideline",
    },
    paRequired: {
      pass: true,
      required: true,
      label: "Prior Authorization Required",
      detail: `YES — CPT ${cptCode} requires prior authorization`,
      source: null,
    },
  };
}
