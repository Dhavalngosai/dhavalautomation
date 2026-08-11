@echo off
setlocal enabledelayedexpansion

REM Run offset+N Country of Residence* loop for MG CPC (default: third 50, offset=100, limit=50).
REM Usage:
REM   run-mg-cpc-country-of-residence-third-50.bat
REM   run-mg-cpc-country-of-residence-third-50.bat --headed
REM   set MG_CPC_FIELD_OFFSET=0 && run-mg-cpc-country-of-residence-third-50.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the MG_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined MG_CPC_FIELD_LIMIT set MG_CPC_FIELD_LIMIT=50
if not defined MG_CPC_FIELD_OFFSET set MG_CPC_FIELD_OFFSET=100
if not defined MG_CPC_ENGLISH_RESULTS_DIR set MG_CPC_ENGLISH_RESULTS_DIR=MG_CPC_English_Results
if not defined MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT set MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%MG_CPC_FIELD_LIMIT%
if not defined MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET set MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%MG_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %MG_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country of Residence offset %MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-of-residence-third-50.spec.ts %*
exit /b %ERRORLEVEL%
