param(
    [switch]$Apply,
    [switch]$Purge,
    [switch]$Yes,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

$repoDir = Split-Path -Parent $PSScriptRoot
$coreScript = Join-Path $repoDir 'scripts\uninstall-core.js'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'Node.js is required to run uninstall.'
    exit 1
}

if (-not (Test-Path $coreScript)) {
    Write-Error "Missing uninstall core script: $coreScript"
    exit 1
}

$nodeArgs = @($coreScript, '--repo-dir', $repoDir)

if ($Apply) {
    $nodeArgs += '--apply'
}

if ($Purge) {
    $nodeArgs += '--purge'
}

if ($Yes) {
    $nodeArgs += '--yes'
}

if ($Help) {
    $nodeArgs += '--help'
}

& node @nodeArgs
exit $LASTEXITCODE
