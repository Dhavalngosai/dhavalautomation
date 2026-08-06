@echo off
setlocal enabledelayedexpansion

REM Verify all Country Code + Nationality values together on TGP Live CPC (paired save).
REM Usage:
REM   run-tgp-country-code-and-nationality.bat
REM   run-tgp-country-code-and-nationality.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the TGP_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

if not defined TGP_CPC_ENGLISH_RESULTS_DIR set TGP_CPC_ENGLISH_RESULTS_DIR=TGP_CPC_English_Results

echo Archived English results will be saved under %TGP_CPC_ENGLISH_RESULTS_DIR%\v{version}\{timestamp}\
echo Running TGP Live CPC Country Code + Nationality verification (all values)...
call npm run test:country-code-and-nationality -- %*
exit /b %ERRORLEVEL%
