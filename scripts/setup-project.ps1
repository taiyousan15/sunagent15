# TAISUN Agent - プロジェクトセットアップ (Windows)
#
# 別のプロジェクトフォルダでtaisun_agentの機能を使えるようにする。
# .claude/ と .mcp.json を Junction/コピーで反映する。
#
# 使い方:
#   cd C:\Users\you\Projects\MyProject
#   ~\taisun_agent\scripts\setup-project.ps1
#
#   または:
#   .\scripts\setup-project.ps1 C:\Users\you\Projects\MyProject

param(
    [string]$ProjectPath
)

$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────
# taisun_agent のルートを検出
# ─────────────────────────────────────────
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$TAISUN_DIR = Split-Path -Parent $SCRIPT_DIR

# プロジェクトディレクトリ
if ($ProjectPath) {
    if (-not (Test-Path $ProjectPath)) {
        New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
    }
    $PROJECT_DIR = (Resolve-Path $ProjectPath).Path
} else {
    $PROJECT_DIR = (Get-Location).Path
}

# ─────────────────────────────────────────
# 表示ヘルパー
# ─────────────────────────────────────────
function Write-Ok   { param($msg) Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  !!  $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "  ->  $msg" -ForegroundColor Cyan }

# ─────────────────────────────────────────
# 確認
# ─────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TAISUN Agent — プロジェクトセットアップ (Windows)           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  TAISUN:       $TAISUN_DIR"
Write-Host "  プロジェクト: $PROJECT_DIR"
Write-Host ""

# taisun_agent の .claude が存在するか確認
if (-not (Test-Path "$TAISUN_DIR\.claude")) {
    Write-Host "  NG  $TAISUN_DIR\.claude が見つかりません" -ForegroundColor Red
    Write-Host "     先に .\scripts\install.ps1 を実行してください"
    exit 1
}

# ─────────────────────────────────────────
# git init
# ─────────────────────────────────────────
if (-not (Test-Path "$PROJECT_DIR\.git")) {
    git -C $PROJECT_DIR init -q 2>$null
    Write-Ok "Git リポジトリを初期化しました"
} else {
    Write-Ok "Git リポジトリは既に存在します"
}

# ─────────────────────────────────────────
# .claude/ の Junction リンク
# ─────────────────────────────────────────
$CLAUDE_LINK = "$PROJECT_DIR\.claude"

if (Test-Path $CLAUDE_LINK) {
    $item = Get-Item $CLAUDE_LINK
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        Write-Ok ".claude\ は既にリンク済み"
    } else {
        Write-Warn ".claude\ が通常フォルダとして存在します"
        $reply = Read-Host "  バックアップしてリンクしますか？ [y/N]"
        if ($reply -match '^[Yy]$') {
            $backup = "${CLAUDE_LINK}.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
            Move-Item $CLAUDE_LINK $backup
            New-Item -ItemType Junction -Path $CLAUDE_LINK -Target "$TAISUN_DIR\.claude" | Out-Null
            Write-Ok ".claude\ をリンクしました（旧フォルダは $backup に退避）"
        } else {
            Write-Info "スキップしました"
        }
    }
} else {
    New-Item -ItemType Junction -Path $CLAUDE_LINK -Target "$TAISUN_DIR\.claude" | Out-Null
    Write-Ok ".claude\ → $TAISUN_DIR\.claude\"
}

# ─────────────────────────────────────────
# .mcp.json のコピー（Windowsではファイルの symlink は管理者権限が必要なので copy）
# ─────────────────────────────────────────
$MCP_LINK = "$PROJECT_DIR\.mcp.json"

if (Test-Path "$TAISUN_DIR\.mcp.json") {
    if (Test-Path $MCP_LINK) {
        Write-Ok ".mcp.json は既に存在します"
    } else {
        Copy-Item "$TAISUN_DIR\.mcp.json" $MCP_LINK
        Write-Ok ".mcp.json をコピーしました"
        Write-Info "※ Windowsではコピーです。taisun_agent側を更新したら再実行してください"
    }
}

# ─────────────────────────────────────────
# .gitignore に追記
# ─────────────────────────────────────────
$GITIGNORE = "$PROJECT_DIR\.gitignore"
$entries = @(".claude/", ".mcp.json", ".env")
$needsAdd = $false

foreach ($entry in $entries) {
    if (-not (Test-Path $GITIGNORE) -or -not (Select-String -Path $GITIGNORE -Pattern "^$([regex]::Escape($entry))$" -Quiet)) {
        $needsAdd = $true
    }
}

if ($needsAdd) {
    $additions = @("", "# TAISUN Agent")
    foreach ($entry in $entries) {
        if (-not (Test-Path $GITIGNORE) -or -not (Select-String -Path $GITIGNORE -Pattern "^$([regex]::Escape($entry))$" -Quiet)) {
            $additions += $entry
        }
    }
    $additions | Out-File -FilePath $GITIGNORE -Append -Encoding UTF8
    Write-Ok ".gitignore に .claude/ .mcp.json .env を追加しました"
}

# ─────────────────────────────────────────
# 結果表示
# ─────────────────────────────────────────
$SKILL_COUNT = (Get-ChildItem "$env:USERPROFILE\.claude\skills" -Directory -ErrorAction SilentlyContinue).Count
$AGENT_COUNT = (Get-ChildItem "$env:USERPROFILE\.claude\agents" -Filter "*.md" -ErrorAction SilentlyContinue).Count

Write-Host ""
Write-Host "  ┌──────────────┬─────────────────────────────────────────────┐"
Write-Host "  │     項目     │                   状態                       │"
Write-Host "  ├──────────────┼─────────────────────────────────────────────┤"
Write-Host "  │ .git         │ 初期化済み                                   │"
Write-Host "  ├──────────────┼─────────────────────────────────────────────┤"
Write-Host "  │ .claude\     │ → $TAISUN_DIR\.claude\"
Write-Host "  ├──────────────┼─────────────────────────────────────────────┤"
Write-Host "  │ .mcp.json    │ → $TAISUN_DIR\.mcp.json"
Write-Host "  ├──────────────┼─────────────────────────────────────────────┤"
Write-Host "  │ スキル       │ ${SKILL_COUNT}個"
Write-Host "  ├──────────────┼─────────────────────────────────────────────┤"
Write-Host "  │ エージェント │ ${AGENT_COUNT}個"
Write-Host "  └──────────────┴─────────────────────────────────────────────┘"
Write-Host ""
Write-Host "  このフォルダで Claude Code を開くと TAISUN の全機能が使えます。"
Write-Host ""
