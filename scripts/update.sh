#!/bin/bash
# TAISUN Agent - Update Script
#
# Usage: ./scripts/update.sh
#
# This script:
# 1. Pulls latest changes from origin/main
# 2. Updates npm dependencies
# 3. Rebuilds MCP servers (dist/)
# 4. Updates ALL skill symlinks in ~/.claude/skills/
# 5. Updates agent symlinks in ~/.claude/agents/
# 6. Verifies the installation

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(cat "$REPO_DIR/package.json" | grep '"version"' | head -1 | cut -d'"' -f4)

echo "========================================"
echo "  TAISUN Agent v${VERSION} Update"
echo "========================================"
echo ""

# Check if git repo
if [ ! -d "$REPO_DIR/.git" ]; then
    echo "[ERROR] Not a git repository: $REPO_DIR"
    echo "Please run from the taisun_agent directory"
    exit 1
fi

cd "$REPO_DIR"

# ─────────────────────────────────────────
# Step 1: Pull latest changes
# ─────────────────────────────────────────
echo "1. Pulling latest changes..."
CURRENT_VERSION=$VERSION

git fetch origin
git pull origin main --ff-only || {
    echo "  [WARN] Could not fast-forward. Manual merge may be needed."
    echo "         Run: git pull origin main"
}

NEW_VERSION=$(cat "$REPO_DIR/package.json" | grep '"version"' | head -1 | cut -d'"' -f4)
echo "  [OK] $CURRENT_VERSION -> $NEW_VERSION"

echo ""

# ─────────────────────────────────────────
# Step 2: Update npm dependencies
# ─────────────────────────────────────────
echo "2. Updating npm dependencies..."
npm install --silent
echo "  [OK] npm install complete"

echo ""

# ─────────────────────────────────────────
# Step 3: Rebuild MCP servers
# ─────────────────────────────────────────
echo "3. Rebuilding MCP servers (dist/)..."

if npm run build 2>/dev/null; then
    echo "  [OK] Main build complete"
else
    echo "  [WARN] Main build had issues — continuing"
fi

if [ -f "mcp-servers/voice-ai-mcp-server/package.json" ]; then
    (cd mcp-servers/voice-ai-mcp-server && npm install --silent && npm run build 2>/dev/null) && \
        echo "  [OK] voice-ai MCP rebuilt" || \
        echo "  [WARN] voice-ai MCP build failed (requires TWILIO keys)"
fi

if [ -f "mcp-servers/ai-sdr-mcp-server/package.json" ]; then
    (cd mcp-servers/ai-sdr-mcp-server && npm install --silent && npm run build 2>/dev/null) && \
        echo "  [OK] ai-sdr MCP rebuilt" || \
        echo "  [WARN] ai-sdr MCP build failed"
fi

if [ -f "mcp-servers/line-bot-mcp-server/package.json" ]; then
    (cd mcp-servers/line-bot-mcp-server && npm install --silent && npm run build 2>/dev/null) && \
        echo "  [OK] line-bot MCP rebuilt" || \
        echo "  [WARN] line-bot MCP build failed (requires LINE keys)"
fi

echo ""

# ─────────────────────────────────────────
# Step 4: Update ALL skill symlinks
# ─────────────────────────────────────────
echo "4. Updating skill symlinks in ~/.claude/skills/..."

TARGET_SKILLS="$HOME/.claude/skills"
SOURCE_SKILLS="$REPO_DIR/.claude/skills"

mkdir -p "$TARGET_SKILLS"

if [ -d "$SOURCE_SKILLS" ]; then
    INSTALLED=0
    UPDATED=0
    SKIPPED=0

    for skill_dir in "$SOURCE_SKILLS"/*/; do
        skill_name=$(basename "$skill_dir")

        [[ "$skill_name" == "_archived" ]] && continue
        [[ "$skill_name" == "data" ]] && continue
        [[ ! -f "$skill_dir/SKILL.md" ]] && continue

        target="$TARGET_SKILLS/$skill_name"

        # Remove old copy if it exists (not a symlink)
        if [ -d "$target" ] && [ ! -L "$target" ]; then
            rm -rf "$target"
        fi

        if [ ! -L "$target" ]; then
            ln -sf "$skill_dir" "$target"
            echo "  [+] $skill_name"
            ((INSTALLED++)) || true
        else
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
    echo "  Skills: ${INSTALLED} new, ${UPDATED} updated, ${SKIPPED} already current"
    TOTAL_SKILLS=$(ls -d "$TARGET_SKILLS"/*/ 2>/dev/null | wc -l | tr -d ' ')
    echo "  Total in ~/.claude/skills/: ${TOTAL_SKILLS}"
else
    echo "  [WARN] Skills directory not found: $SOURCE_SKILLS"
fi

echo ""

# ─────────────────────────────────────────
# Step 5: Update agent symlinks
# ─────────────────────────────────────────
echo "5. Updating agent symlinks in ~/.claude/agents/..."

TARGET_AGENTS="$HOME/.claude/agents"
SOURCE_AGENTS="$REPO_DIR/.claude/agents"

mkdir -p "$TARGET_AGENTS"

if [ -d "$SOURCE_AGENTS" ]; then
    AGENT_NEW=0
    AGENT_UPDATED=0
    AGENT_SKIPPED=0
    for agent_file in "$SOURCE_AGENTS"/*.md; do
        agent_name=$(basename "$agent_file")
        [[ "$agent_name" == "CLAUDE.md" ]] && continue

        target="$TARGET_AGENTS/$agent_name"

        if [ -f "$target" ] && [ ! -L "$target" ]; then
            rm -f "$target"
        fi

        if [ ! -L "$target" ]; then
            ln -sf "$agent_file" "$target"
            ((AGENT_NEW++)) || true
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
    echo "  [OK] Agents: ${AGENT_NEW} new, ${AGENT_UPDATED} updated, ${AGENT_SKIPPED} already linked"
    echo "  Total in ~/.claude/agents/: ${TOTAL_AGENTS}"
fi

echo ""

# ─────────────────────────────────────────
# Step 6: Verify
# ─────────────────────────────────────────
echo "6. Verifying..."

SKILL_COUNT=$(ls -d "$TARGET_SKILLS"/*/ 2>/dev/null | wc -l | tr -d ' ')
echo "  [OK] Skills available: ${SKILL_COUNT}"

AGENT_COUNT=$(ls "$TARGET_AGENTS"/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "  [OK] Agents available: ${AGENT_COUNT}"

# Test hook execution
if echo '{"source":"test","cwd":"'"$(pwd)"'"}' | node .claude/hooks/workflow-sessionstart-injector.js 2>/dev/null; then
    echo "  [OK] Hooks: functional"
else
    echo "  [WARN] Hooks: check .claude/hooks/"
fi

echo ""
echo "========================================"
echo "  Update Complete! v${NEW_VERSION}"
echo "========================================"
echo ""
echo "Skills update via symlinks — git pull auto-updates all skills."
echo "Re-run this script only when agents or MCP servers change."
echo ""
