@echo off
setlocal enabledelayedexpansion

REM Run offset+N Arabic CPC loops (default: first 15, offset=0, limit=15).
REM Usage:
REM   run-mg-cpc-arabic-first-15.bat
REM   run-mg-cpc-arabic-first-15.bat --headed
REM   set MG_CPC_ARABIC_FIELD_OFFSET=15 && run-mg-cpc-arabic-first-15.bat --headed

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

if not defined MG_CPC_ARABIC_FIELD_LIMIT set MG_CPC_ARABIC_FIELD_LIMIT=15
if not defined MG_CPC_ARABIC_FIELD_OFFSET set MG_CPC_ARABIC_FIELD_OFFSET=0
if not defined MG_CPC_ARABIC_RESULTS_DIR set MG_CPC_ARABIC_RESULTS_DIR=MG_CPC_Arabic_Results
if not defined MG_CPC_ARABIC_COUNTRY_CODE_LIMIT set MG_CPC_ARABIC_COUNTRY_CODE_LIMIT=%MG_CPC_ARABIC_FIELD_LIMIT%
if not defined MG_CPC_ARABIC_COUNTRY_CODE_OFFSET set MG_CPC_ARABIC_COUNTRY_CODE_OFFSET=%MG_CPC_ARABIC_FIELD_OFFSET%
if not defined MG_CPC_ARABIC_NATIONALITY_LIMIT set MG_CPC_ARABIC_NATIONALITY_LIMIT=%MG_CPC_ARABIC_FIELD_LIMIT%
if not defined MG_CPC_ARABIC_NATIONALITY_OFFSET set MG_CPC_ARABIC_NATIONALITY_OFFSET=%MG_CPC_ARABIC_FIELD_OFFSET%
if not defined MG_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT set MG_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT=%MG_CPC_ARABIC_FIELD_LIMIT%
if not defined MG_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET set MG_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET=%MG_CPC_ARABIC_FIELD_OFFSET%

echo Archived Arabic results will be saved under %MG_CPC_ARABIC_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Arabic CPC: Country code offset %MG_CPC_ARABIC_COUNTRY_CODE_OFFSET% limit %MG_CPC_ARABIC_COUNTRY_CODE_LIMIT% + Nationality offset %MG_CPC_ARABIC_NATIONALITY_OFFSET% limit %MG_CPC_ARABIC_NATIONALITY_LIMIT% + Country of Residence offset %MG_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET% limit %MG_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/arabic/country-code-and-nationality-first-15.spec.ts tests/arabic/country-of-residence-first-15.spec.ts %*
exit /b %ERRORLEVEL%
