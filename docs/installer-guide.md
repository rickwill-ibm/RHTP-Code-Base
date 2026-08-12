# RHTP Platform — Installer & Configuration Assistant Guide

The browser-based installer wizard is the recommended way to set up the RHTP
platform on a new machine. It handles prerequisite checking, component
selection, environment configuration, and launch — all from a single web page.

---

## Starting the wizard

**Windows — double-click:**

```
install.bat
```

**PowerShell:**

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

Both methods start a local web server and automatically open
**http://localhost:9999** in your default browser.
The only hard requirement before running is **Node.js LTS** (≥ 18).
If it is missing, the launcher opens https://nodejs.org and exits.

---

## Wizard screens

### Screen 1 · Mode

Choose how the platform will run:

| Mode | When to use |
|------|-------------|
| **Demo** | Presentations and evaluations. Everything runs on mock data — no Docker, no API keys, ready in under 5 minutes. |
| **Production** | State deployment with a live FHIR backbone, real LLM policy extraction, and WSO2 CMS-0057-F integration. Requires Docker and additional credentials. |

Click **Next: Select Components →** when done.

---

### Screen 2 · Components

Select which parts of the platform to install.

| Component | Port | What it includes |
|-----------|------|-----------------|
| **RHTP Clinical Platform** | 4029 | All 40+ clinical screens, 8 demo personas, population health, care management, SDOH, financial dashboard |
| **CMS-0057-F Mandates** | 4029 | Patient Access · Provider Access · Payer-to-Payer · Prior Authorization (CRD→DTR→PAS) |
| **Golden Thread / RCM** | 4029 | Four-stage financial clearance: Eligibility · Med-Necessity · PA · Patient Estimation |
| **PA Standalone SmartApp** | 4032 | Separate SMART on FHIR app for CRD · DTR · PAS with Docker policy engine |

**Presets** at the top of the screen let you apply a known-good combination
in one click:

- **Full Demo** — all four components, Demo mode
- **Core Only** — RHTP Clinical Platform only
- **CMS Compliance** — RHTP + CMS-0057-F + Golden Thread
- **PA Developer** — PA Standalone SmartApp only

You can adjust individual checkboxes after applying a preset.

Click **Next: Configure →** when done.

---

### Screen 3 · Configure

Configuration fields are shown per selected component.

**Demo mode** — all fields are auto-configured. No input required. The screen
will show a single "Auto-configured for demo mode" notice per component.

**Production mode** — the following sections appear:

#### CMS-0057-F / WSO2 Integration

These fields connect RHTP to the separately-deployed
[WSO2 CMS-0057-F reference implementation](https://github.com/wso2/reference-implementation-cms0057f):

| Field | What to enter |
|-------|--------------|
| FHIR Gateway Base URL | WSO2 APIM FHIR endpoint, e.g. `https://localhost:8243/fhir/r4` |
| CDS Hooks Gateway Base URL | WSO2 APIM CDS endpoint, e.g. `https://localhost:8243/cds` |
| Bulk Export Gateway URL | WSO2 APIM bulk endpoint, e.g. `https://localhost:8243/bulk` |
| WSO2 IS Authorize URL | OAuth2 authorize endpoint from WSO2 Identity Server |
| WSO2 IS Token URL | OAuth2 token endpoint from WSO2 Identity Server |
| APIM OAuth Client ID | Application client ID from the APIM Developer Portal |
| APIM OAuth Client Secret | Application client secret (masked input) |

All WSO2 fields are required for live CMS-0057-F operation. Leave them
blank in Demo mode — the app uses dev stubs automatically.

#### LLM Configuration (Policy Engine)

Appears when Golden Thread or PA Standalone is selected in Production mode.
Controls live policy extraction from payer PDFs.

| Provider | How to get a key |
|----------|-----------------|
| **Groq** (recommended, free) | https://console.groq.com/keys — no credit card |
| **OpenAI GPT-4o** | https://platform.openai.com — billing account required |

Select a provider, then paste your API key into the field. Without a key
the platform uses pre-seeded policies only — all demo scenarios still work.

Click **Next: Check Prerequisites →** when done.

---

### Screen 4 · Prerequisite Check

The wizard probes your machine automatically when this screen loads.

| Check | What it means if it fails |
|-------|--------------------------|
| **Node.js ≥ 18** | Required for all components. Download from https://nodejs.org |
| **npm ≥ 9** | Installed alongside Node.js — reinstall Node if missing |
| **Docker Desktop ≥ 20** | Required for Production mode and PA Standalone. Download from https://docker.com/products/docker-desktop |
| **Docker Compose v2** | Included with Docker Desktop ≥ 3.x — update Docker if missing |
| **Port 4029 / 4032** | Shows "In use — will attempt to free before starting" if another process is already listening. The installer frees the port automatically. |

Fix any **error** (red ✗) items before proceeding. **Warning** (yellow !)
items are non-blocking.

The **Install Now →** button is disabled until all required checks pass.

---

### Screen 5 · Install Progress

Each selected component runs as a separate installation step. Click any
step header to expand its log output.

- ⏳ — step is running
- ✅ — step completed successfully
- ❌ — step failed (expand the log for the error detail)

When all steps finish, a **Launch** panel appears with direct links to
every installed screen organised by component.

---

## Quick-launch (skip the wizard)

Once the platform has been configured once, you can start it immediately
without going through the wizard:

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1 --quick-launch
```

This reads the existing `.env.local` and starts the RHTP app directly.

---

## Stopping all services

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1 --stop
```

Kills processes on ports 4029 and 4032 and brings down any running
Docker backbone containers.

---

## Manual setup (no wizard)

If you prefer the command line:

```bash
# Demo mode — simplest path
npm install
npm run dev          # opens at http://localhost:4029

# PA Standalone (separate app)
cd PA-Standalone-SmartApp
npm install
npm run dev          # opens at http://localhost:4032
```

See the main [README](../README.md) for Tier A+ (local FHIR backbone)
and Tier B (live WSO2 production) setup instructions.
