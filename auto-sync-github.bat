@echo off
setlocal enabledelayedexpansion
REM Auto-Sync with GitHub - Bidirectional sync (push AND pull)
REM This script automatically pushes your changes and pulls others' changes

echo ========================================
echo   Auto-Sync with GitHub (Bidirectional)
echo ========================================
echo.
echo Monitoring: %CD%
echo Repository: https://github.com/rickwill-ibm/RHTP-Code-Base
echo.
echo This script will:
echo   - Pull changes from GitHub every 5 seconds
echo   - Push your changes to GitHub automatically
echo   - Keep you in sync with your team in real-time
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

:loop
REM First, pull any changes from GitHub
echo [%date% %time%] Checking for remote changes...
git fetch origin main

REM Check if there are remote changes
git diff --quiet HEAD origin/main
if errorlevel 1 (
    echo [%date% %time%] Remote changes detected! Pulling...
    git pull origin main --no-edit
    echo [%date% %time%] Pull completed - you now have the latest changes!
    echo.
)

REM Now check for local changes to push
git add -A

REM Check if there are any changes (staged or unstaged)
git diff-index --quiet --cached HEAD
if errorlevel 1 (
    echo [%date% %time%] Local changes detected! Committing and pushing...
    git commit -m "Auto-sync: %date% %time%"
    git push origin main
    echo [%date% %time%] Push completed - team can now see your changes!
    echo.
    goto :continue_loop
)

REM Check if there are already committed changes that need to be pushed
for /f %%i in ('git rev-list --count HEAD ^origin/main 2^>nul') do set AHEAD=%%i
if defined AHEAD (
    if not "!AHEAD!"=="0" (
        echo [%date% %time%] Found !AHEAD! unpushed commit(s)! Pushing...
        git push origin main
        echo [%date% %time%] Push completed - team can now see your changes!
        echo.
    )
)

:continue_loop

REM Wait 5 seconds before next sync
echo [%date% %time%] Monitoring... (next check in 5 seconds)
timeout /t 5 /nobreak >nul
goto loop

@REM Made with Bob
