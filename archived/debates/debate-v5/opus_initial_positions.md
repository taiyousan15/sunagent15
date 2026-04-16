# Opus 4.6 Initial Positions — 11 Refactoring / File Organization Proposals

本セッションの Opus 4.6（`claude-opus-4-6[1m]`）が提案する **本物のリファクタリング・ファイル整理** 11 項目。

事前実測済（すべて実在・参照 0 件）:
- 孤立ファイル 5 件
- コード重複 3 件
- ディレクトリ整理 3 件

Real Codex Pro × 2 ラウンド反復 debate で 100% 一致を目指す。

---

## カテゴリ 1: 孤立ファイル削除（5 項目）

### Item 1: `.claude/hooks/mistakes.md.backup.20260329`
**状態**: 16K、参照 0 件
**提案**: `git rm` で削除
**リスク**: ゼロ（バックアップファイル、参照なし）

### Item 2: `debate-v2/agreement_summary.md`
**状態**: 4.0K、debate-v2/ 内に 1 ファイルのみ、参照 0 件
**提案**: `git rm debate-v2/agreement_summary.md && rmdir debate-v2`
**リスク**: ゼロ（孤立ディレクトリ）

### Item 3: `docker-compose.qdrant.yml`
**状態**: 4.0K、参照 0 件
**提案**: `git rm`
**リスク**: 中 — 手動で `docker compose -f` 呼び出している利用者がいる可能性

### Item 4: `.workflow_state_backups/git-state-*.json` × 3
**状態**: 3 件、参照 0 件、既 untracked
**提案**: `rm -rf .workflow_state_backups/` （untracked のため git 操作不要）
**リスク**: 低（ローカルのみ、他人影響なし）

### Item 5: `scripts/verify-skill-warehouse.sh`
**状態**: 4.0K、参照 0 件
**提案**: `git rm scripts/verify-skill-warehouse.sh`
**リスク**: 低 — npm scripts から呼ばれていないか再確認必要

---

## カテゴリ 2: コード重複解消（3 項目、Proposal C 除く）

### Item 6: install.sh / update.sh の ok/warn/info/step 重複
**根拠**: v3 REAL Codex 監査で判明（install.sh:103-107 vs update.sh:15-18）
**提案**: `scripts/lib/ui.sh` 新規作成し、両 script から `source`
**リスク**: 低 — ui 関数のみ、引数インターフェース変更なし

### Item 7: checkpoint-guard.js / agent-checkpoint-guard.js の logSkip/check/main 重複
**根拠**: v3 REAL Codex 監査で判明（checkpoint-guard.js:104,119,183 vs agent-checkpoint-guard.js:48,62,127）
**提案**: 共通 base module `.claude/hooks/utils/guard-base.js` に logSkip/check を抽出
**リスク**: 中 — hook ロジック変更、既存 test 要確認

### Item 8: apify-collector.ts / news-collector.ts の makeId 重複
**根拠**: v3 REAL Codex 監査（apify-collector.ts:16-17 vs news-collector.ts:9-10 の createHash('md5') 重複）
**提案**: `src/intelligence/collectors/utils/collector-id.ts` に抽出
**リスク**: 低 — 純粋関数、副作用なし

---

## カテゴリ 3: ディレクトリ構造整理（3 項目）

### Item 9: debate/ 5 ディレクトリを `archived/debates/` に統合
**状態**: debate/, debate-plan-review/, debate-v2/, debate-v3/, debate-v4/ — 5 つの debate dir が root 直下に散乱（この会話で増殖）
**提案**: `mkdir archived/debates/ && git mv debate{,-plan-review,-v2,-v3,-v4} archived/debates/`
**リスク**: 低 — README で debate/ 参照があれば要更新

### Item 10: docker-compose 5 ファイルを `docker/compose/` に移動
**状態**: docker-compose.{llm,monitoring,ops,qdrant,tools}.yml が root 直下
**提案**: `mkdir -p docker/compose/ && git mv docker-compose.*.yml docker/compose/`
**リスク**: 中 — `docker compose -f docker-compose.X.yml` を直接呼んでいる運用があれば影響

### Item 11: `ログ/` を `logs/sessions/` に英語化統合
**状態**: `ログ/` (日本語) と `logs/` (英語) が共存。`.gitignore:38` に `ログ/` 登録済
**提案**: `ログ/` の中身を `logs/sessions/` に移動し `ログ/` 削除
**リスク**: 低 — 両者とも gitignore 対象、他人影響なし

---

# Real Codex Pro に期待する反論観点

- 各 item の参照が本当にゼロか独立検証
- 削除・移動が実行時にどこかを壊さないか
- npm scripts / Makefile / GitHub Actions / その他設定から参照があるか
- Item 9 の archived/ への移動は GitHub README で historical reference が壊れないか
- Item 10 の docker-compose 移動後、CI/CD パイプラインが壊れないか
- Item 6/7/8 のリファクタリングでテスト保護があるか
