@echo off
setlocal enabledelayedexpansion

REM Run offset+N Country of Residence* loop for WW CPC (default: third 25, offset=50, limit=25).
REM Usage:
REM   run-ww-cpc-country-of-residence-third-25.bat
REM   run-ww-cpc-country-of-residence-third-25.bat --headed

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

if not defined WW_CPC_FIELD_LIMIT set WW_CPC_FIELD_LIMIT=25
if not defined WW_CPC_FIELD_OFFSET set WW_CPC_FIELD_OFFSET=50
if not defined WW_CPC_ENGLISH_RESULTS_DIR set WW_CPC_ENGLISH_RESULTS_DIR=WW_CPC_English_Results
if not defined WW_CPC_COUNTRY_OF_RESIDENCE_LIMIT set WW_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%WW_CPC_FIELD_LIMIT%
if not defined WW_CPC_COUNTRY_OF_RESIDENCE_OFFSET set WW_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%WW_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %WW_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country of Residence offset %WW_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %WW_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-of-residence-third-25.spec.ts %*
exit /b %ERRORLEVEL%
