@echo off
setlocal enabledelayedexpansion

REM Run offset+N Arabic CPC loops (default: fourth 25, offset=75, limit=25).
REM Usage:
REM   run-tv-cpc-arabic-fourth-25.bat
REM   run-tv-cpc-arabic-fourth-25.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the TV_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined TV_CPC_ARABIC_FIELD_LIMIT set TV_CPC_ARABIC_FIELD_LIMIT=25
if not defined TV_CPC_ARABIC_FIELD_OFFSET set TV_CPC_ARABIC_FIELD_OFFSET=75
if not defined TV_CPC_ARABIC_RESULTS_DIR set TV_CPC_ARABIC_RESULTS_DIR=TV_CPC_Arabic_Results
if not defined TV_CPC_ARABIC_COUNTRY_CODE_LIMIT set TV_CPC_ARABIC_COUNTRY_CODE_LIMIT=%TV_CPC_ARABIC_FIELD_LIMIT%
if not defined TV_CPC_ARABIC_COUNTRY_CODE_OFFSET set TV_CPC_ARABIC_COUNTRY_CODE_OFFSET=%TV_CPC_ARABIC_FIELD_OFFSET%
if not defined TV_CPC_ARABIC_NATIONALITY_LIMIT set TV_CPC_ARABIC_NATIONALITY_LIMIT=%TV_CPC_ARABIC_FIELD_LIMIT%
if not defined TV_CPC_ARABIC_NATIONALITY_OFFSET set TV_CPC_ARABIC_NATIONALITY_OFFSET=%TV_CPC_ARABIC_FIELD_OFFSET%
if not defined TV_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT set TV_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT=%TV_CPC_ARABIC_FIELD_LIMIT%
if not defined TV_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET set TV_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET=%TV_CPC_ARABIC_FIELD_OFFSET%

echo Archived Arabic results will be saved under %TV_CPC_ARABIC_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Arabic CPC: Country code offset %TV_CPC_ARABIC_COUNTRY_CODE_OFFSET% limit %TV_CPC_ARABIC_COUNTRY_CODE_LIMIT% + Nationality offset %TV_CPC_ARABIC_NATIONALITY_OFFSET% limit %TV_CPC_ARABIC_NATIONALITY_LIMIT% + Country of Residence offset %TV_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET% limit %TV_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/arabic/country-code-and-nationality-fourth-25.spec.ts tests/arabic/country-of-residence-fourth-25.spec.ts %*
exit /b %ERRORLEVEL%
