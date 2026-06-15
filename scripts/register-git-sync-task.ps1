# Register Windows Scheduled Task: commit + push every 30 minutes.
# Run once from an elevated PowerShell: 
#   powershell -ExecutionPolicy Bypass -File scripts\register-git-sync-task.ps1
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$syncScript = Join-Path $RepoRoot 'scripts\git-auto-sync.ps1'
$taskName = 'DhavalAutomation-GitAutoSync'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$syncScript`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Auto commit and push dhavalautomation every 30 minutes' | Out-Null

Write-Host "Scheduled task registered: $taskName"
Write-Host "Runs every 30 minutes. Log: $RepoRoot\logs\git-auto-sync.log"
Write-Host "Remove with: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
