@echo off
setlocal enabledelayedexpansion

REM Verify ALL Arabic Country of Residence values on Roxy Live CPC (no batch limit).
REM Usage:
REM   run-roxy-arabic-country-of-residence.bat
REM   run-roxy-arabic-country-of-residence.bat --headed

cd /d "%~dp0"

REM Ensure all values run (ignore any batch limit from parent shell or .env)
set ROXY_CPC_ARABIC_FIELD_LIMIT=
set ROXY_CPC_ARABIC_FIELD_OFFSET=
set ROXY_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT=
set ROXY_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET=

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
echo Running Roxy Live CPC Arabic Country of Residence verification (all values)...
call npm run test:arabic-country-of-residence -- %*
exit /b %ERRORLEVEL%
