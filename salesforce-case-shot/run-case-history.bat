@echo off
REM ============================================================================
REM  run-case-history.bat — Case history screenshots from Excel
REM ============================================================================
REM  Runs: tests\caseHistory.spec.ts
REM
REM  Prerequisites:
REM    - data\cases.xlsx (case numbers)
REM    - Credentials and URLs are set inside caseHistory.spec.ts
REM
REM  Output:
REM    - Screenshots: path configured in caseHistory.spec.ts (SCREENSHOT_FOLDER)
REM    - Playwright report: ..\results\case-history\playwright-report\
REM
REM  Extra args are passed to Playwright, e.g.:
REM    run-case-history.bat --headed
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0"

set "REPO_ROOT=%~dp0.."
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

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the salesforce-case-shot folder.
  exit /b 1
)

if not exist "data\cases.xlsx" (
  echo ERROR: data\cases.xlsx not found.
  exit /b 1
)

if not exist "%REPO_ROOT%\node_modules" (
  echo Installing root npm dependencies...
  pushd "%REPO_ROOT%"
  call "%NPM_CMD%" install
  set "ROOT_INSTALL=%ERRORLEVEL%"
  popd
  if not "%ROOT_INSTALL%"=="0" exit /b 1
)

if not exist "node_modules" (
  echo Installing salesforce-case-shot dependencies ^(xlsx^)...
  call "%NPM_CMD%" install
  if errorlevel 1 exit /b 1
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

title Case History Screenshots — Playwright

echo ============================================
echo  Case History Screenshots
echo  Project: %CD%
echo  Spec: tests\caseHistory.spec.ts
echo  Data: data\cases.xlsx
echo  Results: ..\results\case-history\
echo ============================================
echo.

pushd "%REPO_ROOT%"
call "%NPM_CMD%" exec playwright -- test --config=salesforce-case-shot/playwright.config.ts salesforce-case-shot/tests/caseHistory.spec.ts %*
set "EXITCODE=%ERRORLEVEL%"
popd

echo.
echo ============================================
if %EXITCODE% equ 0 (
  echo  STATUS: PASS
  echo  Case history screenshot run completed.
) else (
  echo  STATUS: FAIL
  echo  Case history run failed ^(Playwright exit code %EXITCODE%^).
  echo  See ..\results\case-history\playwright-report\ for details.
)
echo ============================================
echo.

if exist "%REPO_ROOT%\scripts\open-playwright-report.bat" (
  call "%REPO_ROOT%\scripts\open-playwright-report.bat"
)

endlocal & exit /b %EXITCODE%
