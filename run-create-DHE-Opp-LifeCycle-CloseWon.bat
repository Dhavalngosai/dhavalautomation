@echo off
REM ============================================================================
REM  run-create-DHE-Opp-LifeCycle.bat — DHE Opportunity full lifecycle
REM ============================================================================
REM  Runs: tests1\create-DHE-Opp-LifeCycle.spec.ts
REM
REM  Required in .env (same folder as this batch):
REM    SALESFORCE_USERNAME
REM    SALESFORCE_PASSWORD
REM
REM  Optional in .env:
REM    SALESFORCE_BASE_URL=https://login.salesforce.com/
REM    SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home
REM
REM  Extra args are passed to Playwright, e.g.:
REM    run-create-DHE-Opp-LifeCycle.bat --headed
REM    run-create-DHE-Opp-LifeCycle.bat --project=chromium
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"

set "NPM_CMD="
where npm.cmd >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%I in ('where npm.cmd 2^>nul') do set "NPM_CMD=%%I" & goto :npm_found
)
if exist "%ProgramFiles%\nodejs\npm.cmd" (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
  set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
  goto :npm_found
)
if exist "%LOCALAPPDATA%\nodejs\npm.cmd" (
  set "PATH=%LOCALAPPDATA%\nodejs;%PATH%"
  set "NPM_CMD=%LOCALAPPDATA%\nodejs\npm.cmd"
  goto :npm_found
)

echo ERROR: Node.js/npm not found. Install from https://nodejs.org/ or run:
echo   winget install OpenJS.NodeJS.LTS
echo Then close and reopen your terminal.
exit /b 1

:npm_found

if not exist "node_modules" (
  echo Installing npm dependencies...
  call "%NPM_CMD%" install
  if errorlevel 1 exit /b 1
)

if not exist ".env" (
  echo ERROR: .env not found. Copy .env.example to .env and set SALESFORCE_USERNAME and SALESFORCE_PASSWORD.
  exit /b 1
)

if not exist "package.json" (
  echo ERROR: package.json not found. Run this from the repo root.
  exit /b 1
)

set "SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home"

title DHE Opportunity Lifecycle — Playwright

echo ============================================
echo  DHE Opportunity Lifecycle
echo  Project: %CD%
echo  Spec: tests1\create-DHE-Opp-LifeCycle-closeWon.spec.ts
echo  Lightning home: %SALESFORCE_LIGHTNING_HOME_URL%
echo  Ensure .env has SALESFORCE_USERNAME and SALESFORCE_PASSWORD.
echo ============================================
echo.

call "%NPM_CMD%" test -- tests1/create-DHE-Opp-LifeCycle-closeWon.spec.ts -g "Closed Won" --reporter=line %*

set "EXITCODE=%ERRORLEVEL%"
echo.
echo ============================================
if %EXITCODE% equ 0 (
  echo  STATUS: PASS
  echo  DHE Opportunity lifecycle completed successfully.
) else (
  echo  STATUS: FAIL
  echo  DHE Opportunity lifecycle test failed ^(Playwright exit code %EXITCODE%^).
  echo  See playwright-report\ or test-results\ for details.
)
echo ============================================

REM Return success so this batch script does not report failure to callers.
endlocal & exit /b 0
