<#
.SYNOPSIS
  Golden Thread / RCM install steps.
  Reads config from $env:RHTP_INSTALL_CONFIG (JSON set by http-server.js).
  One responsibility: Golden Thread configuration only.
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

# ── Step 1: Write LLM config (production only) ───────────────────────────────
if ($mode -eq 'production') {
  $provider = $inputs['LLM_PROVIDER']
  $key      = $inputs['GROQ_API_KEY'] ?? $inputs['OPENAI_API_KEY']

  if (-not $provider -or -not $key) {
    "  INFO: No LLM key provided."
    "  Golden Thread will run in deterministic/offline mode."
    "  To enable AI-assisted DTR generation, add GROQ_API_KEY or OPENAI_API_KEY to .env.local"
  } else {
    "Configuring LLM provider: $provider..."
    $vars = @{}
    if ($provider -eq 'groq')   { $vars['GROQ_API_KEY']   = $inputs['GROQ_API_KEY'] }
    if ($provider -eq 'openai') { $vars['OPENAI_API_KEY'] = $inputs['OPENAI_API_KEY'] }
    $vars['NEXT_PUBLIC_FLAG_AI_DTR'] = 'true'
    Write-EnvFile $envFile $vars -Merge

    # Validate key with a lightweight test call
    "  Validating $provider API key..."
    $ok = Test-LlmKey $provider $key
    if ($ok) { "  LLM key valid." }
    else {
      "  WARNING: LLM key validation failed."
      "  Check the key and retry. AI-DTR will fall back to deterministic mode."
      $vars['NEXT_PUBLIC_FLAG_AI_DTR'] = 'false'
      Write-EnvFile $envFile $vars -Merge
    }
  }
} else {
  "Demo mode: Golden Thread running offline (deterministic policy engine, seed data)."
  "  Policy seed: Aetna Cardiac CPBs + UHC PA lists (17 policies)"
  "  Evidence Record: in-memory store"
  "  AI-DTR: disabled (no LLM key needed)"
}

# ── Step 2: Verify policy seed is present ────────────────────────────────────
"Checking policy library seed..."
$seedFile = Join-Path $rootDir 'src\lib\policy\data\policy-library.seed.json'
if (Test-Path $seedFile) {
  $policies = (Get-Content $seedFile -Raw | ConvertFrom-Json).policies
  "  Policy seed: $($policies.Count) policies found."
} else {
  "  WARNING: policy-library.seed.json not found at expected path."
  "  Run: node tools/seed/parse_policies.py (requires Python 3)"
}

# ── Step 3: Confirm Golden Thread routes ─────────────────────────────────────
"Golden Thread configuration complete."
"  Financial Clearance: http://localhost:4029/financial-clearance"
"  Work Queue:          http://localhost:4029/work-queue"
"  Evidence Record:     http://localhost:4029/evidence"

# ── Helper ────────────────────────────────────────────────────────────────────
function Test-LlmKey {
  param([string] $Provider, [string] $Key)
  try {
    if ($Provider -eq 'groq') {
      $r = Invoke-WebRequest 'https://api.groq.com/openai/v1/models' `
        -Headers @{ Authorization = "Bearer $Key" } -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
      return $r.StatusCode -eq 200
    }
    if ($Provider -eq 'openai') {
      $r = Invoke-WebRequest 'https://api.openai.com/v1/models' `
        -Headers @{ Authorization = "Bearer $Key" } -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
      return $r.StatusCode -eq 200
    }
  } catch { return $false }
  return $false
}
