# TAISUN Agent 改善提案 20 項目（Phase 3 Opus Proposals）

**作成日**: 2026-04-17
**根拠**: AUDIT_SUMMARY / phase1b_purity / phase2a_x_research / phase2c_github_trends

---

## Topic A: Critical Fixes

### 1. line-bot-mcp-server dist 欠損処置
- **問題**: `dist/index.js` 欠損、`.mcp.json:36` が参照（`disabled:true`で即座の破綻なし）
- **提案**: `.mcp.json` からエントリ削除 or 空ディレクトリ自体を削除し、README で非対応を明記
- **優先度**: P1 / 工数: 0.5h

### 2. metrics-integration テスト失敗修復
- **問題**: `tests/integration/metrics-integration.test.ts` で jest worker crash → 45 テスト失敗
- **提案**: worker メモリ上限増加（`--max-old-space-size=4096`）+ テスト分割、`--runInBand` で単独実行
- **優先度**: P0 / 工数: 2-4h

### 3. udemy-downloader/ クリーンアップ（693MB 内の主力）
- **問題**: ネスト Git 含む外部リポ（262MB m3u8 + 100MB .venv + 13MB logs）
- **提案**: リポジトリ外移動（`~/Desktop/udemy-downloader/` へ）+ `.gitignore` 追記
- **優先度**: P0 / 工数: 0.5h

### 4. browser_profile 313MB キャッシュ削除
- **問題**: `.claude/skills/nanobanana-pro/data/browser_profile/Default/` 2,375ファイル・313MB
- **提案**: Local Storage/leveldb/*.log と LOG.old 削除、.gitignore 追加
- **優先度**: P1 / 工数: 0.5h

## Topic B: Feature Gap vs State-of-Art

### 5. ECC (183 skills) に対抗するスキル拡張
- **問題**: TAISUN 68 vs ECC 183（2.7倍差）
- **提案**: スキル数追随は非推奨。**高品質な厳選路線**を差別化軸、目標 100 skills
- **優先度**: P2 / 工数: 20-40h

### 6. claude-mem (automatic session memory) 統合
- **問題**: Praetorian は手動、claude-mem は自動+Vector DB で 10x トークン節約
- **提案**: claude-mem の 5 フックパターンを TAISUN hooks に移植、Praetorian とハイブリッド化
- **優先度**: P1 / 工数: 8-12h

### 7. airis-mcp-gateway (97% token reduction) 統合
- **問題**: MCP サーバー増加でコンテキストトークン膨張
- **提案**: 60+ ツールを 7 メタツールに集約する gateway を Docker 導入
- **優先度**: P1 / 工数: 4-8h

### 8. Cline MCP Memory の semantic search 導入
- **問題**: TAISUN は全文検索のみ、semantic search なし
- **提案**: `src/proxy-mcp/router/semantic.ts:22` のコメントアウト復活、embedding 類似検索
- **優先度**: P1 / 工数: 12-16h

## Topic C: Context/Memory 強化

### 9. Session ID 衝突対策（PID→UUID）
- **問題**: PID 再利用で衝突リスク
- **提案**: `crypto.randomUUID()` へ変更、移行期間 dual-write
- **優先度**: P1 / 工数: 3-4h

### 10. Praetorian semantic search 追加（#8と統合）
- **問題**: 全文マッチのみ、言い換えで検索漏れ
- **提案**: 保存時 embedding 生成、cosine similarity Top-K
- **優先度**: P1 / 工数: #8 に含む

### 11. CLAUDE.md @import nesting 採用
- **問題**: MEMORY.md 200 行制限、CLAUDE.md 肥大化
- **提案**: 5-level @import、既存 L2/L3 パターン拡張
- **優先度**: P2 / 工数: 4-6h

### 12. 24時間超の長期 context 保全
- **問題**: temp-context 自動削除、Praetorian 検索品質依存
- **提案**: 24h 超過は Praetorian `long_term` tier へ昇格、週 digest 生成
- **優先度**: P2 / 工数: 6-8h

## Topic D: New Features

### 13. Anthropic Routines（2026-04-14 リリース）対応
- **問題**: 公式スケジュール実行機能登場、TAISUN 未対応
- **提案**: TAISUN skills を Routines 形式へ export する `/routines-export` スキル追加
- **優先度**: P2 / 工数: 8-12h

### 14. Auto-dream 機能先取り実装
- **問題**: ソースリークで発覚した未リリース機能
- **提案**: バックグラウンド subagent が過去 5 セッション精査し MEMORY.md 圧縮
- **優先度**: P3 / 工数: 10-14h

### 15. ENABLE_PROMPT_CACHING_1H 活用（v2.1.108+）
- **問題**: 長時間セッションコスト最適化未実装
- **提案**: .env.example に追加、起動で自動検出・設定
- **優先度**: P1 / 工数: 1-2h

### 16. npm deprecated → native installer 移行
- **問題**: npm 版 deprecated、native installer 推奨
- **提案**: install.sh で native 検出 + 自動インストール、deprecation warning
- **優先度**: P1 / 工数: 3-5h

## Topic E: Distribution Quality

### 17. D-3 PS1 統合
- **問題**: Windows 版 PS1 重複、bash register.sh 統合完了だが PS1 未対応
- **提案**: `lib/register.ps1` 新規、dot-source パターン
- **優先度**: P1 / 工数: 4-6h

### 18. マルチプロジェクトクロスリンク自動化
- **問題**: `.agent_usage_state.json` に絶対パス、手動管理
- **提案**: TAISUN_HOME 経由で自動解決、相対パス化
- **優先度**: P2 / 工数: 6-8h

### 19. Workflow Fidelity Contract 強制化
- **問題**: 独自機能だが文書化のみ、技術的強制力弱
- **提案**: PreToolUse で Contract 違反を機械検出、mistakes.md 自動追記
- **優先度**: P1 / 工数: 5-7h

### 20. 全体優先順位 ROI ランキング

| Rank | 項目 | 優先度 | 理由 |
|-----:|-----|-------:|-----|
| 1 | #3 udemy-downloader 削除 | P0 | 30分で 375MB 削減 |
| 2 | #2 metrics test 修復 | P0 | 品質ゲート復旧 |
| 3 | #15 1H prompt cache | P1 | 2h でコスト大幅減 |
| 4 | #4 browser_profile 削除 | P1 | 30分で 313MB 削減 |
| 5 | #16 native installer | P1 | 将来破綻回避 |
| 6 | #19 Contract 強制化 | P1 | 差別化中核 |
| 7 | #6 claude-mem 統合 | P1 | 競合追随 |
| 8 | #7 airis-mcp-gateway | P1 | 97%削減効果 |
| 9 | #1 line-bot-mcp 処置 | P1 | 技術負債解消 |
| 10 | #9 UUID session | P1 | 信頼性向上 |
| 11 | #17 PS1 統合 | P1 | Windows UX |
| 12 | #8+#10 semantic search | P1 | 競合差埋め |
| 13 | #11 @import nesting | P2 | 拡張性 |
| 14 | #12 長期 context | P2 | 信頼性 |
| 15 | #13 Routines 対応 | P2 | 公式追随 |
| 16 | #18 cross-link 自動化 | P2 | 配布品質 |
| 17 | #5 skills 拡張 | P2 | 質重視で段階的 |
| 18 | #14 Auto-dream 先取り | P3 | 公式待ちが安全 |

**総計工数**: 約 95-150h（段階実装）
**推奨即時着手**: #3, #2, #15, #4（合計 3-6h で劇的改善）
