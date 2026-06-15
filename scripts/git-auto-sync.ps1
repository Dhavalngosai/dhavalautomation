# Auto-commit and push changes every run (intended for 30-minute scheduled task).
# Skips .env and other ignored files. Logs to logs/git-auto-sync.log
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Continue'
$logDir = Join-Path $RepoRoot 'logs'
$logFile = Join-Path $logDir 'git-auto-sync.log'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-Log([string]$Message) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
  Add-Content -Path $logFile -Value $line
  Write-Output $line
}

$gitCandidates = @(
  (Join-Path $env:ProgramFiles 'Git\cmd\git.exe'),
  (Join-Path $RepoRoot '.tools\mingit\cmd\git.exe'),
  (Get-Command git -ErrorAction SilentlyContinue).Source
) | Where-Object { $_ -and (Test-Path $_) }
$git = $gitCandidates | Select-Object -First 1
if (-not $git) {
  Write-Log 'ERROR: git not found'
  exit 1
}

Set-Location $RepoRoot

if (-not (Test-Path (Join-Path $RepoRoot '.git'))) {
  Write-Log 'ERROR: not a git repository'
  exit 1
}

$branch = & $git rev-parse --abbrev-ref HEAD 2>$null
if (-not $branch) { $branch = 'main' }

& $git add -A 2>&1 | Out-Null
$status = & $git status --porcelain 2>&1
if (-not $status) {
  Write-Log "No changes on branch $branch"
  exit 0
}

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$commitMsg = "Auto-sync: workspace changes $timestamp"
& $git commit -m $commitMsg 2>&1 | ForEach-Object { Write-Log $_ }

$push = & $git push origin $branch 2>&1
$push | ForEach-Object { Write-Log $_ }
if ($LASTEXITCODE -ne 0) {
  Write-Log "WARN: push failed (check GitHub login). Commit saved locally on $branch"
  exit 1
}

Write-Log "Pushed to origin/$branch"
exit 0
