# AI Coding Conventions

> **Purpose:** Keep this codebase maintainable, navigable by humans and AI agents, and
> scalable over time. Paste this file into any coding prompt, or reference it from
> `AGENTS.md` / `CLAUDE.md` so every agent session starts from the same baseline.
>
> **Scope:** Applies to the RHTP platform (`feat/cms0057f-native` and `main`).
> Architecturally grounded in `docs/ARCHITECTURE.md`, `docs/traceability.md`,
> `docs/build-narrative.md`, and `docs/remaining-work-and-test-plan.md`.
>
> **Enforcement:** `check-file-sizes.sh` (CI gate) + `.eslintrc.enforcement.json`
> (lint rules). Run `bash check-file-sizes.sh rhtpdemo/src rhtpdemo/tests` for the
> full codebase report. Add `"check:sizes": "bash check-file-sizes.sh rhtpdemo/src
> rhtpdemo/tests"` to `package.json` scripts and call it from CI.

---

## 0. Read Before You Touch Anything

Before making any change — including what looks like a trivial fix — read:

1. `docs/ARCHITECTURE.md` — the layer model, security invariants, and BFF contract.
2. `docs/traceability.md` — every capability traces to a test. A capability without a
   green test is *asserted, not verified*. Never claim compliance from an untested path.
3. `AGENTS.md` / `CLAUDE.md` / `README.md` — build commands, test commands, and
   architecture boundaries.
4. The feature-area `README.md` — e.g., `src/lib/policy/README.md` before touching the
   Policy Engine.

Search first. Never rewrite a large file without understanding how it is used.

```bash
# preferred discovery tools
npx tsc --noEmit            # zero errors before you start; zero errors when you finish
grep -r "symbolName" src/   # or use ripgrep: rg "symbolName"
```

---

## 1. Core Principles

1. **Small files.** Every code file ≤ 400 lines. If it grows past that, split it first.
2. **Single responsibility.** One primary reason to change per file.
3. **Single source of truth.** One authoritative location for every type, schema,
   contract, or dataset.
4. **Stable interfaces.** Change implementation behind a public interface; do not break
   the contract.
5. **Automated enforcement over tribal knowledge.** Lint rules + the
   `check-file-sizes.sh` CI script enforce the caps; do not rely on memory.
6. **Build must stay green.** `tsc` 0 · `vitest` all passing · `next lint` clean —
   before *and* after every change. A task is not done until the build is green.

---

## 2. File Size & Structure

### Hard limits

| Artefact | Maximum lines |
|----------|--------------|
| Production code | **400** |
| Test files | **500** |
| Generated / seed files | Exempt (e.g. `policy-library.seed.json`) |
| PDF / HTML template generators | **Exempt** — files whose primary content is CSS/HTML template strings or long narrative copy (e.g. `generateDetailedScreenPDF*.ts`, `generateTalkTrackPDF*.ts`). Splitting these yields no architectural benefit; the content is data, not logic. Add the glob pattern to `EXEMPT_PATTERNS` in `check-file-sizes.sh`. |

**If a file is at the limit: stop adding code, split by responsibility, then continue.**

### Function limits

| Metric | Target | Hard limit |
|--------|--------|-----------|
| Function body | 30 lines | **50 lines** |
| Cyclomatic complexity | ≤ 7 | **≤ 10** |
| Nesting depth | ≤ 3 | **≤ 4** |

### Avoid generic dumping grounds

Files like `helpers.ts`, `utils.ts`, `common.ts`, `misc.ts`, and `mockData.ts` are
smell signals. Extract purposeful modules (`fhirHelpers.ts`, `dateUtils.ts`) instead.

> **RHTP example:** `src/lib/mockData.ts` is a legacy accumulation point.
> New mock/seed data belongs in `data/` files loaded at runtime, not appended there.

---

## 3. Project Organisation

### Feature-first layout

```
src/lib/<domain>/         ← pure domain logic; no Next.js or React imports
  types.ts                ← NormalizedFoo + evaluation types (ONE place)
  fooEngine.ts            ← evaluate(inputs) → output; pure + deterministic
  ingest/                 ← adapters that normalize raw sources
  data/                   ← seed JSON/YAML loaded at runtime
  index.ts                ← public re-exports only; keeps the surface stable
  README.md               ← what it does, layout table, usage snippet, guardrails

src/components/<domain>/  ← React components; presentation only
  FooPanel.tsx
  FooStatus.tsx

src/app/(roleGroup)/      ← Next.js route group per audience
  foo/page.tsx            ← thin: loads data via BFF, passes to components
```

### BFF-only rule (security invariant — never break this)

```
Browser → /api/* (BFF) → external services / FHIR / model calls
```

- The browser calls **only** `/api/*` routes. It never reaches FHIR, APIM, or any
  AI endpoint directly.
- SMART tokens live in an encrypted, httpOnly server session — **never** in the browser.
- No secrets in `NEXT_PUBLIC_*` — ever. Not for AI keys, not for OAuth secrets.
- Every privileged action emits a **PHI-safe** audit event (references + codes,
  never PHI payloads). See `src/lib/server/audit.ts`.

> This is not style — it is a compliance requirement under CMS-0057-F and HIPAA.

---

## 4. Data Separation

### Rule: data is not code

- No large literals, mock records, or configuration inline in source files.
- Store seed data in `data/*.json` (or `data/*.yaml`) and load at runtime.
- Generate bulk/repetitive data with a script (`tools/seed/`), not by hand-writing
  every record.

### Rule: one source of truth

A dataset, type, schema, or contract exists in **one authoritative location**.

```
src/lib/policy/data/policy-library.seed.json   ← the 17-policy corpus; regenerated
                                                   by tools/seed/parse_policies.py
src/lib/networkAdequacy/data/seed.json         ← GA + SD adequacy seed
src/lib/evidence/types.ts                      ← EvidenceRecord shape
```

Never duplicate the same dataset across modules or across front-end / back-end.

---

## 5. Types & Contracts

### Centralise shared shapes

```
src/lib/<domain>/types.ts     ← NormalizedPolicy, MemberContext, OrderContext,
                                 CoverageDetermination, EvidenceRecord, …
src/lib/server/              ← server-only types (never re-export to the browser)
```

**One shape, any source.** The `NormalizedPolicy` model in `src/lib/policy/types.ts`
is the canonical example: source-specific extractors emit raw records; adapters
normalize them; the engine only ever sees the normalized model and never changes
per payer. Apply this pattern to every domain.

### Keep public interfaces stable

When adding a payer adapter or a new domain module:

```ts
// ✅  extend the registry — engine never changes
import { registerAdapter } from '@/lib/policy';
registerAdapter(myStateMedicaidAdapter);

// ❌  modify evaluate() to handle a new raw format
```

---

## 6. AI / LLM Guardrails (mandatory — do not relax)

These rules are non-negotiable. They are baked into every feature in this codebase and
must be preserved as the platform grows.

| Rule | Rationale |
|------|-----------|
| **AI is server-side only.** All model calls (`networkAdequacyAI`, `dtr/generator`, copilots) run in the BFF. No AI SDK import in any browser-side file. | Client-exposed keys + PHI risk |
| **Deterministic-first.** Every AI-enhanced feature has a deterministic offline path that produces grounded, reproducible output with no API key. The LLM narrates *on top*; it does not replace the engine. | Reliability; demo without infrastructure |
| **Human-gated.** Any AI *recommendation* (augmentation plan, DTR draft, action plan, propensity routing) requires explicit human approval before it is acted on. AI never sets Approved / Denied on a PA; only a payer `ClaimResponse` moves the state machine. | Regulatory + liability |
| **PHI-safe.** Model calls carry references, codes, and aggregates — never identifiable PHI payloads. Assert this in tests. | HIPAA + audit |
| **Labelled decision-support.** `propensityToDeny`, adequacy recommendations, and cost estimates are **not** determinations. Label them explicitly in UI and in API responses. | Clinical + regulatory honesty |
| **Feature-flagged.** AI features (`aiDtrGeneration`, `networkAdequacyAI`) are off by default; the flag lives in `src/lib/flags/flags.ts`. A missing key → graceful degradation to the deterministic path, never a runtime crash. | Safe rollout |

---

## 7. Offline-First / Tier-A vs Tier-B

```
Tier A (offline, always runnable)
  dev stubs · seeded HAPI FHIR · deterministic engines · mock auth
  → everything in this repo demos without keys or external infrastructure

Tier B (live, backbone-dependent)
  BACKBONE_* env vars → live CRD/DTR/PAS, eligibility 270/271, X12 278/275
  → each live client refuses calls until configured (BackboneNotConfiguredError)
     so offline code fails loud, not silently
```

**Never** conflate Tier-A demo behaviour with Tier-B conformance claims.
Nothing is claimed conformant without Inferno / Da Vinci testing on the live backbone
(see `docs/conformance-plan.md`).

### Adding a new backbone-dependent feature

1. Write the domain library against a clean interface.
2. Implement a dev stub that satisfies the interface.
3. Gate the live client behind `isBackboneConfigured()` from
   `src/lib/backbone/config.ts`.
4. Document the cutover step in `docs/conformance-plan.md`.

---

## 8. State & UI Architecture

### Dependency flow (never invert this)

```
UI (page.tsx / components)
  ↓  props / hooks only
Hooks / view-models
  ↓  calls BFF routes (/api/*)
BFF API routes
  ↓  calls
Domain libraries (src/lib/*) — pure, no React, no Next.js
```

- Presentation components render; they do not contain business rules.
- Business logic belongs in hooks, services, or domain libs.
- Local state for local concerns; shared state (`stores/`) for shared concerns.
- Avoid duplicated state. If two components need the same derived value, derive it
  once in a shared hook or BFF response.

---

## 9. Context-Window Discipline (AI agent sessions)

These rules keep AI sessions productive on a large codebase without hallucination.

### Before every session

1. Read `docs/ARCHITECTURE.md` and the relevant feature `README.md`.
2. Search to locate the symbol/file — never assume location.
3. Read only the sections you need to change. Do not load the whole file.

### During a session

- **Targeted edits only.** Replace specific strings / blocks. Do not regenerate a
  file wholesale unless it is a new file.
- **One feature / folder per session.** Scope prevents context bleed.
- **Consistent, greppable names.** `runFinancialClearance`, `evaluate`,
  `toMemberContext` — predictable names make search reliable.
- **Preserve interfaces.** If you change a function signature, update every caller
  in the same change set. Never leave the repo in a broken state.
- **Commit (or stash) before a large edit** so the state is recoverable.

### After every change

```bash
npx tsc --noEmit          # must be 0 errors
npx vitest run            # must be all passing (currently 178)
npm run lint              # must be clean on changed files
bash check-file-sizes.sh  # must exit 0
```

---

## 10. Testing

### Coverage expectations

| Layer | Required test |
|-------|--------------|
| Domain library (`src/lib/*`) | Unit tests; pure functions → straightforward |
| BFF route (`/api/*`) | Auth 401 · authz 403 · validation 400 · happy-path 200 · PHI-safe body |
| State machine | All transitions + human-gate enforcement |
| Policy engine | Accuracy anchors — 19/19 known source anchors must stay green |
| Adequacy engine | Seed-spread regression (catch parser / seed drift) |
| UI smoke | Playwright: critical paths, including the stage-3 handoff and gold-card vs PA paths |

### Co-locate small tests

```
src/lib/policy/policyEngine.ts
tests/policy/policyEngine.test.ts    ← one test file per domain module
```

### Regression gates

- Policy corpus-accuracy suite must stay green on every change to `src/lib/policy/`.
- Adequacy seed-spread test must stay green on every change to `src/lib/networkAdequacy/`.

---

## 11. Traceability Rule

> A capability without a green test is *asserted, not verified*.

When you add a capability:

1. Add a row to `docs/traceability.md` with the code path and the test file.
2. The test must pass before the capability is considered delivered.
3. Mark backbone-gated rows clearly; do not claim offline-verified conformance for
   capabilities that require the live stack.

---

## 12. Definition of Done

A task is **not complete** until every item below is true:

- [ ] File size ≤ 400 lines (production) / ≤ 500 lines (tests)
- [ ] Function size ≤ 50 lines; complexity ≤ 10; nesting ≤ 4
- [ ] Data externalized (no large inline literals; seed data in `data/`)
- [ ] Shared types updated in their authoritative `types.ts`
- [ ] Single source of truth preserved — no duplicated dataset or schema
- [ ] BFF invariant upheld — no secrets / AI calls / direct FHIR in browser code
- [ ] AI guardrails upheld — server-side · deterministic fallback · human-gated · PHI-safe · labelled
- [ ] `docs/traceability.md` row added for any new capability
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` — all tests passing
- [ ] `npm run lint` — clean on changed files
- [ ] `bash check-file-sizes.sh` — exits 0
- [ ] `git commit` (or PR) with a description of what changed and why

---

## 13. Anti-Patterns (never do these)

| Anti-pattern | Why it is harmful here |
|---|---|
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` or any `NEXT_PUBLIC_` secret | Exposes keys to the browser; violates BFF invariant |
| Calling FHIR / AI / APIM directly from a component | Bypasses auth, audit, and PHI-safety |
| Duplicating `NormalizedPolicy` or `EvidenceRecord` shapes | Breaks single source of truth; engine diverges |
| Adding to `mockData.ts` / `helpers.ts` instead of a domain module | Grows the dumping ground; makes search unreliable |
| `evaluate()` checking `if (payer === 'aetna')` | Engine must be source-agnostic; write an adapter |
| Claiming conformance from offline stub behaviour | Conformance is a Tier-B / Inferno activity |
| LLM setting PA status directly | Only `ClaimResponse` moves the PA state machine |
| Feature-flagged AI code that crashes when the key is absent | Must degrade to the deterministic path |

---

---

## 14. Legacy Debt Register (known pre-convention violations)

Running `bash check-file-sizes.sh rhtpdemo/src rhtpdemo/tests` against the codebase
as of the convention adoption date reveals **86 files over the 400-line cap** and
**19 approaching it**. These are legacy accumulations — they do not get a pass, but
they are tracked here so AI agents do not treat them as a green baseline.

### Worst offenders (priority split list)

| File | Lines | Remediation |
|---|---|---|
| `src/lib/mockData.ts` | 2 661 | Move all inline mock records to `data/*.json`; load with a registry |
| `src/uhg/components/shared/OrchestrationFlowModal.tsx` | 3 352 | Split into sub-components + a data file |
| `src/app/md-smart-launch/components/MdSmartSummaryScreen.tsx` | 2 247 | Extract tab panels as separate components |
| `src/uhg/lib/generateDetailedScreenPDF.ts` | 1 287 | Extract template data to JSON; keep logic thin |
| `src/lib/services/carePlanGenerator.ts` | 1 148 | Split into `carePlanBuilder`, `carePlanValidator`, `carePlanTemplates` |
| `src/lib/patientContext.tsx` | 773 | Extract `patientReducer`, `patientSelectors`, `patientTypes` |
| `src/lib/patientRegistry.ts` | 870 | Move the `FHIR_ID_MAP` data to `data/patient-registry.json` |

### Policy for legacy files

- **Do not add to any file that is already over the limit.** If you need to add code,
  split the file first as part of the same PR.
- **Do not treat a legacy violation as permission** to create a new large file.
- Track remediation progress by re-running `check-file-sizes.sh` on each PR. The
  violation count should only decrease over time.

---

## 15. `package.json` Integration

Add these entries to `rhtpdemo/package.json` scripts to wire the gates into every
development workflow:

```json
{
  "scripts": {
    "check:sizes":   "bash ../check-file-sizes.sh src tests",
    "check:types":   "tsc --noEmit",
    "check:all":     "npm run check:types && npm run check:sizes && npm run lint && npm run test",
    "pretest":       "npm run check:types && npm run check:sizes"
  }
}
```

And the GitHub Actions step (`.github/workflows/ci.yml`):

```yaml
- name: Convention gates (types · sizes · lint · tests)
  working-directory: rhtpdemo
  run: |
    npx tsc --noEmit
    bash ../check-file-sizes.sh src tests
    npm run lint
    npx vitest run
```

---

*Maintained alongside `docs/ARCHITECTURE.md`. When the architecture evolves, update both.*
