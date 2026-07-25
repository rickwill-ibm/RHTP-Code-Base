# Integrated install (Tier A) for Windows PowerShell.
# One command to a running RHTP against a real FHIR data tier.
#   Usage:  powershell -ExecutionPolicy Bypass -File install\install.ps1
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
Write-Host '   FHIR:  http://localhost:8090/fhir/Patient/MARIA_SD_001'
Write-Host "   Next:  npm run dev  ->  http://localhost:4029/cms  ->  Sign in (dev)  ->  Patient Access"
