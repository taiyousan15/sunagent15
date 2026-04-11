# Round 7: コスト効率 — Opus Analysis
## 観点: 問題#8 .env.example の優先度ラベル欠如

## 確認した事実
ファイル: `/Users/matsumototoshihiko/taisun_agent/.env.example` (191行)

現在のセクション構成:
- 行1-17: Project Settings + AI API Keys (コメントに「必須」と書かれているが変数レベルのラベルなし)
- 行10: `# AI API Keys (必須)` — セクションコメントのみ、各行にラベルなし
- 行47: Reddit のみ `# Reddit API (コミュニティ意見) - オプション` と記載あり
- 行26-51: Research & Search APIs — Tavily, SerpAPI, Brave, NewsAPI, Perplexityが横並びでラベルなし
- 行78: GITHUB_TOKEN — ラベルなし
- 行187-190: Feature Flags — ラベルなし

## なぜ問題か
新規ユーザーが191行のenvファイルを見たとき、どのAPIキーを取得しなければ動かないか判断できない。
例:
- Groq、Google API、MiniMax は「必須」セクションに含まれているが実際は任意のモデル切替用
- ANTHROPIC_API_KEY だけが真の必須だが、他と並列に書かれている
- APIキー取得には平均10〜20分かかる（アカウント作成、メール認証、課金設定）
- 全部取得しようとすると20APIキー × 15分 = 5時間の無駄コストが発生

## 修正案

各変数の末尾またはコメント行に `[REQUIRED]` / `[RECOMMENDED]` / `[OPTIONAL]` ラベルを付与する。

### 分類基準
- `[REQUIRED]`: これなしでは claude code 起動後に即エラー
- `[RECOMMENDED]`: 主要スキルが機能する・研究用途には実質必須
- `[OPTIONAL]`: 特定ユースケースのみ必要

### 具体的修正（行番号付き）

```
# 行12: ANTHROPIC_API_KEY → [REQUIRED]
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx  # [REQUIRED] Claude API（全機能の基本）

# 行13: OPENAI_API_KEY → [OPTIONAL]
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx  # [OPTIONAL] GPT系モデル利用時のみ

# 行14: OPENROUTER_API_KEY → [OPTIONAL]
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx  # [OPTIONAL] マルチモデルルーティング

# 行15-16: Groq, Google → [OPTIONAL]
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx  # [OPTIONAL] 超高速推論（無料枠あり）
GOOGLE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxx  # [OPTIONAL] Gemini利用時のみ

# 行21: MINIMAX → [OPTIONAL]
MINIMAX_API_KEY=your_minimax_api_key_here  # [OPTIONAL] コード生成特化

# 行29: TAVILY → [RECOMMENDED]
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxx  # [RECOMMENDED] research-systemスキルで使用

# 行33: SERPAPI → [OPTIONAL]
SERPAPI_KEY=xxxxxxxxxxxxxxxx  # [OPTIONAL] Tavilyで代替可能

# 行37: BRAVE_SEARCH_API_KEY → [RECOMMENDED]
BRAVE_SEARCH_API_KEY=BSAxxxx  # [RECOMMENDED] mega-researchで使用

# 行41: NEWSAPI → [OPTIONAL]
NEWSAPI_KEY=xxxxxxxx  # [OPTIONAL] intelligence-researchスキルで使用

# 行45: PERPLEXITY → [OPTIONAL]
PERPLEXITY_API_KEY=pplx-xxxxx  # [OPTIONAL] AI要約付き検索

# 行78: GITHUB_TOKEN → [RECOMMENDED]
GITHUB_TOKEN=ghp_xxxx  # [RECOMMENDED] GitHub MCP・PR操作・Issues参照

# 行83: NOTION_API_KEY → [OPTIONAL]
# 行88-89: SLACK_BOT_TOKEN, SLACK_TEAM_ID → [OPTIONAL]
```

### セクションヘッダーにも優先度サマリーを追加

```
# ===========================================
# AI API Keys
# [REQUIRED] ANTHROPIC_API_KEY のみ必須
# [OPTIONAL] 他はすべて任意（使うモデルのみ設定）
# ===========================================
```

## コスト効率の定量評価

| Before | After |
|--------|-------|
| ユーザーは全APIキーを取得しようとする | [REQUIRED]のみ取得（1キー、5分） |
| 平均セットアップ時間: 2〜5時間 | 平均セットアップ時間: 15〜30分 |
| 取得後「不要だった」と気づく | 必要になったら段階的に追加 |

## 反論への備え
「コメント文でわかる」→ 191行を読み切るユーザーは少数。インライン `[REQUIRED]` は grep/検索で即座に確認できる。
「ラベルが陳腐化する」→ ラベルはスキルの増減に連動して更新する必要がある（保守コスト発生）。
これは実装で対応可能（INSTALL.md の変数一覧と連動させる）。
