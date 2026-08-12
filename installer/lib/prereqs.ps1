<#
.SYNOPSIS
  Prereq checker. Reads prereqs.json; returns structured results.
  One responsibility: check system prerequisites. No UI, no side effects.
#>

function Get-PrereqResults {
  param(
    [string]   $DataDir,
    [string[]] $Components,
    [string]   $Mode
  )

  $spec     = Get-Content "$DataDir\prereqs.json" -Raw | ConvertFrom-Json
  $results  = [System.Collections.Generic.List[hashtable]]::new()

  foreach ($p in $spec.prereqs) {
    # Skip if not relevant to selected components / mode
    if ($p.required -eq 'optional')    { continue }
    if ($p.required -eq 'production' -and $Mode -ne 'production') { continue }
    if ($p.components -and -not (Select-Overlap $p.components $Components)) { continue }

    $result = @{
      id       = $p.id
      label    = $p.label
      status   = 'unknown'
      version  = $null
      message  = $null
      fixUrl   = $p.PSObject.Properties['fixUrl']  ? $p.fixUrl  : $null
      fixText  = $p.PSObject.Properties['fixText'] ? $p.fixText : $null
    }

    try {
      $raw = Invoke-Expression $p.command 2>&1 | Select-Object -First 1
      if ($p.PSObject.Properties['versionPattern']) {
        $m = [regex]::Match($raw, $p.versionPattern)
        if ($m.Success) {
          $result.version = $m.Groups[1].Value
          if ($p.PSObject.Properties['minVersion']) {
            $result.status = (Compare-SemVer $result.version $p.minVersion) ? 'ok' : 'outdated'
            if ($result.status -eq 'outdated') {
              $result.message = "Found $($result.version), need >= $($p.minVersion)"
            }
          } else {
            $result.status = 'ok'
          }
        } else {
          $result.status  = 'missing'
          $result.message = "Could not parse version from: $raw"
        }
      } else {
        $result.status = $LASTEXITCODE -eq 0 ? 'ok' : 'missing'
      }
    } catch {
      $result.status  = 'missing'
      $result.message = $_.Exception.Message
    }

    $results.Add($result)
  }

  return $results
}

function Test-Ports {
  param(
    [string]   $DataDir,
    [string[]] $Components,
    [string]   $Mode
  )

  $spec    = Get-Content "$DataDir\prereqs.json" -Raw | ConvertFrom-Json
  $results = [System.Collections.Generic.List[hashtable]]::new()

  foreach ($p in $spec.ports) {
    if ($p.PSObject.Properties['components'] -and -not (Select-Overlap $p.components $Components)) { continue }
    if ($p.PSObject.Properties['mode']       -and $p.mode -ne $Mode) { continue }

    $inUse = (Test-NetConnection -ComputerName 127.0.0.1 -Port $p.port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue).TcpTestSucceeded

    $results.Add(@{
      port    = $p.port
      label   = $p.label
      status  = $inUse ? 'in-use' : 'free'
      message = $inUse ? "Port $($p.port) is already in use by another process" : $null
    })
  }

  return $results
}

# ── Helpers ──────────────────────────────────────────────────────────────────

function Select-Overlap {
  param([object[]] $A, [string[]] $B)
  foreach ($a in $A) { if ($B -contains $a) { return $true } }
  return $false
}

function Compare-SemVer {
  param([string] $Actual, [string] $Min)
  try {
    $a = [System.Version]::Parse($Actual)
    $b = [System.Version]::Parse($Min)
    return ($a -ge $b)
  } catch { return $true }
}
