@echo off
REM ============================================================================
REM  run-create-DHE-Opp-LifeCycle-closeLost.bat — DHE Opportunity Closed Lost
REM ============================================================================
REM  Runs: tests1\create-DHE-Opp-LifeCycle-closeLost.aspx.ts
REM
REM  Required in .env:
REM    SALESFORCE_USERNAME
REM    SALESFORCE_PASSWORD
REM
REM  Optional in .env:
REM    SALESFORCE_LIGHTNING_HOME_URL
REM    SALESFORCE_TEST_LOSS_REASON=Not Interested
REM    SALESFORCE_TEST_LOSS_REASON_JUSTIFICATION=Automated test closure
REM
REM  Extra args are passed to Playwright, e.g.:
REM    run-create-DHE-Opp-LifeCycle-closeLost.bat --headed
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
set "PLAYWRIGHT_RESULTS_SUBDIR=create-DHE-Opp-LifeCycle-closeLost"

title DHE Opportunity Lifecycle - Closed Lost

echo ============================================
echo  DHE Opportunity Lifecycle - Closed Lost
echo  Project: %CD%
echo  Spec: tests1\create-DHE-Opp-LifeCycle-closeLost.aspx.ts
echo  Lightning home: %SALESFORCE_LIGHTNING_HOME_URL%
echo  Results folder: results\create-DHE-Opp-LifeCycle-closeLost\
echo  Ensure .env has SALESFORCE_USERNAME and SALESFORCE_PASSWORD.
echo ============================================
echo.

call "%NPM_CMD%" test -- tests1/create-DHE-Opp-LifeCycle-closeLost.aspx.ts %*

set "EXITCODE=%ERRORLEVEL%"
echo.
echo ============================================
if %EXITCODE% equ 0 (
  echo  STATUS: PASS
  echo  DHE Opportunity Closed Lost lifecycle finished successfully.
) else (
  echo  STATUS: FAIL
  echo  DHE Opportunity Closed Lost lifecycle failed with Playwright exit code %EXITCODE%.
  echo  See results\create-DHE-Opp-LifeCycle-closeLost\playwright-report\ for details.
)
echo ============================================
echo.
call "%~dp0scripts\open-playwright-report.bat"

endlocal & exit /b 0
