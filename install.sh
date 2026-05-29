#!/bin/bash
# sunagent15 - Remote installer (for curl | bash)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install.sh | bash -s -- --profile minimal
#
# What this does:
#   1. Clones the repo into ~/.taisun-agent (or $TAISUN_INSTALL_DIR if set)
#   2. Delegates to scripts/install.sh with any forwarded args
#   3. On Windows-under-bash (Git Bash / MSYS2 / Cygwin), auto-dispatches to install.ps1
#
# Local checkout users should use `bash scripts/install.sh` directly.

set -euo pipefail

REPO_URL="${TAISUN_REPO_URL:-https://github.com/taiyousan15/sunagent15.git}"
INSTALL_DIR="${TAISUN_INSTALL_DIR:-$HOME/.taisun-agent}"
BRANCH="${TAISUN_BRANCH:-main}"

# ── Windows-bash auto-dispatch ────────────────────────────────────────────────
# Detect Git Bash / MSYS2 / Cygwin / WSL-with-Windows-PowerShell and delegate to PowerShell.
# Triggers: uname -s starts with MINGW/MSYS/CYGWIN, or $MSYSTEM is set.
#   ref: https://gitforwindows.org/git-wrapper.html
#        https://www.msys2.org/docs/environments/
_uname="$(uname -s 2>/dev/null || echo unknown)"
case "$_uname" in
    MINGW*|MSYS*|CYGWIN*)
        _is_windows_bash=1
        ;;
    *)
        if [ -n "${MSYSTEM:-}" ]; then
            _is_windows_bash=1
        else
            _is_windows_bash=0
        fi
        ;;
esac

if [ "$_is_windows_bash" = "1" ]; then
    echo "▶ Windows-bash 検出 ($_uname${MSYSTEM:+, MSYSTEM=$MSYSTEM})。PowerShell に委譲します ..."
    if ! command -v powershell.exe >/dev/null 2>&1; then
        echo "❌ powershell.exe が見つかりません。" >&2
        echo "   PowerShell ウィンドウから次を実行してください:" >&2
        echo "   irm https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install.ps1 | iex" >&2
        exit 1
    fi
    _self_dir="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo "")"
    if [ -n "$_self_dir" ] && [ -f "$_self_dir/install.ps1" ]; then
        # Local checkout: dispatch to sibling install.ps1
        _ps_path="$_self_dir/install.ps1"
        if command -v cygpath >/dev/null 2>&1; then
            _ps_path="$(cygpath -w "$_ps_path")"
        fi
        exec powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "$_ps_path" "$@"
    else
        # Remote (curl|bash) on Windows: not supported; redirect to PowerShell one-liner
        cat >&2 <<'EOF'
❌ Windows + bash でのリモート実行 (curl|bash) は未対応です。
   PowerShell ウィンドウを開いて以下を実行してください:

   irm https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install.ps1 | iex

EOF
        exit 1
    fi
fi
# ──────────────────────────────────────────────────────────────────────────────

# Detect if we're already inside a checkout (not piped from curl)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo "")"
if [[ -n "$SCRIPT_DIR" && -f "$SCRIPT_DIR/scripts/install.sh" ]]; then
    echo "▶ Local checkout detected. Delegating to scripts/install.sh ..."
    exec bash "$SCRIPT_DIR/scripts/install.sh" "$@"
fi

# Remote install path (curl | bash)
echo ""
echo "════════════════════════════════════════════════════"
echo "  sunagent15 - Remote Installer"
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
