@echo off
setlocal enabledelayedexpansion

REM Run only the Education Opportunity spec.
REM Usage:
REM   run-create-Education-Opp.bat
REM   run-create-Education-Opp.bat --headed
REM   run-create-Education-Opp.bat --project=chromium
REM   run-create-Education-Opp.bat --list

cd /d "%~dp0"
set "PLAYWRIGHT_RESULTS_SUBDIR=create-Education-Opp"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the repo root.
  exit /b 1
)

call npm test -- "tests1/create-Education-Opp.spec.ts" %*
set "EXITCODE=%ERRORLEVEL%"
call "%~dp0scripts\open-playwright-report.bat"
exit /b %EXITCODE%

