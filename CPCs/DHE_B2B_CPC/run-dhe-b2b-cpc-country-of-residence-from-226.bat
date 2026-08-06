@echo off
setlocal enabledelayedexpansion

REM Run offset+N Country of Residence* loop for DHE B2B CPC (default: from-226 (226-end), offset=225, to-end).
REM Usage:
REM   run-dhe-b2b-cpc-country-of-residence-from-226.bat
REM   run-dhe-b2b-cpc-country-of-residence-from-226.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the DHE_B2B_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined DHE_B2B_CPC_FIELD_LIMIT set DHE_B2B_CPC_FIELD_LIMIT=999999
if not defined DHE_B2B_CPC_FIELD_OFFSET set DHE_B2B_CPC_FIELD_OFFSET=225
if not defined DHE_B2B_CPC_ENGLISH_RESULTS_DIR set DHE_B2B_CPC_ENGLISH_RESULTS_DIR=DHE_B2B_CPC_English_Results
if not defined DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_LIMIT set DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_LIMIT=%DHE_B2B_CPC_FIELD_LIMIT%
if not defined DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_OFFSET set DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_OFFSET=%DHE_B2B_CPC_FIELD_OFFSET%

echo Archived English results will be saved under %DHE_B2B_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running Country of Residence offset %DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_OFFSET% limit %DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_LIMIT%...
call npm test -- tests/country-of-residence-from-226.spec.ts %*
exit /b %ERRORLEVEL%
