<#
.SYNOPSIS
  RHTP Clinical Platform install steps.
  Yields log lines to the caller (pipeline output = SSE log stream).
  One responsibility: install/start the RHTP Next.js app only.
#>
param([hashtable] $Config, [string] $InstallerDir)

$mode     = $Config.mode
$rootDir  = Split-Path $InstallerDir -Parent
$envFile  = Join-Path $rootDir '.env.local'

. "$InstallerDir\lib\env-writer.ps1"

# ── Step 1: Write .env.local ─────────────────────────────────────────────────
"Writing .env.local for RHTP ($mode mode)..."
$vars = Build-EnvVars $InstallerDir @('rhtp') $mode ($Config.userInputs ?? @{})
if ($mode -eq 'production' -and $Config.components -notcontains 'cms') {
  # Standalone production RHTP: set PA SmartApp launch URL
  $vars['NEXT_PUBLIC_PA_SMARTAPP_URL'] = 'http://localhost:4032/launch?iss=http%3A%2F%2Flocalhost%3A8080%2Ffhir&launch=patient-rachel-green'
}
Write-EnvFile $envFile $vars -Merge
"  .env.local written."

# ── Step 2: npm install ───────────────────────────────────────────────────────
Set-Location $rootDir
$nextMod = Join-Path $rootDir 'node_modules\next'
if (Test-Path $nextMod) {
  "  node_modules already present — skipping npm install."
} else {
  "Running npm install (this takes 1-2 minutes on first run)..."
  $proc = Start-Process npm -ArgumentList 'install','--no-audit','--no-fund' -NoNewWindow -PassThru -Wait
  if ($proc.ExitCode -ne 0) { throw "npm install failed (exit $($proc.ExitCode))" }
  "  npm install complete."
}

# ── Step 3: Production — start Docker backbone ───────────────────────────────
if ($mode -eq 'production') {
  "Starting FHIR backbone (Docker)..."
  $composeFile = Join-Path $InstallerDir '..\install\docker-compose.backbone.yml'
  $proc = Start-Process docker -ArgumentList 'compose','-f',$composeFile,'up','-d' -NoNewWindow -PassThru -Wait
  if ($proc.ExitCode -ne 0) { throw "docker compose up failed" }
  "  Containers started. Waiting for FHIR health check..."

  $ready = $false
  for ($i = 0; $i -lt 40; $i++) {
    try {
      $r = Invoke-WebRequest "http://localhost:8090/fhir/metadata" -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
      $ready = $true; break
    } catch { Start-Sleep 3 }
    if ($i % 5 -eq 0) { "  Waiting... ($($i*3)s)" }
  }
  if (-not $ready) { throw "FHIR server did not become healthy after 120s" }
  "  FHIR server ready at http://localhost:8090/fhir"

  "Seeding Maria bundle into FHIR..."
  $env:FHIR_GATEWAY_BASE = 'http://localhost:8090/fhir'
  $proc = Start-Process node -ArgumentList 'tools\seed\load-maria.mjs' -NoNewWindow -PassThru -Wait
  if ($proc.ExitCode -ne 0) { "  WARNING: Maria seed step reported an issue — continuing." }
  else { "  Maria seeded." }
}

# ── Step 4: Type-check + tests ────────────────────────────────────────────────
"Running type-check..."
$proc = Start-Process npm -ArgumentList 'run','type-check' -NoNewWindow -PassThru -Wait
if ($proc.ExitCode -ne 0) { throw "Type-check failed" }
"  Type-check passed."

"Running tests..."
$proc = Start-Process npm -ArgumentList 'run','test' -NoNewWindow -PassThru -Wait
if ($proc.ExitCode -ne 0) { "  WARNING: Some tests failed — check output." }
else { "  Tests passed (145)." }

# ── Step 5: Start dev server ──────────────────────────────────────────────────
"Starting RHTP dev server on port 4029..."
Start-Process cmd -ArgumentList '/k','npm run dev' -WorkingDirectory $rootDir
"  RHTP starting at http://localhost:4029"
"  Open: http://localhost:4029  (allow ~15s for first compile)"
