#!/bin/bash
# taisun_agent - Remote installer (for curl | bash)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/san15/taisun_agent/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/san15/taisun_agent/main/install.sh | bash -s -- --profile minimal
#
# What this does:
#   1. Clones the repo into ~/.taisun-agent (or $TAISUN_INSTALL_DIR if set)
#   2. Delegates to scripts/install.sh with any forwarded args
#
# Local checkout users should use `bash scripts/install.sh` directly.

set -euo pipefail

REPO_URL="${TAISUN_REPO_URL:-https://github.com/san15/taisun_agent.git}"
INSTALL_DIR="${TAISUN_INSTALL_DIR:-$HOME/.taisun-agent}"
BRANCH="${TAISUN_BRANCH:-main}"

# Detect if we're already inside a checkout (not piped from curl)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo "")"
if [[ -n "$SCRIPT_DIR" && -f "$SCRIPT_DIR/scripts/install.sh" ]]; then
    echo "▶ Local checkout detected. Delegating to scripts/install.sh ..."
    exec bash "$SCRIPT_DIR/scripts/install.sh" "$@"
fi

# Remote install path (curl | bash)
echo ""
echo "════════════════════════════════════════════════════"
echo "  taisun_agent - Remote Installer"
echo "════════════════════════════════════════════════════"
echo ""
echo "  Repo:   $REPO_URL"
echo "  Branch: $BRANCH"
echo "  Target: $INSTALL_DIR"
echo ""

# Preflight: git required
if ! command -v git >/dev/null 2>&1; then
    echo "  ❌ git が見つかりません。先に git をインストールしてください。"
    echo "     macOS: xcode-select --install"
    echo "     Linux: sudo apt-get install git  (or your package manager)"
    exit 1
fi

# Clone or update
if [[ -d "$INSTALL_DIR/.git" ]]; then
    echo "▶ 既存のインストールを更新します ..."
    git -C "$INSTALL_DIR" fetch --depth 1 origin "$BRANCH"
    git -C "$INSTALL_DIR" checkout "$BRANCH"
    git -C "$INSTALL_DIR" reset --hard "origin/$BRANCH"
elif [[ -d "$INSTALL_DIR" && "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]]; then
    echo "  ❌ $INSTALL_DIR が既に存在し、空ではありません。"
    echo "     別のディレクトリを TAISUN_INSTALL_DIR で指定するか、既存を削除してください。"
    exit 1
else
    echo "▶ リポジトリをクローン中 ..."
    git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
fi

# Delegate to scripts/install.sh
echo ""
echo "▶ メインインストーラーに委譲 ..."
echo ""
exec bash "$INSTALL_DIR/scripts/install.sh" "$@"
