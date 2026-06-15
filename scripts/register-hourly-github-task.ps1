# Register Windows Task Scheduler job: sync to GitHub every 1 hour.
# Run once (may prompt for admin): powershell -ExecutionPolicy Bypass -File scripts/register-hourly-github-task.ps1
# Remove: Unregister-ScheduledTask -TaskName 'DhavalAutomation-GitHubSync' -Confirm:$false

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SyncScript = Join-Path $RepoRoot 'scripts\sync-to-github.ps1'
$TaskName = 'DhavalAutomation-GitHubSync'

if (-not (Test-Path $SyncScript)) {
  Write-Error "Missing sync script: $SyncScript"
}

$Action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$SyncScript`"" `
  -WorkingDirectory $RepoRoot

$StartAt = (Get-Date).AddMinutes(1)
$Trigger = New-ScheduledTaskTrigger `
  -Once `
  -At $StartAt `
  -RepetitionInterval (New-TimeSpan -Hours 1) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$Settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew

$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Principal $Principal `
  -Force | Out-Null

Write-Host "Registered scheduled task: $TaskName"
Write-Host "Runs every 1 hour starting ~1 minute from now."
Write-Host "Log file: $RepoRoot\logs\github-sync.log"
Write-Host "Test now: powershell -ExecutionPolicy Bypass -File `"$SyncScript`""
