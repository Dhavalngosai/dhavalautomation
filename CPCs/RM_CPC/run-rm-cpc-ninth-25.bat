@echo off
setlocal enabledelayedexpansion

REM Run offset+N field loops for RM CPC (default: ninth 25, offset=200, limit=25).
REM Usage:
REM   run-rm-cpc-ninth-25.bat
REM   run-rm-cpc-ninth-25.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the RM_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined RM_CPC_FIELD_LIMIT set RM_CPC_FIELD_LIMIT=25
if not defined RM_CPC_FIELD_OFFSET set RM_CPC_FIELD_OFFSET=200
if not defined RM_CPC_ENGLISH_RESULTS_DIR set RM_CPC_ENGLISH_RESULTS_DIR=RM_CPC_English_Results
if not defined RM_CPC_COUNTRY_CODE_LIMIT set RM_CPC_COUNTRY_CODE_LIMIT=%RM_CPC_FIELD_LIMIT%
if not defined RM_CPC_COUNTRY_CODE_OFFSET set RM_CPC_COUNTRY_CODE_OFFSET=%RM_CPC_FIELD_OFFSET%
if not defined RM_CPC_NATIONALITY_LIMIT set RM_CPC_NATIONALITY_LIMIT=%RM_CPC_FIELD_LIMIT%
if not defined RM_CPC_NATIONALITY_OFFSET set RM_CPC_NATIONALITY_OFFSET=%RM_CPC_FIELD_OFFSET%
if not defined RM_CPC_COUNTRY_OF_RESIDENCE_LIMIT set RM_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%RM_CPC_FIELD_LIMIT%
if not defined RM_CPC_COUNTRY_OF_RESIDENCE_OFFSET set RM_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%RM_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %RM_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country code offset %RM_CPC_COUNTRY_CODE_OFFSET% limit %RM_CPC_COUNTRY_CODE_LIMIT% + Nationality offset %RM_CPC_NATIONALITY_OFFSET% limit %RM_CPC_NATIONALITY_LIMIT% + Country of Residence offset %RM_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %RM_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-code-and-nationality-ninth-25.spec.ts tests/country-of-residence-ninth-25.spec.ts %*
exit /b %ERRORLEVEL%
