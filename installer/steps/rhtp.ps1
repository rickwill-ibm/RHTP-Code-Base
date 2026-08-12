<#
.SYNOPSIS
  RHTP Clinical Platform install step.
  Reads config from $env:RHTP_INSTALL_CONFIG (JSON set by http-server.js).
  Writes .env.local, runs npm install if needed, starts the dev server.
  Outputs plain log lines to stdout for the SSE stream.
#>

# ── Read config ───────────────────────────────────────────────────────────────
$raw = $env:RHTP_INSTALL_CONFIG
if (-not $raw) { Write-Error "RHTP_INSTALL_CONFIG not set"; exit 1 }
$config     = $raw | ConvertFrom-Json
$mode       = $config.mode
$rootDir    = $PSScriptRoot | Split-Path | Split-Path   # installer/steps -> installer -> rhtpdemo
$installerDir = Join-Path $rootDir 'installer'
$envFile    = Join-Path $rootDir '.env.local'

. "$installerDir\lib\env-writer.ps1"

# ── Step 1: Write .env.local ──────────────────────────────────────────────────
"[1/3] Writing .env.local for RHTP ($mode mode)..."
$inputs = @{}
if ($config.userInputs) {
  $config.userInputs.PSObject.Properties | ForEach-Object { $inputs[$_.Name] = $_.Value }
}
$vars = Build-EnvVars "$installerDir\data" @('rhtp') $mode $inputs
Write-EnvFile $envFile $vars -Merge
"  .env.local written at $envFile"

# ── Step 2: npm install ───────────────────────────────────────────────────────
$nextMod = Join-Path $rootDir 'node_modules\next'
if (Test-Path $nextMod) {
  "[2/3] node_modules present -- skipping npm install."
} else {
  "[2/3] Running npm install (first run -- may take 1-2 minutes)..."
  $proc = Start-Process npm -ArgumentList 'install','--no-audit','--no-fund' `
    -NoNewWindow -PassThru -Wait -WorkingDirectory $rootDir
  if ($proc.ExitCode -ne 0) { Write-Error "npm install failed (exit $($proc.ExitCode))"; exit 1 }
  "  npm install complete."
}

# ── Step 3 (production only): Docker backbone ─────────────────────────────────
if ($mode -eq 'production') {
  "[3/3] Starting FHIR backbone (Docker)..."
  $composeFile = Join-Path $rootDir 'install\docker-compose.backbone.yml'
  if (-not (Test-Path $composeFile)) {
    "  WARNING: docker-compose.backbone.yml not found -- skipping Docker step."
  } else {
    $proc = Start-Process docker -ArgumentList 'compose','-f',$composeFile,'up','-d' `
      -NoNewWindow -PassThru -Wait
    if ($proc.ExitCode -ne 0) { Write-Error "docker compose up failed"; exit 1 }
    "  Containers started. Waiting for FHIR health check..."
    $ready = $false
    for ($i = 0; $i -lt 40; $i++) {
      try {
        Invoke-WebRequest "http://localhost:8090/fhir/metadata" -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop | Out-Null
        $ready = $true; break
      } catch { Start-Sleep 3 }
      if ($i -gt 0 -and $i % 5 -eq 0) { "  Still waiting... ($($i * 3)s elapsed)" }
    }
    if (-not $ready) { Write-Error "FHIR server did not become healthy after 120s"; exit 1 }
    "  FHIR server ready at http://localhost:8090/fhir"
    $env:FHIR_GATEWAY_BASE = 'http://localhost:8090/fhir'
    $seedProc = Start-Process node -ArgumentList 'tools\seed\load-maria.mjs' `
      -NoNewWindow -PassThru -Wait -WorkingDirectory $rootDir
    if ($seedProc.ExitCode -ne 0) { "  WARNING: Maria seed step reported an issue -- continuing." }
    else { "  Maria FHIR bundle seeded." }
  }
} else {
  "[3/3] Demo mode -- skipping Docker backbone."
}

# ── Step 4: Launch dev server ──────────────────────────────────────────────────
"Starting RHTP dev server on port 4029..."
Start-Process cmd -ArgumentList '/c','start cmd /k npm run dev' -WorkingDirectory $rootDir
"  RHTP starting at http://localhost:4029"
"  Allow ~15 seconds for the first Next.js compile, then open your browser."
"  Done."
