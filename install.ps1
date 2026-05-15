# sunagent15 - Remote installer (for irm | iex)
#
# Usage:
#   irm https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install.ps1 | iex
#
# Or with options (PowerShell limitation: piped iex cannot pass args; set env vars first):
#   $env:TAISUN_PROFILE = "minimal"
#   irm https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install.ps1 | iex
#
# What this does:
#   1. Clones the repo into $env:TAISUN_INSTALL_DIR (default: $HOME\.taisun-agent)
#   2. Delegates to scripts\install.ps1
#
# Local checkout users should use `pwsh scripts/install.ps1` directly.

$ErrorActionPreference = 'Stop'

# UTF-8 output for Japanese
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$RepoUrl     = if ($env:TAISUN_REPO_URL)     { $env:TAISUN_REPO_URL }     else { 'https://github.com/taiyousan15/sunagent15.git' }
$InstallDir  = if ($env:TAISUN_INSTALL_DIR)  { $env:TAISUN_INSTALL_DIR }  else { Join-Path $HOME '.taisun-agent' }
$Branch      = if ($env:TAISUN_BRANCH)       { $env:TAISUN_BRANCH }       else { 'main' }
# NOTE: Renamed from $Profile to avoid clobbering the PowerShell automatic variable $PROFILE
#   ref: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_automatic_variables
$SkillProfile = if ($env:TAISUN_PROFILE)     { $env:TAISUN_PROFILE }      else { '' }

# Detect local checkout (script invoked from inside repo, not piped)
$ScriptDir = $null
if ($PSCommandPath) {
    $ScriptDir = Split-Path -Parent $PSCommandPath
}
if ($ScriptDir -and (Test-Path (Join-Path $ScriptDir 'scripts\install.ps1'))) {
    Write-Host "▶ Local checkout detected. Delegating to scripts\install.ps1 ..."
    & (Join-Path $ScriptDir 'scripts\install.ps1') @args
    exit $LASTEXITCODE
}

# Remote install path
Write-Host ""
Write-Host "════════════════════════════════════════════════════"
Write-Host "  taisun_agent - Remote Installer"
Write-Host "════════════════════════════════════════════════════"
Write-Host ""
Write-Host "  Repo:   $RepoUrl"
Write-Host "  Branch: $Branch"
Write-Host "  Target: $InstallDir"
Write-Host ""

# Preflight: git required
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  ❌ git が見つかりません。先に git をインストールしてください。" -ForegroundColor Red
    Write-Host "     winget install Git.Git"
    Write-Host "     または https://git-scm.com/download/win"
    exit 1
}

# Clone or update
if (Test-Path (Join-Path $InstallDir '.git')) {
    Write-Host "▶ 既存のインストールを更新します ..."
    git -C $InstallDir fetch --depth 1 origin $Branch
    git -C $InstallDir checkout $Branch
    git -C $InstallDir reset --hard "origin/$Branch"
} elseif ((Test-Path $InstallDir) -and ((Get-ChildItem -Force $InstallDir | Measure-Object).Count -gt 0)) {
    Write-Host "  ❌ $InstallDir が既に存在し、空ではありません。" -ForegroundColor Red
    Write-Host "     別のディレクトリを `$env:TAISUN_INSTALL_DIR で指定するか、既存を削除してください。"
    exit 1
} else {
    Write-Host "▶ リポジトリをクローン中 ..."
    git clone --depth 1 --branch $Branch $RepoUrl $InstallDir
}

# Build args for delegated installer
$forwardArgs = @()
if ($SkillProfile) { $forwardArgs += '-Profile'; $forwardArgs += $SkillProfile }

Write-Host ""
Write-Host "▶ メインインストーラーに委譲 ..."
Write-Host ""
& (Join-Path $InstallDir 'scripts\install.ps1') @forwardArgs
exit $LASTEXITCODE
