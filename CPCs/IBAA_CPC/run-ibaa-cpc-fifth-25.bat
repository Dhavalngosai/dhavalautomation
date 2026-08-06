@echo off
setlocal enabledelayedexpansion

REM Run offset+N field loops for IBAA CPC (default: fifth 25, offset=100, limit=25).
REM Usage:
REM   run-ibaa-cpc-fifth-25.bat
REM   run-ibaa-cpc-fifth-25.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the IBAA_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined IBAA_CPC_FIELD_LIMIT set IBAA_CPC_FIELD_LIMIT=25
if not defined IBAA_CPC_FIELD_OFFSET set IBAA_CPC_FIELD_OFFSET=100
if not defined IBAA_CPC_ENGLISH_RESULTS_DIR set IBAA_CPC_ENGLISH_RESULTS_DIR=IBAA_CPC_English_Results
if not defined IBAA_CPC_COUNTRY_CODE_LIMIT set IBAA_CPC_COUNTRY_CODE_LIMIT=%IBAA_CPC_FIELD_LIMIT%
if not defined IBAA_CPC_COUNTRY_CODE_OFFSET set IBAA_CPC_COUNTRY_CODE_OFFSET=%IBAA_CPC_FIELD_OFFSET%
if not defined IBAA_CPC_NATIONALITY_LIMIT set IBAA_CPC_NATIONALITY_LIMIT=%IBAA_CPC_FIELD_LIMIT%
if not defined IBAA_CPC_NATIONALITY_OFFSET set IBAA_CPC_NATIONALITY_OFFSET=%IBAA_CPC_FIELD_OFFSET%
if not defined IBAA_CPC_COUNTRY_OF_RESIDENCE_LIMIT set IBAA_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%IBAA_CPC_FIELD_LIMIT%
if not defined IBAA_CPC_COUNTRY_OF_RESIDENCE_OFFSET set IBAA_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%IBAA_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %IBAA_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country code offset %IBAA_CPC_COUNTRY_CODE_OFFSET% limit %IBAA_CPC_COUNTRY_CODE_LIMIT% + Nationality offset %IBAA_CPC_NATIONALITY_OFFSET% limit %IBAA_CPC_NATIONALITY_LIMIT% + Country of Residence offset %IBAA_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %IBAA_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-code-and-nationality-fifth-25.spec.ts tests/country-of-residence-fifth-25.spec.ts %*
exit /b %ERRORLEVEL%
