@echo off
REM ============================================================================
REM  run-create-Events-Opportunity.bat — Create Events Opportunity
REM ============================================================================
REM  Runs: tests1\create-Events-Opp.spec.ts
REM
REM  Required in .env (same folder as this batch):
REM    SALESFORCE_USERNAME
REM    SALESFORCE_PASSWORD
REM
REM  Optional in .env:
REM    SALESFORCE_BASE_URL=https://test.salesforce.com/
REM    SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home
REM    SALESFORCE_LOCATOR_TIMEOUT_MS=30000
REM    Opportunity name in test: TestEventsOpp-<timestamp>
REM
REM  Headed browser: npm run test:headed -- tests1/create-Events-Opp.spec.ts
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"

set "SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home"
set "PLAYWRIGHT_RESULTS_SUBDIR=create-Events-Opportunity"

title Create Events Opportunity — Playwright

echo ============================================
echo  Create Events Opportunity
echo  Project: %CD%
echo  Lightning home: %SALESFORCE_LIGHTNING_HOME_URL%
echo  Ensure .env has SALESFORCE_USERNAME and SALESFORCE_PASSWORD.
echo ============================================
echo.

call npm test -- tests1/create-Events-Opp.spec.ts

set "EXITCODE=%ERRORLEVEL%"
echo.
if %EXITCODE% neq 0 (
  echo Finished with errors ^(exit code %EXITCODE%^).
) else (
  echo Events opportunity flow completed.
)

endlocal & exit /b %EXITCODE%
