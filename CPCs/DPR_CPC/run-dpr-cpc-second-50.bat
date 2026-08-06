@echo off
setlocal enabledelayedexpansion

REM Run offset+N field loops for DPR CPC (default: second 50, offset=50, limit=50).
REM After each field run, prints a comparison table (before/after/save/Result)
REM and attaches comparison-table.html + .json to the Playwright report.
REM Usage:
REM   run-dpr-cpc-second-50.bat
REM   run-dpr-cpc-second-50.bat --headed
REM   set DPR_CPC_FIELD_OFFSET=0 && run-dpr-cpc-second-50.bat --headed  (first 50)

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the DPR_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined DPR_CPC_FIELD_LIMIT set DPR_CPC_FIELD_LIMIT=50
if not defined DPR_CPC_FIELD_OFFSET set DPR_CPC_FIELD_OFFSET=50
if not defined DPR_CPC_ENGLISH_RESULTS_DIR set DPR_CPC_ENGLISH_RESULTS_DIR=DPR_CPC_English_Results
if not defined DPR_CPC_COUNTRY_CODE_LIMIT set DPR_CPC_COUNTRY_CODE_LIMIT=%DPR_CPC_FIELD_LIMIT%
if not defined DPR_CPC_COUNTRY_CODE_OFFSET set DPR_CPC_COUNTRY_CODE_OFFSET=%DPR_CPC_FIELD_OFFSET%
if not defined DPR_CPC_NATIONALITY_LIMIT set DPR_CPC_NATIONALITY_LIMIT=%DPR_CPC_FIELD_LIMIT%
if not defined DPR_CPC_NATIONALITY_OFFSET set DPR_CPC_NATIONALITY_OFFSET=%DPR_CPC_FIELD_OFFSET%
if not defined DPR_CPC_COUNTRY_OF_RESIDENCE_LIMIT set DPR_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%DPR_CPC_FIELD_LIMIT%
if not defined DPR_CPC_COUNTRY_OF_RESIDENCE_OFFSET set DPR_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%DPR_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %DPR_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country code offset %DPR_CPC_COUNTRY_CODE_OFFSET% limit %DPR_CPC_COUNTRY_CODE_LIMIT% + Nationality offset %DPR_CPC_NATIONALITY_OFFSET% limit %DPR_CPC_NATIONALITY_LIMIT% + Country of Residence offset %DPR_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %DPR_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-code-and-nationality-second-50.spec.ts tests/country-of-residence-second-50.spec.ts %*
exit /b %ERRORLEVEL%
