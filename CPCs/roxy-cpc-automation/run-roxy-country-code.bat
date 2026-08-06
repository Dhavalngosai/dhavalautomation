@echo off
setlocal enabledelayedexpansion

REM Verify all Country Code values on Roxy Live CPC.
REM Usage:
REM   run-roxy-country-code.bat
REM   run-roxy-country-code.bat --headed
REM   set ROXY_CPC_FIELD_LIMIT=10 && run-roxy-country-code.bat --headed

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

if not defined ROXY_CPC_ENGLISH_RESULTS_DIR set ROXY_CPC_ENGLISH_RESULTS_DIR=Roxy_CPC_English_Results

echo Archived English results will be saved under %ROXY_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Roxy Live CPC Country Code verification...
call npm run test:country-code -- %*
exit /b %ERRORLEVEL%
