param(
    [Parameter(Mandatory = $true)]
    [string]$RepoRoot
)

$ErrorActionPreference = "Stop"

$sourceMod = Join-Path $RepoRoot "solo-cornucopia"
if (!(Test-Path $sourceMod)) {
    throw "Missing source mod folder: $sourceMod"
}

$distDir = Join-Path $RepoRoot "dist"
if (!(Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

$zipPath = Join-Path $distDir "solo-cornucopia.zip"
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

Compress-Archive -Path $sourceMod -DestinationPath $zipPath
Write-Host "Created package: $zipPath"

