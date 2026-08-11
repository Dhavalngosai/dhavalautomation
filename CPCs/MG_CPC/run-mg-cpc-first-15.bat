@echo off
setlocal enabledelayedexpansion

REM Run offset+N field loops for MG CPC (default: first 15, offset=0, limit=15).
REM After each field run, prints a comparison table (before/after/save/Result)
REM and attaches comparison-table.html + .json to the Playwright report.
REM Usage:
REM   run-mg-cpc-first-15.bat
REM   run-mg-cpc-first-15.bat --headed
REM   set MG_CPC_FIELD_OFFSET=15 && run-mg-cpc-first-15.bat --headed  (second 15)

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

if not defined MG_CPC_FIELD_LIMIT set MG_CPC_FIELD_LIMIT=15
if not defined MG_CPC_FIELD_OFFSET set MG_CPC_FIELD_OFFSET=0
if not defined MG_CPC_ENGLISH_RESULTS_DIR set MG_CPC_ENGLISH_RESULTS_DIR=MG_CPC_English_Results
if not defined MG_CPC_COUNTRY_CODE_LIMIT set MG_CPC_COUNTRY_CODE_LIMIT=%MG_CPC_FIELD_LIMIT%
if not defined MG_CPC_COUNTRY_CODE_OFFSET set MG_CPC_COUNTRY_CODE_OFFSET=%MG_CPC_FIELD_OFFSET%
if not defined MG_CPC_NATIONALITY_LIMIT set MG_CPC_NATIONALITY_LIMIT=%MG_CPC_FIELD_LIMIT%
if not defined MG_CPC_NATIONALITY_OFFSET set MG_CPC_NATIONALITY_OFFSET=%MG_CPC_FIELD_OFFSET%
if not defined MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT set MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%MG_CPC_FIELD_LIMIT%
if not defined MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET set MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%MG_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %MG_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country code offset %MG_CPC_COUNTRY_CODE_OFFSET% limit %MG_CPC_COUNTRY_CODE_LIMIT% + Nationality offset %MG_CPC_NATIONALITY_OFFSET% limit %MG_CPC_NATIONALITY_LIMIT% + Country of Residence offset %MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-code-and-nationality-first-15.spec.ts tests/country-of-residence-first-15.spec.ts %*
exit /b %ERRORLEVEL%
