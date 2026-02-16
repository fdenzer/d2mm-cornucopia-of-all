param(
    [Parameter(Mandatory = $true)]
    [string]$RepoRoot,
    [Parameter(Mandatory = $true)]
    [string]$D2RMMModsPath
)

$ErrorActionPreference = "Stop"

$sourceMod = Join-Path $RepoRoot "solo-cornucopia"
if (!(Test-Path $sourceMod)) {
    throw "Missing source mod folder: $sourceMod"
}

$targetMod = Join-Path $D2RMMModsPath "solo-cornucopia"
if (!(Test-Path $D2RMMModsPath)) {
    throw "D2RMM mods path does not exist: $D2RMMModsPath"
}

if (Test-Path $targetMod) {
    Remove-Item -Recurse -Force $targetMod
}

Copy-Item -Recurse -Force $sourceMod $targetMod
Write-Host "Installed solo-cornucopia to: $targetMod"

