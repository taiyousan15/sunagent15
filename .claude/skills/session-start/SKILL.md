---
description: "Session Start - 指示書読了+ログ読了+検証+作業開始"
---

# Session Start

前セッションからの引き継ぎを100%正確に行うスキル。

## Phase 1: 指示書読了

```
Read /Users/matsumototoshihiko/Desktop/指示書.md
```

指示書を全行読了する。途中で止めない。全行読んだ後に次へ進む。

## Phase 2: ログ読了

指示書の「最初に読むべきファイル」セクションに記載された全ファイルを、記載順に読了する。

ログフォルダも読了する:
```
ls /Users/matsumototoshihiko/taisun_agent/ログ/
```
全ログファイルを読了する。

## Phase 3: 検証

読んだファイルごとに以下を確認:
1. 何行あったか（wc -lまたはRead行数で検証）
2. 最初の見出しは何か
3. 自分が100%読んだと言い切れるか

言い切れないファイルがあれば、正直に申告してから読み直す。

## Phase 4: git状態確認

```bash
git log --oneline -5
git branch --show-current
git status --short | head -30
```

## Phase 5: システム健全性確認

```bash
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration 2>&1 | grep -E "^(Test Suites|Tests):"
npx eslint .claude/hooks/*.js --no-ignore --format compact 2>&1 | tail -1
```

## Phase 6: 読了報告

読了した全ファイルの一覧表を提示する:

| ファイル | 行数 | 状態 |
|---------|------|------|
| (ファイル名) | (行数) | 全行読了 / 未読 |

## ルール

- 推測・憶測・勝手な判断は禁止
- 読んでいないファイルの内容を語ることは禁止
- 「読んだつもり」「途中まで読んで理解した」は禁止
- ショートカット・省略・ごまかしは禁止
- 嘘は禁止。知らないことは「知らない」と言え
- 全ファイル読了後に作業開始。読了前の作業開始は禁止
