# 🗺️ taisun_agent プロジェクト地図 (v1 — 現状スナップショット)

> **目的**: この地図は、「どこに何があるか」を初めて触る人が**5 分で掴める**ためのドキュメント。
> **作成日**: 2026-04-21（セッション19、アーキテクチャ作業 A1）
> **数値最終更新**: 2026-04-25（PR `fix/metadata-truth-and-changelog`、tracked / 数値ベースのみ更新）
> **更新方針**: 破壊的変更なし・追記型（既存ファイルの役割が変わったら該当行のみ修正）
> **関連文書**: `docs/ARCHITECTURE.md`（詳細設計）、`../taisun_agentの目的と目標とビジョン/` （方針）

---

## ⚡ 30 秒で分かる全体像

- **本質**: Claude Code にインストールする拡張パック。素人〜中級者が「やりたいこと」を伝えるだけで大企業レベルの要件定義・開発準備を AI が代行。
- **規模**: tracked **1,260 ファイル**（行数は CI 実測へ委譲）
- **主要コンポーネント**: 67 スキル / 62 hook / 26 MCP サーバー / 22 CI ジョブ
- **ブランチ運用**: `main` 一本主義、機能追加は `feat/*` `fix/*` で PR → squash merge

---

## 🏛️ トップレベル地図

```
taisun_agent/
├── src/                           # アプリ本体（TypeScript）
├── dist/                          # ビルド成果物（自動生成）
├── scripts/                       # 運用スクリプト（installer, validator 等）
├── schemas/                       # JSON/YAML スキーマ定義
├── config/                        # 設定ファイル群
├── prisma/                        # DB スキーマ（Prisma ORM）
├── tests/                         # テストコード（unit/integration/regression/...）
├── docs/                          # ドキュメント（52 ファイル）← 今ここ
├── .claude/                       # Claude Code 拡張本体（詳細後述）
├── mcp-servers/                   # MCP サーバー実装
├── mcp-presets/                   # MCP プリセット定義
├── tools/                         # バイナリツール（codebase-memory-mcp 等）
├── logs/                          # 実行ログ（英語圏向け）
├── ログ/                          # セッションログ（日本語）
├── research/                      # 調査・研究結果
├── agent-output/                  # エージェント出力
├── debate/                        # Opus×Codex クロスレビュー記録（現行）
├── debate-audit/                  # 過去のレビュー監査
├── debate-priority1/              # 優先度1タスクの議論
├── debate-v2/                     # v2 レビュー履歴
├── debate-v5/                     # v5 レビュー履歴
├── google-auth-system/            # Google 認証モジュール
├── udemy-downloader/              # Udemy ダウンロード機能
├── taisun_agentの目的と目標とビジョン/  # プロジェクト方針文書（日本語）
└── node_modules/                  # npm 依存（自動生成）
```

---

## 🧩 `.claude/` 内部地図（Claude Code 拡張の心臓部）

```
.claude/
├── skills/            # 67 スキル（/xxx で呼び出し可能な機能単位）
├── hooks/             # 62 hook（SessionStart/PreToolUse/PostToolUse 等で発火）
├── agents/            # サブエージェント定義（※現在は subagent_type 経由）
├── commands/          # スラッシュコマンド（kindle-*.md など）
├── rules/             # ルール集（mistakes.md ← 失敗台帳）
├── memory/            # 永続メモリ（MEMORY.md + 種別別ファイル）
├── boot/              # ブート時ロードファイル
├── checkpoints/       # 進捗チェックポイント
├── decisions/         # ADR（設計判断記録）
├── reports/           # 集計レポート
├── archive/           # アーカイブ（旧バージョン保管）
├── temp-context/      # セッション一時コンテキスト
├── temp/              # 汎用一時領域
├── worktrees/         # git worktree 作業領域
├── includes/          # 共通インクルード
├── lib/               # 共通ライブラリ
├── scripts/           # .claude 内部スクリプト
├── mcp-servers/       # .claude 配下 MCP
├── mcp-tools/         # MCP ツール
├── praetorian/        # Praetorian 関連
├── presets/           # プリセット
├── references/        # リファレンス文書
├── agent-memory/      # エージェント向け永続メモリ
└── agent-source/      # エージェントソース
```

---

## 📊 規模の実測値（2026-04-25 更新 / 行数・テスト数は CI 実測へ委譲）

| 区分 | 実測 | 備考 |
|---|---:|---|
| Git tracked files | **1,260** | `git ls-files \| wc -l`（2026-04-25 測定） |
| Untracked files | ~130 | 個別指定管理（kindle-*.md / skill symlinks 等） |
| 総コード行数（tracked） | (CI 実測へ委譲) | 過去値: 299,539（2026-04-21 snapshot） |
| Markdown 行数 | (CI 実測へ委譲) | 過去値: 163,962（2026-04-21 snapshot） |
| スキル（SKILL.md） | **67** | `.claude/skills/*/SKILL.md`（_archived を除く active 数） |
| スキルディレクトリ数 | 69 | SKILL.md なしのディレクトリ 2 件存在 |
| Hooks (`.js`) | **62** | `.claude/hooks/*.js`（top-level のみ） |
| Installed agents (`.claude/agents/**`) | **0** | 未配置。Claude Code 組み込み subagent を活用 |
| Agent-source templates (`.claude/agent-source/**`) | **95** | 手動 install 用テンプレート定義 |
| MCP servers (`.mcp.json`) | **26** | `Object.keys(j.mcpServers).filter(k=>!k.startsWith('_')).length`（`_comment_*` 疑似キー 8 件を除いた実サーバー数） |
| Tracked commands (`.claude/commands/`) | **111** | `git ls-files .claude/commands \| wc -l`（find では 114 = +3 untracked kindle-*.md） |
| Tests ファイル | (CI 実測へ委譲) | 過去値: 56（2026-04-21 snapshot） |
| Test suites | (CI 実測へ委譲) | `jest --listTests` で実測 |
| Tests (total) | (CI 実測へ委譲) | `npm test` で実測 |
| docs ファイル | 52 | `docs/*.md`（当時の snapshot） |
| Open PRs | (確認要) | GitHub API 実測 |
| CI ジョブ | 22 | Portability Guard / Install Smoke / jest / eslint 等 |

---

## 🎯 主要コンポーネント解説（素人向け）

### スキル（`.claude/skills/*/SKILL.md`）
**「/xxx」で呼び出せる機能パック**。  
例: `/session-start`（引き継ぎ読了）、`/debate-review`（Opus×Codex クロスレビュー）、`/nanobanana-pro`（画像生成）

分類（代表例）：
- セッション管理: session-start / session-end / task-miss / honest-mode
- リサーチ: research-system / research-free / world-research / mega-research
- レビュー: debate-review / review-code / review-docs / security-review
- コピーライティング: taiyo-style-* 系
- コンテンツ制作: kindle-* / shorts-create / video-agent / nanobanana-pro
- 開発支援: codegraph / sdd-* / develop-* / design-* / optimize-* / test-*

### Hook（`.claude/hooks/*.js`）
**イベント発火型の自動処理**。Claude の動作の前後に挟まる安全装置・ガード・計測機能。  
例: `unified-guard.js`（危険操作の事前検査）、`model-auto-switch.js`（モデル自動切替）、`context-snapshot-manager.js`（コンテキスト保存）

### Rules（`.claude/rules/`）
**プロジェクト運用のルール**。  
- `mistakes.md`: 過去の失敗と再発防止策（Pattern 1〜11）
- `context-management.md`: コンテキスト運用ガイド
- `auto-model-switch.md`: モデル自動切替ルール

### Memory（`.claude/memory/`）
**セッションをまたぐ永続記憶**。  
`MEMORY.md` を index として、`user_*.md` / `feedback_*.md` / `project_*.md` / `reference_*.md` を分類管理。

---

## 🚧 未評価 / 今後の調査対象

| 領域 | 状態 | 次アクション |
|---|---|---|
| 未使用コード検出 | 未実施 | Dead code scan |
| 依存関係マップ（スキル↔hook↔agent） | 未作成 | A3 予定 |
| セキュリティ境界マップ | 未作成 | A4 予定 |
| 69 スキルディレクトリ中 SKILL.md なし 2 件 | 未調査 | F8.2 validator で検出可能 |
| docs 52 ファイルの重複・古文書 | 未整理 | 継続課題 |
| `debate-v2/v5` 履歴の保存ポリシー | 未定 | ADR 予定 |

---

## 🛠️ 地図の更新ルール（破壊しないために）

1. **新しいディレクトリを作ったら、必ずこの地図の該当セクションに 1 行追加**
2. **古いディレクトリを消す前に、この地図の該当行を消せるか検討**
3. **役割が変わったディレクトリは該当行のみ修正**（他の人の作業は壊さない）
4. **この地図自体は `docs/` 配下、追記型で運用**（履歴は git で追う）

---

## 📎 関連文書

- `docs/ARCHITECTURE.md` — 詳細アーキテクチャ設計（356 行）
- `docs/DEVELOPER_GUIDE.md` — 開発者ガイド
- `docs/OPERATIONS.md` — 運用手順
- `docs/CONTRIBUTING.md` — コントリビュートガイド
- `../taisun_agentの目的と目標とビジョン/taisun_agentの目的と目標.md` — 原点（プロジェクトの目的・目標・ビジョン）
- `../taisun_agentの目的と目標とビジョン/taisun_agentの目的と目標_3段階版.md` — 読みやすい 3 段階版（同フォルダに新規追加）
- `.claude/rules/mistakes.md` — 失敗台帳（再発防止）
