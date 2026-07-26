# Network Adequacy — Integration Plan

**How to add a mandated, payer-grade Network Adequacy capability to RHTP — folding in the `providernet_analytics` asset, aligned to CMS network-adequacy rules, and connected to the CMS-0057-F Golden Thread build.** Built with IBM Bob + Claude. _Plan for approval — no code until you say go._

---

## 1. What I reviewed

From `C:\Users\909750897\Downloads\Network Adequacy`:

- **`providernet_analytics`** — a standalone **Vite + React 18** app (Redux Toolkit, Tailwind, D3 + Recharts, Framer Motion, React Router v6, `openai` SDK). Four dashboards: **Network Overview** (KPIs, geographic heatmap, provider status feed, specialty-adequacy grid), **Provider Analytics Hub** (ratios, leaderboard, onboarding), **Compliance Monitoring** (compliance matrix, scorecard, trend chart, alert queue, reporting controls), and **Executive Summary** (KPI status, network health, optimization table, action items). An **AI service** (`networkAdequacyService.js`) calls **OpenAI GPT-5** for structured gap analysis + action plans and a streaming analyst chat.
- **Notes** — an "Enhance Payer Analysts' Ability…" storyboard for a **Pediatric Provider Network Adequacy Review Assistant** (state baseline → LOB filter → prioritize gaps → advanced filters → deep-dive → compliance-readiness report), plus a 42 KB working-notes file and a dashboard screenshot.

Domain concepts present in the materials: **county-level adequacy %** vs a **threshold** (e.g., 85%), the **CMS 15-mile distance standard**, **Line of Business** (Medicaid / Medicare / Commercial) filtering, **SpecialtyDescription / GapStatus / AugmentType (ELV)**, provider-within-X-miles, and **gap prioritization by population**.

---

## 2. Is there a mandate? — Yes, across every line of business

Network adequacy is not optional; it is federally required and actively tightening. This is what makes it a natural companion to the CMS-0057-F prior-authorization work already in RHTP.

| Program | Rule | What it requires |
|---|---|---|
| **Medicare Advantage** | 42 CFR **§422.116** | Quantitative **time/distance** standards + **minimum provider/facility counts** across ~27 specialty & facility types, scaled by county type (large-metro → rural); **90%** of members must have in-network access within standard. |
| **Medicaid managed care** | 42 CFR **§438.68** + 2024 **"Ensuring Access to Medicaid Services"** final rule | States must set quantitative standards; the 2024 rule adds **appointment wait-time standards** (primary care, OB/GYN, behavioral health, a state-selected specialty) with **independent secret-shopper** validation, phasing through **2027–2028**. |
| **Marketplace / QHPs (FFE)** | 45 CFR **§156.230** + annual Notice of Benefit & Payment Parameters | Reinstated and, for **plan year 2026**, **tightened** quantitative **time/distance** + appointment **wait-time** standards as a **certification** condition. |
| **No Surprises Act** | PHSA §2799A-5 | **Provider-directory accuracy** (verification cadence, response to enrollee inquiries). |
| **State law** | NAIC Network Adequacy Model Act (adopted by most states) | State time/distance, ratios, and directory rules for Medicaid/commercial. |

**Takeaway:** a health plan must *measure, monitor, and remediate* network adequacy by **specialty × county × line of business**, prove it for **certification/audit**, and keep directories accurate. That is exactly what this asset does — so RHTP gains a second mandated CMS capability that shares the same customer, data, and compliance framing as CMS-0057-F.

---

## 3. Reflection — recommended approach (chain of thought)

Three ways to add it:

- **A. Port into RHTP** as a native **Network Adequacy** section (Vite→Next 15, JSX→TSX, app-router pages), AI moved server-side behind the BFF. _One platform, one security model, one design system, deployable together._
- **B. Keep it separate**, link from the RHTP hub (iframe / micro-frontend). _Fast, but two stacks, two auth models, a client-exposed AI key, and no shared data._
- **C. Extract the logic, rebuild the UI** natively. _Cleanest long-term, most work up front._

**Recommendation: A (port into RHTP), executed as B-then-C in practice** — stand the pages up quickly inside RHTP on mock data (fast credibility), while extracting the adequacy math into a pure, tested domain library and moving AI + secrets server-side (correctness + security). This keeps RHTP a single, coherent, demoable payer platform and reuses everything already built (BFF, auth, audit, flags, Evidence/Golden-Thread patterns, IBM/Claude AI-enablement story).

Two things must change on the way in, non-negotiably:
1. **Secrets off the client.** The asset calls OpenAI from the browser with a Vite-exposed key. In RHTP, all model calls go **server-side through the BFF** (no `NEXT_PUBLIC_` secrets), consistent with the rest of the app. The model can stay GPT-5 or swap to **Claude**, and AI **recommendations are human-gated**, never auto-executed.
2. **PHI-safety.** Adequacy works on **provider + geography + membership counts**, not clinical PHI — but member-level geo is sensitive; the same audit/redaction discipline (references + aggregates, not identifiers) applies.

---

## 4. Target architecture in RHTP

```
Browser (Next.js pages, Tailwind, Recharts/D3)
   │  /api/* only
   ▼
BFF / API routes
   ├─ /api/network-adequacy/summary      → adequacy metrics by specialty×county×LOB
   ├─ /api/network-adequacy/gaps         → prioritized gap list
   ├─ /api/network-adequacy/analyze      → AI gap analysis (server-side; human-gated)
   └─ /api/network-adequacy/action-plan  → AI action plan (server-side; human-gated)
   ▼
Domain library  src/lib/networkAdequacy/  (pure, deterministic, tested)
   types · adequacyEngine · gapPrioritization · augmentationRecommender · fromDirectory
   ▼
Data  (mock seed now → live directory/geo later)
```

- **Pages** under a new route group, surfaced from the `/cms` hub next to the four provisions: Network Overview, Provider Analytics Hub, Compliance Monitoring, Executive Summary.
- **Design system:** reuse RHTP's Tailwind + component conventions; port the charts (Recharts is already the pattern in RHTP dashboards).
- **AI:** one server-side `networkAdequacyAI` service behind the flag `networkAdequacyAI` (mirrors `aiDtrGeneration`) with a deterministic offline fallback, so it demos without a key.

---

## 5. Data model (normalized)

A small, source-agnostic model the engine reasons over (mirrors the asset's fields + the storyboard's columns):

- **Provider** — npi, name, specialtyDescription, location (lat/long, county), acceptingNewPatients, lob[] (Medicaid/Medicare/Commercial), status (active/credentialing/pending), capacity.
- **GeoUnit** — county (FIPS), state, population, memberCount (by LOB).
- **AdequacyMetric** — key {county, specialty, lob} → adequacyPct, target/threshold, avgDistanceMiles, avgWaitDays, memberProviderRatio, gapStatus.
- **Gap** — {county, specialty, lob, severity, currentCoverage, requiredCoverage, affectedPopulation}.
- **AugmentCandidate** — provider(s) whose addition most improves adequacy (AugmentType e.g. **ELV**), with multi-county impact + estimated adequacy lift.

Standards baked in as configurable thresholds: **time/distance** (e.g., 15 mi), **wait-time** (Medicaid 2024 rule), **ratio**, and **90% in-network** (MA) — parameters, not constants, since they differ by program/county type.

---

## 6. Mapping to CMS mandates (capability → regulation)

| Capability (what we build) | Regulation it satisfies |
|---|---|
| Time/distance adequacy by specialty×county×county-type | MA §422.116; QHP §156.230; state law |
| Appointment **wait-time** measurement + secret-shopper import | Medicaid 2024 Access rule §438.68 |
| **90% in-network** access check | MA §422.116 |
| **Line-of-Business** segmentation (Medicaid/Medicare/Commercial) | all three regimes, reported separately |
| **Gap prioritization + augmentation** recommendations | remediation expected under all regimes |
| **Compliance-readiness report / matrix / scorecard** | certification & audit evidence (MA, QHP, Medicaid) |
| **Provider directory** status feed / accuracy | No Surprises Act directory rules |

---

## 7. Connection to the existing CMS-0057-F / Golden Thread build

Network adequacy is not a silo — it plugs into what's already there:

- **Provider Access / referrals** — adequacy gaps explain *why* a member is steered to a given provider; the same provider directory feeds both.
- **Prior Authorization** — out-of-network or scarce-specialty orders (from the Golden Thread) can be flagged against adequacy; augmentation targets inform steering.
- **Gold carding** — the provider-performance data behind gold cards and the provider roster behind adequacy are the same substrate; one provider model can serve both.
- **AI-enablement story** — the analyst chat mirrors the DTR/Golden-Thread AI pattern (server-side, human-gated), reinforcing the IBM Bob + Claude narrative.
- **Hub** — a single `/cms` entry point now spans **interoperability + prior auth + network adequacy**, i.e., the payer's CMS-mandated obligations in one platform.

---

## 8. Implementation increments (on `feat/cms0057f-native`, same gates as prior work)

Each is bounded and testable (`tsc` 0 · vitest · scoped prettier · `next lint`). Offline unless noted.

| # | Increment | Scope | Offline? | Est. |
|---|---|---|---|---|
| **NA-0** | **Scope + data contract + seed** | Normalized model (§5); a realistic **seed dataset** (e.g., Georgia pediatric + the asset's specialties/KPIs) as JSON; thresholds config. | ✅ | S |
| **NA-1** | **Adequacy domain library** | `src/lib/networkAdequacy/`: `adequacyEngine` (compute adequacy % vs threshold by county×specialty×LOB; time/distance, wait-time, ratio, 90% checks), `gapPrioritization` (severity × population), `augmentationRecommender` (best provider adds + multi-county lift). Pure + unit-tested. | ✅ | M |
| **NA-2** | **Interactive Assistant service + BFF** | The analyst **copilot** (§9): typed intents (baseline/filter/prioritize/deep-dive/compare/augment/**validate**) answered **deterministically from the engine** (works offline, no key), with a flag-gated GPT-5/Claude layer for free-form phrasing + narrative; human-gated action plans; audited, PHI-safe. Routes `/api/network-adequacy/{summary,gaps,assist,action-plan}`. | ✅ (deterministic) · ⚠️ LLM layer needs a key | M |
| **NA-3** | **Dashboards (port)** | Network Overview, Provider Analytics Hub, Compliance Monitoring, Executive Summary as Next.js pages in RHTP's design system; port KPI cards, specialty grid, ratio/leaderboard, compliance matrix/scorecard/trend, exec optimization table. Recharts. | ✅ (seed) | L |
| **NA-4** | **Geospatial heatmap** | County **choropleth** (adequacy % by county) with drill-down; start with a lightweight inline-SVG / topojson approach (Georgia demo), extensible to any state. | ✅ | M |
| **NA-5** | **Assistant UI (copilot chat)** | The conversational surface for NA-2: an interactive chat that runs the storyboard analysis flow **and** the validation flow, drives the dashboard/heatmap via visualization actions, and offers a human-gated "generate compliance-readiness report / action plan" button. | ✅ (deterministic) · ⚠️ LLM optional | M |
| **NA-6** | **Compliance reporting** | Compliance matrix + scorecard + a **compliance-readiness report** export (counties at risk, adequacy variance, augmentation areas) as the certification/audit artifact. | ✅ | M |
| **NA-7** | **Golden-Thread integration** | Shared provider model; link adequacy gaps ↔ provider access / referrals / prior-auth; gold-card performance feed; `/cms` hub entry + nav. | ✅ | M |
| **NA-8** | **Live data** | Wire real provider directory (e.g., NPPES + plan network files), member geo by LOB, and real wait-time / secret-shopper feeds behind the same data seams. | ❌ needs data sources | L |

**First slice — building now:** **NA-0 → NA-1 → NA-2 → NA-5** — the seed data, the adequacy engine, the **interactive assistant service** (deterministic, offline), and the **copilot chat UI**, so an analyst can converse to analyze and validate on mock data with no API key. Then **NA-3/NA-4** (dashboards + heatmap) and **NA-6/NA-7** (compliance report + Golden-Thread integration). **NA-8** is the live-data lift.

---

## 9. Interactive Virtual Assistant — the analyst copilot (analysis **and** validation)

The centerpiece for the user experience: a conversational assistant that helps a **payer or state** network-adequacy analyst do their job faster and prove compliance. It runs over the adequacy engine (§5/§8-NA-1), so its answers are grounded in real computations, not free text.

**Two jobs:**

- **Analysis** — the storyboard workflow: state baseline → filter by **Line of Business** → prioritize gap counties by population/severity → apply advanced filters (specialty, gap status, distance, augment type) → deep-dive a county/provider → compare current vs target → recommend **augmentation** (which provider adds most improve adequacy, incl. multi-county lift).
- **Validation** — the compliance side a **state reviewer** cares about: "validate County×Specialty×LOB against the applicable CMS standards" → a **pass/fail per standard** (time/distance, 90%-in-network, appointment wait-time, ratio) with the exact shortfall, plus a one-click **compliance-readiness report** (counties at risk, adequacy variance, remediation targets) as audit/certification evidence.

**How it works:**

- **Intent-driven + deterministic-first.** The assistant parses the analyst's request into a typed intent (baseline / filter / prioritize / deep-dive / compare / augment / **validate**) and answers from the engine — so it works **offline with no API key** and every number is reproducible and defensible.
- **LLM-augmented (optional).** When configured (GPT-5 **or** Claude, flag-gated), the LLM handles free-form phrasing, narrative summaries, and the structured action-plan generation the asset already does — but always on top of the engine's grounded metrics.
- **Human-gated.** The assistant proposes *recommendations and draft action/augmentation plans*; a human approves before anything is acted on — the same discipline as the DTR/PAS gates.
- **Server-side + PHI-safe + audited.** All model calls run in the BFF (no key in the browser — a fix from the asset's current client-exposed key); member-level geo is sent only as aggregates; every call is audited.
- **Visualization actions.** Assistant responses carry `visualizationUpdates` (focus counties, highlight providers, open a detail view) so the chat drives the dashboard/heatmap — exactly the storyboard behavior.

This makes the assistant usable by both audiences: a **payer analyst** optimizing the network, and a **state reviewer** validating a plan's filing against the mandate.

---

## 10. Honest notes & risks

- **Tech delta.** The asset is Vite/React-Router/Redux; RHTP is Next 15 App Router. Porting is mechanical but real — Redux state becomes local/server state, `react-router` becomes app-router, `.jsx`→`.tsx` with types. Budget for it (NA-3 is the big one).
- **Security fix is mandatory.** The current client-exposed AI key must not survive the port.
- **Mock → real data.** The dashboards ship on seed data; adequacy is only *true* once wired to a real directory + geo + membership feed (NA-8). Don't over-claim compliance on mock data — it's a demonstration until NA-8.
- **Geospatial scope.** A production choropleth for all states + drive-time isochrones is a larger effort; NA-4 starts with a county-fill demo (Georgia) and grows.
- **Standards are parameters.** Thresholds differ by program and county type and change annually (e.g., PY2026 QHP tightening) — encode them as configurable data, SME-reviewed, not hard-coded.

---

## 11. Recommendation

Adopt **Option A**: fold `providernet_analytics` into RHTP as a native **Network Adequacy** section, sharing the BFF, auth, audit, flags, design system, and provider model with the CMS-0057-F Golden Thread work — giving the payer **interoperability + prior authorization + network adequacy**, all CMS-mandated, in one platform. Start with **NA-0 → NA-1 → NA-3 → NA-4** on seed data for a fast, credible demo; move AI + secrets server-side from day one; treat live data (NA-8) as the path to real compliance.

_Prepared with IBM Bob + Claude. Grounded in the `providernet_analytics` asset and pediatric adequacy storyboard reviewed in `Downloads\Network Adequacy`, and mapped to CMS network-adequacy rules (MA §422.116, Medicaid §438.68 + 2024 Access rule, QHP §156.230, No Surprises Act)._
