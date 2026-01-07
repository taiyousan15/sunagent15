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

---

## 2026-01-07 Task: Memory Enhancement（記憶強化）
- **Goal**: 記憶システムをさらに強化し、セッション間の継続性を向上
- **Deliverables**:
  - MCP Memory統合スクリプト
  - セッション開始ブリーフィング機能
  - 関連ドキュメント更新
- **Constraints**:
  - 既存のmemory.md, mistakes.md等を破壊しない
  - 無料で実装（追加コストなし）
  - 既存のMCPツール（memory_add, memory_search）を活用
- **Never Do**:
  - 外部サービス契約
  - 既存ファイル構造の大幅変更
- **DoD**:
  - [ ] MCP Memory統合実装
  - [ ] セッション開始ブリーフィング実装
  - [ ] テスト通過
  - [ ] ドキュメント更新
- **Notes**: 高優先度2項目を先に実装
