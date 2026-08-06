@echo off
setlocal enabledelayedexpansion

REM Run offset+N field loops for OB CPC (default: sixth 25, offset=125, limit=25).
REM Usage:
REM   run-ob-cpc-sixth-25.bat
REM   run-ob-cpc-sixth-25.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the OB_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined OB_CPC_FIELD_LIMIT set OB_CPC_FIELD_LIMIT=25
if not defined OB_CPC_FIELD_OFFSET set OB_CPC_FIELD_OFFSET=125
if not defined OB_CPC_ENGLISH_RESULTS_DIR set OB_CPC_ENGLISH_RESULTS_DIR=OB_CPC_English_Results
if not defined OB_CPC_COUNTRY_CODE_LIMIT set OB_CPC_COUNTRY_CODE_LIMIT=%OB_CPC_FIELD_LIMIT%
if not defined OB_CPC_COUNTRY_CODE_OFFSET set OB_CPC_COUNTRY_CODE_OFFSET=%OB_CPC_FIELD_OFFSET%
if not defined OB_CPC_NATIONALITY_LIMIT set OB_CPC_NATIONALITY_LIMIT=%OB_CPC_FIELD_LIMIT%
if not defined OB_CPC_NATIONALITY_OFFSET set OB_CPC_NATIONALITY_OFFSET=%OB_CPC_FIELD_OFFSET%
if not defined OB_CPC_COUNTRY_OF_RESIDENCE_LIMIT set OB_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%OB_CPC_FIELD_LIMIT%
if not defined OB_CPC_COUNTRY_OF_RESIDENCE_OFFSET set OB_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%OB_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %OB_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country code offset %OB_CPC_COUNTRY_CODE_OFFSET% limit %OB_CPC_COUNTRY_CODE_LIMIT% + Nationality offset %OB_CPC_NATIONALITY_OFFSET% limit %OB_CPC_NATIONALITY_LIMIT% + Country of Residence offset %OB_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %OB_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-code-and-nationality-sixth-25.spec.ts tests/country-of-residence-sixth-25.spec.ts %*
exit /b %ERRORLEVEL%
