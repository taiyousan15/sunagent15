# Phase 2: 全会一致サマリ — Opus 4.7 × Codex Pro

**Date**: 2026-04-17
**Source**: opus_15rounds.md (45 findings) + codex_15rounds.md (45 verdicts)
**Verification**: Opus が Codex のテーブルを目視再集計し一致確認（AGREE 27 + PARTIAL 16 + DISAGREE 2 = 45）

## ラウンド別 verdict マトリクス（Codex 出力 + Opus 検証）

| Round | F1 | F2 | F3 |
|-------|----|----|----|
| 1 (機能正確性) | AGREE | PARTIAL | PARTIAL |
| 2 (アーキテクチャ) | AGREE | PARTIAL | AGREE |
| 3 (エラー処理) | AGREE | AGREE | AGREE |
| 4 (パフォーマンス) | PARTIAL | DISAGREE | AGREE |
| 5 (セキュリティ) | DISAGREE | PARTIAL | PARTIAL |
| 6 (ドキュメント) | AGREE | AGREE | AGREE |
| 7 (コスト) | PARTIAL | AGREE | PARTIAL |
| 8 (テスタビリティ) | AGREE | AGREE | AGREE |
| 9 (運用性) | AGREE | PARTIAL | AGREE |
| 10 (エッジケース) | AGREE | AGREE | AGREE |
| 11 (UX) | AGREE | PARTIAL | AGREE |
| 12 (保守性) | AGREE | PARTIAL | AGREE |
| 13 (データ整合性) | AGREE | PARTIAL | AGREE |
| 14 (法務) | PARTIAL | AGREE | PARTIAL |
| 15 (統合) | PARTIAL | AGREE | PARTIAL |

## 集計（Opus 目視確認済み）

- **AGREE 27** (60%): 修正実行可能ライン
- **PARTIAL 16** (35.6%): ユーザー判断 or 仕様補強必要
- **DISAGREE 2** (4.4%): 不採用 or 別手段

## DISAGREE 詳細

### F4.2 (Pattern: 数値推測)
- **Opus**: 検索全件走査が「1ms 未満」と主張
- **Codex**: 「容量計算は正しいが <1ms は根拠不足、IO/GC を含めれば変動」
- **Opus 自己評価**: Codex 正論。Pattern 10 違反気味の数値断定だった。**取り下げ**

### F5.1 (Pattern: 推測拡張)
- **Opus**: fastembed-js も protobufjs critical を内包する可能性大
- **Codex**: 「現状 package*.json に該当依存記録なし、未検証断定は弱い。ただし採用前監査必須の方針は妥当」
- **Opus 自己評価**: 結論（事前監査必須）は維持されているため、勧告には影響なし。**部分撤回**（断定→監査義務）

## Codex 追加観点（Opus が抜け漏れた論点）

| Round | Codex 提案 | Opus 評価 |
|-------|-----------|----------|
| 4 | KPI を先に固定 | 受諾、F案に組み込む |
| 8 | ベンチ合格閾値を事前定義 | 受諾、F案に組み込む |
| 10 | topK 上限（例:20）も同時ガード | 受諾、実装時の境界処理に追加 |
| 13 | missing-embedding => lexical fallback を明文化 | 受諾、運用方針として明記 |
| 15 | F案に定量ゲート追加 | 受諾、F'案として更新 |

## Codex 全体勧告

- **F案への賛否**: PARTIAL（賛成だが定量ゲート不足）
- **修正提案**: 「critical=0（依存監査）」「Recall@5 +15%（ベンチ）」を Priority 1 再開条件に追加
- **致命的反対理由**: なし
- **Codex 独自代替案**: E 先行維持 + B opt-in 段階導入

## 両者一致の主要結論（実行可能ライン）

1. **E（PR マージ優先）を主軸採用** — Round 7.3, 11.2, 15.1 で AGREE/PARTIAL（実質E支持）
2. **決定記録追記が必須** — Round 6.1, 6.2, 11.3, 15.2 で AGREE
3. **ベンチ拡張（PHASE3 #21）が Priority 1 再開の前提** — Round 4.3, 8.3, 15.3 で AGREE/PARTIAL
4. **B（Ollama）採用は opt-in + 定量ゲート通過後** — Round 1.2, 2.2, 5.2, 11.1 で PARTIAL（条件付き支持）
5. **C（fastembed-js）採用は依存監査前提、現時点優先度低** — Round 5.1 DISAGREE（断定取り下げ）→ 監査義務は継続
6. **D（純 JS）単独採用は不採用** — Round 1.1, 7.2, 12.3 で AGREE
7. **A（完全放置）は不採用、最低限の決定記録は必要** — Round 6.2, 11.3 で AGREE

## 統合された最終勧告: 選択肢 F'

```
F' = 選択肢 E + 決定記録追加 + ベンチ拡張 + 定量ゲート

Phase 1 (本セッション、要承認):
  1. semantic-search.js に決定記録コメント追加
  2. PR #307 マージ → #309 rebase → マージ（破壊的、ユーザー承認必須）
  3. mistakes.md Pattern 12 追加（指示書整合性チェック）

Phase 2 (次セッション):
  4. PHASE3 #21 拡張: search 精度ベンチ追加（KPI 先行定義）
  5. ベンチ閾値設定: Recall@5 +15% over 単語索引、レイテンシ p95 < 200ms

Phase 3 (Phase 2 通過後):
  6. B（Ollama opt-in）実装: HTTP 経路、graceful degradation、診断統合
  7. ゲート: critical=0, Recall@5 +15%, opt-in 検出が動作確認

Phase 4 (Phase 3 効果実測後):
  8. C（fastembed-js）の依存監査再判定 or B 本採用
```
