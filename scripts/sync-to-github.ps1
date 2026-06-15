# Sync local changes to GitHub (commit + push when there are changes).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/sync-to-github.ps1
# Requires: git remote "origin" -> https://github.com/Dhavalngosai/dhavalautomation.git
# Auth: GitHub CLI (`gh auth login`) or Git Credential Manager on first push.

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

$LogDir = Join-Path $RepoRoot 'logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$LogFile = Join-Path $LogDir 'github-sync.log'

function Write-Log([string]$Message) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
  Add-Content -Path $LogFile -Value $line
  Write-Host $line
}

if (-not (Test-Path (Join-Path $RepoRoot '.git'))) {
  Write-Log 'ERROR: Not a git repository. Run: git init && git remote add origin https://github.com/Dhavalngosai/dhavalautomation.git'
  exit 1
}

$remote = git remote get-url origin 2>$null
if (-not $remote) {
  Write-Log 'ERROR: No origin remote. Run: git remote add origin https://github.com/Dhavalngosai/dhavalautomation.git'
  exit 1
}

# Block accidental commit of secrets even if .gitignore is wrong
$stagedSecrets = git status --porcelain 2>$null | Select-String -Pattern '(^|\s)\.env$|auth\.json'
if ($stagedSecrets) {
  Write-Log 'ERROR: .env or auth.json would be committed. Fix .gitignore before syncing.'
  exit 1
}

$branch = 'main'
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$null = git rev-parse --verify HEAD 2>$null
$hasCommits = ($LASTEXITCODE -eq 0)
if ($hasCommits) {
  $shown = (git branch --show-current 2>$null).Trim()
  if ($shown) { $branch = $shown }
} else {
  git checkout -B $branch 2>$null | Out-Null
}
$ErrorActionPreference = $prevEap

$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
git fetch origin $branch 2>$null | Out-Null
$ErrorActionPreference = $prevEap
if ($LASTEXITCODE -ne 0) {
  Write-Log "Note: fetch skipped or failed (first push to empty remote is OK)."
}

$changes = git status --porcelain
if (-not $changes) {
  Write-Log "No local changes on branch '$branch'. Skipping commit."
  git push -u origin $branch 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Log "Push OK (branch up to date)." }
  exit 0
}

Write-Log "Changes detected on '$branch'. Committing..."
git add -A

$secretCheck = git diff --cached --name-only | Select-String -Pattern '^\.env$|^auth\.json$'
if ($secretCheck) {
  git reset HEAD -- .env auth.json 2>$null | Out-Null
  Write-Log 'WARN: Unstaged .env / auth.json from commit.'
}

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$commitMsg = "chore: auto-sync $timestamp"
git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) {
  Write-Log 'ERROR: git commit failed.'
  exit 1
}

Write-Log 'Pushing to origin...'
git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
  Write-Log 'ERROR: git push failed. Run `gh auth login` or sign in via Git Credential Manager.'
  exit 1
}

Write-Log 'Sync complete.'
