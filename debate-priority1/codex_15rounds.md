# Codex Pro — Adversarial Review on Opus 15 Rounds

**Date**: 2026-04-17
**Reviewer**: Codex Pro (GPT-5.4)
**Target**: debate-priority1/opus_15rounds.md

## Round 1 — Codex Challenge
### Re: Finding 1.1 (D に反対)
- Verdict: AGREE
- Reason: 【実測】`MEMORY_FINAL_VERDICT.md:39-44` と `semantic-search.js:14-21` は埋め込み前提。
- Counter-evidence: 【推測】D拡張余地はあるが本要件外。

### Re: Finding 1.2
- Verdict: PARTIAL
- Reason: 【実測】`semantic-search.js:71-77` は Xenova 判定のみで Ollama 判定なし。
- Counter-evidence: 【推測】実装次第で lexical fallback は可能。

### Re: Finding 1.3
- Verdict: PARTIAL
- Reason: 【実測】`MEMORY_FINAL_VERDICT.md:65-68` に「何もしない」選択肢あり。
- Counter-evidence: 【実測】Opus引用の「指示書:42-46」は本WSで未検証。

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 2 — Codex Challenge
### Re: Finding 2.1
- Verdict: AGREE
- Reason: 【実測】`search()` は空配列固定（`semantic-search.js:55-58`）。
- Counter-evidence: なし

### Re: Finding 2.2
- Verdict: PARTIAL
- Reason: 【実測】`package.json:7-10` に Ollama セットアップ導線なし。
- Counter-evidence: 【実測】「指示書:75-76」原文は未確認。

### Re: Finding 2.3
- Verdict: AGREE
- Reason: 【実測】`embed(_text)` 単入力（`38-40`）かつ `build-embeddings.js` 未作成。
- Counter-evidence: なし

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 3 — Codex Challenge
### Re: Finding 3.1
- Verdict: AGREE
- Reason: 【実測】HTTP実装/timeout/retry/circuit breaker が未実装。
- Counter-evidence: なし

### Re: Finding 3.2
- Verdict: AGREE
- Reason: 【実測】`build-embeddings.js` 不在。`.toon` は 243件（実測）。
- Counter-evidence: なし

### Re: Finding 3.3
- Verdict: AGREE
- Reason: 【実測】`embed()` は汎用 `Error` throw のみ（`38-40`）。
- Counter-evidence: 【推測】小規模運用なら許容余地はある。

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 4 — Codex Challenge
### Re: Finding 4.1
- Verdict: PARTIAL
- Reason: 【実測】243件は確認できるが、ms見積は未実測。
- Counter-evidence: 【推測】CPU環境では遅延が大きくぶれる。

### Re: Finding 4.2
- Verdict: DISAGREE
- Reason: 【実測】容量式は正しいが「<1ms」は根拠不足。
- Counter-evidence: 【推測】実運用はIO/GCを含み単純計算ではない。

### Re: Finding 4.3
- Verdict: AGREE
- Reason: 【実測】`token-baseline.js:3-14` は token推定用途で精度ベンチではない。
- Counter-evidence: なし

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- KPIを先に固定。

## Round 5 — Codex Challenge
### Re: Finding 5.1
- Verdict: DISAGREE
- Reason: 【実測】`package*.json` に fastembed/Xenova/protobufjs の現存記録なし。
- Counter-evidence: 【推測】採用前依存監査必須という方針は妥当。

### Re: Finding 5.2
- Verdict: PARTIAL
- Reason: 【推測】localhost無認証懸念は妥当だが本WSで設定未検証。
- Counter-evidence: 【実測】`MEMORY_FINAL_VERDICT.md:6-12` の評価軸とは整合。

### Re: Finding 5.3
- Verdict: PARTIAL
- Reason: 【推測】ローカルプロセス境界はクラウド送信より低リスク。
- Counter-evidence: 【実測】`PHASE3_FINAL_CONSENSUS.md:32-33` で #23 ガバナンス明記。

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 6 — Codex Challenge
### Re: Finding 6.1
- Verdict: AGREE
- Reason: 【実測】`semantic-search.js:11-12,110` が Xenova 導線を維持。
- Counter-evidence: なし

### Re: Finding 6.2
- Verdict: AGREE
- Reason: 【実測】`semantic-search.js:1-22` に却下理由の記録がない。
- Counter-evidence: なし

### Re: Finding 6.3
- Verdict: AGREE
- Reason: 【実測】`MEMORY_FINAL_VERDICT.md:39` は B/C/D 別見積を欠く。
- Counter-evidence: なし

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 7 — Codex Challenge
### Re: Finding 7.1
- Verdict: PARTIAL
- Reason: 【実測】既導入者/未導入者でコスト差が出る方向性は妥当。
- Counter-evidence: 【推測】容量数値は本WS未検証。

### Re: Finding 7.2
- Verdict: AGREE
- Reason: 【実測】`MEMORY_FINAL_VERDICT.md:15` が現状を全文マッチのみと定義。
- Counter-evidence: なし

### Re: Finding 7.3
- Verdict: PARTIAL
- Reason: 【実測】`git log --oneline -12` で直近9コミットは確認。
- Counter-evidence: 【実測】PR #307/#309 状態はネットワーク制限で未検証。

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 8 — Codex Challenge
### Re: Finding 8.1
- Verdict: AGREE
- Reason: 【実測】`rg ... tests` で semantic-search 関連 0件。
- Counter-evidence: 【推測】間接テストは残る可能性あり。

### Re: Finding 8.2
- Verdict: AGREE
- Reason: 【実測】`cosineSimilarity` は pure 化しやすく単体テスト適性が高い。
- Counter-evidence: なし

### Re: Finding 8.3
- Verdict: AGREE
- Reason: 【実測】`PHASE3_FINAL_CONSENSUS.md:30-33,71-73` で #21 前提。
- Counter-evidence: なし

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- ベンチ合格閾値を事前定義すべき。

## Round 9 — Codex Challenge
### Re: Finding 9.1
- Verdict: AGREE
- Reason: 【実測】`indexCompaction` はログなし（`semantic-search.js:63-66`）。
- Counter-evidence: なし

### Re: Finding 9.2
- Verdict: PARTIAL
- Reason: 【実測】`reasoning-capture.js:51-73` はツール入力中心でscore非記録。
- Counter-evidence: 【推測】score全量保存はログ肥大化リスク。

### Re: Finding 9.3
- Verdict: AGREE
- Reason: 【実測】`taisun-diagnose.js` に semantic/Ollama 診断項目なし。
- Counter-evidence: なし

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 10 — Codex Challenge
### Re: Finding 10.1
- Verdict: AGREE
- Reason: 【実測】`search(_query,_topK)` に境界処理なし（`55-57`）。
- Counter-evidence: なし

### Re: Finding 10.2
- Verdict: AGREE
- Reason: 【実測】`package.json:29` に `check:unicode` があり正規化課題は妥当。
- Counter-evidence: 【推測】実害頻度は環境依存。

### Re: Finding 10.3
- Verdict: AGREE
- Reason: 【実測】空クエリ/短文ガードが未実装。
- Counter-evidence: なし

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- `topK` 上限（例:20）も同時ガードすべき。

## Round 11 — Codex Challenge
### Re: Finding 11.1
- Verdict: AGREE
- Reason: 【実測】`taisun-diagnose.js` で Ollama 導線がなく初心者UXは弱い。
- Counter-evidence: なし

### Re: Finding 11.2
- Verdict: PARTIAL
- Reason: 【実測】9コミット価値は確認できる。
- Counter-evidence: 【実測】PRの OPEN/MERGEABLE は再検証不能。

### Re: Finding 11.3
- Verdict: AGREE
- Reason: 【実測】`semantic-search.js:1-22` に検討結論の保存なし。
- Counter-evidence: なし

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 12 — Codex Challenge
### Re: Finding 12.1
- Verdict: AGREE
- Reason: 【実測】`semantic-search.js:29-31` は定数中心で抽象層が未整備。
- Counter-evidence: なし

### Re: Finding 12.2
- Verdict: PARTIAL
- Reason: 【推測】監査負荷増大はあり得るが fastembed 実測がない。
- Counter-evidence: 【実測】現時点で当該依存は未導入。

### Re: Finding 12.3
- Verdict: AGREE
- Reason: 【推測】D先行は後で semantic 再投資を招く事例が多い。
- Counter-evidence: なし

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 13 — Codex Challenge
### Re: Finding 13.1
- Verdict: AGREE
- Reason: 【実測】`.claude/praetorian/embeddings` 不在、`.gitignore:56-57` は未カバー。
- Counter-evidence: なし

### Re: Finding 13.2
- Verdict: PARTIAL
- Reason: 【推測】自動hookは有効だが初期は手動再構築でも成立。
- Counter-evidence: 【実測】現行仕様で必須要件には未定義。

### Re: Finding 13.3
- Verdict: AGREE
- Reason: 【実測】`index.json:2-70` は存在、embedding側仕様は未定義。
- Counter-evidence: なし

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- `missing-embedding => lexical fallback` を明文化すべき。

## Round 14 — Codex Challenge
### Re: Finding 14.1
- Verdict: PARTIAL
- Reason: 【実測】`package.json:114` は MIT。外部ランタイムのライセンスは未検証。
- Counter-evidence: 【推測】Bをopt-in化すれば同梱義務を減らせる。

### Re: Finding 14.2
- Verdict: AGREE
- Reason: 【実測】`PHASE3_FINAL_CONSENSUS.md:32-33` が #23 を明示。
- Counter-evidence: なし

### Re: Finding 14.3
- Verdict: PARTIAL
- Reason: 【実測】現状態で Xenova 依存は `package*.json` から確認できない。
- Counter-evidence: 【推測】法域責任（NIS2等）の断定は根拠不足。

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- なし

## Round 15 — Codex Challenge
### Re: Finding 15.1
- Verdict: PARTIAL
- Reason: 【実測】E優位の論拠（未実装/未ベンチ/未監査）は成立。
- Counter-evidence: 【実測】PR状態の再確認ができず結論強度は限定。

### Re: Finding 15.2
- Verdict: AGREE
- Reason: 【実測】`semantic-search.js:1-22` と現実が乖離しており記録追記は必須。
- Counter-evidence: なし

### Re: Finding 15.3
- Verdict: PARTIAL
- Reason: 【推測】F（E+記録+#21）は順序として妥当。
- Counter-evidence: 【実測】Go/No-Go 指標（依存監査/Recall閾値）が未定義。

### Codex 追加観点（このラウンドで Opus が抜け漏れた論点）
- Fに定量ゲートを追加すべき。

## Codex 全体勧告
- Opus の F 案への賛否: PARTIAL
- 修正提案: `critical=0`（依存監査）と `Recall@5 +15%`（ベンチ）を再開条件に追加。
- 致命的な反対理由: なし
- Codex 独自の代替案: E先行を維持し、Bは opt-in で段階導入。

## 全会一致サマリ
- 完全合意 (AGREE): 27 findings
- 部分合意 (PARTIAL): 16 findings
- 不一致 (DISAGREE): 2 findings
- 全 45 findings の verdict 集計表

| Round | 1 | 2 | 3 |
|---|---|---|---|
| 1 | AGREE | PARTIAL | PARTIAL |
| 2 | AGREE | PARTIAL | AGREE |
| 3 | AGREE | AGREE | AGREE |
| 4 | PARTIAL | DISAGREE | AGREE |
| 5 | DISAGREE | PARTIAL | PARTIAL |
| 6 | AGREE | AGREE | AGREE |
| 7 | PARTIAL | AGREE | PARTIAL |
| 8 | AGREE | AGREE | AGREE |
| 9 | AGREE | PARTIAL | AGREE |
| 10 | AGREE | AGREE | AGREE |
| 11 | AGREE | PARTIAL | AGREE |
| 12 | AGREE | PARTIAL | AGREE |
| 13 | AGREE | PARTIAL | AGREE |
| 14 | PARTIAL | AGREE | PARTIAL |
| 15 | PARTIAL | AGREE | PARTIAL |
