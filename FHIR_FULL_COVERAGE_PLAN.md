# RHTP — Full FHIR Coverage Implementation Plan

## Overview

**Goal:** Migrate all 17 mock-only screens to live FHIR R4 data, so every screen in RHTP reads from (and where appropriate writes to) the HAPI FHIR server rather than hardcoded arrays or static mock files.

**Approach:** Ordered by FHIR resource complexity — reads before writes, patient-scoped resources before population/aggregate resources. Each sub-task is independently implementable and verifiable.

**FHIR Server:** HAPI FHIR R4 at `http://localhost:8080/fhir`, managed by Colima + Docker.

**Key invariant:** Every screen must gracefully fall back to mock/registry data when `NEXT_PUBLIC_USE_MOCK_DATA=true` or when the FHIR server is unreachable. No screen should hard-crash in mock mode.

**Pull ref:** 760c753 — as of this commit, 13 screens have live FHIR wiring. This plan covers the remaining 17.

---

## Sub-Tasks

---

### Sub-Task 1 — Patient Detail: Clinical Tab Live FHIR Read

**Status:** `[x] done`

**Intent:**
The Clinical Tab currently uses `FALLBACK_CONDITIONS`, `FALLBACK_MEDICATIONS`, and `FALLBACK_ORDERS` arrays when `patient?.conditions` is undefined. Since `patientContext.tsx` already fetches `Condition`, `MedicationRequest`, and related resources for each patient via `getRegistryPatient()`, the Clinical Tab should consume that live data rather than falling back to hardcoded values.

**Expected Outcomes:**
- When FHIR mode is ON, the Clinical Tab renders Conditions, Medications, and diagnostic data sourced from HAPI FHIR.
- When FHIR mode is OFF or the server is unreachable, the fallback arrays continue to render correctly.
- No hardcoded `FALLBACK_*` data appears in live mode.

**Todo List:**
1. Read `src/app/patient-detail/components/ClinicalTab.tsx` in full to understand exactly where `FALLBACK_CONDITIONS` and `FALLBACK_MEDICATIONS` are used.
2. Confirm that `usePatientContext()` exposes `conditions`, `medications`, and `diagnosticReports` fields (already populated by `getRegistryPatient()` in `fhirClient.ts`).
3. Replace fallback array references with live data from `usePatientContext()`, keeping the fallback as the default when those fields are `undefined`.
4. Add a small "FHIR" source badge to the Clinical Tab header (consistent with the pattern used in WholePersonCarePlanTab) when live data is in use.
5. Verify in browser: switch to live FHIR mode, select Maria Redhawk, open Patient Detail → Clinical Tab — conditions and medications should reflect FHIR data.

**Relevant Context:**
- `src/app/patient-detail/components/ClinicalTab.tsx` — fallback arrays and rendering logic
- `src/lib/patientContext.tsx` — `PatientSharedState` shape (conditions, medications fields)
- `src/lib/services/fhirClient.ts` lines 140–200 — `getRegistryPatient()` fetches Condition + MedicationRequest
- `src/lib/services/fhirResourceMappers.ts` — how Condition/MedicationRequest map to RegistryPatient
- Pattern reference: `src/app/patient-detail/components/WholePersonCarePlanTab.tsx` (FHIR badge + fallback pattern)

---

### Sub-Task 2 — Care Plan Monitor: Live CarePlan + Goal Read

**Status:** `[x] done`

**Intent:**
The Care Plan Monitor (`/care-plan-monitor/[patientId]`) generates care plans via `generateHolisticCarePlan()` and stores them in a Zustand store. It already imports `getFhirMockMode()`. The screen should instead read the `CarePlan` resource from FHIR (the same resource that `WholePersonCarePlanTab` writes) and surface `Goal` resources as monitored actions, with Zustand as the fallback.

**Expected Outcomes:**
- In live mode, the monitor reads `CarePlan/{id}` and `Goal?patient=Patient/{fhirId}` from HAPI FHIR.
- `updateActionStatus()` PUT-updates the `CarePlan` resource (marks an action item complete) rather than mutating Zustand only.
- Falls back to generated plan when no FHIR CarePlan exists for the patient.

**Todo List:**
1. Read `src/app/care-plan-monitor/[patientId]/page.tsx` in full.
2. Add `getFhirClient` import and `PLATFORM_TO_FHIR_ID_MAP` import.
3. On mount (in live mode): `GET CarePlan/{patient}-careteam` and `GET Goal?patient=Patient/{fhirId}` — map results to `MonitoredCarePlan` shape.
4. On `updateActionStatus()` in live mode: issue a `PUT CarePlan/{id}` with the updated action status alongside the Zustand update (fire-and-forget, same pattern as `WholePersonCarePlanTab`).
5. Show FHIR source indicator ("FHIR CarePlan · Live") when live data is loaded.
6. Verify: save a care plan via the Whole Person Care Plan Tab for Maria Redhawk, then navigate to Care Plan Monitor — the same plan should appear.

**Relevant Context:**
- `src/app/care-plan-monitor/[patientId]/page.tsx`
- `src/lib/stores/carePlanStore.ts` — Zustand store shape
- `src/lib/services/carePlanGenerator.ts` — fallback generator
- `src/app/patient-detail/components/WholePersonCarePlanTab.tsx` — CarePlan read + PUT pattern to replicate
- `PLATFORM_TO_FHIR_ID_MAP` in `src/lib/patientRegistry.ts`

---

### Sub-Task 3 — CHW Workflow: Task + ServiceRequest Live Read/Write

**Status:** `[ ] pending`

**Intent:**
CHW Workflow already uses `getFhirMockMode()` and `getVisiblePatients()` but has no `getFhirClient()` calls. Referral approvals currently fire a toast with no persistence. In live mode, the screen should read `Task` resources assigned to the active CHW and write `ServiceRequest` + `Task` on referral approval (matching the pattern in `ReferralTracking`).

**Expected Outcomes:**
- CHW task queue populated from `Task?owner=Practitioner/{chwFhirId}` in live mode.
- Approving a referral creates a `ServiceRequest` and linked `Task` in FHIR (same closed-loop pattern as Referral Tracking screen).
- Visit checklist "complete" action PUTs `Task` status → `completed`.
- Falls back to `CHW_SOCIAL_TASKS` static array in mock mode.

**Todo List:**
1. Read `src/app/chw-workflow/page.tsx` in full, focusing on referral approval handlers and visit task actions.
2. Add `getFhirClient`, `PLATFORM_TO_FHIR_ID_MAP` imports.
3. On mount in live mode: fetch `Task?owner=Practitioner/practitioner-jon` (CHW FHIR ID) and map to the existing task queue shape.
4. On referral approval: replicate the `ReferralTracking` ServiceRequest + Task + AuditEvent POST pattern.
5. On visit task complete: PUT `Task/{id} → status: completed`.
6. Verify: complete a task in CHW Workflow, confirm it appears as `completed` at `GET /fhir/Task?patient=...`.

**Relevant Context:**
- `src/app/chw-workflow/page.tsx`
- `src/app/referral-tracking/page.tsx` — ServiceRequest + Task POST pattern to replicate
- `src/app/care-team-inbox/page.tsx` — Task PUT pattern (lines 993–999)
- `src/lib/socialMockData.ts` — static arrays being replaced
- CHW FHIR practitioner ID: `practitioner-jon` (from migrate-patients.mjs)

---

### Sub-Task 4 — Referral Journey Tracker + Submitted Referrals: Live ServiceRequest + Task Read

**Status:** `[ ] pending`

**Intent:**
Both referral screens use `mockReferrals` from the `ActiveReferralsTable` component. In live mode they should read `ServiceRequest` and `Task` resources from FHIR — the same resources that `ReferralTracking` already writes. This closes the loop: one screen writes referrals, these screens read and display them.

**Expected Outcomes:**
- `Referral Journey Tracker` reads `ServiceRequest?patient=Patient/{fhirId}` and `Task?patient=Patient/{fhirId}` and maps them to the `mockReferrals` shape.
- `Submitted Referrals` reads the same resources and renders the referral table with live statuses.
- The PDF export in Submitted Referrals continues to work with live data.
- Falls back to `mockReferrals` in mock mode.

**Todo List:**
1. Read `src/app/referral-journey-tracker/page.tsx` and `src/app/submitted-referrals/page.tsx` in full.
2. Read the `ActiveReferralsTable` component to understand the `mockReferrals` shape that needs to be matched.
3. In both screens: add `getFhirClient`, `PLATFORM_TO_FHIR_ID_MAP` imports.
4. On mount in live mode: fetch `ServiceRequest?patient=Patient/{fhirId}&_count=50` + `Task?patient=Patient/{fhirId}&_count=50`, merge into referral objects keyed by `ServiceRequest.id`.
5. Map FHIR `Task.status` → referral journey stage (requested → accepted → in-progress → completed).
6. Verify: send a referral via Referral Tracking, then navigate to Submitted Referrals — the new entry should appear.

**Relevant Context:**
- `src/app/referral-journey-tracker/page.tsx`
- `src/app/submitted-referrals/page.tsx`
- `src/app/md-smart-launch/components/ActiveReferralsPanel.tsx` — mockReferrals shape reference
- `src/app/referral-tracking/page.tsx` lines 86–130 — the write side that creates the SR + Task

---

### Sub-Task 5 — Physician View + Provider Selection: Practitioner + Organization Read

**Status:** `[ ] pending`

**Intent:**
`PhysicianView` uses hardcoded `MEMBERS_BY_PROVIDER` data. `ProviderSelection` uses `mockData` via `ProviderDirectoryTable`. Both should read `Practitioner` and `Organization` resources from FHIR — which are already seeded by `migrate-patients.mjs` (12 Practitioner/CBO Organization resources).

**Expected Outcomes:**
- Physician View reads `Practitioner?_count=20` and groups patients by practitioner FHIR ID.
- Provider Selection reads `Practitioner?_count=50` and `Organization?_count=50` and renders the directory from live data.
- Falls back to hardcoded arrays in mock mode.

**Todo List:**
1. Read `src/app/physician-view/page.tsx` and `src/app/provider-selection/page.tsx` in full.
2. Confirm the Practitioner resources seeded by `migrate-patients.mjs` (names, IDs, roles).
3. Add `getFhirClient` to both pages; fetch `Practitioner?_count=20` on mount in live mode.
4. Map `Practitioner.name`, `Practitioner.qualification`, and linked `PractitionerRole` to the display shape used by both screens.
5. For Provider Selection, also fetch `Organization?_count=50` (CBOs already in FHIR from migration).
6. Verify: open Provider Selection in live mode — practitioners and organizations sourced from FHIR appear.

**Relevant Context:**
- `src/app/physician-view/page.tsx`
- `src/app/provider-selection/page.tsx`
- `src/app/cbo-directory/page.tsx` — Organization search pattern already implemented (replicate it)
- `fhir/migrate-patients.mjs` — lists all seeded Practitioner IDs and names

---

### Sub-Task 6 — Household View + Consent Sovereignty: Patient + Consent Read

**Status:** `[ ] pending`

**Intent:**
`HouseholdView` uses hardcoded `HOUSEHOLDS` data. `ConsentSovereigntyPanel` uses hardcoded `CONSENT_RECORDS` but already has `fhirConsent` field references in the data shape. Both need live FHIR reads — `HouseholdView` reads grouped `Patient` resources, `ConsentSovereigntyPanel` reads `Consent` resources.

**Expected Outcomes:**
- Household View fetches all patients (`Patient?_count=100`) and groups them into household units based on address/family extensions.
- Consent Sovereignty Panel reads `Consent?patient=Patient/{fhirId}` for the active patient and renders live consent records.
- Both fall back to hardcoded arrays in mock mode.

**Todo List:**
1. Read `src/app/household-view/page.tsx` and `src/app/consent-sovereignty-panel/page.tsx` in full.
2. For Household View: fetch `Patient?_count=100` in live mode; group patients by shared address (FHIR `Patient.address`) into household units.
3. For Consent: add `Consent` resources to `migrate-patients.mjs` for Maria Redhawk (two consent records: data sharing + ROI); fetch `Consent?patient=Patient/{fhirId}` on mount.
4. Map `Consent.status`, `Consent.scope`, `Consent.provision` to the existing `CONSENT_RECORDS` display shape.
5. Verify: open Consent Sovereignty Panel for Maria Redhawk in live mode — consent records appear from FHIR.

**Relevant Context:**
- `src/app/household-view/page.tsx`
- `src/app/consent-sovereignty-panel/page.tsx`
- `fhir/migrate-patients.mjs` — add Consent resource seeding here
- `src/app/cbo-directory/page.tsx` — Organization search + mapping pattern to reference

---

### Sub-Task 7 — Benefit Enrollment: Coverage Read + ServiceRequest Write

**Status:** `[ ] pending`

**Intent:**
`BenefitEnrollment` uses `ENROLLMENTS` from `socialMockData`. In live mode it should read `Coverage` resources (FHIR's benefit/enrollment resource) for the active patient, and the "Act Now" / "Renew" buttons should create `ServiceRequest` resources to initiate enrollment.

**Expected Outcomes:**
- Enrollment list reads `Coverage?beneficiary=Patient/{fhirId}` in live mode.
- "Act Now" / "Renew" button posts a `ServiceRequest` of category `enrollment` to FHIR.
- Falls back to `ENROLLMENTS` static array in mock mode.

**Todo List:**
1. Read `src/app/benefit-enrollment/page.tsx` in full.
2. Add `Coverage` resources for Maria Redhawk to `migrate-patients.mjs` (Medicaid + CHIP coverage).
3. Add `getFhirClient`, `PLATFORM_TO_FHIR_ID_MAP` imports to the page.
4. On mount in live mode: `GET Coverage?beneficiary=Patient/{fhirId}&_count=20` and map to enrollment display shape.
5. On "Act Now" / "Renew": POST a `ServiceRequest` with `category: enrollment`, `subject: Patient/{fhirId}`.
6. Verify: open Benefit Enrollment in live mode for Maria Redhawk — Medicaid coverage record appears from FHIR.

**Relevant Context:**
- `src/app/benefit-enrollment/page.tsx`
- `src/lib/socialMockData.ts` — ENROLLMENTS shape to match
- `src/app/referral-tracking/page.tsx` — ServiceRequest POST pattern to replicate
- `fhir/migrate-patients.mjs` — add Coverage resource seeding

---

### Sub-Task 8 — Migrate Aggregate Data into FHIR (MeasureReport + Population Observations)

**Status:** `[ ] pending`

**Intent:**
The aggregate/population dashboard screens (Stars/HEDIS/MIPS, Executive Outcomes, Financial Dashboard, Social Needs Dashboard, Outcomes Linkage, Region View) all use hardcoded trend data and KPI constants. These need to be backed by `MeasureReport` and population-level `Observation` resources seeded into HAPI FHIR so the dashboards can read live data.

**Expected Outcomes:**
- `migrate-patients.mjs` seeds the following additional resources:
  - 1 `MeasureReport` per HEDIS/Stars measure (HEDIS-DM-HbA1c, HEDIS-PHQ9, Stars-Rating, etc.)
  - Population `Observation` resources for SDOH domain prevalence (Food, Housing, BH rates)
  - Financial `Observation` resources (PMPM trend, gain-share actuals, savings)
  - Region-level `Organization` resources with extension data (region performance scores)
- Each dashboard screen reads from these resources in live mode.

**Todo List:**
1. Read `src/app/stars-hedis-mips/page.tsx`, `src/app/executive-outcomes-dashboard/page.tsx`, `src/app/social-needs-dashboard/page.tsx`, `src/app/financial-dashboard/page.tsx`, `src/app/outcomes-linkage/page.tsx`, and `src/app/region-view/page.tsx` to capture all hardcoded metric values.
2. In `fhir/migrate-patients.mjs`: add a new section that POSTs `MeasureReport` bundles for STARS/HEDIS measures using the hardcoded values as initial seeds.
3. Add population `Observation` resources (subject: group reference, not individual patient) for SDOH domain prevalence rates.
4. Add financial `Observation` resources (PMPM, savings, gain-share trend points).
5. Re-run `node fhir/migrate-patients.mjs` and confirm all new resources land in HAPI FHIR.
6. Update each dashboard screen to fetch its corresponding FHIR resources on mount in live mode, mapping them to the existing display component props.
7. Verify: open Stars/HEDIS in live mode — measure rates sourced from FHIR MeasureReport.

**Relevant Context:**
- `fhir/migrate-patients.mjs` — add all aggregate resources here
- `src/app/stars-hedis-mips/page.tsx` — `STARS_MEASURES`, `HEDIS_MEASURES` arrays
- `src/app/executive-outcomes-dashboard/page.tsx` — `POPULATION_METRICS`, `FINANCIAL_METRICS`
- `src/app/social-needs-dashboard/page.tsx` — `DOMAIN_PREVALENCE`, `FUNNEL_DATA`
- `src/app/financial-dashboard/page.tsx` — `FUNDING_STREAMS`, `MONTHLY_BRAIDED`
- `src/app/outcomes-linkage/page.tsx` — `OUTCOMES_DATA`, `ROI_TREND`
- `src/app/region-view/page.tsx` — `REGIONS`, `BENCHMARKS`
- FHIR R4 `MeasureReport` spec — `type: summary`, `measure` URL, `group[].population`, `group[].measureScore`

---

### Sub-Task 9 — End-to-End Test Suite

**Status:** `[ ] pending`

**Intent:**
With all screens wired to live FHIR, add a structured test suite that verifies: (a) each FHIR read returns the expected resource shape, (b) each write/update actually lands in HAPI FHIR, and (c) mock mode fallbacks work when the server is unavailable.

**Expected Outcomes:**
- A Node.js test script (`fhir/test-fhir-coverage.mjs`) that can be run against the live HAPI server to validate all screen operations.
- Tests for every resource type: Patient, Observation, Task, CarePlan, CareTeam, ServiceRequest, Condition, AuditEvent, MeasureReport, Coverage, Consent, Practitioner, Organization.
- Each test reports PASS/FAIL with the FHIR resource ID and HTTP status.
- A summary table printed at the end (matching the format of `test-fhir-transactions.mjs`).

**Todo List:**
1. Read `fhir/test-fhir-transactions.mjs` to understand the existing test harness pattern.
2. For each FHIR resource type used by the app, write a test that:
   - GETs a known resource (seeded by `migrate-patients.mjs`) and asserts key fields.
   - POSTs a test resource and asserts the created ID is returned.
   - PUTs an update and asserts the version increments.
   - DELETEs the test resource to clean up.
3. Add CDS Hooks integration tests: POST to `/api/cds-hooks/patient-view` with a known patient ID, assert cards array is non-empty and contains expected gap summaries.
4. Add a "mock mode fallback" test: temporarily point `FHIR_BASE_URL` at an unreachable address, confirm each screen's data-loading function returns the mock fallback without throwing.
5. Document how to run the suite in `fhir/README.md`: `node fhir/test-fhir-coverage.mjs`.

**Relevant Context:**
- `fhir/test-fhir-transactions.mjs` — existing test harness to extend
- `fhir/migrate-patients.mjs` — source of truth for all seeded resource IDs
- `fhir/debug-fhir-errors.mjs` — error diagnosis helper
- `src/lib/services/fhirClient.ts` — all FHIR operations to cover
- All screen files updated in Sub-Tasks 1–8

---

## Implementation Order

```
Sub-Task 1  →  Clinical Tab (reads only, no migration needed)
Sub-Task 2  →  Care Plan Monitor (reads + 1 PUT write)
Sub-Task 3  →  CHW Workflow (reads + ServiceRequest/Task writes)
Sub-Task 4  →  Referral Journey + Submitted Referrals (reads only)
Sub-Task 5  →  Physician View + Provider Selection (reads only)
Sub-Task 6  →  Household View + Consent (reads + migrate-patients additions)
Sub-Task 7  →  Benefit Enrollment (reads + ServiceRequest write + migrate-patients additions)
Sub-Task 8  →  Aggregate Data Migration + all dashboard screens
Sub-Task 9  →  Full test suite
```

Each sub-task is independently deployable. Sub-Tasks 6, 7, and 8 require additions to `migrate-patients.mjs` — re-run the migration script after each. Sub-Tasks 1–5 only need code changes and no migration updates.

---

## Non-Goals

- No changes to the FHIR server configuration (stays HAPI R4 with H2 in-memory).
- No authentication/authorization layer (SMART on FHIR is out of scope for this plan).
- No changes to the UHG Orchestrate screens (separate product demo, intentionally static).
- No changes to mock mode behavior — mock mode must continue to work identically after all sub-tasks.
