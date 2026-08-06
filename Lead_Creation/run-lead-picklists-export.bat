@echo off
REM ============================================================================
REM  run-lead-picklists-export.bat — Export Lead form picklist values
REM ============================================================================
REM  Opens Salesforce New Lead form and reads:
REM    - picklists (combobox)
REM    - multi-select / dual-listbox (Available options)
REM    - radio groups, checkbox groups
REM    - inventory of other fields (text, lookup, date, etc.)
REM  Writes:
REM    data\lead-picklists.json
REM    data\lead-picklists.xlsx  (Field | Type | Value)
REM
REM  Required in repo-root .env:
REM    SALESFORCE_USERNAME
REM    SALESFORCE_PASSWORD
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"

set "REPO_ROOT=%~dp0.."
set "PLAYWRIGHT_RESULTS_SUBDIR=lead-picklists-export"
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

echo Ensuring Playwright Chromium browser is installed...
pushd "%REPO_ROOT%"
call "%NPM_CMD%" exec playwright -- install chromium
set "PW_INSTALL=%ERRORLEVEL%"
popd
if not "%PW_INSTALL%"=="0" (
  echo ERROR: Failed to install Playwright Chromium browser.
  exit /b 1
)

title Lead Picklists Export — Playwright

echo ============================================
echo  Export Lead fields / picklists / multi-selects
echo  Project: %CD%
echo  Spec: tests\lead-picklists-export.spec.ts
echo  Output: data\lead-picklists.json
echo          data\lead-picklists.xlsx  ^(Field ^| Type ^| Value^)
echo ============================================
echo.

pushd "%REPO_ROOT%"
call "%NPM_CMD%" exec playwright -- test --config=Lead_Creation/playwright.config.ts Lead_Creation/tests/lead-picklists-export.spec.ts %*
set "EXITCODE=%ERRORLEVEL%"
popd

echo.
echo ============================================
if %EXITCODE% equ 0 (
  echo  STATUS: PASS
  echo  See data\lead-picklists.json and data\lead-picklists.xlsx
) else (
  echo  STATUS: FAIL
  echo  See ..\results\lead-picklists-export\playwright-report\
)
echo ============================================
echo.

if exist "%REPO_ROOT%\scripts\open-playwright-report.bat" (
  call "%REPO_ROOT%\scripts\open-playwright-report.bat"
)

endlocal & exit /b %EXITCODE%
