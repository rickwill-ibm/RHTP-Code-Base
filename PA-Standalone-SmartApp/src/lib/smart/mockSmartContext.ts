import type { SmartContext } from "./smartLaunch";

/** Mock SMART context loaded in dev when NEXT_PUBLIC_USE_MOCK_DATA=true. */
export const MOCK_SMART_CONTEXT: SmartContext = {
  accessToken: "mock-access-token",
  tokenType: "Bearer",
  fhirBaseUrl: process.env.NEXT_PUBLIC_FHIR_BASE_URL ?? "http://localhost:8080/fhir",
  payerFhirBaseUrl:
    process.env.NEXT_PUBLIC_PAYER_FHIR_BASE_URL ??
    "https://payer-fhir.example-payer.com/R4",
  patientId: "patient-rachel-green",
  encounterId: "enc-001",
  userId: "practitioner-aagaard",
  scopes: [
    "launch",
    "launch/patient",
    "launch/encounter",
    "patient/*.read",
    "openid",
    "fhirUser",
    "offline_access",
  ],
  expiresAt: Date.now() + 3600 * 1000,
};
