@echo off
setlocal enabledelayedexpansion

REM Run offset+N Arabic CPC loops (default: first 50, offset=0, limit=50).
REM Usage:
REM   run-ll-cpc-arabic-first-50.bat
REM   run-ll-cpc-arabic-first-50.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the LL_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined LL_CPC_ARABIC_FIELD_LIMIT set LL_CPC_ARABIC_FIELD_LIMIT=50
if not defined LL_CPC_ARABIC_FIELD_OFFSET set LL_CPC_ARABIC_FIELD_OFFSET=0
if not defined LL_CPC_ARABIC_RESULTS_DIR set LL_CPC_ARABIC_RESULTS_DIR=LL_CPC_Arabic_Results
if not defined LL_CPC_ARABIC_COUNTRY_CODE_LIMIT set LL_CPC_ARABIC_COUNTRY_CODE_LIMIT=%LL_CPC_ARABIC_FIELD_LIMIT%
if not defined LL_CPC_ARABIC_COUNTRY_CODE_OFFSET set LL_CPC_ARABIC_COUNTRY_CODE_OFFSET=%LL_CPC_ARABIC_FIELD_OFFSET%
if not defined LL_CPC_ARABIC_NATIONALITY_LIMIT set LL_CPC_ARABIC_NATIONALITY_LIMIT=%LL_CPC_ARABIC_FIELD_LIMIT%
if not defined LL_CPC_ARABIC_NATIONALITY_OFFSET set LL_CPC_ARABIC_NATIONALITY_OFFSET=%LL_CPC_ARABIC_FIELD_OFFSET%
if not defined LL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT set LL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT=%LL_CPC_ARABIC_FIELD_LIMIT%
if not defined LL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET set LL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET=%LL_CPC_ARABIC_FIELD_OFFSET%

echo Archived Arabic results will be saved under %LL_CPC_ARABIC_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Arabic CPC: Country code offset %LL_CPC_ARABIC_COUNTRY_CODE_OFFSET% limit %LL_CPC_ARABIC_COUNTRY_CODE_LIMIT% + Nationality offset %LL_CPC_ARABIC_NATIONALITY_OFFSET% limit %LL_CPC_ARABIC_NATIONALITY_LIMIT% + Country of Residence offset %LL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET% limit %LL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/arabic/country-code-and-nationality-first-50.spec.ts tests/arabic/country-of-residence-first-50.spec.ts %*
exit /b %ERRORLEVEL%
