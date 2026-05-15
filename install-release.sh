#!/bin/bash
# taisun_agent - Verified release installer (SHA256-checked archive)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install-release.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install-release.sh | bash -s -- --version v2.53.3
#
# What this does (SECURE PATH — recommended):
#   1. Resolves target version (latest release if not specified)
#   2. Downloads taisun_agent-VERSION.tar.gz and .sha256 from GitHub Releases
#   3. Verifies SHA256 (aborts on mismatch)
#   4. Extracts to ~/.taisun-agent (or $TAISUN_INSTALL_DIR)
#   5. Delegates to scripts/install.sh
#
# This is the SECURE alternative to install.sh (which uses git clone of HEAD).

set -euo pipefail

REPO="${TAISUN_REPO:-taiyousan15/sunagent15}"
INSTALL_DIR="${TAISUN_INSTALL_DIR:-$HOME/.taisun-agent}"
VERSION="${TAISUN_VERSION:-}"
EXTRA_ARGS=()

# Parse args
while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)
            VERSION="$2"
            shift 2
            ;;
        *)
            EXTRA_ARGS+=("$1")
            shift
            ;;
    esac
done

echo ""
echo "════════════════════════════════════════════════════"
echo "  taisun_agent - Verified Release Installer"
echo "════════════════════════════════════════════════════"
echo ""

# Preflight
for cmd in curl tar sha256sum; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        # macOS uses shasum -a 256 instead of sha256sum
        if [[ "$cmd" == "sha256sum" ]] && command -v shasum >/dev/null 2>&1; then
            SHA256_CMD="shasum -a 256"
            continue
        fi
        echo "  ❌ $cmd が見つかりません。先にインストールしてください。"
        exit 1
    fi
done
SHA256_CMD="${SHA256_CMD:-sha256sum}"

# Resolve latest version if not specified
if [[ -z "$VERSION" ]]; then
    echo "▶ 最新リリースを取得中 ..."
    VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
              | grep -oE '"tag_name":\s*"[^"]+"' | head -1 | cut -d'"' -f4)
    if [[ -z "$VERSION" ]]; then
        echo "  ❌ 最新リリースの取得に失敗しました。"
        echo "     --version v2.53.3 のように明示してください。"
        exit 1
    fi
fi

# Strip leading 'v' for package name (cd.yml uses VERSION without v prefix)
PKG_VERSION="${VERSION#v}"
PKG_NAME="taisun_agent-${PKG_VERSION}"
ARCHIVE="${PKG_NAME}.tar.gz"
SHA_FILE="${PKG_NAME}.sha256"
BASE_URL="https://github.com/${REPO}/releases/download/${VERSION}"

echo "  Repo:    $REPO"
echo "  Version: $VERSION"
echo "  Target:  $INSTALL_DIR"
echo ""

# Working directory
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Download archive + checksum
echo "▶ アーカイブをダウンロード中 ..."
curl -fsSL --output "$TMP_DIR/$ARCHIVE"  "$BASE_URL/$ARCHIVE"
curl -fsSL --output "$TMP_DIR/$SHA_FILE" "$BASE_URL/$SHA_FILE"

# Verify SHA256
echo "▶ SHA256 検証中 ..."
cd "$TMP_DIR"
if ! $SHA256_CMD -c "$SHA_FILE" --ignore-missing 2>/dev/null; then
    # fallback: extract expected hash and compare manually (some sha256 files have different formats)
    EXPECTED=$(grep "$ARCHIVE" "$SHA_FILE" | awk '{print $1}')
    ACTUAL=$($SHA256_CMD "$ARCHIVE" | awk '{print $1}')
    if [[ "$EXPECTED" != "$ACTUAL" ]]; then
        echo "  ❌ SHA256 不一致！配布物が改ざんされている可能性があります。"
        echo "     Expected: $EXPECTED"
        echo "     Actual:   $ACTUAL"
        exit 1
    fi
fi
echo "  ✅ SHA256 検証 OK"

# Prepare install dir
if [[ -d "$INSTALL_DIR" && "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]]; then
    echo "  ❌ $INSTALL_DIR が既に存在し、空ではありません。"
    echo "     TAISUN_INSTALL_DIR で別ディレクトリを指定するか、既存を削除してください。"
    exit 1
fi
mkdir -p "$INSTALL_DIR"

# Extract
echo "▶ アーカイブを展開中 ..."
tar -xzf "$ARCHIVE" -C "$INSTALL_DIR" --strip-components=1

# Delegate
echo ""
echo "▶ メインインストーラーに委譲 ..."
echo ""
exec bash "$INSTALL_DIR/scripts/install.sh" "${EXTRA_ARGS[@]}"
