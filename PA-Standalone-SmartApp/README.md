# PA-Standalone-SmartApp

**Prior Authorization SMART on FHIR standalone application — CRD · DTR · PAS**  
Built on the Da Vinci implementation guides. CMS-0057-F compliant. Ready to integrate with RHTP.

---

## Overview

This is a fully self-contained Next.js 15 / React 19 / TypeScript SMART on FHIR application that implements the complete Prior Authorization workflow:

| Part | Standard | Screens |
|------|----------|---------|
| **I — CRD** | Da Vinci Coverage Requirements Discovery | Order & CRD Trigger → CRD Checklist |
| **II — DTR** | Da Vinci Documentation Templates & Rules | DTR Medical Necessity Tree |
| **III — PAS** | Da Vinci Prior Authorization Support | Review & Submit → PA Portal → Case Detail |
| **Ops** | Back-office queue | Worklist |

---

## Quick Start

```bash
cd PA-Standalone-SmartApp
npm install
cp .env.example .env.local   # uses MOCK data by default
npm run dev                   # http://localhost:4030
```

> Runs on **port 4030** — deliberately separate from the RHTP app on **:4029**.

---

## App Entry Points

| URL | Purpose |
|-----|---------|
| `http://localhost:4030/launch?iss=<fhirBase>&launch=<token>` | SMART App Launch entry (EHR redirects here) |
| `http://localhost:4030/app` | Post-OAuth redirect_uri / mock direct entry |
| `http://localhost:4030/` | Redirects to `/launch` |

---

## Project Structure

```
PA-Standalone-SmartApp/
├── src/
│   ├── app/
│   │   ├── layout.tsx           — Root layout, SmartProvider, Toaster
│   │   ├── page.tsx             — Root → /launch redirect
│   │   ├── launch/page.tsx      — SMART App Launch (OAuth step 1)
│   │   └── app/page.tsx         — Post-OAuth shell (OAuth step 2)
│   ├── components/
│   │   ├── shell/
│   │   │   └── AppShell.tsx     — Header, nav strip, view router
│   │   └── views/
│   │       ├── OrderView.tsx            — Step 1: Order entry + CRD trigger
│   │       ├── CrdChecklistView.tsx     — Step 2: CRD 5-check results
│   │       ├── DtrTreeView.tsx          — Step 3: DTR criteria tree + upload
│   │       ├── ReviewSubmitView.tsx     — Step 4: Review + channel + submit
│   │       ├── PaPortalView.tsx         — Step 5: Authorization case list
│   │       ├── CaseDetailView.tsx       — Step 6: Case lifecycle + evidence
│   │       └── WorklistView.tsx         — Step 7: Back-office batch queue
│   ├── lib/
│   │   ├── smart/
│   │   │   ├── SmartContext.tsx         — React context for SMART session
│   │   │   ├── smartLaunch.ts           — PKCE OAuth + token exchange
│   │   │   └── mockSmartContext.ts      — Dev mock
│   │   ├── fhir/
│   │   │   └── fhirClient.ts            — Typed FHIR R4 fetch client
│   │   ├── pa/
│   │   │   ├── pa-types.ts              — All domain types (CRD/DTR/PAS)
│   │   │   └── usePaStore.ts            — Zustand store (entire workflow state)
│   │   ├── crd/
│   │   │   ├── cdsHooksClient.ts        — CDS Hooks 2.0 fire + parse
│   │   │   └── crdService.ts            — Part I orchestration
│   │   ├── dtr/
│   │   │   └── dtrService.ts            — Part II DTR match + CQL stub
│   │   └── pas/
│   │       └── pasService.ts            — Part III Claim/$submit + EDI stub
│   └── styles/
│       └── globals.css
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_USE_MOCK_DATA` | `true` | Skip FHIR/CDS calls, use local mock data |
| `NEXT_PUBLIC_FHIR_BASE_URL` | `http://localhost:8080/fhir` | EMR FHIR endpoint |
| `NEXT_PUBLIC_SMART_CLIENT_ID` | `pa-smart-app` | OAuth client id |
| `NEXT_PUBLIC_SMART_REDIRECT_URI` | `http://localhost:4030/app` | OAuth redirect |
| `NEXT_PUBLIC_CDS_HOOKS_ENDPOINT` | `http://localhost:8080/cds-services` | CDS Hooks server |
| `NEXT_PUBLIC_PAYER_FHIR_BASE_URL` | `https://payer-fhir.example-payer.com/R4` | Payer FHIR endpoint |
| `NEXT_PUBLIC_ENABLE_EDI_FALLBACK` | `true` | Show EDI channel option |

---

## Mock vs Live Mode

### Mock mode (`NEXT_PUBLIC_USE_MOCK_DATA=true`)
- No FHIR server needed
- SMART auth is bypassed — mock patient context loaded automatically
- CRD runs a simulated 800ms delay and returns canned results
- DTR returns the bariatric-surgery scenario from the design spec
- PAS generates a fake PA number

### Live mode (`NEXT_PUBLIC_USE_MOCK_DATA=false`)
Requires:
1. HAPI FHIR server running at `NEXT_PUBLIC_FHIR_BASE_URL`
2. CDS Hooks service at `NEXT_PUBLIC_CDS_HOOKS_ENDPOINT`
3. EHR issuing a SMART launch with `?iss=<base>&launch=<token>`

---

## RHTP Integration Contract

When you are ready to integrate this app into the RHTP SMART app, the surface area is minimal:

### Option A — Deep-link (recommended for Phase 4a)
From RHTP, add a "Start PA" button that navigates to:
```
http://localhost:4030/launch?iss=<fhirBase>&launch=<launchToken>
```
The PA app runs in a separate tab or iframe. No code changes to RHTP required.

### Option B — In-app component import (Phase 4b+)
Move `PA-Standalone-SmartApp/src/` under `src/app/(cms0057f)/prior-auth/` in the RHTP monorepo.
The only wiring required is:
1. Pass the existing `SmartContext` from RHTP's auth provider instead of `PA-Standalone-SmartApp`'s own.
2. Replace the `usePaStore` initial `cases` seed with a FHIR query against the RHTP FHIR server.
3. Register `/prior-auth/launch` as an additional redirect URI in the EHR authorization server.

**Shared contracts that will NOT need to change between Option A and B:**
- `pa-types.ts` — all domain types
- `fhirClient.ts` — FHIR R4 client
- `crdService.ts`, `dtrService.ts`, `pasService.ts` — all service layer
- `usePaStore.ts` — all state management

---

## Standards Compliance

| Standard | Implementation |
|----------|---------------|
| SMART App Launch 2.0 | `smartLaunch.ts` — PKCE, `.well-known/smart-configuration` discovery |
| CDS Hooks 2.0 | `cdsHooksClient.ts` — `order-select` / `order-sign` hooks |
| Da Vinci CRD | `crdService.ts` — Coverage Information card parsing |
| Da Vinci DTR | `dtrService.ts` — `$questionnaire-package`, CQL execution stub |
| Da Vinci PAS | `pasService.ts` — `Claim/$submit`, EDI 275/278 stub |
| Da Vinci CDex | `DtrTreeView.tsx` — DocumentReference attachment upload |
| FHIR R4 | `fhirClient.ts` — `application/fhir+json` throughout |
| CMS-0057-F | Jan 1, 2027 deadline — all three Da Vinci IGs implemented |

---

## Scripts

```bash
npm run dev          # dev server :4030
npm run build        # production build
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run test         # Vitest unit tests
```

---

*Part of the RHTP Prior Authorization SaaS initiative. See `New PA Plan Documents/` for the full implementation plan.*
