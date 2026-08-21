# CLAUDE.md

Read `AGENTS.md` first — it is the session entry map (commands, repo map, read order,
hard rules, stop conditions). The governing coding standard is
`AI-CODING-CONVENTIONS.md` (v2) at the repo root; the archived v1 in
`docs/archive/` is not current guidance.

Non-negotiables, restated for every session: BFF-only security invariant · AI
guardrails (server-side, deterministic-first, human-gated, PHI-safe, labelled,
feature-flagged) · quality ratchet (never add code to a file in
`quality-baseline.json`) · `npm run check:all` must exit 0 before a task is done.
