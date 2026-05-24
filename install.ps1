#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "node is required to run the KalamDB skills installer"
}

& node (Join-Path $RootDir "scripts/install.mjs") @args
exit $LASTEXITCODE