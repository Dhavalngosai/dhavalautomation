@echo off
REM ============================================================================
REM  run-create-cases-from-excel.bat — Create Cases from Excel
REM ============================================================================
REM  Runs: tests1\create-cases-from-excel.spec.ts
REM
REM  Data: data\create-cases.xlsx
REM    Columns: User, Subject, Description, Account Name, Asset, Sub Asset,
REM             Case Type, Sub Type
REM
REM  Sample file: node scripts\create-sample-cases-xlsx.js
REM
REM  Required in .env:
REM    SALESFORCE_USERNAME, SALESFORCE_PASSWORD
REM
REM  Optional in .env:
REM    SALESFORCE_BASE_URL=https://test.salesforce.com/
REM    SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home
REM    SALESFORCE_CASE_LIST_URL=.../lightning/o/Case/list?filterName=__Recent
REM
REM  Results: results\create-cases-from-excel\
REM  Extra args: run-create-cases-from-excel.bat --headed
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"

set "SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home"
set "PLAYWRIGHT_RESULTS_SUBDIR=create-cases-from-excel"

if not exist "data\create-cases.xlsx" (
  echo Sample Excel not found — creating data\create-cases.xlsx ...
  call npm run --silent 2>nul
  node scripts\create-sample-cases-xlsx.js
  if errorlevel 1 exit /b 1
)

if not exist "node_modules" (
  echo Installing npm dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

title Create Cases from Excel — Playwright

echo ============================================
echo  Create Cases from Excel
echo  Project: %CD%
echo  Data: data\create-cases.xlsx
echo  Results: results\create-cases-from-excel\
echo  Ensure .env has SALESFORCE_USERNAME and SALESFORCE_PASSWORD.
echo ============================================
echo.

call npm test -- tests1/create-cases-from-excel.spec.ts %*

set "EXITCODE=%ERRORLEVEL%"
echo.
echo ============================================
if %EXITCODE% equ 0 (
  echo  STATUS: PASS
  echo  All cases created successfully.
) else (
  echo  STATUS: FAIL
  echo  See results\create-cases-from-excel\playwright-report\ for details.
)
echo ============================================
echo.

call "%~dp0scripts\open-playwright-report.bat"

endlocal & exit /b %EXITCODE%
