<#
.SYNOPSIS
  PA Standalone SmartApp install steps.
  Reads config from $env:RHTP_INSTALL_CONFIG (JSON set by http-server.js).
  One responsibility: PA Standalone SmartApp only.
#>

$raw = $env:RHTP_INSTALL_CONFIG
if (-not $raw) { Write-Error "RHTP_INSTALL_CONFIG not set"; exit 1 }
$config       = $raw | ConvertFrom-Json
$mode         = $config.mode
$rootDir      = $PSScriptRoot | Split-Path | Split-Path
$installerDir = Join-Path $rootDir 'installer'
$paDir        = Join-Path $rootDir 'PA-Standalone-SmartApp'
$inputs       = @{}
if ($config.userInputs) { $config.userInputs.PSObject.Properties | ForEach-Object { $inputs[$_.Name] = $_.Value } }

. "$installerDir\lib\env-writer.ps1"

# ── Step 1: Write PA .env.local ───────────────────────────────────────────────
"Writing PA Standalone .env.local ($mode mode)..."
$vars    = Build-PaEnvVars "$installerDir\data" $mode $inputs
$envFile = Join-Path $paDir '.env.local'
Write-EnvFile $envFile $vars
"  PA .env.local written at $envFile"

# ── Step 2: npm install (PA app) ─────────────────────────────────────────────
$nextMod = Join-Path $paDir 'node_modules'
if (Test-Path $nextMod) {
  "  PA node_modules already present -- skipping npm install."
} else {
  "Running npm install for PA Standalone SmartApp..."
  $proc = Start-Process npm -ArgumentList 'install','--no-audit','--no-fund' `
    -NoNewWindow -PassThru -Wait -WorkingDirectory $paDir
  if ($proc.ExitCode -ne 0) { Write-Error "npm install failed in PA-Standalone-SmartApp"; exit 1 }
  "  PA npm install complete."
}

# ── Step 3: LLM key (production) ─────────────────────────────────────────────
if ($mode -eq 'production') {
  $provider = $inputs['LLM_PROVIDER']
  $key      = if ($inputs['GROQ_API_KEY']) { $inputs['GROQ_API_KEY'] } else { $inputs['OPENAI_API_KEY'] }
  if ($provider -and $key) {
    "LLM provider: $provider -- key already written to .env.local."
    "  The Policy Engine will use this key for policy extraction."
    "  Free option: Groq (gsk_ prefix) -- https://console.groq.com/keys"
  } else {
    "  INFO: No LLM key provided."
    "  Policy Engine will run in offline mode (pre-seeded policies only)."
    "  To enable live policy ingestion, add GROQ_API_KEY or OPENAI_API_KEY to"
    "  PA-Standalone-SmartApp/.env.local and restart the Policy Engine."
  }
}

# ── Step 4: Production -- Docker services ─────────────────────────────────────
if ($mode -eq 'production') {
  "Starting PA Docker services (payer FHIR :8082)..."
  $composeFile = Join-Path $paDir 'infra\docker-compose.yml'
  $proc = Start-Process docker `
    -ArgumentList 'compose','-f',$composeFile,'up','-d','hapi-fhir-payer' `
    -NoNewWindow -PassThru -Wait
  if ($proc.ExitCode -ne 0) { Write-Error "docker compose up (payer FHIR) failed"; exit 1 }
  "  Payer FHIR starting on :8082..."

  "Starting CDS Hooks + Policy Engine (--profile services)..."
  $proc = Start-Process docker `
    -ArgumentList 'compose','-f',$composeFile,'--profile','services','up','-d' `
    -NoNewWindow -PassThru -Wait
  if ($proc.ExitCode -ne 0) { "  WARNING: CDS/Policy Engine containers failed to start." }
  else { "  Services started." }

  "Seeding Rachel Green patient bundle..."
  $seedScript = Join-Path $paDir 'infra\seed\seed-all.mjs'
  $proc = Start-Process node -ArgumentList $seedScript -NoNewWindow -PassThru -Wait `
    -WorkingDirectory (Join-Path $paDir 'infra\seed')
  if ($proc.ExitCode -ne 0) { "  WARNING: Seed step reported an issue -- check manually." }
  else { "  Rachel Green seeded." }

  "Ingesting bariatric-surgery policy seed into Policy Engine..."
  Start-Sleep 3  # allow Policy Engine to start
  try {
    Invoke-RestMethod 'http://localhost:8083/ingest' -Method Post `
      -Body '{"policyId":"bariatric-surgery-cpt-43644"}' `
      -ContentType 'application/json' -TimeoutSec 15 | Out-Null
    "  Bariatric surgery policy seeded."
  } catch {
    "  WARNING: Policy seed failed (Policy Engine may still be starting)."
    "  Run manually: curl -X POST http://localhost:8083/ingest -d '{`"policyId`":`"bariatric-surgery-cpt-43644`"}'"
  }
} else {
  "Demo mode: mock FHIR server will start with the app (no Docker needed)."
}

# ── Step 5: Start PA dev server ──────────────────────────────────────────────
"Starting PA Standalone SmartApp on port 4032..."
Start-Process cmd -ArgumentList '/c','start cmd /k npm run dev' -WorkingDirectory $paDir
"  PA SmartApp starting at http://localhost:4032"
"  Launch URL: http://localhost:4032/launch?iss=http%3A%2F%2Flocalhost%3A8080%2Ffhir&launch=patient-rachel-green"
