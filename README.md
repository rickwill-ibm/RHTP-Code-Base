# RHTP — Rural Health / Total Cost of Care Platform

A Next.js application that delivers a **native, CMS-0057-F-aligned prior-authorization
and financial-clearance experience** for a rural health / total-cost-of-care payer
program, on top of a FHIR back-end. It combines the four CMS-0057-F interoperability
provisions with a connected "Golden Thread" workflow (Eligibility → Medical Necessity
→ Prior Authorization → Patient Estimation), a generalized payer **Policy Engine**,
**gold carding**, and a **Network Adequacy** capability with an interactive analyst
copilot — all demonstrable offline on mock data.

## What it does

- **CMS-0057-F native experience** — Patient Access, Provider Access, Payer-to-Payer,
  and Prior Authorization (Da Vinci CRD → DTR → PAS), each as a first-class in-app
  surface reached through a server-mediated FHIR BFF.
- **Golden Thread — Financial Clearance** — the four PA stages run as one
  SMART-launched, evidence-threaded workflow, unified by a persisted **Evidence Record**
  (the Da Vinci Coverage Determination Record) and differentiated by **gold carding**,
  a transparent **propensity-to-deny** score, and reviewer **work queues** with
  CMS-0057-F SLA timers (72h expedited / 7d standard).
- **Generalized Policy Engine** — ingests any payer or state-agency medical policy into
  one normalized model and evaluates a member's order into a Coverage Determination
  (requires-PA · criteria met · deficiencies · propensity). Ships with the real parsed
  Aetna Cardiac CPBs and UnitedHealthcare PA-requirement lists as a seed library.
- **Gold carding** — exempts high-performing providers (≥ approval-rate threshold over a
  look-back window, per NPI × procedure × payer) from PA, recorded auditably.
- **Reviewer experience** — an interactive Financial Clearance runner (run a member's
  order live), a **work-queue inbox** routed by disposition with SLA timers and breach
  flags, and an **Evidence Record viewer** (the auditable Coverage Determination Record).
  When PA is required, a **stage-3 handoff** continues the same thread into the existing
  Prior-Authorization (CRD → DTR → PAS) screens.
- **Network Adequacy + analyst copilot** — measure, monitor, and **validate** provider
  network adequacy by specialty × county × line of business against CMS standards
  (time/distance, in-network %, wait-time, ratio), with prioritized gaps and augmentation.
  An **interactive assistant** lets a payer or state analyst analyze *and* validate
  conversationally — grounded in the engine, so it works offline with no API key. Seeded
  for Georgia (storyboard) and **South Dakota (Maria's state)**, including the Pine
  Ridge / Rosebud reservation counties. Maps to MA §422.116, Medicaid §438.68 + the 2024
  Access rule, and QHP §156.230.

## Prerequisites

**Offline (Tier A) — nothing external required.** The dev stack runs all four provisions
and the full Golden Thread on mock data using dev stubs + a seeded HAPI FHIR server. Just
`npm install` and follow Quick start below.

**Live / standards-conformant (Tier B) — requires the CMS-0057-F reference implementation.**
RHTP is the *application* layer. Live eligibility (X12 270/271), real Da Vinci CRD → DTR →
PAS, and X12 278/275 conversion are provided by the **WSO2 CMS-0057-F reference
implementation** (WSO2 API Manager + Identity Server + Open Healthcare accelerator +
Ballerina services + FHIR server + ITX), deployed and operated **as its own separate
stack** — it is not vendored into this repo.

- **Reference implementation (prerequisite for Tier B):** https://github.com/wso2/reference-implementation-cms0057f
- **Regulation:** [CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F)](https://www.cms.gov/priorities/key-initiatives/burden-reduction/interoperability/policies-and-regulations/cms-interoperability-and-prior-authorization-final-rule-cms-0057-f)

RHTP connects to it purely through **configuration** — set the `BACKBONE_*` endpoints in
`src/lib/backbone/config.ts`, and the live client seams in `src/lib/backbone/clients.ts`
switch from dev stubs to the live services. No application code change is needed to move
Tier A → Tier B. See `docs/conformance-plan.md` for the cutover + Inferno / Da Vinci
conformance steps and `docs/ARCHITECTURE.md` §5 for how the seam works.

## Quick start (Tier A — offline dev stack)

```bash
npm install
# offline mock stack (dev SMART session + dev stubs + seeded FHIR)
./install/install.sh          # or install/install.ps1 on Windows
npm run dev                   # http://localhost:4029
```

Then open:

- `/cms` — the CMS-0057-F hub (links to all provision surfaces)
- `/financial-clearance` — the Golden Thread: run a clearance interactively, then hand off
  to Prior Authorization or view the Evidence Record
- `/work-queue` — the reviewer inbox (queues by disposition + SLA), which drills into
  `/evidence/:id`
- `/network-adequacy` — adequacy analytics + the analyst copilot (switch between GA and
  SD/Maria; ask it to analyze or validate)

Validate:

```bash
npx tsc --noEmit     # type-check (0 errors)
npx vitest run       # unit/behavior tests (145 passing)
npm run lint         # next lint

# optional end-to-end smoke tests (Playwright, not installed by default)
npm i -D @playwright/test && npx playwright install chromium
npx playwright test  # runs e2e/ against the dev server (port 4029)
```

## How it's built

- **Next.js 15 / React 19 / TypeScript (strict) / Tailwind.** Path alias `@/` → `src/`.
- **BFF security model** — the browser only calls `/api/*`; SMART tokens are held
  server-side (encrypted, httpOnly), never exposed to the client. FHIR is reached
  through `/api/fhir/*`. See `docs/ARCHITECTURE.md`.
- **Offline-first** — dev stubs (`ALLOW_DEV_MOCK_AUTH=true`) and a seeded FHIR bundle
  make all four provisions and the whole Golden Thread demonstrable with no external
  services. Live, standards-conformant operation uses the Tier-B backbone (below).
- **Tier-B backbone (prerequisite for live operation)** — the WSO2 CMS-0057-F reference
  implementation (see **Prerequisites** above), gated by `BACKBONE_*` config and exercised
  via the client seams in `src/lib/backbone/`. Kept as a separate stack; RHTP connects by
  configuration only. See `docs/conformance-plan.md`.

## Documentation

| Doc | What it covers |
|-----|----------------|
| `docs/ARCHITECTURE.md` | End-to-end architecture: provisions, BFF, Policy Engine, Golden Thread, backbone, standards mapping. |
| `docs/IMPLEMENTED_TODAY.md` | The most recent build increment — Policy Engine, Golden Thread, gold carding, productionization — with the file map and test counts. |
| `docs/golden-thread-plan.md` | The living Golden Thread improvement plan and roadmap (§6A engine, §9 increments). |
| `docs/conformance-plan.md` | Tier-B cutover + Inferno / Da Vinci conformance test plan. |
| `docs/network-adequacy-plan.md` | Network Adequacy integration plan — CMS mandate mapping, analyst copilot, NA-0…NA-8 increments. |
| `docs/remaining-work-and-test-plan.md` | What's left to build across the platform + the test plan to prove it. |
| `docs/current-state.md`, `docs/integration-endpoints.md`, `docs/traceability.md`, `docs/sample-data-coverage.md` | Build state, endpoint map, standards traceability, and mock-data coverage. |
| `docs/archive/` | Superseded planning documents, retained for history. |

## Status

The full offline experience is implemented, hardened, and green (`tsc` 0, **145 vitest
passing**, `next lint` clean on the app code): the four CMS-0057-F provisions, the complete
Golden Thread (Policy Engine, gold carding, propensity, persisted Evidence Record, the four
stages, work queue), the reviewer UI (interactive runner, work-queue inbox, evidence
viewer, stage-3 handoff), the **Network Adequacy engine + analyst copilot** (GA + SD/Maria),
and the productionization seams. The BFF routes are input-validated, authorized, audited,
and error-wrapped; e2e smoke tests are provided (Playwright).

What remains is captured in `docs/remaining-work-and-test-plan.md`. The larger items need
external services or people: live AI-assisted DTR + network-adequacy narration (Docker +
key), clinical SME review of executable CQL criteria, standing up the Tier-B backbone (the
WSO2 reference implementation above) for live conformance-tested adjudication, and wiring
real provider-directory / geography / membership data for authoritative adequacy.

> Decision-support outputs (propensity-to-deny, cost estimates) are **not** coverage
> determinations. The payer `ClaimResponse` is authoritative.
