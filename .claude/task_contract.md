# Task Contract（現在のタスク契約）

## Goal
- 指示忠実性と再発防止のフレームワークを確立する

## Deliverables
- Issue: N/A（フレームワーク設定タスク）
- PR: N/A
- Docs: directives.md, mistakes.md, task_contract.md, running_summary.md
- Tests: N/A

## Constraints (Must)
- ユーザーの指示を契約として扱う
- 推測や自己流で上書きしない
- デフォルト言語は日本語
- 変更は最小差分・可逆

## Never Do (Must NOT)
- 勝手にリファクタしない
- 出力を肥大化させない（全文を会話に垂れ流さない）
- 秘密情報をログに書かない
- 既存実装を読まずに修正案を出さない

## Acceptance Criteria / DoD
- [x] directives.md 作成
- [x] mistakes.md 作成（過去のミス4件を記録）
- [x] task_contract.md 作成
- [x] running_summary.md 作成
- [x] memory.md に長期ルールを追記

## Regression Checklist (from mistakes.md)
- [x] success: true を誤って返していないか
- [x] execSync の文字列補間を使っていないか
- [x] 空の catch ブロックがないか
- [x] ワイルドカード許可を使っていないか

## Plan (file-level)
- files:
  - path: .claude/directives.md
    change: 新規作成
  - path: .claude/mistakes.md
    change: 新規作成（過去ミス4件記録）
  - path: .claude/task_contract.md
    change: 新規作成
  - path: .claude/running_summary.md
    change: 新規作成
  - path: .claude/memory.md
    change: 長期ルール追記

## Assumptions
- 既存の .claude/CLAUDE.md は保持する
- フレームワークファイルは .claude/ 直下に配置
