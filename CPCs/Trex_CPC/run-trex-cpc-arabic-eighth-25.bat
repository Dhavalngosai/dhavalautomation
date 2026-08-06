@echo off
setlocal enabledelayedexpansion

REM Run offset+N Arabic CPC loops (default: eighth 25, offset=175, limit=25).
REM Usage:
REM   run-trex-cpc-arabic-eighth-25.bat
REM   run-trex-cpc-arabic-eighth-25.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the TREX_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined TREX_CPC_ARABIC_FIELD_LIMIT set TREX_CPC_ARABIC_FIELD_LIMIT=25
if not defined TREX_CPC_ARABIC_FIELD_OFFSET set TREX_CPC_ARABIC_FIELD_OFFSET=175
if not defined TREX_CPC_ARABIC_RESULTS_DIR set TREX_CPC_ARABIC_RESULTS_DIR=TREX_CPC_Arabic_Results
if not defined TREX_CPC_ARABIC_COUNTRY_CODE_LIMIT set TREX_CPC_ARABIC_COUNTRY_CODE_LIMIT=%TREX_CPC_ARABIC_FIELD_LIMIT%
if not defined TREX_CPC_ARABIC_COUNTRY_CODE_OFFSET set TREX_CPC_ARABIC_COUNTRY_CODE_OFFSET=%TREX_CPC_ARABIC_FIELD_OFFSET%
if not defined TREX_CPC_ARABIC_NATIONALITY_LIMIT set TREX_CPC_ARABIC_NATIONALITY_LIMIT=%TREX_CPC_ARABIC_FIELD_LIMIT%
if not defined TREX_CPC_ARABIC_NATIONALITY_OFFSET set TREX_CPC_ARABIC_NATIONALITY_OFFSET=%TREX_CPC_ARABIC_FIELD_OFFSET%
if not defined TREX_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT set TREX_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT=%TREX_CPC_ARABIC_FIELD_LIMIT%
if not defined TREX_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET set TREX_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET=%TREX_CPC_ARABIC_FIELD_OFFSET%

echo Archived Arabic results will be saved under %TREX_CPC_ARABIC_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Arabic CPC: Country code offset %TREX_CPC_ARABIC_COUNTRY_CODE_OFFSET% limit %TREX_CPC_ARABIC_COUNTRY_CODE_LIMIT% + Nationality offset %TREX_CPC_ARABIC_NATIONALITY_OFFSET% limit %TREX_CPC_ARABIC_NATIONALITY_LIMIT% + Country of Residence offset %TREX_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET% limit %TREX_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/arabic/country-code-and-nationality-eighth-25.spec.ts tests/arabic/country-of-residence-eighth-25.spec.ts %*
exit /b %ERRORLEVEL%
