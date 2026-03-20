# OpenClaw システム詳細分析

> 分析日: 2026-03-17
> 分析対象: /Users/matsumototoshihiko/Desktop/taisun開発２０２６/Kindle500openclaw/
> 分析者: リサーチアナリスト (Claude Sonnet 4.6)

---

## 現在のバージョン・実装状況

### バージョン情報

| 項目 | 値 |
|------|-----|
| package.json バージョン | 2.30.0（taisun-v2） |
| CHANGELOG 最新エントリ | 2.40.0（2026-03-14）|
| 最終リリースノート | v2.4.1（2026-01-18 Super Memory Phase3） |
| 設計書対象 OpenClaw バージョン | v2026.3.11（2026-03-12） |
| SESSION_HANDOFF 最終更新 | 2026-03-17T06:13:10.183Z |

注: package.json の `version: "2.30.0"` と CHANGELOG の `[2.40.0]` に乖離がある。CHANGELOG は機能追加のたびにインクリメントされており、package.json との同期が取られていないと判断される。

### 実装済み機能（CHANGELOG + src/ディレクトリから確認）

| カテゴリ | 実装済み内容 | バージョン |
|---------|------------|----------|
| 8層バリデーションパイプライン | Constitutional AI / Self-Contrast / CoVe / Faithfulness / DeepEval Gate / Reflexion / Prospective Reflection / LLM Judge | v2.39.0〜2.40.0 |
| kuromoji 日本語形態素解析 | self-contrast.ts に統合、async対応 | v2.40.0 |
| Stagehand/Skyvern MCP | AIブラウザ自動操作 | v2.38.0 |
| Firecrawl MCP | スクレイピング・クロール統合 | v2.37.0 |
| プランモード自動起動防止 | no-plan-mode.md ルール追加 | v2.26.0 |
| Super Memory Phase 3 | 出力50KB超を自動保存・97%コンテキスト削減 | v2.4.1 |
| ワークフロー Phase 3 | 条件分岐・並列実行・ロールバック | v2.4.0 |
| Workflow Phase 3 テスト | 50テスト全合格 | v2.4.0 |
| Kindle抽出モジュール | src/kindle/ (extractor.ts, ocr.ts, types.ts) | 実装済み |
| intelligence モジュール | aggregator / collectors (apify, economics, news, rss) / scheduler / report | 実装済み |
| intent-parser | classifiers / engines / storage / integrations | 実装済み |
| proxy-mcp | validation / workflow / browser / router / skillize / supervisor | 実装済み |
| unified-hooks | 4層構造 (cache/policy/security/metrics) | 実装済み |
| performance | BenchmarkRunner / CostTracker / ModelRouter | 実装済み |
| memory / rag | MemoryService / Indexer / Retriever | 実装済み |

### 未実装（設計書に記載あり・src/に存在しない）

| 機能 | 設計書参照 | 状態 |
|------|---------|------|
| BullMQ DLQシステム (`src/queue/dlq-manager.ts`) | SDD Part2 §4.1 | 設計のみ・未実装 |
| GutendexAPIClient (`src/systems/gutendex-client.ts`) | SDD Part2 §4.2 | 設計のみ・未実装 |
| EPUBGenerator (`src/systems/epub-generator.ts`) | SDD Part2 §4.2 | 設計のみ・未実装 |
| EmailSender (`src/systems/email-sender.ts`) | SDD Part2 §4.3 | 設計のみ・未実装 |
| SNS投稿 (X API v2 / Instagram) | SDD Part2 §4.4 | 未実装 |
| GenesisEngine (`src/agent-genesis/genesis-engine.ts`) | SDD Part1 §5 | 設計のみ・未実装 |
| LiteLLM ルーター設定 | IMPL_PROMPT Task1.2 | 設定ファイル未作成 |
| OpenClaw Gateway 起動設定 (pm2 ecosystem.config.js) | SDD Part1 §2 | 設定定義あり・実行環境未構築 |
| Alpha Vantage / CoinGecko 投資シグナル | SDD Part2 §4.5 | Phase4・未着手 |
| Prometheus / Grafana 監視 | SDD Part2 §7 | Phase4・未着手 |

---

## EPUB/Kindle生成機能の詳細

### 実装済み: Kindle抽出モジュール（src/kindle/）

`src/kindle/` 配下に Kindle コンテンツ抽出機能が実装済み。

- `KindleExtractor`: Playwright ブラウザ自動操作により、Amazon アカウント認証後 Kindle Cloud Reader からコンテンツを抽出
- `OcrProcessor`: 画像ページに対する OCR 処理
- 設定項目: amazonEmail / amazonPassword / headless / timeoutMs / outputDir
- 出力: ASIN / title / markdown / wordCount / outputPath / durationMs

エラーコード種別: INVALID_ASIN / NOT_PURCHASED / EXTRACTION_TIMEOUT / OCR_FAILED / BROWSER_ERROR / UNKNOWN_ERROR

### 設計済み・未実装: EPUB生成システム（src/systems/ 以下）

SDD Part2 §4.2 に完全な TypeScript 型定義とクラス設計が存在するが、`src/systems/` ディレクトリ自体がまだ存在しない。

**GutendexAPIClient**（設計済み）:
- `https://gutendex.com/books/` からページネーション付きで書籍リストを取得
- MIME type フィルタ: `application/epub+zip`
- レートリミット: 1秒間隔（60req/min の自主規制）
- 503エラー時: 60秒待機して再試行

**EPUBGenerator**（設計済み）:
- 2つの生成パス:
  1. Gutendex 直接EPUB URL からバイナリを取得して Buffer として返す
  2. HTML から `epub-gen-memory` ライブラリで EPUB を生成（フォールバック）
- ファイルシステムへの保存なし（メモリ上の Buffer のみ）

**500冊/日バッチ処理シーケンス**（設計済み）:
1. 毎日02:00 JST に BullMQ スケジューラー起動
2. GutendexAPIClient.fetchEpubBooks(500) 実行（所要約9分）
3. epub-generation キューに500ジョブをエンキュー（concurrency=10）
4. 生成済み Buffer を Redis に TTL 24時間で一時保存（キー: `epub:buffer:{bookId}:{date}`）
5. email-dispatch キューへ転送（100通×5バッチ、2時間間隔）

### package.json の依存関係ギャップ

現在の `package.json` に `epub-gen-memory`、`axios`、`bullmq`、`ioredis`、`@aws-sdk/client-sesv2`、`limiter` が含まれていない。EPUB/Email 機能を実装するには dependencies の追加が必要。

---

## Claude Code接続方法（APIエンドポイント）

### OpenClaw Gateway エンドポイント一覧

全 Gateway は `bindHost: "127.0.0.1"` で起動するため、ローカルホスト経由のみアクセス可能。

| GW# | プロセス名 | ポート | 役割 |
|-----|----------|--------|------|
| GW-7 | openclaw-meta | 18780 | Meta-Orchestrator（Colony Director） |
| GW-1 | openclaw-team-a | 18789 | 開発チーム（50 agents） |
| GW-2 | openclaw-team-b | 18799 | 営業チーム（50 agents） |
| GW-3 | openclaw-team-c | 18809 | 運用チーム（50 agents） |
| GW-4 | openclaw-team-d | 18819 | 調査チーム（50 agents） |
| GW-5 | openclaw-team-e | 18829 | CSチーム（50 agents） |
| GW-6 | openclaw-executive | 18839 | Executive（ZEUS/ARES/HERA/ATHENA/GENESIS） |

### Claude Code からの接続方法

```bash
# ZEUS（Executive Gateway）へのメッセージ送信例
curl -X POST http://localhost:18839/message \
  -H "Content-Type: application/json" \
  -d '{"text": "ZEUSへ: 現在のシステム状態を報告してください"}'

# sessions_send（同期・最大5往復）
# sessions_spawn（非同期）
```

Claude Code 自体は `openclaw sessions_send` または `sessions_spawn` コマンドを通じてエージェントと通信する。Claude Code がエージェントに接続する場合、対象 Gateway のポートに HTTP POST を送る形式が基本。

### その他関連サービスのポート

| サービス | ポート | 用途 |
|---------|--------|------|
| LM Studio | 1234 | ローカル LLM（Qwen3 72B Q4） |
| LiteLLM Router | 4000 | LLM ルーティング（docker-compose.llm.yml） |
| Paperclip | 3000 | 組織図・コスト管理 |
| Redis（BullMQ）| 6379 | ジョブキュー（pm2 管理） |
| Redis（LiteLLM）| 6380 | LiteLLM 専用（docker-compose.llm.yml） |
| PostgreSQL（LiteLLM）| 5433 | LiteLLM DB（docker-compose.llm.yml） |
| BullMQ Dashboard | 3001 | キュー監視 GUI |
| Prometheus | 9090 | メトリクス収集 |

---

## ローカルLLM統合の仕様

### ADR-003: LM Studio 選定（Ollama は非採用）

設計書 ADR-003 において Ollama は **明示的に却下** されている。

> 「Ollamaはキュー型で1件ずつ処理のため250エージェント環境では致命的なボトルネックとなる」

採用理由: LM Studio は Mac Metal GPU をフル活用した **8並列同時推論** に対応。

### ローカル LLM 構成

| 項目 | 設定値 |
|------|--------|
| LLM エンジン | LM Studio v0.4.0+ |
| ポート | 1234 |
| モデル | qwen3-72b-instruct-q4（約40GB） |
| 並列推論数 | --parallel 8 |
| GPU | Mac Metal（--n-gpu-layers -1） |
| API 形式 | OpenAI 互換（/v1/models, /v1/chat/completions） |

### LiteLLM ルーター統合

LiteLLM（port 4000）が Claude API とローカル LLM の両方を単一エンドポイントで統合。

```yaml
# litellm_config.yaml（設計）
model_list:
  - model_name: claude-opus      → claude-opus-4-6
  - model_name: claude-sonnet    → claude-sonnet-4-6
  - model_name: claude-haiku     → claude-haiku-4-5-20251001
  - model_name: qwen3-local      → openai/qwen3-72b-instruct-q4 (base: localhost:1234)

router_settings:
  fallbacks:
    - qwen3-local: [claude-sonnet]   # ローカルLLM障害時はSonnetにフォールバック
```

**docker-compose.llm.yml の実態**:
- `ghcr.io/berriai/litellm:main-latest` コンテナとして起動
- `host.docker.internal:host-gateway` 設定により Mac ホストの LM Studio（port 1234）へ到達可能
- 専用 PostgreSQL（port 5433）・専用 Redis（port 6380）を持つ
- `./config/litellm-config.yaml` をマウント（実ファイルは未確認）

### モデル使用方針

| 層 | エージェント | 使用モデル | 理由 |
|----|-----------|----------|------|
| Layer-0 Director | ZEUS・Colony Director | Claude Opus 4.6 | 最高品質の戦略判断 |
| Layer-1 Team Lead | チームリーダー | Claude Sonnet 4.6 | 品質・コストバランス |
| Layer-2 Worker | 実行エージェント | Qwen3 72B（ローカル）| コスト最小化 |
| CS・営業 Worker | Team-B・Team-E Worker | Claude Haiku 4.5 | 軽量・高速 |

92GB RAM の制約から **同時並列推論は15〜20エージェントが上限**（CON-004）。BullMQ の逐次処理設計が必須。

---

## 500冊/日達成に向けた既存実装の評価

### 評価サマリー

| 要素 | 設計成熟度 | 実装完了度 | 評価 |
|------|---------|---------|------|
| BullMQ DLQ アーキテクチャ | 完全設計済み | 0%（未実装） | 要実装 |
| GutendexAPIClient | 完全設計済み | 0%（未実装） | 要実装 |
| EPUBGenerator | 完全設計済み | 0%（未実装） | 要実装 |
| EmailSender（SES v2）| 完全設計済み | 0%（未実装） | 要実装 |
| Kindle抽出モジュール | 実装済み | 100% | 流用可 |
| ワークフローエンジン | 実装済み（Phase3） | 実装済み | 基盤として使用可 |
| バリデーションパイプライン | 実装済み | 100% | 品質保証に活用可 |

### 500冊/日の実現可能性

設計書は以下の詳細な時間分散設計を定義している。

```
00:00────────────────────────────────24:00
  BATCH-1  BATCH-2  BATCH-3  BATCH-4  BATCH-5
 (100通)  (100通)  (100通)  (100通)  (100通)
 02:00   07:00   12:00   17:00   20:00
```

スループット計算:
- epub-generation: concurrency=10、30req/min → 500冊 / 10並列 = 50分で処理可能
- Gutendex 取得: 60req/min 自主規制 → 約9分（ページあたり32件として16ページ取得）
- email-dispatch: concurrency=5、SES上限14通/秒 → 500通 / 14 ≒ 36秒で物理的送信可能（バッチ分散設計により24時間分散）

**技術的には500冊/日は達成可能**。ただし以下の前提が全て満たされる必要がある:
1. Amazon SES v2 の送信承認（送信クォータ 500+通/日）
2. Project Gutenberg から500冊分の EPUB URL が取得可能であること（実際には2万冊以上が英語 EPUB 形式で提供されており問題なし）
3. Redis に十分なメモリ（500冊 × 平均EPUB サイズ ~500KB = 約250MB、24時間 TTL）
4. 各実装クラスの実際のコーディング完了

---

## ギャップ分析（実現に必要な追加実装）

### Phase 3 必須実装（PENCLAW_IMPL_PROMPT.md 参照）

以下は Week 7-12 に相当する未実装コンポーネント。

#### Gap-1: `src/systems/` ディレクトリ全体が未作成

必要なファイル:
- `src/systems/gutendex-client.ts` — GutendexAPIClient クラス（SDD Part2 §4.2.1）
- `src/systems/epub-generator.ts` — EPUBGenerator クラス（SDD Part2 §4.2.2）
- `src/systems/email-sender.ts` — EmailSender クラス（SDD Part2 §4.3.1）

#### Gap-2: `src/queue/` ディレクトリが未作成

必要なファイル:
- `src/queue/dlq-manager.ts` — DeadLetterQueueManager クラス（SDD Part2 §4.1.2）
- `src/queue/queue-setup.ts` — 全キュー初期化（FR-400）
- `src/queue/workers.ts` — チームワーカー（FR-402）

#### Gap-3: 依存パッケージの未インストール

現在の `package.json` に以下が含まれていない:
```json
{
  "bullmq": "^5.x",
  "ioredis": "^5.x",
  "epub-gen-memory": "^1.1.2",
  "axios": "^1.x",
  "@aws-sdk/client-sesv2": "^3.x",
  "limiter": "^2.x",
  "twitter-api-v2": "^1.x"
}
```

#### Gap-4: OpenClaw Gateway の実際の起動未確認

SESSION_HANDOFF.md には pm2 プロセスの起動状態は記録されていない。`ecosystem.config.js` の実ファイルが存在するか不明。実装指示書（PENCLAW_IMPL_PROMPT.md）Phase 1 の Task 1.6 がどこまで完了しているか確認が必要。

#### Gap-5: `config/litellm-config.yaml` の実ファイル

`docker-compose.llm.yml` が `./config/litellm-config.yaml` をマウントするが、このファイルの存在は未確認。LiteLLM が正常動作するには実ファイルが必要。

#### Gap-6: 投資シグナル機能（Phase 4・低優先度）

Alpha Vantage / CoinGecko 統合は Phase 4 対象。500冊/日達成には不要。

### 実装優先度マトリクス

| 優先度 | タスク | 推定工数 |
|--------|--------|---------|
| 最高 | `src/queue/dlq-manager.ts` 実装 | 1-2日 |
| 最高 | `src/systems/gutendex-client.ts` 実装 | 0.5日 |
| 最高 | `src/systems/epub-generator.ts` 実装 | 1日 |
| 最高 | `src/systems/email-sender.ts` 実装 | 1日 |
| 最高 | `package.json` 依存パッケージ追加 | 0.5日 |
| 高 | BullMQ キュースケジューラー設定 | 1日 |
| 高 | SES 送信承認・設定 | 外部作業 |
| 中 | OpenClaw Gateway 起動確認（pm2） | 0.5日 |
| 低 | SNS 投稿（X API v2） | 1-2日 |

---

## src/ディレクトリ構成

```
src/
├── app.ts                          # エントリポイント
├── app.test.ts                     # アプリテスト
├── app/                            # アプリケーション層
├── components/                     # 共通コンポーネント
├── i18n/                           # 国際化
│   ├── index.ts
│   └── index.d.ts
├── intelligence/                   # 情報収集・インテリジェンス
│   ├── aggregator.ts               # 情報集約
│   ├── collectors/
│   │   ├── apify-collector.ts
│   │   ├── economics-collector.ts
│   │   ├── news-collector.ts
│   │   └── rss-collector.ts
│   ├── index.ts
│   ├── report.ts
│   ├── scheduler.ts
│   └── types/index.ts
├── intent-parser/                  # 意図解析エンジン
│   ├── classifiers/
│   │   ├── decision-tree.ts
│   │   ├── feature-extractor.ts
│   │   ├── intent-classifier.ts
│   │   ├── ml-risk-classifier.ts
│   │   ├── naive-bayes.ts
│   │   └── patterns.ts
│   ├── core/
│   │   ├── entity-extractor.ts
│   │   ├── index.ts
│   │   ├── pattern-classifier.ts
│   │   └── tokenizer.ts
│   ├── engines/
│   │   ├── confidence-scorer.ts
│   │   ├── context-resolver.ts
│   │   └── risk-evaluator.ts
│   ├── integrations/
│   │   └── hook-integration.ts
│   ├── storage/
│   │   ├── execution-history.ts
│   │   └── feedback-loop.ts
│   ├── index.ts
│   └── types.ts
├── kindle/                         # Kindle コンテンツ抽出（実装済み）
│   ├── extractor.ts                # KindleExtractor（Playwright使用）
│   ├── index.ts
│   ├── ocr.ts                      # OcrProcessor
│   └── types.ts                    # KindleExtractorConfig / ExtractionResult 等
├── lib/
│   ├── prisma.ts
│   └── utils.ts
├── memory/                         # メモリ管理
│   ├── MemoryService.ts
│   ├── index.ts
│   └── types.ts
├── performance/                    # パフォーマンス計測
│   ├── BenchmarkRunner.ts
│   ├── CodexCliHelper.ts
│   ├── CostTracker.ts
│   ├── ModelRouter.ts
│   ├── PerformanceService.ts
│   ├── index.ts
│   └── types.ts
├── proxy-mcp/                      # MCP プロキシ（最大モジュール）
│   ├── browser/                    # ブラウザ自動操作
│   │   ├── cdp/                    # Chrome DevTools Protocol
│   │   └── ...
│   ├── ops/
│   │   └── schedule/               # スケジューラー
│   ├── router/                     # ルーティング
│   ├── server.ts                   # MCP サーバーエントリ
│   ├── skillize/                   # スキル化
│   ├── supervisor/                 # スーパービジョン
│   ├── tools/                      # ツール定義
│   ├── types.ts
│   ├── validation/                 # 8層バリデーション（最新実装）
│   │   ├── constitutional.ts
│   │   ├── cove.ts
│   │   ├── deepeval-gate.ts
│   │   ├── faithfulness.ts
│   │   ├── llm-judge.ts            # v2.40.0 追加
│   │   ├── output-validator.ts
│   │   ├── pipeline.ts
│   │   ├── prospective-reflection.ts
│   │   ├── reflexion.ts
│   │   ├── self-contrast.ts        # kuromoji 統合済み
│   │   └── verification-layer.ts
│   └── workflow/                   # ワークフローエンジン
│       ├── engine.ts
│       ├── registry.ts
│       ├── store.ts
│       └── types.ts
├── rag/                            # RAG（検索拡張生成）
│   ├── grounding.ts
│   ├── indexer.ts
│   └── retriever.ts
├── unified-hooks/                  # 統合フック（4層）
│   ├── layer-1/                    # キャッシュ・ルーティング
│   ├── layer-2/                    # ポリシー・状態バリデーション
│   ├── layer-3/                    # セキュリティ・インジェクション検出
│   ├── layer-4/                    # メトリクス・状態永続化
│   ├── orchestrator.ts
│   └── types.ts
└── utils/
    ├── env-check.ts
    └── safe-json.ts

【未作成・要追加】
src/systems/                        # EPUB/Email システム（未実装）
src/queue/                          # BullMQ キュー管理（未実装）
src/agent-genesis/                  # GenesisEngine（未実装）
```

---

## 付記: セキュリティ注意事項

設計書で明示されている重要セキュリティ事項:

1. **CVE-2026-25253（CVSS 8.8 Critical）**: WebSocket 経由のトークン窃取・RCE。v2026.3.7+ へのアップデートが必須。
2. **GhostClaw マルウェア**: `@openclaw-ai/openclawai` は偽 npm パッケージ（macOSキーチェーン・SSH・暗号資産ウォレット窃取）。`@openclaw/openclaw` のみが正規パッケージ。
3. **bindHost 必須**: `bindHost: "127.0.0.1"` を全 Gateway に設定しないと、Shodan で 135,000 件以上の公開パネルが確認されているポート 18789 が外部公開される。
4. **投資シグナルは表示専用**: 自動売買コードの実装は金融商品取引法違反となるため、Alpha Vantage / CoinGecko の統合は読み取り・表示のみに限定。

---

## 結論

**現状評価**: OpenClaw 250エージェントシステムの設計は非常に詳細かつ成熟しており、SDD Part1/Part2・要件定義書・実装指示書が一貫して整備されている。しかし**500冊/日 EPUB 生成・配信に直結するコア機能（BullMQ DLQ・GutendexAPIClient・EPUBGenerator・EmailSender）は全て未実装**であり、設計文書内の TypeScript コードの状態に留まっている。

**重要ポイント**:
1. 設計の完成度は高く、実装すべきコードも SDD に全て記載されているため、実装工数は比較的少ない（推定5〜7営業日）。
2. Kindle 抽出モジュール（src/kindle/）は実装済みであり、EPUB の読み取り・変換に流用可能。
3. ワークフローエンジン・バリデーションパイプライン・intelligence モジュール等の基盤は実装済みで品質も高い。
4. `package.json` に必要な依存パッケージ（bullmq, epub-gen-memory, @aws-sdk/client-sesv2 等）が未追加であることが最初のブロッカー。
5. Ollama は明示的に却下されており、LM Studio（並列8推論対応）が公式採用モデル。

**未解決・追加調査が必要な事項**:
- OpenClaw Gateway が現在実際に起動しているか（pm2 status 確認）
- `config/litellm-config.yaml` の実ファイルの存在確認
- Amazon SES 送信クォータの現在値（500通/日を超えているか）
- Project Gutenberg の EPUB URL の取得成功率の実測値
- Qwen3 72B Q4 が LM Studio にロード済みかの確認

---

*生成: 2026-03-17 | 参照ドキュメント: SDD Part1/Part2・要件定義書・IMPL_PROMPT・SESSION_HANDOFF・CHANGELOG・package.json・src/ディレクトリ構成*
