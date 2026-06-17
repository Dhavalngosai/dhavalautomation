@echo off
REM ============================================================================
REM  run-case-history.bat — Case history screenshots from Excel
REM ============================================================================
REM  Runs: salesforce-case-shot\tests\caseHistory.spec.ts
REM
REM  Prerequisites:
REM    - salesforce-case-shot\data\cases.xlsx (case numbers)
REM    - Credentials and URLs are set inside caseHistory.spec.ts
REM
REM  Output:
REM    - Screenshots: path configured in caseHistory.spec.ts (SCREENSHOT_FOLDER)
REM    - Playwright report: results\case-history\playwright-report\
REM
REM  Extra args are passed to Playwright, e.g.:
REM    run-case-history.bat --headed
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"

set "CASE_SHOT_DIR=%~dp0salesforce-case-shot"
set "PLAYWRIGHT_RESULTS_SUBDIR=case-history"

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
exit /b 1

:npm_found

if not exist "%CASE_SHOT_DIR%\package.json" (
  echo ERROR: salesforce-case-shot\package.json not found.
  exit /b 1
)

if not exist "%CASE_SHOT_DIR%\data\cases.xlsx" (
  echo ERROR: salesforce-case-shot\data\cases.xlsx not found.
  exit /b 1
)

if not exist "node_modules" (
  echo Installing root npm dependencies...
  call "%NPM_CMD%" install
  if errorlevel 1 exit /b 1
)

if not exist "%CASE_SHOT_DIR%\node_modules" (
  echo Installing salesforce-case-shot dependencies ^(xlsx^)...
  pushd "%CASE_SHOT_DIR%"
  call "%NPM_CMD%" install
  set "SUB_INSTALL=%ERRORLEVEL%"
  popd
  if not "%SUB_INSTALL%"=="0" exit /b 1
)

echo Ensuring Playwright Chromium browser is installed...
call "%NPM_CMD%" exec playwright -- install chromium
if errorlevel 1 (
  echo ERROR: Failed to install Playwright Chromium browser.
  exit /b 1
)

title Case History Screenshots — Playwright

echo ============================================
echo  Case History Screenshots
echo  Project: %CD%
echo  Spec: salesforce-case-shot\tests\caseHistory.spec.ts
echo  Data: salesforce-case-shot\data\cases.xlsx
echo  Results: results\case-history\
echo ============================================
echo.

call "%NPM_CMD%" exec playwright -- test --config=salesforce-case-shot/playwright.config.ts salesforce-case-shot/tests/caseHistory.spec.ts %*

set "EXITCODE=%ERRORLEVEL%"
echo.
echo ============================================
if %EXITCODE% equ 0 (
  echo  STATUS: PASS
  echo  Case history screenshot run completed.
) else (
  echo  STATUS: FAIL
  echo  Case history run failed ^(Playwright exit code %EXITCODE%^).
  echo  See results\case-history\playwright-report\ for details.
)
echo ============================================
echo.

call "%~dp0scripts\open-playwright-report.bat"

endlocal & exit /b %EXITCODE%
