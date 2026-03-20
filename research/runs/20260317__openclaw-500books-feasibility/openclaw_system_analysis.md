# OpenClaw現状分析 + 接続設計

**作成日**: 2026-03-17
**分析対象**: OpenClaw 250エージェント組織システム × Kindle 500冊/日パイプライン
**情報ソース**: 要件定義書(v1.0.0 / 2026-03-12)・RELEASE_v2.4.0/v2.4.1・SESSION_HANDOFF.md・Web調査3件

---

## 現在のOpenClawシステム状態

### バージョン・前提環境

| 項目 | 値 |
|------|-----|
| OpenClaw バージョン | v2026.3.11以降（CVE-2026-25253/25593パッチ適用必須） |
| ハードウェア | Mac Studio 92GB RAM（要件書では「92GB」と「96GB」の表記ゆれあり。本文中は92GB） |
| LM Studio | v0.4.0以降 + Qwen3 72B Q4（約40GB VRAM/RAM使用） |
| ローカルLLMエンドポイント | LM Studio: http://localhost:1234（OpenAI互換） |
| LLMルーター | LiteLLM: http://localhost:4000 |
| キュー基盤 | BullMQ v5 + Redis 7（127.0.0.1:6379） |
| プロセス管理 | pm2 v5 |
| 組織管理 | Paperclip（localhost:3000） |
| 監視 | Prometheus + Grafana OSS |
| BullMQ Dashboard | localhost:3001 |

### エージェント階層（設計済み・未実装）

```
ZEUS（統括）
├── ARES（補佐A・進捗集約）
├── HERA（秘書B・議事録）
├── ATHENA（秘書C・Claude Haiku 4.5でコスト削減担当）
├── GENESIS（自律チーム生成）
└── 5チームリーダー（各50名ワーカー、計250名）
    ├── Team-A: 開発チーム（port 18789、Coordinator: Claude Opus 4.6、Worker: Qwen3 72B）
    ├── Team-B: 営業・マーケ（port 18799、Worker: Claude Haiku 4.5）
    ├── Team-C: 運用（port 18809、Worker: Qwen3 72B）
    ├── Team-D: 調査・データサイエンス（port 18819、epub-creator スキル担当）
    └── Team-E: カスタマーサービス（port 18829、Worker: Claude Haiku 4.5）
```

**同時並列稼働上限**: 15〜20エージェント（92GB RAM制約）
**Gateway**: 6本固定（port 18789〜18839）+ 動的最大20本（port 18850〜18950）

### 実装フェーズ状況（要件書ベース、推定）

| フェーズ | 内容 | 状況 |
|---------|------|------|
| Phase 1（Week 1-2） | セキュア基盤・Executive Gateway起動 | 設計済み・未確認 |
| Phase 2（Week 3-6） | 全5チーム展開・週次ミーティング自動化 | 設計済み・未確認 |
| Phase 3（Week 7-12） | EPUB生成・SES配信・SNS投稿・DLQ本番 | **EPUB部分が主要ターゲット** |
| Phase 4（Week 13+） | Agent Genesis・フルスケール・$650/月最適化 | 未着手 |

**TAISUN v2のリリース状況**: v2.4.0（2026-01-15、ワークフロー Phase3）・v2.4.1（2026-01-18、Super Memory）はワークフローエンジンの機能強化。OpenClaw本体の250エージェント組織は別プロジェクトとして要件定義済みだが、本番デプロイ確認なし。

---

## EPUB/Kindle生成の実装状況

### 要件スコープ（FR-500〜FR-508）

| 要件ID | 内容 | 実装状況 |
|--------|------|---------|
| FR-500 | Gutendex API（gutendex.com/books/）から書籍リスト取得 | 未実装（仕様策定済み） |
| FR-501 | 500冊/日をBullMQ `team-research-tasks` キュー経由でバッチ処理 | 未実装 |
| FR-502 | HTML URL取得 → `epub-gen-memory` ライブラリでEPUBバッファ生成 | 未実装 |
| FR-503 | タイムアウト30秒・attempts:3・指数バックオフ | 未実装 |
| FR-504 | EPUBメタデータ（タイトル・著者・言語コード）設定 | 未実装 |
| FR-505 | gutendex.com・gutenberg.orgのみHTTP許可リスト | 未実装 |
| FR-506 | EPUBをBase64エンコードしてBullMQジョブデータに格納 | 未実装 |
| FR-507 | バッチジョブIDリストで進捗追跡 | 未実装 |
| FR-508 | Team-D `epub-creator` スキル（Tier2）からの呼び出しIF | 未実装 |

### KDP連携スコープ

**要件定義書にKDP（Kindle Direct Publishing）への直接アップロードは明示的にスコープ外。** EPUB生成後の配信は Amazon SES v2 によるメール添付（会員番号別・最大40MB）として定義されている。KDPへの自動アップロードは要件外であり、追加設計が必要。

### 数値目標

| 指標 | 要件値 |
|------|-------|
| 生成スループット | 500冊/24時間（1冊あたり平均173秒以内） |
| 生成成功率 | 97%以上（BullMQ DashboardでAC-003確認） |
| メール配信成功率 | 99.5%以上 |
| 添付ファイルサイズ上限 | 40MB |

---

## Claude Code との接続ポイント

### 内部インターフェース一覧

| インターフェース | プロトコル | エンドポイント | 用途 |
|---------------|---------|-------------|------|
| LiteLLM Router | HTTP | localhost:4000 | LLM呼び出し一元ルーティング（least-busy戦略） |
| LM Studio（ローカルLLM） | HTTP / OpenAI互換 | localhost:1234 | Qwen3 72B Q4 推論（--n-gpu-layers -1 --parallel 8） |
| OpenClaw Gateway（Executive） | WebSocket | localhost:18839 | ZEUS/ARES/HERA/ATHENA/GENESIS |
| OpenClaw Gateway（Team-A〜E） | WebSocket | localhost:18789〜18829 | チームワーカー |
| Redis / BullMQ | Redis Protocol | localhost:6379 | ジョブキュー・DLQ |
| Paperclip | HTTP | localhost:3000 | 組織図・コスト管理 |
| BullMQ Dashboard | HTTP | localhost:3001 | ジョブ監視・手動リトライ |

### Claude Code → OpenClaw 接続方式

Claude Code（TAISUN v2 スキル）から OpenClaw にタスクを渡す接続パターンは2つ：

**パターン1: LiteLLM経由（推奨）**
```
Claude Code
  └── LiteLLM (localhost:4000)
        ├── Anthropic API (Claude Sonnet/Haiku) ← 重要タスク
        └── LM Studio (localhost:1234) ← Qwen3 72B ← 定型タスク80%以上
```

**パターン2: BullMQ直接エンキュー**
```
Claude Code（epub-creator スキル / Team-D Tier2）
  └── BullMQ team-research-tasks キュー
        └── Team-D Worker（epub-gen-memory でEPUB生成）
              └── BullMQ team-ops-tasks キュー
                    └── Team-C Worker（Amazon SES v2 でメール配信）
```

### sessions_send / sessions_spawn プロトコル

| プロトコル | 同期/非同期 | 上限 | 用途 |
|---------|---------|-----|-----|
| sessions_send | 同期 | maxPingPongTurns: 5 | ZEUS ↔ 補佐（ARES/HERA/ATHENA） |
| sessions_spawn | 非同期 | maxSpawnDepth: 2 / runTimeoutSeconds: 900 | チームリーダー → Worker |

### LiteLLM接続設定（要件書 FR-915〜FR-917）

```yaml
# litellm_config.yaml の骨子
model_list:
  - model_name: claude-sonnet-4-6
    litellm_params:
      model: anthropic/claude-sonnet-4-6
  - model_name: qwen3-72b-local
    litellm_params:
      model: openai/qwen3:72b
      api_base: http://localhost:1234/v1
router_settings:
  routing_strategy: least-busy
  num_retries: 3
  timeout: 60
```

---

## 主要ボトルネック

### 技術的ボトルネック

| # | ボトルネック | 深刻度 | 緩和策（要件書より） |
|---|------------|-------|-------------------|
| 1 | **92GB RAM上限による同時並列15〜20エージェント制限**（CON-004）| Critical | BullMQ逐次処理・maxConcurrent:8 |
| 2 | **pm2 stdin ブロック問題**（RISK-T02 / Issue #24178）| Critical | `stdin: '/dev/null'` + `--allow-unconfigured` 必須 |
| 3 | **Qwen3 72B 推論遅延**（p50: 3秒以内目標）| High | LM Studio parallel:8 + BullMQ 50 req/s 律速 |
| 4 | **SOUL.md未注入問題**（RISK-T08 / CON-002）| Medium | AGENTS.mdに全ワーカー指示を集約 |
| 5 | **エージェント間無限ループリスク**（RISK-T05）| High | maxPingPongTurns:5 / runTimeoutSeconds:900 / loop.maxIterations:3 |
| 6 | **KDPアップロードがスコープ外**（要件書のアウトオブスコープに記載なし・暗黙的未定義）| High | 追加設計必要（後述の推奨案参照） |
| 7 | **OpenClaw v2026.3.11インストール未確認**（PRE-002）| Critical | `openclaw doctor` で CVE パッチ適用確認が Phase 1 最初のタスク |

### コスト・運用ボトルネック

| # | リスク | 緩和策 |
|---|--------|-------|
| C1 | API費用爆発（未設定時: 月$3,600実例）| spendLimit: daily $50 / monthly $800 |
| C2 | Phase 3完成まで月$800〜$1,250 かかる可能性 | Anthropic Batch API（50%割引）+ ローカル80% |
| C3 | Amazon SES 62,000通/月無料枠超過 | 月$1/1,000通（影響軽微）|

### セキュリティボトルネック（Critical 4件）

- RISK-S01: CVE-2026-25253（CVSS 8.8）未対応時のRCE
- RISK-S02: GhostClaw偽パッケージ（`@openclaw-ai/openclawai`）
- RISK-S03: ClawHavocキャンペーンによる悪意スキル混入
- RISK-S04: port 18789〜18939の外部公開（Shodan調査で135,000件の無防備パネル確認済み）

---

## Web調査結果

### 調査1: Claude Code × ローカルLLM × Ollama プロキシ統合（2025-2026）

**調査クエリ**: "Claude Code local LLM Ollama proxy integration 2025 2026"

**主要知見**:

1. **2026年1月の重大変化**: OllamaがAnthropicメッセージAPIのネイティブサポートを追加。Claude Codeが直接Ollamaモデルに接続可能になった（プロキシ不要化）。公式ドキュメント: https://ollama.com/blog/claude

2. **プロキシソリューション（旧バージョン向け）**:
   - `mattlqx/claude-code-ollama-proxy`: Claude ModelをOpenAI/Gemini/Ollamaにマッピング、LiteLLM経由
   - `fuergaosi233/claude-code-proxy`: Claude API → OpenAI API変換
   - CCProxy（ccproxy.orchestre.dev）: Claude Code ↔ Ollama ブリッジ

3. **2026年最適モデル**: Qwen 3.5 35B-A3B（agentic能力・256Kコンテキスト・ツールコール対応）

4. **OpenClaw環境への適用**: 要件書の LiteLLM（localhost:4000）が実質的にこのプロキシ役を担う。LM Studio（localhost:1234）はOpenAI互換エンドポイントを提供するためLiteLLM統合は設計通り機能可能。

**関連リンク**:
- https://docs.ollama.com/integrations/claude-code
- https://github.com/mattlqx/claude-code-ollama-proxy
- https://ollama.com/blog/claude

---

### 調査2: OpenClaw × NVIDIA AI推論プラットフォーム（2026）

**調査クエリ**: "OpenClaw NVIDIA AI inference platform 2026"

**主要知見**:

1. **OpenClawとは**: もともと「Clawdbot」→「Moltbot」として2025年末に登場したローカルファースト自律AIエージェント。2026年1月にOpenClawと改名後、GitHub 250,000スターを突破（Reactを抜いてノンアグリゲーターOSSで最多スター）。

2. **NemoClaw（NVIDIA版OpenClaw）**: NVIDIAがGTC 2026（2026年3月中旬）でオープンソースの企業向けAIエージェントプラットフォーム「NemoClaw」を発表。実質的に「OpenClaw + エンタープライズセキュリティ・プライバシー機能」。NVIDIAのNeMoフレームワーク・Nemotronモデル・NIM推論マイクロサービスと深く統合。

3. **ハードウェア対応**: NemoClawはハードウェア非依存（NVIDIA/AMD/Intel対応）。RTX GPU・DGX Spark上でOpenClawを無料で実行するガイドをNVIDIAが公開済み。

4. **セキュリティ問題の解決**: TechCrunch（2026-03-16）報道: NVIDIAのNemoClawはOpenClawの最大の問題（セキュリティ）を解決しようとしている。これはRISK-S01〜S04と合致する。

5. **Mac Studio環境への示唆**: NemoClaw登場によりNVIDIA GPU版と並行した企業グレードのセキュリティ強化が期待できる。ただし要件書対象はMac Studioローカル環境（Apple Metal GPU）のため直接適用には限界あり。

**関連リンク**:
- https://www.nvidia.com/en-us/geforce/news/open-claw-rtx-gpu-dgx-spark-guide/
- https://www.cnbc.com/2026/03/10/nvidia-open-source-ai-agent-platform-nemoclaw-wired-agentic-tools-openclaw-clawdbot-moltbot.html
- https://techcrunch.com/2026/03/16/nvidias-version-of-openclaw-could-solve-its-biggest-problem-security/
- https://docs.openclaw.ai/providers/nvidia
- https://nemoclaw.bot/

---

### 調査3: KDP バルクアップロード自動化 × Selenium/Playwright（2025）

**調査クエリ**: "KDP bulk upload automation Selenium Playwright 2025"

**主要知見**:

1. **専用KDP自動化ツール**:
   - **Flying Upload（flyingupload.com）**: KDP特化アップロード自動化アプリ。バックグラウンド実行対応。
   - **KDP Uploader（Chrome拡張）**: Excelシートでフィールド管理・ファイル自動アップロード・言語/著者/キーワード/価格/サイズ設定対応。
   - **Kindle Prime（kindle-prime.com）**: Excelレイアウトチェッカー・フィールドカスタマイズ・エラーチェック機能付き。

2. **Playwright vs Selenium 2025トレンド**:
   - TestGuild調査でPlaywrightの使用率がSeleniumを大幅超過（2025年時点でNo.1ツール）。
   - Playwright優位点: 高速実行・モダンAPI・動的Webアプリ対応・ファイルアップロード/ダウンロード・ネットワーク傍受・API呼び出しをオールインワンで提供。
   - KDP（Amazon）はJavaScriptヘビーなSPA構成のため、Playwright推奨。

3. **500冊/日 KDPアップロードへの示唆**:
   - 専用ツール（Flying Upload等）はヘッドレス動作可能で、バルクアップロードに最適化済み。
   - PlaywrightベースのカスタムスクリプトはBullMQジョブとして組み込み可能（`type: bash` ステップ経由）。
   - Amazon KDPのアップロード制限・レートリミットに注意が必要（専用ツールは内部で対応済み）。

**関連リンク**:
- https://flyingupload.com/amazon-kdp-upload-automation/
- https://www.kdpuploader.com/
- https://www.kindle-prime.com/
- https://ccproxy.orchestre.dev/providers/ollama

---

## 推奨接続設計案

### Claude Code → OpenClaw → KDP パイプライン概要

現在の要件書はEPUB生成後のデリバリーを「Amazon SES経由のメール配信」として定義しているが、KDP（Kindle Direct Publishing）への自動出版を追加する場合の推奨パイプライン：

```
[Claude Code / TAISUN v2スキル]
        │
        ▼
[BullMQ: team-research-tasks]
        │
        ▼
[Team-D Worker: epub-creator Tier2スキル]
  → Gutendex API でHTMLコンテンツ取得
  → epub-gen-memory でEPUBバッファ生成
  → Base64エンコード → BullMQジョブデータへ格納
        │
        ├─────────────────────┐
        ▼                     ▼
[BullMQ: team-ops-tasks]  [BullMQ: kdp-upload-tasks (新規)]
        │                     │
        ▼                     ▼
[Team-C Worker]          [Team-A Worker (開発チーム)]
Amazon SES v2 で           Playwright / Flying Upload API で
会員宛メール配信            KDP自動アップロード
（既存スコープ）            （追加スコープ）
```

### KDPアップロード追加設計の要点

| 項目 | 推奨 | 理由 |
|------|------|------|
| 自動化ツール | Flying Upload API または Playwright | KDP特化・バックグラウンド動作・Excelデータ管理対応 |
| スキル配置 | Team-A Tier2 `kdp-uploader` スキル | 開発チームが技術実装を担当（Team-A: claude-code-skill済み） |
| キュー設計 | `kdp-upload-tasks` キューを追加 | team-research-tasksと分離して独立リトライ管理 |
| レートリミット | KDP制限に合わせた `delay: 500ms` 間隔 | Amazon利用規約遵守 |
| Lobsterワークフロー | `epub-to-kdp.yaml` を新規作成 | EPUB生成 → KDPアップロード → SESメール通知の3ステップ |
| エラーハンドリング | DLQ移行 + Discord通知 + 既存DLQManager活用 | 既存インフラ再利用でコスト最小 |

### LiteLLM最適化（ローカル比率90%+達成）

Phase 4のコスト目標（$650/月）達成のために：

```
軽量タスク（EPUB生成・メール本文・SNS投稿） → Qwen3 72B（LM Studio）← 無料
重要判断（ZEUS意思決定・コードレビュー）    → Claude Sonnet 4.6（Batch API 50%割引）
定型処理（ATHENA担当・レポート）           → Claude Haiku 4.5（$0.80/Mtokens）
```

---

## サマリー: 実現可能性評価

| 要素 | 実現可能性 | 主要課題 |
|------|---------|---------|
| EPUB 500冊/日自動生成 | 高（設計完備） | epub-gen-memory実装・Gutendex連携のみ |
| Amazon SES メール配信 | 高（設計完備） | SES送信承認（PRE-005）が前提 |
| KDP自動アップロード | 中（追加設計要） | 要件書スコープ外・Playwright実装追加必要 |
| ローカルLLM（Qwen3 72B）活用 | 高（2026年1月〜ネイティブ対応） | LM Studio + LiteLLM構成は動作実績あり |
| NemoClaw/NVIDIAセキュリティ強化 | 中（Mac Studio環境に限界） | NemoClaw自体はハードウェア非依存だが要検証 |
| 月額$650以内での運用 | 中（Phase 4達成時） | Phase 3までは$800〜$1,250 かかる見込み |

**最優先アクション**:
1. OpenClaw v2026.3.11インストール + `openclaw doctor` でCVEパッチ確認（Phase 1 Week 1）
2. LM Studio + Qwen3 72B Q4 + LiteLLM の動作確認
3. `epub-gen-memory` ライブラリのスパイク実装（1冊生成の実測値取得）
4. KDPアップロード要件を正式スコープに追加するか否かの意思決定
