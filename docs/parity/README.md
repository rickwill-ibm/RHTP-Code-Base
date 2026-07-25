# Parity gates — reference UI retirement (plan §12)

No reference demo UI is deleted until its native RHTP journey passes all 7 gates.
Track each provision here; check a box only with evidence.

| Gate | Patient Access | Provider Access | Payer-to-Payer | Prior Auth |
|---|---|---|---|---|
| 1. Functional parity | ☐ | ☐ | ☐ | ☐ |
| 2. Standards parity (conformance) | ☐ | ☐ | ☐ | ☐ |
| 3. Security parity | ☐ | ☐ | ☐ | ☐ |
| 4. Data parity | ☐ | ☐ | ☐ | ☐ |
| 5. Audit parity | ☐ | ☐ | ☐ | ☐ |
| 6. Performance parity | ☐ | ☐ | ☐ | ☐ |
| 7. UX improvement | ☐ | ☐ | ☐ | ☐ |
| Retire reference app | `demo-mediclaim-app` | `demo-ehr-app` | `member-portal`+`payer-admin` | `demo-ehr`+`demo-dtr`+`payer-admin` |

Gates 1/4/5 are exercisable now (offline + unit). Gates 2/3/6 require the live backbone (conformance test kits, pen-test, load test). Retirement PRs must link the passing rows here.
