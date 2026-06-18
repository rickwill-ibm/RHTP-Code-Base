# Plan — Controller (agent view) + Fragmentation, reimagined in RHTP context

## Status (answering "what's going on")
Done so far: citizenContext adapter + identity bar (data-driven) + 3 screens recast
(Whole Person Care, Family/Sophia, Caregiver/Elena), all passing the zero-token gate.
NOT yet done (still the demo/payer content): Fragmentation, Signal Disposition, Consumer-360,
CDP Assembly, and the Controller + its OrchestrationFlowModal. The two screens below are next.

---

# 1) Agentic Super Orchestration (Controller) — tailor from the AGENT perspective
Keep the exact layout/visual design (it's the right design). Recast the content so the
**agent coalition orchestrates Maria's whole-person care**, not a payer auth scenario.

## Domain agents (the four boxes) -> RHTP agent coalition
| Now (payer) | RHTP agent | Owns |
|---|---|---|
| Care Agent (PRIMARY) | **Clinical Care Agent · CareGap Sentinel** | HbA1c lab, Well-Child (Sophia) |
| Provider Enablement (CONCURRENT) | **Social / SDOH Agent · SDOH Navigator** | Transportation, Childcare, WIC/LIHEAP |
| Finance & Integrity (SUPPORTING) | **Eligibility Agent · Eligibility Intelligence** | Medicaid renewal T+89d, benefit enrollment |
| Appeals Agent (COMPLIANCE) | **Behavioral Health Agent** (42 CFR scope) | Edinburgh PND follow-up |

## Scenario Intake -> Maria's 4 real conditions (from the graph)
1. **Edinburgh PND — 427d open** · CRITICAL · BH · 42 CFR Part 2 gated  (BH Agent)
2. **HbA1c lab — 38d, BLOCKED by Transportation + Childcare keystone** · HIGH  (Clinical PRIMARY + Social CONCURRENT)
3. **Well-Child 24-mo (Sophia) — overdue** · MEDIUM  (Clinical/Family)
4. **Caregiver burden (Elena) + benefits unenrolled (WIC/childcare/LIHEAP)** · HIGH  (Social + Eligibility)

## Controller Reasoning Trace (recast)
- SCENARIO INTAKE -> MARIA_SD_001 — complexity HIGH — 4 conditions, 3 domains
- DECOMPOSING -> constraint hierarchy: **Transportation BLOCKS HbA1c (keystone)** | **42 CFR Part 2 gates BH sharing** | eligibility renewal TIME-BOUND T+89d | SD winter road-closure seasonal
- DOMAIN OWNERSHIP ASSIGNED -> Clinical PRIMARY (2,3) · Social CONCURRENT (2,4) · BH (1) · Eligibility (4)
- GOVERNANCE active -> consent boundary enforcement ON: **42 CFR Part 2 (BH)** · **tribal data sovereignty (IHS)** · **caregiver proxy (Elena — PENDING)** · audit trail (SHA-256 integrity)
- DISPATCHING -> domain agents activate; keystone-first sequencing (resolve transport before lab)

## Surrounding chrome
- Sense->Plan->Decide->Monitor->Learn: keep; reasoning text -> her scenario.
- Strategic Context: Journey Strategy · Population Health · **Value & Quality (SD Medicaid quality / RHTP measures)** · **Network (CAH / IHS adequacy)**.
- Metrics (Signals/hr, High-Risk, Members Active, Orchestrations): label as **SD Medicaid panel**.
- Population Stream: SD residents w/ RHTP signal types (CARE_GAP, SDOH, BH, ELIGIBILITY, DISCHARGE) — drawn from the registry citizens.
- Live Scenario Queue: MARIA_SD_001 IN FOCUS + other canonical citizens.
- Brand: "UHG ORCHESTRATE" -> "RHTP ORCHESTRATE · SD Medicaid".
- **OrchestrationFlowModal** (shared, 99 literals): recast INSTRUCTION_SOURCE/CONTEXT_INTEGRITY
  provenance to Maria's scenario + the RHTP agents + consent gates.

---

# 2) Fragmentation — "One enterprise. Five entities. Zero coordination." reimagined
Keep the powerful 4-layer "before" narrative; swap every entity/role to Maria's SD graph.

## LAYER 1 — fragmented SD systems (replaces UHC/Optum/OptumRx/Rally/Change)
1. **SD Medicaid (MMIS / Claims)** — sees eligibility, claims, renewal; blind to clinical, SDOH, BH
2. **Bennett County Health (CAH EHR)** — clinical record, dx, meds; blind to Medicaid auth, pharmacy, social
3. **Martin Pharmacy** — family fills (Elena + Sophia meds); blind to clinical, claims, BH
4. **RHTP Care Management (Sarah Johnson)** — care plan, gaps, tasks; blind to benefit enrollment, live pharmacy
5. **CBO / Social Services** — SNAP/WIC/LIHEAP, housing waitlist, childcare; blind to clinical, eligibility, BH
6. **Behavioral Health · Postpartum Support (42 CFR Part 2)** — PND screen; blind to all (consent-gated)
- Tagline: "Same SD Medicaid residents · 47 miles apart. No shared identity graph, no consent framework, no coordination."

## LAYER 3 — Maria's roles (replaces Cardiac patient / Elena 79 / Sofia)
- **PATIENT** — Postpartum (Day 427), Pre-diabetic A1C 6.2%, HbA1c gap. Lives in: CAH EHR + Medicaid claims.
- **CAREGIVER** — Elena Redhawk: Cardiac/DM (A1C 8.1%), Metformin/Lisinopril, Maria picks up. Lives in: nowhere.
- **PARENT** — Sophia Redhawk (24mo): Well-Child overdue, CHIP. Lives in: CHIP enrollment only.

## LAYER 4 — what's missing (tied to graph nodes)
IDENTITY (records split across SD Medicaid/CAH/pharmacy/CBO) · CONSENT (42 CFR gate on PND) ·
RELATIONSHIPS (Sophia + Elena — no household graph) · PREFERENCES (SMS-only 3-7pm) ·
CAREGIVER PROXY (Elena — PENDING) · JOURNEY (Day 427 postpartum, unmanaged) · ROLES (Patient+Parent+Caregiver).
- Resolution line: "...until the RHTP whole-person knowledge graph assembles them into one record."

## Both screens
- Data-driven where possible from `contextFor(activeCitizen)` (sources, roles, signals); default Maria, follows the selector.
- Acceptance: build clean + zero forbidden tokens (Reyes, Optum, UHC, Rally, Change, Phoenix, Dr. Chen, Cardiac, Warfarin, Sofia, 50M, Acme, CMS-auth) + screenshot check.

## Order
Fragmentation first (smaller, 16 literals) to lock the SD-source pattern -> then the Controller
+ OrchestrationFlowModal (the big one).
