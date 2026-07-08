@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   TCOC Demo Startup with Auto-Sync
echo ========================================
echo.
echo Repository: https://github.com/rickwill-ibm/RHTP-Code-Base
echo App URL:    http://localhost:4029
echo.

REM Get the project directory (where this script is located)
REM Works on any machine regardless of where the repo is cloned
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

REM Check if node_modules exists and install if needed
if not exist "%PROJECT_DIR%\node_modules" (
    echo [0/3] node_modules not found - running npm install first...
    cd /d "%PROJECT_DIR%"
    call npm install
    echo     ✓ Dependencies installed
    echo.
)

REM Start the auto-sync script in a new window
echo [1/3] Starting auto-sync with GitHub...
start "TCOC Auto-Sync" cmd /k "cd /d "%PROJECT_DIR%" && auto-sync-github.bat"
timeout /t 2 /nobreak >nul
echo     ✓ Auto-sync running in separate window
echo.

REM Start the Next.js development server
echo [2/3] Starting Next.js development server...
start "TCOC Dev Server" cmd /k "cd /d "%PROJECT_DIR%" && npm run dev"
echo     ✓ Dev server starting...
echo.

REM Wait for the server to be ready
echo [3/3] Waiting for server to be ready...
timeout /t 10 /nobreak >nul

REM Open the browser
echo     ✓ Opening browser...
start http://localhost:4029
echo.

echo ========================================
echo   All systems running!
echo ========================================
echo.
echo You now have:
echo   - Auto-sync: pulls + pushes every 5 seconds  (TCOC Auto-Sync window)
echo   - Dev server running at http://localhost:4029 (TCOC Dev Server window)
echo   - Browser opened to the demo
echo.
echo To stop everything:
echo   - Close the "TCOC Auto-Sync" window
echo   - Close the "TCOC Dev Server" window
echo.
echo Press any key to close this window...
pause >nul

@REM Made with Bob
