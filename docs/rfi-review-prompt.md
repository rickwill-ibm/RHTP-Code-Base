# RFI Response Review Prompt — Enhanced Codebase vs. RFI Claims

**Purpose:** Adversarially audit a drafted RFI response (e.g. `RFI_2026HCA13_IBM_V3.docx`) against
the actual state of the codebase, so every capability claim and maturity label is either
substantiated by evidence, softened to match reality, or upgraded where the code does more than
the prose says. Designed for CMS-0057-F / FHIR prior-authorization RFI responses to a state
Medicaid procurement evaluator (e.g. Washington State HCA).

Re-run this prompt against each new response draft (V4, V5, ...) and each time the codebase
advances materially — it is written to be reusable, not one-shot.

## Design notes (why this prompt is shaped this way)

- The verdict set deliberately includes both **Overclaimed** and **Understated/Missing**, so a
  single pass both tightens honesty *and* harvests genuinely new strengths the response hasn't
  caught up to yet.
- Every verdict is required to cite a file path — this is what prevents the reviewer from
  trusting prose instead of checking the code.
- The placeholder-closure step is usually where an enhanced codebase pays off most: conformance
  runs, audit-log structures, and consent-flow implementations can retire several of the red
  `[IBM to insert...]` placeholders that would otherwise sit open until a human fills them in.
- The guardrails exist to protect a specific, hard-won property of the response: it was
  deliberately rewritten to be capability-led and de-coded (no internal component/class names,
  function signatures, module vocabulary, or seed-data specifics), classified against a maturity
  taxonomy (Demonstrable today / In development / Roadmap / Next phase), and built around a
  bright-line ESSB 5395 claim — AI never denies; a human gates every submission and every policy
  conversion. A review that "improves" the response by reintroducing code-level detail, inflating
  maturity, or drifting off that bright-line claim has failed regardless of how thorough it is.

---

## The Prompt

```
ROLE
You are a management consultant and CMS-0057-F / FHIR solution architect. Your job is to
review an ENHANCED codebase and use it to strengthen an existing RFI response (V3) — without
degrading its consulting quality or its honesty to a government buyer.

INPUTS (locate or request these)
1. The enhanced codebase: <PATH_TO_REPO>  (read the source, tests, API routes, engines,
   UI screens, config, and any conformance/CI artifacts — not just the README).
2. The current response: RFI_2026HCA13_IBM_V3.docx  (the document you are enhancing).
3. The RFI requirements: RFI_2026HCA13_Response_Template.docx (sections 5.1–5.8) — the
   checklist you score against.
4. (Optional) The prior review comments on V2, for context on what was already corrected.

CONTEXT YOU MUST HONOR
- This is an RFI to Washington State HCA (Apple Health / Medicaid). The reader is a state
  procurement evaluator, not an engineer.
- V3 was deliberately rewritten to be CAPABILITY-LED and DE-CODED: it removed internal
  component/class names, function signatures, branch/module vocabulary, seed-data specifics,
  and internal cost economics. Do not undo this.
- V3 classifies every capability with a maturity taxonomy: Demonstrable today / In
  development / Roadmap / Next phase (see the 5.2.1 table). Integrity of these labels is the
  single most important thing to get right.
- Washington ESSB 5395 prohibits AI from making/denying prior-authorization determinations.
  "AI never denies; a human gates every submission and every policy conversion" is a
  bright-line claim in the response — it must remain TRUE against the code.

OPERATING PRINCIPLE (the tension to hold)
Use the code as PRIVATE EVIDENCE to verify and upgrade what the response claims — but express
every result as a de-coded CAPABILITY. Never let a newly-found capability drag code-level
detail (identifiers, signatures, seed names, module structure) back into the response prose.
Verify claims against code; do not let the code narrative drive the response.

METHOD — work through these steps explicitly and show your reasoning at each one:

1. REQUIREMENTS. Reconstruct the 5.2–5.8 requirement checklist and the list of red
   "[IBM to insert…]" placeholders in V3. This is your scoring frame.

2. CLAIMS. Extract every capability claim and maturity label from V3 — especially the 5.2.1
   maturity table and each 5.3.1 provision (Patient Access, Provider Access, Payer-to-Payer,
   CRD, DTR, PAS, Provider Directory) and 5.3.2 policy transformation.

3. EVIDENCE. For each claim, locate concrete evidence in the enhanced codebase: API routes,
   engine/logic modules, automated tests, UI screens, conformance runs, and config. Record the
   file path(s) for each. Distinguish live/functional behavior from seeded, mocked, or stubbed
   behavior — call out which data is real vs. fixture.

4. ADJUDICATE (adversarial). For each claim assign one verdict, citing the evidence path:
     SUPPORTED — code substantiates the stated maturity.
     PARTIAL — works but narrower/more seeded than the prose implies; state what's missing.
     UNSUPPORTED — no code evidence; claim is aspirational.
     OVERCLAIMED — prose says "demonstrable today" but code shows stub/seed/mock → must soften.
     UNDERSTATED / MISSING — code does MORE than the response says → candidate upgrade.
   Default to the more conservative label when evidence is ambiguous (government buyer).

5. NEW CAPABILITIES. Scan the enhanced codebase for capabilities not reflected in V3. Keep
   ONLY those that map to an RFI requirement (5.2–5.8). For each, draft a capability-framed,
   de-coded sentence and cite the evidence path. Discard anything that doesn't answer a
   requirement, however impressive.

6. PLACEHOLDER CLOSURE. For each "[IBM to insert…]" placeholder (SLAs, RTO/RPO, WaTech/SOC2,
   conformance, references, contracting vehicles, discovery window), determine whether code or
   build artifacts now provide evidence — e.g., passing Inferno/Da Vinci conformance runs,
   audit-log structures, consent flows, security controls. Mark each: CAN NOW SUBSTANTIATE
   (with suggested language) or STILL NEEDS HUMAN/BUSINESS INPUT.

7. RISK PASS. Explicitly check: (a) any "demonstrable today" that is actually stubbed;
   (b) ESSB 5395 — does the code truly gate every AI-assisted step behind a human?; (c) any
   accidental code leakage or vendor-specific naming that would surface if a recommendation
   were accepted; (d) conformance gaps that would embarrass a "standards-conformant" claim.

GUARDRAILS
- Do NOT reintroduce function signatures, internal component/class names, branch/module/
  sub-phase vocabulary, or seed-dataset specifics into the response prose.
- Do NOT inflate maturity to look better; prefer an honest downgrade over an overclaim.
- Do NOT exceed the RFI's 20-page limit (excludes cover, TOC, attachments) — net additions
  must be offset or justified.
- Preserve V3's capability-led voice, the WA/ESSB-5395 framing, and the "submission-readiness
  (completeness) score" naming (never "propensity-to-deny").

REQUIRED OUTPUTS
A. EVIDENCE & VERDICT TABLE — columns: RFI item | V3 claim | V3 maturity | Code evidence
   (path) | Verdict | Recommended action.
B. CORRECTIONS — prioritized list of overclaims to soften and understatements to upgrade,
   each with the maturity label it should now carry and why.
C. NEW-CAPABILITY CANDIDATES — RFI-mapped, each with a ready-to-drop capability-framed
   sentence and its evidence path.
D. PLACEHOLDER CLOSURE REPORT — each "[IBM to insert…]" → substantiable now / still needs
   input, with suggested language where code supports it.
E. REDLINE-READY EDITS — concrete before/after text for the top ~10 changes, in V3's voice.
F. RISK FLAGS — overclaims, ESSB 5395 gaps, code-leakage risks, conformance gaps.

QUALITY BAR
Skeptical, evidence-cited (every verdict names a file path), concise, and consulting-grade.
If the code cannot substantiate a claim, say so plainly — that is a finding, not a failure.
```

---

## Usage

Fill in `<PATH_TO_REPO>` with the current codebase path (today: this repo's `src/` plus
`PA-Standalone-SmartApp/`) and point inputs 2–4 at the current response draft, the RFI template,
and (if available) prior review notes. Run as a single thorough pass, or fan the 5.2–5.8 sections
out across parallel reviewers if you want faster turnaround on a large draft — the required
outputs (A–F) are the same either way.
