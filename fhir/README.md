# FHIR Server Setup & Patient Migration

This directory contains everything needed to run a local **HAPI FHIR R4** server
and migrate all TCOC patient data into it.

---

## Quick Start

### 1 — Start the HAPI FHIR server

Requires **Docker** (Docker Desktop or equivalent).

```bash
docker compose -f fhir/docker-compose.yml up -d
```

The server starts on **http://localhost:8080**.  
The FHIR R4 base URL is **http://localhost:8080/fhir**.  
The HAPI web UI is available at **http://localhost:8080/**.

Wait ~60 seconds for the first startup. Check health:

```bash
curl -s http://localhost:8080/fhir/metadata | head -20
```

---

### 2 — Migrate all patients

Requires **Node.js 18+** (uses native `fetch`).

```bash
node fhir/migrate-patients.mjs
```

Expected output:
```
╔══════════════════════════════════════════════════════════╗
║   TCOC → HAPI FHIR R4  Patient Migration                ║
╚══════════════════════════════════════════════════════════╝
FHIR base URL : http://localhost:8080/fhir
Patients      : 5

⏳  Waiting for HAPI FHIR server at http://localhost:8080/fhir …
✅  Server is ready.

  → Maria Redhawk         (MARIA_SD_001) … ✅  9 resources
  → Dorothy Simmons       (PAT-0042)     … ✅  8 resources
  → James Wilson          (PAT-0087)     … ✅  8 resources
  → Robert Chen           (PAT-0103)     … ✅  7 resources
  → Lisa Thompson         (PAT-0156)     … ✅  8 resources

─────────────────────────────────────────────────
  Migrated : 5 / 5 patients

  View patients : http://localhost:8080/fhir/Patient?_count=20
  HAPI web UI   : http://localhost:8080
```

To point at a different FHIR server:
```bash
node fhir/migrate-patients.mjs --fhir-url https://my-fhir-server.example.com/fhir
```

---

### 3 — Switch the app to live FHIR mode

In `.env.local`, change:

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_FHIR_BASE_URL=http://localhost:8080/fhir
```

Then restart the dev server:

```bash
npm run dev
```

The app will now read patient data from HAPI FHIR instead of the mock registry.  
If the FHIR server is unreachable, `patientContext` logs a warning and falls back to mock data.

---

## What gets migrated

Each patient in `src/lib/patientRegistry.ts` produces the following **FHIR R4 resources**:

| Resource | Description |
|---|---|
| `Patient` | Demographics, identifiers, TCOC extensions (RAF score, risk tier, PMPM, etc.) |
| `Observation` (×N) | One per care gap — domain, status, days open |
| `Flag` (×N) | One per CDS alert card — indicator level + summary/detail |
| `RiskAssessment` | RAF score, ER risk %, HCC suspect count & value |

### TCOC Extension URLs

All custom fields are stored as FHIR extensions under:
```
http://tcoc.example.org/fhir/StructureDefinition/<name>
```

Key extensions on `Patient`:

| Extension name | Type | Example |
|---|---|---|
| `raf-score` | `valueDecimal` | `2.18` |
| `risk-tier` | `valueString` | `"Moderate"` |
| `er-risk-pct` | `valueInteger` | `42` |
| `care-manager` | `valueString` | `"Sarah Johnson"` |
| `episode-type` | `valueString` | `"Postpartum Health"` |
| `pmpm` | `valueDecimal` | `1240` |
| `pmpm-target` | `valueDecimal` | `780` |
| `contract` | `valueString` | `"SD Medicaid"` |

---

## Architecture

```
src/lib/services/
  fhirClient.ts           Real FHIR R4 HTTP client (fetch-based)
  fhirResourceMappers.ts  Maps FHIR R4 resources → RegistryPatient

src/lib/patientContext.tsx
  PatientContextProvider  Loads from FHIR when USE_MOCK_DATA=false

fhir/
  docker-compose.yml      HAPI FHIR server (Docker)
  migrate-patients.mjs    Migration script (Node.js)
```

### Data flow (live mode)

```
HAPI FHIR R4  ──fetch──▶  fhirClient.getRegistryPatient()
                               │
                    fhirResourceMappers.ts
                               │
                          RegistryPatient
                               │
                    patientContext.tsx  (setPatient)
                               │
                        React components
```

---

## Stopping the server

```bash
docker compose -f fhir/docker-compose.yml down
```

Data is persisted in the `hapi-data` Docker volume and survives restarts.  
To wipe data: `docker compose -f fhir/docker-compose.yml down -v`

---

## Production considerations

The included `docker-compose.yml` uses an **in-memory H2 database** suitable for
local dev and demos. For production, replace the `spring.datasource.*` environment
variables with a persistent PostgreSQL connection:

```yaml
environment:
  spring.datasource.url: jdbc:postgresql://db:5432/hapi
  spring.datasource.username: hapi
  spring.datasource.password: secret
  spring.datasource.driverClassName: org.postgresql.Driver
```

You should also add:
- TLS termination (nginx / load balancer)
- SMART on FHIR authentication (`hapi.fhir.oauth_uri`)
- CORS restriction to your domain only
- Audit logging
