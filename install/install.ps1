# ============================================================================
# RHTP install script — Windows PowerShell (Tier A)
#
# DEMO MODE (no Docker needed — recommended for first run):
#   npm install; npm run dev
#   All screens including CRD/DTR/PAS Prior Authorization run on mock data.
#   No FHIR server, no Docker, no Policy Engine required.
#
# TIER A (this script — integrated dev backbone):
#   powershell -ExecutionPolicy Bypass -File install\install.ps1
#   Starts FHIR + MySQL in Docker, seeds Maria, runs validation, starts dev.
#
# TIER B (full production — WSO2 + Ballerina):
#   See INTEGRATED_INSTALL.md. Set ALLOW_DEV_MOCK_AUTH=false.
# ============================================================================
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

Write-Host '==> Prereq check'
foreach ($t in @('node','npm','docker')) {
  if (-not (Get-Command $t -ErrorAction SilentlyContinue)) { throw "MISSING: $t" }
}

Write-Host '==> .env.local'
if (-not (Test-Path .env.local)) {
  Copy-Item install\.env.cms0057f.example .env.local
  Write-Host '   created .env.local from template (edit SESSION_SECRET before sharing)'
} else { Write-Host '   .env.local exists - leaving as-is' }

Write-Host '==> Backbone (FHIR + MySQL) up'
docker compose -f install\docker-compose.backbone.yml up -d

Write-Host '==> Waiting for FHIR to be healthy...'
$ready = $false
for ($i=0; $i -lt 40; $i++) {
  try { Invoke-WebRequest -UseBasicParsing http://localhost:8090/fhir/metadata -TimeoutSec 4 | Out-Null; $ready = $true; break } catch { Start-Sleep 3 }
}
if (-not $ready) { throw 'FHIR did not become ready' }
Write-Host '   FHIR ready'

Write-Host '==> Init MySQL schema (if reference scripts present)'
foreach ($f in @('demo-backends/wso2_payer_portal_bff/scripts/init_db.sql','bulk-export-client/scripts/init_db.sql')) {
  if (Test-Path $f) { Get-Content $f | docker exec -i rhtp-mysql mysql -uroot -prhtp cms0057f; Write-Host "   applied $f" }
}

Write-Host '==> Seed Maria into FHIR'
$env:FHIR_GATEWAY_BASE='http://localhost:8090/fhir'
node tools/seed/load-maria.mjs

Write-Host '==> npm install'
npm install --no-audit --no-fund

Write-Host '==> Validate (type-check + unit tests)'
npm run type-check
npm run test

Write-Host ''
Write-Host 'Integrated dev backbone is up.'
Write-Host '   FHIR:    http://localhost:8090/fhir/Patient/MARIA_SD_001'
Write-Host '   App:     npm run dev  ->  http://localhost:4029'
Write-Host ''
Write-Host '   Demo screens (all work with mock data - no Docker required):'
Write-Host '     /cms          -> CMS-0057-F hub'
Write-Host '     /prior-auth   -> Prior Authorization CRD.DTR.PAS (Maria CPT 72148 pre-loaded)'
Write-Host '     /contract-program-selection -> RHTP Overview (Step 1)'
Write-Host ''
Write-Host '   Sign in: http://localhost:4029/api/auth/login -> Sign in (dev)'
Write-Host ''
Write-Host '   DEMO MODE (no Docker): copy .env.example .env.local; npm run dev'
