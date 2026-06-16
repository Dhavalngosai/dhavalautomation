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
REM    SALESFORCE_BASE_URL=https://test.salesforce.com/
REM    SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home
REM
REM  Extra args are passed to Playwright, e.g.:
REM    run-create-DHE-Opp-LifeCycle.bat --headed
REM    run-create-DHE-Opp-LifeCycle.bat --project=chromium
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Run this from the repo root.
  exit /b 1
)

set "SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home"
set "PLAYWRIGHT_RESULTS_SUBDIR=create-DHE-Opp-LifeCycle"

title DHE Opportunity Lifecycle — Playwright

echo ============================================
echo  DHE Opportunity Lifecycle
echo  Project: %CD%
echo  Spec: tests1\create-DHE-Opp-LifeCycle.spec.ts
echo  Lightning home: %SALESFORCE_LIGHTNING_HOME_URL%
echo  Ensure .env has SALESFORCE_USERNAME and SALESFORCE_PASSWORD.
echo ============================================
echo.

call npm test -- tests1/create-DHE-Opp-LifeCycle.spec.ts %*

set "EXITCODE=%ERRORLEVEL%"
echo.
if %EXITCODE% neq 0 (
  echo Finished with errors ^(exit code %EXITCODE%^).
) else (
  echo Lifecycle flow completed.
)

endlocal & exit /b %EXITCODE%
