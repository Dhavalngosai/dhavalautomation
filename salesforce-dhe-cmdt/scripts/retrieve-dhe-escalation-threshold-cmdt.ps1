<#
.SYNOPSIS
  Retrieves the DHE Escalation Threshold custom metadata type definition and all its records.

.DESCRIPTION
  Requires Salesforce CLI (sf) on PATH and an authenticated default org (or pass -TargetOrg).
  1) Queries DeveloperName from the CMDT SObject.
  2) Writes manifest/generated-dhe-cmdt-records.xml (CustomObject + CustomMetadata members).
  3) Runs sf project retrieve start into force-app/main/default.

  If the type API name differs in your org, set -CmdtApiName (e.g. ns__DHE_Escalation_Threshold__mdt).

.PARAMETER CmdtApiName
  Qualified API name of the custom metadata type (must end with __mdt).

.PARAMETER TargetOrg
  sf CLI org alias or username (sf -o). Omit to use default org.

.PARAMETER ProjectRoot
  Root folder containing sfdx-project.json (parent of manifest/).
#>
param(
  [string] $CmdtApiName = 'DHE_Escalation_Threshold__mdt',
  [string] $TargetOrg = '',
  [string] $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

function Test-SfCli {
  if (-not (Get-Command sf -ErrorAction SilentlyContinue)) {
    throw 'Salesforce CLI (sf) not found. Install from https://developer.salesforce.com/tools/salesforcecli and reopen the terminal.'
  }
}

function Get-CmdtTypePrefix {
  param([string] $ApiName)
  if ($ApiName -notlike '*__mdt') {
    throw "CmdtApiName must end with __mdt (got: $ApiName)"
  }
  return $ApiName.Substring(0, $ApiName.Length - '__mdt'.Length)
}

Test-SfCli

$typePrefix = Get-CmdtTypePrefix -ApiName $CmdtApiName
$sfOrgArgs = @()
if ($TargetOrg) { $sfOrgArgs += @('-o', $TargetOrg) }

Push-Location $ProjectRoot
try {
  $q = "SELECT DeveloperName FROM $CmdtApiName ORDER BY DeveloperName"
  $queryArgs = @('data', 'query', '-q', $q, '--json') + $sfOrgArgs
  $raw = & sf @queryArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "SOQL failed. Is ``$CmdtApiName`` correct?`n$raw"
  }
  $json = $raw | Out-String | ConvertFrom-Json
  if (-not $json.result -or -not $json.result.records) {
    throw "No rows returned for $CmdtApiName. Verify object API name and permissions."
  }

  $memberLines = foreach ($r in $json.result.records) {
    $dev = [string]$r.DeveloperName
    if (-not $dev) { continue }
    "    <members>$typePrefix.$dev</members>"
  }
  if (-not $memberLines) {
    throw 'No DeveloperName values found on CMDT rows.'
  }

  $manifestDir = Join-Path $ProjectRoot 'manifest'
  if (-not (Test-Path $manifestDir)) { New-Item -ItemType Directory -Path $manifestDir | Out-Null }

  $outPath = Join-Path $manifestDir 'generated-dhe-cmdt-records.xml'
  $xml = @"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <types>
    <members>$CmdtApiName</members>
    <name>CustomObject</name>
  </types>
  <types>
$($memberLines -join "`n")
    <name>CustomMetadata</name>
  </types>
  <version>62.0</version>
</Package>
"@
  Set-Content -Path $outPath -Value $xml -Encoding UTF8
  Write-Host "Wrote $outPath ($($json.result.totalSize) record(s))"

  $retrieveArgs = @('project', 'retrieve', 'start', '-x', $outPath, '--wait', '10') + $sfOrgArgs
  & sf @retrieveArgs
  if ($LASTEXITCODE -ne 0) {
    throw 'sf project retrieve start failed.'
  }
}
finally {
  Pop-Location
}
