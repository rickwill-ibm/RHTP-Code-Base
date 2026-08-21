# Requirement → test traceability (plan §12 / blueprint §9)

A capability without a green test is "asserted, not verified" — never claim
compliance from it. Backbone-gated rows are verified once the stack is up.

| CMS-0057-F capability | Code | Test (offline) | Backbone-gated verification |
|---|---|---|---|
| Server-held SMART tokens (no browser exposure) | `lib/server/smartSession.ts` | — (integration) | real login round-trip |
| FHIR mediated via BFF | `app/api/fhir/[...path]`, `lib/server/fhirServer.ts` | — | 401-vs-200 + `test:contract` |
| FHIR structural pre-flight | `lib/fhir/validate.ts` | `tests/fhir/validate.test.ts` ✅ | Inferno/US-Core validators |
| PHI-safe audit | `lib/server/audit.ts` | `tests/server/audit.test.ts` ✅ | log review |
| Correlation IDs | `lib/server/correlation.ts` | `tests/server/correlation.test.ts` ✅ | cross-tier trace |
| Patient Access view models | `lib/fhir/viewModels.ts` | `tests/fhir/viewModels.test.ts` ✅ | live Patient/Coverage/ClaimResponse |
| Provider Access authorization basis | `lib/authz/guard.ts` | `tests/authz/guard.test.ts` ✅ | `$member-match` live |
| Payer-to-Payer async job + dedupe/idempotency | `lib/workflow/bulkJob.ts` | `tests/workflow/bulkJob.test.ts` ✅ | live bulk export |
| PA lifecycle + human gates | `lib/workflow/paMachine.ts` | `tests/workflow/paMachine.test.ts` ✅ | CRD/DTR/PAS end-to-end |
| DTR QuestionnaireResponse build | `lib/dtr/questionnaireResponse.ts` | `tests/dtr/questionnaireResponse.test.ts` ✅ | `$questionnaire-package` live |
| PAS submit is human-gated | `app/api/pas/submit/route.ts` | (route returns 202 w/o approver) | live `Claim/$submit` |
| Webhook authentication | `app/api/webhooks/claim-response/route.ts` | (secret check) | signature/mTLS |
| Feature-flag gating | `lib/flags/flags.ts` | `tests/flags/flags.test.ts` ✅ | — |
| Runtime config read/write (no restart) | `lib/runtimeConfig.ts` | — (integration; GET /api/config-status defaults when no file) | — |
| CMS-0057-F Postman env generation | `app/api/postman-environment/route.ts` | — (download smoke-tested manually) | Newman `test:contract` |
| CMS-0057-F Postman collection scope-filter | `app/api/postman-collection/route.ts` | — (download smoke-tested manually) | Newman `test:contract` |
| CMS-0057-F Newman SSE runner | `app/api/postman-run/route.ts` | — (SSE stream; requires Newman) | `npm run test:contract` |
| Postman Suite UI (configure/download/run) | `components/PostmanSuiteTab.tsx` + `app/api-explorer/page.tsx` | — (UI smoke) | — |
