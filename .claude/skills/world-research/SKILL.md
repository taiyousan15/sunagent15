---
name: world-research
description: >
  全世界SNS・プラットフォーム横断キーワード検索リサーチスキル。
  X/Reddit/YouTube/Instagram/TikTok/note.com/Bilibili/Zhihu/小红書/WeChat/Weibo/Medium/Naver等を
  AIキーワードマスターリストで一括検索。gpt-researcher統合で深層調査も可能。
  トリガー: 「世界リサーチ」「SNSリサーチ」「キーワード検索」「グローバル検索」「世界中で調べて」
---

# World Research - 全世界SNSキーワード検索リサーチシステム

## 概要

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   WORLD RESEARCH SYSTEM v1.0                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │               AIキーワードマスターリスト                            │  │
│  │  8カテゴリ × 3言語（日本語・英語・中国語）                         │  │
│  └────────────────────────┬───────────────────────────────────────────┘  │
│                           │                                              │
│           ┌───────────────┼───────────────────────────┐                  │
│           ▼               ▼                           ▼                  │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────────────────────┐  │
│  │  英語圏SNS  │ │  日本語SNS   │ │  中国語SNS                       │  │
│  │ ・X(Twitter) │ │ ・note.com   │ │ ・Zhihu（知乎）                  │  │
│  │ ・Reddit    │ │ ・Qiita      │ │ ・Bilibili（哔哩哔哩）            │  │
│  │ ・YouTube   │ │ ・Zenn       │ │ ・小红书（RedNote）               │  │
│  │ ・Medium    │ │ ・YouTube JP │ │ ・微信（WeChat）                  │  │
│  │ ・Instagram │ │              │ │ ・微博（Weibo）                   │  │
│  │ ・TikTok    │ │              │ │ ・CSDN                           │  │
│  │ ・LinkedIn  │ │              │ │                                  │  │
│  └──────┬──────┘ └──────┬───────┘ └───────────────┬──────────────────┘  │
│         │               │                         │                      │
│         └───────────────┼─────────────────────────┘                      │
│                         ▼                                                │
│              ┌─────────────────────┐                                     │
│              │   gpt-researcher    │                                     │
│              │   統合レイヤー      │                                     │
│              │  ・deep_research    │                                     │
│              │  ・quick_search     │                                     │
│              │  ・write_report     │                                     │
│              └──────────┬──────────┘                                     │
│                         ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    出力形式                                      │    │
│  │  ・グローバルトレンドレポート   ・プラットフォーム比較            │    │
│  │  ・キーワード別バズ分析        ・クリエイター発見                 │    │
│  │  ・地域別インサイト            ・引用付きレポート                 │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ✅ APIキー不要（基本機能）  ✅ gpt-researcher統合（深層調査）          │
│  ✅ 日英中3言語対応          ✅ 20+プラットフォーム横断                  │
└──────────────────────────────────────────────────────────────────────────┘
```

## 使い方

```bash
# 基本キーワード検索（全SNS横断）
/world-research キーワード=Claude Code

# 特定プラットフォーム指定
/world-research キーワード=AIエージェント プラットフォーム=X,Reddit,note

# 言語指定
/world-research キーワード=Vibe Coding 言語=en,ja,zh

# 深層調査モード（gpt-researcher統合）
/world-research キーワード=MCP Server モード=deep

# トレンド分析
/world-research トレンド カテゴリ=エージェント

# 地域別レポート
/world-research キーワード=生成AI 地域=日本,中国,米国
```

---

## AIキーワードマスターリスト

### カテゴリ別キーワード（全8カテゴリ × 3言語）

| カテゴリ | 日本語 | 英語 | 中国語 |
|---|---|---|---|
| **基盤技術** | 生成AI, LLM, 大規模言語モデル, 機械学習, 深層学習 | Generative AI, LLM, Large Language Model, Machine Learning, Deep Learning | 生成式AI, 大语言模型, 机器学习, 深度学习 |
| **開発ツール** | Claude Code, Vibe Coding, AI駆動開発, AIコーディング | Claude Code, Vibe Coding, AI-driven development, Cursor AI, GitHub Copilot | AI编程, AI辅助开发, AI代码生成 |
| **エージェント** | AIエージェント, MCP Server, 自律AI, マルチエージェント | AI Agent, MCP Server, Autonomous AI, Multi-Agent, Agentic AI | AI智能体, 多智能体, 自主AI |
| **モデル** | GPT, Claude, Gemini, DeepSeek, Qwen, Llama | GPT-5, Claude Opus, Gemini 3, DeepSeek, Qwen 3, Llama 4 | GPT, Claude, Gemini, 通义千问, 文心一言 |
| **応用** | プロンプトエンジニアリング, RAG, ファインチューニング | Prompt Engineering, RAG, Fine-tuning, RLHF | 提示词工程, 检索增强生成, 微调 |
| **ビジネス** | AI副業, AIマネタイズ, AI活用, AI導入事例 | AI side hustle, AI monetization, AI use cases | AI副业, AI变现, AI应用案例 |
| **安全性** | AI安全性, AIアライメント, AI規制, AI倫理 | AI Safety, AI Alignment, AI Regulation, AI Ethics | AI安全, AI对齐, AI监管 |
| **マルチモーダル** | 画像生成AI, 動画生成AI, 音声AI, VLA | Image Generation, Video Generation, Voice AI, VLA, Text-to-Video | AI图像生成, AI视频生成, 语音AI |

### キーワード展開ルール

```
入力キーワード → 展開処理：

1. 同義語展開（例: Claude Code → Claude Code, Claude CLI, Anthropic CLI）
2. 言語変換（日→英→中）
3. ハッシュタグ変換（例: AI Agent → #AIAgent #AI_Agent #ArtificialIntelligence）
4. 組み合わせ生成（例: Claude Code + tutorial, guide, 入門, 活用）
```

---

## プラットフォーム別検索仕様

### 1. X（旧Twitter）

**検索URL**: `https://x.com/search-advanced`

#### 検索演算子

| 演算子 | 用途 | 例 |
|---|---|---|
| `"完全一致"` | フレーズ検索 | `"Claude Code"` |
| `from:` | 特定ユーザー | `from:AnthropicAI` |
| `min_faves:` | 最低いいね数 | `"AI Agent" min_faves:100` |
| `min_retweets:` | 最低RT数 | `"LLM" min_retweets:50` |
| `since:` / `until:` | 期間指定 | `"Vibe Coding" since:2026-01-01` |
| `filter:links` | リンク付き | `"RAG" filter:links` |
| `lang:` | 言語指定 | `lang:ja` / `lang:en` / `lang:zh` |
| `-filter:replies` | リプライ除外 | `"MCP" -filter:replies` |
| `OR` | OR検索 | `"Claude Code" OR "Cursor AI"` |

#### テンプレートクエリ

```
# 英語バイラル
"{keyword}" min_faves:200 since:{date} lang:en -filter:replies

# 日本語バイラル
"{keyword_ja}" lang:ja min_faves:50 since:{date}

# 中国語バイラル
"{keyword_zh}" lang:zh min_faves:100 since:{date}

# 論文速報
"paper" ("{keyword}" OR "LLM") min_faves:500 filter:links since:{date}
```

---

### 2. Reddit

**検索URL**: `https://www.reddit.com/search/`

#### AI関連Subreddit

| Subreddit | 検索クエリテンプレート |
|---|---|
| r/MachineLearning | `subreddit:MachineLearning "{keyword}"` |
| r/LocalLLaMA | `subreddit:LocalLLaMA "{keyword}"` |
| r/artificial | `subreddit:artificial "{keyword}"` |
| r/ChatGPT | `subreddit:ChatGPT "{keyword}"` |
| r/ClaudeAI | `subreddit:ClaudeAI "{keyword}"` |
| r/MLOps | `subreddit:MLOps "{keyword}"` |
| r/LLMDevs | `subreddit:LLMDevs "{keyword}"` |
| r/singularity | `subreddit:singularity "{keyword}"` |

#### 検索API

```
# 公式Reddit検索
GET https://www.reddit.com/search.json?q={keyword}&sort=relevance&t=week&limit=25

# Subreddit内検索
GET https://www.reddit.com/r/{subreddit}/search.json?q={keyword}&restrict_sr=1&sort=top&t=week

# サードパーティ
# PullPush: https://pullpush.io/
# ForumScout: https://forumscout.app/reddit-api
```

---

### 3. note.com（日本）

**検索URL**: `https://note.com/search?q={keyword}&context=note`
**トピックページ**: `https://note.com/topic/science_technology/ai_machine_learning`

#### 非公式API

| エンドポイント | URL |
|---|---|
| ユーザー情報 | `GET https://note.com/api/v2/creators/{username}` |
| 記事一覧 | `GET https://note.com/api/v2/creators/{username}/contents?kind=note&page=1` |
| 記事詳細 | `GET https://note.com/api/v1/notes/{note_key}` |
| タグ検索 | `GET https://note.com/api/v3/articles?tag={tag_name}&page=1` |
| トレンド | `GET https://note.com/api/v3/trending/notes` |

#### AI検索キーワード

| キーワード | 検索URL |
|---|---|
| Claude Code | `https://note.com/search?q=Claude+Code&context=note` |
| Vibe Coding | `https://note.com/search?q=Vibe+Coding&context=note` |
| 生成AI | `https://note.com/search?q=生成AI&context=note` |
| AIエージェント | `https://note.com/search?q=AIエージェント&context=note` |
| MCP Server | `https://note.com/search?q=MCP+Server&context=note` |
| プロンプトエンジニアリング | `https://note.com/search?q=プロンプトエンジニアリング&context=note` |
| AI副業 | `https://note.com/search?q=AI+副業&context=note` |
| LLM | `https://note.com/search?q=LLM&context=note` |
| 機械学習 | `https://note.com/search?q=機械学習&context=note` |
| ChatGPT | `https://note.com/search?q=ChatGPT&context=note` |

---

### 4. YouTube

**検索URL**: `https://www.youtube.com/results?search_query=`

#### ハッシュタグ・キーワード

| カテゴリ | キーワード |
|---|---|
| 技術解説 | `#AI #MachineLearning #DeepLearning #LLM #GenerativeAI` |
| 開発 | `#ClaudeCode #VibeCoding #CursorAI #GitHubCopilot #AIAgent` |
| 日本語 | `#生成AI #ChatGPT活用 #AIエージェント #プロンプトエンジニアリング` |
| 中国語 | `#AI编程 #大语言模型 #AI智能体` |

#### URLパラメータ（フィルタ）

```
# 今月の動画
https://www.youtube.com/results?search_query={keyword}&sp=EgIIBQ%253D%253D

# 今週の動画
https://www.youtube.com/results?search_query={keyword}&sp=EgIIBA%253D%253D

# 再生数順ソート
https://www.youtube.com/results?search_query={keyword}&sp=CAMSAhAB
```

---

### 5. Instagram / TikTok / Shorts

#### ハッシュタグ

| プラットフォーム | トップハッシュタグ |
|---|---|
| **Instagram** | `#AI #ArtificialIntelligence #GenerativeAI #ChatGPT #AIArt #MachineLearning #AITools #TechTrends2026` |
| **TikTok** | `#AI #AITools #ChatGPT #AIHack #TechTok #LearnOnTikTok #VibeCoding #AIAgent` |
| **YouTube Shorts** | `#Shorts #AI #AITutorial #GenerativeAI #ClaudeCode` |

#### 検索戦略（2026年）

- ハッシュタグ3-5個 + キーワードリッチなキャプションが最も効果的
- キーワード最適化キャプションはハッシュタグ重視より約30%多くリーチ
- ニッチタグ1-3個 + トレンドタグ1-2個の組み合わせが最適

---

### 6. 中国SNS

| プラットフォーム | 検索URL | AI検索キーワード |
|---|---|---|
| **知乎** | `https://www.zhihu.com/search?q=` | 大语言模型, AI智能体, DeepSeek, 通义千问 |
| **Bilibili** | `https://search.bilibili.com/all?keyword=` | AI编程, Claude Code, 大模型, AI Agent |
| **小红书** | アプリ内検索 | AI工具, ChatGPT教程, AI副业, AI绘画 |
| **微信** | 搜一搜 | 生成式AI, AI大模型, AI Agent, MCP |
| **微博** | `https://s.weibo.com/weibo?q=` | AI, 人工智能, 大语言模型, DeepSeek |
| **CSDN** | `https://so.csdn.net/so/search?q=` | LLM开发, AI Agent, RAG, 微调 |

#### 横断検索API

```
# TikHub API（Bilibili/小红书/微博/知乎 横断）
https://api.tikhub.io/

# 小红書 MCP Server（AI Agent連携）
https://www.pulsemcp.com/servers/chenningling-xiaohongshu-search-comment
```

---

### 7. その他プラットフォーム

| プラットフォーム | 検索URL | キーワード |
|---|---|---|
| **Medium** | `https://medium.com/search?q=` | AI Agent, RAG, Vibe Coding, LLM |
| **Qiita** | `https://qiita.com/search?q=` | Claude Code, 生成AI, AIエージェント |
| **Zenn** | `https://zenn.dev/search?q=` | LLM, RAG, MCP, AI開発 |
| **Hacker News** | `https://hn.algolia.com/?q=` | AI Agent, Claude, GPT, LLM |
| **Naver Blog** | `https://search.naver.com/search.naver?where=blog&query=` | AI 개발, 생성형 AI, AI 에이전트 |
| **LinkedIn** | `https://www.linkedin.com/search/results/content/?keywords=` | AI Agent, Generative AI, MCP |

---

## gpt-researcher 統合

### 統合モード

| モード | 動作 | 適用場面 |
|---|---|---|
| **quick** | WebSearch + SNS検索のみ（APIキー不要） | 速報・トレンド確認 |
| **standard** | quick + note.com API + Reddit API | 日常リサーチ |
| **deep** | standard + gpt-researcher deep_research | 包括的調査レポート |

### 実行フロー

```
入力: /world-research キーワード=MCP Server モード=deep

Step 1: キーワード展開
  MCP Server → MCP, Model Context Protocol, MCPサーバー, MCP服务器

Step 2: SNS横断検索（並列実行）
  ├── X: "MCP Server" min_faves:100 lang:en/ja/zh
  ├── Reddit: subreddit:ClaudeAI "MCP"
  ├── note.com: https://note.com/search?q=MCP+Server
  ├── YouTube: MCP Server tutorial 2026
  ├── Bilibili: MCP Server AI Agent
  └── Medium: "MCP Server" "AI Agent"

Step 3: gpt-researcher deep_research（deepモード時）
  → 50+ソース探索
  → 検証・フィルタリング
  → 引用付きレポート生成

Step 4: 統合レポート出力
  ├── プラットフォーム別バズ投稿
  ├── キーワード別トレンド分析
  ├── 地域別インサイト
  └── 引用・ソースリスト
```

### gpt-researcher 必要環境変数（deepモード時のみ）

| 変数 | 説明 | 必須 |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key | deepモード時 |
| `TAVILY_API_KEY` | Tavily API key | deepモード時 |

> **quickモード・standardモードはAPIキー不要**（WebSearch + WebFetch + 非公式APIのみ）

---

## 実行テンプレート

### 1. グローバルトレンド調査

```bash
/world-research キーワード=AI Agent 2026 モード=standard

# 実行内容:
# - X: 英語/日本語/中国語でバイラル投稿検索
# - Reddit: r/MachineLearning, r/ClaudeAI等で検索
# - note.com: AIエージェント関連記事検索
# - YouTube: AI Agent 2026 tutorial検索
# - 中国SNS: AI智能体 検索
```

### 2. 特定ツール深掘り

```bash
/world-research キーワード=Claude Code Vibe Coding モード=deep

# 実行内容:
# - 全SNSでClaude Code + Vibe Coding検索
# - gpt-researcher で50+ソース深層調査
# - 引用付き包括レポート生成
```

### 3. 地域別比較

```bash
/world-research キーワード=生成AI 地域=日本,中国,米国

# 実行内容:
# - 日本: note.com + Qiita + Zenn + YouTube JP
# - 中国: 知乎 + Bilibili + 小红书 + CSDN
# - 米国: X + Reddit + YouTube + Medium
# - 地域別トレンド比較レポート
```

---

## 出力形式

### レポートテンプレート

```markdown
# {keyword} グローバルリサーチレポート

**調査日**: {date}
**検索キーワード**: {keywords (ja/en/zh)}
**検索プラットフォーム**: {platforms}
**モード**: {quick|standard|deep}

---

## エグゼクティブサマリー

{3-5行の要約}

---

## プラットフォーム別結果

### X（旧Twitter）
| 投稿 | いいね | RT | 言語 | URL |
|------|--------|-----|------|-----|
{top_tweets}

### Reddit
| タイトル | スコア | Subreddit | URL |
|---------|--------|-----------|-----|
{top_posts}

### note.com
| タイトル | 著者 | スキ | URL |
|---------|------|------|-----|
{top_notes}

### YouTube
| タイトル | チャンネル | 再生数 | URL |
|---------|----------|--------|-----|
{top_videos}

### 中国SNS
| プラットフォーム | タイトル/投稿 | エンゲージメント | URL |
|----------------|-------------|---------------|-----|
{top_chinese}

---

## トレンド分析

### キーワード別バズ度
{keyword_buzz_analysis}

### 地域別インサイト
{regional_insights}

---

## 引用・ソース
{citations}
```

---

## 制限事項

1. **レート制限**: 各プラットフォームのAPIレート制限を遵守（1秒間隔）
2. **認証**: ログイン必須データ（Instagram DM等）は取得不可
3. **中国SNS**: 一部はアプリ内検索のみ（API非公開）
4. **deepモード**: gpt-researcher使用時はAPIキーが必要

## 関連スキル

- `gpt-researcher` - 深層調査エンジン（統合済み）
- `note-research` - note.com特化リサーチ
- `research-free` - APIキー不要汎用リサーチ
- `mega-research` - 6API統合リサーチ
- `keyword-free` - キーワード抽出
- `keyword-mega-extractor` - 多角的キーワード展開
