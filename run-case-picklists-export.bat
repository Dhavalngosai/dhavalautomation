@echo off
REM Export all picklist values from Salesforce Case new-record form.
setlocal EnableExtensions
cd /d "%~dp0"

set "SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home"
set "PLAYWRIGHT_RESULTS_SUBDIR=case-picklists-export"

title Case Picklists Export — Playwright

echo ============================================
echo  Export Case picklist values
echo  Output: data\case-picklists.json
echo ============================================
echo.

call npm test -- tests1/case-picklists-export.spec.ts %*

set "EXITCODE=%ERRORLEVEL%"
echo.
if %EXITCODE% equ 0 (
  echo  STATUS: PASS — see data\case-picklists.json
) else (
  echo  STATUS: FAIL — see results\case-picklists-export\playwright-report\
)
echo.

endlocal & exit /b %EXITCODE%
