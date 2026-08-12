@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  RHTP Platform Installer — Windows launcher
REM  Double-click this file to start the setup wizard.
REM  No PowerShell knowledge required.
REM ============================================================

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
title RHTP Platform Installer

echo.
echo  ============================================================
echo   RHTP Platform Installer
echo   Rural Health Transformation Program / TCOC
echo  ============================================================
echo.

REM ── Check Node.js ─────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js is not installed.
    echo.
    echo  Please download and install Node.js LTS from:
    echo    https://nodejs.org/
    echo.
    echo  After installing, close this window and double-click install.bat again.
    echo.
    start https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>nul') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER%

REM ── Check npm ─────────────────────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo  ERROR: npm not found. Please reinstall Node.js.
    pause
    exit /b 1
)
echo  [OK] npm found

REM ── Check installer files present ─────────────────────────────────────────
if not exist "%ROOT%\installer\wizard.html" (
    echo  ERROR: installer\wizard.html not found.
    echo  Make sure you are running this from the rhtpdemo folder.
    pause
    exit /b 1
)
if not exist "%ROOT%\installer\lib\http-server.js" (
    echo  ERROR: installer\lib\http-server.js not found.
    echo  Pull the latest code: git pull origin main
    pause
    exit /b 1
)

REM ── Free port 9999 if in use ───────────────────────────────────────────────
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":9999 "') do (
    echo  Freeing port 9999 (PID %%a^)...
    taskkill /PID %%a /F >nul 2>&1
)

REM ── Start wizard server via Node ───────────────────────────────────────────
echo.
echo  [1/2] Starting installer wizard server...
start "RHTP Installer Server" /min cmd /c "cd /d "%ROOT%" && node installer\lib\http-server.js"

REM ── Wait for server then open browser ─────────────────────────────────────
echo  [2/2] Opening wizard in your browser...
timeout /t 3 /nobreak >nul
start http://localhost:9999

echo.
echo  ============================================================
echo   Installer wizard is running at http://localhost:9999
echo  ============================================================
echo.
echo   Complete the wizard in your browser.
echo   This window and the "RHTP Installer Server" window can be
echo   minimized — do not close them until installation finishes.
echo.
echo   To stop the installer: close the "RHTP Installer Server" window.
echo  ============================================================
echo.
pause
