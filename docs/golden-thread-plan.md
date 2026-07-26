# Golden Thread — Prior-Authorization Build Improvement Plan

**How the Cleveland Clinic "Golden Thread" revenue-cycle materials should reshape RHTP's prior-authorization build — SMART-integrated, CMS-0057-F aligned.** Built with IBM Bob + Claude.

> **Update — generalized Policy Engine delivered.** GT-1 is no longer a plan item: all **17** supplied payer policies (15 Aetna Cardiac CPBs + 2 UnitedHealthcare PA-requirement lists) are now parsed into a normalized library and a working, source-agnostic **Policy Engine** ships in `src/lib/policy/`. It ingests *any* payer/state policy through pluggable adapters, evaluates a member's order into a **Coverage Determination** (requiresPA · criteria met · deficiencies · propensity-to-deny), runs entirely on **mock data** for the demo, and is validated **19/19** against known source anchors with **11** passing engine tests. Details in **§6A**; the remaining work to finish the whole Golden Thread is the completion roadmap in **§9**. _(This section supersedes the "first pass / codes only" caveat previously in §11.)_

---

## 1. What I reviewed

From `C:\Users\909750897\Downloads\PA`:
- **Golden Thread PREVIEW** — Cleveland Clinic "Revenue Cycle Management Journey" journey maps (Use Cases 1–3: Sarah/knee, Omar/back, cardiology) and "See How It Works" screens (Level 2/3) for **Eligibility · Medical Necessity · Prior Auth · Patient Estimation**. IBM stack throughout: Watson Assistant, watsonx.ai (NLP/ML/LLM), Cloud Pak for Business Automation, **SMART on FHIR**, CDS Hooks (CRD/DTR), Da Vinci Coverage Determination Record, ITX (FHIR↔X12 278/275), Experian.
- **Payer medical policy** — Aetna Cardiac Clinical Policy Bulletins (e.g., Cardiac MRI #0520: enumerated medical-necessity indications + Applicable CPT/HCPCS/ICD-10 codes + review dates) and **UnitedHealthcare Prior Authorization Requirements** (Commercial Advance Notification; Texas STAR Medicaid) — the code lists that say *what requires PA*.
- **Cleveland Clinic OPTIMA Solution Overview** deck (context/framing).

---

## 2. Reflection — the core insight (chain of thought)

**Our build today treats Prior Auth as a standalone page** (`/prior-auth`: CRD → DTR → PAS, human-gated, state machine). That's correct but *narrow*.

**What the Golden Thread shows is that Prior Auth is stage 3 of a single connected "Financial Clearance" thread:**

> **Eligibility → Medical Necessity → Prior Auth → Patient Estimation** — all launched *in-context from the EHR via SMART on FHIR*, sharing one **point-in-time Evidence Record**, and flowing onward into denial-intervention, financial counseling, scheduling, and check-in.

Three ideas in the materials are genuinely new relative to our build, and each is a strong differentiator:

1. **Medical Necessity as its own automated stage** — the member's clinical documentation is auto-compared to the *payer's medical policy* (the Aetna/UHC PDFs), **deficiencies are detected**, the provider is prompted to remediate (e.g., "missing PT notes → add to evidence record → resubmit"), and an **auditable evidence record** is produced. DTR is a *part* of this, not the whole of it.
2. **A propensity-to-deny predictive score** computed *before* submission — "likely to deny" routes to a work queue with a *partial* evidence record for correction; "denied" routes with the *full* evidence record. This is exactly the burden-reduction CMS-0057-F is chasing, made proactive.
3. **The Evidence Record (a Da Vinci "Coverage Determination Record")** as a first-class, point-in-time object that **threads across all four stages** and is the audit spine.

So the improvement isn't "polish the PA page" — it's **reframe PA as one stage of a SMART-launched Golden Thread, add the Medical-Necessity engine + propensity model + shared Evidence Record, and add the reviewer work-queue UX.** Our existing CRD/DTR/PAS code, `paMachine`, audit/provenance primitives, and seed data are the right foundation; this widens them.

---

## 3. The Golden Thread model

```
                 ┌──────────────── SMART on FHIR launch (from EHR / md-smart-launch) ─────────────────┐
                 │  EHR OAuth2 · patient+encounter context · US Core · order (e.g. Cardiac MRI 72148)  │
                 └───────────────────────────────────────────────────────────────────────────────────┘
                                                   │
   ┌─────────────┐     ┌───────────────────┐     ┌───────────────┐     ┌────────────────────┐
   │ 1 ELIGIBILITY│ →   │ 2 MEDICAL NECESSITY│ →   │ 3 PRIOR AUTH  │ →   │ 4 PATIENT ESTIMATION│
   │ Coverage +   │     │ policy vs clinical │     │ CRD→DTR→PAS   │     │ Good Faith Estimate │
   │ benefits +   │     │ evidence → gaps →  │     │ propensity-to-│     │ propensity-to-pay + │
   │ PA-required? │     │ remediate → confirm│     │ deny → submit │     │ payment plan        │
   └─────────────┘     └───────────────────┘     └───────────────┘     └────────────────────┘
          └──────────────┴───────── ONE point-in-time EVIDENCE RECORD (Coverage Determination) ─────────┘
                                                   │
        Intelligent Orchestration → work queues (approved · likely-deny · denied · more-info) + SLA timers
```

---

## 4. Twelve improvements (prioritized)

Legend: **Std** = standard it maps to; **Now** = in our build today; **Add** = the change.

| # | Improvement | Why it matters | Std | Now → Add |
|---|---|---|---|---|
| 1 | **Reframe PA into a 4-stage Golden Thread** | Realistic revenue-cycle workflow; far stronger demo | Da Vinci CRD/DTR/PAS + CARIN | `/prior-auth` only → parent "Financial Clearance" flow w/ shared rail |
| 2 | **Medical Necessity engine** (policy vs clinical evidence → deficiencies) | The missing stage; the burden driver | Da Vinci CDex / Coverage Determination | none → new `medicalNecessity` service + UI |
| 3 | **Payer medical-policy library** (seed from Aetna CPBs + UHC lists) | Grounds CRD/DTR/med-nec in real criteria | Payer Medical Policy (CQL) | hardcoded DTR items → policy library + AI-generated DTR |
| 4 | **Propensity-to-deny score** + deficiency remediation loop | Proactive burden reduction; a differentiator | (analytics) | none → deterministic score now → ML later |
| 5 | **Evidence Record** as a first-class threaded object | Audit spine; ties stages together | Da Vinci Coverage Determination Record | audit/provenance primitives → structured `EvidenceRecord` |
| 6 | **Eligibility stage** (coverage + benefits + "requires PA?") | Gate before med-nec; uses the UHC lists | X12 270/271 · CARIN | Coverage read → eligibility panel + PA-required lookup |
| 7 | **Patient Estimation stage** (GFE + propensity-to-pay + plan) | Financial transparency; No Surprises Act | GFE / No Surprises · CARIN | none → estimation stage |
| 8 | **Reviewer work-queue / PA inbox** with SLA + evidence record | The ops UX we lack (we have a single member page) | CMS-0057-F 72h/7d | `specialist-inbox` pattern → PA work queue by disposition |
| 9 | **FHIR ↔ X12 278/275 bridge (ITX)** | Real payers not yet on FHIR PAS | X12 278/275 · Da Vinci PAS | note as backbone integration point |
| 10 | **Multi-channel intake** (SMART app + fax/email→JSON→FHIR) | Real-world completeness | — | note; SMART primary |
| 11 | **SMART-launched, in-context** (from `md-smart-launch`) | The EHR-integration ask; runs where clinicians work | SMART App Launch | `md-smart-launch` exists → launch the thread from it |
| 12 | **Human-in-the-loop model tuning** (corrections feed back) | Governance: model recommends, humans decide | (our guardrails) | human gates exist → capture corrections as feedback |

---

## 5. Revised UI & workflow (SMART-launched)

**Launch:** clinician signs an order in the EHR (e.g., Cardiac MRI, CPT 72148) → SMART on FHIR launches the RHTP Golden Thread with patient + encounter + order context (reuse `md-smart-launch`).

**A persistent "Golden Thread" status rail** (top of every stage) shows the four stages with status pills (done/current/blocked) + the running Evidence Record + the live propensity-to-deny meter + SLA countdown.

1. **Eligibility** — Coverage + benefits; a **"Requires prior authorization?"** verdict for the order's code (looked up against the payer requirement list). If no PA required → skip to estimation. Green check + evidence entry.
2. **Medical Necessity** — auto-compare the member's clinical documentation to the **payer policy** for that code (Aetna CPB indications). Show: criteria met/unmet, a **deficiency list** ("missing: PT notes / cardiology consult"), and **remediation prompts** with one-click "attach from record / request." Produces the point-in-time evidence record. Propensity-to-deny recalculates as deficiencies close.
3. **Prior Auth** — CRD cards (coverage requirements) → **native DTR** questionnaire (auto-prepopulated from FHIR + generated from the CPB) → **propensity-to-deny gate**: if high, route to work queue with partial evidence; if acceptable, **human-approved** `Claim/$submit` (PAS) → `ClaimResponse`. Denial reasons rendered verbatim; resubmission path.
4. **Patient Estimation** — Good Faith Estimate (cost, deductible, out-of-pocket), propensity-to-pay, and payment-plan options; hand-off to financial counseling.

**Reviewer / ops view** — a **PA work queue** (not a single member): items bucketed by disposition (approved · likely-deny · denied · more-info), each carrying its evidence record, SLA timer (72h expedited / 7d standard), and denial reasons. This is the payer/clinic-staff experience the journey maps center on.

---

## 6. Payer medical-policy library (using the supplied docs)

Turn the folder's PDFs into a **structured policy library** that the whole thread draws from:

| Source | Becomes | Feeds |
|---|---|---|
| **UHC PA requirement lists** (Commercial, Texas STAR) | code → "requires PA?" table (per plan) | Eligibility "requires PA?" + CRD |
| **Aetna Cardiac CPBs** (e.g., MRI #0520: indications + CPT/ICD-10 + review dates) | medical-necessity criteria per code, versioned | Medical Necessity engine (criteria compare) + **AI-generated DTR Questionnaire** + CQL |
| (any policy PDF) | via the reference **AI questionnaire pipeline** (Claude generator+reviewer) | DTR `$questionnaire-package` with CQL prepopulation |

Cardiac focus is a bonus: it lines up with the RHTP demo member's cardiac/CKD/diabetes profile, so Medical Necessity has real, relevant criteria to check. The AI questionnaire pipeline we already documented ingests exactly these PDFs → DTR questionnaires — now we have real source material and a human-review gate for the generated artifacts.

---

## 6A. The generalized Policy Engine (delivered)

This is the "in theory take any policy in future" component, built for real. It has two jobs: **ingest** any payer/state policy into one normalized shape, and **evaluate** a member's order against it to produce a Coverage Determination that threads into the Evidence Record.

**What was parsed.** A reference extractor (`tools/seed/parse_policies.py`, `pdftotext -layout` → structured JSON) turned all 17 supplied documents into `src/lib/policy/data/policy-library.seed.json`:

| Corpus | Docs | What the parser captures |
|---|---|---|
| **Aetna Cardiac CPBs** | 15 | policy number, title, URL, effective/last-review/next-review dates, lettered **medical-necessity indications**, and code buckets — CPT/HCPCS/ICD-10 *covered-if-criteria-met*, *not-covered/experimental*, and *related* |
| **UnitedHealthcare PA lists** | 2 (Commercial Advance Notification; Texas STAR) | plan, effective date, **category → PA-required codes**, and a flat `allPaCodes` set (Texas STAR: 1,886 codes; Commercial: 2,584) |

**Accuracy — validated 19/19 against known source anchors**, e.g. Aetna Cardiac MRI **#0520** yields exactly the five covered CPT codes `75557 / 75559 / 75561 / 75563 / 75565`, HCPCS `A9576…C9763`, indications A–Q ("Thoracic aortic disease", "Pericardial disease", …), last review `2023-08-01`; UHC Texas STAR correctly places bariatric `43644/43645`, bone-growth `20975/20979`, and advanced-imaging `72148` on the PA-required list; Aetna CCM **#0930** (only "not covered" codes) is flagged **experimental**.

**Architecture (`src/lib/policy/`).**

| File | Role |
|---|---|
| `types.ts` | The normalized `NormalizedPolicy` model + evaluation types (`MemberContext`, `OrderContext`, `CoverageDetermination`, `Deficiency`). One shape, any source. |
| `ingest/index.ts` | `PolicyIngestionAdapter` interface + **registry**. New payer/state = write an adapter, `registerAdapter(...)`; the engine never changes. |
| `ingest/aetnaCpb.ts` · `ingest/uhcPaList.ts` | The two reference adapters. They validate/coerce raw extractor records and **recompute** requiresPA / experimental / basis so the normalized record is internally consistent. |
| `policyLibrary.ts` | Loader + indices (`byCode`, `byNumber`). **Mock mode** loads the bundled seed *through the adapters*; non-mock callers pass their own ingested policies via `buildLibrary()` / `ingestLibrary()`. |
| `policyEngine.ts` | Pure `evaluate(member, order, library) → CoverageDetermination`. |
| `fromFhir.ts` | Projects FHIR Condition/ServiceRequest → engine inputs; only surfaces genuine ICD-10 codings as ICD-10 (SNOMED never false-matches). |

**How `evaluate()` decides.** For the order's code it finds every governing policy and picks the determination by severity: **experimental/not-covered → likely denial** (propensity 90); else **criteria-gated medical necessity** — checks the member's ICD-10 diagnoses against the CPB's covered set → `criteriaMet` + deficiencies (supporting dx → propensity 20; missing → 70); else **code-on-PA-list → PA required** (propensity 35); else **no policy found**. Propensity-to-deny stays a transparent, labelled decision-support estimate — never the determination (the payer `ClaimResponse` remains authoritative).

**Mock-data demonstration (offline, no backbone).** The engine runs on the seed today:
- **Maria** (real seed FHIR, order **CPT 72148** lumbar MRI) → engine matches the **UHC Texas STAR** Radiology PA list → `requiresPA = true`, outcome `pa-required-list`, deficiency = "PA request with documentation required". Her SNOMED-coded conditions are correctly *not* treated as ICD-10.
- **Criteria path** (order **CPT 75561** cardiac MRI vs Aetna **#0520**): a member with `I42.0` (cardiomyopathy) → `criteriaMet = true`, low propensity; a member with only `E11.9` (diabetes) → `criteriaMet = false`, `missing-supporting-diagnosis`, high propensity.
- **Experimental path** (a not-covered CCM code vs **#0930**) → `likely-denial-experimental`.

**Non-mock mode.** Point an extractor at any payer or state-Medicaid policy (PDF, policy API, or a future FHIR PlanDefinition/CQL import), emit raw records, and `ingestLibrary(records)` normalizes them through the same adapters into a live library — no engine change. Adding a brand-new payer format is one new adapter file.

**Validation.** `tests/policy/policyEngine.test.ts` — 11 tests (library load/index, Maria evaluation, criteria approve/deficiency paths, experimental path, accuracy anchors). Gates green: `tsc --noEmit` 0 errors, **52/52** vitest, `next lint` clean.

---

## 7. The three differentiators, made concrete

- **Evidence Record** — a structured, append-only object (`EvidenceRecord`) started at launch and carried through all stages: eligibility result, med-nec criteria + deficiencies + remediations, DTR responses, propensity scores, PAS submission + decision. It IS the Da Vinci Coverage Determination Record and the audit spine (reuse our audit/provenance primitives). Auditable, point-in-time, exportable.
- **Propensity-to-deny** — start **deterministic** and honest: `score = f(open deficiencies, unmet criteria, missing required DTR answers, historical denial rate for code/plan)`; band into low/medium/high; route high → work queue with partial evidence. Clearly labelled a *decision-support estimate*, never the determination (guardrail: the payer's `ClaimResponse` is authoritative). Swap in ML later; capture human corrections as training feedback.
- **Work queues + SLA** — orchestration routes each item by disposition into a reviewer queue with the evidence record attached and the 72h/7d timer running.

---

## 8. Crosswalk — Golden Thread ↔ our build ↔ what to add

| Golden Thread piece | Our existing code | Add |
|---|---|---|
| SMART launch of the thread | `src/app/md-smart-launch`, `smartSession` | launch → `/financial-clearance?order=…` |
| Prior Auth (CRD/DTR/PAS) | `/prior-auth`, `paMachine`, `/api/cds|dtr|pas`, DTR renderer | keep; make it stage 3 |
| Eligibility | Coverage read via `/api/fhir` | eligibility panel + `policyLibrary.requiresPA(code, plan)` |
| Medical Necessity | — | `medicalNecessity` service + UI + deficiency model |
| Policy library | **✅ `src/lib/policy/` (built)** | — real Aetna/UHC corpus, adapters, engine (§6A) |
| Propensity-to-deny | — | `propensity.ts` (deterministic) |
| Evidence Record | `audit.ts`, provenance, `viewModels` | `evidenceRecord.ts` (structured, threaded) |
| Patient Estimation | — | estimation stage + GFE view |
| Work queue | `specialist-inbox` pattern | PA work-queue by disposition + SLA |
| State machine | `paMachine` (PA lifecycle) | parent `financialClearanceMachine` orchestrating 4 stages |

---

## 9. Implementation roadmap — from here to the complete Golden Thread

Each increment is a bounded, testable slice on `feat/cms0057f-native`, same loop + gates as the shipped work (`tsc` 0 · vitest · scoped prettier · `next lint`). Status reflects what is actually in the branch today.

### 9.1 Delivered

- **PE-1..5 / GT-1 — Generalized Policy Engine + real policy library** ✅ **DONE.** All 17 policies parsed, normalized library seeded, ingestion adapters + registry, `evaluate()` producing Coverage Determinations, FHIR projections, Maria + criteria + experimental paths, 19/19 accuracy, 11 tests. (See §6A.)

### 9.2 Remaining increments to complete the build

| # | Increment | Scope | Depends on | Offline? | Est. |
|---|---|---|---|---|---|
| **GT-2** | **Evidence Record** | `evidenceRecord.ts` — append-only, point-in-time object = Da Vinci Coverage Determination Record; wire existing `audit.ts` + provenance; the Policy Engine's `CoverageDetermination` is its first threaded entry. Unit tests. | PE-* | ✅ | S |
| **GT-3** | **Medical-Necessity engine + UI** | Thin service over the Policy Engine: run `evaluate()`, render indications + deficiencies + a remediation loop (attach doc / pick on-label dx → re-evaluate). `medicalNecessity.test.ts`. | PE-*, GT-2 | ✅ (seed) | M |
| **GT-4** | **Propensity-to-deny (productionized)** | Promote the engine's inline heuristic to `propensity.ts` — explicit factors (open deficiencies, unmet criteria, missing DTR answers, historical code/plan denial rate), low/med/high banding, routing. Labelled decision-support. Tests. | PE-*, GT-2 | ✅ | S |
| **GT-5** | **Golden Thread shell + rail** | Parent `/financial-clearance` route + status rail + `financialClearanceMachine` orchestrating the 4 stages; SMART launch → `?order=…`; keep CRD→DTR→PAS as stage 3. Playwright smoke. | GT-2..4 | ✅ | M |
| **GT-6** | **Eligibility + Patient Estimation stages** | Eligibility panel (Coverage read + `requiresPA` from the engine) and Patient Estimation (GFE / No Surprises Act) with propensity-to-pay. Tests. | GT-5 | ✅ (live eligibility 270/271 = Tier B) | M |
| **GT-7** | **PA work queue + SLA** | Reviewer inbox routed by disposition (approved / likely-deny / denied / more-info) with the Evidence Record attached and 72h/7d timers. Extends the `specialist-inbox` pattern. Tests. | GT-5 | ✅ | M |
| **GT-8** | **AI-DTR from real policy** | Run the reference AI questionnaire pipeline on a parsed CPB → DTR `$questionnaire-package` with CQL prepopulation → consume in stage 3 behind a human-review gate. | GT-3 | ⚠️ needs Docker + Anthropic key | M |
| **GT-9** | **Policy Engine hardening** | CQL-level criteria encoding (beyond ICD-10 root match), more adapters (additional payers / a state Medicaid list), a batch ingest CLI, and an accuracy-regression suite over the whole corpus. SME review of encoded criteria. | PE-* | ✅ | M–L |
| **GT-10** | **Tier-B integration + conformance** | Wire eligibility (270/271), real CRD/DTR/PAS, and X12 278/275 via the WSO2/Ballerina backbone + ITX; Inferno / Da Vinci conformance runs. | all | ❌ Tier B | L |

Ordered path to "done": **GT-2 → GT-3 → GT-4** (turn the engine into a visible medical-necessity stage with an evidence spine), then **GT-5** (assemble the four-stage thread), then **GT-6 / GT-7** (complete the member- and reviewer-facing stages), with **GT-8 / GT-9** deepening the AI + policy coverage and **GT-10** taking it to live, conformance-tested integration. GT-2 through GT-7 and GT-9 all demo **offline on mock data**; only GT-8 (AI pipeline) and GT-10 (live backbone) need external services.

---

## 10. Standards & compliance mapping

CMS-0057-F (CRD/DTR/PAS APIs, 72h/7d decisions, denial reasons) · Da Vinci **CRD, DTR, PAS, CDex, Coverage Determination Record** · CARIN Blue Button (eligibility/benefits, estimation) · SMART App Launch (EHR launch) · X12 **278/275** (PAS↔EDI via ITX) · US Core (clinical data) · **No Surprises Act / GFE** (patient estimation). Nothing here is claimed conformant without testing — conformance stays a Tier-B/Inferno activity (per `docs/traceability.md`).

---

## 11. Honest notes

- **Propensity-to-deny** starts as a transparent heuristic, not ML — labelled decision-support, never the determination. Don't over-claim accuracy without data.
- **Policy parsing** — the parser now extracts codes + review dates + top-level medical-necessity indications for all 17 docs (validated 19/19 on anchors). What it does *not* yet do is encode full sub-criteria as executable logic: today's criteria check is an ICD-10 covered-set match, not CQL. Deep, executable criteria (and clinical nuance inside each indication) remain an iterative, SME-reviewed, AI-assisted effort with human sign-off (GT-9). Treat the covered-set match as a strong screen, not a final adjudication.
- **Live eligibility, PAS adjudication, and X12 278** need the Tier-B backbone; offline uses dev stubs.
- **PHI/consent** — the evidence record carries clinical data; keep it under the same server-side, audited, consent-gated handling as the rest of the BFF.

---

## 12. Recommendation

Adopt the **Golden Thread** as the target model for the PA build: keep our working CRD→DTR→PAS as **stage 3**, and add **Eligibility, Medical Necessity (with the payer-policy library + deficiency loop), and Patient Estimation** around it — all launched in-context from `md-smart-launch`, unified by a **shared Evidence Record**, differentiated by a **propensity-to-deny** score and a **reviewer work queue**. Start with **GT-1 (policy library)** and **GT-3 (medical-necessity engine)** — they turn the supplied Aetna/UHC documents into working capability and are the highest-value, most demoable additions. This also strengthens the IBM-stack + Bob/Claude AI-enablement story the journey maps are built around.

*Prepared with IBM Bob + Claude. Grounded in the Cleveland Clinic Golden Thread materials and Aetna/UHC payer policies reviewed in `Downloads\PA`, and mapped to the existing `feat/cms0057f-native` build.*
