# ait42-coordinator 永続メモリ (project scope)

## 委任パターン履歴

### 成功した委任パターン
<!-- タスク種別 → 使用エージェント → 結果 -->

### 失敗した委任パターン
<!-- タスク種別 → 問題 → 改善策 -->

## プロジェクト固有設定

### よく使うエージェント組み合わせ
- コード実装: sub-planner → sub-implementer → sub-code-reviewer
- バグ修正: sub-code-searcher → sub-implementer → sub-test-runner-fixer
- セキュリティ: security-auditor → sub-implementer

### 禁止パターン (このプロジェクト)
<!-- 過去に問題を起こした操作 -->
- Prisma generate 前に build 実行 (2026-02-22)
- MCP 5本同時起動 (コンテキスト ~55k消費)

## コンテキスト管理メモ
- 3+並列エージェント: run_in_background: true 必須
- Task結果 > 2000文字: 即座に compact

*最終更新: 自動更新 (セッション終了時)*
