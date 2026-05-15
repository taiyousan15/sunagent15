# taisun_agent - Verified release installer (SHA256-checked archive)
#
# Usage:
#   irm https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install-release.ps1 | iex
#
# Or with explicit version:
#   $env:TAISUN_VERSION = "v2.53.3"
#   irm https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install-release.ps1 | iex
#
# What this does (SECURE PATH — recommended):
#   1. Resolves target version (latest release if not specified)
#   2. Downloads taisun_agent-VERSION.zip and .sha256 from GitHub Releases
#   3. Verifies SHA256 (aborts on mismatch)
#   4. Extracts to $env:TAISUN_INSTALL_DIR (default: ~\.taisun-agent)
#   5. Delegates to scripts\install.ps1
#
# This is the SECURE alternative to install.ps1 (which uses git clone of HEAD).

$ErrorActionPreference = 'Stop'

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Repo        = if ($env:TAISUN_REPO)         { $env:TAISUN_REPO }         else { 'taiyousan15/sunagent15' }
$InstallDir  = if ($env:TAISUN_INSTALL_DIR)  { $env:TAISUN_INSTALL_DIR }  else { Join-Path $HOME '.taisun-agent' }
$Version     = if ($env:TAISUN_VERSION)      { $env:TAISUN_VERSION }      else { '' }
# NOTE: Renamed from $Profile to avoid clobbering the PowerShell automatic variable $PROFILE
#   ref: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_automatic_variables
$SkillProfile = if ($env:TAISUN_PROFILE)     { $env:TAISUN_PROFILE }      else { '' }

Write-Host ""
Write-Host "════════════════════════════════════════════════════"
Write-Host "  taisun_agent - Verified Release Installer"
Write-Host "════════════════════════════════════════════════════"
Write-Host ""

# Resolve latest version if not specified
if (-not $Version) {
    Write-Host "▶ 最新リリースを取得中 ..."
    try {
        $latest = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -UseBasicParsing
        $Version = $latest.tag_name
    } catch {
        Write-Host "  ❌ 最新リリースの取得に失敗しました。" -ForegroundColor Red
        Write-Host "     `$env:TAISUN_VERSION = 'v2.53.3' のように明示してください。"
        exit 1
    }
}

# Strip leading 'v' for package name (cd.yml uses VERSION without v prefix)
$pkgVersion = $Version -replace '^v', ''
$pkgName    = "taisun_agent-$pkgVersion"
$archive    = "$pkgName.zip"
$shaFile    = "$pkgName.sha256"
$baseUrl    = "https://github.com/$Repo/releases/download/$Version"

Write-Host "  Repo:    $Repo"
Write-Host "  Version: $Version"
Write-Host "  Target:  $InstallDir"
Write-Host ""

# Working directory
$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("taisun-rel-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
try {
    # Download
    Write-Host "▶ アーカイブをダウンロード中 ..."
    $archivePath = Join-Path $tmpDir $archive
    $shaPath     = Join-Path $tmpDir $shaFile
    Invoke-WebRequest -Uri "$baseUrl/$archive"  -OutFile $archivePath -UseBasicParsing
    Invoke-WebRequest -Uri "$baseUrl/$shaFile"  -OutFile $shaPath     -UseBasicParsing

    # Verify SHA256
    Write-Host "▶ SHA256 検証中 ..."
    $expected = (Get-Content $shaPath | Where-Object { $_ -match [regex]::Escape($archive) } | Select-Object -First 1) -replace '\s.*$', ''
    if (-not $expected) {
        Write-Host "  ❌ .sha256 ファイルから期待値を取得できませんでした。" -ForegroundColor Red
        exit 1
    }
    $actual = (Get-FileHash -Algorithm SHA256 -Path $archivePath).Hash.ToLower()
    if ($expected.ToLower() -ne $actual.ToLower()) {
        Write-Host "  ❌ SHA256 不一致！配布物が改ざんされている可能性があります。" -ForegroundColor Red
        Write-Host "     Expected: $expected"
        Write-Host "     Actual:   $actual"
        exit 1
    }
    Write-Host "  ✅ SHA256 検証 OK"

    # Prepare install dir
    if ((Test-Path $InstallDir) -and ((Get-ChildItem -Force $InstallDir | Measure-Object).Count -gt 0)) {
        Write-Host "  ❌ $InstallDir が既に存在し、空ではありません。" -ForegroundColor Red
        Write-Host "     `$env:TAISUN_INSTALL_DIR で別ディレクトリを指定するか、既存を削除してください。"
        exit 1
    }
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

    # Extract (zip contains pkgName/ as top-level dir; flatten one level)
    Write-Host "▶ アーカイブを展開中 ..."
    $extractTmp = Join-Path $tmpDir 'extract'
    Expand-Archive -Path $archivePath -DestinationPath $extractTmp -Force
    $innerDir = Join-Path $extractTmp $pkgName
    if (Test-Path $innerDir) {
        Get-ChildItem -Path $innerDir -Force | Move-Item -Destination $InstallDir -Force
    } else {
        Get-ChildItem -Path $extractTmp -Force | Move-Item -Destination $InstallDir -Force
    }

    # Delegate
    Write-Host ""
    Write-Host "▶ メインインストーラーに委譲 ..."
    Write-Host ""
    $forwardArgs = @()
    if ($SkillProfile) { $forwardArgs += '-Profile'; $forwardArgs += $SkillProfile }
    & (Join-Path $InstallDir 'scripts\install.ps1') @forwardArgs
    exit $LASTEXITCODE
} finally {
    Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
}
