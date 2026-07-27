# RHTP — What We Built

**A complete narrative of the Rural Health / Total Cost of Care platform: a single, offline-demoable payer application that satisfies two CMS mandates — interoperability & prior authorization (CMS-0057-F) and network adequacy — unified around one member, Maria, and enabled by human-gated AI.** Built with IBM Bob + Claude.

---

## 1. Executive summary

RHTP is a payer platform for a rural, total-cost-of-care program. In this build we delivered, end to end and demonstrable on mock data with no external services:

- The **four CMS-0057-F provisions** (Patient Access, Provider Access, Payer-to-Payer, Prior Authorization) as native in-app experiences over a secure FHIR back-end-for-frontend (BFF).
- A connected **"Golden Thread" financial-clearance workflow** — Eligibility → Medical Necessity → Prior Authorization → Patient Estimation — unified by a persisted, auditable **Evidence Record**, and differentiated by **gold carding**, a transparent **propensity-to-deny** score, and reviewer **work queues** with CMS SLA timers.
- A **generalized Policy Engine** that ingests any payer/state policy and evaluates a member's order into a Coverage Determination, seeded from 17 real Aetna and UnitedHealthcare policies.
- A **Network Adequacy** capability with an **interactive analyst copilot** that both analyzes and *validates* provider-network adequacy against CMS standards — seeded for Georgia and, crucially, **South Dakota (Maria's state)**, including the Pine Ridge and Rosebud reservation counties.

Everything is green: `tsc` 0 errors, **145 automated tests passing**, `next lint` clean on the application code. AI is server-side, human-gated, and PHI-safe throughout.

---

## 2. The problem

A rural payer faces two simultaneous federal obligations that most systems treat as separate silos:

1. **CMS-0057-F** (effective operationally in 2026–2027) mandates four interoperability APIs and faster, more transparent **prior authorization** — 72-hour expedited / 7-day standard decisions with specific denial reasons. Prior authorization is the single largest source of provider abrasion and care delay.
2. **Network adequacy** is mandated across Medicare Advantage (42 CFR §422.116), Medicaid managed care (§438.68 + the 2024 "Ensuring Access" rule's appointment-wait-time standards), and Marketplace QHPs (§156.230) — the plan must *prove* it has enough providers, close enough, with short enough waits, by specialty and line of business, especially in rural and frontier areas.

For a member like **Maria** — South Dakota Medicaid, rural, multiple chronic conditions — these obligations are not abstract: they determine whether her ordered care gets authorized quickly and whether there is even an in-network provider within reach. RHTP addresses both in one platform.

---

## 3. The platform at a glance

RHTP is a **Next.js 15 / React 19 / TypeScript (strict) / Tailwind** application. Its defining architectural choice is a strict **BFF security model**: the browser only ever calls RHTP's own `/api/*` routes; SMART tokens are held server-side (encrypted, httpOnly) and never exposed; FHIR is reached only through `/api/fhir/*`. Every privileged action emits a **PHI-safe audit event** (references and codes, never PHI payloads).

The platform is **offline-first**: dev stubs and a seeded HAPI FHIR server make every capability demonstrable with no keys or infrastructure. Live, standards-conformant operation is a **configuration switch, not a rewrite** — `BACKBONE_*` endpoints point the client seams at the **WSO2 CMS-0057-F reference implementation** (kept as its own separate stack, a documented Tier-B prerequisite). This "Tier A offline / Tier B live" split let us build and prove the entire experience without waiting on infrastructure.

### 3.1 Where the code lives — the two branches

The repository has two branches:

- **`main`** — the base RHTP application as it existed before this engagement: the rural care-planning and whole-person-care experience (care plans, the whole-person graph, dashboards), the `md-smart-launch` demo, the presentation screens, the existing services and mock datasets, and the local HAPI FHIR server under `fhir/`. It is the default branch (`origin/HEAD → main`) and does **not** yet contain any of the CMS-0057-F / Golden Thread / Network Adequacy work.
- **`feat/cms0057f-native`** — the feature branch that carries **everything built in this engagement**, on top of `main` (branch point: `f12162c`, "MD Smart App"). It is **13 commits** ahead of `main`; it is the branch to **run the demo from** and, when ready, to merge/PR into `main`.

What the feature branch adds, by area:

| Area | Directory | What's there |
|---|---|---|
| Foundation (Slice 0) | `src/lib/{server,fhir,authz,flags}` | server-mediated SMART auth, FHIR BFF, validation, PHI-safe audit, RBAC guard, feature flags |
| Provisions (Slices 1–6) | `src/app/(member\|provider\|ops\|reviewer)`, `src/lib/{workflow,dtr,client}`, `src/app/api/*` | the four CMS-0057-F provision surfaces + CRD/DTR/PAS, dev stubs |
| Policy Engine | `src/lib/policy` (+ `data/`, `ingest/`) | normalized model, adapters, `evaluate()`, 17-policy seed, gold carding, propensity, CQL-style criteria |
| Evidence | `src/lib/evidence` | append-only Coverage Determination Record + persistence store |
| Golden Thread | `src/lib/goldenThread`, `src/components/goldenThread`, `src/app/(reviewer)/{financial-clearance,work-queue,evidence}` | four-stage thread, orchestrator + machine, work queue, reviewer UI, stage-3 handoff |
| Tier-B seams | `src/lib/backbone` | config + client seams for the WSO2 reference implementation |
| Network Adequacy | `src/lib/networkAdequacy`, `src/components/networkAdequacy`, `src/app/(analyst)/network-adequacy` | adequacy engine, GA+SD seed, analyst copilot, BFF route |
| Install / tooling | `install/`, `tools/seed/` | Tier-A dev stack, seed generators + policy parser |
| Docs | `docs/` (+ `docs/archive/`) | architecture, plans, conformance, this narrative + demo plan |
| Tests / e2e | `tests/`, `e2e/` | 145 vitest tests + Playwright smoke specs |

`main` also carries 2 commits (CI workflow files, e.g. `eslint.yml`) that aren't on the feature branch; they merge cleanly on integration. The new work is intentionally isolated on `feat/cms0057f-native` so it can be reviewed and merged as one coherent feature.

**On GitHub** (`github.com/rickwill-ibm/RHTP-Code-Base`), both branches are present and **fully pushed**:

| Branch | Role | Tip (as of writing) | Contains the new work? |
|---|---|---|---|
| `main` | **default** (`origin/HEAD`) | `9f6436f` "Create eslint.yml" | No — base app + CI only |
| `feat/cms0057f-native` | feature | `8554349` (this engagement) | **Yes — all of it** |

The path to release is a pull request **`feat/cms0057f-native` → `main`**. Until that PR is merged, the CMS-0057-F / Golden Thread / Network Adequacy platform lives entirely on the feature branch; the demo runs from `feat/cms0057f-native`.

---

## 4. Capability 1 — the CMS-0057-F native experience

The four provisions are first-class surfaces reachable from a single `/cms` hub:

- **Patient Access** — a member sees coverage, conditions, and prior-auth status, including both an **approved** and a **denied** PA with the denial's medical-necessity reasons.
- **Provider Access** — `$member-match` establishes the treatment relationship, then the provider reads the member's clinical data with the correct authorization *basis* (not just UI).
- **Payer-to-Payer** — an asynchronous bulk `$export` imports a new member's history from their prior payer.
- **Prior Authorization** — the Da Vinci **CRD → DTR → PAS** flow, with a hard **human gate** before submission: an agent may prepare the claim, but only a human approver submits, and the LLM never sets Approved/Denied — those come only from the payer's `ClaimResponse`.

All four run offline via dev stubs; the 72h/7d decision SLAs and denial reasons are modeled in the prior-auth state machine.

---

## 5. Capability 2 — the Golden Thread (Financial Clearance)

The centerpiece reframes prior authorization not as an isolated transaction but as **stage 3 of one connected, evidence-threaded workflow**, launched in context:

1. **Eligibility** — active coverage and "does this need PA?" (net of gold carding).
2. **Medical Necessity** — the Policy Engine evaluates the order, surfaces indications and **deficiencies**, and drives a remediation loop.
3. **Prior Authorization** — the existing CRD → DTR → PAS screens, entered via a **stage-3 handoff** that carries the order and evidence context.
4. **Patient Estimation** — a Good Faith Estimate (No Surprises Act) with a propensity-to-pay band.

Four things make it more than a wizard:

- **The Evidence Record** — an append-only, point-in-time **Coverage Determination Record** that threads every stage and doubles as the audit spine. It is persisted and viewable, so a reviewer can see exactly how a determination was reached.
- **Gold carding** — providers with a high approval rate (≥ threshold over a look-back, per NPI × procedure × payer) are **exempt** from PA; the thread skips stage 3 and records the exemption auditably. Rooted in state law (Texas HB 3459 and successors) and voluntary payer programs.
- **Propensity-to-deny** — a transparent, additive, decision-support score (never the determination) that routes high-risk cases to a reviewer with partial evidence.
- **Reviewer work queue** — items routed by disposition (auto-cleared / ready / high-risk / denied-appeal / more-info) with 72h/7d SLA timers and breach flags, each drilling into its Evidence Record.

An **interactive runner** lets a reviewer run the whole thread live for a chosen order and provider, watching a gold-carded provider clear instantly while a non-gold provider is routed to PA.

---

## 6. Capability 3 — the generalized Policy Engine

Prior authorization turns on two questions — *does this require PA?* and *is it medically necessary?* — and every payer answers them in a different document format. The Policy Engine makes the **answer logic source-agnostic**: a source-specific extractor produces records, a pluggable **ingestion adapter** normalizes them, and the engine evaluates against one normalized model, unchanged per payer.

We parsed **all 17 supplied policies** — 15 Aetna Cardiac Clinical Policy Bulletins and 2 UnitedHealthcare prior-authorization lists — into a seed library, validated **19/19 against known source anchors** (e.g., the Cardiac MRI CPB's exact covered CPT set and indications). `evaluate(member, order, library)` returns a Coverage Determination: criteria-gated medical necessity (with the member's diagnoses checked against the covered set), experimental/not-covered (likely denial), or code-on-PA-list (PA required). A **CQL-style structured-criteria** model and an SME-review gate are in place for the deeper clinical logic that follows.

---

## 7. Capability 4 — Network Adequacy + the analyst copilot

The newest capability answers the *other* mandate. An **adequacy engine** computes network adequacy by **specialty × county × line of business** against configurable CMS standards — time/distance, provider-to-member ratio, appointment wait-time, 90%-in-network, and a target — then derives **prioritized gaps** and **augmentation** recommendations, and **validates** any cell against each standard with a pass/fail and the exact shortfall.

It is seeded for two states. Georgia carries the pediatric storyboard (Atlanta metro plus a rural county). **South Dakota — Maria's state** — carries Sioux Falls, Rapid City, Aberdeen, and the **Pine Ridge (Oglala Lakota) and Rosebud (Todd) reservation counties**, where specialists are absent and distances are frontier-scale, producing genuine *critical* gaps that explain the access reality behind Maria's care.

The centerpiece is the **interactive analyst copilot**. A payer or state analyst converses with it to **analyze** (state baseline → prioritize gaps → deep-dive a county → recommend augmentation) and to **validate** (does this county/specialty/LOB meet the CMS standards? → per-standard pass/fail, e.g. a reservation county failing time-distance, ratio, and wait-time at once). Critically, it is **deterministic-first**: it parses the analyst's natural language into a typed intent and answers *from the engine*, so it works offline with no API key and every number is reproducible and defensible. An optional LLM layer can narrate on top; recommendations are always human-gated.

---

## 8. AI enablement — the IBM Bob + Claude story

AI runs through the platform, always under the same discipline:

- **Server-side only** — no keys in the browser; the network-adequacy copilot and the AI-DTR generator run in the BFF.
- **Deterministic-first / human-gated** — the copilot and the DTR generator produce grounded, reproducible output with no key, and any AI *recommendation* (augmentation, DTR draft, action plan) requires human approval before it is acted on. The LLM never makes the determination.
- **PHI-safe + audited** — model calls carry references and aggregates, never identifiable PHI, and every call is audited.

This is the AI-enablement narrative made concrete: knowledge graph of policy + provider data, identity via SMART, decision support via the engines, and agentic assistance via the copilots — with a human always in the loop.

---

## 9. Security, compliance, and engineering rigor

- **Security** — BFF token isolation, member-scope authorization, input validation, audited actions, PHI-safety assertions, structured error handling on every route.
- **Compliance mapping** — CMS-0057-F (four APIs, 72h/7d, denial reasons; Da Vinci CRD/DTR/PAS + Coverage Determination Record); network adequacy (MA §422.116, Medicaid §438.68 + 2024 rule, QHP §156.230); No Surprises Act (GFE, directory accuracy); SMART App Launch; US Core; CARIN; X12 278/275.
- **Rigor** — every increment passed the same gate: `tsc --noEmit` 0 errors, `vitest` (now **145 passing**), scoped `prettier`, `next lint`. A corpus-accuracy regression guards the policy library; a seed-spread test guards adequacy. Playwright e2e smoke tests and an accessibility pass (aria/roles/semantics) accompany the UI.

---

## 10. How it maps to the mandates

| Mandate | What RHTP demonstrates |
|---|---|
| CMS-0057-F — four APIs | Patient / Provider / Payer-to-Payer / Prior-Auth surfaces over the BFF |
| CMS-0057-F — faster PA | Golden Thread + CRD/DTR/PAS, 72h/7d SLAs, denial reasons, human gate |
| CMS-0057-F — Coverage Determination Record | the persisted, auditable Evidence Record |
| Gold carding (state law) | PA exemption for high-performing providers, recorded auditably |
| Network adequacy (MA/Medicaid/QHP) | adequacy engine + copilot: analyze *and* validate by specialty × county × LOB |
| No Surprises Act | Good Faith Estimate; provider-directory status |

---

## 11. Status and what's next

The full **offline** platform is built, hardened, and green. What remains is captured in `docs/remaining-work-and-test-plan.md`: offline polish (durable persistence, the adequacy dashboards + heatmap + compliance report, richer CQL content, an app-wide accessibility pass) and the externally-gated track (live AI narration, SME criteria sign-off, standing up the Tier-B backbone + conformance runs, and wiring real provider-directory/geography/membership data so adequacy becomes authoritative).

> Throughout, decision-support outputs — propensity-to-deny, adequacy recommendations, cost estimates — are explicitly **not** determinations. The payer's `ClaimResponse` and the certified network filing are authoritative.

*Prepared with IBM Bob + Claude. One platform, one member, two CMS mandates, human-gated AI.*
