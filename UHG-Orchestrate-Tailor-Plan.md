# UHG-Orchestrate -> Data-Driven for ALL Citizens (Maria Redhawk default)

## Direction (corrected)
- **No hardcoding.** Screens must work for any of the 5–6 canonical citizens, with
  **Maria Redhawk (MARIA_SD_001) as the default** — exactly like the rest of RHTP.
- **Only touch persona-bound screens.** Not every screen shows the persona; population /
  enterprise screens stay as-is. We replace literals with data reads only where it makes sense.

## The 5–6 citizens (single source = patientRegistry)
Maria Redhawk (MARIA_SD_001, default) · Dorothy Simmons (PAT-0042) · James Wilson (PAT-0087) ·
Robert Chen (PAT-0103) · Lisa Thompson (PAT-0156) [· James Okafor PAT-0201].

## Architecture — parameterize on the active citizen
1. **Adapters, not constants.** Replace `data/maria.ts` + `data/scenario.ts` with:
   - `personaFor(citizenId)` -> maps a RHTP `RegistryPatient` into the shape the UHG screens
     expect (id, name, age, risk, episode, careGap, consent, address, family, caregiver).
   - `scenarioFor(citizenId)` -> builds the orchestration conditions + domain-agent ownership
     from that citizen's **care gaps + wholePersonGraphData keystones** (graph for Maria,
     registry-derived for the others — the pattern already used by `citizenNeeds`).
2. **Active-citizen context.** UHG screens read an `activeCitizenId` (default `MARIA_SD_001`).
   A citizen selector / the existing LIVE POPULATION FILTER switches it; everything re-derives.
3. **Persona-bound screens read the adapter** instead of literals. Population/enterprise
   screens (fragmentation, portfolio-scale, agent-impact, reporting) use panel aggregates,
   not a single persona.
4. **Graceful per-citizen degradation.** A citizen without a dependent/caregiver -> the
   family / caregiver screens degrade (show "no dependents on file") rather than break.
   Maria is richest (full graph + Sophia + Elena); others derive from their registry data.

## Why Maria is the strong default
Maria Redhawk already models Sophia (dependent -> family screen) and Elena (caregiver target
-> caregiver screen), 9 care gaps across Clinical/BH/Social, plus graph keystones — so every
persona-bound screen has real content for her with zero invention.

## Screen classification
- **Persona-bound (read activeCitizen):** consumer-360 (Journey-Aware), whole-person-care,
  controller scenario intake/reasoning, signal-disposition, cdp-assembly, family-sofia,
  caregiver-elena.
- **Population/enterprise (panel-level, untouched):** fragmentation-split-system-view,
  portfolio-scale (LIVE POPULATION FILTER), agent-impact-dashboard, reporting-dashboard,
  agent-library.

## RHTP application-context tailoring (light, where it shows)
- "Member" -> "Citizen"; geography/providers -> SD (Martin, Winner Regional, Bennett County);
  contract -> SD Medicaid; keep the dark orchestration aesthetic, relabel header.
- Domains -> Clinical / BH / Social + Provider/Caregiver (RHTP ownership model).

## Decisions
1. **Citizen source of truth:** reuse RHTP `patientRegistry` + `wholePersonGraphData` via the
   adapters (recommended) — confirm.
2. **Citizen switching:** drive `activeCitizenId` from a selector on these screens, default Maria
   (recommended) — or hard-default Maria only for now and add switching later?
3. **Scenario derivation:** build orchestration conditions from each citizen's real gaps/keystones
   (recommended) — vs a fixed template only filled with their name.
4. **Aesthetic / terminology:** keep dark look + relabel to SD Medicaid RHTP, Member->Citizen
   (recommended).
5. **Still open:** "Agentic Super Agent" = `agent-library`? (assumed yes unless told otherwise.)

## Execution order (after approval)
Phase 0 scaffold (zustand, tailwind merge, copy `src/uhg/`, rewrite imports) ->
Phase 1 build `personaFor`/`scenarioFor` adapters + wire active-citizen + 2 persona-bound screens ->
Phase 2 wire remaining persona-bound screens to the adapters ->
Phase 3 nav group + route re-base + verify across 2–3 citizens (Maria + one other) -> full tsc/build.
