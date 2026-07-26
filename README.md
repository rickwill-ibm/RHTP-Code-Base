# RHTP — Rural Health / Total Cost of Care Platform

A Next.js application that delivers a **native, CMS-0057-F-aligned prior-authorization
and financial-clearance experience** for a rural health / total-cost-of-care payer
program, on top of a FHIR back-end. It combines the four CMS-0057-F interoperability
provisions with a connected "Golden Thread" workflow (Eligibility → Medical Necessity
→ Prior Authorization → Patient Estimation), a generalized payer **Policy Engine**, and
**gold carding**, all demonstrable offline on mock data.

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
  look-back window, per NPP × procedure × payer) from PA, recorded auditably.

## Quick start (Tier A — offline dev stack)

```bash
npm install
# offline mock stack (dev SMART session + dev stubs + seeded FHIR)
./install/install.sh          # or install/install.ps1 on Windows
npm run dev                   # http://localhost:4029
```

Then open:

- `/cms` — the CMS-0057-F hub (links to all provision surfaces)
- `/financial-clearance` — the Golden Thread demonstration (runs on the seed member)

Validate:

```bash
npx tsc --noEmit     # type-check (0 errors)
npx vitest run       # unit/behavior tests
npm run lint         # next lint
```

## How it's built

- **Next.js 15 / React 19 / TypeScript (strict) / Tailwind.** Path alias `@/` → `src/`.
- **BFF security model** — the browser only calls `/api/*`; SMART tokens are held
  server-side (encrypted, httpOnly), never exposed to the client. FHIR is reached
  through `/api/fhir/*`. See `docs/ARCHITECTURE.md`.
- **Offline-first** — dev stubs (`ALLOW_DEV_MOCK_AUTH=true`) and a seeded FHIR bundle
  make all four provisions and the whole Golden Thread demonstrable with no external
  services. Live, standards-conformant operation uses the Tier-B backbone (below).
- **Tier-B backbone (optional)** — WSO2 APIM/IS + Open Health accelerator + Ballerina
  services + FHIR server + ITX (X12), gated by `BACKBONE_*` config and exercised via
  the client seams in `src/lib/backbone/`. See `docs/conformance-plan.md`.

## Documentation

| Doc | What it covers |
|-----|----------------|
| `docs/ARCHITECTURE.md` | End-to-end architecture: provisions, BFF, Policy Engine, Golden Thread, backbone, standards mapping. |
| `docs/IMPLEMENTED_TODAY.md` | The most recent build increment — Policy Engine, Golden Thread, gold carding, productionization — with the file map and test counts. |
| `docs/golden-thread-plan.md` | The living Golden Thread improvement plan and roadmap (§6A engine, §9 increments). |
| `docs/conformance-plan.md` | Tier-B cutover + Inferno / Da Vinci conformance test plan. |
| `docs/current-state.md`, `docs/integration-endpoints.md`, `docs/traceability.md`, `docs/sample-data-coverage.md` | Build state, endpoint map, standards traceability, and mock-data coverage. |
| `docs/archive/` | Superseded planning documents, retained for history. |

## Status

The full offline experience — four CMS-0057-F provisions and the complete Golden Thread
— is implemented and green (`tsc` 0, all vitest passing, `next lint` clean). What remains
needs external services: live AI-assisted DTR generation (Docker + key), clinical SME
review of executable CQL criteria, and standing up the Tier-B backbone for live,
conformance-tested adjudication.

> Decision-support outputs (propensity-to-deny, cost estimates) are **not** coverage
> determinations. The payer `ClaimResponse` is authoritative.
