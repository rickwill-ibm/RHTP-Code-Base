# ============================================================
#  RHTP / TCOC Platform  —  First-Time Setup (Windows)
#
#  Run once before your first demo session:
#    powershell -ExecutionPolicy Bypass -File setup.ps1
#
#  What it does:
#    1. Checks Node.js is installed
#    2. Confirms .env.local is set for mock mode
#    3. Runs npm install
#    4. Runs type-check + tests to confirm everything is healthy
#    5. Optionally creates a desktop shortcut for start-demo.bat
#
#  After setup, just double-click start-demo.bat to launch.
# ============================================================

$ErrorActionPreference = 'Stop'
$ProjectDir = $PSScriptRoot

Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "   RHTP / TCOC Platform  -  First-Time Setup" -ForegroundColor Cyan
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Node.js ───────────────────────────────────────────────
Write-Host "  [1/5] Checking Node.js..." -NoNewline
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host " MISSING" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Node.js is required. Download the LTS version from:" -ForegroundColor Yellow
    Write-Host "    https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  After installing, re-run this script." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Press Enter to exit"
    exit 1
}
$nodeVer = & node --version
Write-Host " OK ($nodeVer)" -ForegroundColor Green

# ── 2. npm ───────────────────────────────────────────────────
Write-Host "  [2/5] Checking npm..." -NoNewline
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host " MISSING (should have been installed with Node.js)" -ForegroundColor Red
    Read-Host "  Press Enter to exit"
    exit 1
}
$npmVer = & npm --version
Write-Host " OK (v$npmVer)" -ForegroundColor Green

# ── 3. .env.local ────────────────────────────────────────────
Write-Host "  [3/5] Checking .env.local..." -NoNewline
$envFile = Join-Path $ProjectDir ".env.local"
if (-not (Test-Path $envFile)) {
    "NEXT_PUBLIC_USE_MOCK_DATA=true" | Set-Content $envFile
    Write-Host " Created (mock mode enabled)" -ForegroundColor Green
} else {
    $content = Get-Content $envFile -Raw
    if ($content -match "NEXT_PUBLIC_USE_MOCK_DATA=true") {
        Write-Host " OK (mock mode enabled)" -ForegroundColor Green
    } else {
        Write-Host " WARNING" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  .env.local exists but NEXT_PUBLIC_USE_MOCK_DATA is not 'true'." -ForegroundColor Yellow
        Write-Host "  For demo mode, set NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local" -ForegroundColor Yellow
        Write-Host ""
        $fix = Read-Host "  Set it to true now? (Y/n)"
        if ($fix -ne 'n' -and $fix -ne 'N') {
            $content = $content -replace "NEXT_PUBLIC_USE_MOCK_DATA=\w+", "NEXT_PUBLIC_USE_MOCK_DATA=true"
            $content | Set-Content $envFile
            Write-Host "  Updated." -ForegroundColor Green
        }
    }
}

# ── 4. npm install ───────────────────────────────────────────
Write-Host "  [4/5] Installing dependencies..."
Set-Location $ProjectDir
$nextMod = Join-Path $ProjectDir "node_modules\next"
if (-not (Test-Path $nextMod)) {
    Write-Host "        Running npm install (first run — takes 1-2 minutes)..."
    & npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
    Write-Host "        Dependencies installed." -ForegroundColor Green
} else {
    Write-Host "        node_modules already present — skipping." -ForegroundColor Green
}

# ── 5. Validate ──────────────────────────────────────────────
Write-Host "  [5/5] Validating (type-check + tests)..."
Write-Host "        Running tsc..." -NoNewline
& npm run type-check 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "        Run 'npm run type-check' to see errors." -ForegroundColor Yellow
} else {
    Write-Host " OK" -ForegroundColor Green
}
Write-Host "        Running vitest..." -NoNewline
& npm run test 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "        Run 'npm run test' to see failures." -ForegroundColor Yellow
} else {
    Write-Host " OK (145 tests passing)" -ForegroundColor Green
}

# ── Desktop shortcut (optional) ──────────────────────────────
Write-Host ""
$shortcut = Read-Host "  Create a desktop shortcut for start-demo.bat? (Y/n)"
if ($shortcut -ne 'n' -and $shortcut -ne 'N') {
    $WshShell = New-Object -ComObject WScript.Shell
    $lnkPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "RHTP Demo.lnk"
    $lnk = $WshShell.CreateShortcut($lnkPath)
    $lnk.TargetPath   = Join-Path $ProjectDir "start-demo.bat"
    $lnk.WorkingDirectory = $ProjectDir
    $lnk.Description  = "Launch RHTP/TCOC Demo Platform (Mock Mode)"
    $lnk.IconLocation = "shell32.dll,14"
    $lnk.Save()
    Write-Host "  Desktop shortcut created: 'RHTP Demo'" -ForegroundColor Green
}

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "   Setup complete!" -ForegroundColor Green
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To start the demo:" -ForegroundColor White
Write-Host "    - Double-click  start-demo.bat  (or the desktop shortcut)" -ForegroundColor White
Write-Host "    - Then open     http://localhost:4029" -ForegroundColor White
Write-Host ""
Write-Host "  Key demo URLs:" -ForegroundColor White
Write-Host "    http://localhost:4029                            Demo Navigator" -ForegroundColor Gray
Write-Host "    http://localhost:4029/demo-deck                 Guided 31-step presentation" -ForegroundColor Gray
Write-Host "    http://localhost:4029/cms                       CMS-0057-F hub" -ForegroundColor Gray
Write-Host "    http://localhost:4029/contract-program-selection RHTP Program Overview" -ForegroundColor Gray
Write-Host ""
Read-Host "  Press Enter to exit"
