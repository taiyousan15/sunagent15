#!/bin/bash
# TAISUN Agent - LiteLLM セットアップ（OpenRouter/Groq経由格安モデル利用）
#
# 使い方: bash scripts/setup-litellm.sh
#
# このスクリプトが行うこと:
# 1. litellm をインストール
# 2. ~/.zshrc に claude-lite 関数を追加
# 3. APIキーを .env に書き込む（任意）

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  TAISUN LiteLLM セットアップ${NC}"
echo -e "${CYAN}  （OpenRouter/Groq経由 格安モデル）${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LITELLM_CONFIG="$REPO_DIR/config/litellm-config.yaml"
SHELL_RC="$HOME/.zshrc"
[ -f "$HOME/.bashrc" ] && [ ! -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.bashrc"

# ─────────────────────────────────────────
# Step 1: litellm インストール
# ─────────────────────────────────────────
echo "1. litellm をインストールします..."

if command -v litellm &>/dev/null; then
    echo -e "  ${GREEN}[OK]${NC} litellm はすでにインストール済みです"
else
    pip3 install 'litellm[proxy]' --quiet && \
        echo -e "  ${GREEN}[OK]${NC} litellm インストール完了" || \
        { echo -e "  ${RED}[ERROR]${NC} インストール失敗。pip3 が使えるか確認してください"; exit 1; }
fi

echo ""

# ─────────────────────────────────────────
# Step 2: APIキーを確認・入力
# ─────────────────────────────────────────
echo "2. APIキーを設定します"
echo ""
echo -e "  ${YELLOW}OpenRouter API キー${NC}"
echo "  取得先: https://openrouter.ai/keys"
echo "  （すでに .env に設定済みの場合はそのまま Enter）"
echo ""
read -p "  OPENROUTER_API_KEY: " INPUT_OPENROUTER

echo ""
echo -e "  ${YELLOW}Groq API キー${NC}（無料）"
echo "  取得先: https://console.groq.com/keys"
echo "  （スキップする場合はそのまま Enter）"
echo ""
read -p "  GROQ_API_KEY: " INPUT_GROQ

# .env に書き込む
ENV_FILE="$REPO_DIR/.env"
if [ -n "$INPUT_OPENROUTER" ]; then
    if grep -q "^OPENROUTER_API_KEY=" "$ENV_FILE" 2>/dev/null; then
        sed -i.bak "s|^OPENROUTER_API_KEY=.*|OPENROUTER_API_KEY=$INPUT_OPENROUTER|" "$ENV_FILE"
    else
        echo "OPENROUTER_API_KEY=$INPUT_OPENROUTER" >> "$ENV_FILE"
    fi
    echo -e "  ${GREEN}[OK]${NC} OPENROUTER_API_KEY を .env に保存"
fi

if [ -n "$INPUT_GROQ" ]; then
    if grep -q "^GROQ_API_KEY=" "$ENV_FILE" 2>/dev/null; then
        sed -i.bak "s|^GROQ_API_KEY=.*|GROQ_API_KEY=$INPUT_GROQ|" "$ENV_FILE"
    else
        echo "GROQ_API_KEY=$INPUT_GROQ" >> "$ENV_FILE"
    fi
    echo -e "  ${GREEN}[OK]${NC} GROQ_API_KEY を .env に保存"
fi

# .bak 削除
rm -f "$ENV_FILE.bak"

echo ""

# ─────────────────────────────────────────
# Step 3: ~/.zshrc に関数を追加
# ─────────────────────────────────────────
echo "3. シェル関数を追加します（$SHELL_RC）"

MARKER="# === TAISUN LiteLLM ==="

if grep -q "$MARKER" "$SHELL_RC" 2>/dev/null; then
    echo -e "  ${GREEN}[OK]${NC} すでに設定済みです（スキップ）"
else
    cat >> "$SHELL_RC" << SHELLEOF

$MARKER
export OPENROUTER_API_KEY="${INPUT_OPENROUTER:-\${OPENROUTER_API_KEY}}"
export GROQ_API_KEY="${INPUT_GROQ:-\${GROQ_API_KEY}}"

# Python パス（pipでインストールした litellm を使えるように）
export PATH="\$HOME/Library/Python/3.9/bin:\$HOME/Library/Python/3.11/bin:\$HOME/.local/bin:\$PATH"

# claude-lite: OpenRouter経由でClaude Codeを起動
function claude-lite() {
  if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "🚀 OpenRouterプロキシを起動中..."
    nohup litellm --config "$LITELLM_CONFIG" --port 4000 > /tmp/litellm.log 2>&1 &
    sleep 4
    if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
      echo "❌ 起動に失敗しました。ログを確認: cat /tmp/litellm.log"
      return 1
    fi
    echo "✅ 起動完了"
  fi
  ANTHROPIC_BASE_URL="http://localhost:4000" ANTHROPIC_API_KEY="dummy" claude "\$@"
}

alias litellm-stop='pkill -f "litellm --config" && echo "✅ 停止しました" || echo "既に停止しています"'
alias litellm-health='curl -s http://localhost:4000/health | python3 -m json.tool 2>/dev/null || echo "LiteLLM は起動していません"'
alias litellm-log='tail -f /tmp/litellm.log'
# === END TAISUN LiteLLM ===
SHELLEOF

    echo -e "  ${GREEN}[OK]${NC} $SHELL_RC に追加しました"
fi

echo ""

# ─────────────────────────────────────────
# Step 4: 動作確認
# ─────────────────────────────────────────
echo "4. セットアップ完了！"
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  使い方${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo "  # 設定を反映（1回だけ必要）"
echo "  source $SHELL_RC"
echo ""
echo "  # OpenRouter経由でClaude Codeを起動"
echo "  claude-lite"
echo ""
echo "  # LiteLLMを止めたいとき"
echo "  litellm-stop"
echo ""
echo "  # 起動状態を確認"
echo "  litellm-health"
echo ""
echo "  # ログを見る"
echo "  litellm-log"
echo ""
echo -e "${YELLOW}  次のコマンドを実行して設定を反映してください:${NC}"
echo -e "${CYAN}  source $SHELL_RC${NC}"
echo ""
