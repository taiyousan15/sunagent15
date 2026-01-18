#!/bin/bash
# TAISUN Agent - Update Script
#
# Usage: ./scripts/update.sh
#
# This script:
# 1. Pulls latest changes
# 2. Updates npm dependencies
# 3. Re-applies Phase 3 Super Memory hooks
# 4. Verifies update

set -e

echo "========================================"
echo "  TAISUN Agent Update"
echo "========================================"
echo ""

# Get current version
OLD_VERSION=$(cat package.json | grep '"version"' | head -1 | cut -d'"' -f4)
echo "Current version: $OLD_VERSION"
echo ""

echo "1. Pulling latest changes..."
git pull origin main || {
    echo "Warning: git pull failed. Continuing with local files..."
}

echo ""
echo "2. Updating npm dependencies..."
npm install

echo ""
echo "3. Setting up Phase 3 Super Memory hooks..."

# Make hooks executable
chmod +x .claude/hooks/*.sh 2>/dev/null || true
chmod +x .claude/hooks/*.js 2>/dev/null || true

# Create required directories
mkdir -p .claude/temp
mkdir -p .taisun/memory

echo "   - Hooks: executable"
echo "   - Directories: created"

echo ""
echo "4. Verifying update..."

# Check version
NEW_VERSION=$(cat package.json | grep '"version"' | head -1 | cut -d'"' -f4)
echo "   - Version: $OLD_VERSION -> $NEW_VERSION"

# Check settings.json
if grep -q "PostToolUse" .claude/settings.json 2>/dev/null; then
    echo "   - Phase 3 hooks: configured"
else
    echo "   - Phase 3 hooks: NOT configured (check .claude/settings.json)"
fi

# Test hook execution
echo ""
echo "5. Testing hooks..."
if echo '{"tool_name":"Test","tool_response":"test"}' | node .claude/hooks/auto-memory-saver.js 2>/dev/null; then
    echo "   - auto-memory-saver.js: OK"
else
    echo "   - auto-memory-saver.js: FAILED"
fi

echo ""
echo "========================================"
echo "  Update Complete!"
echo "========================================"
echo ""

# Show what's new if version changed
if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
    echo "What's new in $NEW_VERSION:"
    if [ -f "RELEASE_v${NEW_VERSION}.md" ]; then
        head -30 "RELEASE_v${NEW_VERSION}.md" | tail -25
    else
        echo "  See CHANGELOG.md for details"
    fi
    echo ""
fi

echo "Phase 3 Super Memory is active!"
echo "  - Auto-save: outputs > 50KB"
echo "  - Block: dangerous commands"
echo "  - Stats: on session exit"
echo ""
