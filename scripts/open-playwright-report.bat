@echo off
REM Open the HTML report for the current batch run (PLAYWRIGHT_RESULTS_SUBDIR).
setlocal EnableExtensions
cd /d "%~dp0.."

if defined PLAYWRIGHT_RESULTS_SUBDIR (
  set "REPORT_PATH=results\%PLAYWRIGHT_RESULTS_SUBDIR%\playwright-report"
) else (
  set "REPORT_PATH=playwright-report"
)

if not exist "%REPORT_PATH%\index.html" (
  echo HTML report not found: %CD%\%REPORT_PATH%
  exit /b 1
)

echo Opening HTML report: %REPORT_PATH%
call npx playwright show-report "%REPORT_PATH%"
exit /b %ERRORLEVEL%
