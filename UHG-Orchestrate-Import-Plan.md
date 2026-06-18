# UHG-Orchestrate Screens → RHTP Import Plan

## What these screens are
A self-contained "presenter" mini-app. All 12 target screens share one framework:
zustand `demoStore`, `ScreenLayout`, `PresenterControls`, `MariaStatusStrip`, a few
modals, `signalGenerator`, and `data/maria` + `data/scenario`. Screens cannot be lifted
without that framework.

## Compatibility (good)
- Same core stack: **React 19.0.3 + Next 15 + Tailwind 3 + heroicons** (no React 18/19 conflict).
- Only **one new dependency: `zustand`**. The declared `@xyflow/react` is unused — not needed.
- `demoStore` is in-memory only — coexists cleanly with RHTP's `appContext`.
- One reconciliation: UHG has its own Tailwind tokens (colors + fontFamily + 313-line tailwind.css)
  that must be merged into RHTP, or the screens render off-palette.

## Isolation strategy
- Framework copied to `src/uhg/` (store, components, data, lib, config).
- Routes copied to `src/app/uhg-orchestrate/<screen>/page.tsx`.
- Mechanical import rewrite in every copied file: `@/...` -> `@/uhg/...`.
- Screens keep their own `ScreenLayout` (NOT wrapped in RHTP `AppLayout`).
- Re-base presenter next/prev route list to `/uhg-orchestrate/*`.
- New nav group "UHG-Orchestrate-Screens" in `AppLayout`.

## Feature -> file mapping (confirmed)
| Requested | Route |
|---|---|
| One enterprise. Five entities. Zero coordination. | fragmentation-split-system-view |
| CDP Assembly | cdp-assembly-split |
| Journey-Aware Context | consumer-360 |
| Whole Person Care Intelligence | whole-person-care |
| Signal Disposition Engine | signal-disposition-engine |
| Agentic Super Orchestration | controller-agentic-super-orchestration-centerpiece |
| SUPER ORCHESTRATION CONTROLLER (INSTRUCTION_SOURCE / CONTEXT_INTEGRITY) | controller screen + OrchestrationFlowModal status bar |
| FAMILY THREAD — DEPENDENT INTELLIGENCE | family-sofia |
| Caregiver Intelligence — Elena Reyes | caregiver-elena |
| Agent Impact Dashboard (2 screens) | agent-impact-dashboard + reporting-dashboard |
| LIVE POPULATION FILTER | portfolio-scale |

**Ambiguity — "Agentic Super Agent":** no screen has that exact title. Closest is `agent-library`
(the agent registry/marketplace). Needs your call.

## Phasing
0. Scaffold: add `zustand`, merge Tailwind tokens + CSS, copy `src/uhg/`, rewrite imports.
1. Thin slice: stand up 2 screens, confirm build + render.
2. Copy remaining screens, fix paths.
3. Wire-up: nav group, route re-base, full tsc + build verify (sandbox-then-mirror).

## Decisions to confirm
1. "Agentic Super Agent" -> use `agent-library` (recommended), section of controller, or other?
2. "Agent Impact Dashboard – 2 screens" -> confirm agent-impact-dashboard + reporting-dashboard.
3. Pull depth -> all 12 now (recommended), or Phase 0–1 thin slice first?
4. Nav chrome -> keep native ScreenLayout (recommended), or add a "back to RHTP" link on each?
