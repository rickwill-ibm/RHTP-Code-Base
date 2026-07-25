# Sample data coverage — mock demonstration

Answers: _do we have the data to demonstrate each scenario?_ Two kinds of thing
matter: **data** (FHIR resources a FHIR server returns) and **operations**
($member-match, CRD, $questionnaire-package, bulk $export, Claim/$submit) which
a plain FHIR server can't answer. The **dev stubs** (`lib/server/devStubs.ts`,
gated by `ALLOW_DEV_MOCK_AUTH=true`) supply canned operation responses so all
four provisions demo offline on mock data.

| Scenario                | Reads (data)                                                 | Operations                                     | Seeded / stubbed?                             | Offline demo (Tier A)?                                  |
| ----------------------- | ------------------------------------------------------------ | ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| **Patient Access**      | Coverage, Condition×3, **ClaimResponse (approved + denied)** | —                                              | ✅ seeded (real FHIR reads)                   | ✅ **fully**                                            |
| **Provider Access**     | Condition (post-match)                                       | `$member-match`                                | ✅ data seeded · ✅ match **dev-stubbed**     | ✅ (stub matches Maria, then real Condition reads)      |
| **Payer-to-Payer**      | — (imports history)                                          | bulk `$export` start/status                    | ✅ **dev-stubbed** (job → completed)          | ✅ flow + timeline (mock file)                          |
| **Prior Authorization** | ServiceRequest (CPT 72148)                                   | CRD, `$questionnaire-package`, `Claim/$submit` | ✅ SR seeded · ✅ CRD/DTR/PAS **dev-stubbed** | ✅ CRD cards → DTR form → human-gated submit → approved |

## What the expanded seed adds (`tools/seed/maria.bundle.json`, 20 resources)

Patient, Coverage (SD Medicaid), Conditions (T2DM, HTN, CKD 3b), Observation (A1c 8.2%), MedicationRequest (metformin), DiagnosticReport, ServiceRequest (MRI CPT 72148), Claim, **ClaimResponse ×2 (one approved, one denied w/ medical-necessity reasons)**, ExplanationOfBenefit, Organizations (payer + provider), Practitioners + role, Consent, and the MRI DTR Questionnaire. A vitest (`tests/seed/maria-bundle.test.ts`) loads this bundle through the real view-model code to prove Patient Access renders an approved **and** a denied PA.

## Dev stubs (offline operations) — `ALLOW_DEV_MOCK_AUTH=true`

- **CRD** → a critical "PA required for CPT 72148" card + DTR link.
- **$member-match** → matches the seeded demo member.
- **bulk $export** → a job id, then `completed` with a mock history file.
- **$questionnaire-package** → the MRI DTR questionnaire bundle.
- **PAS** → a canned approved ClaimResponse (the human-approval gate still applies).

These fire **only** in dev-mock and never in production; when the Tier B backbone is configured (`ALLOW_DEV_MOCK_AUTH=false`), the routes call the real WSO2/Ballerina services instead.

## Bottom line

- **Yes** — with the expanded seed + dev stubs, **all four provisions are demonstrable on mock data offline** (Tier A: `install/install.sh`). Patient Access uses real FHIR reads; the operation-driven flows use dev stubs.
- The one thing mock data _cannot_ prove is **standards conformance** and real payer adjudication — those still require the Tier B backbone (see `docs/traceability.md`).

## Note on RHTP's existing mock data

The rest of the RHTP app (care plans, whole-person graph, dashboards) has its own large mock datasets (`mockData.ts`, `patientRegistry.ts`, `wholePersonGraphData.ts`) that are independent of the FHIR server and unaffected by this. The CMS-0057-F provision pages specifically read through the BFF (`/api/fhir`) so they need the seeded FHIR resources documented above.
