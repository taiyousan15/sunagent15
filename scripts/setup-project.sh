#!/bin/bash
# TAISUN Agent - プロジェクトセットアップ
#
# 別のプロジェクトフォルダでtaisun_agentの機能を使えるようにする。
# .claude/ と .mcp.json をシンボリックリンクで反映する。
#
# 使い方:
#   cd /path/to/your/project
#   ~/taisun_agent/scripts/setup-project.sh
#
#   または:
#   bash ~/taisun_agent/scripts/setup-project.sh /path/to/your/project

set -e

# ─────────────────────────────────────────
# taisun_agent のルートを検出
# ─────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TAISUN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# プロジェクトディレクトリ（引数があればそれを使う、なければカレント）
if [ -n "$1" ]; then
    PROJECT_DIR="$1"
    mkdir -p "$PROJECT_DIR"
else
    PROJECT_DIR="$(pwd)"
fi

PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

# ─────────────────────────────────────────
# 表示ヘルパー
# ─────────────────────────────────────────
ok()   { echo "  ✅ $1"; }
warn() { echo "  ⚠️  $1"; }
info() { echo "  ℹ️  $1"; }

# ─────────────────────────────────────────
# 確認
# ─────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   TAISUN Agent — プロジェクトセットアップ                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  TAISUN:    $TAISUN_DIR"
echo "  プロジェクト: $PROJECT_DIR"
echo ""

# taisun_agent の .claude が存在するか確認
if [ ! -d "$TAISUN_DIR/.claude" ]; then
    echo "  ❌ $TAISUN_DIR/.claude が見つかりません"
    echo "     先に ~/taisun_agent/scripts/install.sh を実行してください"
    exit 1
fi

# ─────────────────────────────────────────
# git init（まだ初期化されていなければ）
# ─────────────────────────────────────────
if [ ! -d "$PROJECT_DIR/.git" ]; then
    git -C "$PROJECT_DIR" init -q
    ok "Git リポジトリを初期化しました"
else
    ok "Git リポジトリは既に存在します"
fi

# ─────────────────────────────────────────
# .claude/ のシンボリックリンク
# ─────────────────────────────────────────
CLAUDE_LINK="$PROJECT_DIR/.claude"

if [ -L "$CLAUDE_LINK" ]; then
    CURRENT=$(readlink "$CLAUDE_LINK")
    if [ "$CURRENT" = "$TAISUN_DIR/.claude" ]; then
        ok ".claude/ は既にリンク済み"
    else
        ln -sf "$TAISUN_DIR/.claude" "$CLAUDE_LINK"
        ok ".claude/ のリンク先を更新しました"
    fi
elif [ -d "$CLAUDE_LINK" ]; then
    warn ".claude/ が通常フォルダとして存在します"
    warn "既存の .claude/ をバックアップしてからリンクしますか？ [y/N]"
    read -r REPLY
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
        mv "$CLAUDE_LINK" "${CLAUDE_LINK}.backup.$(date +%Y%m%d%H%M%S)"
        ln -sf "$TAISUN_DIR/.claude" "$CLAUDE_LINK"
        ok ".claude/ をリンクしました（旧フォルダはバックアップ済み）"
    else
        info "スキップしました"
    fi
else
    ln -sf "$TAISUN_DIR/.claude" "$CLAUDE_LINK"
    ok ".claude/ → $TAISUN_DIR/.claude"
fi

# ─────────────────────────────────────────
# .mcp.json のシンボリックリンク
# ─────────────────────────────────────────
MCP_LINK="$PROJECT_DIR/.mcp.json"

if [ -f "$TAISUN_DIR/.mcp.json" ]; then
    if [ -L "$MCP_LINK" ]; then
        ok ".mcp.json は既にリンク済み"
    elif [ -f "$MCP_LINK" ]; then
        warn ".mcp.json が既に存在します（上書きしません）"
        info "手動で削除してから再実行するか、以下を実行:"
        info "  ln -sf $TAISUN_DIR/.mcp.json $MCP_LINK"
    else
        ln -sf "$TAISUN_DIR/.mcp.json" "$MCP_LINK"
        ok ".mcp.json → $TAISUN_DIR/.mcp.json"
    fi
fi

# ─────────────────────────────────────────
# .gitignore に追記（リンク先を追跡しないように）
# ─────────────────────────────────────────
GITIGNORE="$PROJECT_DIR/.gitignore"
NEEDS_ADD=false

for entry in ".claude/" ".mcp.json" ".env"; do
    if [ ! -f "$GITIGNORE" ] || ! grep -qxF "$entry" "$GITIGNORE"; then
        NEEDS_ADD=true
    fi
done

if [ "$NEEDS_ADD" = true ]; then
    {
        echo ""
        echo "# TAISUN Agent（シンボリックリンク・設定ファイル）"
        [ ! -f "$GITIGNORE" ] || ! grep -qxF ".claude/" "$GITIGNORE" && echo ".claude/"
        [ ! -f "$GITIGNORE" ] || ! grep -qxF ".mcp.json" "$GITIGNORE" && echo ".mcp.json"
        [ ! -f "$GITIGNORE" ] || ! grep -qxF ".env" "$GITIGNORE" && echo ".env"
    } >> "$GITIGNORE"
    ok ".gitignore に .claude/ .mcp.json .env を追加しました"
fi

# ─────────────────────────────────────────
# 結果表示
# ─────────────────────────────────────────
SKILL_COUNT=$(ls -d "$HOME/.claude/skills"/*/ 2>/dev/null | wc -l | tr -d ' ')
AGENT_COUNT=$(ls "$HOME/.claude/agents"/*.md 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "  ┌──────────────┬─────────────────────────────────────────────┐"
echo "  │     項目     │                   状態                       │"
echo "  ├──────────────┼─────────────────────────────────────────────┤"
echo "  │ .git         │ 初期化済み                                   │"
echo "  ├──────────────┼─────────────────────────────────────────────┤"
printf "  │ .claude/     │ → %-40s│\n" "$TAISUN_DIR/.claude/"
echo "  ├──────────────┼─────────────────────────────────────────────┤"
printf "  │ .mcp.json    │ → %-40s│\n" "$TAISUN_DIR/.mcp.json"
echo "  ├──────────────┼─────────────────────────────────────────────┤"
printf "  │ スキル       │ %-43s│\n" "${SKILL_COUNT}個"
echo "  ├──────────────┼─────────────────────────────────────────────┤"
printf "  │ エージェント │ %-43s│\n" "${AGENT_COUNT}個"
echo "  └──────────────┴─────────────────────────────────────────────┘"
echo ""
echo "  このフォルダで Claude Code を開くと TAISUN の全機能が使えます。"
echo ""
