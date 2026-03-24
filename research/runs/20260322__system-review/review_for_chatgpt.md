# ChatGPTへの指示

以下の「TAISUN Agent v2.43.0 システム全体レビュー」を読んで、**シニアソフトウェアアーキテクト＋DevOpsエンジニアの視点**で厳しく批評してください。

## レビュー観点（必ず全て回答すること）

1. **発見された問題の深刻度判定** — 各問題の深刻度は正しいか？見落としはないか？
2. **修正優先順位** — どの順番で修正すべきか？即座に修正すべきものはどれか？
3. **未使用hookの整理方針** — 多数の未使用hookを削除すべきか、保持すべきか？
4. **パフォーマンス懸念** — hook 17本が毎回動作することのオーバーヘッドは問題か？
5. **CodeGraph導入の影響** — 今回追加されたcodebase-memory-mcp + 3 hookの設計に問題はないか？
6. **セキュリティ** — Go製バイナリの導入、hookの権限、MCP設定に問題はないか？
7. **スケーラビリティ** — 700+スキル、17 hook、16 MCPサーバーという規模で性能劣化は起きないか？
8. **最も弱い設計箇所TOP 3** — システム全体で最も脆弱な設計を3つ指摘してください

## 出力フォーマット

```
## 総合評価: [A/B/C/D/F]

### 1. 問題の深刻度判定
[回答]

### 2. 修正優先順位
[回答]

...（8項目全て）

### 総合コメント
[200文字以内の総括]

### 即座に修正すべきアクションリスト
- [具体的な修正手順を優先順位付きで]
```

---

# TAISUN Agent v2.43.0 システム全体レビュー

## システム概要

TAISUN Agentは、Claude Code上で動作するAIエージェント統合プラットフォーム。

| コンポーネント | 数量 |
|-------------|------|
| エージェント | 96 |
| スキル（グローバル） | 707 |
| スキル（プロジェクト） | 130 |
| MCPサーバー（グローバル） | 16 |
| MCPサーバー（プロジェクト） | 1（codebase-memory） |
| hooks（アクティブ） | 17 |
| hooks（未使用） | 20+ |

## 監査で発見された問題

### High (2件)

**H1: supertest / @types/supertest が本番依存に混入**
- package.jsonのdependenciesにテスト専用ライブラリが含まれている
- devDependenciesに移動すべき
- 影響: 本番ビルドサイズ増大、不要な依存チェーン

**H2: prisma CLI不在でprismaClientが依存に存在**
- @prisma/client ^7.5.0 がdependenciesにあるが、prisma CLIがdevDependenciesにない
- postinstallでのスキーマ生成が失敗する可能性
- 影響: 新規インストール時にprismaが使えない

### Medium (3件)

**M1: tsconfig.json にoutDir未設定**
- dist/への出力先がメインtsconfigに未指定
- tsconfig.proxy.json等に分散
- 影響: tscでの直接コンパイルが意図通り動かない可能性

**M2: CLAUDE.md のベースラインファイル一覧が不明**
- 「Baseline-registered files are immutable」ルールがあるが一覧がない
- .claude/references/CLAUDE-L2.md への参照のみ
- 影響: どのファイルが変更禁止か不明確

**M3: pre-compact-save.js がBashマッチャーで登録**
- Bash実行ごとにtimeout 5秒で起動
- 高頻度トリガーでパフォーマンス影響の可能性
- 影響: 全Bashコマンドが最大5秒遅延

### Low (2件)

**L1: TypeScript ^5.3.2 が古い（最新5.8系）**
**L2: CLAUDE.md のエージェント数・スキル数が実数と乖離の可能性**

## 今回の CodeGraph 導入で追加されたもの

### 新規ファイル
- tools/codebase-memory-mcp/codebase-memory-mcp — Go製バイナリ v0.5.3 (136MB)
- .claude/hooks/codegraph-roi-meter.js — ROI計測
- .claude/hooks/codegraph-auto-index.js — 自動更新（Write/Edit後）
- .claude/hooks/codegraph-oss-monitor.js — OSS健全性監視（SessionStart）
- .claude/skills/codegraph/SKILL.md — スキル定義

### 変更ファイル
- .claude/settings.json — MCP追加 + hooks 3本追加
- .claude/CLAUDE.md — CodeGraphセクション + メモリ責務分離ルール追加

### CodeGraph統計
- インデックス: 44,444 ノード / 59,661 エッジ
- 構築時間: 2.5秒
- DB容量: 約58MB (SQLite)

## Hook一覧（全17本アクティブ）

| Event | Hook | Matcher | Timeout |
|-------|------|---------|---------|
| SessionStart | workflow-sessionstart-injector.js | * | 5s |
| SessionStart | codegraph-oss-monitor.js | * | 10s |
| UserPromptSubmit | model-auto-switch.js | * | 3s |
| UserPromptSubmit | skill-usage-guard.js | * | 3s |
| UserPromptSubmit | agent-enforcement-guard.js | * | 3s |
| PreToolUse | unified-guard.js | Write/Edit/Bash | 3s |
| PreToolUse | deviation-approval-guard.js | Write/Edit/Bash | 3s |
| PreToolUse | agent-enforcement-guard.js | Write/Edit/Task | 3s |
| PreToolUse | pre-compact-save.js | Bash | 5s |
| PostToolUse | auto-adr.js | Write/Edit | 3s |
| PostToolUse | definition-lint-gate.js | Write/Edit | 5s |
| PostToolUse | agent-trace-capture.js | Write/Edit/NotebookEdit | 3s |
| PostToolUse | compact-optimizer.js | * | 2s |
| PostToolUse | task-overflow-guard.js | Task | 3s |
| PostToolUse | output-verifier.js | * | 3s |
| PostToolUse | codegraph-roi-meter.js | Read/Grep/Glob | 2s |
| PostToolUse | codegraph-auto-index.js | Write/Edit | 12s |
| SessionEnd | session-handoff-generator.js | * | 5s |

## 未使用hookファイル（存在するがsettings.jsonで未登録）

auto-changelog.js, auto-compact-manager.js, auto-memory-saver.js, console-log-guard.js, context-monitor.js, copy-safety-guard.js, cost-warning.js, dashboard-generator.js, file-creation-guard.js, input-sanitizer-guard.js, large-output-guard.js, ollama-guard.js, session-end-ledger.js, tmux-reminder.js, violation-recorder.js, workflow-fidelity-guard.js, 他

## MCP サーバー構成

### グローバル（~/.claude/settings.json）: 16サーバー
taisun-proxy, playwright, context7, figma, qdrant, n8n-mcp, line-bot, voice-ai, ai-sdr, youtube, meta-ads, facebook-ads-library, obsidian, twitter-client, firecrawl, stagehand, sequential-thinking, github, rube, apify, tavily

### プロジェクト（.claude/settings.json）: 1サーバー
codebase-memory (defer_loading=true)

### 無効化済み
figma, qdrant, chroma, n8n-mcp, meta-ads, facebook-ads-library, obsidian, twitter-client, mcp-memory-service, sequential-thinking, pexels

## セキュリティ状況

- ハードコードAPIキー: なし（security-gate.tsの`sk-`はパターン検出用正規表現のみ）
- .env管理: 適切（.gitignore含む）
- Go製バイナリ: 公式リリースからダウンロード（ソースビルドではない）
- hookの権限: 全てnode実行、shell injection対策は各hookで個別実装

## 壊れたシンボリックリンク: 0件
