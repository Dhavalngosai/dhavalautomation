@echo off
setlocal enabledelayedexpansion

REM Run offset+N Arabic CPC loops (default: seventh 25, offset=150, limit=25).
REM Usage:
REM   run-rl-cpc-arabic-seventh-25.bat
REM   run-rl-cpc-arabic-seventh-25.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the RL_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined RL_CPC_ARABIC_FIELD_LIMIT set RL_CPC_ARABIC_FIELD_LIMIT=25
if not defined RL_CPC_ARABIC_FIELD_OFFSET set RL_CPC_ARABIC_FIELD_OFFSET=150
if not defined RL_CPC_ARABIC_RESULTS_DIR set RL_CPC_ARABIC_RESULTS_DIR=RL_CPC_Arabic_Results
if not defined RL_CPC_ARABIC_COUNTRY_CODE_LIMIT set RL_CPC_ARABIC_COUNTRY_CODE_LIMIT=%RL_CPC_ARABIC_FIELD_LIMIT%
if not defined RL_CPC_ARABIC_COUNTRY_CODE_OFFSET set RL_CPC_ARABIC_COUNTRY_CODE_OFFSET=%RL_CPC_ARABIC_FIELD_OFFSET%
if not defined RL_CPC_ARABIC_NATIONALITY_LIMIT set RL_CPC_ARABIC_NATIONALITY_LIMIT=%RL_CPC_ARABIC_FIELD_LIMIT%
if not defined RL_CPC_ARABIC_NATIONALITY_OFFSET set RL_CPC_ARABIC_NATIONALITY_OFFSET=%RL_CPC_ARABIC_FIELD_OFFSET%
if not defined RL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT set RL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT=%RL_CPC_ARABIC_FIELD_LIMIT%
if not defined RL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET set RL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET=%RL_CPC_ARABIC_FIELD_OFFSET%

echo Archived Arabic results will be saved under %RL_CPC_ARABIC_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Arabic CPC: Country code offset %RL_CPC_ARABIC_COUNTRY_CODE_OFFSET% limit %RL_CPC_ARABIC_COUNTRY_CODE_LIMIT% + Nationality offset %RL_CPC_ARABIC_NATIONALITY_OFFSET% limit %RL_CPC_ARABIC_NATIONALITY_LIMIT% + Country of Residence offset %RL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET% limit %RL_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/arabic/country-code-and-nationality-seventh-25.spec.ts tests/arabic/country-of-residence-seventh-25.spec.ts %*
exit /b %ERRORLEVEL%
