@echo off
setlocal enabledelayedexpansion

REM ?? EDIT THIS LINE to match where you cloned the repo ?????????????????????
set "PROJECT_DIR=C:\Users\5J0601897\Desktop\BOB Project - 052926\tcoc"
REM ??????????????????????????????????????????????????????????????????????????

echo ========================================
echo   TCOC Demo Startup with Auto-Sync
echo ========================================
echo.
echo Project:    %PROJECT_DIR%
echo App URL:    http://localhost:4029
echo.

REM Verify the project folder exists
if not exist "%PROJECT_DIR%\package.json" (
    echo ERROR: Project not found at:
    echo   %PROJECT_DIR%
    echo.
    echo Edit this .bat file and update the PROJECT_DIR line at the top.
    echo.
    pause
    exit /b 1
)

REM Move into the project folder - everything runs from here
cd /d "%PROJECT_DIR%"

REM Install dependencies if missing
if not exist "%PROJECT_DIR%\node_modules" (
    echo [0/3] Installing dependencies...
    call npm install
    echo     Dependencies installed
    echo.
)

REM Start auto-sync in its own window
echo [1/3] Starting auto-sync with GitHub...
start "TCOC Auto-Sync" cmd /k "cd /d "%PROJECT_DIR%" ^&^& call auto-sync-github.bat"
timeout /t 2 /nobreak >nul
echo     Auto-sync running
echo.

REM Start Next.js dev server in its own window
echo [2/3] Starting Next.js dev server...
start "TCOC Dev Server" cmd /k "cd /d "%PROJECT_DIR%" ^&^& npm run dev"
echo     Dev server starting...
echo.

REM Wait then open browser
echo [3/3] Waiting for server to be ready...
timeout /t 10 /nobreak >nul
start http://localhost:4029
echo     Browser opened
echo.

echo ========================================
echo   All systems running!
echo ========================================
echo.
echo   Auto-sync : TCOC Auto-Sync window  (push/pull every 5s)
echo   Dev server: TCOC Dev Server window (http://localhost:4029)
echo.
echo Close both windows above when done.
echo.
pause >nul
