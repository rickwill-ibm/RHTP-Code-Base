# Implemented — Policy Engine + Golden Thread build

A consolidated record of the most recent build increment: a generalized payer **Policy
Engine**, the complete **Golden Thread** financial-clearance workflow (including **gold
carding**), and the productionization seams to wire it to SMART/BFF, persist evidence, and
reach the Tier-B backbone. Everything offline-possible is built and green.

## Summary

- **Generalized Policy Engine** — all 17 supplied payer policies (15 Aetna Cardiac
  Clinical Policy Bulletins + 2 UnitedHealthcare PA-requirement lists) parsed into a
  normalized seed library; ingestion adapters + registry (incl. a generic adapter for any
  payer/state agency); `evaluate()` producing Coverage Determinations; FHIR projections;
  validated 19/19 against known source anchors.
- **Evidence Record** — append-only, point-in-time Coverage Determination Record threading
  all four stages; PHI-safe audit projection; persistence store.
- **Gold carding** — provider NPI × procedure × payer exemption (granted roster +
  history-based qualification, ≥90% over a look-back, expiry/revocation); waives PA and is
  recorded auditably. State-law grounded (Texas HB 3459 and successors; voluntary payer
  programs) — not a federal CMS-0057-F mandate.
- **Propensity-to-deny** — transparent additive factor model, low/med/high banding;
  decision-support only.
- **The four stages** — Eligibility, Medical Necessity (engine + gold card + propensity +
  remediation), Prior Authorization (existing CRD/DTR/PAS as stage 3), Patient Estimation
  (GFE / No Surprises Act), unified by a parent state machine and a reviewer work queue
  with 72h/7d SLAs.
- **Productionization** — a server orchestrator that runs the whole thread and persists
  the Evidence Record; BFF routes `/api/financial-clearance` and `/api/evidence/[id]`; the
  page reads the SMART session patient; a flag-gated AI-DTR seam; a CQL-style structured
  criteria model with an SME-review gate; and Tier-B backbone config + client seams with a
  conformance plan.

## File map

| Area | Files |
|------|-------|
| Policy Engine | `src/lib/policy/{types,policyEngine,policyLibrary,fromFhir,criteria,goldCarding,propensity,goldCardSource,denialRates}.ts`, `src/lib/policy/ingest/*`, `src/lib/policy/data/policy-library.seed.json`, `tools/seed/parse_policies.py` |
| Evidence | `src/lib/evidence/{evidenceRecord,evidenceStore,index}.ts` |
| Golden Thread | `src/lib/goldenThread/{medicalNecessity,eligibility,patientEstimation,financialClearanceMachine,workQueue,threadOrchestrator,fromFhirBundle,dtrFromPolicy}.ts`, `src/lib/goldenThread/dtr/generator.ts` |
| UI | `src/app/(reviewer)/financial-clearance/page.tsx`, `src/components/goldenThread/{StageRail,MedicalNecessityPanel}.tsx` |
| BFF routes | `src/app/api/financial-clearance/route.ts`, `src/app/api/evidence/[id]/route.ts` |
| Backbone | `src/lib/backbone/{config,clients}.ts`, `docs/conformance-plan.md` |
| Tests | `tests/policy/*`, `tests/evidence/*`, `tests/goldenThread/*`, `tests/backbone/*` |

## Verification

- `npx tsc --noEmit` — 0 errors.
- `npx vitest run` — all tests passing (policy engine, evidence, gold carding, propensity,
  the four stages, orchestrator + persistence, FHIR projection, DTR seam, criteria,
  corpus accuracy regression, backbone gating).
- `npx next lint` — clean on all new code.

## What remains (needs external services — see `docs/conformance-plan.md`)

- **Live AI-assisted DTR generation** — the AI pipeline seam is wired but needs Docker +
  `ANTHROPIC_API_KEY` + `AI_DTR_ENDPOINT`; until configured, generation stays deterministic.
- **Executable CQL criteria + clinical SME review** — the structured criteria model and a
  proof-of-concept ruleset are in place; full CQL encoding and sign-off are non-code work
  (the PoC is flagged not-SME-reviewed and cannot auto-approve).
- **Tier-B backbone + conformance** — stand up WSO2/Ballerina + ITX, then run Inferno /
  Da Vinci conformance; the client seams refuse live calls until `BACKBONE_*` is configured.
