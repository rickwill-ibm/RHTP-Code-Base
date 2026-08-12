# RHTP — Rural Health Transformation Program / Total Cost of Care Platform

An enterprise **population health and value-based care management platform** purpose-built
for State Medicaid agencies operating Rural Health Transformation programs. The platform
delivers **whole-person care** — Clinical, Behavioral Health (BH), and Social determinants
of health (SDOH) — in a single FHIR-native system, with native CMS-0057-F interoperability
compliance and an interactive Prior Authorization / Financial Clearance workflow.

**Author:** Richard Hennessy · **Stack:** Next.js 15 · React 19 · TypeScript (strict) · Tailwind CSS · FHIR R4

---

## Platform Capabilities

### 1 · RHTP Clinical Platform (TCOC)

The core population health and care management application. All screens run fully on mock
data — no FHIR server, no backend required for demonstration.

| Domain | Screens | What it delivers |
|--------|---------|-----------------|
| **Program Governance** | RHTP Overview, Region View, Executive Outcomes Dashboard | State executive view: unified Clinical + BH + Social KPIs, regional benchmarking, shared savings waterfall, braided funding (Medicaid 1115 + SNAP + HUD + SAMHSA + OAA + WIOA) |
| **Population Health** | Panel & Cohort View, Patient Detail, STARS/HEDIS/MIPS | Risk-stratified panel management, HCC suspect surfacing ($2.3M revenue at risk), five quality measure tabs, EDW submission tracking |
| **Whole-Person Care** | Whole Person Care Summary, Care Plan Monitor, Patient Detail | Clinical + BH + Social goals in one care plan; AI-generated recommendations; barrier-aware replanning (transportation, housing, digital access, caregiver burden) |
| **Financial** | Financial Dashboard, Outcomes Linkage, Episodic Analytics | PMPM trend, RAF/HCC revenue capture, braided funding envelope, gain-share attribution per gap closure, ROI proof ($3.40 return per $1 social investment) |
| **Clinical / EHR** | MD SMART Launch, Physician View, Care Gap Closure Verification | SMART on FHIR launch from Cerner; CDS Hooks (patient-view + order-sign); FHIR-backed gap closure with 3-step evidence capture and provenance chain |
| **Network Management** | Provider Level, Network Adequacy, CBO Directory | Org-level Clinical/BH/CBO performance; network adequacy by specialty × county × LOB; CBO FHIR Task closed-loop referrals |
| **Care Coordination** | Care Manager Worklist, CHW Workflow, Referral Tracking | Role-specific workflows for care managers, CHWs, specialists; 7-stage referral journey tracker; universal FHIR Task inbox |
| **SDOH** | Social Needs Screening, Social Needs Dashboard, Benefit Enrollment | PRAPARE / AHC-HRSN 13-domain screening; automatic FHIR Task routing to CBOs; program eligibility calculation; population screening funnel |
| **BH & Crisis** | Crisis Pathway, Care Team Inbox, Specialist Inbox | SDOH context during crisis dispatch; 988/CSU/Mobile Crisis/ED decision support; BH referral + CHW follow-up automation |
| **Admin & Quality** | Admin Console (8 sections), Consent Sovereignty Panel, Audit/Compliance | System health, identity/access, data quality, agent oversight, consent governance |

**Demo entry points:** `/` (Demo Navigator) · `/demo-deck` (guided 31-step, 8-persona presentation)

**Demo personas:** State Medicaid Executive (P1) · Network Director (P2) · Primary Care Physician (P3) · Care Manager (P4) · Community Health Worker (P5) · BH & Crisis Specialist (P6) · Specialist (P7) · Quality/Compliance Analyst (P8)

**Anchor patient — Dorothy Simmons:** PRAPARE screening (food insecurity + housing instability) → SNAP enrollment → BH engagement → A1C 9.2% → 7.1%. Every step backed by FHIR resources. $340 social program cost → $4,200 avoided clinical cost.

---

### 2 · CMS-0057-F Native Experience

A server-mediated BFF layer connecting the RHTP application to the
[WSO2 CMS-0057-F reference implementation](https://github.com/wso2/reference-implementation-cms0057f)
(deployed separately as Tier B). All four mandated provisions are implemented and
demonstrable offline via dev stubs.

| Provision | URL | Mechanism |
|-----------|-----|-----------|
| **Patient Access** | `/access` | Coverage, Condition, ClaimResponse reads via BFF → FHIR_GATEWAY_BASE |
| **Provider Access** | `/provider-access` | `$member-match` + treatment-relationship authorization guard |
| **Payer-to-Payer** | `/payer-to-payer` | Async bulk `$export` from prior payer; idempotent job management; 7d SLA |
| **Prior Authorization** | `/prior-auth` | Da Vinci CRD → DTR → PAS; human-gated submission; 72h/7d SLA; denial reasons |

Entry point: `/cms` — the CMS-0057-F hub (checks SMART session; links to all six capabilities).

**Security invariants:** the browser holds no tokens or secrets. SMART access tokens live in
an encrypted, httpOnly server session. Every privileged action emits a PHI-safe audit event
(references + codes, never PHI payloads). See `docs/ARCHITECTURE.md`.

---

### 3 · Golden Thread — Financial Clearance

An orchestrated four-stage financial clearance workflow that sits on top of the CMS-0057-F
Prior Authorization provision and the Policy Engine:

1. **Eligibility** — active coverage verification + "requires PA?" (net of gold carding)
2. **Medical Necessity** — Policy Engine evaluation + gold card check + denial propensity score
3. **Prior Authorization** — CRD → DTR → PAS state machine (skipped when gold-carded)
4. **Patient Estimation** — Good Faith Estimate + No Surprises Act + propensity-to-pay

One append-only **Evidence Record** (the Da Vinci Coverage Determination Record) persists
through all four stages. A **work queue** routes items by disposition with 72h/7d SLA breach detection.

URL: `/financial-clearance` · Work queue: `/work-queue` · Evidence viewer: `/evidence/:id`

---

### 4 · Generalized Policy Engine

Normalizes any payer or state-agency medical policy into a single model and evaluates a
member's order into a Coverage Determination. Ships with parsed real-world seed data:

- **Aetna Cardiac Clinical Policy Bulletins (CPBs)** — structural criteria
- **UnitedHealthcare PA-requirement lists** — code-on-PA-list evaluation
- **Generic PA-list adapter** — accepts any payer or state agency format

Includes **gold carding** (NPI × procedure × payer exemption with expiry/revocation),
a transparent **denial propensity** model, and a **CQL-style criteria evaluator** with an
SME-review gate. See `docs/ARCHITECTURE.md` §3.

---

### 5 · Network Adequacy + Analyst Copilot

Measures provider network coverage against CMS standards by **specialty × county × line of
business** (Medicaid / Medicare / Commercial):

- Five CMS standard checks: time/distance · in-network % · wait-time · provider ratio · adequacy target
- Gap severity scoring (critical / high / medium / low) with augmentation candidates
- **Interactive analyst copilot** — deterministic, grounded assistant (baseline / prioritize /
  deep-dive / compare / augment / validate). No API key needed; works fully offline.
- Seeded for **Georgia** (storyboard) and **South Dakota / Maria's state**, including Pine
  Ridge / Rosebud reservation counties
- Standards: MA §422.116 · Medicaid §438.68 + 2024 Access rule · QHP §156.230

URL: `/network-adequacy` · See `docs/network-adequacy-plan.md`

---

### 6 · PA Standalone SMART App (CRD · DTR · PAS)

A separate Next.js 15 application (port **4032**) implementing the full Da Vinci Prior
Authorization workflow as a standalone SMART on FHIR app:

- CRD (Coverage Requirements Discovery) via CDS Hooks `order-sign`
- DTR (Documentation Templates & Rules) — FHIR Questionnaire / QuestionnaireResponse
- PAS (Prior Auth Support) — X12 278 EDI submission endpoint
- Docker Compose stack: Policy Engine service · CDS Hooks Server · Mock FHIR Server
- Seeded with Rachel Green EMR + payer FHIR bundles

Location: `PA-Standalone-SmartApp/` · Port: 4032

---

## Prerequisites

### Tier A — Offline / Demo (nothing external required)

```bash
npm install
npm run dev          # → http://localhost:4029
```

All 40+ screens, 8 persona workflows, all four CMS-0057-F provisions, the full Golden
Thread, and the Network Adequacy copilot run on mock data / dev stubs. No Docker, no FHIR
server, no API keys needed.

### Tier A+ — Local FHIR backbone

```bash
npm run backbone:up  # HAPI FHIR R4 on :8090 + MySQL via Docker Compose
npm run seed:maria   # loads the Maria FHIR bundle
npm run dev
```

Set `NEXT_PUBLIC_USE_MOCK_DATA=false` and `NEXT_PUBLIC_FHIR_BASE_URL=http://localhost:8090/fhir`
in `.env.local`. FHIR read/write flows run end-to-end.

### Tier B — Live / standards-conformant (WSO2 reference implementation)

RHTP is the *application* layer. Live CMS-0057-F operation requires the separately-deployed
WSO2 reference implementation:

> **Reference implementation:** https://github.com/wso2/reference-implementation-cms0057f  
> **Regulation:** [CMS-0057-F Final Rule](https://www.cms.gov/priorities/key-initiatives/burden-reduction/interoperability/policies-and-regulations/cms-interoperability-and-prior-authorization-final-rule-cms-0057-f)

Set these server-only env vars in `.env.local` (no `NEXT_PUBLIC_` prefix):

| Var | Purpose |
|-----|---------|
| `FHIR_GATEWAY_BASE` | WSO2 APIM FHIR gateway, e.g. `https://localhost:8243/<ctx>/fhir/r4` |
| `CDS_GATEWAY_BASE` | CDS Hooks gateway |
| `BULK_GATEWAY_BASE` | Bulk export gateway |
| `WSO2_AUTHORIZE_URL` | WSO2 IS OAuth2 authorize endpoint |
| `WSO2_TOKEN_URL` | WSO2 IS OAuth2 token endpoint |
| `WSO2_CLIENT_ID` / `WSO2_CLIENT_SECRET` | App credentials from APIM |
| `WSO2_REDIRECT_URI` | `http://localhost:4029/api/auth/callback` |
| `SESSION_SECRET` | 32+ random characters for session encryption |
| `ALLOW_DEV_MOCK_AUTH` | Set `false` for real auth |

No application code change is needed to move Tier A → Tier B. See `docs/conformance-plan.md`
for the Inferno / Da Vinci conformance steps and `docs/ARCHITECTURE.md` §5 for the seam.

---

## Validation

```bash
npx tsc --noEmit     # type-check (0 errors)
npx vitest run       # unit / behaviour tests (145 passing)
npm run lint         # next lint (clean)

# Optional — end-to-end smoke tests (Playwright, not installed by default)
npm i -D @playwright/test && npx playwright install chromium
npx playwright test  # runs e2e/ against the dev server (port 4029)

# Contract tests (Newman/Postman — requires Tier B)
npm run test:contract
```

---

## Architecture

```
Browser (React 19 · Tailwind)
   │  calls only /api/*  — no FHIR or APIM calls from the browser
   ▼
BFF / Next.js API routes  →  server-held SMART token · PHI-safe audit · correlation IDs
   ├─ /api/fhir/*              → FHIR_GATEWAY_BASE  (or HAPI seed in Tier A)
   ├─ /api/cds · /api/dtr · /api/pas  → CRD/DTR/PAS  (dev stubs or Tier B)
   ├─ /api/financial-clearance → Golden Thread orchestrator + Evidence Record
   ├─ /api/network-adequacy    → Network Adequacy engine
   └─ /api/auth/*              → WSO2 IS OAuth2 PKCE flow
   ▼
Domain libraries (pure · deterministic · tested)
   src/lib/policy          Generalized Policy Engine + gold carding + propensity + criteria
   src/lib/goldenThread    Four-stage thread: eligibility · med-necessity · PA · estimation
   src/lib/evidence        Append-only Evidence Record (Coverage Determination Record)
   src/lib/workflow        PA lifecycle state machine (paMachine)
   src/lib/networkAdequacy Network Adequacy engine + analyst assistant
   src/lib/backbone        Tier-B config + live client seams (gated until configured)
   ▼
reference-implementation-cms0057f  (Tier B — deployed separately)
   WSO2 APIM (:8243) · WSO2 IS (:9453) · Ballerina FHIR · CDS Hooks · Bulk export · ITX
```

See `docs/ARCHITECTURE.md` for full detail.

---

## Standards

| Standard | Coverage |
|----------|---------|
| **CMS-0057-F** | All four API provisions · 72h/7d decision SLAs · denial reasons |
| **Da Vinci CRD / DTR / PAS** | Full CRD → DTR → PAS lifecycle · Coverage Determination Record |
| **FHIR R4 / US Core** | Patient · Coverage · Condition · CarePlan · Task · ServiceRequest · MeasureReport · Observation · Consent · Provenance |
| **SMART App Launch 2.0** | PKCE · EHR launch (Cerner) · standalone · server-held tokens |
| **CDS Hooks** | patient-view · order-sign · hook discovery |
| **CARIN Blue Button** | Eligibility + Good Faith Estimate / No Surprises Act |
| **X12 278 / 275** | PA submission via ITX · payer companion guide (Tier B) |
| **PRAPARE / AHC-HRSN** | 13-domain social needs screening · Z-code FHIR Condition posting |
| **HEDIS / STARS / MIPS** | Measure compliance · documentation evidence chain · gain-share · EDW submission |
| **WSO2 APIM / IS** | OAuth2 PKCE gateway · token introspection · Ballerina FHIR integration |

---

## Documentation

| Doc | What it covers |
|-----|----------------|
| `docs/ARCHITECTURE.md` | Full architecture: BFF, CMS-0057-F provisions, Policy Engine, Golden Thread, backbone, standards |
| `docs/remaining-work-and-test-plan.md` | What's done (145 tests), what's left to build, test plan, suggested order |
| `docs/network-adequacy-plan.md` | Network Adequacy integration plan — CMS mandate mapping, copilot, NA-0…NA-8 increments |
| `docs/golden-thread-plan.md` | Golden Thread improvement plan and roadmap |
| `docs/conformance-plan.md` | Tier-B cutover + Inferno / Da Vinci conformance test plan |
| `docs/integration-endpoints.md` | Env var reference for all Tier-B integration endpoints |
| `docs/traceability.md` | CMS-0057-F capability → code → test traceability matrix |
| `docs/current-state.md` | Build state map — existing assets and Slice 0 dispositions |
| `docs/sample-data-coverage.md` | Mock data coverage across all four provisions |
| `INTEGRATED_INSTALL.md` | Integrated install guide (Tier A dev stack) |
| `FOUNDATION_SLICE0_README.md` | Slice 0 (BFF + SMART auth + FHIR passthrough) build notes |
| `SLICES_1_6_README.md` | Slices 1–6 (four provisions + primitives + human gates) build notes |
| `PA-Standalone-SmartApp/README.md` | Standalone CRD · DTR · PAS SMART app setup and usage |

---

## Status

**Offline experience: fully implemented, hardened, and green.**

- `tsc` 0 errors · **145 vitest passing** · `next lint` clean
- 40+ application screens across all domains
- 8 demo personas · 31 guided demo steps
- All four CMS-0057-F provisions (offline via dev stubs)
- Complete Golden Thread: Policy Engine (17 real policies) · gold carding · propensity · Evidence Record · four stages · work queue · reviewer UI
- Network Adequacy engine + analyst copilot (GA + SD/Maria · 145 tests)
- PA Standalone SMART app (CRD · DTR · PAS · Docker stack)
- Cerner PowerChart MD SMART app integration

**What remains** is captured in `docs/remaining-work-and-test-plan.md`. Key gated items:
live AI-assisted DTR + adequacy narration (Docker + API key); clinical SME review of CQL
criteria; standing up the Tier-B WSO2 backbone for live conformance-tested adjudication;
real provider-directory / geography data for authoritative network adequacy.

> Decision-support outputs (propensity-to-deny, cost estimates, adequacy recommendations)
> are **not** coverage determinations or regulatory filings. The payer `ClaimResponse` and
> certified CMS filing are authoritative.
