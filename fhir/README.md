# RHTP FHIR R4 — Local Development Guide

## Overview

The RHTP platform uses a **HAPI FHIR R4** server (running locally via Colima + Docker) as its live data backend. All 17 application screens are wired to read from — and where appropriate write to — this server. Mock mode remains fully functional as a fallback.

---

## Prerequisites

| Tool | Purpose |
|---|---|
| [Colima](https://github.com/abiosoft/colima) | Docker runtime for macOS (replaces Docker Desktop) |
| Docker Compose | Container orchestration |
| Node.js ≥ 18 | Migration + test scripts |

---

## Quick Start

```bash
# 1. Start Docker runtime (once per reboot)
colima start

# 2. Start HAPI FHIR container
docker compose -f fhir/docker-compose.yml up -d

# 3. Seed all patient + aggregate data
node fhir/migrate-patients.mjs

# 4. Start the Next.js app
npm run dev
# → http://localhost:4029
```

The HAPI FHIR web UI is available at **http://localhost:8080**.

---

## Scripts

### `node fhir/migrate-patients.mjs`

Seeds all FHIR R4 resources into HAPI. Safe to re-run — all resources use `PUT` (idempotent).

**Seeded resources:**

| Category | Resources |
|---|---|
| Practitioners + CBO Organizations | 12 |
| Aggregate Data (MeasureReport, SDOH/ROI Obs, Region Orgs) | 30 |
| Coverage (Benefit Enrollments) | 13 |
| Consent records | 4 |
| Per-patient bundles × 5 patients | ~174 total |

### `node fhir/test-fhir-coverage.mjs`

Full-coverage integration test suite (ST-9). Runs 114 assertions across 9 test suites covering all 18 FHIR resource types used by the application.

```bash
# Run against local HAPI + local app
node fhir/test-fhir-coverage.mjs

# Custom endpoints
node fhir/test-fhir-coverage.mjs --fhir-url http://localhost:8080/fhir --app-url http://localhost:4029
```

**Test suites:**

| Suite | Scope | Assertions |
|---|---|---|
| A — Core Patient Resources | Patient, Observation, Condition, MedicationRequest, Flag, RiskAssessment | 21 |
| B — Care Coordination | CareTeam, CarePlan, Goal, Task, Encounter | 9 |
| C — Referral / Workflow | ServiceRequest POST→PUT, Task lifecycle, AuditEvent | 8 |
| D — Practitioners / Network | Practitioner READ × 4, SEARCH, Organization, Region ext | 14 |
| E — Consent & Coverage | Consent × 4 + SEARCH, Coverage × 4 + SEARCH | 30 |
| F — Aggregate Data | MeasureReport READ/SEARCH, SDOH Obs × 6, ROI Obs × 6 | 16 |
| G — Write Round-Trips | CarePlan, Observation, ServiceRequest, MeasureReport POST→GET→PUT | 9 |
| H — CDS Hooks | POST /api/cds-hooks/patient-view — cards shape | 4 |
| I — Mock-Mode Fallback | Dead FHIR base error handling, live server health | 4 |

All test-created resources are **deleted in cleanup** at the end of each run.

### `node fhir/test-fhir-transactions.mjs`

Original detailed transaction test suite — exercises the full referral closed-loop (ServiceRequest → Task → Procedure → Lab Observation → Gap Closure → Provenance).

### `node fhir/debug-fhir-errors.mjs`

Diagnostic helper for FHIR server errors.

---

## FHIR Resource IDs (seeded)

### Patients

| Platform ID | FHIR ID |
|---|---|
| `MARIA_SD_001` | `patient-maria-001` |
| `PAT-0042` | `patient-dorothy-042` |
| `PAT-0087` | `patient-james-087` |
| `PAT-0103` | `patient-robert-103` |
| `PAT-0156` | `patient-lisa-156` |

### Practitioners

| Role | FHIR ID |
|---|---|
| PCP — Rick | `practitioner-rick` |
| Specialist/CHW — Jon | `practitioner-jon` |
| PCP — Whitfield | `practitioner-whitfield` |
| Care Manager — Sarah | `practitioner-sarah` |

### Consent

| ID | Patient | Status |
|---|---|---|
| `cns-001` | Maria Redhawk | active (Data Sharing) |
| `cns-002` | Maria Redhawk | active (Research) |
| `cns-003` | Maria Redhawk | rejected (BH Data — revoked) |
| `cns-004` | Dorothy Simmons | active (Data Sharing) |

### Coverage (Benefit Enrollments)

`cov-e001` through `cov-e013` — mapped to Dorothy, James, Robert, and Lisa's benefit programs.

### Aggregate Data (ST-8)

| Type | IDs |
|---|---|
| STARS MeasureReport | `mr-stars-001` – `mr-stars-004` |
| HEDIS MeasureReport | `mr-hedis-001` – `mr-hedis-004` |
| EXEC MeasureReport | `mr-exec-gaps-closed`, `mr-exec-gaps-open`, `mr-exec-closure-rate`, `mr-exec-gain-share`, `mr-exec-savings`, `mr-exec-referral-rate` |
| SDOH Observations | `obs-sdoh-food`, `obs-sdoh-housing`, `obs-sdoh-transport`, `obs-sdoh-financial`, `obs-sdoh-isolation`, `obs-sdoh-employment` |
| ROI Observations | `obs-roi-housing`, `obs-roi-food`, `obs-roi-bh`, `obs-roi-transport`, `obs-roi-chw`, `obs-roi-social` |
| Region Organizations | `org-region-west-river`, `org-region-southeast`, `org-region-northeast`, `org-region-central` |

---

## App Configuration

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCK_DATA` | `false` | Set `true` to disable all FHIR reads and use static mock arrays |
| `FHIR_BASE_URL` | `http://localhost:8080/fhir` | Override FHIR server base URL |

---

## Screen → Resource Mapping

| Screen | Resource types read | Writes |
|---|---|---|
| Patient Detail — Clinical Tab | Condition, MedicationRequest (via patientContext) | — |
| Care Plan Monitor | CarePlan, Goal | CarePlan PUT |
| CHW Workflow | Task | ServiceRequest POST, Task PUT, AuditEvent POST |
| Referral Journey Tracker | ServiceRequest, Task | — |
| Submitted Referrals | ServiceRequest, Task | — |
| Physician View | Practitioner | — |
| Provider Selection | Practitioner, Organization | — |
| Household View | Patient | — |
| Consent Sovereignty Panel | Consent | — |
| Benefit Enrollment | Coverage | ServiceRequest POST (Act Now / Renew) |
| Stars/HEDIS/MIPS | MeasureReport | — |
| Executive Outcomes Dashboard | MeasureReport | — |
| Social Needs Dashboard | Observation (sdoh-prevalence) | — |
| Financial Dashboard | MeasureReport (EXEC) | — |
| Outcomes Linkage | Observation (outcomes-roi) | — |
| Region View | Organization (region type) | — |
