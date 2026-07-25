# Current-state map (F-1)

Reusable RHTP assets (verified) and how Slice 0 uses them.

| Asset | Location | Slice-0 disposition |
|---|---|---|
| `FhirClient` class + `getFhirClient()` | `src/lib/services/fhirClient.ts` | Kept as browser client; now points at `/api/fhir` (BFF). Server calls use new `src/lib/server/fhirServer.ts`. |
| FHIR mappers (`mapFhirPatientToRegistryPatient`, `bundleEntries`) | `src/lib/services/fhirResourceMappers.ts` | Reused later to build `vm` in `fhirServer` (TODO in F-4). |
| `smartAuth.ts` (mock, always-authenticated) | `src/lib/services/smartAuth.ts` | **Deprecated** by `src/lib/server/smartSession.ts` (real, server-held tokens). |
| `workflowMachine.tsx` | `src/lib/workflowMachine.tsx` | Basis for the PA state machine (Slice 4). |
| CDS Hooks routes | `src/app/api/cds-hooks/*` | Pattern reused by the BFF; extended for CRD in Slice 4. |
| `patientRegistry.ts` (`FHIR_ID_MAP`) | `src/lib/patientRegistry.ts` | Maps Maria → FHIR id `MARIA_SD_001` (seed F-7). |

## New in Slice 0
- `src/lib/server/` — `env`, `correlation`, `audit`, `smartSession`, `fhirServer` (all server-only, no `NEXT_PUBLIC_`).
- `src/app/api/fhir/[...path]` — BFF FHIR passthrough (session-guarded, audited).
- `src/app/api/auth/{login,callback,logout,session}` — real SMART flow.
- `src/lib/fhir/{validate,operationOutcome}` + `src/components/fhir/OperationOutcomeView.tsx`.
- `tests/**` + `vitest.config.ts` — the validation harness.
- `tools/seed/maria.bundle.json` + `load-maria.mjs` — F-7 seed.

## Open SPIKEs (unchanged from blueprint)
1. `rule-engine` coverage completeness (CRD).
2. `file-service` / webhook auth posture.
3. Full scope of `workflowMachine.tsx`.
4. Whether the "full SMART implementation" referenced in `smartAuth.ts` exists elsewhere to reuse.
5. State-lib consolidation (Redux + Zustand) — deferred to F-2b.
