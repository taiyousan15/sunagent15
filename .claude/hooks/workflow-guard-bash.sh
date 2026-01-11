#!/bin/bash
# Workflow Guardian - Bash Command Guard (Phase 2)
#
# This hook blocks dangerous bash commands when workflow is in strict mode.
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

# Get the command from arguments
COMMAND="$@"

# Dangerous patterns to block in strict mode
DANGEROUS_PATTERNS=(
  "rm -rf"
  "rm -fr"
  "git push --force"
  "git push -f"
  "git reset --hard"
  "DROP TABLE"
  "TRUNCATE"
  "DELETE FROM.*WHERE"
  "chmod 777"
  "sudo"
  "kill -9"
  "\\.env"
  "secrets/"
)

# Check for dangerous patterns
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qiE "$pattern"; then
    echo "❌ Workflow Guardian (strict mode): Dangerous command blocked"
    echo "   Pattern: $pattern"
    echo "   Command: $COMMAND"
    echo ""
    echo "このコマンドは strict mode で許可されていません。"
    echo "安全のため、手動で実行してください。"
    exit 1
  fi
done

# Allow command
exit 0
