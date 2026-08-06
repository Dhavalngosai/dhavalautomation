@echo off
setlocal enabledelayedexpansion

REM Run offset+N Country of Residence* loop for AD CPC (default: second 25, offset=25, limit=25).
REM Usage:
REM   run-ad-cpc-country-of-residence-second-25.bat
REM   run-ad-cpc-country-of-residence-second-25.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the AD_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined AD_CPC_FIELD_LIMIT set AD_CPC_FIELD_LIMIT=25
if not defined AD_CPC_FIELD_OFFSET set AD_CPC_FIELD_OFFSET=25
if not defined AD_CPC_ENGLISH_RESULTS_DIR set AD_CPC_ENGLISH_RESULTS_DIR=AD_CPC_English_Results
if not defined AD_CPC_COUNTRY_OF_RESIDENCE_LIMIT set AD_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%AD_CPC_FIELD_LIMIT%
if not defined AD_CPC_COUNTRY_OF_RESIDENCE_OFFSET set AD_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%AD_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %AD_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country of Residence offset %AD_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %AD_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-of-residence-second-25.spec.ts %*
exit /b %ERRORLEVEL%
