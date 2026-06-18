# UHG-Orchestrate -> RHTP Contextual Alignment Plan (plan only)

## The through-line
Recast a **payer/claims orchestration** demo (Maria Reyes, 58, cardiac/diabetes, auth/appeal/
credentialing, MLR, OptumRx, Banner) into **SD Medicaid RHTP whole-person care** spanning
**Clinical / Behavioral / Social**, anchored on **Maria Redhawk** and the 5–6 canonical
citizens — reusing RHTP's existing graph, NBA, triage and agent assets. Data-driven (any
citizen, Maria default). Keep the dark "orchestration" aesthetic; relabel the payer chrome.
Excludes RHTP's own "CDP & Agentic Automation" category (untouched).

## Cross-cutting foundations (apply to every screen)
1. **Persona/scenario adapter** — `personaFor(citizenId)` + `scenarioFor(citizenId)` off
   `patientRegistry` + `wholePersonGraphData`; default `MARIA_SD_001`; works for all citizens.
2. **Domain-agent remap** — UHG Care/Provider/Utilization/Appeals -> RHTP **Clinical (CareGap
   Sentinel) · Behavioral (BH agent) · Social/SDOH (SDOH Navigator) · Eligibility/Provider
   (Eligibility Intelligence)** — the same agents used across the RHTP NBA work.
3. **Payer -> Medicaid terminology** — Member->Citizen; MLR / payer exposure -> **Total Cost of
   Care, PMPM vs target, gain-share**; auth/appeal/credentialing -> care-gap closure,
   eligibility, referral; OptumRx/Banner -> **Bennett County Health (CAH), Winner Regional, IHS,
   SD Medicaid, CBOs**; Phoenix AZ -> Martin/Pine Ridge SD.
4. **Real governance boundaries (the authentic win)** — consent across domains uses **42 CFR
   Part 2** (behavioral/SUD data), **tribal data sovereignty (IHS/Lakota)**, and **caregiver
   proxy consent** — replacing the generic OptumRx consent gates.
5. **Reuse RHTP assets** — keystones (SDOH BLOCKS care gap), `citizenNeeds`, `buildTriageQueue`,
   citizen/team/program NBAs, gain-share + cost-avoidance numbers already in the app.

## Per-screen alignment
| Screen | Now (payer) | Aligned (RHTP) |
|---|---|---|
| **One Enterprise · Five Entities** (fragmentation) | 5 payer systems, same parent, no coordination | Maria's identity/risk/consent fragmented across **5 SD systems**: MMIS/claims · CAH EHR (Bennett County) · RHTP care mgmt (Sarah Johnson) · CBO/social · BH/IHS — "one program, five systems, zero coordination" across Clinical/BH/Social |
| **CDP Assembly** | identity resolution, latency, confidence | Assemble unified **citizen** profile from the 5 sources — deterministic+probabilistic match, confidence, FHIR/MRN resolution (reuse `patientRegistry` ids); signal types = care gap / SDOH / BH screen / eligibility / referral |
| **Journey-Aware Context** (consumer-360) | warfarin, household, consent, channels | Maria's whole-person 360: real meds, CM Sarah Johnson, **HOUSEHOLD = Sophia + Elena**, consent domains (Clinical/BH/Social), rural channel learning, **combined outreach** (Maria + Sophia well-child + Elena caregiver) |
| **Whole Person Care Intelligence** (any citizen, Maria default) | blocker, barrier intensity, NBA | Drive **directly from `wholePersonGraphData` keystones** (barrier BLOCKS gap) + `citizenNBAs`; barrier intensity = SDOH severity; default Maria, derive others from registry needs |
| **Signal Disposition Engine** | SDOH-informed disposition, sequencing | Triage incoming signals across Clinical/BH/Social -> tier · owner agent · channel · **keystone-first sequencing** (resolve transport before the clinical appt) — reuse `buildTriageQueue` |
| **Agentic Super Agent** (agent-library) | agent marketplace/registry | Canonical registry of **RHTP agents** (SDOH Navigator, CareGap Sentinel, Eligibility Intelligence, BH, Panel Balancer, Enrollment Optimizer, Outcomes Analytics) — domain, match conditions (signals), skills (refer/screen/enroll/rebalance) |
| **Agentic Super Orchestration** + **Super Orchestration Controller** (INSTRUCTION_SOURCE/CONTEXT_INTEGRITY) | Care/Provider/Utilization/Appeals over auth scenario; OptumRx consent | Recast to Maria's **4 real conditions** (PND 427d CRITICAL · transport keystone · HbA1c · childcare/caregiver); agents = Clinical/BH/Social/Eligibility; governance = **42 CFR Part 2 + tribal sovereignty**; context from graph; status bar provenance = Cypher/audit/consent (SHA-256 integrity) |
| **Family Thread — Dependent Intelligence** (family-sofia) | Sofia, Banner Pediatrics | **Sophia** — Well-Child 24-month gap (mg-3), recommended peds at Bennett County/Winner Regional/IHS, proactive discovery from parent record, WIC/childcare link; degrades for citizens w/o dependents |
| **Caregiver Intelligence — Elena** (caregiver-elena) | Elena Reyes, proxy consent | **Elena** (Maria caregives for) — caregiver burden (mg-5), **proxy consent + tribal data sovereignty** boundaries, governance intercept; ties to "Rural · Single Parent · Caregiver" flag |
| **Agent Impact Dashboard** (screen 1) | ROI sources, projected | Impact of RHTP agents: **care gaps closed · SDOH barriers resolved · screenings · enrollments · cost avoidance** (PMPM vs target, gain-share) across Clinical/BH/Social |
| **Agent Impact — Reporting** (screen 2) | clinical outcomes, financial intelligence, signal trend | RHTP outcomes: quality/HEDIS, **BH access**, SDOH closure rates, **Medicaid TCOC/gain-share** (not MLR), signal volume by domain |
| **Live Population Filter** (portfolio-scale) | board/CFO/MLR, "members like Maria" | **"Citizens like Maria"** across the SD panel; filter by domain/risk/SDOH; scale story = rural/tribal/single-parent-caregiver; reframe exposure -> **avoidable utilization + gain-share**; **this screen is the citizen selector** (sets activeCitizen, default Maria) |

## Phasing
1. **Foundations** — persona/scenario adapters + domain-agent remap + terminology/geography map + active-citizen context (incl. Live Population Filter as selector).
2. **Whole-person core** — Whole Person Care Intelligence, Journey-Aware Context, Signal Disposition (highest reuse of graph/triage/NBA).
3. **Orchestration + governance** — Super Orchestration controller (scenario recast + 42 CFR/tribal consent), Agent registry.
4. **Family / Caregiver** — Sophia + Elena threads.
5. **Population + impact** — Fragmentation, CDP Assembly, Live Population Filter, Agent Impact (2), Reporting.
6. **Verify** — across Maria + 1 other citizen, full tsc/build, sandbox-then-mirror.

## Decisions
1. **Governance authenticity:** use real SD Medicaid boundaries (42 CFR Part 2 BH, tribal/IHS data sovereignty, caregiver proxy) in controller/caregiver/journey screens (recommended)?
2. **Financial reframing:** MLR/payer-exposure -> Medicaid TCOC / PMPM-vs-target / gain-share (recommended)?
3. **Citizen switching:** Live Population Filter is the selector, default Maria; persona-bound screens follow it (recommended)?
4. **Aesthetic/brand:** keep dark look, relabel "UHG ORCHESTRATE" -> "RHTP Orchestrate · SD Medicaid", Member->Citizen (recommended)?
5. **Agent registry naming:** catalog the existing RHTP agents listed above (confirm names) — add/rename any?
