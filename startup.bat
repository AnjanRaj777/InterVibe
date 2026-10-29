@echo off
REM InterVibe startup — web [Next.js, :3000] + API [:8787].
REM Uses hosted Supabase for Postgres + storage. No Docker needed.
REM Run from the repo root:  startup.bat
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [startup] Node.js not found. Install Node 22+ from https://nodejs.org, then re-run.
  pause
  exit /b 1
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo [startup] Created .env from .env.example.
  echo [startup] Fill in MODEL_API_KEY, AUTH_SECRET, DATABASE_URL from Supabase and the STORAGE_ keys, then re-run.
  pause
  exit /b 1
)

set KEYVAL=
for /f "tokens=1* delims==" %%A in ('findstr /B /C:"MODEL_API_KEY=" .env') do set KEYVAL=%%B
if not defined KEYVAL (
  echo [startup] MODEL_API_KEY is still empty in .env. Add your Meta Model API key, then re-run.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [startup] Installing dependencies - first run only.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo [startup] npm install failed. Fix the error above, then re-run.
    pause
    exit /b 1
  )
)

echo [startup] Applying DB migrations to Supabase...
call npm run migrate --workspace=@intervibe/api
if errorlevel 1 (
  echo [startup] Migrations failed - check DATABASE_URL in .env, Supabase pooler URI port 6543, then re-run.
  pause
  exit /b 1
)

echo [startup] Starting API on :8787 and web on :3000 in separate windows...
start "InterVibe API" /d "%~dp0apps\api" cmd /k npm run dev
start "InterVibe Web" /d "%~dp0apps\web" cmd /k npm run dev

echo.
echo [startup] Done. Open http://localhost:3000 once both windows report ready.
echo [startup] API health: http://localhost:8787/health
echo [startup] Sign-in links print in the API window.
echo [startup] Stop everything by closing the two windows.
endlocal
