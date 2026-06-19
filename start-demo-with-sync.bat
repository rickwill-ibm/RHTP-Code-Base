@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   TCOC Demo Startup with Auto-Sync
echo ========================================
echo.

REM Get the project directory (where this script is located)
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

REM Start the auto-sync script in a new window
echo [1/3] Starting auto-sync with GitHub...
start "Auto-Sync GitHub" cmd /k "cd /d "%PROJECT_DIR%" && auto-sync-github.bat"
timeout /t 2 /nobreak >nul
echo     ✓ Auto-sync running in separate window
echo.

REM Start the Next.js development server
echo [2/3] Starting Next.js development server...
start "TCOC Dev Server" cmd /k "cd /d "%PROJECT_DIR%" && npm run dev"
echo     ✓ Dev server starting...
echo.

REM Wait for the server to be ready (usually takes 5-10 seconds)
echo [3/3] Waiting for server to be ready...
timeout /t 8 /nobreak >nul

REM Open the browser
echo     ✓ Opening browser...
start http://localhost:4028
echo.

echo ========================================
echo   All systems running!
echo ========================================
echo.
echo You now have:
echo   - Auto-sync running (commits and pushes every 5 seconds)
echo   - Dev server running at http://localhost:4028
echo   - Browser opened to your demo
echo.
echo To stop everything:
echo   - Close the "Auto-Sync GitHub" window
echo   - Close the "TCOC Dev Server" window
echo   - Or press Ctrl+C in each window
echo.
echo Press any key to close this window...
pause >nul

@REM Made with Bob
