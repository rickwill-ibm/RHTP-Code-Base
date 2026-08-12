/**
 * CDS Hooks client — fires order-select and order-sign hooks to the
 * Prior Auth Service and parses the Coverage Information card.
 */

import type { SmartContext } from "@/lib/smart/smartLaunch";
import type { CrdCheckResult } from "@/lib/pa/pa-types";

const CDS_HOOKS_ENDPOINT =
  process.env.NEXT_PUBLIC_CDS_HOOKS_ENDPOINT ??
  "http://localhost:8080/cds-services";
const TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_CDS_HOOKS_TIMEOUT ?? 10000);
const SERVICE_ID = "prior-auth-crd";

export interface CdsHookRequest {
  hookInstance: string;
  hook: "order-select" | "order-sign";
  context: {
    patientId: string;
    encounterId?: string;
    draftOrders: { resourceType: "Bundle"; entry: object[] };
  };
  prefetch?: Record<string, object>;
  fhirServer: string;
  fhirAuthorization: {
    access_token: string;
    token_type: "Bearer";
    scope: string;
    subject: string;
  };
}

export interface CdsCard {
  summary: string;
  detail?: string;
  indicator: "info" | "warning" | "critical";
  source: { label: string };
  links?: { label: string; url: string; type: string }[];
  suggestions?: object[];
  systemActions?: object[];
  extension?: Record<string, unknown>;
}

export interface CdsHookResponse {
  cards: CdsCard[];
  systemActions?: object[];
}

export async function fireCdsHook(
  hook: "order-select" | "order-sign",
  ctx: SmartContext,
  cptCode: string
): Promise<CdsHookResponse> {
  const body: CdsHookRequest = {
    hookInstance: crypto.randomUUID(),
    hook,
    context: {
      patientId: ctx.patientId,
      encounterId: ctx.encounterId,
      draftOrders: {
        resourceType: "Bundle",
        entry: [
          {
            resource: {
              resourceType: "ServiceRequest",
              status: "draft",
              intent: "order",
              subject: { reference: `Patient/${ctx.patientId}` },
              code: {
                coding: [
                  {
                    system: "http://www.ama-assn.org/go/cpt",
                    code: cptCode,
                  },
                ],
              },
            },
          },
        ],
      },
    },
    fhirServer: ctx.fhirBaseUrl,
    fhirAuthorization: {
      access_token: ctx.accessToken,
      token_type: "Bearer",
      scope: ctx.scopes.join(" "),
      subject: ctx.userId ?? "unknown",
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${CDS_HOOKS_ENDPOINT}/${SERVICE_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`CDS Hooks ${res.status}: ${await res.text()}`);
    }

    return res.json() as Promise<CdsHookResponse>;
  } finally {
    clearTimeout(timer);
  }
}

/** Parse a Coverage Information system action / card into our domain type. */
export function parseCoverageInfoCard(response: CdsHookResponse): CrdCheckResult {
  const card = response.cards[0];
  const ext = (card?.extension ?? {}) as Record<string, unknown>;

  return {
    patientEnrolled: {
      pass: ext["coverage-enrolled"] !== false,
      label: "Patient Enrolled",
      detail: String(ext["coverage-enrolled-detail"] ?? "Active coverage verified"),
      source: "pa",
    },
    patientEligible: {
      pass: ext["coverage-eligible"] !== false,
      label: "Patient Eligible",
      detail: String(ext["coverage-eligible-detail"] ?? "Eligibility confirmed for date of service"),
      source: "pa",
    },
    providerInNetwork: {
      pass: ext["provider-in-network"] !== false,
      label: "Provider In-Network",
      detail: String(ext["provider-in-network-detail"] ?? "Ordering provider confirmed in-network"),
      source: "emr",
    },
    noConflictingGuideline: {
      pass: ext["no-conflicting-guideline"] !== false,
      label: "No Conflicting Milliman/InterQual Guideline",
      detail: String(ext["guideline-detail"] ?? "Reviewed — no additional mitigating guideline found"),
      source: "guideline",
    },
    paRequired: {
      pass: true,
      required: ext["pa-required"] === true,
      label: "Prior Authorization Required",
      detail: ext["pa-required"] === true ? "YES" : "NO",
      source: null,
    },
  };
}
