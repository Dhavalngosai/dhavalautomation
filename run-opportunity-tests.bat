@echo off
REM ============================================================================
REM  run-opportunity-tests.bat — Opportunity list flow (Playwright)
REM ============================================================================
REM  Entry point: sets SALESFORCE_OPPORTUNITY_LIST_URL, then runs:
REM    tests1\opportunity-list-all-flow.spec.ts
REM
REM  Steps (Playwright test order):
REM    1. Log in (test.salesforce.com + optional "Log In to Sandbox")
REM    2. Open All Opportunities list URL (set below; override in .env if needed)
REM    3. Click New (handles new tab if Salesforce opens one)
REM    4. Select record type Events — see lib\recordTypePicker.js
REM       (relative XPath .//span[normalize-space()='Events'] under dialog/picker, plus fallbacks)
REM    5. Click Next on the record-type dialog
REM    6. Fill configured fields on the new Opportunity form
REM    7. Save — browser closes when the test ends
REM
REM  Required in .env (same folder as this batch):
REM    SALESFORCE_USERNAME, SALESFORCE_PASSWORD
REM    SALESFORCE_BASE_URL (e.g. https://test.salesforce.com/)
REM    SALESFORCE_LIGHTNING_ORIGIN or SALESFORCE_LIGHTNING_HOME_URL
REM
REM  Optional .env (record type / org tuning):
REM    SALESFORCE_OPPORTUNITY_RECORD_TYPE_LABEL=Events
REM    SALESFORCE_EVENTS_RECORD_TYPE_LABEL_FOR=012060000015KAUAA2   (label for= / radio id)
REM    SALESFORCE_EVENTS_RECORD_TYPE_RADIO_INDEX=2                 (0-based; 2 = 3rd radio in dialog)
REM
REM  Retry without a full restart:
REM    results\opportunity-list-all-flow\test-results\opp-flow-failed.json holds {"step":N} on failure — re-run this batch.
REM    results\opportunity-list-all-flow\test-results\opp-flow-auth.json skips login when present and step > 1.
REM
REM  Full reset (always start at step 1):
REM    del results\opportunity-list-all-flow\test-results\opp-flow-failed.json
REM    del results\opportunity-list-all-flow\test-results\opp-flow-auth.json
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"

set "SALESFORCE_OPPORTUNITY_LIST_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/o/Opportunity/list?filterName=AllOpportunities"
set "PLAYWRIGHT_RESULTS_SUBDIR=opportunity-list-all-flow"

title Opportunity list flow — Playwright

echo ============================================
echo  Opportunity list flow
echo  Project: %CD%
echo  List URL: %SALESFORCE_OPPORTUNITY_LIST_URL%
echo  Ensure .env has Salesforce credentials and Lightning origin.
echo ============================================
echo.

call npm test -- tests1/opportunity-list-all-flow.spec.ts

set "EXITCODE=%ERRORLEVEL%"
echo.
if %EXITCODE% neq 0 (
  echo Tests finished with errors ^(exit code %EXITCODE%^).
  echo Look for: [Opportunity flow] Step ... FAILED
  echo Retry: run this batch again. Full reset: delete results\opportunity-list-all-flow\test-results\opp-flow-failed.json and opp-flow-auth.json
) else (
  echo All steps completed successfully.
)

endlocal & exit /b %EXITCODE%
