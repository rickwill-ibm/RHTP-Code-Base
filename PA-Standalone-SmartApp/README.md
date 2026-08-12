# PA-Standalone-SmartApp

**Prior Authorization SMART on FHIR standalone application — CRD · DTR · PAS**  
Built on the Da Vinci implementation guides. CMS-0057-F compliant. Ready to integrate with RHTP.

---

## Overview

This is a fully self-contained Next.js 15 / React 19 / TypeScript SMART on FHIR application that implements the complete Prior Authorization workflow:

| Part | Standard | Screens |
|------|----------|---------|
| **I — CRD** | Da Vinci Coverage Requirements Discovery | Order & CRD Trigger → CRD Checklist |
| **II — DTR** | Da Vinci Documentation Templates & Rules | DTR Medical Necessity Tree |
| **III — PAS** | Da Vinci Prior Authorization Support | Review & Submit → PA Portal → Case Detail |
| **Ops** | Back-office queue | Worklist |

---

## Quick Start — Live FHIR Mode (recommended)

This is now the canonical SMART app for CRD/DTR/PAS — CRD and DTR run natively against
real FHIR data, not hardcoded demo cases. The one-command bootstrap script starts every
dependency (EMR FHIR, payer FHIR, CDS Hooks, Policy Engine) and the app itself:

```bash
chmod +x "Project Knowledge Uploads/start_PA_FHIR.sh"
"Project Knowledge Uploads/start_PA_FHIR.sh"
```

**Docker Desktop is optional, not required.** The script checks for it automatically: if
Docker isn't installed or isn't running, it starts `services/mock-fhir-server` instead — a
lightweight in-memory Node substitute for EMR/Payer FHIR that implements exactly the
operations this app's own code uses (read, patient/code search, transaction-bundle seed,
`Claim/$submit`). Functionally equivalent for local dev; the only difference is data resets
each time you restart it (`seed-all.mjs` runs automatically on every start regardless).

On first run it will prompt for an LLM key — either an OpenAI key (`sk-…`) or a **Groq**
key (`gsk_…`), which is free and needs no credit card (get one at
[console.groq.com/keys](https://console.groq.com/keys)) — used by the Policy Engine's real
extraction pass (see "Intelligent Policy Engine" below), and offers to save it to
`~/.openai_key` or `~/.groq_key` for future runs. It then:

1. Starts/reuses the EMR FHIR (`tcoc-hapi-fhir`, :8080), Payer FHIR (`pa-hapi-payer`, :8082) Docker containers
2. Seeds every test-patient bundle found in `infra/seed/` (Rachel Green by default — see "Seeding Test Patients" to add more)
3. Starts the CDS Hooks server (:8081) and Policy Engine (:8083)
4. Auto-ingests the bariatric-surgery seed policy through the Policy Engine on first run
5. Starts the Next.js app on **:4032** and opens `http://localhost:4032/launch`

Stop everything with `"Project Knowledge Uploads/start_PA_FHIR.sh" --stop` (Docker containers persist; only the Node processes are killed).

### Manual / mock-only start

```bash
cd PA-Standalone-SmartApp
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:4032
```

By default `.env.example` sets `NEXT_PUBLIC_USE_MOCK_DATA=true` — no FHIR servers needed,
CRD/DTR return canned results. `.env.local` (already checked in for this environment) sets
it to `false` — **live mode**, requiring the FHIR/CDS Hooks/Policy Engine services above.

---

## App Entry Points

| URL | Purpose |
|-----|---------|
| `http://localhost:4032/launch?iss=<fhirBase>&launch=<token>` | SMART App Launch entry (EHR redirects here) |
| `http://localhost:4032/app` | Post-OAuth redirect_uri / mock direct entry |
| `http://localhost:4032/` | Redirects to `/launch` |

No real EHR is available in local/dev environments, so `services/mock-fhir-server`
includes its own minimal, spec-compliant OAuth authorization server
(`/fhir/.well-known/smart-configuration`, `/auth/authorize`, `/auth/token`) that
auto-approves and completes a real PKCE launch. The demo launch URL is:

```
http://localhost:4032/launch?iss=http%3A%2F%2Flocalhost%3A8080%2Ffhir&launch=patient-rachel-green
```

`start_PA_FHIR.sh` opens this automatically. This is a local dev/demo IdP only —
it is not a substitute for a real authorization server outside this environment.

---

## Project Structure

```
PA-Standalone-SmartApp/
├── src/
│   ├── app/
│   │   ├── layout.tsx           — Root layout, SmartProvider, Toaster
│   │   ├── page.tsx             — Root → /launch redirect
│   │   ├── launch/page.tsx      — SMART App Launch (OAuth step 1)
│   │   └── app/page.tsx         — Post-OAuth shell (OAuth step 2)
│   ├── components/
│   │   ├── shell/
│   │   │   └── AppShell.tsx     — Header, nav strip, view router
│   │   └── views/
│   │       ├── OrderView.tsx            — Step 1: Order entry + CRD trigger
│   │       ├── CrdChecklistView.tsx     — Step 2: CRD 5-check results
│   │       ├── DtrTreeView.tsx          — Step 3: DTR criteria tree + upload
│   │       ├── ReviewSubmitView.tsx     — Step 4: Review + channel + submit
│   │       ├── PaPortalView.tsx         — Step 5: Authorization case list
│   │       ├── CaseDetailView.tsx       — Step 6: Case lifecycle + evidence
│   │       ├── WorklistView.tsx         — Step 7: Back-office batch queue
│   │       └── PolicyIngestView.tsx     — Step 8: Ingest a new policy through the LLM
│   ├── lib/
│   │   ├── smart/
│   │   │   ├── SmartContext.tsx         — React context for SMART session
│   │   │   ├── smartLaunch.ts           — PKCE OAuth + token exchange
│   │   │   └── mockSmartContext.ts      — Dev mock
│   │   ├── fhir/
│   │   │   ├── fhirClient.ts            — Typed FHIR R4 fetch client
│   │   │   └── patientLookup.ts         — Real Patient GET + banner derivation (no fabricated fallback)
│   │   ├── pa/
│   │   │   ├── pa-types.ts              — All domain types (CRD/DTR/PAS, multi-procedure order)
│   │   │   └── usePaStore.ts            — Zustand store (entire workflow state)
│   │   ├── crd/
│   │   │   ├── cdsHooksClient.ts        — CDS Hooks 2.0 fire + parse
│   │   │   └── crdService.ts            — Part I orchestration (one call per procedure)
│   │   ├── dtr/
│   │   │   ├── dtrService.ts            — Part II DTR match (one call per procedure)
│   │   │   ├── policyLookup.ts          — Live CPT → ingested-policy lookup (no hardcoded map)
│   │   │   └── policyIngest.ts          — Client for POST /ingest/text (Intelligent Policy Engine)
│   │   └── pas/
│   │       └── pasService.ts            — Part III Claim/$submit (multi-item) + EDI stub
│   └── styles/
│       └── globals.css
├── infra/
│   ├── docker-compose.yml               — Payer FHIR, CDS Hooks, Policy Engine services
│   └── seed/
│       ├── seed-all.mjs                 — Seeds every *-emr/*-payer bundle pair found here
│       └── generate-patient.mjs         — Scaffolds a new synthetic test patient's bundles
└── services/
    ├── cds-hooks-server/                — Real order-sign CDS Hooks service (CRD)
    └── policy-engine/                   — Real Express + OpenAI/Groq LLM policy extraction (DTR)
```

---

## Environment Variables

| Variable | Live default (`.env.local`) | Purpose |
|----------|------------------------------|---------|
| `NEXT_PUBLIC_USE_MOCK_DATA` | `false` | `true` skips FHIR/CDS calls entirely and uses local mock data |
| `NEXT_PUBLIC_FHIR_BASE_URL` | `http://localhost:8080/fhir` | EMR FHIR endpoint |
| `NEXT_PUBLIC_SMART_CLIENT_ID` | `pa-smart-app` | OAuth client id |
| `NEXT_PUBLIC_SMART_REDIRECT_URI` | `http://localhost:4032/app` | OAuth redirect |
| `NEXT_PUBLIC_CDS_HOOKS_ENDPOINT` | `http://localhost:8081/cds-services` | CDS Hooks server (order-sign hook) |
| `NEXT_PUBLIC_PAYER_FHIR_BASE_URL` | `http://localhost:8082/fhir` | Payer FHIR endpoint (PDex Patient Access sim) |
| `NEXT_PUBLIC_POLICY_ENGINE_URL` | `http://localhost:8083` | Intelligent Policy Engine (ingestion + DTR evaluation) |
| `NEXT_PUBLIC_ENABLE_EDI_FALLBACK` | `true` | Show EDI channel option |
| `OPENAI_API_KEY` | *(none — set on the Policy Engine process)* | LLM used for real policy extraction if set. Without either this or `GROQ_API_KEY`, `/ingest/text` (and `/ingest`, `/ingest/upload`) fails, but `/evaluate` against already-cached policies still works. |
| `GROQ_API_KEY` | *(none — set on the Policy Engine process)* | Free, no-credit-card alternative LLM provider ([console.groq.com/keys](https://console.groq.com/keys)) — used automatically if `OPENAI_API_KEY` isn't set. Same extraction pipeline, just a different (free) vendor. |

---

## Mock vs Live Mode

### Mock mode (`NEXT_PUBLIC_USE_MOCK_DATA=true`)
- No FHIR server or backend services needed
- SMART auth is bypassed — mock patient context loaded automatically
- CRD runs a simulated 800ms delay and returns canned results
- DTR returns the bariatric-surgery scenario from the design spec
- PAS generates a fake PA number

### Live mode (`NEXT_PUBLIC_USE_MOCK_DATA=false`) — the default in `.env.local`
Nothing in CRD, DTR, or patient lookup is hardcoded in this mode — every result comes from
a real FHIR query or a real Policy Engine call. Requires four services running (the
bootstrap script in "Quick Start" above starts all of them):

| Service | Port | What it is |
|---------|------|------------|
| EMR FHIR (`tcoc-hapi-fhir`) | 8080 | HAPI FHIR R4, clinical data (Patient, Condition, Observation, Coverage, ServiceRequest) |
| Payer FHIR (`pa-hapi-payer`) | 8082 | HAPI FHIR R4, PDex Patient Access simulation (Coverage, EOB) |
| CDS Hooks server | 8081 | Real `order-sign` hook — Part I / CRD |
| Policy Engine | 8083 | Real Express + LLM extraction (OpenAI or Groq), plus FHIR-backed criteria evaluation — Part II / DTR |

An EHR (or the app's own `/launch` mock-launch bypass) issuing `?iss=<base>&launch=<token>`
supplies the real `patientId` used everywhere downstream — there is no picklist of
pretend patients; the "Load Patient" field on the Order screen does a real
`GET Patient/{id}` against the EMR FHIR server and throws (not fabricates) on failure.

---

## Intelligent Policy Engine — Ingesting a New Policy

The **Ingest Policy** tab (step 8 in the nav) runs raw payer policy text — pasted, picked
from the seeds directory, or uploaded as a .pdf/.txt — through the real Policy Engine's
`POST /ingest/text` (or `/ingest`, `/ingest/upload`), which calls a real LLM to extract
governed CPT codes and criteria groups into a structured `PolicyDefinition`, cached to
`services/policy-engine/policies/<policyId>.json`. The LLM is **OpenAI GPT-4o** if
`OPENAI_API_KEY` is set, otherwise **Groq** (free, no credit card — see "LLM Provider" below)
if `GROQ_API_KEY` is set instead; either way it's a real extraction call, not a fabricated
or rule-based stand-in.

Every fresh extraction starts `status: "pending_review"` and is **not** yet usable by DTR —
a clinical reviewer has to trace its logic against the source document and approve it first
on the **Review Policy Logic** tab (step 9), which also tracks a review cadence and flags a
policy for re-review if its source file changes on disk. Every approve/reject decision is
recorded permanently on the **Audit Log** tab (step 10). See
`Policy_Logic_Tree_HITL_Review_Plan.md` (repo root) for the full design.

Once approved:

- `lib/dtr/policyLookup.ts` finds it automatically for any CPT code it governs — there is
  no hardcoded CPT→policy map to update
- DTR for a matching procedure runs the real criteria groups against the live patient's
  FHIR data immediately, no code change or redeploy needed

To seed the one policy the app ships with (bariatric surgery, CPT 43644, pre-approved so it
works without any review step) without using the UI:
`curl -X POST http://localhost:8083/ingest -d '{"policyId":"bariatric-surgery-cpt-43644"}' -H 'Content-Type: application/json'`
(the bootstrap script does this automatically on first run).

### LLM Provider

| Provider | Env var | Cost | Notes |
|---|---|---|---|
| OpenAI | `OPENAI_API_KEY` | Requires billing set up on your OpenAI account | Used first if set — `gpt-4o` |
| Groq | `GROQ_API_KEY` | **Free**, no credit card ([console.groq.com/keys](https://console.groq.com/keys)) | Used automatically if `OPENAI_API_KEY` isn't set — `llama-3.3-70b-versatile`, via Groq's OpenAI-compatible API |

`start_PA_FHIR.sh` prompts for either key type on first run (auto-detects by prefix: `sk-…`
vs `gsk_…`) and offers to save it (`~/.openai_key` / `~/.groq_key`) for future runs. Check
`GET /health` on the Policy Engine (`http://localhost:8083/health`) to see which provider is
currently active. Every ingested policy also records which one produced it
(`extractionProvider`/`extractionModel`), shown in both the Ingest and Review Policy Logic
screens.

---

## Seeding Test Patients

`infra/seed/seed-all.mjs` auto-discovers every `<slug>-emr.bundle.json` /
`<slug>-payer.bundle.json` pair in `infra/seed/` and posts each to the matching FHIR
server — it is **not** hardcoded to Rachel Green anymore. To add a new test patient:

```bash
cd PA-Standalone-SmartApp/infra/seed
node generate-patient.mjs \
  --slug jordan-lee --given Jordan --family Lee --dob 1972-04-11 --gender male \
  --member-id 7788990 \
  --condition-code M17.11 --condition-text "Unilateral primary osteoarthritis, right knee" \
  --cpt 27447 --cpt-desc "Total knee arthroplasty" --bmi 34.2

node seed-all.mjs   # picks up the new bundles automatically, no code change
```

The script prints the generated `patientId` — enter it directly into the SmartApp's
"Load Patient" field (or pass it as `&launch=` context from a test EHR launch). Run
`node generate-patient.mjs` with no arguments for the full flag reference.

---

## RHTP Integration Contract

When you are ready to integrate this app into the RHTP SMART app, the surface area is minimal:

### Option A — Deep-link (recommended for Phase 4a)
From RHTP, add a "Start PA" button that navigates to:
```
http://localhost:4032/launch?iss=<fhirBase>&launch=<launchToken>
```
The PA app runs in a separate tab or iframe. No code changes to RHTP required.

### Option B — In-app component import (Phase 4b+)
Move `PA-Standalone-SmartApp/src/` under `src/app/(cms0057f)/prior-auth/` in the RHTP monorepo.
The only wiring required is:
1. Pass the existing `SmartContext` from RHTP's auth provider instead of `PA-Standalone-SmartApp`'s own.
2. Replace the `usePaStore` initial `cases` seed with a FHIR query against the RHTP FHIR server.
3. Register `/prior-auth/launch` as an additional redirect URI in the EHR authorization server.

**Shared contracts that will NOT need to change between Option A and B:**
- `pa-types.ts` — all domain types
- `fhirClient.ts` — FHIR R4 client
- `crdService.ts`, `dtrService.ts`, `pasService.ts` — all service layer
- `usePaStore.ts` — all state management

---

## Standards Compliance

| Standard | Implementation |
|----------|---------------|
| SMART App Launch 2.0 | `smartLaunch.ts` — PKCE, `.well-known/smart-configuration` discovery |
| CDS Hooks 2.0 | `cdsHooksClient.ts` — `order-select` / `order-sign` hooks |
| Da Vinci CRD | `crdService.ts` + `cds-hooks-server` — real `order-sign` Coverage Information card, one per procedure |
| Da Vinci DTR | `dtrService.ts` + `policy-engine` — real LLM-parsed criteria groups matched against live FHIR |
| Da Vinci PAS | `pasService.ts` — `Claim/$submit` with one line item per procedure, EDI 275/278 stub |
| Da Vinci CDex | `DtrTreeView.tsx` — DocumentReference attachment upload |
| FHIR R4 | `fhirClient.ts` — `application/fhir+json` throughout |
| CMS-0057-F | Jan 1, 2027 deadline — all three Da Vinci IGs implemented |

---

## Scripts

```bash
npm run dev          # dev server :4032
npm run build        # production build
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run test         # Vitest unit tests
```

```bash
# Backend services (each runs standalone; the bootstrap script starts all of them)
node services/cds-hooks-server/src/index.mjs      # :8081
node services/policy-engine/src/index.mjs          # :8083, needs OPENAI_API_KEY for ingestion
node infra/seed/seed-all.mjs                        # seed every bundle in infra/seed/
node infra/seed/generate-patient.mjs --help         # scaffold a new test patient
```

---

*Part of the RHTP Prior Authorization SaaS initiative. See `New PA Plan Documents/` for the full implementation plan.*
