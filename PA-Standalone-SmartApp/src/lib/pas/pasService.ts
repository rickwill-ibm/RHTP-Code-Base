/**
 * PAS submission service — assembles the PASBundle and submits via
 * Claim/$submit (FHIR) or stubs the X12 278/275 EDI path.
 *
 * Channel is selected automatically based on payer capability metadata.
 * In mock mode a fake PA number is returned after a simulated delay.
 */

import type { SmartContext } from "@/lib/smart/smartLaunch";
import type {
  PasSubmission,
  SubmissionChannel,
  CrdCheckResult,
  DtrMatchResult,
  PaOrder,
  PatientBanner,
} from "@/lib/pa/pa-types";
import { FhirClient } from "@/lib/fhir/fhirClient";

export interface SubmitPaInput {
  ctx: SmartContext;
  channel: SubmissionChannel;
  order: PaOrder;
  patient: PatientBanner;
  crd: CrdCheckResult;
  dtr: DtrMatchResult;
}

export async function submitPriorAuth(
  input: SubmitPaInput
): Promise<PasSubmission> {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  if (useMock) {
    await new Promise((r) => setTimeout(r, 800));
    const paNumber = `PA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    const timestamp = new Date().toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      channel: input.channel,
      paNumber,
      payloadType:
        input.channel === "fhir"
          ? "FHIR PAS Bundle (Claim/$submit)"
          : "X12 275/278 (EDI)",
      payerEndpoint:
        input.channel === "fhir"
          ? input.ctx.payerFhirBaseUrl ?? "https://payer-fhir.example-payer.com/R4/Claim/$submit"
          : "Clearinghouse: Availity → Payer EDI Gateway (275/278)",
      timestamp,
    };
  }

  if (input.channel === "fhir") {
    return submitViaFhirPas(input);
  }

  return submitViaEdi(input);
}

// ── FHIR PAS path ─────────────────────────────────────────────────────────────

async function submitViaFhirPas(input: SubmitPaInput): Promise<PasSubmission> {
  const payerClient = FhirClient.forPayer(input.ctx);
  const pasBundle = buildPasBundle(input);
  const response = await payerClient.operation("Claim", "submit", pasBundle);

  const claimResponse = (response as { entry?: { resource?: { id?: string } }[] })
    ?.entry?.[0]?.resource;

  const paNumber = claimResponse?.id ?? `PA-${Date.now()}`;
  const timestamp = new Date().toLocaleString();

  return {
    channel: "fhir",
    paNumber,
    payloadType: "FHIR PAS Bundle (Claim/$submit)",
    payerEndpoint: `${input.ctx.payerFhirBaseUrl}/Claim/$submit`,
    timestamp,
  };
}

// ── EDI path ─────────────────────────────────────────────────────────────────

async function submitViaEdi(input: SubmitPaInput): Promise<PasSubmission> {
  // EDI translator integration lives in the backend service.
  // This client-side stub calls the local Next.js API route which proxies
  // to the EDI Translator microservice.
  const res = await fetch("/api/pa/submit-edi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order: input.order,
      patient: input.patient,
      crd: input.crd,
      dtr: input.dtr,
    }),
  });

  if (!res.ok) throw new Error(`EDI submission failed: ${res.status}`);

  const data = await res.json() as { paNumber: string; timestamp: string };
  return {
    channel: "edi",
    paNumber: data.paNumber,
    payloadType: "X12 275/278 (EDI)",
    payerEndpoint: "Clearinghouse: Availity → Payer EDI Gateway (275/278)",
    timestamp: data.timestamp,
  };
}

// ── PASBundle builder ─────────────────────────────────────────────────────────

function buildPasBundle(input: SubmitPaInput): object {
  return {
    resourceType: "Bundle",
    id: crypto.randomUUID(),
    meta: {
      profile: [
        "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-pas-request-bundle",
      ],
    },
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: "Claim",
          id: crypto.randomUUID(),
          status: "active",
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/claim-type",
                code: "professional",
              },
            ],
          },
          use: "preauthorization",
          patient: { reference: `Patient/${input.ctx.patientId}` },
          created: new Date().toISOString(),
          insurer: { display: "Payer" },
          provider: { display: input.order.orderingProvider },
          priority: {
            coding: [{ code: "normal" }],
          },
          item: [
            {
              sequence: 1,
              productOrService: {
                coding: [
                  {
                    system: "http://www.ama-assn.org/go/cpt",
                    code: input.order.cpt,
                    display: input.order.procedure,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };
}
