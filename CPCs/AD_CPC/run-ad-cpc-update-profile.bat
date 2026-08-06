@echo off
setlocal enabledelayedexpansion

REM Run AD CPC profile update (Country code + Nationality → Save).
REM Usage:
REM   run-ad-cpc-update-profile.bat
REM   run-ad-cpc-update-profile.bat --headed

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Please run this from the AD_CPC folder.
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b %ERRORLEVEL%
  call npx playwright install chromium
  if errorlevel 1 exit /b %ERRORLEVEL%
)

call npm test -- tests/ad-cpc-update-profile.spec.ts %*
exit /b %ERRORLEVEL%
