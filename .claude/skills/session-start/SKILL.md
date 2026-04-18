---
description: "Session Start - 指示書読了+ログ読了+検証+作業開始（プロジェクト別指示書を自動探索／明示指定可）"
---

# Session Start

前セッションからの引き継ぎを100%正確に行うスキル。
プロジェクト別の指示書／引継ぎファイルを自動探索して読み込む。

## 引数による明示指定（最優先）

スキル起動時に引数でパスが渡された場合（例: `/session-start path=/abs/path/to/INSTRUCTIONS.md`）、
**Phase 0 の自動探索をスキップ**して、そのパスを採用する。
ファイルが存在しなければエラーで停止し、ユーザーに修正を依頼する。

## Phase 0: プロジェクト指示書の自動探索

引数指定が無い場合のみ実行する。

```bash
# プロジェクトルートを取得（CLAUDE_PROJECT_DIR が無ければ pwd）
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
echo "PROJECT_DIR=$PROJECT_DIR"

# Step 1: プロジェクト直下／.claude 配下の固定候補（最優先）
fixed_candidates=(
  "$PROJECT_DIR/SESSION_HANDOFF.md"
  "$PROJECT_DIR/指示書.md"
  "$PROJECT_DIR/.claude/SESSION_HANDOFF.md"
  "$PROJECT_DIR/.claude/指示書.md"
)

found=()
for f in "${fixed_candidates[@]}"; do
  [ -f "$f" ] && found+=("$f")
done

# Step 2: PROJECT_DIR で見つかった場合は Desktop スキャンをスキップ
if [ ${#found[@]} -gt 0 ]; then
  echo "SCOPE: project-local"
else
  echo "SCOPE: desktop-fallback"
  if [ -d "$HOME/Desktop" ]; then
    while IFS= read -r f; do
      found+=("$f")
    done < <(find "$HOME/Desktop" -maxdepth 2 -type f \
              \( -name "SESSION_HANDOFF.md" -o -name "指示書.md" \) 2>/dev/null)
  fi
fi

# Step 3: 重複排除して列挙
printf '%s\n' "${found[@]}" | awk '!seen[$0]++'
```

**判定ルール（厳守）**:
- 候補が0件 → 「指示書が見つかりません。`/session-start path=...` で明示指定してください」と申告して停止
- 候補が1件 → そのファイルを採用（採用パスを変数 `INSTRUCTION_FILE` として記録）
- 候補が複数（Desktopフォールバック時のみ発生） → **必ず一覧をユーザーに提示**し、番号で選んでもらう。勝手に1件目を採用してはならない

**スコープ動作**:
| SCOPE | 意味 | 候補数の目安 |
|-------|------|--------------|
| `project-local` | プロジェクト直下に指示書あり → そこで完結 | 1〜4件 |
| `desktop-fallback` | プロジェクトに無いので Desktop 全体から探す | 多数になり得る |

選択完了後、採用パスを以下の形式で明示してから Phase 1 へ進む:
```
ADOPTED_INSTRUCTION_FILE=<選択された絶対パス>
```

## Phase 1: 指示書読了

`Read` ツールで `INSTRUCTION_FILE` を**全行読了**する。
- 大きなファイルは `offset` / `limit` を使って分割読みし、最終行まで到達したことを確認する
- 「途中まで読んで理解した」は禁止

読了後、行数と最初の見出し（`# ` で始まる行）を報告する。

## Phase 2: 関連ログ読了

採用した指示書内の以下のセクションに記載された全ファイルを、記載順に Read する:
- 「最初に読むべきファイル」
- 「関連ファイル」
- 「ログ」「履歴」「引継ぎ」

加えて、ログディレクトリの存在確認:
```bash
for d in "$PROJECT_DIR/ログ" "$PROJECT_DIR/logs" "$PROJECT_DIR/.claude/logs"; do
  [ -d "$d" ] && echo "LOG_DIR: $d" && ls "$d"
done
```
存在するディレクトリのファイルを記載順／更新日時順に読了する。

## Phase 3: 検証

読んだファイルごとに以下を確認:
1. 行数（`wc -l` または Read 結果の最終行番号）
2. 最初の見出し
3. 100%読んだと言い切れるか

言い切れないファイルがあれば、正直に申告してから読み直す。**自己申告のため、嘘をつかないことが前提**。

## Phase 4: git状態確認

```bash
git -C "$PROJECT_DIR" log --oneline -5
git -C "$PROJECT_DIR" branch --show-current
git -C "$PROJECT_DIR" status --short | head -30
```
git リポジトリでない場合はスキップ（エラーでも停止しない）。

## Phase 5: システム健全性確認（該当ツールがある場合のみ）

```bash
# Jest（package.json があり、jestが解決できる場合）
if [ -f "$PROJECT_DIR/package.json" ] && \
   (cd "$PROJECT_DIR" && npx --no-install jest --version >/dev/null 2>&1); then
  (cd "$PROJECT_DIR" && \
   npx jest --no-coverage --forceExit 2>&1 | grep -E "^(Test Suites|Tests):" || true)
fi

# ESLint（.claude/hooks がある場合）
if [ -d "$PROJECT_DIR/.claude/hooks" ]; then
  (cd "$PROJECT_DIR" && \
   npx eslint .claude/hooks/*.js --no-ignore --format compact 2>&1 | tail -1 || true)
fi
```
該当ツール／ファイルが無ければスキップ。

> **Note**: 元の taisun_agent では `--selectProjects unit regression workflow-phase3 integration` を指定していた。
> プロジェクト固有の jest project が必要な場合は、`/session-start` 実行後に手動で追加実行すること。

## Phase 6: 読了報告

冒頭に採用情報を明示:
```
採用指示書: <INSTRUCTION_FILE>
探索ベース: <PROJECT_DIR>
```

続いて読了ファイル一覧:

| ファイル | 行数 | 状態 |
|---------|------|------|
| (絶対パス) | (行数) | 全行読了 / 未読 |

## ルール（厳守）

- 推測・憶測・勝手な判断は禁止
- 読んでいないファイルの内容を語ることは禁止
- 「読んだつもり」「途中まで読んで理解した」は禁止
- ショートカット・省略・ごまかしは禁止
- 嘘は禁止。知らないことは「知らない」と言え
- 全ファイル読了後に作業開始。読了前の作業開始は禁止
- 候補が複数あって判断に迷う場合は、必ずユーザーに確認する
- 候補が0件で引数指定も無ければ、勝手に作業を始めず停止する
