# Fix Plan — De-hardcode screen BODIES + make signals accurate for Maria Redhawk

## Root cause
The identity bar is data-driven now, but each screen's BODY embeds the demo persona
("Maria Reyes") and a payer/cardiac scenario (Optum, UHC, Phoenix, Dr. James Chen,
Warfarin/Coumadin, AUTH credentialing, Q4 HEDIS) as hard literals — ~300 across the screens.
They never read the selected citizen or her knowledge graph, so the body stays wrong and the
signals are clinically inaccurate for Maria Redhawk.

## Fix architecture — one shared citizen-context adapter
Build `uhg/data/citizenContext.ts` -> `contextFor(citizenId)` sourced from RHTP
`patientRegistry` + `wholePersonGraphData`. Default MARIA_SD_001; works for any citizen.
It exposes the structured blocks the screens render:
- **identity** — name, id, age, location, care manager, org
- **sources[]** — fragmented SD systems with CONFLICTING values (name variant, record id,
  address, risk, consent): SD Medicaid MMIS · Bennett County CAH EHR · Martin Pharmacy ·
  RHTP Care Mgmt (Sarah Johnson) · CBO/Social · BH (42 CFR)
- **signals[]** — contextual, from care gaps + SDOH + BH + eligibility (severity, journey
  context, dependency/BLOCKS, SDOH-modified action)
- **sdohProfile[]** — barriers with severity + AMPLIFIES/BLOCKS edges + signal sources
- **journey** — episode, daysActive, stage, expected vs unexpected signals
- **household** — dependents (Sophia), caregiverFor (Elena), consent scopes
- **channel** — SMS-only 3-7pm window + channel history
- **providers** — Bennett County CAH (0mi), Winner Regional (47mi), Martin Pharmacy
- **benefits** — WIC lapsed, childcare subsidy, TANF, LIHEAP, housing waitlist

## The accuracy fix — Maria's canonical signals (replaces cardiac/payer)
Derived from her graph, NOT invented:
| Was (payer/cardiac) | Now (Maria Redhawk, from graph) |
|---|---|
| AUTH_EXPIRY · Dr. Chen credentialing | **Edinburgh PND 427d** (BH · 42 CFR Part 2 gated) |
| CARE_GAP HbA1c · Q4 HEDIS | **HbA1c 38d — BLOCKED by Transportation + Childcare** -> home lab kit |
| BEHAVIORAL portal engagement | **Well-Child 24mo (Sophia) overdue** + SMS-only channel |
| Cardiac episode Day 34/90 | **Postpartum Health · Day 427** + Pre-diabetic A1C 6.2% rising |
| Warfarin/Coumadin duplicate therapy | **Caregiver: Elena** (Metformin/Lisinopril, Maria picks up) + burden 7.2 |
| SDOH multi-barrier (generic) | Transport 47mi · Childcare · Food/WIC · Economic · Digital divide · **SD winter barrier** |

## Per-screen recast (by embedded-token count)
| Screen | hits | What changes |
|---|---|---|
| whole-person-care | 3 | title name + barriers from `sdohProfile` (nearly aligned already) |
| family-sofia | 12 | Sophia + Bennett/Winner peds + Well-Child gap |
| caregiver-elena | 15 | Elena + caregiver burden + proxy/42 CFR consent |
| fragmentation | 16 | 5 SD source entities + roles (Sophia/Elena) + gaps |
| signal-disposition | 20 | her signals + postpartum journey + transport-BLOCKS dependency |
| consumer-360 | 29 | postpartum journey, household, SMS channel history, her meds |
| cdp-assembly | 41 | SD source conflict cards + graph-viz nodes + resolution log |
| controller + OrchestrationFlowModal | 68 + 99 | scenario recast to her 4 conditions + RHTP domain agents + 42 CFR/tribal governance |

## Works for any selected citizen
Every block derives from the selected citizen's registry + graph. Maria is richest (full
graph). Others render their own gaps/SDOH; family/caregiver screens degrade gracefully
("no dependents on file") when a citizen has none.

## Acceptance test (per screen)
Build clean + a grep gate: **zero** forbidden tokens remain in that screen —
`Reyes, Optum, UnitedHealthcare, OptumRx, Rally, Acme, Change Healthcare, Phoenix, Dr. Chen,
Cardiac, Warfarin, Coumadin, AUTH_001, MARIA_001, Sofia, Banner` — plus a screenshot check.

## Phasing
1. Build `citizenContext` adapter (foundation).
2. Easy wins: whole-person-care, family-sofia, caregiver-elena.
3. Mid: fragmentation, signal-disposition, consumer-360.
4. Heavy: cdp-assembly, then controller + OrchestrationFlowModal.
Each phase: sandbox -> tsc -> token-gate -> mirror.

## Decisions
1. **Depth:** full data-driven adapter so it works for all citizens (recommended) — or Maria-accurate hardcode (faster, not generic)?
2. **Signal derivation:** derive each citizen's signals/journey from their own gaps/graph (recommended), Maria richest?
3. **Acceptance gate:** enforce the zero-forbidden-token grep per screen (recommended)?
4. **Order:** start with the easy wins to lock the pattern (recommended) — or go straight to the controller centerpiece?
