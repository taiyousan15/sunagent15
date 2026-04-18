#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CORE_SCRIPT="$REPO_DIR/scripts/uninstall-core.js"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required to run uninstall." >&2
  exit 1
fi

if [ ! -f "$CORE_SCRIPT" ]; then
  echo "Error: Missing uninstall core script: $CORE_SCRIPT" >&2
  exit 1
fi

node "$CORE_SCRIPT" --repo-dir "$REPO_DIR" "$@"
