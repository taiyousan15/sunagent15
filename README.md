# TAISUN v2

**Unified Development & Marketing Platform** - AIエージェント、MCPツール、マーケティングスキルを統合した次世代開発プラットフォーム

[![CI](https://github.com/san15/taisun_agent/actions/workflows/ci.yml/badge.svg)](https://github.com/san15/taisun_agent/actions/workflows/ci.yml)
[![Security Scan](https://github.com/san15/taisun_agent/actions/workflows/security.yml/badge.svg)](https://github.com/san15/taisun_agent/actions/workflows/security.yml)
[![Node.js](https://img.shields.io/badge/Node.js-18.x%20%7C%2020.x-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-692%20passing-brightgreen)](https://github.com/san15/taisun_agent/actions)

---

## アップデートのお知らせ

> **2026-01-07: セキュリティ強化アップデート**
>
> MCPツールの入力検証とインジェクション防止機能を追加しました。
>
> ### アップデート方法
> ```bash
> cd taisun_agent
> git pull origin main
> npm install
> ```
>
> ### セキュリティ修正内容
> - **Chrome パス検証**: コマンドインジェクション防止（ホワイトリスト検証）
> - **JSON プロトタイプ汚染対策**: `__proto__`等の危険キー自動除去
> - **スキル名検証**: パストラバーサル攻撃防止（CWE-22）
> - **メモリ入力検証**: DoS防止（サイズ制限・サニタイズ）
>
> ### 新規ユーティリティ
> - `src/utils/safe-json.ts` - 安全なJSONパーサー

---

> **2026-01-07: UTF-8安全対策をリリースしました**
>
> 日本語/マルチバイト文字を含むファイルの編集時にクラッシュ・文字化けが発生する問題への対策を追加しました。
>
> ### 新機能
> - **safe-replace**: Unicode安全な置換ツール
> - **utf8-guard**: 文字化け自動検知
> - **品質ゲート強化**: CIでエンコーディングチェック
>
> 詳細: [docs/operations/text-safety-ja.md](docs/operations/text-safety-ja.md)

---

## はじめての方へ

> **重要**: TAISUN v2は **Claude Code の拡張機能** です。
> インストール後、このディレクトリで Claude Code を起動すると、81のエージェントと59のスキルが自動的に使えるようになります。

### 1. インストール（5分）

```bash
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent
npm install
npm test  # 692テストがパスすればOK
```

### 2. 使い方（超簡単）

```bash
cd taisun_agent
claude  # Claude Code を起動
```

**あとは普通に会話するだけ:**

```
あなた: 「セールスレターを書いて」
Claude: /sales-letter スキルで作成します...

あなた: 「このコードをレビューして」
Claude: code-reviewer エージェントで分析します...
```

### 3. 詳細ガイド

| ドキュメント | 内容 |
|-------------|------|
| [QUICK_START.md](docs/QUICK_START.md) | 詳細セットアップ手順 |
| [CONTEXT_MANAGEMENT.md](docs/CONTEXT_MANAGEMENT.md) | コンテキスト管理システム完全ガイド（99%削減の仕組み） |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | エラー解決 |
| [CONFIG.md](docs/CONFIG.md) | 設定カスタマイズ |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | 開発参加方法 |

---

## Overview

TAISUN v2は、Claude Codeと連携し、設計から実装、テスト、デプロイ、マーケティングまでを一貫して支援する**統合開発・マーケティングプラットフォーム**です。

```
┌─────────────────────────────────────────────────────────────┐
│                    TAISUN v2 Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │   Claude    │◄──│  Proxy MCP  │──►│  32 External │       │
│  │    Code     │   │   Server    │   │  MCP Servers │       │
│  └─────────────┘   └──────┬──────┘   └─────────────┘       │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐              │
│         ▼                 ▼                 ▼              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ 81 Agents   │   │  59 Skills  │   │ 76 Commands │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### System Statistics

| Component | Count | Description |
|-----------|-------|-------------|
| **AI Agents** | 81 | 専門家エージェント (AIT42 +  + Diagnostics) |
| **Skills** | 67 | マーケティング・インフラ自動化スキル |
| **Commands** | 74 | ショートカットコマンド |
| **MCP Servers** | 32 | 外部サービス連携 |
| **MCP Tools** | 227 | 統合ツール群 |
| **Source Lines** | 11,167 | TypeScript (proxy-mcp) |
| **Tests** | 524 | ユニット・統合テスト |

## Key Features

### 1. Single MCP Entrypoint (Proxy MCP)

5つのツールで32+の外部MCPサーバーを統合管理:

```typescript
// 5 Public Tools
system_health   // ヘルスチェック
skill_search    // スキル検索
skill_run       // スキル実行
memory_add      // コンテンツ保存
memory_search   // コンテンツ検索
```

### 2. Hybrid Router

- **ルールベース安全性**: 危険操作の自動検出・ブロック
- **セマンティック検索**: 類似度ベースのMCP選択
- **人間承認フロー**: 高リスク操作のエスカレーション

### 3. Multi-Agent System (81 Agents)

| Category | Count | Examples |
|----------|-------|----------|
| **Coordinators** | 5 | ait42-coordinator, omega-aware-coordinator, initialization-orchestrator |
| **Diagnostics & Recovery** | 5 | system-diagnostician, error-recovery-planner, environment-doctor 🆕 |
| **Architecture** | 6 | system-architect, api-designer, security-architect |
| **Development** | 6 | backend-developer, frontend-developer, api-developer |
| **Quality Assurance** | 8 | code-reviewer, test-generator, security-tester |
| **Operations** | 8 | devops-engineer, incident-responder, cicd-manager |
| **Documentation** | 3 | tech-writer, doc-reviewer, knowledge-manager |
| **Analysis** | 4 | complexity-analyzer, feedback-analyzer |
| **Specialized** | 5 | bug-fixer, refactor-specialist, feature-builder |
| **Multi-Agent** | 4 | competition, debate, ensemble, reflection |
| **Process** | 5 | workflow-coordinator, requirements-elicitation |
| **** | 6 | -codegen-agent, -pr-agent |

### 4. Skill Library (67 Skills)

#### Marketing & Sales (15)
- `copywriting-helper` - コピーライティング支援
- `sales-letter` - セールスレター作成
- `step-mail` - ステップメール作成
- `vsl` - ビデオセールスレター
- `launch-video` - ローンチ動画スクリプト
- `lp-generator` / `lp-analysis` / `mendan-lp` - LP作成・分析
- `funnel-builder` - ファネル構築
- `customer-support` - カスタマーサポート
- `taiyo-style` - 太陽スタイル適用

#### Content Creation (10)
- `kindle-publishing` - Kindle本出版
- `youtube-content` / `youtube-thumbnail` - YouTube企画・サムネイル
- `manga-production` / `anime-production` - 漫画・アニメ制作
- `diagram-illustration` - 図解作成
- `sns-marketing` - SNSマーケティング

#### AI Image & Video (5)
- `gemini-image-generator` - Gemini画像生成
- `nanobanana-pro` / `nanobanana-prompts` - NanoBanana統合
- `omnihuman1-video` - AIアバター動画
- `japanese-tts-reading` - 日本語TTS

#### Infrastructure (11)
- `workflow-automation-n8n` - n8nワークフロー
- `docker-mcp-ops` - Docker操作
- `security-scan-trivy` - セキュリティスキャン
- `pdf-automation-gotenberg` - PDF自動化
- `doc-convert-pandoc` - ドキュメント変換
- `postgres-mcp-analyst` - PostgreSQL分析
- `notion-knowledge-mcp` - Notionナレッジ
- `unified-notifications-apprise` - 通知統合

### 5. Production-Grade Operations

- **Circuit Breaker**: 障害耐性・自動復旧
- **Incident Lifecycle (P17)**: インシデント相関・ノイズ削減・週次ダイジェスト
- **Scheduled Jobs (P18)**: 日次/週次レポート自動生成
- **Observability**: Prometheus/Grafana/Loki統合

---

## MCPツール完全リファレンス

TAISUN v2では、**3つのMCPサーバー**と**11のMCPツール**を提供しています。

### MCPアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code CLI                          │
├─────────────────────────────────────────────────────────────┤
│  MCPサーバー                                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  taisun-proxy (メイン統合エントリーポイント)              ││
│  │  ├── Router (ルール/セマンティックルーティング)          ││
│  │  ├── Memory (短期/長期記憶)                              ││
│  │  ├── Skillize (66スキル実行)                             ││
│  │  ├── Supervisor (ワークフロー制御)                       ││
│  │  └── 内部MCP (github/notion/postgres/filesystem)        ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ claude-mem-search│  │     ide          │                 │
│  │ (履歴/学習検索)   │  │ (VS Code連携)    │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### MCPサーバー詳細

#### 1. TAISUN Proxy MCP（メインサーバー）

統合エントリーポイント。すべての機能を5つのツールで提供。

| ツール | 説明 | 使用例 |
|-------|------|-------|
| `system_health` | システム稼働状況確認、ヘルスチェック | `mcp__taisun-proxy__system_health()` |
| `skill_search` | 66スキルの検索（キーワードまたは全件） | `skill_search(query="taiyo")` |
| `skill_run` | スキルのロード・実行 | `skill_run(name="youtube-thumbnail")` |
| `memory_add` | 大規模コンテンツの保存、参照ID発行 | `memory_add(content="データ", type="long-term")` |
| `memory_search` | 参照IDまたはキーワードでメモリ検索 | `memory_search(query="LP作成")` |

**内部MCP（Rollout管理）:**
- `github` - GitHub Issue/PR連携
- `notion` - Notionナレッジベース
- `postgres` - PostgreSQLデータ分析
- `filesystem` - ファイルシステム操作

#### 2. Claude Memory Search MCP

過去のセッション記録・学習履歴を効率的に検索。**3層ワークフロー**で10倍のトークン節約。

| ツール | 説明 | パラメータ |
|-------|------|-----------|
| `search` | メモリ検索（インデックス取得） | query, limit, project, type, dateStart, dateEnd |
| `timeline` | 結果周辺のコンテキスト取得 | anchor, depth_before, depth_after |
| `get_observations` | フィルタ済みIDの詳細取得 | ids (配列), orderBy, limit |

**推奨ワークフロー:**
```javascript
// 1. 検索でIDを取得（〜50-100トークン/件）
search(query="LP作成") → IDs

// 2. 興味のあるIDの周辺コンテキスト取得
timeline(anchor=123)

// 3. 必要なIDのみ詳細取得
get_observations(ids=[123, 124])
```

#### 3. IDE MCP

VS Code連携による開発支援。

| ツール | 説明 |
|-------|------|
| `getDiagnostics` | 言語診断情報取得（型エラー、警告等） |
| `executeCode` | Jupyterカーネルでコード実行 |

---

## スキル完全リファレンス（66スキル）

### マーケティング・セールス（15スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `copywriting-helper` | コピーライティング支援、訴求力のある文章作成 | `/copywriting-helper` |
| `sales-letter` | セールスレター作成（構成・心理トリガー・CTA） | `/sales-letter` |
| `step-mail` | ステップメール作成（6つの教育要素対応） | `/step-mail` |
| `vsl` | ビデオセールスレター台本（15章構成） | `/vsl` |
| `launch-video` | ローンチ動画スクリプト（3話/4話構成） | `/launch-video` |
| `lp-generator` | ランディングページ作成 | `/lp-generator` |
| `lp-design` | LP設計・ワイヤーフレーム | `/lp-design` |
| `lp-analysis` | LP分析・改善提案（成約率4.3倍達成） | `/lp-analysis` |
| `mendan-lp` | 面談LP作成（申込率50%目標、4つの型対応） | `/mendan-lp` |
| `funnel-builder` | セールスファネル構築 | `/funnel-builder` |
| `customer-support` | カスタマーサポート返信（6つの教育要素） | `/customer-support` |
| `customer-support-120` | 顧客期待120%超え対応 | `/customer-support-120` |
| `education-framework` | 6つの教育要素フレームワーク | `/education-framework` |
| `line-marketing` | LINEマーケティング戦略 | `/line-marketing` |
| `sales-systems` | セールスシステム構築 | `/sales-systems` |

### 太陽スタイル（10スキル）

日給5000万円を生み出した太陽スタイルのコピーライティング技術。

| スキル | 説明 | コマンド |
|-------|------|---------|
| `taiyo-style` | 太陽スタイル基本（176パターン適用） | `/taiyo-style` |
| `taiyo-rewriter` | 既存コンテンツを太陽スタイルに変換 | `/taiyo-rewriter` |
| `taiyo-style-headline` | 衝撃的なヘッドライン・キャッチコピー生成 | `/taiyo-style-headline` |
| `taiyo-style-bullet` | ブレット・ベネフィットリスト生成 | `/taiyo-style-bullet` |
| `taiyo-style-ps` | 追伸（P.S.）パターン生成 | `/taiyo-style-ps` |
| `taiyo-style-lp` | 太陽スタイルLP作成・最適化 | `/taiyo-style-lp` |
| `taiyo-style-sales-letter` | 太陽スタイルセールスレター | `/taiyo-style-sales-letter` |
| `taiyo-style-step-mail` | 太陽スタイルステップメール | `/taiyo-style-step-mail` |
| `taiyo-style-vsl` | 太陽スタイルVSL台本（15章構成） | `/taiyo-style-vsl` |

### コンテンツ制作（10スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `kindle-publishing` | Kindle本出版（企画〜出版） | `/kindle-publishing` |
| `note-marketing` | note記事戦略 | `/note-marketing` |
| `youtube-content` | YouTube動画企画 | `/youtube-content` |
| `youtube-thumbnail` | サムネイル作成（CTR最適化） | `/youtube-thumbnail` |
| `manga-production` | 漫画制作（マーケティング漫画） | `/manga-production` |
| `anime-production` | アニメ制作 | `/anime-production` |
| `video-production` | 動画制作 | `/video-production` |
| `diagram-illustration` | 図解・解説画像作成 | `/diagram-illustration` |
| `custom-character` | キャラクター設定 | `/custom-character` |
| `sns-marketing` | SNSマーケティング（マルチプラットフォーム） | `/sns-marketing` |

### AI画像・動画（5スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `gemini-image-generator` | Google Gemini画像生成（ブラウザ自動化） | `/gemini-image-generator` |
| `nanobanana-pro` | NanoBanana Pro画像生成（参照画像対応） | `/nanobanana-pro` |
| `nanobanana-prompts` | NanoBanana向けプロンプト最適化 | `/nanobanana-prompts` |
| `omnihuman1-video` | OmniHuman1 AIアバター動画作成 | `/omnihuman1-video` |
| `japanese-tts-reading` | 日本語TTS（Whisper対応） | `/japanese-tts-reading` |

### Video Agentシステム（12スキル）

動画制作・管理の自動化システム。

| スキル | 説明 | コマンド |
|-------|------|---------|
| `video-policy` | ポリシー管理 | `/video-policy` |
| `video-eval` | 動画評価システム | `/video-eval` |
| `video-ci-scheduling` | CI/CDスケジューリング | `/video-ci-scheduling` |
| `video-metrics` | メトリクス収集 | `/video-metrics` |
| `video-notify` | 通知システム | `/video-notify` |
| `video-anomaly` | 異常検知 | `/video-anomaly` |
| `video-dispatch` | タスクディスパッチ | `/video-dispatch` |
| `video-validate` | バリデーション | `/video-validate` |
| `video-guard` | ガード機能 | `/video-guard` |
| `video-agent-runbooks` | 運用ガイド・Runbook | `/video-agent-runbooks` |
| `video-download` | 動画ダウンロード（YouTube等） | `/video-download` |
| `video-transcribe` | 文字起こし（ローカルWhisper/OpenAI API） | `/video-transcribe` |

### インフラ・自動化（11スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `workflow-automation-n8n` | n8nワークフロー設計・実装 | `/workflow-automation-n8n` |
| `docker-mcp-ops` | Docker操作（コンテナ起動/停止/ログ） | `/docker-mcp-ops` |
| `security-scan-trivy` | Trivyセキュリティスキャン | `/security-scan-trivy` |
| `pdf-automation-gotenberg` | PDF変換・帳票出力自動化 | `/pdf-automation-gotenberg` |
| `doc-convert-pandoc` | ドキュメント変換（md→docx/pptx等） | `/doc-convert-pandoc` |
| `unified-notifications-apprise` | 通知チャネル統合（Slack/Discord/Email等） | `/unified-notifications-apprise` |
| `postgres-mcp-analyst` | PostgreSQL分析（read-only） | `/postgres-mcp-analyst` |
| `notion-knowledge-mcp` | Notionナレッジ検索・整理 | `/notion-knowledge-mcp` |
| `nlq-bi-wrenai` | 自然言語BI/可視化（WrenAI） | `/nlq-bi-wrenai` |
| `research-cited-report` | 出典付きリサーチレポート | `/research-cited-report` |
| `sns-patterns` | SNS投稿パターン | `/sns-patterns` |

### 開発フェーズ（2スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `phase1-tools` | Phase 1ツール群 | - |
| `phase2-monitoring` | Phase 2モニタリング | - |

---

## MCPツール使用例

### スキル検索・実行

```javascript
// 全スキル一覧
mcp__taisun-proxy__skill_search()

// キーワード検索
mcp__taisun-proxy__skill_search(query="taiyo")

// スキル実行
mcp__taisun-proxy__skill_run(name="youtube-thumbnail")
```

### メモリ操作

```javascript
// 長期メモリに保存
mcp__taisun-proxy__memory_add(
  content="重要な調査結果...",
  type="long-term",
  metadata={ project: "LP改善" }
)
// → refId: "mem_abc123" を返す

// 検索
mcp__taisun-proxy__memory_search(query="mem_abc123")
```

### 履歴検索（3層ワークフロー）

```javascript
// Step 1: インデックス検索
mcp__claude-mem-search__search(
  query="LP作成",
  limit=10,
  dateStart="2026-01-01"
)

// Step 2: コンテキスト取得
mcp__claude-mem-search__timeline(
  anchor=123,
  depth_before=2,
  depth_after=2
)

// Step 3: 詳細取得（必要なIDのみ）
mcp__claude-mem-search__get_observations(
  ids=[123, 124, 125]
)
```

### システムヘルスチェック

```javascript
mcp__taisun-proxy__system_health()
// → { status, uptime, mcps, circuits, metrics }
```

## Quick Start

> **日本語ユーザー向け**: 詳細なセットアップガイドは [docs/getting-started-ja.md](docs/getting-started-ja.md) をご覧ください。

### Prerequisites

- Node.js 18.x+
- npm 9.x+
- Claude Code CLI
- Docker (optional, for monitoring stack)

### Installation

```bash
# Clone repository
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys
```

### Verification

```bash
# Run tests (524 tests)
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build:all
```

## Usage

### Using Agents

```javascript
// Architecture design
Task(subagent_type="system-architect", prompt="ECサイトのアーキテクチャを設計して")

// Backend implementation
Task(subagent_type="backend-developer", prompt="ユーザー認証APIを実装して")

// Code review (0-100 scoring)
Task(subagent_type="code-reviewer", prompt="このPRをレビューして")

// Auto-select optimal agent
Task(subagent_type="ait42-coordinator", prompt="ユーザー認証機能を設計・実装して")
```

### Using Skills

```bash
# Sales letter
/sales-letter --product "オンライン講座"

# LP analysis
/lp-analysis https://example.com

# Security scan
/security-scan-trivy

# Daily observability report
npm run obs:report:daily
```

### Monitoring Stack

```bash
# Start monitoring (Prometheus, Grafana, Loki)
make monitoring-up

# Start ops tools (Gotenberg, PDF)
make tools-up

# Start scheduled jobs daemon
docker compose -f docker-compose.ops.yml --profile ops-scheduler up -d
```

## Project Structure

```
taisun_agent/
├── src/
│   └── proxy-mcp/              # Proxy MCP Server (11.2K LOC)
│       ├── server.ts           # MCP server entry
│       ├── tools/              # Public tools (system, skill, memory)
│       ├── memory/             # Memory service & storage
│       ├── router/             # Hybrid router engine
│       ├── internal/           # Circuit breaker, resilience
│       ├── browser/            # Chrome/CDP integration
│       ├── skillize/           # URL→Skill generation
│       ├── supervisor/         # GitHub workflow integration
│       ├── ops/                # Schedule, incidents, digest
│       └── observability/      # Event tracking & metrics
│
├── .claude/                    # Agent system
│   ├── agents/                 # 77 agent definitions
│   ├── skills/                 # 59 skill definitions
│   ├── commands/               # 76 command shortcuts
│   ├── mcp-servers/            # 4 custom MCP servers
│   ├── mcp-tools/              # 227 MCP tools
│   └── memory/                 # Learning & statistics
│
├── config/
│   └── proxy-mcp/              # MCP configuration
│       ├── internal-mcps.json  # MCP registry
│       ├── ops-schedule.json   # Scheduled jobs
│       └── incidents.json      # Incident tracking
│
├── docs/                       # Documentation (30+ files)
│   ├── ARCHITECTURE.md
│   ├── DEVELOPER_GUIDE.md
│   ├── API_REFERENCE.md
│   ├── OPERATIONS.md
│   └── third-agent/            # Advanced docs
│
├── tests/
│   ├── unit/                   # 22 unit test files
│   └── integration/            # 5 integration suites
│
├── docker-compose.monitoring.yml  # Prometheus/Grafana/Loki
├── docker-compose.tools.yml       # Document processing
└── docker-compose.ops.yml         # Operations environment
```

## Quality Gates

| Metric | Requirement | Current |
|--------|-------------|---------|
| Test Coverage | 80%+ | 80%+ |
| Code Review Score | 80+ | 80+ |
| Security Scan | Zero Critical/High | Zero |
| P0/P1 Bugs | Zero | Zero |

## NPM Scripts

```bash
# Development
npm run dev                    # Watch mode
npm test                       # Run all tests
npm run lint                   # ESLint
npm run typecheck              # TypeScript check

# Building
npm run proxy:build           # Build proxy MCP
npm run scripts:build         # Build scripts
npm run build:all             # Full build

# Operations
npm run obs:report:daily      # Daily observability report
npm run obs:report:weekly     # Weekly report
npm run ops:schedule:status   # Check scheduled jobs

# Utilities
npm run agents:list           # List available agents
npm run skills:list           # List available skills
npm run proxy:smoke           # MCP smoke test
```

## Documentation

### Getting Started

| Document | Description |
|----------|-------------|
| [QUICK_START.md](docs/QUICK_START.md) | 5分クイックスタート |
| [BEGINNERS_PROMPT_GUIDE.md](docs/BEGINNERS_PROMPT_GUIDE.md) | 初心者向けフレーズ集 ⭐ |
| [CONFIG.md](docs/CONFIG.md) | 設定ガイド |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | トラブルシューティング |
| [getting-started-ja.md](docs/getting-started-ja.md) | 日本語セットアップガイド |

### Development

| Document | Description |
|----------|-------------|
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | コントリビューションガイド |
| [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | 開発者ガイド |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | システムアーキテクチャ |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | API リファレンス |

### Operations

| Document | Description |
|----------|-------------|
| [OPERATIONS.md](docs/OPERATIONS.md) | 運用ガイド |
| [RUNBOOK.md](docs/RUNBOOK.md) | ランブック |
| [SECURITY.md](docs/SECURITY.md) | セキュリティポリシー |
| [CHANGELOG.md](docs/CHANGELOG.md) | 変更履歴 |

## Technology Stack

| Category | Technologies |
|----------|--------------|
| **Runtime** | Node.js 18+, TypeScript 5.3+ |
| **Testing** | Jest 29.7 |
| **MCP** | @modelcontextprotocol/sdk 1.0 |
| **AI** | Anthropic SDK, LangChain |
| **Browser** | Playwright Core 1.57 |
| **Monitoring** | Prometheus, Grafana, Loki |
| **Infrastructure** | Docker, n8n |

## Contributing

詳細は [CONTRIBUTING.md](docs/CONTRIBUTING.md) を参照してください。

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Support

- Issues: [GitHub Issues](https://github.com/san15/taisun_agent/issues)
- Documentation: [docs/](docs/)

---

Built with [Claude Code](https://claude.ai/code)
