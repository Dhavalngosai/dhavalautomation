@echo off
REM One-time: connect this folder to https://github.com/Dhavalngosai/dhavalautomation
setlocal EnableExtensions
cd /d "%~dp0"

set "GIT_CMD=%ProgramFiles%\Git\cmd\git.exe"
if not exist "%GIT_CMD%" set "GIT_CMD=%~dp0.tools\mingit\cmd\git.exe"
if not exist "%GIT_CMD%" (
  echo ERROR: Git not found. Install from https://git-scm.com/ or run: winget install Git.Git
  exit /b 1
)

if not exist ".git" (
  echo Initializing git repository...
  "%GIT_CMD%" init
  "%GIT_CMD%" branch -M main
)

"%GIT_CMD%" remote remove origin 2>nul
"%GIT_CMD%" remote add origin https://github.com/Dhavalngosai/dhavalautomation.git
echo Remote origin set to GitHub.

echo.
echo Fetching remote main...
"%GIT_CMD%" fetch origin main 2>nul

echo Staging files ^(.env is ignored^)...
"%GIT_CMD%" add -A
"%GIT_CMD%" status --short

echo.
echo Committing...
"%GIT_CMD%" commit -m "Sync local workspace with DHE Playwright automation updates" 2>nul
if errorlevel 1 echo No new commit or commit skipped.

echo.
echo Merging remote history if present...
"%GIT_CMD%" pull origin main --allow-unrelated-histories --no-edit 2>nul

echo.
echo Pushing to GitHub ^(sign in if prompted^)...
"%GIT_CMD%" push -u origin main

echo.
echo To enable auto-commit every 30 minutes, run:
echo   powershell -ExecutionPolicy Bypass -File scripts\register-git-sync-task.ps1
echo.
pause
