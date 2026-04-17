# PHASE3 FINAL CONSENSUS - Opus 4.7 x Codex Pro 統合合意

**作成日**: 2026-04-17
**対象**: TAISUN Agent 改善提案 Phase 3（Opus 20項目 + Codex 追加4項目 = 計24項目）

## 1. 合意ステータス一覧（#1〜#24）

| # | 項目 | ステータス | Codex 修正条件 |
|---|------|----------|--------------|
| 1 | line-bot-mcp dist 欠損処置 | CONDITIONAL AGREE | 削除一択でなく `disabled:true` 維持+README 明記を先行 |
| 2 | metrics-integration テスト修復 | CONDITIONAL AGREE | `--max-old-space-size` は対症療法。worker crash 根因分析を先に |
| 3 | udemy-downloader クリーンアップ | CONDITIONAL AGREE | 削除前に所有者確認 + アーカイブ必須 |
| 4 | browser_profile 313MB 削除 | CONDITIONAL AGREE | 削除前にブラウザ連携デバッグ再現手順を定義 |
| 5 | ECC 対抗スキル拡張 | CONDITIONAL AGREE | 100 は根拠薄い。利用頻度ベース計画に差し替え |
| 6 | claude-mem 統合 | CONDITIONAL AGREE | 「10x 節約」未検証。Praetorian 競合設計を事前解像 |
| 7 | **airis-mcp-gateway 統合** | **DISPUTED** | Opus 推奨 / Codex 反対（Docker 依存で配布性悪化） |
| 8 | Cline semantic search | CONDITIONAL AGREE | API コスト・rate limit・PII 設計を先に策定 |
| 9 | Session ID PID→UUID | **UNANIMOUS AGREE** | 移行期は dual-write 必須 |
| 10 | Praetorian semantic search | CONDITIONAL AGREE | #8 と統合（別項目化せず単一実装） |
| 11 | CLAUDE.md @import nesting | CONDITIONAL AGREE | 循環参照検出 + lint 同梱 |
| 12 | 24h 超 long-term 昇格 | CONDITIONAL AGREE | 昇格条件・保持期間・削除ポリシー明文化 |
| 13 | Anthropic Routines 対応 | CONDITIONAL AGREE | 仕様未確定。export 互換層は段階導入 |
| 14 | **Auto-dream 先取り** | **DISPUTED** | Opus P3 / Codex 完全反対（ToS・法務リスク） |
| 15 | ENABLE_PROMPT_CACHING_1H | CONDITIONAL AGREE | 既定 ON 禁止。opt-in + 計測必須 |
| 16 | native installer 移行 | CONDITIONAL AGREE | 検出+案内+フォールバック（自動強制NG） |
| 17 | D-3 PS1 統合 | **UNANIMOUS AGREE** | bash/PS1 仕様差異テスト必須 |
| 18 | クロスリンク自動化 | CONDITIONAL AGREE | 移行ツール + 互換モード |
| 19 | Workflow Fidelity Contract 強制化 | CONDITIONAL AGREE | allowlist + override + audit-only 必須 |
| 20 | **ROI ランキング** | **DISPUTED** | 未検証効果を高位配置、依存関係無視、粒度不整合 |
| 21 | 実測ベンチ基盤（新規） | AGREE | #6/#7/#15 を同一シナリオで比較 CI 化 |
| 22 | テスト信頼性再建（新規） | AGREE | pass 率表記揺れ解消、release gate 再定義 |
| 23 | データガバナンス（新規） | AGREE | 保存期間・暗号化・PII マスク・削除フロー |
| 24 | 配布 CI マトリクス（新規） | AGREE | native installer + PS1 を Win/mac/Linux 自動検証 |

## 2. ユーザー判断を仰ぐ項目（DISPUTED 3 件）

### #7 airis-mcp-gateway
- **Opus**: 97% トークン削減、P1、Docker 推奨
- **Codex**: Docker 前提は「他人インストール容易性」と矛盾。97% 未検証
- **判断軸**: 配布対象がエンジニアのみか否か
- **妥協案**: まず任意プラグイン化（opt-in）で検証 → 効果実測後に既定化判断

### #14 Auto-dream 先取り実装
- **Opus**: P3 として余力で検討
- **Codex**: 完全反対。ソースリーク由来 → ToS 違反・法務リスク・API 互換崩壊
- **推奨**: Codex に同意。**公式化まで待つ**（P3 でも実装 NG）

### #20 ROI ランキング
- **Opus**: 18 項目の順位表
- **Codex**: 未検証効果（#6 10x, #7 97%）を高位配置、依存関係無視
- **推奨**: ランキング破棄し「#21 実測ベンチで検証 → 再順位付け」に切替

## 3. 即時実行推奨（Codex 修正反映後の順序）

### Wave 1: 即時（3-6h, 破壊リスク最小）
1. **#3** udemy-downloader → 所有者確認 + アーカイブ → 外部移動（-375MB）
2. **#4** browser_profile → 再現手順定義 → 削除（-313MB）
3. **#1** line-bot-mcp → `disabled:true` 維持 + README 明記

### Wave 2: 品質ゲート復旧（1-2d）
4. **#2** metrics test → worker crash 根因分析 → 修復
5. **#22** pass 率表記揺れ解消・release gate 再定義
6. **#9** Session ID UUID 化（dual-write 移行）

### Wave 3: 差別化強化（1w）
7. **#19** Contract 強制化（audit-only 先行）
8. **#15** 1H prompt cache（opt-in + 計測）
9. **#17** PS1 統合 + **#24** CI マトリクス

### Wave 4: 競合追随（ベンチ後に判断）
10. **#21** 実測ベンチ基盤構築
11. ベンチ結果次第で **#6 claude-mem** / **#8+#10 semantic search** 採否決定
12. **#23** データガバナンス文書化（#6/#8 着手前に必須）

## 4. 世界動向での TAISUN 位置づけ（最終評価）

### 国内（日本）: トップクラス
- Workflow Fidelity Contract、Praetorian 3 層記憶、62 hooks、mistakes.md 台帳、245 件圧縮フルテキスト索引は国内競合に見当たらない独自資産

### 世界: 6-8/10
- **強み**: Contract 強制（唯一）、3 層 context backup、hook 統合深度
- **弱み**: セマンティック検索欠落（Cline 勝ち）、自動セッション記憶なし（claude-mem 勝ち）、MCP 集約なし（airis 勝ち）、skill 数 68 vs ECC 183

### 差別化維持戦略
1. **質で勝つ**: skill 数競争から降り、Contract + mistakes.md + hook 統合の「信頼性」軸を深化
2. **ハイブリッド採用**: claude-mem / semantic search を Praetorian と統合し「手動精度 + 自動網羅」の二階建て化
3. **配布性を守る**: airis-mcp-gateway など Docker 依存は opt-in に限定
4. **公式追随**: Routines は export 互換層で段階対応、Auto-dream は待機

## 5. 結論（3 行）

1. **即座に実行**: Wave 1+2（#3/#4/#1/#2/#22/#9）で容量 -688MB・品質ゲート復旧・信頼性向上を 1 週間以内に確保
2. **ユーザー判断要**: #7 airis（Docker 可否）、#14 Auto-dream（ToS リスク許容度）、#20 ROI（ベンチ先行で破棄推奨）
3. **長期計画**: #21 実測ベンチ基盤 → 効果検証 → claude-mem/semantic search/airis の採否を **数値で決定**
