# Run GitHub sync every hour in this terminal (alternative to Task Scheduler).
# Stop with Ctrl+C. Usage: powershell -ExecutionPolicy Bypass -File scripts/run-hourly-github-sync-loop.ps1

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SyncScript = Join-Path $RepoRoot 'scripts\sync-to-github.ps1'

Write-Host 'Hourly GitHub sync loop started. Press Ctrl+C to stop.'
while ($true) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File $SyncScript
  Start-Sleep -Seconds 3600
}
