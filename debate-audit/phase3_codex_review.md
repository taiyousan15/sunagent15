# Phase 3 Codex 厳格査読
対象5資料読了（未読なし）

## 20項目判定
1) #1 **PARTIAL**: 欠損対応は必要。ただし削除一択は過剰で、`disabled`維持+非対応明記を先行すべき。**RISK**: 後日再有効化時に追跡不能。根拠: `debate-audit/phase3_opus_proposals.md:11`, `debate-audit/AUDIT_SUMMARY.md:6`

2) #2 **PARTIAL**: テスト復旧は最優先だが、`--max-old-space-size`は対症療法。クラッシュ根因分析を先に固定化すべき。**RISK**: CI不安定の温存。根拠: `debate-audit/phase3_opus_proposals.md:16`, `debate-audit/AUDIT_SUMMARY.md:7`

3) #3 **PARTIAL**: クリーンアップ自体は妥当。ただし作業データ混在可能性が高く、削除前に所有者確認・アーカイブ必須。**RISK**: 実作業成果の消失。根拠: `debate-audit/phase3_opus_proposals.md:20`, `debate-audit/phase1b_purity.md:64`, `debate-audit/phase1b_purity.md:90`, `debate-audit/phase1b_purity.md:101`

4) #4 **PARTIAL**: 容量削減効果は大。だが profile 削除は再現性検証手順を先に定義すべき。**RISK**: ブラウザ連携デバッグ不能化。根拠: `debate-audit/phase3_opus_proposals.md:26`, `debate-audit/phase1b_purity.md:95`

5) #5 **PARTIAL**: 「質重視」は同意。ただし目標100は根拠薄い。利用頻度ベースの拡張計画が必要。**RISK**: 数合わせ化。根拠: `debate-audit/phase3_opus_proposals.md:34`, `debate-audit/AUDIT_SUMMARY.md:81`, `debate-audit/phase2c_github_trends.md:67`

6) #6 **PARTIAL**: 方向性は妥当。ただし「10x節約」は未検証で、Praetorian競合設計も未解像。**RISK**: 二重記憶・運用複雑化。根拠: `debate-audit/phase3_opus_proposals.md:38`, `debate-audit/phase2c_github_trends.md:54`, `debate-audit/phase2c_github_trends.md:231`

7) #7 **DISAGREE**: Docker前提の本統合は「他人インストール容易性」を悪化。97%は未検証・ソース特定不足。まず任意プラグイン化で検証すべき。**RISK**: 導入障壁増、保守負債。根拠: `debate-audit/phase3_opus_proposals.md:44`, `debate-audit/phase2c_github_trends.md:104`, `debate-audit/phase2c_github_trends.md:168`, `debate-audit/phase2c_github_trends.md:227`

8) #8 **PARTIAL**: semantic searchは必要。だが embedding API コスト・rate limit・プライバシー設計が欠落。**RISK**: 想定外コストと情報流出。根拠: `debate-audit/phase3_opus_proposals.md:49`, `debate-audit/phase1b_purity.md:80`, `debate-audit/AUDIT_SUMMARY.md:32`

9) #9 **AGREE**: PID由来衝突リスクへのUUID化は妥当。**RISK**: 移行期の読取不整合（dual-write必須）。根拠: `debate-audit/phase3_opus_proposals.md:55`, `debate-audit/AUDIT_SUMMARY.md:33`

10) #10 **PARTIAL**: #8と実質同一領域。別項目化より単一設計に統合すべき。**RISK**: 実装重複。根拠: `debate-audit/phase3_opus_proposals.md:59`, `debate-audit/AUDIT_SUMMARY.md:32`

11) #11 **PARTIAL**: @import活用は有効だが、循環参照検出・lintなしでは運用事故化。**RISK**: 設定分散でデバッグ困難。根拠: `debate-audit/phase3_opus_proposals.md:64`, `debate-audit/AUDIT_SUMMARY.md:44`, `debate-audit/AUDIT_SUMMARY.md:56`

12) #12 **PARTIAL**: 長期保全強化は必要。昇格条件・保持期間・削除ポリシーが不足。**RISK**: 長期ストレージ肥大。根拠: `debate-audit/phase3_opus_proposals.md:70`, `debate-audit/AUDIT_SUMMARY.md:34`

13) #13 **PARTIAL**: Routines追随は必要。ただしトリガー/Webhook詳細は未確定で、export互換層は段階導入が安全。**RISK**: 仕様変更追随コスト高。根拠: `debate-audit/phase3_opus_proposals.md:76`, `debate-audit/phase2a_x_research.md:315`, `debate-audit/phase2a_x_research.md:440`

14) #14 **DISAGREE**: 未リリース機能の先取りはリーク由来で法務/規約リスクが高い。公式化待ちが妥当。**RISK**: 利用規約違反・互換崩壊。根拠: `debate-audit/phase3_opus_proposals.md:82`, `debate-audit/phase2a_x_research.md:193`, `debate-audit/phase2a_x_research.md:374`, `debate-audit/phase2a_x_research.md:413`

15) #15 **PARTIAL**: 価値は高いが既知のキャッシュ系不具合報告があるため、既定ONでなく opt-in+計測が必要。**RISK**: 逆にコスト増。根拠: `debate-audit/phase3_opus_proposals.md:86`, `debate-audit/AUDIT_SUMMARY.md:46`, `debate-audit/phase2a_x_research.md:340`

16) #16 **PARTIAL**: 移行は妥当。ただし自動インストール強制より検出+案内+フォールバックを優先。**RISK**: 既存環境破壊。根拠: `debate-audit/phase3_opus_proposals.md:92`, `debate-audit/AUDIT_SUMMARY.md:58`, `debate-audit/AUDIT_SUMMARY.md:90`

17) #17 **AGREE**: Windows体験の欠落補完として妥当。**RISK**: bash/PS1仕様差異で挙動不一致。根拠: `debate-audit/phase3_opus_proposals.md:99`, `debate-audit/AUDIT_SUMMARY.md:86`

18) #18 **PARTIAL**: 絶対パス問題の解消は賛成。ただし移行ツールと互換モードが必要。**RISK**: 既存状態ファイル破損。根拠: `debate-audit/phase3_opus_proposals.md:104`, `debate-audit/AUDIT_SUMMARY.md:19`

19) #19 **PARTIAL**: Contract強制化は差別化に有効だが、PreToolUseでの機械ブロックは誤検出対策（allowlist/override/audit-only）必須。**RISK**: false positiveでUX悪化。根拠: `debate-audit/phase3_opus_proposals.md:108`, `debate-audit/phase3_opus_proposals.md:110`, `debate-audit/AUDIT_SUMMARY.md:54`, `debate-audit/AUDIT_SUMMARY.md:73`

20) #20 **DISAGREE**: ROI順は検証未了の効果（#6/#7）を高順位に置き、依存関係・実装順序を無視。#8/#10統合で粒度も不整合。**RISK**: 先行投資の失敗。根拠: `debate-audit/phase3_opus_proposals.md:123`, `debate-audit/phase3_opus_proposals.md:124`, `debate-audit/phase3_opus_proposals.md:128`, `debate-audit/phase2c_github_trends.md:227`, `debate-audit/phase2c_github_trends.md:231`

## 追加提案（21+）
21) **実測ベンチ基盤**: #6/#7/#15 の token/latency/cost を同一シナリオで比較しCI化。根拠: `debate-audit/phase3_opus_proposals.md:38`, `debate-audit/phase3_opus_proposals.md:42`, `debate-audit/phase2c_github_trends.md:227`

22) **テスト信頼性再建**: failing integration と pass率表記揺れを解消し、release gateを再定義。根拠: `debate-audit/AUDIT_SUMMARY.md:7`, `debate-audit/AUDIT_SUMMARY.md:93`

23) **メモリ/検索のデータガバナンス**: 保存期間・暗号化・PIIマスク・削除要求フローを文書化。根拠: `debate-audit/phase3_opus_proposals.md:49`, `debate-audit/phase3_opus_proposals.md:71`, `debate-audit/AUDIT_SUMMARY.md:21`

24) **配布CIマトリクス**: native installer + PS1 を Windows/macOS/Linux で自動検証。根拠: `debate-audit/phase3_opus_proposals.md:93`, `debate-audit/phase3_opus_proposals.md:100`, `debate-audit/AUDIT_SUMMARY.md:86`
