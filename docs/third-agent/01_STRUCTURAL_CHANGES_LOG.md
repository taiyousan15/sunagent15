# 構造変更ログ

プロジェクト構造に影響する変更を記録する。
第三エージェント（または次セッションのAI）が「なぜこうなっているのか」を理解するためのログ。

---

## 2026-04-11: コンテキスト最適化 — ~20Kトークン/セッション削減

### コミット
- `cdda592` fix: context optimization — eliminate ~20K tokens/session of wasted context
- `a632eee` fix: update.sh and setup-project.sh to copy agents instead of symlink

### 変更の背景

Claude Codeは `.claude/agents/*.md` と `~/.claude/agents/*.md` の両方からエージェント定義を読み込む。
また、プロジェクト内の全 `CLAUDE.md` を「プロジェクト指示書」として自動読み込みする。

調査の結果、以下のコンテキスト膨張が発見された:

| 問題 | 影響 |
|------|------|
| `.claude/agents/` の95ファイルが `~/.claude/agents/` と完全重複 | プロジェクト+グローバルで二重読み込みの可能性 |
| 109個の空 `CLAUDE.md` がプロジェクト全体に散在 | 各ファイルが「プロジェクト指示書」として毎セッション読み込み（~16Kトークン消費） |
| `~/.claude/agents/` の95ファイルがプロジェクトへのシンボリックリンク | リポジトリ移動/削除でリンク切れ |

### 変更内容

#### 1. エージェント定義の移動

```
変更前: .claude/agents/*.md       ← Claude Codeが自動読み込み
変更後: .claude/agent-source/*.md ← Claude Codeは読み込まない（installスクリプト専用）
```

- 95個のエージェント `.md` ファイルを `.claude/agents/` → `.claude/agent-source/` にリネーム移動
- ファイル内容は1バイトも変更していない
- `~/.claude/agents/` のシンボリックリンクを実ファイルコピーに変換

#### 2. 空CLAUDE.mdの一括削除

- 109個の `CLAUDE.md` を削除（全て `claude-mem` 自動生成の空テンプレート）
- 内容: `<claude-mem-context># Recent Activity\n*No recent activity*</claude-mem-context>`
- **残存**: `.claude/CLAUDE.md`（メインの指示書）のみ

#### 3. インストールスクリプトの更新

| スクリプト | 変更 |
|-----------|------|
| `install.sh` | ソースパスを `agent-source/` に変更。シンボリックリンク → コピー方式 |
| `update.sh` | 同上 |
| `setup-project.sh` | 同上 |
| `install.ps1` | ソースパスを `agent-source/` に変更（元からコピー方式） |
| `test-agents.sh` | パスを `agent-source/` に変更 |
| `phase1/verify.sh` | パスを `agent-source/` に変更 |
| `phase1/doctor.sh` | パスを `agent-source/` に変更 |

#### 4. テストヘルパーの更新

`tests/utils/test-helpers.ts`:
- エージェント読み込みパスを `agent-source/` → `~/.claude/agents/` のフォールバック方式に変更

### インストール後のファイル配置

```
taisun_agent/
├── .claude/
│   ├── CLAUDE.md              ← 唯一のCLAUDE.md（メイン指示書）
│   ├── agent-source/          ← 95エージェント定義（installスクリプトのソース）
│   │   ├── 00-ait42-coordinator.md
│   │   ├── ait42-backend-developer.md
│   │   └── ... (95 files)
│   ├── agents/                ← 空（Claude Codeはここを見るが、何も読み込まない）
│   └── skills/                ← 63スキル（変更なし）
│
~/.claude/
└── agents/                    ← 95エージェント（実ファイルコピー）
    ├── 00-ait42-coordinator.md
    └── ... (install.shがコピー)
```

### 新規ユーザーのインストールフロー

1. `git clone` → `.claude/agent-source/` を取得（`.claude/agents/` は空/不在）
2. `bash scripts/install.sh` → `agent-source/` から `~/.claude/agents/` にコピー
3. Claude Code起動 → グローバル `~/.claude/agents/` からのみエージェント読み込み
4. **結果**: 二重読み込みなし、全95エージェント使用可能

### やってはいけないこと

- `.claude/agent-source/` のファイルを削除しない（インストールソース）
- `.claude/agents/` にファイルを置かない（二重読み込みが復活する）
- `claude-mem` が `CLAUDE.md` を再生成した場合は定期的に削除する

### 検証結果

- BUILD: OK
- TESTS: 56/56 suites, 1091/1091 tests
- ESLINT: 0 problems
- 新規インストール: 正常動作確認
- 既存ユーザーアップデート: シンボリックリンク→コピー自動変換確認
