#!/bin/bash

# ===========================================
# Research API Keys Setup Script
# ===========================================
# このスクリプトを実行してAPIキーを設定してください
# 実行方法: bash setup-api-keys.sh
# ===========================================

echo "================================================"
echo "  Research API Keys Setup"
echo "================================================"

# 確認
read -p "APIキーを~/.zshrcに追加しますか？ (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "キャンセルしました"
    exit 0
fi

# バックアップ
cp ~/.zshrc ~/.zshrc.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ ~/.zshrc のバックアップを作成しました"

# APIキー設定を追加
cat >> ~/.zshrc << 'EOF'

# ===========================================
# RESEARCH API KEYS (mega-research-plus)
# ===========================================

# Tavily API（AI検索特化）- 1,000 req/month (Free)
export TAVILY_API_KEY="your-tavily-api-key"

# SerpAPI（Google検索結果取得）- 100 req/month (Free)
export SERPAPI_KEY="your-serpapi-key"

# Brave Search API - 2,000 req/month (Free)
export BRAVE_API_KEY="your-brave-api-key"

# NewsAPI（ニュース集約）- 100 req/day (Free)
export NEWSAPI_KEY="your-newsapi-key"

# Perplexity API（AI検索）- 課金制
export PERPLEXITY_API_KEY="your-perplexity-api-key"

# Twitter/X Cookies (Cookie認証)
export TWITTER_COOKIES='["auth_token=your-auth-token; Domain=.twitter.com", "ct0=your-ct0; Domain=.twitter.com", "twid=u=your-twid; Domain=.twitter.com"]'
EOF

echo "✓ APIキーを~/.zshrcに追加しました"

# 現在のシェルに反映
source ~/.zshrc 2>/dev/null

echo ""
echo "================================================"
echo "  セットアップ完了！"
echo "================================================"
echo ""
echo "設定されたAPIキー:"
echo "  ✓ Tavily API"
echo "  ✓ SerpAPI"
echo "  ✓ Brave Search API"
echo "  ✓ NewsAPI"
echo "  ✓ Perplexity API"
echo "  ✓ Twitter Cookies"
echo ""
echo "新しいターミナルを開くか、以下を実行してください:"
echo "  source ~/.zshrc"
echo ""
echo "使い方:"
echo "  /mega-research-plus AIエージェント市場 --mode=deep"
echo ""
