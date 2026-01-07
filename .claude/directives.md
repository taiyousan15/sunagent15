# Directives Ledger（指示台帳）

このファイルはユーザーの指示を構造化して記録する台帳です。
各タスクの開始時に、指示を以下のカテゴリで分解して追記します。

---

## 2026-01-07 Task: Master Prompt Framework Setup
- **Goal**: 指示忠実性と再発防止のフレームワークを確立
- **Constraints**:
  - ユーザーの指示は契約として扱う
  - 推測や自己流で上書きしない
  - デフォルト言語は日本語
- **Never Do**:
  - 勝手にリファクタしない
  - 出力を肥大化させない
  - 秘密情報をログに書かない
- **DoD**:
  - directives.md 作成
  - mistakes.md 作成
  - task_contract.md 作成
  - running_summary.md 作成
  - memory.md 更新
- **Notes**: 以後のタスクはこのフレームワークに従って実行する
