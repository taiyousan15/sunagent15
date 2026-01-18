#!/bin/bash
# TAISUN Agent v2.4.1 - Installation Script
#
# Usage: ./scripts/install.sh
#
# This script:
# 1. Installs npm dependencies
# 2. Sets up Phase 3 Super Memory hooks
# 3. Verifies installation

set -e

echo "========================================"
echo "  TAISUN Agent v2.4.1 Installation"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 18+ first"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Warning: Node.js 18+ is recommended (current: $(node -v))"
fi

echo "1. Installing npm dependencies..."
npm install

echo ""
echo "2. Setting up Phase 3 Super Memory hooks..."

# Make hooks executable
chmod +x .claude/hooks/*.sh 2>/dev/null || true
chmod +x .claude/hooks/*.js 2>/dev/null || true

# Create required directories
mkdir -p .claude/temp
mkdir -p .taisun/memory

echo "   - Hooks: executable"
echo "   - Directories: created"

echo ""
echo "3. Verifying installation..."

# Check version
VERSION=$(cat package.json | grep '"version"' | head -1 | cut -d'"' -f4)
echo "   - Version: $VERSION"

# Check settings.json
if grep -q "PostToolUse" .claude/settings.json 2>/dev/null; then
    echo "   - Phase 3 hooks: configured"
else
    echo "   - Phase 3 hooks: NOT configured (check .claude/settings.json)"
fi

# Check auto-memory config
if [ -f "config/proxy-mcp/auto-memory.json" ]; then
    echo "   - Auto-memory config: present"
else
    echo "   - Auto-memory config: NOT found"
fi

# Test hook execution
echo ""
echo "4. Testing hooks..."
if echo '{"tool_name":"Test","tool_response":"test"}' | node .claude/hooks/auto-memory-saver.js 2>/dev/null; then
    echo "   - auto-memory-saver.js: OK"
else
    echo "   - auto-memory-saver.js: FAILED"
fi

echo ""
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Read docs/SUPER_MEMORY_README.md"
echo "  2. Start using TAISUN Agent"
echo ""
echo "Phase 3 Super Memory features:"
echo "  - Auto-save outputs > 50KB"
echo "  - Block dangerous commands"
echo "  - Session statistics on exit"
echo ""
echo "Estimated savings:"
echo "  - Context: 97% reduction"
echo "  - Cost: 99.5% reduction"
echo "  - Annual: $1,130+"
echo ""
