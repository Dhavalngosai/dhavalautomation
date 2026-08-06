@echo off
REM ============================================================================
REM  run-create-lead.bat — Create Salesforce Leads from Excel (QA sandbox)
REM ============================================================================
REM  Runs: tests\create-lead.spec.ts
REM  Data:  data\create-leads.xlsx
REM
REM  Required in repo-root .env:
REM    SALESFORCE_USERNAME
REM    SALESFORCE_PASSWORD
REM
REM  Optional in .env:
REM    SALESFORCE_BASE_URL=https://test.salesforce.com/
REM    SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home
REM    SALESFORCE_LEAD_EXCEL_PATH=path\to\custom.xlsx
REM
REM  Excel columns:
REM    Salutation, First Name, Last Name*, Email, Country Code,
REM    Description/Notes, Contact Number, Address Search,
REM    Dummy Application Number, Lead Id, Lead URL
REM  (* Last Name required. Rows with Lead Id set are skipped.)
REM
REM  Extra args are passed to Playwright, e.g.:
REM    run-create-lead.bat --headed
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"

set "REPO_ROOT=%~dp0.."
set "PLAYWRIGHT_RESULTS_SUBDIR=lead-creation"
set "SALESFORCE_LIGHTNING_HOME_URL=https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home"

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

echo ERROR: Node.js/npm not found. Install from https://nodejs.org/
exit /b 1

:npm_found

if not exist "%REPO_ROOT%\node_modules" (
  echo Installing root npm dependencies...
  pushd "%REPO_ROOT%"
  call "%NPM_CMD%" install
  set "ROOT_INSTALL=%ERRORLEVEL%"
  popd
  if not "%ROOT_INSTALL%"=="0" exit /b 1
)

if not exist "data\create-leads.xlsx" (
  echo Creating sample Excel: data\create-leads.xlsx
  pushd "%REPO_ROOT%"
  call "%NPM_CMD%" exec -- node Lead_Creation/scripts/create-sample-leads-xlsx.js
  set "XLSX_CREATE=%ERRORLEVEL%"
  popd
  if not "%XLSX_CREATE%"=="0" (
    echo ERROR: Failed to create sample Excel.
    exit /b 1
  )
)

echo Ensuring Playwright Chromium browser is installed...
pushd "%REPO_ROOT%"
call "%NPM_CMD%" exec playwright -- install chromium
set "PW_INSTALL=%ERRORLEVEL%"
popd
if not "%PW_INSTALL%"=="0" (
  echo ERROR: Failed to install Playwright Chromium browser.
  exit /b 1
)

title Create Leads from Excel — Playwright

echo ============================================
echo  Create Salesforce Leads from Excel
echo  Project: %CD%
echo  Spec: tests\create-lead.spec.ts
echo  Data: data\create-leads.xlsx
echo  Lightning home: %SALESFORCE_LIGHTNING_HOME_URL%
echo  Results: ..\results\lead-creation\
echo  Ensure repo-root .env has SALESFORCE_USERNAME and SALESFORCE_PASSWORD.
echo ============================================
echo.

pushd "%REPO_ROOT%"
call "%NPM_CMD%" exec playwright -- test --config=Lead_Creation/playwright.config.ts Lead_Creation/tests/create-lead.spec.ts %*
set "EXITCODE=%ERRORLEVEL%"
popd

echo.
echo ============================================
if %EXITCODE% equ 0 (
  echo  STATUS: PASS
  echo  Lead creation from Excel completed.
  echo  Lead Id / Lead URL written back to data\create-leads.xlsx
) else (
  echo  STATUS: FAIL
  echo  Lead creation failed ^(Playwright exit code %EXITCODE%^).
  echo  See ..\results\lead-creation\playwright-report\ for details.
)
echo ============================================
echo.

if exist "%REPO_ROOT%\scripts\open-playwright-report.bat" (
  call "%REPO_ROOT%\scripts\open-playwright-report.bat"
)

endlocal & exit /b %EXITCODE%
