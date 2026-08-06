@echo off
setlocal enabledelayedexpansion

REM Run offset+N Arabic Country of Residence* loop (default: third 25, offset=50, limit=25).
REM Usage:
REM   run-ww-cpc-arabic-country-of-residence-third-25.bat
REM   run-ww-cpc-arabic-country-of-residence-third-25.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the WW_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined WW_CPC_ARABIC_FIELD_LIMIT set WW_CPC_ARABIC_FIELD_LIMIT=25
if not defined WW_CPC_ARABIC_FIELD_OFFSET set WW_CPC_ARABIC_FIELD_OFFSET=50
if not defined WW_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT set WW_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT=%WW_CPC_ARABIC_FIELD_LIMIT%
if not defined WW_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET set WW_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET=%WW_CPC_ARABIC_FIELD_OFFSET%
if not defined WW_CPC_ARABIC_RESULTS_DIR set WW_CPC_ARABIC_RESULTS_DIR=WW_CPC_Arabic_Results

echo Archived Arabic results will be saved under %WW_CPC_ARABIC_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Arabic Country of Residence offset %WW_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET% limit %WW_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/arabic/country-of-residence-third-25.spec.ts %*
exit /b %ERRORLEVEL%
