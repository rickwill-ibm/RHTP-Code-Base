<#
.SYNOPSIS
  Embedded HTTP server for the installer wizard.
  Serves wizard.html on :9999 and handles:
    GET  /                 → wizard.html
    GET  /data/<file>      → installer/data/*.json
    POST /api/config       → validate + save config, return job token
    GET  /api/run/<token>  → SSE stream of install progress
    GET  /api/status       → current running service status
  One responsibility: HTTP transport only. Business logic lives in steps/*.ps1.
#>

$script:Jobs   = @{}   # token → job hashtable
$script:Config = $null # last saved wizard config

function Start-InstallerServer {
  param(
    [string] $InstallerDir,
    [int]    $Port = 9999
  )

  $listener = [System.Net.HttpListener]::new()
  $listener.Prefixes.Add("http://localhost:$Port/")
  $listener.Start()
  Write-Host "  Installer running at http://localhost:$Port" -ForegroundColor Cyan

  # Open browser after short delay
  Start-Job -ScriptBlock { Start-Sleep 1; Start-Process "http://localhost:$using:Port" } | Out-Null

  try {
    while ($listener.IsListening) {
      $ctx = $listener.GetContext()
      Handle-Request $ctx $InstallerDir
    }
  } finally {
    $listener.Stop()
  }
}

function Handle-Request {
  param($Ctx, [string] $InstallerDir)

  $req  = $Ctx.Request
  $resp = $Ctx.Response
  $path = $req.Url.LocalPath

  try {
    switch -Regex ($path) {
      '^/$'                  { Serve-File $resp "$InstallerDir\wizard.html" 'text/html' }
      '^/data/(.+\.json)$'  { Serve-File $resp "$InstallerDir\data\$($Matches[1])" 'application/json' }
      '^/api/config$'        { Handle-Config $req $resp $InstallerDir }
      '^/api/run/(.+)$'      { Handle-Run $resp $Matches[1] $InstallerDir }
      '^/api/status$'        { Handle-Status $resp }
      default                { Send-Json $resp 404 @{ error = "Not found: $path" } }
    }
  } catch {
    try { Send-Json $resp 500 @{ error = $_.Exception.Message } } catch {}
  }
}

function Handle-Config {
  param($Req, $Resp, [string] $InstallerDir)

  $body   = Read-Body $Req | ConvertFrom-Json -AsHashtable
  $token  = [System.Guid]::NewGuid().ToString('N')
  $script:Config = $body
  $script:Jobs[$token] = @{ status = 'pending'; log = [System.Collections.ArrayList]::new() }
  Send-Json $Resp 200 @{ token = $token }
}

function Handle-Run {
  param($Resp, [string] $Token, [string] $InstallerDir)

  $job = $script:Jobs[$Token]
  if (-not $job) { Send-Json $Resp 404 @{ error = 'Unknown token' }; return }

  # SSE headers
  $Resp.ContentType     = 'text/event-stream'
  $Resp.Headers.Add('Cache-Control', 'no-cache')
  $Resp.Headers.Add('Connection',    'keep-alive')
  $Resp.SendChunked = $true
  $writer = [System.IO.StreamWriter]::new($Resp.OutputStream)

  $cfg = $script:Config
  $steps = Get-InstallSteps $cfg $InstallerDir

  foreach ($step in $steps) {
    Write-Sse $writer "step-start" @{ id = $step.id; label = $step.label }
    try {
      & $step.script $cfg $InstallerDir | ForEach-Object {
        Write-Sse $writer "log" @{ id = $step.id; line = $_ }
      }
      Write-Sse $writer "step-done" @{ id = $step.id; status = 'ok' }
    } catch {
      Write-Sse $writer "step-done" @{ id = $step.id; status = 'error'; error = $_.Exception.Message }
    }
  }

  Write-Sse $writer "done" @{ status = 'complete' }
  $writer.Flush()
  $Resp.OutputStream.Close()
}

function Handle-Status {
  param($Resp)

  $status = @{
    ports = @{}
  }
  foreach ($port in @(4029, 4032, 8080, 8081, 8082, 8083, 8090)) {
    $open = (Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue).TcpTestSucceeded
    $status.ports["$port"] = $open ? 'running' : 'stopped'
  }
  Send-Json $Resp 200 $status
}

# ── Transport helpers ────────────────────────────────────────────────────────

function Serve-File {
  param($Resp, [string] $Path, [string] $ContentType)
  if (-not (Test-Path $Path)) { Send-Json $Resp 404 @{ error = "File not found: $Path" }; return }
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $Resp.ContentType   = $ContentType
  $Resp.ContentLength64 = $bytes.Length
  $Resp.OutputStream.Write($bytes, 0, $bytes.Length)
  $Resp.OutputStream.Close()
}

function Send-Json {
  param($Resp, [int] $Code, $Body)
  $json  = $Body | ConvertTo-Json -Depth 10 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $Resp.StatusCode      = $Code
  $Resp.ContentType     = 'application/json'
  $Resp.ContentLength64 = $bytes.Length
  $Resp.OutputStream.Write($bytes, 0, $bytes.Length)
  $Resp.OutputStream.Close()
}

function Write-Sse {
  param($Writer, [string] $Event, $Data)
  $json = $Data | ConvertTo-Json -Depth 5 -Compress
  $Writer.Write("event: $Event`ndata: $json`n`n")
  $Writer.Flush()
}

function Read-Body {
  param($Req)
  $reader = [System.IO.StreamReader]::new($Req.InputStream)
  return $reader.ReadToEnd()
}

function Get-InstallSteps {
  param([hashtable] $Config, [string] $InstallerDir)
  $steps = [System.Collections.ArrayList]::new()
  $comps = $Config.components
  $mode  = $Config.mode
  $stepsDir = "$InstallerDir\steps"

  if ($comps -contains 'rhtp')          { $steps.Add(@{ id='rhtp';          label='RHTP Clinical Platform';    script={ param($c,$d) & "$d\steps\rhtp.ps1"          $c $d } }) | Out-Null }
  if ($comps -contains 'cms')           { $steps.Add(@{ id='cms';           label='CMS Mandates';              script={ param($c,$d) & "$d\steps\cms.ps1"           $c $d } }) | Out-Null }
  if ($comps -contains 'golden-thread') { $steps.Add(@{ id='golden-thread'; label='Golden Thread / RCM';       script={ param($c,$d) & "$d\steps\golden-thread.ps1" $c $d } }) | Out-Null }
  if ($comps -contains 'pa-standalone') { $steps.Add(@{ id='pa-standalone'; label='PA Standalone SmartApp';    script={ param($c,$d) & "$d\steps\pa-standalone.ps1" $c $d } }) | Out-Null }
  return $steps
}
