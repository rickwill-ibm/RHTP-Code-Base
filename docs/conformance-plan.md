# Conformance & Tier-B integration plan (GT-10)

The offline build validates behavior on mock data; it does **not** claim standards
conformance. Conformance is a Tier-B activity that runs against the live backbone
(WSO2 APIM/IS + Open Health accelerator + Ballerina services + FHIR server + ITX
for X12). This document is the test plan to execute once that stack is stood up.

## Backbone capabilities (gated by `src/lib/backbone/config.ts`)

`isBackboneConfigured()` is false until `BACKBONE_CRD_URL`, `BACKBONE_DTR_URL`,
and `BACKBONE_PAS_URL` are set. Each live client (`src/lib/backbone/clients.ts`)
throws `BackboneNotConfiguredError` until then, so nothing silently hits a
missing endpoint.

| Capability | Env var | Live client |
|---|---|---|
| Eligibility (X12 270/271) | `BACKBONE_ELIGIBILITY_URL` | `liveEligibilityClient` |
| CRD (CDS Hooks) | `BACKBONE_CRD_URL` | `livePriorAuthBackbone.crd` |
| DTR (`$questionnaire-package`) | `BACKBONE_DTR_URL` | `livePriorAuthBackbone.dtrPackage` |
| PAS (`Claim/$submit`) | `BACKBONE_PAS_URL` | `livePriorAuthBackbone.pasSubmit` |
| X12 278/275 (ITX) | `BACKBONE_X12_URL` | `liveX12Converter` |

## Conformance suites to run

1. **Da Vinci CRD / DTR / PAS** — Inferno Da Vinci test kits against the live CRD
   hook, `$questionnaire-package`, and `Claim/$submit`, plus the Coverage
   Determination Record (our Evidence Record maps to it).
2. **US Core** — Inferno US Core validation of Patient, Coverage, Condition,
   ServiceRequest, Claim, ClaimResponse the thread reads/writes.
3. **CARIN Blue Button** — EOB / coverage for the Patient Access + estimation
   surfaces.
4. **SMART App Launch** — EHR launch sequence (the thread launches in-context).
5. **X12 278/275** — round-trip a PAS Claim → 278 and a 275 attachment → FHIR via
   ITX; validate against the payer's companion guide.
6. **CMS-0057-F operational** — 72h expedited / 7d standard decision timers
   (already modeled in `paMachine.slaHours` + `workQueue`), denial-reason
   surfacing, and the four required APIs.

## Cutover from offline → live (per surface)

- **Eligibility** — replace the `active`/`requiresPA` mock with `liveEligibilityClient.check` (270/271).
- **Medical Necessity** — keep the Policy Engine screen; add live CRD as a second
  opinion; encode SME-reviewed CQL criteria (see GT-9) before any auto-approval.
- **Prior Auth (stage 3)** — swap dev stubs for live CRD → DTR → PAS; the AI-DTR
  path (GT-8) needs `AI_DTR_ENDPOINT` + `ANTHROPIC_API_KEY`.
- **Patient Estimation** — replace mock allowed-amounts with CARIN benefit data.
- **Evidence Record** — move `defaultEvidenceStore()` from in-memory to an
  append-only / FHIR-persisted store; keep `toAuditEvents()` PHI-safe.

## Data-source cutover (GT-9)

- **Gold carding** — replace `mockGoldCardDataSource` with a real roster/history
  feed (`GoldCardDataSource`).
- **Propensity** — replace `mockDenialRateProvider` with real code/plan denial
  history (`DenialRateProvider`); optionally train an ML model behind the same
  `scorePropensity` interface.

Nothing above is claimed conformant until these suites pass on the live backbone.
