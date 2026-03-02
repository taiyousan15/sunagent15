#!/bin/bash
# TAISUN Agent v2.26.0 - Installation Script
#
# Usage: ./scripts/install.sh
#
# This script:
# 1. Checks prerequisites (Node.js, npm, uv)
# 2. Installs npm dependencies
# 3. Builds MCP servers (dist/ files)
# 4. Installs ALL skills globally via symlinks
# 5. Sets up hooks and required directories
# 6. Guides .env setup
# 7. Verifies installation

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(cat "$REPO_DIR/package.json" | grep '"version"' | head -1 | cut -d'"' -f4)

echo "========================================"
echo "  TAISUN Agent v${VERSION} Installation"
echo "========================================"
echo ""

# ─────────────────────────────────────────
# Step 1: Prerequisites
# ─────────────────────────────────────────
echo "1. Checking prerequisites..."

# Node.js
if ! command -v node &> /dev/null; then
    echo "  [ERROR] Node.js is not installed"
    echo "  → Install from https://nodejs.org/ (v18 or higher)"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "  [WARN] Node.js 18+ recommended (current: $(node -v))"
else
    echo "  [OK] Node.js $(node -v)"
fi

# npm
if ! command -v npm &> /dev/null; then
    echo "  [ERROR] npm is not installed"
    exit 1
fi
echo "  [OK] npm $(npm -v)"

# uv (optional but recommended for some MCPs)
UV_AVAILABLE=false
if command -v uv &> /dev/null || command -v uvx &> /dev/null; then
    UV_AVAILABLE=true
    echo "  [OK] uv/uvx available (enables: open-websearch, gpt-researcher, qdrant, etc.)"
else
    echo "  [SKIP] uv not found — optional MCPs (open-websearch, gpt-researcher, qdrant) will be disabled"
    echo "         To install uv later: curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

# Claude Code
if command -v claude &> /dev/null; then
    echo "  [OK] Claude Code: $(claude --version 2>/dev/null | head -1 || echo 'installed')"
else
    echo "  [WARN] Claude Code not found in PATH"
    echo "         → Install from https://claude.ai/download"
fi

echo ""

# ─────────────────────────────────────────
# Step 2: Install npm dependencies
# ─────────────────────────────────────────
echo "2. Installing npm dependencies..."
cd "$REPO_DIR"
npm install --silent
echo "  [OK] npm install complete"

echo ""

# ─────────────────────────────────────────
# Step 3: Build MCP servers
# ─────────────────────────────────────────
echo "3. Building MCP servers (dist/)..."

# Main proxy MCP
if npm run build 2>/dev/null; then
    echo "  [OK] Main build complete"
else
    echo "  [WARN] Main build had issues — continuing"
fi

# voice-ai MCP server
if [ -f "mcp-servers/voice-ai-mcp-server/package.json" ]; then
    (cd mcp-servers/voice-ai-mcp-server && npm install --silent && npm run build 2>/dev/null) && \
        echo "  [OK] voice-ai MCP built" || \
        echo "  [WARN] voice-ai MCP build failed (requires TWILIO keys)"
fi

# ai-sdr MCP server
if [ -f "mcp-servers/ai-sdr-mcp-server/package.json" ]; then
    (cd mcp-servers/ai-sdr-mcp-server && npm install --silent && npm run build 2>/dev/null) && \
        echo "  [OK] ai-sdr MCP built" || \
        echo "  [WARN] ai-sdr MCP build failed"
fi

# line-bot MCP server
if [ -f "mcp-servers/line-bot-mcp-server/package.json" ]; then
    (cd mcp-servers/line-bot-mcp-server && npm install --silent && npm run build 2>/dev/null) && \
        echo "  [OK] line-bot MCP built" || \
        echo "  [WARN] line-bot MCP build failed (requires LINE keys)"
fi

echo ""

# ─────────────────────────────────────────
# Step 4: Install ALL skills globally (symlinks)
# ─────────────────────────────────────────
echo "4. Installing skills to ~/.claude/skills/ (symlinks — auto-update on git pull)..."

TARGET_SKILLS="$HOME/.claude/skills"
SOURCE_SKILLS="$REPO_DIR/.claude/skills"

mkdir -p "$TARGET_SKILLS"

if [ -d "$SOURCE_SKILLS" ]; then
    INSTALLED=0
    UPDATED=0
    SKIPPED=0

    for skill_dir in "$SOURCE_SKILLS"/*/; do
        skill_name=$(basename "$skill_dir")

        # Skip internal/meta files
        [[ "$skill_name" == "_archived" ]] && continue
        [[ "$skill_name" == "data" ]] && continue
        [[ ! -f "$skill_dir/SKILL.md" ]] && continue

        target="$TARGET_SKILLS/$skill_name"

        # Remove old copy if it exists (not a symlink)
        if [ -d "$target" ] && [ ! -L "$target" ]; then
            rm -rf "$target"
        fi

        # Create symlink
        if [ ! -L "$target" ]; then
            ln -sf "$skill_dir" "$target"
            echo "  [+] $skill_name"
            ((INSTALLED++)) || true
        else
            # Update symlink if pointing to wrong place
            current_target=$(readlink "$target")
            if [ "$current_target" != "$skill_dir" ]; then
                ln -sf "$skill_dir" "$target"
                echo "  [~] $skill_name (updated)"
                ((UPDATED++)) || true
            else
                ((SKIPPED++)) || true
            fi
        fi
    done

    echo ""
    echo "  Skills: ${INSTALLED} installed, ${UPDATED} updated, ${SKIPPED} already linked"
    TOTAL_SKILLS=$(ls -d "$TARGET_SKILLS"/*/  2>/dev/null | wc -l | tr -d ' ')
    echo "  Total in ~/.claude/skills/: ${TOTAL_SKILLS}"
else
    echo "  [ERROR] Skills directory not found: $SOURCE_SKILLS"
fi

echo ""

# ─────────────────────────────────────────
# Step 5: Install agents globally (symlinks)
# ─────────────────────────────────────────
echo "5. Installing agents to ~/.claude/agents/ (symlinks)..."

TARGET_AGENTS="$HOME/.claude/agents"
SOURCE_AGENTS="$REPO_DIR/.claude/agents"

mkdir -p "$TARGET_AGENTS"

if [ -d "$SOURCE_AGENTS" ]; then
    AGENT_INSTALLED=0
    AGENT_UPDATED=0
    AGENT_SKIPPED=0
    for agent_file in "$SOURCE_AGENTS"/*.md; do
        agent_name=$(basename "$agent_file")
        [[ "$agent_name" == "CLAUDE.md" ]] && continue

        target="$TARGET_AGENTS/$agent_name"

        # Remove old copy if it exists (not a symlink)
        if [ -f "$target" ] && [ ! -L "$target" ]; then
            rm -f "$target"
        fi

        if [ ! -L "$target" ]; then
            ln -sf "$agent_file" "$target"
            ((AGENT_INSTALLED++)) || true
        else
            # Always update symlink to ensure latest path
            current_target=$(readlink "$target")
            if [ "$current_target" != "$agent_file" ]; then
                ln -sf "$agent_file" "$target"
                ((AGENT_UPDATED++)) || true
            else
                ((AGENT_SKIPPED++)) || true
            fi
        fi
    done
    TOTAL_AGENTS=$(ls "$TARGET_AGENTS"/*.md 2>/dev/null | wc -l | tr -d ' ')
    echo "  [OK] Agents: ${AGENT_INSTALLED} installed, ${AGENT_UPDATED} updated, ${AGENT_SKIPPED} already linked"
    echo "  Total in ~/.claude/agents/: ${TOTAL_AGENTS}"
fi

echo ""

# ─────────────────────────────────────────
# Step 6: Hooks setup
# ─────────────────────────────────────────
echo "6. Setting up hooks..."

chmod +x "$REPO_DIR"/.claude/hooks/*.sh 2>/dev/null || true
chmod +x "$REPO_DIR"/.claude/hooks/*.js 2>/dev/null || true

mkdir -p "$REPO_DIR/.claude/temp"
mkdir -p "$REPO_DIR/.claude/agent-memory"
mkdir -p "$REPO_DIR/.taisun/memory"

echo "  [OK] Hooks configured"

echo ""

# ─────────────────────────────────────────
# Step 7: .env setup guide
# ─────────────────────────────────────────
echo "7. Environment variables (.env) setup..."

if [ ! -f "$REPO_DIR/.env" ]; then
    echo ""
    echo "  ┌─────────────────────────────────────────────────────────┐"
    echo "  │  .env file not found. Creating from template...         │"
    echo "  └─────────────────────────────────────────────────────────┘"
    cp "$REPO_DIR/.env.example" "$REPO_DIR/.env" 2>/dev/null || touch "$REPO_DIR/.env"
    echo ""
    echo "  REQUIRED (core features):"
    echo "  ┌─────────────────────────────────────────────────────────┐"
    echo "  │  ANTHROPIC_API_KEY=sk-ant-...  (必須)                   │"
    echo "  │  → https://console.anthropic.com/                       │"
    echo "  └─────────────────────────────────────────────────────────┘"
    echo ""
    echo "  OPTIONAL (extra MCPs — skip if not needed):"
    echo "  ┌─────────────────────────────────────────────────────────┐"
    echo "  │  TAVILY_API_KEY      → Web検索 (tavily.com 無料枠あり)  │"
    echo "  │  OPENAI_API_KEY      → gpt-researcher用                 │"
    echo "  │  TWILIO_*            → voice-ai (電話機能)               │"
    echo "  │  LINE_CHANNEL_*      → Line Bot                         │"
    echo "  │  META_ACCESS_TOKEN   → Meta広告                         │"
    echo "  │  APIFY_API_TOKEN     → Apify スクレイピング              │"
    echo "  └─────────────────────────────────────────────────────────┘"
    echo ""
    echo "  → .env を編集して ANTHROPIC_API_KEY を設定してください"
else
    echo "  [OK] .env already exists"
    if grep -q "ANTHROPIC_API_KEY=sk-ant-" "$REPO_DIR/.env" 2>/dev/null; then
        echo "  [OK] ANTHROPIC_API_KEY is set"
    else
        echo "  [WARN] ANTHROPIC_API_KEY not set in .env"
    fi
fi

echo ""

# ─────────────────────────────────────────
# Step 8: Verification
# ─────────────────────────────────────────
echo "8. Verification..."

# Check CLAUDE.md
if [ -f "$REPO_DIR/.claude/CLAUDE.md" ]; then
    echo "  [OK] .claude/CLAUDE.md present"
fi

# Check hooks
HOOK_OK=0
HOOK_MISSING=0
for hook in workflow-sessionstart-injector.js skill-usage-guard.js session-handoff-generator.js; do
    if [ -f "$REPO_DIR/.claude/hooks/$hook" ]; then
        ((HOOK_OK++)) || true
    else
        echo "  [WARN] Hook missing: $hook"
        ((HOOK_MISSING++)) || true
    fi
done
echo "  [OK] Hooks: ${HOOK_OK} present"

# Skill count
SKILL_COUNT=$(ls -d "$TARGET_SKILLS"/*/ 2>/dev/null | wc -l | tr -d ' ')
echo "  [OK] Skills available: ${SKILL_COUNT}"

# Agent count
AGENT_COUNT=$(ls "$TARGET_AGENTS"/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "  [OK] Agents available: ${AGENT_COUNT}"

echo ""
echo "========================================"
echo "  Installation Complete! v${VERSION}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Edit .env → set ANTHROPIC_API_KEY (必須)"
echo "  2. Open Claude Code in this directory"
echo "  3. Run: npm run taisun:diagnose  (動作確認)"
echo ""
echo "Quick commands:"
echo "  /batch         → 大規模並列エージェント実行"
echo "  /research      → Deep Research"
echo "  /mega-research → 6API統合リサーチ"
echo "  /sdd-full      → 完全設計書一式生成"
echo "  /video-agent   → 動画パイプライン"
echo ""
echo "Update:"
echo "  git pull origin main && npm run setup"
echo ""
