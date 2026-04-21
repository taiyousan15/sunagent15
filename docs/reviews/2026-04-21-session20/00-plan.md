# Session20 Review — Execution Plan (Confirmed)

**作成日**: 2026-04-21
**承認者**: ユーザー（GO + 5 体並列）
**実行主体**: Opus 4.7（main session）+ Codex Pro（`/codex:rescue` 経由）+ サブエージェント 5 体
**目的**: 指示書 Section 3 優先4 (Opus 4.7 × Codex Pro 本格レビュー) の完遂

---

## 役割分担（確定）

| 役割 | 担当 |
|---|---|
| 設計・アーキテクチャ・抽象改善 | Opus 4.7 |
| ドキュメント一貫性・目的整合性 | Opus 4.7 |
| 最終統合・優先度付け・PR 候補 | Opus 4.7 |
| バグ特定・コード修正案 | Codex Pro |
| テストケース・回帰テスト | Codex Pro |
| 領域別並列調査（read-only） | サブ 5 体 |

## サブエージェント 5 体（全て `run_in_background: true`）

| サブ | agent_type | 対象 | 出力先 |
|---|---|---|---|
| A | Explore (very thorough) | tests/, .claude/hooks/, .claude/skills/ | 01-code-quality.md |
| B | doc-reviewer | docs/, CLAUDE.md, 目的文書 | 02-docs-consistency.md |
| C | security-scanner | installer/hooks/settings/MCP 外部入力 | 03-security-boundaries.md |
| D | system-architect | skill/hook/agent 依存・孤立・循環 | 04-architecture-deps.md |
| E | cicd-manager | .github/workflows/, installer, portability | 05-ci-installer.md |

## 実行順序

1. **Phase 0** (完了): Codex setup 確認 ✅ / temp-context dir ✅ / 00-plan.md ✅ / baseline 記録 (次)
2. **Phase 1** (30-45 分): サブ 5 体同時起動（単一メッセージ内、run_in_background: true、500 字要約制約）
3. **Phase 2** (15-20 分): /codex:rescue で Phase 1-A 結果を深掘り（バグ修正案 + 回帰テスト）
4. **Phase 3** (30-60 分): /debate-review skill で 15 ラウンド + 全会一致ゲート
5. **Phase 4** (20-30 分): Opus 4.7 統合 + 99-final-report.md

## 品質・安全ゲート

- G1 Pattern 7: エージェント報告を目視検証
- G2 Pattern 10: 数値主張は実ファイル再計測
- G3 「壊さない・追加型優先」原則（既存ファイル touch 最小）
- G4 context 保護: サブは全件 `run_in_background: true`
- G5 temp-context 活用、/compact 前に退避
- G6 write 系操作ゼロ（Phase 0-3 全期、Phase 4 は report 生成のみ）

## 5 改善項目（判断軸）

1. 費用抑制
2. メモリ強化
3. エラー削減
4. コンテキスト抑制
5. 目的忘却防止

## 除外事項

- 「V2 パイプライン」は除外（ユーザー指定、セッション18 で確定）
- Phase 0-3 では一切の write/commit を行わない
- PR 化は Phase 4 後にユーザー再承認を経る
