<#
.SYNOPSIS
  CMS Mandates (CMS-0057-F) install steps.
  Reads config from $env:RHTP_INSTALL_CONFIG (JSON set by http-server.js).
  One responsibility: CMS-0057-F configuration only (no app start -- rhtp.ps1 does that).
#>

$raw = $env:RHTP_INSTALL_CONFIG
if (-not $raw) { Write-Error "RHTP_INSTALL_CONFIG not set"; exit 1 }
$config       = $raw | ConvertFrom-Json
$mode         = $config.mode
$rootDir      = $PSScriptRoot | Split-Path | Split-Path
$installerDir = Join-Path $rootDir 'installer'
$envFile      = Join-Path $rootDir '.env.local'
$inputs       = @{}
if ($config.userInputs) { $config.userInputs.PSObject.Properties | ForEach-Object { $inputs[$_.Name] = $_.Value } }

. "$installerDir\lib\env-writer.ps1"

# ── Step 1: Write CMS env vars (merged into .env.local) ──────────────────────
"Writing CMS-0057-F configuration ($mode mode)..."
$vars = Build-EnvVars "$installerDir\data" @('cms') $mode $inputs
Write-EnvFile $envFile $vars -Merge
$ss  = if ($vars['SESSION_SECRET'])        { $vars['SESSION_SECRET'].Substring(0,8)        + '...' } else { '(not set)' }
$whs = if ($vars['WEBHOOK_SHARED_SECRET']) { $vars['WEBHOOK_SHARED_SECRET'].Substring(0,8) + '...' } else { '(not set)' }
"  SESSION_SECRET        : $ss (auto-generated)"
"  WEBHOOK_SHARED_SECRET : $whs (auto-generated)"
"  ALLOW_DEV_MOCK_AUTH   : $($vars['ALLOW_DEV_MOCK_AUTH'])"

# ── Step 2: Production -- validate WSO2 connectivity ──────────────────────────
if ($mode -eq 'production') {
  "Validating WSO2 connectivity..."
  $endpoints = @{
    'FHIR gateway'    = $inputs['FHIR_GATEWAY_BASE']
    'CDS gateway'     = $inputs['CDS_GATEWAY_BASE']
    'WSO2 token URL'  = $inputs['WSO2_TOKEN_URL']
  }
  $allOk = $true
  foreach ($name in $endpoints.Keys) {
    $url = $endpoints[$name]
    if (-not $url) { "  SKIP $name (not configured)"; continue }
    try {
      Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
      "  OK   $name ($url)"
    } catch {
      "  WARN $name unreachable: $url"
      $allOk = $false
    }
  }
  if (-not $allOk) {
    "  WARNING: Some WSO2 endpoints unreachable."
    "  The app will start but live CMS-0057-F operations will fail."
    "  Update .env.local and restart once the backbone is up."
  } else {
    "  All WSO2 endpoints reachable."
  }
}

# ── Step 3: Verify feature flags written ─────────────────────────────────────
"Verifying feature flags..."
$written = Read-EnvFile $envFile
$flags   = @('NEXT_PUBLIC_FLAG_PATIENT_ACCESS','NEXT_PUBLIC_FLAG_PROVIDER_ACCESS',
             'NEXT_PUBLIC_FLAG_PAYER_TO_PAYER','NEXT_PUBLIC_FLAG_PRIOR_AUTH',
             'NEXT_PUBLIC_FLAG_GOLDEN_THREAD','NEXT_PUBLIC_FLAG_NETWORK_ADEQUACY')
foreach ($f in $flags) {
  $val = if ($written[$f]) { $written[$f] } else { 'NOT SET' }
  "  $f = $val"
}
"  CMS-0057-F configuration complete."
"  Entry point: http://localhost:4029/cms"
