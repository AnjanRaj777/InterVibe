@echo off
setlocal EnableDelayedExpansion

:: ============================================================================
:: InterVibe - Next-Generation AI Verbal Mock Interview Simulator
:: One-Click Windows Startup & Development Launcher
:: ============================================================================

:: Ensure working directory is always the script folder
cd /d "%~dp0"

:: Set CMD title
title InterVibe - AI Mock Interview Simulator

:: Clear screen and show header
cls
echo ========================================================================
echo   InterVibe - AI Verbal Mock Interview Simulator
echo   Engineered for Meta AI Developer Hackathon
echo ========================================================================
echo.

:: ----------------------------------------------------------------------------
:: 1. Verify Node.js
:: ----------------------------------------------------------------------------
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in your system PATH.
    echo.
    echo Please install Node.js [v18.18+ or v20+ recommended] from:
    echo   https://nodejs.org/
    echo.
    echo After installation is complete, re-run startup.bat.
    echo.
    pause
    exit /b 1
)

:: ----------------------------------------------------------------------------
:: 2. Verify npm
:: ----------------------------------------------------------------------------
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm was not found in your system PATH.
    echo Please ensure the Node.js installation includes npm.
    echo.
    pause
    exit /b 1
)

:: Fetch Node.js and npm versions
for /f "delims=" %%v in ('node -v 2^>nul') do set "NODE_VERSION=%%v"
for /f "delims=" %%v in ('npm -v 2^>nul') do set "NPM_VERSION=%%v"

echo [OK] Runtime Environment:
echo      Node.js: %NODE_VERSION%
echo      npm:     v%NPM_VERSION%
echo      Path:    %~dp0
echo.

:: ----------------------------------------------------------------------------
:: 3. Check / Configure Environment (.env.local)
:: ----------------------------------------------------------------------------
if not exist ".env.local" (
    if exist ".env.example" (
        echo [INFO] .env.local not found. Creating from .env.example...
        copy ".env.example" ".env.local" >nul
        echo [SUCCESS] Generated .env.local template.
        echo [NOTICE] Remember to configure your API keys in .env.local:
        echo          - MODEL_API_KEY      [Meta Muse Spark LLM]
        echo          - MUSE_API_KEY       [Meta Muse Voice STT]
        echo          - DEEPGRAM_API_KEY   [Deepgram Aura TTS]
        echo          - GROQ_API_KEY       [Groq Cloud Fallback]
        echo.
    ) else (
        echo [WARNING] Neither .env.local nor .env.example was found.
        echo.
    )
) else (
    echo [OK] Configuration: .env.local detected.
)

:: ----------------------------------------------------------------------------
:: 4. Check Dependencies (node_modules)
:: ----------------------------------------------------------------------------
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing packages with npm install...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b %ERRORLEVEL%
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully.
    echo.
) else (
    echo [OK] Dependencies: node_modules detected.
)
echo.

:: ----------------------------------------------------------------------------
:: 5. Handle Direct CLI Arguments
:: ----------------------------------------------------------------------------
if /i "%~1"=="dev" goto :run_dev
if /i "%~1"=="dev-browser" goto :run_dev_browser
if /i "%~1"=="build" goto :run_build
if /i "%~1"=="prod" goto :run_prod
if /i "%~1"=="start" goto :run_prod
if /i "%~1"=="install" goto :run_install
if /i "%~1"=="help" goto :show_help
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="-h" goto :show_help

:: ----------------------------------------------------------------------------
:: 6. Interactive Launcher Menu
:: ----------------------------------------------------------------------------
:menu
echo ========================================================================
echo   Select an option to proceed:
echo ========================================================================
echo   [1] Start Development Server (Next.js - http://localhost:3000)
echo   [2] Start Development Server ^& Open Browser Automatically
echo   [3] Build ^& Run Production Server (npm run build ^&^& npm start)
echo   [4] Reinstall / Update Dependencies (npm install)
echo   [5] View Command-Line Usage Help
echo   [6] Exit
echo ========================================================================
echo.

set "CHOICE_INPUT="
set /p "CHOICE_INPUT=Enter your choice [1-6] (Press Enter for [1]): "

:: If user pressed Enter, default to 1
if not defined CHOICE_INPUT set "CHOICE_INPUT=1"

:: Remove spaces and quotes
set "CHOICE_INPUT=!CHOICE_INPUT: =!"
set "CHOICE_INPUT=!CHOICE_INPUT:"=!"

:: Extract first character
if defined CHOICE_INPUT set "CHOICE_INPUT=!CHOICE_INPUT:~0,1!"
if not defined CHOICE_INPUT set "CHOICE_INPUT=1"

if "!CHOICE_INPUT!"=="1" goto :run_dev
if "!CHOICE_INPUT!"=="2" goto :run_dev_browser
if "!CHOICE_INPUT!"=="3" goto :run_prod
if "!CHOICE_INPUT!"=="4" goto :run_install
if "!CHOICE_INPUT!"=="5" goto :show_help_menu
if "!CHOICE_INPUT!"=="6" goto :exit_script

echo.
echo [ERROR] Invalid choice "!CHOICE_INPUT!". Please select 1 through 6.
echo.
goto :menu

:: ----------------------------------------------------------------------------
:: Routines
:: ----------------------------------------------------------------------------

:run_dev
echo.
echo ========================================================================
echo   Launching InterVibe Development Server...
echo   URL:    http://localhost:3000
echo   Status: Compiling with Turbopack / Next.js
echo.
echo   Press [Ctrl + C] anytime in this window to stop the server.
echo ========================================================================
echo.
call npm run dev
echo.
echo Server process exited.
pause
exit /b 0

:run_dev_browser
echo.
echo ========================================================================
echo   Launching InterVibe Development Server + Browser...
echo   URL:     http://localhost:3000
echo   Browser: Launching in 4 seconds...
echo.
echo   Press [Ctrl + C] anytime in this window to stop the server.
echo ========================================================================
echo.
start "" cmd /c "ping -n 5 127.0.0.1 >nul & start http://localhost:3000"
call npm run dev
echo.
echo Server process exited.
pause
exit /b 0

:run_prod
echo.
echo ========================================================================
echo   Step 1/2: Building InterVibe for Production...
echo ========================================================================
echo.
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Production build failed with error code %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================================
echo   Step 2/2: Starting Production Server...
echo   URL: http://localhost:3000
echo.
echo   Press [Ctrl + C] anytime in this window to stop the server.
echo ========================================================================
echo.
start "" cmd /c "ping -n 4 127.0.0.1 >nul & start http://localhost:3000"
call npm run start
echo.
echo Server process exited.
pause
exit /b 0

:run_install
echo.
echo ========================================================================
echo   Running npm install...
echo ========================================================================
echo.
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm install encountered errors [Code: %ERRORLEVEL%].
) else (
    echo.
    echo [SUCCESS] Dependencies installed and validated.
)
echo.
pause
goto :menu

:run_build
echo.
echo ========================================================================
echo   Building InterVibe (npm run build)...
echo ========================================================================
echo.
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Build failed with error code %ERRORLEVEL%.
) else (
    echo.
    echo [SUCCESS] Build completed successfully.
)
pause
exit /b %ERRORLEVEL%

:show_help
echo.
echo InterVibe Startup Utility - Command-Line Usage:
echo.
echo   startup.bat               Open interactive menu [Default: Option 1]
echo   startup.bat dev           Start Next.js dev server [http://localhost:3000]
echo   startup.bat dev-browser   Start dev server and auto-open browser
echo   startup.bat build         Run production build [npm run build]
echo   startup.bat prod          Build and launch production server
echo   startup.bat start         Alias for prod
echo   startup.bat install       Install or refresh dependencies [npm install]
echo   startup.bat help          Display this help message
echo.
pause
exit /b 0

:show_help_menu
echo.
echo InterVibe Startup Utility - Command-Line Usage:
echo.
echo   startup.bat               Open interactive menu [Default: Option 1]
echo   startup.bat dev           Start Next.js dev server [http://localhost:3000]
echo   startup.bat dev-browser   Start dev server and auto-open browser
echo   startup.bat build         Run production build [npm run build]
echo   startup.bat prod          Build and launch production server
echo   startup.bat start         Alias for prod
echo   startup.bat install       Install or refresh dependencies [npm install]
echo   startup.bat help          Display this help message
echo.
pause
goto :menu

:exit_script
echo.
echo Exiting InterVibe Launcher. Have a great session.
exit /b 0
