# Architecture

A single, holistic view of how RHTP fits together: the CMS-0057-F provisions, the
security/BFF model, the generalized Policy Engine, the Golden Thread financial-clearance
workflow, and the Tier-B backbone seams. This supersedes the earlier per-slice notes now
in `docs/archive/`.

## 1. Layers

```
Browser (React 19, Tailwind)
   │  calls only /api/*  (never FHIR/APIM directly)
   ▼
BFF / API routes (Next.js server)  ──►  server-held SMART token, correlation id, audit
   │
   ├─ /api/fhir/*                 → fhirServer.ts → FHIR gateway (or seed in dev-mock)
   ├─ /api/cds | /api/dtr | /api/pas   → CRD/DTR/PAS (dev stubs, or Tier-B backbone)
   ├─ /api/financial-clearance   → Golden Thread orchestrator (+ evidence persistence)
   └─ /api/evidence/[id]         → persisted Evidence Record
   │
   ▼
Domain libraries (pure, deterministic, tested)
   src/lib/policy         generalized Policy Engine + gold carding + propensity + criteria
   src/lib/evidence       Evidence Record (append-only) + store
   src/lib/goldenThread   the four-stage thread: services, machine, work queue, DTR
   src/lib/workflow       PA lifecycle state machine (paMachine)
   src/lib/backbone       Tier-B config + live client seams (gated)
```

Security invariants (BFF): the browser holds **no** tokens or secrets; SMART access
tokens live in an encrypted, httpOnly server session; every privileged action emits a
**PHI-safe** audit event (references + codes, never PHI payloads).

## 2. CMS-0057-F provisions

| Provision | Surface | Mechanism |
|-----------|---------|-----------|
| Patient Access | `(member)/access` | FHIR reads (Coverage, Condition, ClaimResponse) via the BFF |
| Provider Access | `(provider)/provider-access` | `$member-match` + treatment-relationship reads |
| Payer-to-Payer | `(ops)/payer-to-payer` | async bulk `$export` from a prior payer |
| Prior Authorization | `(reviewer)/prior-auth` | Da Vinci CRD → DTR → PAS, human-gated submission |

All four demo offline via dev stubs; the operational provisions (72h/7d decision SLAs,
denial reasons) are modeled in `paMachine` and the work queue.

## 3. Generalized Policy Engine (`src/lib/policy`)

One normalized model, any source. A source-specific **extractor** emits raw records; an
**ingestion adapter** normalizes them; the **engine** evaluates against the normalized
model and never changes per payer.

- `types.ts` — `NormalizedPolicy` + evaluation types.
- `ingest/` — `PolicyIngestionAdapter` + registry; adapters for Aetna CPBs, UHC PA
  lists, and a generic PA-list adapter for **any** payer/state agency.
- `policyLibrary.ts` — loader + `byCode` / `byNumber` indices; mock mode loads the seed.
- `policyEngine.ts` — `evaluate(member, order, library) → CoverageDetermination`
  (experimental → likely denial; criteria-gated → criteria met + deficiencies;
  code-on-PA-list → PA required; else no policy).
- `criteria.ts` — a CQL-style structured predicate model + evaluator with an SME-review
  gate (screens beyond the ICD-10 covered-set match).
- `goldCarding.ts` — provider NPI × code × payer exemption (granted roster or
  history-based qualification; expiry/revocation) → `pa-exempt-gold-card` override.
- `propensity.ts` — transparent additive denial-risk model (decision-support only).
- Data-source seams — `goldCardSource.ts`, `denialRates.ts` (mock now, real feed later).

The seed library (`data/policy-library.seed.json`) is produced from real Aetna Cardiac
CPBs + UnitedHealthcare PA lists by `tools/seed/parse_policies.py` (validated against
known anchors; guarded by a corpus-wide accuracy-regression suite).

## 4. Golden Thread — Financial Clearance (`src/lib/goldenThread`)

Four stages, one Evidence Record:

1. **Eligibility** — active coverage + "requires PA?" (net of gold carding).
2. **Medical Necessity** — Policy Engine + gold card + propensity + remediation loop.
3. **Prior Authorization** — CRD → DTR → PAS (existing `paMachine`); skipped when PA is
   not required (e.g. gold-carded).
4. **Patient Estimation** — Good Faith Estimate (No Surprises Act) + propensity-to-pay.

- `financialClearanceMachine.ts` — pure parent orchestrator (states/events).
- `threadOrchestrator.ts` — `runFinancialClearance` runs the whole thread server-side,
  threads + **persists** the Evidence Record, and routes a work item.
- `workQueue.ts` — routes by disposition with 72h/7d SLA + breach detection.
- `dtr/generator.ts` — DTR questionnaire generation: deterministic offline generator,
  with a flag+config-gated AI pipeline seam and a mandatory human-review (draft) gate.

The **Evidence Record** (`src/lib/evidence`) is append-only and point-in-time — the Da
Vinci Coverage Determination Record and audit spine — persisted via `evidenceStore.ts`
(in-memory or file; swap for FHIR persistence in production) and projected to PHI-safe
audit events.

## 5. Tier-B backbone (`src/lib/backbone`)

Live, standards-conformant operation. `config.ts` reads `BACKBONE_*` endpoints and
reports capabilities; `clients.ts` exposes client seams (eligibility 270/271, CRD/DTR/PAS,
X12 278/275) that **refuse calls until configured**, so offline code fails loud rather
than hitting a missing endpoint. Cutover and conformance are in `docs/conformance-plan.md`.

## 6. Standards mapping

CMS-0057-F (four APIs, 72h/7d decisions, denial reasons) · Da Vinci CRD/DTR/PAS + Coverage
Determination Record · US Core · CARIN Blue Button (eligibility/estimation) · SMART App
Launch · X12 278/275 (via ITX) · No Surprises Act / GFE (patient estimation). Nothing is
claimed conformant without Inferno / Da Vinci testing on the Tier-B backbone.
