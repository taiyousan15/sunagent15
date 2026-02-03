#!/bin/bash
# TAISUN Agent v2.5.0 - Installation Script
#
# Usage: ./scripts/install.sh
#
# This script:
# 1. Installs npm dependencies
# 2. Sets up 7-Layer Defense System
# 3. Verifies installation

set -e

echo "========================================"
echo "  TAISUN Agent v2.5.0 Installation"
echo "  7-Layer Fidelity Defense System"
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
echo "2. Setting up 7-Layer Defense System..."

# Make hooks executable
chmod +x .claude/hooks/*.sh 2>/dev/null || true
chmod +x .claude/hooks/*.js 2>/dev/null || true

# Create required directories
mkdir -p .claude/temp
mkdir -p .taisun/memory

# List of required hook files
REQUIRED_HOOKS=(
    "auto-memory-saver.js"
    "session-continue-guard.js"
    "skill-usage-guard.js"
    "file-creation-guard.js"
    "workflow-state-manager.js"
    "workflow-fidelity-guard.js"
    "deviation-approval-guard.js"
    "workflow-sessionstart-injector.js"
    "session-handoff-generator.js"
    "violation-recorder.js"
    "workflow-guard-bash.sh"
    "workflow-guard-write.sh"
)

echo "   Checking hooks..."
for hook in "${REQUIRED_HOOKS[@]}"; do
    if [ -f ".claude/hooks/$hook" ]; then
        echo "   - $hook: OK"
    else
        echo "   - $hook: MISSING"
    fi
done

echo ""
echo "3. Installing Claude Code Skills to global directory..."

# Install skills to ~/.claude/skills/
TARGET_SKILLS="$HOME/.claude/skills"
SOURCE_SKILLS=".claude/skills"

if [ -d "$SOURCE_SKILLS" ]; then
    mkdir -p "$TARGET_SKILLS"

    # Skills to install globally
    SKILLS_TO_INSTALL=(
        "sdd-req100"
        "sdd-adr"
        "sdd-design"
        "sdd-full"
        "sdd-guardrails"
        "sdd-runbook"
        "sdd-slo"
        "sdd-tasks"
        "sdd-threat"
        "gpt-researcher"
        "research"
        "dual-ai-review"
        "taiyo-analyzer"
        "lp-analysis"
        "nanobanana-pro"
    )

    INSTALLED=0
    for skill in "${SKILLS_TO_INSTALL[@]}"; do
        if [ -d "$SOURCE_SKILLS/$skill" ]; then
            if [ ! -d "$TARGET_SKILLS/$skill" ] || [ "$SOURCE_SKILLS/$skill/SKILL.md" -nt "$TARGET_SKILLS/$skill/SKILL.md" ] 2>/dev/null; then
                cp -R "$SOURCE_SKILLS/$skill" "$TARGET_SKILLS/"
                echo "   - $skill: installed"
                ((INSTALLED++))
            else
                echo "   - $skill: already up to date"
            fi
        fi
    done

    echo "   Total skills installed/updated: $INSTALLED"
else
    echo "   Warning: Skills directory not found"
fi

echo ""
echo "4. Verifying installation..."

# Check version
VERSION=$(cat package.json | grep '"version"' | head -1 | cut -d'"' -f4)
echo "   - Version: $VERSION"

# Check settings.json for 7-layer defense
if grep -q "7-Layer Defense" .claude/settings.json 2>/dev/null; then
    echo "   - 7-Layer Defense: configured"
else
    echo "   - 7-Layer Defense: NOT configured (check .claude/settings.json)"
fi

# Check CLAUDE.md for contract
if grep -q "WORKFLOW FIDELITY CONTRACT" .claude/CLAUDE.md 2>/dev/null; then
    echo "   - Fidelity Contract: present"
else
    echo "   - Fidelity Contract: NOT found"
fi

# Check mistakes.md
if [ -f ".claude/hooks/mistakes.md" ]; then
    echo "   - Mistakes log: present"
else
    echo "   - Mistakes log: NOT found"
fi

# Test hook execution
echo ""
echo "5. Testing hooks..."
if echo '{"source":"test","cwd":"'$(pwd)'"}' | node .claude/hooks/workflow-sessionstart-injector.js 2>/dev/null; then
    echo "   - workflow-sessionstart-injector.js: OK"
else
    echo "   - workflow-sessionstart-injector.js: FAILED"
fi

if echo '{"prompt":"test"}' | node .claude/hooks/skill-usage-guard.js 2>/dev/null; then
    echo "   - skill-usage-guard.js: OK"
else
    echo "   - skill-usage-guard.js: FAILED"
fi

echo ""
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo ""
echo "7-Layer Defense System:"
echo "  Layer 0: CLAUDE.md Contract (absolute rules)"
echo "  Layer 1: SessionStart State Injection"
echo "  Layer 2: Permission Gate (phase restrictions)"
echo "  Layer 3: Read-before-Write enforcement"
echo "  Layer 4: Baseline Lock (script protection)"
echo "  Layer 5: Skill Evidence (skill usage tracking)"
echo "  Layer 6: Deviation Approval (pre-approval required)"
echo ""
echo "Features:"
echo "  - Physical blocking (exit code 2)"
echo "  - .workflow_state.json state management"
echo "  - SESSION_HANDOFF.md auto-generation"
echo "  - mistakes.md violation logging"
echo ""
echo "Installed Skills (available in any project):"
echo "  /sdd-req100  - 100点満点の要件定義を作成"
echo "  /sdd-full    - 完全なSDD (設計書一式) を作成"
echo "  /research    - Deep Research"
echo "  /dual-ai-review - AI Review"
echo ""
echo "Next steps:"
echo "  1. Read .claude/CLAUDE.md for the contract"
echo "  2. Use 'npm run workflow:start' for important workflows"
echo "  3. All deviations require user approval"
echo ""
