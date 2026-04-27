---
name: handoff-lite
description: "セッション状態を9-11行の最小ファイルに圧縮して .claude/temp-context/handoff-lite.md に保存。branch/HEAD/open-PR/次アクション3件/blocker/do_not の最小セット。session-end の 1/10 コスト、/compact 前 / context 60% 到達時 / 短時間引継ぎ用。"
when_to_use: "コンパクト前に保存 / 引継ぎ軽量化 / 高速引継ぎ / handoff-lite / 最小引継ぎ / context が重い / セッション中断 と言われた時。session-end ほど詳細なログ・指示書作成は不要で、状態スナップショットだけ欲しい場合。"
requires: {}
---

# Handoff Lite

セッション状態を 9-11 行の最小ファイルに圧縮し `.claude/temp-context/handoff-lite.md` に保存するスキル。
`/session-end` の 1/10 コストで状態スナップショットだけを残す軽量版。

## 役割分離（重要）

| スキル | 用途 | コスト | 出力 |
|---|---|---|---|
| `/session-end` | セッション完全終了、詳細ログ + 指示書作成 | 5-10 分 | `ログ/YYYY-MM-DD_セッションNログ.md` + `Desktop/指示書.md` |
| **`/handoff-lite`** | **`/compact` 前 / 短時間中断 / 高速引継ぎ** | **1-2 分** | **`.claude/temp-context/handoff-lite.md`（11 行）** |
| `/session-start` | 新セッション開始時の引継ぎ読了 | - | （読み取り専用） |

`/handoff-lite` は session-end の代替ではない。詳細ログが必要なら必ず `/session-end` を使う。

## Phase 1: git 状態取得（30 秒）

```bash
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
git -C "$PROJECT_DIR" log --oneline -3
git -C "$PROJECT_DIR" branch --show-current
git -C "$PROJECT_DIR" status --short | head -10
```

取得項目:
- 現在ブランチ
- HEAD コミット（短ハッシュ + メッセージ 1 行）
- 未 commit 変更ファイル（最大 10 件）

## Phase 2: open PR 取得（30 秒、`gh` CLI 必須）

```bash
gh pr list --state open --limit 5 --json number,title,headRefName 2>/dev/null \
  || echo "GH_UNAVAILABLE"
```

`gh` 不在 / 認証なしの場合は `open_prs: unknown (gh not found)` で fallback。エラーで停止しない。

## Phase 3: 11 行ファイル生成（1 分）

`Write` ツールで `.claude/temp-context/handoff-lite.md` に以下のフォーマットで保存。
**毎回上書き**（常時最新 1 件のみ運用）。

### 出力フォーマット（11 行最小テンプレート）

```markdown
## HANDOFF-LITE [{YYYY-MM-DD HH:MM}]
branch: {current-branch}
HEAD: {short-hash} {commit-message-oneliner}
open-PRs: {#PR1 title}, {#PR2 title} | none
last-action: {1 行で何をしたか}
next[1]: {最優先アクション}
next[2]: {次のアクション}
next[3]: {任意 | 省略可}
blocker: {あれば記載 | none}
do_not: {禁止事項 | none}
files-modified: {主要変更ファイル 3 件まで}
```

### 各フィールドのルール

| フィールド | 形式 | 例 |
|---|---|---|
| `timestamp` | `YYYY-MM-DD HH:MM`（実時刻、推測禁止） | `2026-04-27 11:13` |
| `branch` | `git branch --show-current` の出力 | `main` |
| `HEAD` | 短ハッシュ + commit message 1 行目 | `e880f3d docs(project-map): truth-sync ...` |
| `open-PRs` | `#番号 title` をカンマ区切り、なければ `none` | `#345 fix(hooks): portability` |
| `last-action` | 直前に完了した作業を 1 行で | `PR β merge + sync-plugin Codex確認` |
| `next[1-3]` | 次セッション最優先 1-3 件 | `handoff-lite skill 新設` |
| `blocker` | 進行を妨げる要因、なければ `none` | `Codex タイムアウト 13分` |
| `do_not` | 再失敗防止のため触らないファイル / 操作 | `sync-plugin-metadata.js は触るな (Codex Verdict A)` |
| `files-modified` | 主要変更 3 件まで（PROJECT_MAP より重要なもの優先） | `docs/PROJECT_MAP.md, .claude/hooks/lib/...` |

### 出力例（実セッション 28 終了時のスナップショット）

```markdown
## HANDOFF-LITE [2026-04-27 11:13]
branch: main
HEAD: e880f3d docs(project-map): truth-sync to post-PR-β reality (1,264 / 25)
open-PRs: none
last-action: PR β (#345 hooks portability) + #346 PROJECT_MAP truth-sync 両方 merge
next[1]: handoff-lite スキル新設（Phase 1 実装）
next[2]: SESSION_HANDOFF.md テンプレ刷新（45行→11行）
next[3]: skills 残 3 箇所のポータビリティ修正
blocker: none
do_not: sync-plugin-metadata.js には触るな (Codex Verdict A 確定済、修正不要)
files-modified: docs/PROJECT_MAP.md, .claude/hooks/lib/project-dir-resolver.js, .github/workflows/portability-guard.yml
```

## Phase 4: SESSION_HANDOFF.md への追記（30 秒、Pattern 14 対策）

`/session-end` を経由しない短時間中断でも、Pattern 14（SESSION_HANDOFF 自動生成テンプレ放置）を防ぐ。

### 手順

1. `Read` で `SESSION_HANDOFF.md` を全行読了
2. ファイル末尾に Phase 3 で生成した 11 行ブロックを **`Edit` で append**（上書きせず追記）
3. 追記時の見出し: `## Auto-appended by /handoff-lite [YYYY-MM-DD HH:MM]`

### Append フォーマット

```markdown
---

## Auto-appended by /handoff-lite [{YYYY-MM-DD HH:MM}]

{Phase 3 で生成した 11 行ブロックをそのまま}
```

既に同日の `Auto-appended by /handoff-lite` 見出しがあれば、その下を**最新ブロックに置換**（同日複数回実行時の肥大化防止）。

## Phase 5: 完了報告（10 秒）

以下のフォーマットで報告:

```
✅ handoff-lite saved
file: .claude/temp-context/handoff-lite.md (11 lines)
SESSION_HANDOFF.md: appended at L{行数}
復元方法: 次セッションで /session-start を実行 → handoff-lite.md を最優先 Read
```

## ルール（厳守）

- 推測・憶測で値を埋めるな。`git` / `gh` の実行結果のみ使う
- `gh` 不在は致命エラーではない（`open_prs: unknown` で続行）
- `.claude/temp-context/handoff-lite.md` は**常時最新 1 件のみ**（過去版を残さない）
- セッション内で複数回実行可（毎回 Phase 1-5 を完走、上書き運用）
- Phase 4 を**スキップしない**（Pattern 14 対策の核）
- `do_not` フィールドは**必ず埋める**（none でも明示）。Agent B 提案の再失敗防止コア
- `next[1]` は必須、`next[2-3]` は任意
- 9-11 行を超えたら情報過多。詳細は `/session-end` 側に逃がす

## エラーハンドリング

| 症状 | 対処 |
|---|---|
| `git` リポジトリでない | Phase 1 で `branch: not-a-git-repo` と記録、Phase 2 をスキップ |
| `gh` 不在 / 未認証 | `open_prs: unknown (gh not found)` で続行 |
| `.claude/temp-context/` 不在 | `mkdir -p` で作成してから Write |
| `SESSION_HANDOFF.md` 不在 | Phase 4 を新規作成として実行（既存テンプレ流用は不要、11 行ブロックのみ書く） |

## 設計根拠

- 公式仕様: `description` + `when_to_use` ≤ 1,536 字（本スキルは約 250 字 → 余裕あり）
- 設計レポート: `research/runs/2026-04-27__context-optimization/report.md` §6 + 付録 A
- Pattern 14 対策: Phase 4 で SESSION_HANDOFF.md への明示追記を強制
- `do_not` フィールド: コミュニティ実測（buildtolaunch / johnlindquist 他 4 ソース）で「最大の再失敗防止効果」と評価
