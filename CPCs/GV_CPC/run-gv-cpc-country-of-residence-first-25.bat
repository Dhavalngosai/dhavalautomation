@echo off
setlocal enabledelayedexpansion

REM Run offset+N Country of Residence* loop for GV CPC (default: first 25, offset=0, limit=25).
REM Usage:
REM   run-gv-cpc-country-of-residence-first-25.bat
REM   run-gv-cpc-country-of-residence-first-25.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the GV_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined GV_CPC_FIELD_LIMIT set GV_CPC_FIELD_LIMIT=25
if not defined GV_CPC_FIELD_OFFSET set GV_CPC_FIELD_OFFSET=0
if not defined GV_CPC_ENGLISH_RESULTS_DIR set GV_CPC_ENGLISH_RESULTS_DIR=GV_CPC_English_Results
if not defined GV_CPC_COUNTRY_OF_RESIDENCE_LIMIT set GV_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%GV_CPC_FIELD_LIMIT%
if not defined GV_CPC_COUNTRY_OF_RESIDENCE_OFFSET set GV_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%GV_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %GV_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country of Residence offset %GV_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %GV_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-of-residence-first-25.spec.ts %*
exit /b %ERRORLEVEL%
