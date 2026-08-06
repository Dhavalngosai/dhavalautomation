@echo off
setlocal enabledelayedexpansion

REM Verify Arabic Country Code + Nationality (combined) and Country of Residence on Roxy Live CPC.
REM Usage:
REM   run-roxy-arabic-all-fields.bat
REM   run-roxy-arabic-all-fields.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the roxy-cpc-automation folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined ROXY_CPC_ARABIC_RESULTS_DIR set ROXY_CPC_ARABIC_RESULTS_DIR=Roxy_CPC_Arabic_Results

echo Archived Arabic results will be saved under %ROXY_CPC_ARABIC_RESULTS_DIR%\v{version}\{timestamp}\
echo Running all Roxy Live CPC Arabic field verifications...
call npm run test:arabic-all-fields -- %*
exit /b %ERRORLEVEL%
