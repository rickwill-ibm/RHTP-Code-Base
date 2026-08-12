# RHTP — Demo Plan

**A scenario-by-scenario demo script that follows one member, Maria, from her prior authorization up to the population-level network-adequacy problem behind her care — proving both CMS mandates on mock data with no external services.** Built with IBM Bob + Claude.

---

## How to run

- **Branch:** `feat/cms0057f-native` (the base `main` branch does not contain this work).
- **Start:**
  ```bash
  git checkout feat/cms0057f-native
  npm install
  ./install/install.sh        # Tier-A offline stack: dev SMART session + dev stubs + seeded FHIR
  npm run dev                 # http://localhost:4029
  ```
- **Auth:** dev-mock (`ALLOW_DEV_MOCK_AUTH=true`) auto-provides a session for the seed member. No keys or backbone required.
- **Start page:** `/cms` — the hub linking every surface below.

Everything runs offline. Decision-support outputs (propensity, adequacy recommendations, estimates) are **not** determinations; the payer `ClaimResponse` and the certified filing are authoritative — say this once, up front.

---

## The narrative arc (three acts, ~20–25 min)

1. **Act 1 — The member.** Maria (rural SD Medicaid) and her CMS-0057-F data.
2. **Act 2 — Her prior authorization.** The Golden Thread runs financial clearance; gold carding, medical necessity, the Evidence Record, the reviewer queue, and the stage-3 CRD→DTR→PAS handoff.
3. **Act 3 — The population.** *Why* is access hard for Maria? The Network Adequacy copilot analyzes and validates her state's network against CMS standards.

---

## Act 1 — The member

### S1 · Patient Access
- **Audience:** everyone. **Mandate:** CMS-0057-F Patient Access API. **Route:** `/cms` → **Patient Access** (`/access`).
- **Steps:** 1) Open `/access`. 2) Point out Maria's **coverage** (SD Medicaid) and **conditions**. 3) Scroll to **prior-auth status** — show the **approved** PA and the **denied** PA with its medical-necessity **denial reasons**.
- **Expected:** coverage + conditions render from seeded FHIR; two ClaimResponses — one approved, one denied with reasons.
- **Talking points:** "This is the member's own view, served through our BFF — the browser never touches FHIR directly. The denied PA shows the *reason*, which CMS-0057-F now requires."

---

## Act 2 — Maria's prior authorization (the Golden Thread)

### S2 · Golden Thread — run a clearance (gold carding)
- **Audience:** clinical ops / payer ops. **Mandate:** CMS-0057-F faster PA + state gold-carding law. **Route:** `/cms` → **Golden Thread** (`/financial-clearance`).
- **Steps:**
  1. In **Run a clearance**, keep order code **`72148`** (lumbar MRI); choose **Provider A — gold-carded**; click **Run clearance**.
  2. Read the result: **No PA required**, outcome `pa-exempt-gold-card`, propensity **0**, "Cleared — routed to **auto-cleared**"; note "Evidence Record persisted."
  3. Change provider to **Provider B — not gold-carded**; **Run clearance** again.
  4. Now: **PA required**, outcome `pa-required-list`, a deficiency, and a **"Proceed to Prior Authorization (stage 3)"** button appears.
- **Expected:** identical order, opposite outcomes based purely on the provider's gold-card status; both persist an Evidence Record.
- **Talking points:** "Same service, same member — the gold-carded provider clears instantly and is *exempt* from PA, recorded auditably. The non-gold provider is routed to PA. That exemption is a real, state-mandated burden-reduction lever."

### S3 · Medical Necessity, propensity & the Evidence Record
- **Audience:** clinical reviewers. **Mandate:** Da Vinci Coverage Determination Record. **Route:** the Medical-Necessity panel from S2.
- **Steps:** 1) In the Provider B result, walk the **Medical Necessity** panel: gold-card status, the **propensity-to-deny** score with its *named factors*, indications, deficiencies, and the **remediation** next-steps. 2) Click **View Evidence Record**.
- **Expected:** a persisted Evidence Record timeline (determination → gold-card → propensity → eligibility → estimation).
- **Talking points:** "The propensity score is transparent — every point is attributable — and it's decision-support, never the determination. The Evidence Record *is* the Da Vinci Coverage Determination Record and our audit spine."

### S3b · Policy Engine branches — criteria-gated & experimental (the sharp version)
- **Audience:** clinical / technical. **Mandate:** Da Vinci CRD medical-necessity logic. **Route:** the `/financial-clearance` **Run a clearance** box (type different order codes; Provider B).
- **Steps:**
  1. Change the order code to **`75561`** (cardiac MRI, governed by Aetna CPB **#0520**); **Run**. The engine takes the **criteria-gated** branch: because the seed member's diagnoses are **SNOMED-coded** and the CPB's criteria read **ICD-10**, you see a **criteria review with a missing-diagnosis deficiency** + remediation.
  2. Change the code to **`0408T`** (a CCM code Aetna lists as *not covered*, CPB #0930); **Run**. Outcome flips to **likely-denial-experimental**.
- **Expected:** one runner, three engine branches by code — `72148` → PA-list, `75561` → criteria review/deficiency, `0408T` → experimental.
- **Talking points:** "This is the engine reading *real parsed payer policy*: a PA-list hit, a criteria-gated medical-necessity check against the CPB's covered diagnoses, and an experimental denial — from one `evaluate()` call. The **criteria-*met* (approve)** variant needs a member carrying a matching ICD-10 diagnosis; that path is proven in the automated tests, not shown here because the seed member's conditions are SNOMED-coded."
- **Accuracy note:** the engine's determination lives in *this* Medical Necessity stage; the CRD card in S5 is a **dev stub**, not engine-driven (see S5).

### S4 · Reviewer work queue → evidence drill-down
- **Audience:** PA reviewers / ops leadership. **Mandate:** CMS-0057-F 72h/7d SLAs. **Route:** `/financial-clearance` → "**Open the reviewer work queue**" (`/work-queue`).
- **Steps:** 1) Show items grouped by **disposition** (auto-cleared, ready-to-submit, high-risk, etc.) with **SLA due dates** and breach flags. 2) Click **View evidence** on an item → the Evidence Record viewer.
- **Expected:** the runs from S2 appear in their queues; each drills into its timeline.
- **Talking points:** "The queue is rebuilt from the persisted Evidence Records — one durable source of truth. SLA timers reflect the CMS 72-hour expedited / 7-day standard clocks."

### S5 · Stage-3 handoff — Prior Authorization (CRD → DTR → PAS)
- **Audience:** clinical ops. **Mandate:** CMS-0057-F Prior Auth API (Da Vinci PAS). **Route:** the **Proceed to Prior Authorization** button from S2.
- **Steps:** 1) Click the stage-3 handoff. 2) Note the **banner** showing the incoming order + Evidence Record (the thread continues). 3) Walk CRD cards → the DTR questionnaire → the **human-gated** submit (no `approvedBy`, no submission).
- **Expected:** the handoff carries context; submission refuses without a human approver.
- **Talking points:** "Prior Auth isn't a dead end — it's *stage 3 of the same thread*. And an agent can prepare the claim, but only a human submits; the LLM never sets Approved or Denied."
- **Accuracy note (be transparent):** in the offline demo these **CRD cards are dev-stubbed**, not engine-driven; under the Tier-B backbone they come from the live CDS Hooks / CRD service. The engine's "requires PA / medical necessity" determination is the one shown in stages 2 / S3–S3b. Wiring `evaluate()` behind the CRD card is a bounded next increment.

*(Optional S2b — Provider/Payer surfaces: `/provider-access` shows `$member-match` + treatment-relationship data; `/payer-to-payer` shows the async bulk import. Include if the audience wants all four provisions.)*

---

## Act 3 — The population (Network Adequacy)

Transition line: *"Maria's care depends on there being an in-network provider within reach. Is there? That's a separate CMS mandate — and here's how an analyst proves it."*

### S6 · The analyst copilot — analyze Maria's state
- **Audience:** payer network / state analysts, execs. **Mandate:** MA §422.116, Medicaid §438.68 + 2024 Access rule, QHP §156.230. **Route:** `/cms` → **Network Adequacy** (`/network-adequacy`); leave state on **South Dakota — Maria's state**.
- **Steps:**
  1. Note the **KPIs** (avg adequacy, cells measured, gaps) and the **prioritized gap table** — the reservation counties (**Oglala Lakota / Pine Ridge**, **Todd / Rosebud**) show up as critical.
  2. In the **copilot**, click the starter **"Prioritize the worst behavioral-health gaps in South Dakota."** Read the grounded, ranked answer; watch the gap table **highlight** the focus counties.
  3. Then **"Show the Medicaid pediatric baseline for Maria's state."**
- **Expected:** grounded, reproducible answers from the engine; reservation counties dominate the gaps; the chat drives the table focus.
- **Talking points:** "The copilot is deterministic — it parses the analyst's intent and answers *from the engine*, so it works with no API key and every number is defensible. 'Maria's state' resolves to South Dakota automatically."

### S7 · The copilot — *validate* compliance (the state-reviewer job)
- **Audience:** compliance / state reviewers. **Mandate:** the certification/audit side of the same rules. **Route:** same page/copilot.
- **Steps:** 1) Click **"Validate Oglala Lakota Pediatrics Medicaid against CMS standards."** 2) Read the verdict: **NON-COMPLIANT**, with per-standard checks — **time-distance ✗**, **ratio ✗**, **in-network ✗**, **adequacy-target ✗**.
- **Expected:** a pass/fail per CMS standard with the exact shortfall.
- **Talking points:** "This is what a state reviewer needs: not a vibe, a *validation* — each standard, pass or fail, with the number. That's certification and audit evidence."

### S8 · The copilot — recommend augmentation, then switch states
- **Audience:** network strategy. **Route:** same.
- **Steps:** 1) Click **"Recommend augmentation for Fulton Mental Health Medicaid."** Read the recommended provider add + the estimated **adequacy lift** ("human review required"). 2) Switch the **state selector to Georgia** to show the same engine on the storyboard dataset.
- **Expected:** a concrete, human-gated augmentation recommendation; the whole page re-scopes to GA.
- **Talking points:** "The assistant closes the loop — it doesn't just find the gap, it recommends the highest-impact fix, and it's human-gated before anyone contracts a provider. One engine, any state."

---

## Close

"One platform, one member, **two CMS mandates** — interoperability & faster prior authorization, and network adequacy — with **human-gated AI** throughout, all demonstrated offline. The path to live is configuration (the Tier-B backbone) and data, not a rewrite."

Anticipated Q&A: *Is the AI making decisions?* No — decision-support only, human-gated, `ClaimResponse`/certified filing authoritative. *Is this real data?* Seed/mock for the demo; live needs the directory/geo/membership feeds (adequacy) and the Tier-B backbone (PA). *Where's the code?* All on `feat/cms0057f-native`; PR to `main` to release.

---

## Appendix — exact demo values (so nothing is guessed live)

| Thing | Value |
|---|---|
| Member | `MARIA_SD_001` (South Dakota Medicaid) |
| Demo order (PA-list path) | CPT **`72148`** (MRI lumbar spine w/o contrast) → `pa-required-list` |
| Criteria-gated code | CPT **`75561`** (cardiac MRI, Aetna CPB **#0520**) → criteria review / deficiency for Maria |
| Experimental code | CPT **`0408T`** (CCM, Aetna CPB **#0930**, not covered) → likely-denial-experimental |
| Provider A (gold-carded) | NPI **`1730154783`** → PA-exempt |
| Provider B (not gold-carded) | NPI **`1518998765`** → PA required |
| Payer (Golden Thread) | UnitedHealthcare Community Plan |
| SD counties (Maria) | Minnehaha, Pennington, Brown, **Oglala Lakota (Pine Ridge)**, **Todd (Rosebud)** |
| GA counties | Fulton, DeKalb, Gwinnett, Cobb, Clay |
| Copilot prompts | "Prioritize the worst behavioral-health gaps in South Dakota" · "Show the Medicaid pediatric baseline for Maria's state" · "Validate Oglala Lakota Pediatrics Medicaid against CMS standards" · "Recommend augmentation for Fulton Mental Health Medicaid" |
| Routes | `/cms` · `/access` · `/provider-access` · `/payer-to-payer` · `/financial-clearance` · `/work-queue` · `/evidence/:id` · `/prior-auth` · `/network-adequacy` |
| Validation gate | `npx tsc --noEmit` (0) · `npx vitest run` (145) · `npm run lint` |

### Known demo simplifications (state these if asked — don't get caught)

- **CRD cards are dev-stubbed** in the offline demo (`devCrdCards()`), not engine-driven; the engine's determination is shown in the Medical Necessity stage (S3/S3b). Live CRD comes from the Tier-B backbone.
- **The criteria-*met* (approve) path** isn't shown in the UI because the seed member's conditions are **SNOMED-coded** while the criteria read **ICD-10**; that path is proven in the automated tests (with an ICD-10 cardiac diagnosis).
- **The gold-carding / PA-list data** is UnitedHealthcare **Texas STAR**, labelled "UnitedHealthcare Community Plan" for a South Dakota member — a deliberate demo simplification so one seed exercises both mandates. Real operation uses the member's own plan documents.
