@echo off
setlocal enabledelayedexpansion

REM Run offset+N Country of Residence* loop for TV CPC (default: fourth 25, offset=75, limit=25).
REM Usage:
REM   run-tv-cpc-country-of-residence-fourth-25.bat
REM   run-tv-cpc-country-of-residence-fourth-25.bat --headed

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

if not defined TV_CPC_FIELD_LIMIT set TV_CPC_FIELD_LIMIT=25
if not defined TV_CPC_FIELD_OFFSET set TV_CPC_FIELD_OFFSET=75
if not defined TV_CPC_ENGLISH_RESULTS_DIR set TV_CPC_ENGLISH_RESULTS_DIR=TV_CPC_English_Results
if not defined TV_CPC_COUNTRY_OF_RESIDENCE_LIMIT set TV_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%TV_CPC_FIELD_LIMIT%
if not defined TV_CPC_COUNTRY_OF_RESIDENCE_OFFSET set TV_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%TV_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %TV_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country of Residence offset %TV_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %TV_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-of-residence-fourth-25.spec.ts %*
exit /b %ERRORLEVEL%
