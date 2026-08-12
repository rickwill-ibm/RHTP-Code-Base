# Remaining work & test plan

A single, honest view of what is **done**, what is **left to build**, and **how each is
tested/proven**. Offline items need no external services; gated items need infrastructure,
keys, data feeds, or people.

## 1. Where it stands (done + green)

`tsc` 0 · **145 vitest passing** · `next lint` clean on app code. Delivered offline:

- Four CMS-0057-F provisions (Patient/Provider/Payer-to-Payer/Prior Auth) via the BFF.
- Golden Thread: Policy Engine (17 real policies), gold carding, propensity, persisted
  Evidence Record, the four stages, the parent machine, work queue.
- Reviewer UI: interactive Financial Clearance runner, work-queue inbox, evidence viewer,
  stage-3 handoff. Hardened BFF (validation, authz, audit, error-wrapping).
- Network Adequacy: engine (time/distance, ratio, wait-time, 90%, target; gaps; validation;
  augmentation) + interactive analyst copilot; GA + SD (Maria) seed.
- Seams for the gated work: AI-DTR, CQL criteria, Tier-B backbone, data sources.

## 2. What's left to build

### 2A. Offline (no external services — can be built now)

| ID | Item | Notes |
|----|------|-------|
| O-1 | **Durable evidence persistence** | Replace in-memory/file `defaultEvidenceStore()` with an append-only / FHIR-persisted store. |
| O-2 | **Real data-source adapters (mock→seed-backed)** | Gold-card roster + denial-rate feeds behind the existing seams; provider-directory loader for adequacy. |
| O-3 | **Network Adequacy NA-3 dashboards** | Port the four `providernet_analytics` dashboards (overview, provider hub, compliance, exec) into RHTP. |
| O-4 | **Network Adequacy NA-4 geospatial heatmap** | County choropleth (GA + SD) with drill-down; the copilot's `focusCounties` already drives it. |
| O-5 | **Network Adequacy NA-6 compliance report** | One-click compliance-readiness report (counties at risk, variance, augmentation) as audit evidence. |
| O-6 | **Network Adequacy NA-7 integration** | Shared provider model with gold carding / provider access; link adequacy gaps ↔ referrals ↔ prior auth. |
| O-7 | **Richer CQL criteria content** | Encode more Aetna/UHC policies in the structured criteria model (engine exists; content work). |
| O-8 | **Interactive stage-3 deepening** | Drive the existing `/prior-auth` machine end-to-end from the thread context (currently a navigational handoff). |
| O-9 | **Accessibility pass (whole app)** | Extend the aria/roles/semantics done on new components to the older pages; add axe checks. |

### 2B. Gated (need keys / infra / data / people)

| ID | Item | Blocker |
|----|------|---------|
| G-1 | **Live AI-DTR generation** | Docker + `ANTHROPIC_API_KEY` + `AI_DTR_ENDPOINT`; seam is wired, falls back to deterministic. |
| G-2 | **LLM narration for the adequacy copilot** | Optional GPT-5/Claude layer over the deterministic assistant; needs a key. |
| G-3 | **Executable CQL + SME sign-off** | Clinical SME review before any auto-approval; PoC ruleset is flagged not-SME-reviewed. |
| G-4 | **Tier-B backbone stand-up** | Deploy the WSO2 reference implementation (APIM/IS/OH/Ballerina/ITX); wire live clients via `BACKBONE_*`. |
| G-5 | **Conformance runs** | Inferno / Da Vinci (CRD/DTR/PAS, US Core, CARIN, SMART), X12 278/275, once G-4 is up. |
| G-6 | **Live adequacy data** | Real provider directory (NPPES + plan files), member geo by LOB, wait-time/secret-shopper feeds (NA-8). |
| G-7 | **Production security review** | PHI handling in evidence persistence + adequacy geo; pen-test; secrets management. |

## 3. Test plan (how each is proven)

### 3.1 Unit + behavior (vitest) — the primary gate
- **Command:** `npx tsc --noEmit && npx vitest run && npm run lint` (current: 145 passing).
- **Coverage to add with each increment:**
  - O-1: evidence store round-trip against the new backend; concurrency; corruption rejection.
  - O-2: adapter normalization + the engine consuming real-shaped records; accuracy anchors.
  - O-3/O-4/O-5: view-model + report-generator units; the copilot `focusCounties` → heatmap mapping.
  - O-7: per-policy criteria evaluation vs SME-authored expected outcomes.
  - G-1/G-2: generator/assistant selection + not-configured fallback (already patterned).
- **Regression guards:** the policy corpus-accuracy suite and the adequacy seed spread test
  must stay green (catch parser/seed drift).

### 3.2 API / integration
- Exercise each BFF route (`/api/financial-clearance`, `/api/evidence/[id]`, `/api/work-queue`,
  `/api/network-adequacy`) for: auth 401, authz 403, validation 400/422, happy-path 200,
  error 500 — asserting **PHI-safe** bodies and audit emission. (Add route-level tests with a
  mocked session.)

### 3.3 End-to-end (Playwright) — `e2e/`
- Install: `npm i -D @playwright/test && npx playwright install chromium`; run `npx playwright test`.
- Existing smoke: CMS hub, interactive clearance, gold-carded vs PA-required, queue→evidence.
- **To add:** the stage-3 handoff banner; the network-adequacy copilot (ask → grounded answer →
  validate → focus the gap table); state switch GA↔SD.

### 3.4 Conformance (Tier B, gated on G-4)
- Inferno Da Vinci CRD/DTR/PAS + US Core + CARIN + SMART App Launch; X12 278/275 round-trip via
  ITX against the payer companion guide; CMS-0057-F operational SLAs. See `docs/conformance-plan.md`.

### 3.5 Accessibility
- axe-core in Playwright on each surface; keyboard-only nav; contrast; screen-reader labels
  (aria/roles/semantics already on new components — extend app-wide per O-9).

### 3.6 Security / privacy
- PHI-safety assertions on every API payload + persisted record (pattern exists for evidence).
- Confirm no secrets in `NEXT_PUBLIC_*`; the adequacy copilot + AI-DTR run server-side only.
- Pen-test + dependency scan before any production use (G-7).

### 3.7 Performance
- Engine over a full-corpus / full-directory dataset (adequacy across all counties/specialties);
  BFF latency budgets; heatmap render with many counties.

### 3.8 Domain validation (SME / UAT)
- Clinical SME sign-off on CQL criteria (G-3); network-adequacy SME review of thresholds by
  program/county-type (they change annually — keep them configurable data).
- Analyst UAT of the copilot against the storyboard scripts (analysis + validation flows).

## 4. Suggested order

1. **O-1, O-2** (durable persistence + real-shaped data) — makes everything else production-real.
2. **NA-3 → NA-4 → NA-5-report (O-3/O-4/O-5)** — completes the adequacy experience.
3. **O-6, O-8** (integration + stage-3 deepening) — one connected platform.
4. **O-9 + §3.2/§3.3 test build-out** — prove it.
5. **Gated track** (G-1…G-7) as keys, the Tier-B backbone, data feeds, and SME time become available.

> Decision-support outputs (propensity, adequacy recommendations, estimates) are **not**
> determinations. The payer `ClaimResponse` and the certified filing are authoritative.
