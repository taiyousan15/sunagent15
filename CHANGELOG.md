# Changelog

このファイルは TAISUN Agent の全ての重要な変更を記録します。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
バージョン管理は [Semantic Versioning](https://semver.org/lang/ja/) に従います。

---

## [2.53.0] - 2026-04-09

### 🔧 修正 (Fixed)

#### 3エージェント合同コードレビュー + 緊急修正・堅牢化
- **Codex Pro + GPT 5.4 Pro Thinking + Opus 4.6** による15ラウンド議論に基づく修正
- research-quality-guard: APIトークン名を検索キーワードから除外（機密情報誘導リスク削除）
- mistake-pattern-matcher: `action.substring(0, 2000)` で大ファイル書込み時のn-gram爆発防止
- cost-hard-stop-guard: recordCost順序修正で上限超過時の二重計上を解消
- rules-enforce-guard + checkpoint-guard: Bashホワイトリスト迂回対策（コマンド連結文字検出）
- utils/session-path.js 新規helper（Path Traversal対策）
- rules-read-tracker: JSON→JSONL append-only化でrace condition解消
- 全9 hookに stdin timeout(3秒) 追加
- catch ハンドラに console.error 追加

#### システム全体クリーンアップ (583a75d)
- cli残骸3ファイル削除、postinstall fail-fast化
- tsx devDependencies追加、jest worktree ignore追加
- シンボリックリンク57個削除（スキル63個全て認識OK）
- settings.json MCP相対パス化（`./tools/...`）
- ESLint 87→0 errors
- hook-profiler: execSync→execFileSync（セキュリティ改善）
- ドキュメント8ファイル+launchd 2ファイルの絶対パス汎用化
- .gitignore セッション固有ファイル追加、tracked テレメトリ/キャッシュ git追跡解除

### 🧪 テスト
- 56/56 suites, 1091/1091 tests 全パス

---

## [2.52.0] - 2026-04-08

### ✨ 追加 (Added)

#### 3層ミス対策システム完成（97/100点）
- **context-snapshot-manager.js** — PreCompact hookで一時保存→SessionStartで自動復元→SessionEndで自動削除
- **mid-session-reminder.js** — 5回プロンプトごとにコアルールを自動再注入
- **mistake-pattern-matcher.js** — Write/Edit/Bash/Task前にmistakes.mdパターンとJaccard類似度で自動照合（日本語2-gram/3-gram対応）
- **cost-hard-stop-guard.js** — 日次$50/月次$500上限でツール実行をハードストップ
- **research-quality-guard.js** — リサーチ出力時の10カテゴリ網羅を物理確認
- research-system SKILL.md強化（720件以上/10カテゴリ最低件数ルール追加）
- CLAUDE.md 91行→76行に段階圧縮

---

## [2.51.0] - 2026-04-07

### ✨ 追加 (Added)

#### チェックポイント物理強制システム（92/100点）
- **checkpoint-guard.js** — PreToolUse hookでboot sequence完了を物理確認（Phase 1:警告→Phase 2:Writeブロック→Phase 3:全ブロック）
- **agent-checkpoint-guard.js** — Task tool起動時に「AGENT CHECKPOINT」マーカー必須化
- **rules-read-tracker.js** — PostToolUse Read hookでルールファイル読み込み履歴を記録
- **rules-enforce-guard.js** — mistakes.md未読時はWrite/Edit/Bash/Task全てブロック（サブエージェント迂回も防止）
- 安全設計: フェイルオープン・タイムアウト3秒・環境変数で完全停止可能

---

## [2.50.0] - 2026-04-07

### ✨ 追加 (Added)

#### BOOT CHECKPOINT
- セッション開始時に動的5問チェック（mistakes.mdランダムPattern確認・SESSION_HANDOFF検証等）
- 推測不可能な質問でファイル読み込みを確実に実行

#### Agent Checkpoint
- 重要Agent起動時に3問の品質ゲートをプロンプト末尾に自動挿入

#### Windows Quick Installer
- `irm ... | iex` の1行でインストール可能に
- install.ps1 .Countバグ全5箇所修正・TLS 1.2強制

### 🔧 修正 (Fixed)
- CLAUDE.md 183行→91行に構造改善（重要ルール先頭配置）
- research系9スキルのeffort:をfrontmatter内に正規化

---

## [2.49.0] - 2026-04-05

### ✨ 追加 (Added)

#### agent-browser v0.24.1 をデフォルトブラウザツールに採用
- Playwright MCPからの移行でコンテキストトークン93%削減（114k→7k/10ステップ）
- CLI方式のためMCP枠を消費しない
- Playwright MCPはオプション降格（disabled: true）

#### udemy-download スキル復活
- Udemyコース全動画+字幕一括ダウンロード対応

### 🔧 修正 (Fixed)
- git履歴衝突時の自動回復を追加（Mac/Windows両対応）
- 動画ダウンロード系トリガーワードをCLAUDE.mdに追加

---

## [2.48.0] - 2026-04-04

### 🗑 削除 (Removed)

#### リポジトリ大規模クリーンアップ
- 909ファイル削除（約199MB削減）
- ルートファイル 105→32（-70%）
- スキル 125→62（-50%）— 不要スキル58件削除+リサーチ子スキル12件をdisable-model-invocation化

### 🔧 修正 (Fixed)
- google-auth-system 壊れたsubmodule→正しいsubmoduleに修正
- sdd-fullの質問を素人でも答えられる平易な日本語に改善
- .gitignore強化

---

## [2.47.0] - 2026-04-03

### ✨ 追加 (Added)
- **research-system-free** — 完全無料リサーチスキル（APIキーゼロ・WebSearch+opencli-rs+Ollamaで動作）
- research-system配布用ファイル同梱（scripts/distributions/）
- CLAUDE.mdにリサーチ自動発動ルール追加

### 🔧 修正 (Fixed)
- Windows git pull競合修正（.gitattributes ps1 eol=lf）
- install.ps1 ReadKey廃止→Start-Sleep 3秒

---

## [2.46.0] - 2026-03-30

### ✨ 追加 (Added)

#### パイプラインコンテキスト連携 v2.5
- research-systemから各リサーチスキルへSTEPコンテキストをJSON経由で自動伝搬
- GSD移植3件（SESSION_HANDOFF JSON構造化・Atomic Git Commits・コンテキスト制御）

### 🔧 修正 (Fixed)
- hooks/data 1.06MB削除・rules重複8ファイル解消・mistakes.md圧縮
- Windows: UTF-8 BOM追加・set -e廃止・非対話対応・git pull失敗→ZIP自動フォールバック
- Mac: set -e廃止・clear廃止・read -p対話判定・rsyncなしcp代替

---

## [2.45.0] - 2026-03-29

### ✨ 追加 (Added)

#### opencli-rs 統合（55サイト333コマンド）
- world-research Layer 5にSNS直接取得追加
- mega-research Deep Modeにopencli-rs補完Step追加
- intelligence-researchに金融3+テック3ソース自動追加
- Twitter/Reddit/LinkedIn/Instagram/TikTok/Facebookのブラウザ認証経由取得対応
- YouTube transcript（動画文字起こし）取得対応

### 🔧 修正 (Fixed)
- README/setup-project.ps1のハードコードパス修正

---

## [2.44.0] - 2026-03-25

### ✨ 追加 (Added)

#### プロファイルインストール（minimal/standard/full）
- install.sh + install.ps1 両対応

#### CodeGraph 統合
- codebase-memory-mcp・自動インデックス・ROI計測

### 🔧 修正 (Fixed)
- 配布互換性修正（ハードコードパス5箇所→環境変数化）
- StopFailure自動記録Hook追加
- effortフロントマター追加（コスト制御）
- video-downloadスキル復活

---

## [2.43.0] - 2026-03-18

### ✨ 追加 (Added)
- スキル早見表4枚（リサーチTier・taiyo-style・LP・SDD）追加
- `taisun:version` `taisun:support` コマンド新設
- 承認モデル実装（投稿系=警告・課金系=ブロック）
- Ollamaランタイムガード
- research-system v2.4（QA Gate・61件URL・外部ファイル不要）

### 🔧 修正 (Fixed)
- BUG-001/004/005/006/007 全解消
- gem-research・unified-research 命名修正
- プロファイル整合性チェック追加

---

## [2.42.0] - 2026-03-17

### 🔧 修正 (Fixed)
- install.sh / update.sh / install.ps1 を全面日本語化（初心者UX改善）
- フォルダ説明・エラー案内・完了後3ステップガイドを追加
- MCPプロファイル切替スキル（`/mcp-profile`）追加
- `npm run mcp:dev|secure|marketing|status` コマンド追加

---

## [2.41.0] - 2026-03-17

### ✨ 追加 (Added)
- README に everything-claude-code インストール・アップデート手順セクション追加

### 🔧 修正 (Fixed)
- MCP 29→21個に整理（不要5サーバー削除）
- proxy-mcp resilience 強化（リトライ5回・エラークラス分類）

---

## [2.40.0] - 2026-03-14

### ✨ 追加 (Added)

#### バリデーション第8層: LLM Judge
- `src/proxy-mcp/validation/llm-judge.ts` 新規追加
- Claude Haiku をセマンティック審判者として使用し、ハルシネーション・論理破綻・事実誤認を検出
- Prompt Caching (`cache_control: ephemeral`) でコスト90%削減
- デフォルト無効 — `VALIDATION_LLM_JUDGE_ENABLED=true` で有効化
- API障害・タイムアウト時はパイプラインを止めず graceful degradation

#### kuromoji 日本語形態素解析 (BUG-008修正)
- `src/proxy-mcp/validation/self-contrast.ts` に kuromoji lazy singleton 追加
- 日本語テキストで名詞・動詞・形容詞・形容動詞を正確に抽出し共有キーワード比較
- `runSelfContrast()` を async 化
- `MAX_SENTENCES=50` キャップで O(N²) 爆発を防止（50,000文字を1.2秒で処理）

### 🔧 修正 (Fixed)

| バグID | 対象ファイル | 内容 |
|--------|------------|------|
| BUG-001 | `pipeline.ts` | `buildPassedLayers(sourceTexts)` の dead parameter 削除 |
| BUG-002 | `cove.ts` | ゼロ除算 NaN — `Math.max(Math.abs(n), Math.abs(claimValue))` + ゼロ近傍ガード |
| BUG-004 | `reflexion.ts` | ラウンド表記バグ `/ round+1` → `/ maxRounds` で正しい分母に |
| BUG-005 | `llm-judge.ts` | `@anthropic-ai/sdk` 未インストール → fetch ベース直接 HTTP に変更 |
| BUG-006 | `constitutional.ts` | MEDICAL regex に `[ァ-ヶー]{4+}(?:塩酸塩|硫酸塩|...)` 追加、薬品名を正確に検出 |
| BUG-007 | `faithfulness.ts` | 数値正規化 `parseNormalizedNumber()` 追加 — k/M/B/T (英語) と 万/億/兆/千/百 (漢字) に対応 |
| BUG-008 | `self-contrast.ts` | kuromoji 形態素解析で日本語文の数値矛盾を検出可能に |

### 🧪 テスト
- `tests/unit/validation-enterprise.test.ts`: 81/81 全テスト通過 (2.8秒)
- `runSelfContrast` 呼び出し箇所を async/await 対応
- BUG-006/008 修正により期待値を「修正後の正しい動作」に更新

---

## [2.39.0] - 2026-03-14

### ✨ 追加 (Added)

#### 7層バリデーションパイプライン
- Constitutional AI + Self-Contrast + CoVe + Faithfulness + DeepEval Gate + Reflexion + Prospective Reflection
- `src/proxy-mcp/validation/` 以下に各層を独立ファイルで実装
- エンタープライズ規模テスト 81件追加

---

## [2.38.0] - 2026-03-13

### ✨ 追加 (Added)
- Stagehand/Skyvern MCP追加でAIブラウザ自動操作を強化

---

## [2.37.0] - 2026-03-12

### ✨ 追加 (Added)
- Firecrawl MCP統合 — スクレイピング・クロール・サイト構造分析

---

## [2.30.0] - 2026-03-02

### 🔧 修正 (Fixed)

#### agentシンボリックリンク更新ロジック修正
- `scripts/install.sh` / `scripts/update.sh`: エージェントリンクのバグを修正
- 旧: `if [ ! -L "$target" ]` のみ → 新規エージェントしかリンクされなかった
- 新: 既存のシンボリックリンクもパスが変わっていれば更新するよう修正
- 影響: `git pull` 後に追加された新エージェントが `~/.claude/agents/` に反映されない問題を解決
- `README.md`: アップデート手順を `git pull && ./scripts/update.sh` に統一（git pullだけでは不十分と明記）

---

## [2.26.0] - 2026-02-27

### 🔧 修正 (Fixed)

#### プランモード自動起動防止
- `~/.claude/rules/no-plan-mode.md` を追加
- Claudeが自動的にプランモード（`EnterPlanMode`）に入るのを防止
- ユーザーが明示的に「プランモードで」と指示した場合のみ使用
- 複雑なタスクはTodoWriteで進捗管理（プランモード不要）

---

## [2.25.0] - 2026-02-22

### ✨ 追加 (Added)

#### Hook Advisory-only モードへ移行
| 変更 | 内容 |
|------|------|
| `deviation-approval-guard.js` | exit(2) → exit(0)（警告のみ、ブロックなし） |
| `agent-enforcement-guard.js` | exit(2) → exit(0)（警告のみ、ブロックなし） |
| `definition-lint-gate.js` | exit(2) → exit(0)（警告のみ、ブロックなし） |
| 理由 | 他プロジェクトのシンボリックリンク運用時に意図しないブロックが発生していたため |
| 安全性 | `unified-guard`（rm -rf / mkfs / dd / fork bomb検出）は引き続きブロック有効 |

#### AGENTS.md: クロスセッション自己改善ループ
- `AGENTS.md` 新設 — セッション横断の教訓・知見を蓄積するログファイル
- `/learn` コマンド — 非自明な問題解決後に教訓を自動キャプチャ
- セッション開始時に自動ロード（`CLAUDE.md` 経由）

---

## [2.24.0] - 2026-02-16

### ✨ 追加 (Added)

#### Bootstrap Safe Mode（Hook安全起動）
| 変更 | 内容 |
|------|------|
| Bootstrap Safe Mode | `.workflow_state.json` 未作成時、ワークフロー系Hookを全スキップ |
| 対象Hook | unified-guard / deviation-approval-guard / agent-enforcement-guard / workflow-fidelity-guard |
| 効果 | 新規インストール・他プロジェクトでのセットアップ時にHookがブロックしなくなった |
| 安全性 | `rm -rf` 等の危険コマンド検出は常に有効（スキップされない） |

---

## [2.23.0] - 2026-02-16

### ✨ 追加 (Added)

- `world-research` スキル公開（`disable-model-invocation: true` を削除）
- API不要の6層リサーチ（学術論文・キュレーション・テックブログ・実装エコシステム・SNS・コミュニティ）
- 必要ツール: WebSearch / WebFetch のみ（Claude Code標準搭載）

---

## [2.22.0] - 2026-02-15

### 🎉 追加 (Added)

#### taisun:diagnose 100/100点達成
| 項目 | スコア |
|------|--------|
| 13層防御システム | 13/13 |
| Hooks設定 | 4/4 |
| スキル | 101個 |
| エージェント | 96個 |
| MCPツール | 248個 |
| **総合スコア** | **100/100点** |

#### コンテキスト最適化 最終結果（75K → 30.2K tokens, -59.7%）
SDD（Spec-Driven Development）に基づく4フェーズのコンテキスト最適化完了。

---

## [2.17.0] - 2026-02-15

### 🔧 修正 (Fixed)

#### コンテキスト最適化 Tier 1（-28〜43K tokens）
| # | タスク | 効果 |
|---|--------|------|
| T1.1 | スキル説明文最適化（英語38文字以内） | ~8-12K token削減 |
| T1.2 | disable-model-invocation（60+低頻度スキル） | ~5-10K token削減 |
| T1.3 | MCP選択的無効化（11サーバー） | ~5-8K token削減 |
| T1.4 | CLAUDE.md 3層分割（213行→55行） | ~10-13K token削減 |

---

## [2.15.0] - 2026-02-14

### 🔧 修正 (Fixed)

- 壊れたサブモジュール（807MB）削除
- 未使用npmパッケージ43個整理
- Hookシステムの共通化・分割（readStdin() を `utils/read-stdin.js` に統合）
- `workflow-state-manager.js`（1,019行）をFacadeパターンで4モジュールに分割

---

## [2.14.0] - 2026-02-13

### ✨ 追加 (Added)

- LLM Auto-Switch v2.0（タスク複雑度ベースのモデル自動切替）
- Intent Parser統合
- Stage 1 メトリクスシステム（収集・集計・レポート生成）
- 自動バックアップ launchd統合（5分ごと）
- URL Learning Pipeline

---

## [2.13.0] - 2026-02-11

### 🔒 セキュリティ (Security)

- 全72スキルにallowed-tools権限分離適用（攻撃成功率41.2%→2.2%）
- APIキー集中管理（.env統合+バリデーション）
- MCPヘルスチェックv2（21サーバー自動検出）

---

## [2.11.0] - 2026-02-04

### 🎉 追加 (Added)

#### Agent Trace統合（新機能）
AI生成コードの帰属追跡システムを導入:
- `agent-trace` スキル - トレース管理・統計・レポート生成
- `.claude/lib/trace-store.ts` - Agent Trace仕様（v0.1.0）準拠ライブラリ
- `.claude/hooks/agent-trace-capture.js` - PostToolUseフック（自動記録）
- 全Edit/Write/NotebookEdit操作を自動追跡
- AI/人間の貢献率を可視化
- コンプライアンス対応レポート生成

**期待効果**:
- デバッグ時間短縮: 30-50%
- コードレビュー効率化: 20-30%
- 監査対応工数削減: 40-60%

**関連ドキュメント**:
- `docs/AGENT_TRACE_INTEGRATION_PROPOSAL.md`

---

## [2.10.1] - 2026-02-04

### 🎉 追加 (Added)

#### 新スキル追加
- `mega-research-plus` - 8つの検索ソース（Tavily/SerpAPI/Brave/NewsAPI/Perplexity/Twitter/DuckDuckGo/WebSearch）統合リサーチ
- `note-research` - note.comリサーチツール（非公式API + MCP + WebSearch）
- `pdf-processing` - 包括的PDF処理スキル
- `skill-validator` - Anthropicベストプラクティスに基づくスキル検証

#### 新エージェント追加
- `-coordinator-agent` - コーディネーター
- `-codegen-agent` - コード生成
- `-issue-agent` - Issue管理
- `-pr-agent` - PR管理
- `-review-agent` - コードレビュー
- `-deployment-agent` - デプロイメント
- `meta-ads-agent` - Meta広告管理

#### 新コマンド追加
- `-agent`, `-auto`, `-init`, `-status`, `-todos`
- `meta-ads`, `meta-ads-full`

#### Meta広告スキル追加
- `meta-ads-analyze` - 広告分析
- `meta-ads-bulk` - 一括操作
- `meta-ads-competitors` - 競合分析
- `meta-ads-creative` - クリエイティブ生成
- `meta-ads-optimize` - 最適化

### 🔧 修正 (Fixed)

#### スキルYAMLフロントマター修正
32個のスキルにYAMLフロントマターを追加し、Claude Codeのスキルリストに正しく表示されるよう修正:
- `anime-production`, `custom-character`, `diagram-illustration`
- `doc-convert-pandoc`, `docker-mcp-ops`, `dual-ai-review`
- `education-framework`, `funnel-builder`, `gpt-sovits-tts`
- `kindle-publishing`, `line-marketing`, `lp-design`
- `lp-json-generator`, `mega-research`, `note-marketing`
- `notion-knowledge-mcp`, `omnihuman1-video`, `pdf-automation-gotenberg`
- `postgres-mcp-analyst`, `research-cited-report`, `sales-systems`
- `security-scan-trivy`, `sns-marketing`, `sns-patterns`
- `taiyo-style`, `telop`, `unified-notifications-apprise`
- `unified-research`, `youtube-content`, `youtube-thumbnail`
- `youtube_channel_summary`

#### 存在しないMCPパッケージ参照の削除
- `~/.claude/skills/agentic-vision/references/mcp_servers.json` を削除
- グローバルスキル `agentic-vision` のSKILL.mdから非存在パッケージ参照を削除
  - 削除理由: `@anthropic/mcp-glm-vision`等のパッケージはnpmに存在しない
  - Anthropicの公式パッケージは`@anthropic-ai/*`名前空間を使用

### 📖 ドキュメント (Documentation)

#### Kindle AI表紙テンプレート作成
- `kindle_ai_anime_cover_template.md` - 5スタイルの包括的デザインパターン
- `kindle_cover_templates.json` - プログラム利用向けJSON形式
- `kindle_ai_prompts.txt` - 15個の画像生成プロンプト

### 🔒 セキュリティ (Security)

- 存在しないnpmパッケージへの参照を削除（インストール時エラー防止）
- Claude APIドキュメントのtool-search-tool機能を分析・適用検討

---

## [2.4.1] - 2026-01-18

### 🎉 追加 (Added)

#### Phase 3 Super Memory - 完全自動化

**自動保存機能**
- `PostToolUse` フック: 50KB超の出力を自動保存
- `PreToolUse` フック: 危険なコマンドをブロック
- `SessionEnd` フック: セッション統計表示
- stdin JSON入力対応（Claude Code仕様準拠）

**効果**
- コンテキスト削減: 97%
- コスト削減: 99.5%
- 年間削減額: $1,130+
- 追加コスト: $0（ローカル保存のみ）

**更新ファイル**
- `.claude/settings.json` - 新フック形式に更新
- `.claude/hooks/auto-memory-saver.js` - PostToolUse統合
- `.claude/hooks/workflow-guard-bash.sh` - stdin JSON対応
- `.claude/hooks/workflow-guard-write.sh` - stdin JSON対応

**ドキュメント**
- `RELEASE_v2.4.1.md` - リリースノート
- `docs/SUPER_MEMORY_STATUS.md` - Phase 3完了ステータス
- `DISTRIBUTION_GUIDE.md` - 配布手順更新

---

## [2.4.0] - 2026-01-15

### 🎉 追加 (Added)

#### Workflow Guardian Phase 3 - 高度なワークフロー機能

**条件分岐 (Conditional Branching)**
- `file_content`: ファイル内容に基づく条件分岐
- `file_exists`: ファイル存在チェックによる分岐
- `metadata_value`: ワークフローメタデータによる動的分岐
- 正規表現パターンマッチング対応
- デフォルトフォールバック機能

**並列実行 (Parallel Execution)**
- `parallelNext`: 複数フェーズの並列実行
- `waitStrategy: all` - 全フェーズ完了まで待機
- `waitStrategy: any` - いずれか1フェーズ完了で次へ
- 並列実行状態の追跡と可視化
- 並列実行履歴の記録

**ロールバック (Rollback)**
- `rollbackToPhase()`: 指定フェーズへのロールバック
- `allowRollbackTo`: ロールバック可能フェーズの制限
- ロールバック履歴の記録とスナップショット保存
- 理由の記録機能

**新しいドキュメント**
- `docs/WORKFLOW_PHASE3_QUICKSTART.md` - 5分でわかるクイックスタート
- `docs/WORKFLOW_PHASE3_GUIDE.md` - 完全ガイド（予定）
- `docs/WORKFLOW_PHASE3_DESIGN.md` - 設計仕様書
- `RELEASE_v2.4.0.md` - リリースノート

**テストスイート**
- 50個の自動テスト（全て合格）
  - 条件分岐テスト: 12個
  - 並列実行テスト: 6個
  - 統合テスト: 6個
  - ロールバックテスト
  - 型定義テスト

### 🔧 修正 (Fixed)

**ワークフロー状態管理**
- ワークフロー定義の読み込みタイミングを修正
- テストにおける `clearCache()` の実行順序を修正
- ファイルシステム競合時の処理を改善

**テストの安定性向上**
- `clearState()`: ENOENT エラーのハンドリング追加
- `saveState()`: 一時ファイルクリーンアップのエラーハンドリング
- 並列テスト実行時の競合問題を解決

**Jest設定**
- workflow-phase3 プロジェクトの `maxWorkers: 1` 設定
- `--runInBand` フラグの推奨を明記

### 📖 ドキュメント (Documentation)

- Phase 3 の全機能を網羅したドキュメント追加
- 初心者向けクイックスタートガイド
- 実践的なサンプルワークフロー
- トラブルシューティングガイド

### ⚠️ 重要な注意事項 (Important Notes)

**テスト実行**
```bash
# Phase 3 テストは必ず --runInBand で実行
npm test -- --selectProjects=workflow-phase3 --runInBand
```

**互換性**
- 既存の Phase 1/2 ワークフローとの完全な後方互換性
- 新機能は段階的に追加可能

---

## [2.3.0] - 2026-01-12

### 追加

**Workflow Guardian Phase 2 - Strict Mode**
- 厳格モードによる強制的な成果物チェック
- スキルガード機能
- ワークフロー外でのツール使用禁止

**Auto-Memory Phase 3**
- コンテキスト自動保存
- 大量出力の自動圧縮
- 97%のコンテキスト削減

### 修正
- ワークフローフック統合の改善
- 状態管理の安定性向上

---

## [2.2.0] - 2026-01-10

### 追加

**Workflow Guardian Phase 1 - 基本機能**
- 線形ワークフローの実装
- フェーズ遷移管理
- 成果物検証
- 進捗追跡

**OpenCode/OMO Integration**
- 組織記憶システム統合
- セッション連続性の確保

---

## [2.1.0] - 2025-12-20

### 追加
- MCP Server 統合
- 81 エージェント統合
- 67 スキル実装

---

## [2.0.0] - 2025-11-15

### 追加
- TAISUN v2 の初回リリース
- 統合開発システムの基盤構築

---

## 記号の意味

- 🎉 追加 (Added) - 新機能
- 🔧 修正 (Fixed) - バグ修正
- 📖 ドキュメント (Documentation) - ドキュメント変更
- ⚠️ 重要 (Important) - 注意が必要な変更
- 🗑️ 削除 (Removed) - 削除された機能
- 🔒 セキュリティ (Security) - セキュリティ関連
- ⚡ パフォーマンス (Performance) - パフォーマンス改善
