---
name: world-research
description: >
  全世界SNS・学術論文・コミュニティ横断キーワード検索リサーチスキル。
  【SNS層】X/Reddit/YouTube/Instagram/TikTok/note.com/Bilibili/Zhihu/小红書/WeChat/Weibo/Medium/Naver等
  【学術層】Arxiv/Papers with Code/OpenReview/Google Scholar/Semantic Scholar/Connected Papers/DBLP/ACL Anthology
  【キュレーション層】HF Daily Papers/Daily AI Papers/@_akhaliq/ML News/Alpha Signal
  【ブログ・解説層】Lil'Log/Distill/The Gradient/Jay Alammar/Karpathy/Raschka/Chip Huyen
  【実装エコシステム層】HF Smolagents/awesome-*repos/LangChain/CrewAI/AutoGPT/OpenDevin
  【コミュニティ層】r/MachineLearning/HN/Discord(Eleuther/LAION/HF)/Slack(MLOps)
  AIキーワードマスターリストで一括検索。gpt-researcher統合で深層調査も可能。
  トリガー: 「世界リサーチ」「SNSリサーチ」「キーワード検索」「グローバル検索」「世界中で調べて」
         「論文検索」「学術リサーチ」「ペーパーサーチ」「最新研究」「アカデミックリサーチ」
---

# World Research - 全世界総合リサーチシステム v2.0

## 概要

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   WORLD RESEARCH SYSTEM v2.0                               │
│            論文 → コミュニティ → SNS 完全網羅型リサーチ                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │               AIキーワードマスターリスト                              │  │
│  │  12カテゴリ × 3言語（日本語・英語・中国語）                          │  │
│  └────────────────────────┬─────────────────────────────────────────────┘  │
│                           │                                                │
│     ┌─────────────────────┼─────────────────────────────┐                  │
│     ▼                     ▼                             ▼                  │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────────────────────┐   │
│  │ Layer 1  │  │   Layer 2      │  │  Layer 3                        │   │
│  │ 学術論文 │  │ ペーパー       │  │  テックブログ・解説              │   │
│  │ ─────── │  │ キュレーション │  │  ─────────────────              │   │
│  │ ・Arxiv  │  │ ・HF Daily     │  │  ・Lil'Log (Lilian Weng)       │   │
│  │ ・PwC    │  │ ・@_akhaliq    │  │  ・Distill.pub                 │   │
│  │ ・OpenRev│  │ ・Daily AI     │  │  ・The Gradient                │   │
│  │ ・Scholar│  │ ・Alpha Signal │  │  ・Jay Alammar                 │   │
│  │ ・S2     │  │ ・ML News      │  │  ・Andrej Karpathy             │   │
│  │ ・ConnPap│  │ ・AI News      │  │  ・Sebastian Raschka           │   │
│  │ ・DBLP   │  │               │  │  ・Chip Huyen                  │   │
│  │ ・ACL    │  │               │  │  ・Eugene Yan                  │   │
│  └────┬─────┘  └──────┬────────┘  └──────────────┬───────────────────┘   │
│       │               │                          │                        │
│     ┌─┴───────────────┴──────────────────────────┴──┐                     │
│     ▼                                               ▼                     │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────────────────────┐   │
│  │ Layer 4  │  │   Layer 5      │  │  Layer 6                        │   │
│  │ 実装     │  │   SNS          │  │  コミュニティ                    │   │
│  │ エコシス │  │   プラット     │  │  ─────────────                  │   │
│  │ ─────── │  │   フォーム     │  │  ・r/MachineLearning            │   │
│  │ ・HF Hub │  │  ─────────    │  │  ・Hacker News                  │   │
│  │ ・awesome│  │  ・X(Twitter)  │  │  ・Discord (Eleuther/LAION/HF) │   │
│  │ ・LangCh │  │  ・Reddit      │  │  ・Slack (MLOps Community)     │   │
│  │ ・CrewAI │  │  ・YouTube     │  │  ・Stack Overflow (AI tags)    │   │
│  │ ・AutoGPT│  │  ・note.com    │  │  ・GitHub Discussions           │   │
│  │ ・OpenDev│  │  ・Medium      │  │  ・Weights & Biases Community  │   │
│  │ ・CAMEL  │  │  ・Bilibili    │  │                                │   │
│  │ ・MLOps  │  │  ・知乎/小红書 │  │                                │   │
│  └────┬─────┘  └──────┬────────┘  └──────────────┬───────────────────┘   │
│       │               │                          │                        │
│       └───────────────┼──────────────────────────┘                        │
│                       ▼                                                    │
│            ┌─────────────────────┐                                         │
│            │   gpt-researcher    │                                         │
│            │   統合レイヤー      │                                         │
│            │  ・deep_research    │                                         │
│            │  ・quick_search     │                                         │
│            │  ・write_report     │                                         │
│            └──────────┬──────────┘                                         │
│                       ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       出力形式                                       │  │
│  │  ・論文サーベイレポート      ・グローバルトレンドレポート             │  │
│  │  ・技術動向分析             ・プラットフォーム比較                   │  │
│  │  ・研究トラック別まとめ     ・キーワード別バズ分析                   │  │
│  │  ・引用付き学術レポート     ・実装エコシステムマップ                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ✅ APIキー不要（基本機能）    ✅ gpt-researcher統合（深層調査）          │
│  ✅ 日英中3言語対応            ✅ 50+プラットフォーム横断                  │
│  ✅ 学術論文〜SNSまで完全網羅  ✅ 6層リサーチアーキテクチャ               │
└────────────────────────────────────────────────────────────────────────────┘
```

## 使い方

```bash
# 基本キーワード検索（全層横断）
/world-research キーワード=Claude Code

# 特定プラットフォーム指定
/world-research キーワード=AIエージェント プラットフォーム=X,Reddit,note

# 言語指定
/world-research キーワード=Vibe Coding 言語=en,ja,zh

# 深層調査モード（gpt-researcher統合）
/world-research キーワード=MCP Server モード=deep

# 学術論文検索モード
/world-research キーワード=ReAct Agent モード=academic

# 論文サーベイモード（特定研究トラック）
/world-research キーワード=Tree of Thoughts モード=survey トラック=reasoning

# トレンド分析
/world-research トレンド カテゴリ=エージェント

# 地域別レポート
/world-research キーワード=生成AI 地域=日本,中国,米国

# 実装エコシステム検索
/world-research キーワード=multi-agent モード=ecosystem
```

---

## AIキーワードマスターリスト

### カテゴリ別キーワード（全12カテゴリ × 3言語）

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
| **推論・思考** | 思考連鎖, 推論, ステップバイステップ推論 | Chain of Thought, Tree of Thoughts, Reasoning, ReAct, Reflexion | 思维链, 推理, 逐步推理 |
| **メモリ・知識** | 長期記憶, 知識グラフ, ベクトルDB | Long-term Memory, Knowledge Graph, Vector Database, RAG, Embedding | 长期记忆, 知识图谱, 向量数据库 |
| **MLOps・インフラ** | モデルデプロイ, 推論最適化, 量子化 | MLOps, Model Serving, Quantization, GGUF, vLLM, TensorRT | 模型部署, 推理优化, 量化 |
| **オープンソース** | OSS LLM, ローカルLLM, セルフホスト | Open Source LLM, Local LLM, Self-hosted, Ollama, llama.cpp | 开源大模型, 本地部署, 私有化部署 |

### キーワード展開ルール

```
入力キーワード → 展開処理：

1. 同義語展開（例: Claude Code → Claude Code, Claude CLI, Anthropic CLI）
2. 言語変換（日→英→中）
3. ハッシュタグ変換（例: AI Agent → #AIAgent #AI_Agent #ArtificialIntelligence）
4. 組み合わせ生成（例: Claude Code + tutorial, guide, 入門, 活用）
5. 学術キーワード変換（例: AI Agent → "autonomous agent" "tool-augmented LLM"）
6. Arxivカテゴリ変換（例: LLM → cs.CL, cs.AI, cs.LG）
```

---

## Layer 1: 学術論文検索

### 1-1. Arxiv

**検索URL**: `https://arxiv.org/search/`
**API**: `https://export.arxiv.org/api/query`

#### AI関連カテゴリ

| カテゴリ | コード | 主要トピック |
|---|---|---|
| Computation and Language | `cs.CL` | NLP, LLM, Transformer, Prompt Engineering |
| Artificial Intelligence | `cs.AI` | Agent, Planning, Reasoning, Knowledge |
| Machine Learning | `cs.LG` | Training, Optimization, Architecture |
| Computer Vision | `cs.CV` | Vision-Language, Multimodal, Image Generation |
| Information Retrieval | `cs.IR` | RAG, Search, Recommendation |
| Software Engineering | `cs.SE` | Code Generation, AI-assisted Development |
| Multiagent Systems | `cs.MA` | Multi-Agent, Coordination, Communication |
| Robotics | `cs.RO` | Embodied AI, VLA, Robot Learning |

#### 検索クエリテンプレート

```
# Arxiv API検索
GET https://export.arxiv.org/api/query?search_query=all:{keyword}&sortBy=submittedDate&sortOrder=descending&max_results=20

# カテゴリ絞り込み
GET https://export.arxiv.org/api/query?search_query=cat:cs.CL+AND+all:{keyword}&max_results=20

# 著者検索
GET https://export.arxiv.org/api/query?search_query=au:{author_name}&max_results=10

# Web検索（Arxiv内）
https://arxiv.org/search/?query={keyword}&searchtype=all&order=-announced_date_first

# 日付範囲指定
https://arxiv.org/search/?query={keyword}&start=0&order=-announced_date_first
```

#### 主要キーワード（論文検索用）

| 研究トラック | 検索キーワード |
|---|---|
| LLMエージェント | `"LLM agent" OR "tool-augmented" OR "agentic"` |
| 推論・思考 | `"chain of thought" OR "tree of thoughts" OR "reasoning"` |
| RAG | `"retrieval augmented generation" OR "RAG"` |
| マルチエージェント | `"multi-agent" OR "agent collaboration" OR "agent communication"` |
| コード生成 | `"code generation" OR "program synthesis" OR "AI coding"` |
| アライメント | `"alignment" OR "RLHF" OR "DPO" OR "constitutional AI"` |
| 効率化 | `"quantization" OR "distillation" OR "pruning" OR "efficient"` |

---

### 1-2. Papers with Code

**検索URL**: `https://paperswithcode.com/search?q=`
**API**: `https://paperswithcode.com/api/v1/`

#### 検索テンプレート

```
# 論文検索
https://paperswithcode.com/search?q_meta=&q_type=&q={keyword}

# トレンド（最新）
https://paperswithcode.com/latest

# メソッド検索
https://paperswithcode.com/methods

# データセット検索
https://paperswithcode.com/datasets

# API: 論文検索
GET https://paperswithcode.com/api/v1/papers/?q={keyword}&ordering=-published&page=1

# API: リポジトリ付き論文
GET https://paperswithcode.com/api/v1/papers/?q={keyword}&has_code=true
```

#### 注目カテゴリ

| カテゴリ | URL |
|---|---|
| Language Models | `https://paperswithcode.com/task/language-modelling` |
| Question Answering | `https://paperswithcode.com/task/question-answering` |
| Text Generation | `https://paperswithcode.com/task/text-generation` |
| Code Generation | `https://paperswithcode.com/task/code-generation` |
| Image Generation | `https://paperswithcode.com/task/image-generation` |
| Object Detection | `https://paperswithcode.com/task/object-detection` |

---

### 1-3. OpenReview

**検索URL**: `https://openreview.net/search?term=`

#### 主要会議

| 会議 | 分野 | 時期 |
|---|---|---|
| NeurIPS | ML全般 | 12月 |
| ICML | ML全般 | 7月 |
| ICLR | 表現学習・DL | 5月 |
| ACL | NLP | 7月 |
| EMNLP | NLP | 12月 |
| NAACL | NLP | 6月 |
| CVPR | CV | 6月 |
| AAAI | AI全般 | 2月 |
| COLM | 言語モデル | 10月 |

#### 検索テンプレート

```
# キーワード検索
https://openreview.net/search?term={keyword}&content=all

# 会議別検索
https://openreview.net/group?id=NeurIPS.cc/2025/Conference

# API検索
GET https://api2.openreview.net/notes/search?query={keyword}&limit=25&offset=0
```

---

### 1-4. Google Scholar

**検索URL**: `https://scholar.google.com/scholar?q=`

#### 検索テンプレート

```
# 基本検索
https://scholar.google.com/scholar?q={keyword}&as_ylo=2025

# 完全一致検索
https://scholar.google.com/scholar?q="{exact_phrase}"&as_ylo=2025

# 著者検索
https://scholar.google.com/scholar?q=author:"{author_name}"

# 被引用数順ソート
https://scholar.google.com/scholar?q={keyword}&as_ylo=2024&scisbd=1

# 特定ジャーナル/会議
https://scholar.google.com/scholar?q={keyword}+source:"{venue_name}"
```

#### Google Scholar Profiles（要注目研究者）

| 研究者 | 所属 | 専門 |
|---|---|---|
| Yann LeCun | Meta AI / NYU | Self-supervised Learning, World Models |
| Geoffrey Hinton | University of Toronto | Deep Learning, Capsule Networks |
| Yoshua Bengio | Mila / U. Montreal | Generative Models, Causality |
| Ilya Sutskever | Safe Superintelligence | Scaling Laws, Alignment |
| Jason Wei | OpenAI | Chain-of-Thought, Emergent Abilities |
| Hyung Won Chung | OpenAI | Instruction Tuning, Scaling |
| Tri Dao | Princeton / Together AI | FlashAttention, Efficient Training |
| Percy Liang | Stanford | Foundation Models (HELM), Benchmarks |
| Denny Zhou | Google DeepMind | Reasoning, Chain-of-Thought |

---

### 1-5. Semantic Scholar

**検索URL**: `https://www.semanticscholar.org/search?q=`
**API**: `https://api.semanticscholar.org/graph/v1/`

#### 検索テンプレート

```
# Web検索
https://www.semanticscholar.org/search?q={keyword}&sort=relevance&year%5B0%5D=2025

# API: 論文検索
GET https://api.semanticscholar.org/graph/v1/paper/search?query={keyword}&year=2025-&limit=20&fields=title,abstract,year,citationCount,authors,url

# API: 論文詳細（引用グラフ含む）
GET https://api.semanticscholar.org/graph/v1/paper/{paper_id}?fields=title,abstract,citations,references

# API: 著者検索
GET https://api.semanticscholar.org/graph/v1/author/search?query={author_name}&limit=5

# API: 推薦論文
GET https://api.semanticscholar.org/recommendations/v1/papers/?positivePaperIds={paper_id}&limit=10
```

#### Semantic Scholar特有機能

- **TLDR**: 論文の自動要約（1行）
- **Citation Intent**: 引用の意図分類（背景/手法/結果比較）
- **Influential Citations**: 影響力の高い引用のみフィルタ
- **Research Feeds**: パーソナライズドフィード

---

### 1-6. Connected Papers

**URL**: `https://www.connectedpapers.com/`

#### 使い方

```
# 論文の引用グラフを可視化
https://www.connectedpapers.com/search?q={keyword}

# 特定論文の関連論文マップ
https://www.connectedpapers.com/main/{arxiv_id}

# Prior Work（この論文が引用している重要論文）
# Derivative Work（この論文を引用している重要論文）
```

#### 活用シナリオ

- 新しい研究分野のランドスケープ把握
- 特定論文の前後関係の理解
- サーベイ論文の発見
- 見落としている重要論文の発見

---

### 1-7. DBLP

**検索URL**: `https://dblp.org/search?q=`
**API**: `https://dblp.org/search/publ/api`

```
# 著者の全出版物
https://dblp.org/search?q={author_name}

# API検索
GET https://dblp.org/search/publ/api?q={keyword}&format=json&h=20
```

---

### 1-8. ACL Anthology

**検索URL**: `https://aclanthology.org/search/?q=`

```
# NLP論文専門検索
https://aclanthology.org/search/?q={keyword}

# 会議別
https://aclanthology.org/venues/acl/
https://aclanthology.org/venues/emnlp/
https://aclanthology.org/venues/naacl/
```

---

### 1-9. ResearchRabbit

**URL**: `https://www.researchrabbit.ai/`

- 論文コレクション作成
- 類似論文の自動推薦
- 引用ネットワーク可視化
- メールアラート設定

---

## Layer 2: ペーパーキュレーション・デイリートラッキング

### 2-1. Hugging Face Daily Papers

**URL**: `https://huggingface.co/papers`

```
# 今日の注目論文
https://huggingface.co/papers

# 日付指定
https://huggingface.co/papers?date=2026-02-08

# 検索
https://huggingface.co/papers?q={keyword}
```

#### 特徴
- コミュニティ投票によるランキング
- 論文ごとにデモ/モデル/データセットへの直リンク
- Upvote数で注目度を把握

---

### 2-2. Daily AI Papers (GitHub)

**リポジトリ**: `https://github.com/daily-ai-papers`

- Arxiv新着論文の日次キュレーション
- カテゴリ別整理
- GitHub Starで人気度を追跡

---

### 2-3. @_akhaliq（AK）Twitter/X

**プロフィール**: `https://x.com/_akhaliq`

```
# AKの最新投稿（論文速報）
from:_akhaliq min_faves:100 since:{date}

# AKの論文紹介（特定トピック）
from:_akhaliq "{keyword}" min_faves:50
```

#### 特徴
- Arxiv新着論文の最速キュレーション（毎日数十本）
- デモ動画/GIF付きで直感的
- HuggingFace Papers Pageの主要コントリビューター

---

### 2-4. Alpha Signal

**URL**: `https://alphasignal.ai/`

- AIニュースの日次ダイジェスト
- 論文・リリース・ツールの統合フィード
- メールニュースレター

---

### 2-5. ML News Aggregators

| サービス | URL | 特徴 |
|---|---|---|
| **Papers with Code Newsletter** | `https://paperswithcode.com/newsletter` | 週次ベストペーパー |
| **The Batch (Andrew Ng)** | `https://www.deeplearning.ai/the-batch/` | 週次AI業界ニュース |
| **Import AI (Jack Clark)** | `https://importai.substack.com/` | 週次AI研究動向 |
| **AI Tidbits** | `https://aitidbits.substack.com/` | 日次AI最新情報 |
| **Ahead of AI (Sebastian Raschka)** | `https://magazine.sebastianraschka.com/` | LLM研究月次まとめ |
| **The Neuron** | `https://www.theneurondaily.com/` | 日次AIニュース |
| **TLDR AI** | `https://tldr.tech/ai` | 日次AI技術ニュース |
| **Ben's Bites** | `https://bensbites.beehiiv.com/` | 日次AIプロダクト |
| **Davis Summarizes Papers** | YouTube | 論文の動画解説 |
| **Yannic Kilcher** | YouTube | 論文の詳細レビュー |
| **AI Explained** | YouTube | AI技術の解説 |

---

### 2-6. X（Twitter）論文速報アカウント

| アカウント | 専門 | フォロー推奨度 |
|---|---|---|
| `@_akhaliq` | Arxiv新着全般（毎日数十本） | ★★★★★ |
| `@lilianweng` | LLMエージェント・サーベイ | ★★★★★ |
| `@kaboroevich` | ML研究・ベンチマーク | ★★★★ |
| `@rasaborjr` | NLP・LLM研究 | ★★★★ |
| `@oaborjr` | CV・マルチモーダル | ★★★★ |
| `@reach_vb` | HuggingFace・OSS ML | ★★★★ |
| `@lababorjr` | ロボティクス・VLA | ★★★ |
| `@ylaborjr` | エージェント・ツール | ★★★ |

```
# 論文速報の横断検索
(from:_akhaliq OR from:lilianweng OR from:kaboroevich) "{keyword}" since:{date}
```

---

## Layer 3: テックブログ・研究解説

### 3-1. Lil'Log（Lilian Weng）

**URL**: `https://lilianweng.github.io/`

| テーマ | 代表記事 |
|---|---|
| LLMエージェント | "LLM Powered Autonomous Agents" |
| プロンプト | "Prompt Engineering" |
| 拡散モデル | "What are Diffusion Models?" |
| アテンション | "Attention? Attention!" |
| 強化学習 | "A Long Peek into Reinforcement Learning" |

```
# サイト内検索
site:lilianweng.github.io {keyword}
```

---

### 3-2. Distill.pub

**URL**: `https://distill.pub/`

- インタラクティブな可視化付き論文
- Transformer, Attention, Feature Visualizationの名解説
- 2021年以降更新停止だが、基礎理解に必須

---

### 3-3. The Gradient

**URL**: `https://thegradient.pub/`

- AI研究の長文解説記事
- インタビュー・オピニオン
- 学術とビジネスの橋渡し

---

### 3-4. Jay Alammar

**URL**: `https://jalammar.github.io/`

| テーマ | 代表記事 |
|---|---|
| Transformer | "The Illustrated Transformer" |
| BERT | "The Illustrated BERT" |
| GPT-2/3 | "The Illustrated GPT-2" |
| Word2Vec | "The Illustrated Word2Vec" |
| Stable Diffusion | "The Illustrated Stable Diffusion" |

---

### 3-5. Andrej Karpathy

**URL**: `https://karpathy.ai/`
**YouTube**: `https://www.youtube.com/@AndrejKarpathy`

| コンテンツ | 特徴 |
|---|---|
| "Neural Networks: Zero to Hero" | ゼロからのNN実装シリーズ |
| "Let's build GPT" | GPTを手作りで実装 |
| "Intro to LLMs" | LLMの包括的入門 |
| ブログ記事 | 技術的深掘り |

```
# YouTube検索
site:youtube.com "Andrej Karpathy" {keyword}
```

---

### 3-6. Sebastian Raschka

**URL**: `https://sebastianraschka.com/`
**Substack**: `https://magazine.sebastianraschka.com/`

| コンテンツ | 特徴 |
|---|---|
| "Ahead of AI" Magazine | LLM研究の月次まとめ（必読） |
| "Build a Large Language Model" | 書籍（LLM実装ガイド） |
| ブログ | DL/ML研究の解説 |

---

### 3-7. Chip Huyen

**URL**: `https://huyenchip.com/blog/`

| テーマ | 代表記事 |
|---|---|
| MLOps | "Designing Machine Learning Systems"（書籍） |
| LLMOps | LLMデプロイ・運用のベストプラクティス |
| キャリア | ML/AI業界のキャリアガイド |

---

### 3-8. Eugene Yan

**URL**: `https://eugeneyan.com/`

| テーマ | 代表記事 |
|---|---|
| RecSys | 推薦システムの実務 |
| LLM応用 | LLMの産業応用パターン |
| ML実務 | MLエンジニアリングの実践 |

---

### 3-9. その他の注目ブログ・リソース

| ブログ | URL | 特徴 |
|---|---|---|
| **Anthropic Research** | `https://www.anthropic.com/research` | Claude開発元の研究 |
| **OpenAI Research** | `https://openai.com/research` | GPT/DALL-E等の公式研究 |
| **Google AI Blog** | `https://blog.google/technology/ai/` | Google/DeepMind研究 |
| **Meta AI Research** | `https://ai.meta.com/research/` | Llama/FAIR研究 |
| **DeepMind Blog** | `https://deepmind.google/discover/blog/` | Gemini/AlphaFold研究 |
| **Microsoft Research** | `https://www.microsoft.com/en-us/research/blog/` | AutoGen/Copilot研究 |
| **Hugging Face Blog** | `https://huggingface.co/blog` | OSS ML最新動向 |
| **Weights & Biases Blog** | `https://wandb.ai/fully-connected` | MLOps・実験管理 |
| **Cohere For AI** | `https://cohere.com/research` | Aya/Command-R研究 |
| **AI2 Blog (Allen AI)** | `https://blog.allenai.org/` | OLMo/Tulu研究 |

---

## Layer 4: 実装エコシステム

### 4-1. Hugging Face Hub

**URL**: `https://huggingface.co/`

```
# モデル検索
https://huggingface.co/models?search={keyword}&sort=trending

# データセット検索
https://huggingface.co/datasets?search={keyword}&sort=trending

# Spaces（デモ）検索
https://huggingface.co/spaces?search={keyword}&sort=trending

# コレクション
https://huggingface.co/collections

# Smolagents（エージェントフレームワーク）
https://huggingface.co/docs/smolagents
```

#### HF Smolagents

```python
# Smolagentsの検索
https://huggingface.co/docs/smolagents/index
https://github.com/huggingface/smolagents

# Smolagentsのツール検索
https://huggingface.co/spaces?search=smolagents&sort=trending
```

---

### 4-2. awesome-* リポジトリ

| リポジトリ | Stars | 内容 |
|---|---|---|
| `awesome-llm` | 20K+ | LLM論文・ツール・リソース総合 |
| `awesome-chatgpt-prompts` | 100K+ | プロンプトテンプレート集 |
| `awesome-langchain` | 7K+ | LangChainエコシステム |
| `awesome-generative-ai` | 5K+ | 生成AI全般 |
| `awesome-llm-agents` | 3K+ | LLMエージェント論文・実装 |
| `awesome-ai-agents` | 5K+ | AIエージェントフレームワーク |
| `awesome-machine-learning` | 65K+ | ML全般 |
| `awesome-deep-learning` | 22K+ | DL全般 |
| `awesome-mlops` | 13K+ | MLOps全般 |
| `awesome-production-machine-learning` | 16K+ | 本番ML |
| `awesome-self-hosted` | 190K+ | セルフホスト可能ツール |
| `awesome-rag` | 2K+ | RAG論文・実装 |
| `awesome-local-ai` | 1K+ | ローカルAI |

```
# GitHub検索テンプレート
https://github.com/search?q={keyword}+awesome&type=repositories&s=stars&o=desc
```

---

### 4-3. エージェントフレームワーク

| フレームワーク | GitHub | 特徴 |
|---|---|---|
| **LangChain** | `langchain-ai/langchain` | 最大のLLMフレームワーク |
| **LlamaIndex** | `run-llama/llama_index` | RAG特化フレームワーク |
| **CrewAI** | `crewAIInc/crewAI` | マルチエージェントオーケストレーション |
| **AutoGen** | `microsoft/autogen` | MS製マルチエージェント |
| **AutoGPT** | `Significant-Gravitas/AutoGPT` | 自律AIエージェント |
| **OpenDevin** | `All-Hands-AI/OpenHands` | AI開発エージェント |
| **CAMEL** | `camel-ai/camel` | コミュニカティブエージェント |
| **MetaGPT** | `geekan/MetaGPT` | マルチエージェントフレームワーク |
| **Voyager** | `MineDojo/Voyager` | 具身エージェント（Minecraft） |
| **BabyAGI** | `yoheinakajima/babyagi` | タスク駆動自律エージェント |
| **DSPy** | `stanfordnlp/dspy` | プログラマティックLLM制御 |
| **Semantic Kernel** | `microsoft/semantic-kernel` | MS製AI統合フレームワーク |
| **Haystack** | `deepset-ai/haystack` | RAGパイプライン |
| **Pydantic AI** | `pydantic/pydantic-ai` | 型安全AIエージェント |
| **Claude Code** | Anthropic | CLIベースAIエージェント |
| **Devin** | Cognition Labs | 自律ソフトウェアエンジニア |
| **SWE-agent** | `princeton-nlp/SWE-agent` | コーディングエージェント |

```
# GitHub Trending（ML/AI）
https://github.com/trending?since=weekly&spoken_language_code=&language=python

# GitHub検索（エージェント）
https://github.com/search?q=llm+agent&type=repositories&s=stars&o=desc
```

---

### 4-4. MLOps・インフラ

| ツール/サービス | URL | 用途 |
|---|---|---|
| **vLLM** | `https://github.com/vllm-project/vllm` | 高速LLM推論 |
| **Ollama** | `https://ollama.com/` | ローカルLLM実行 |
| **llama.cpp** | `https://github.com/ggerganov/llama.cpp` | CPU推論 |
| **TensorRT-LLM** | NVIDIA | GPU最適化推論 |
| **MLflow** | `https://mlflow.org/` | 実験管理 |
| **Weights & Biases** | `https://wandb.ai/` | 実験追跡 |
| **DVC** | `https://dvc.org/` | データバージョン管理 |
| **BentoML** | `https://www.bentoml.com/` | モデルサービング |
| **Ray** | `https://www.ray.io/` | 分散学習/推論 |
| **Unsloth** | `https://github.com/unslothai/unsloth` | 高速ファインチューニング |
| **Axolotl** | `https://github.com/OpenAccess-AI-Collective/axolotl` | LLMファインチューニング |
| **LitGPT** | `https://github.com/Lightning-AI/litgpt` | GPT実装・訓練 |

---

### 4-5. 教育・コースリソース

| リソース | URL | 特徴 |
|---|---|---|
| **Full Stack Deep Learning** | `https://fullstackdeeplearning.com/` | DLの実務的コース |
| **Made With ML** | `https://madewithml.com/` | MLOps実践コース |
| **fast.ai** | `https://www.fast.ai/` | 実践重視DLコース |
| **Stanford CS224N** | `https://web.stanford.edu/class/cs224n/` | NLP（Manning） |
| **Stanford CS229** | `https://cs229.stanford.edu/` | ML（Andrew Ng） |
| **Stanford CS25** | `https://web.stanford.edu/class/cs25/` | Transformer |
| **MIT 6.S191** | `https://introtodeeplearning.com/` | DL入門 |
| **Hugging Face Course** | `https://huggingface.co/learn` | Transformers/NLP/RL |
| **DeepLearning.AI** | `https://www.deeplearning.ai/` | Andrew Ngのコース群 |

---

## Layer 5: SNSプラットフォーム検索

### 5-1. X（旧Twitter）

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

### 5-2. Reddit

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
| r/StableDiffusion | `subreddit:StableDiffusion "{keyword}"` |
| r/learnmachinelearning | `subreddit:learnmachinelearning "{keyword}"` |
| r/deeplearning | `subreddit:deeplearning "{keyword}"` |
| r/LanguageTechnology | `subreddit:LanguageTechnology "{keyword}"` |

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

### 5-3. note.com（日本）

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

---

### 5-4. YouTube

**検索URL**: `https://www.youtube.com/results?search_query=`

#### ハッシュタグ・キーワード

| カテゴリ | キーワード |
|---|---|
| 技術解説 | `#AI #MachineLearning #DeepLearning #LLM #GenerativeAI` |
| 開発 | `#ClaudeCode #VibeCoding #CursorAI #GitHubCopilot #AIAgent` |
| 日本語 | `#生成AI #ChatGPT活用 #AIエージェント #プロンプトエンジニアリング` |
| 中国語 | `#AI编程 #大语言模型 #AI智能体` |

#### AI YouTube チャンネル

| チャンネル | 内容 |
|---|---|
| **Yannic Kilcher** | 論文レビュー（詳細） |
| **Two Minute Papers** | 論文速報（2分解説） |
| **AI Explained** | AI技術の解説 |
| **3Blue1Brown** | 数学/DLの可視化 |
| **Andrej Karpathy** | NN/LLM実装 |
| **Fireship** | 技術速報（10分） |
| **Matt Williams (Ollama)** | ローカルLLM |
| **Matthew Berman** | AIツールレビュー |
| **Dave's Garage** | AI技術解説 |

---

### 5-5. Instagram / TikTok / Shorts

#### ハッシュタグ

| プラットフォーム | トップハッシュタグ |
|---|---|
| **Instagram** | `#AI #ArtificialIntelligence #GenerativeAI #ChatGPT #AIArt #MachineLearning #AITools #TechTrends2026` |
| **TikTok** | `#AI #AITools #ChatGPT #AIHack #TechTok #LearnOnTikTok #VibeCoding #AIAgent` |
| **YouTube Shorts** | `#Shorts #AI #AITutorial #GenerativeAI #ClaudeCode` |

---

### 5-6. 中国SNS

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

### 5-7. その他プラットフォーム

| プラットフォーム | 検索URL | キーワード |
|---|---|---|
| **Medium** | `https://medium.com/search?q=` | AI Agent, RAG, Vibe Coding, LLM |
| **Qiita** | `https://qiita.com/search?q=` | Claude Code, 生成AI, AIエージェント |
| **Zenn** | `https://zenn.dev/search?q=` | LLM, RAG, MCP, AI開発 |
| **Hacker News** | `https://hn.algolia.com/?q=` | AI Agent, Claude, GPT, LLM |
| **Naver Blog** | `https://search.naver.com/search.naver?where=blog&query=` | AI 개발, 생성형 AI, AI 에이전트 |
| **LinkedIn** | `https://www.linkedin.com/search/results/content/?keywords=` | AI Agent, Generative AI, MCP |
| **Dev.to** | `https://dev.to/search?q=` | AI, LLM, Agent, MCP |
| **Hashnode** | `https://hashnode.com/search?q=` | AI, Machine Learning, LLM |
| **Stack Overflow** | `https://stackoverflow.com/search?q=` | [llm], [langchain], [openai] |
| **Product Hunt** | `https://www.producthunt.com/search?q=` | AI tools, AI agent |

---

## Layer 6: コミュニティ・フォーラム

### 6-1. Discord

| サーバー | 招待/URL | 特徴 |
|---|---|---|
| **Hugging Face** | `https://discord.gg/huggingface` | OSS ML最大コミュニティ |
| **EleutherAI** | `https://discord.gg/eleutherai` | GPT-NeoX, Pythia等 |
| **LAION** | `https://discord.gg/laion` | CLIP, Open Dataset |
| **LangChain** | `https://discord.gg/langchain` | LangChain開発者 |
| **Ollama** | `https://discord.gg/ollama` | ローカルLLM |
| **Stable Diffusion** | `https://discord.gg/stablediffusion` | 画像生成 |
| **Midjourney** | `https://discord.gg/midjourney` | 画像生成 |
| **Together AI** | Discord | オープンモデル |

### 6-2. Slack

| ワークスペース | 特徴 |
|---|---|
| **MLOps Community** | MLOps実務者コミュニティ（15K+メンバー） |
| **dbt Community** | データエンジニアリング |
| **Locally Optimistic** | データ分析 |

### 6-3. GitHub Discussions

```
# リポジトリ内ディスカッション
https://github.com/{owner}/{repo}/discussions?q={keyword}

# 注目ディスカッション
https://github.com/langchain-ai/langchain/discussions
https://github.com/microsoft/autogen/discussions
https://github.com/vllm-project/vllm/discussions
```

### 6-4. Stack Overflow AI Tags

```
# AI関連タグ
https://stackoverflow.com/questions/tagged/large-language-model
https://stackoverflow.com/questions/tagged/langchain
https://stackoverflow.com/questions/tagged/openai-api
https://stackoverflow.com/questions/tagged/huggingface-transformers
https://stackoverflow.com/questions/tagged/pytorch
```

---

## 研究トラック別検索ガイド

### Track 1: LLMオーケストレーション & エージェント協調

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"multi-agent" "LLM"` | AutoGen, CAMEL, MetaGPT |
| `"agent collaboration"` | Voyager, Generative Agents |
| `"tool-augmented LLM"` | Toolformer, Gorilla |
| `"ReAct"` | ReAct: Synergizing Reasoning and Acting |
| `"tree of thoughts"` | Tree of Thoughts: Deliberate Problem Solving |
| `"function calling"` | Tool Use in LLMs |
| `"agentic workflow"` | Agentic Patterns (Andrew Ng) |

```
# Arxiv検索
https://arxiv.org/search/?query="multi-agent"+LLM&searchtype=all&order=-announced_date_first

# Semantic Scholar
https://www.semanticscholar.org/search?q=multi-agent+LLM+collaboration&sort=relevance
```

### Track 2: メモリ & リフレクション

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"long-term memory" "LLM"` | MemGPT, Mem0 |
| `"reflection" "agent"` | Reflexion, Self-Refine |
| `"retrieval augmented"` | RAG, RETRO, Atlas |
| `"episodic memory"` | Generative Agents (Stanford) |
| `"knowledge graph" "LLM"` | GraphRAG (Microsoft) |
| `"context window" "extension"` | LongRoPE, YaRN, ALiBi |

```
# Arxiv検索
https://arxiv.org/search/?query="memory"+LLM+agent&searchtype=all&order=-announced_date_first
```

### Track 3: マルチモーダル統合

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"vision language action"` | VLA, RT-2 |
| `"multimodal LLM"` | GPT-4V, Gemini, LLaVA |
| `"text-to-video"` | Sora, Veo, Kling |
| `"text-to-image"` | DALL-E 3, Stable Diffusion 3, Flux |
| `"code generation" "multimodal"` | CogAgent, SeeClick |
| `"embodied AI"` | PaLM-E, SayCan |

```
# Arxiv検索
https://arxiv.org/search/?query="vision+language+action"+OR+"VLA"&searchtype=all
```

### Track 4: 効率化 & スケーリング

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"mixture of experts"` | Mixtral, Switch Transformer |
| `"quantization" "LLM"` | GPTQ, AWQ, GGUF |
| `"knowledge distillation"` | TinyLlama, Phi |
| `"flash attention"` | FlashAttention-2, FlashAttention-3 |
| `"speculative decoding"` | Medusa, EAGLE |
| `"scaling laws"` | Chinchilla, Kaplan et al. |

### Track 5: アライメント & 安全性

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"RLHF"` | InstructGPT, Constitutional AI |
| `"DPO"` | Direct Preference Optimization |
| `"red teaming"` | Red Teaming LLMs |
| `"jailbreak"` | Jailbreak Attacks & Defenses |
| `"AI safety"` | Anthropic Research, ARC |
| `"interpretability"` | Mechanistic Interpretability |

---

## gpt-researcher 統合

### 統合モード

| モード | 動作 | 適用場面 |
|---|---|---|
| **quick** | WebSearch + SNS検索のみ（APIキー不要） | 速報・トレンド確認 |
| **standard** | quick + note.com API + Reddit API | 日常リサーチ |
| **deep** | standard + gpt-researcher deep_research | 包括的調査レポート |
| **academic** | Layer 1-2特化（Arxiv/S2/PwC + キュレーション） | 論文サーベイ |
| **survey** | academic + Layer 3（ブログ解説）+ 研究トラック分析 | 研究動向レポート |
| **ecosystem** | Layer 4特化（GitHub/HF/フレームワーク比較） | 実装調査 |

### 実行フロー

```
入力: /world-research キーワード=MCP Server モード=deep

Step 1: キーワード展開
  MCP Server → MCP, Model Context Protocol, MCPサーバー, MCP服务器
  学術変換 → "model context protocol" "tool integration" "LLM plugin"

Step 2: Layer 1 学術検索（並列実行）
  ├── Arxiv: "model context protocol" OR "MCP" cat:cs.CL
  ├── Semantic Scholar: model context protocol LLM
  ├── Papers with Code: MCP server
  └── Google Scholar: "model context protocol" 2025-2026

Step 3: Layer 2 キュレーション確認（並列実行）
  ├── HF Daily Papers: MCP
  ├── @_akhaliq: from:_akhaliq "MCP"
  └── Alpha Signal: MCP

Step 4: Layer 3 ブログ・解説検索
  ├── site:lilianweng.github.io MCP
  ├── site:huggingface.co/blog MCP
  └── Anthropic Research: MCP

Step 5: Layer 4 実装エコシステム検索
  ├── GitHub: MCP server stars:>100
  ├── HF Hub: MCP
  └── npm/PyPI: MCP server

Step 6: Layer 5 SNS横断検索（並列実行）
  ├── X: "MCP Server" min_faves:100 lang:en/ja/zh
  ├── Reddit: subreddit:ClaudeAI "MCP"
  ├── note.com: https://note.com/search?q=MCP+Server
  ├── YouTube: MCP Server tutorial 2026
  ├── Bilibili: MCP Server AI Agent
  └── Medium: "MCP Server" "AI Agent"

Step 7: Layer 6 コミュニティ検索
  ├── HN: https://hn.algolia.com/?q=MCP+server
  ├── Stack Overflow: [mcp] or MCP server
  └── GitHub Discussions: MCP

Step 8: gpt-researcher deep_research（deepモード時）
  → 100+ソース探索
  → 検証・フィルタリング
  → 引用付きレポート生成

Step 9: 統合レポート出力
  ├── 学術論文サマリー
  ├── 技術動向分析
  ├── 実装エコシステムマップ
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

> **quick/standard/academicモードはAPIキー不要**（WebSearch + WebFetch + 非公式APIのみ）

---

## 実行テンプレート

### 1. グローバルトレンド調査

```bash
/world-research キーワード=AI Agent 2026 モード=standard

# 実行内容:
# - Layer 5: X/Reddit/note.com/YouTube/中国SNSで横断検索
# - Layer 6: HN/Reddit/Discordでコミュニティ動向
# - 統合トレンドレポート出力
```

### 2. 特定ツール深掘り

```bash
/world-research キーワード=Claude Code Vibe Coding モード=deep

# 実行内容:
# - 全6層で横断検索
# - gpt-researcher で100+ソース深層調査
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

### 4. 論文サーベイ

```bash
/world-research キーワード=multi-agent LLM モード=survey トラック=agent

# 実行内容:
# - Layer 1: Arxiv/S2/PwC/OpenReviewで論文検索
# - Layer 2: HF Daily Papers/@_akhaliq で最新論文
# - Layer 3: Lil'Log/Karpathyで解説記事
# - Connected Papersで引用グラフ
# - 研究トラック分析レポート
```

### 5. 実装エコシステム調査

```bash
/world-research キーワード=RAG pipeline モード=ecosystem

# 実行内容:
# - Layer 4: GitHub/HF Hub/awesome-*で実装検索
# - フレームワーク比較（LangChain vs LlamaIndex vs Haystack）
# - GitHub Stars推移・コミュニティ活性度
# - 実装エコシステムマップ
```

### 6. 研究者フォロー

```bash
/world-research 研究者=Lilian Weng モード=academic

# 実行内容:
# - Google Scholar: 最新論文
# - Semantic Scholar: 引用グラフ
# - X: from:lilianweng
# - ブログ: lilianweng.github.io
# - 研究者プロフィールレポート
```

---

## 出力形式

### レポートテンプレート

```markdown
# {keyword} 総合リサーチレポート

**調査日**: {date}
**検索キーワード**: {keywords (ja/en/zh)}
**検索対象**: {layers_used} （6層中）
**プラットフォーム数**: {platform_count}
**モード**: {quick|standard|deep|academic|survey|ecosystem}

---

## エグゼクティブサマリー

{3-5行の要約}

---

## 学術論文（Layer 1）

### 最新論文 Top 10
| # | タイトル | 著者 | 会議/Arxiv | 引用数 | URL |
|---|---------|------|-----------|--------|-----|
{top_papers}

### 研究トレンド
{research_trends}

---

## 注目キュレーション（Layer 2）

### HF Daily Papers
{hf_daily}

### 論文速報（@_akhaliq等）
{paper_alerts}

---

## 技術解説（Layer 3）

### ブログ記事
| ブログ | タイトル | URL |
|--------|---------|-----|
{blog_posts}

---

## 実装エコシステム（Layer 4）

### GitHub リポジトリ Top 10
| # | リポジトリ | Stars | 言語 | 最終更新 | URL |
|---|-----------|-------|------|---------|-----|
{top_repos}

### フレームワーク比較
{framework_comparison}

---

## SNS動向（Layer 5）

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

## コミュニティ動向（Layer 6）

### Hacker News
{hn_discussions}

### Discord / Slack
{community_discussions}

---

## 研究トラック分析

### 主要研究トラック
{research_tracks}

### 引用グラフ（Connected Papers）
{citation_graph}

---

## トレンド分析

### キーワード別バズ度
{keyword_buzz_analysis}

### 地域別インサイト
{regional_insights}

### 時系列トレンド
{timeline_trends}

---

## 引用・ソース
{citations}

---

## 推奨アクション
{recommended_actions}
```

---

## 制限事項

1. **レート制限**: 各プラットフォームのAPIレート制限を遵守（1秒間隔）
2. **認証**: ログイン必須データ（Instagram DM等）は取得不可
3. **中国SNS**: 一部はアプリ内検索のみ（API非公開）
4. **deepモード**: gpt-researcher使用時はAPIキーが必要
5. **Semantic Scholar API**: 無料枠は100リクエスト/5分
6. **Arxiv API**: 3秒間隔を推奨
7. **Discord/Slack**: 公開チャンネルのみ検索可能
8. **Google Scholar**: スクレイピング制限あり（CAPTCHAが出る場合あり）

## 関連スキル

- `gpt-researcher` - 深層調査エンジン（統合済み）
- `note-research` - note.com特化リサーチ
- `research-free` - APIキー不要汎用リサーチ
- `mega-research` - 6API統合リサーチ
- `mega-research-plus` - 8ソース統合リサーチ
- `keyword-free` - キーワード抽出
- `keyword-mega-extractor` - 多角的キーワード展開
- `research-cited-report` - 出典付きレポート生成
- `unified-research` - 複数API統合リサーチ
