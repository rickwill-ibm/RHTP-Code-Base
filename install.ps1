<#
.SYNOPSIS
  RHTP Platform Installer — master entry point (Windows / PowerShell).
  Opens a browser-based wizard at http://localhost:9999.
  Run:  powershell -ExecutionPolicy Bypass -File install.ps1

  Flags:
    --quick-launch   Skip wizard; start last configured mode instantly
    --stop           Stop all running RHTP services (dev servers + Docker)
    --port <n>       Wizard port (default 9999)
#>

[CmdletBinding()]
param(
  [switch] $QuickLaunch,
  [switch] $Stop,
  [int]    $Port = 9999
)

$ErrorActionPreference = 'Stop'
$InstallerDir = Join-Path $PSScriptRoot 'installer'
$RootDir      = $PSScriptRoot

# ── Dot-source library modules ───────────────────────────────────────────────
. "$InstallerDir\lib\prereqs.ps1"
. "$InstallerDir\lib\env-writer.ps1"
# http-server.ps1 is superseded by installer/lib/http-server.js (Node.js)

# ── --stop flag: kill running services ───────────────────────────────────────
if ($Stop) {
  Write-Host "Stopping RHTP services..." -ForegroundColor Yellow
  Stop-RhtpServices
  exit 0
}

# ── --quick-launch flag: start without wizard ────────────────────────────────
if ($QuickLaunch) {
  $envFile = Join-Path $RootDir '.env.local'
  if (-not (Test-Path $envFile)) {
    Write-Host "No .env.local found. Run install.ps1 without --quick-launch first." -ForegroundColor Red
    exit 1
  }
  Write-Host "Quick launch: starting RHTP on port 4029..." -ForegroundColor Cyan
  Start-RhtpServer $RootDir
  Start-Sleep 12
  Start-Process 'http://localhost:4029'
  exit 0
}

# ── Normal flow: show banner + start wizard ───────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   RHTP / TCOC Platform Installer                ║" -ForegroundColor Cyan
Write-Host "  ║   Rural Health Transformation Program           ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Hard prereqs: Node.js and npm must exist before wizard can run ────────────
Write-Host "  Checking minimum requirements..." -NoNewline
$node = Get-Command node -ErrorAction SilentlyContinue
$npm  = Get-Command npm  -ErrorAction SilentlyContinue

if (-not $node) {
  Write-Host " FAILED" -ForegroundColor Red
  Write-Host ""
  Write-Host "  Node.js is required to run the installer." -ForegroundColor Yellow
  Write-Host "  Download the LTS version from: https://nodejs.org/" -ForegroundColor Yellow
  Write-Host ""
  Read-Host "  Press Enter to open the download page, then re-run this script"
  Start-Process 'https://nodejs.org/'
  exit 1
}
if (-not $npm) {
  Write-Host " FAILED" -ForegroundColor Red
  Write-Host "  npm not found. Reinstall Node.js from https://nodejs.org/" -ForegroundColor Yellow
  exit 1
}

$nodeVer = & node --version
Write-Host " OK (Node $nodeVer)" -ForegroundColor Green

# ── Free wizard port if in use ────────────────────────────────────────────────
$portInUse = (Test-NetConnection -ComputerName 127.0.0.1 -Port $Port `
  -WarningAction SilentlyContinue -ErrorAction SilentlyContinue).TcpTestSucceeded
if ($portInUse) {
  Write-Host "  Port $Port in use — attempting to free it..." -NoNewline
  Stop-PortProcess $Port
  Start-Sleep 1
  Write-Host " done" -ForegroundColor Green
}

# ── Start wizard server (Node.js HTTP server) ─────────────────────────────────
Write-Host ""
Write-Host "  Starting installer wizard..." -ForegroundColor Cyan
Write-Host "  Opening http://localhost:$Port in your browser." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Complete the wizard in your browser, then return here to watch progress." -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop the installer at any time." -ForegroundColor Gray
Write-Host ""

$env:INSTALLER_PORT = $Port
& node "$InstallerDir\lib\http-server.js"

# ── Helper functions ──────────────────────────────────────────────────────────

function Start-RhtpServer {
  param([string] $Dir)
  Start-Process cmd -ArgumentList '/k', "cd /d `"$Dir`" && npm run dev" -WorkingDirectory $Dir
}

function Stop-RhtpServices {
  # Kill all RHTP ports: 4029 (RHTP), 4032 (PA standalone), 9999 (installer wizard)
  foreach ($port in @(4029, 4032, 9999)) {
    $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
      try { Stop-Process -Id $pid -Force; Write-Host "  Stopped PID $pid (port $port)" -ForegroundColor Green } catch {}
    }
    if (-not $pids) { Write-Host "  Port $port not in use" -ForegroundColor Gray }
  }
  # Stop Docker backbone if running
  $composeFile = Join-Path $PSScriptRoot 'install\docker-compose.backbone.yml'
  if (Test-Path $composeFile) {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
      Write-Host "  Stopping Docker backbone..." -NoNewline
      Start-Process docker -ArgumentList 'compose','-f',$composeFile,'down' -NoNewWindow -Wait
      Write-Host " done" -ForegroundColor Green
    }
  }
  Write-Host ""
  Write-Host "  All RHTP services stopped." -ForegroundColor Green
  Write-Host "  To restart: double-click start-demo.bat" -ForegroundColor Gray
}

function Stop-PortProcess {
  param([int] $TargetPort)
  $pids = Get-NetTCPConnection -LocalPort $TargetPort -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($pid in $pids) {
    try { Stop-Process -Id $pid -Force } catch {}
  }
}
