#!/bin/bash
# Workflow Guardian - File Write Guard (Phase 2)
#
# This hook blocks dangerous file writes when workflow is in strict mode.
# Exit code 0: allow, Exit code 1: block

set -e

# Check if workflow state exists
STATE_FILE=".workflow_state.json"

if [ ! -f "$STATE_FILE" ]; then
  # No active workflow, allow
  exit 0
fi

# Check if strict mode is enabled
STRICT=$(cat "$STATE_FILE" | grep -o '"strict":\s*true' || echo "")

if [ -z "$STRICT" ]; then
  # Not in strict mode, allow
  exit 0
fi

# Get the file path from arguments
FILE_PATH="$1"

# Dangerous file patterns to block in strict mode
DANGEROUS_FILES=(
  "\\.env"
  "\\.env\\..*"
  "secrets/"
  "credentials\\.json"
  "config/database\\.yml"
  "\\.git/"
  "\\.workflow_state\\.json"
)

# Check for dangerous file patterns
for pattern in "${DANGEROUS_FILES[@]}"; do
  if echo "$FILE_PATH" | grep -qiE "$pattern"; then
    echo "❌ Workflow Guardian (strict mode): Dangerous file write blocked"
    echo "   Pattern: $pattern"
    echo "   File: $FILE_PATH"
    echo ""
    echo "このファイルは strict mode で書き込みが許可されていません。"
    echo "安全のため、手動で編集してください。"
    exit 1
  fi
done

# Allow write
exit 0
