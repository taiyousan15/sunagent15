# 残課題 統合実施計画 — Opus × Codex Pro 合意版

**作成**: Opus 4.6 + Real Codex Pro 査読統合
**対象**: PR #307/#309 マージ後の残課題 8 件
**原則**: 他人の install/update を壊さないことが最優先

---

## Phase 順序（Codex 修正反映: D-2 の前に E を実施）

```
A (即時・ゼロリスク) → B (gitignore矛盾) → C (依存最適化)
→ D-1 (mcp-health-check) → E (TAISUN_HOME設計)
→ D-2/D-3 (スクリプト統合) → F (debate-v5アーカイブ・最後)
```

---

## Phase A: 即時実行（5分、ゼロリスク）

### A-1: hono 脆弱性修正
- **担当**: Opus（実行）
- **作業**: `npm audit fix` → `package-lock.json` 更新 → テスト
- **検証**: `npm audit` → 0 vulnerabilities

---

## Phase B: gitignore-tracked 矛盾解消（10分、低リスク）

### B-1: 10ファイルを untrack
- **担当**: Opus（実行）
- **作業**: `git rm --cached` で以下 10 ファイルを untrack（ローカルファイルは保持）

```
.claude/hooks/data/agent-guard-detail.json
.claude/hooks/data/baseline-metrics.json
.claude/hooks/data/compact-metrics.jsonl
.claude/hooks/data/large-output-detail.json
.claude/hooks/data/lint-gate-detail.json
.claude/hooks/data/task-result-overflow.json
.claude/hooks/data/usage-tracking.json
.claude/skills/research/SKILL.md
docs/logs/2026-02-11_line-ai-agent-research.md
docs/logs/2026-02-11_local-i2v-vs-falai-test.md
```

- **検証**: `git ls-files -ic --exclude-standard` → 0 件

---

## Phase C: 依存最適化（5分、低リスク）

### C-1: @prisma/client を devDependencies に移動（Codex DISAGREE 反映）
- **担当**: Codex Pro（分析） → Opus（実行）
- **根拠**: コード import 0 件だが `prisma/schema.prisma` に `generator client { provider = "prisma-client-js" }` が存在（Codex 発見）
- **修正**: 完全削除ではなく `dependencies → devDependencies` に移動
- **作業**:
  ```bash
  npm uninstall @prisma/client
  npm install --save-dev @prisma/client
  npx tsc --noEmit && npx jest --selectProjects unit regression
  ```
- **検証**: tsc 0 errors + テスト全パス

---

## Phase D-1: mcp-health-check.sh 統合（15分、低リスク）

### D-1: sh → js 完全切替
- **担当**: Codex Pro（査読・安全性検証） → Opus（実行）
- **根拠**: `mcp-health-check.js:7` に「Node.js replacement for mcp-health-check.sh」明記
- **影響箇所**（Codex 調査済み）:
  | 箇所 | 現在の参照 | 対応 |
  |------|-----------|------|
  | Makefile:150 | `@./scripts/mcp-health-check.sh` | → `.js` に変更 |
  | docs/MCP_GUIDE.md:36,200 | `.sh` 言及 | → `.js` に更新 |
  | docs/WINDOWS_SETUP.md:336,399,404 | `.sh` 言及 | → `.js` に更新 |
  | package.json:85 | 既に `.js` 参照 | 変更不要 |
  | .github/workflows/ | 参照なし | 変更不要 |

- **作業**:
  1. Makefile:150 を `.js` に切替
  2. docs 5 箇所を更新
  3. `scripts/mcp-health-check.sh` を削除（互換ラッパーは不要 — js 版が完全代替）
- **検証**: `make mcp-health` 動作確認 + docs リンク grep

---

## Phase E: TAISUN_HOME 設計（60分、高リスク — debate 必須）

### E-1: 設計方針 debate
- **担当**: Opus × Codex debate
- **Codex 推奨方針**: `CLI arg > TAISUN_HOME env > auto-detect` フォールバックチェーン
- **議論ポイント**:
  1. `TAISUN_HOME` 環境変数の定義と設定方法
  2. install.sh / update.sh / setup-project.sh での統一パス解決関数
  3. `.taisunrc` は不採用（Codex: 現在使用ゼロ、新規設定システム不要）
  4. `scripts/lib/path.sh` に共通パス解決関数を抽出するか

### E-2: 実装
- **担当**: Opus（TypeScript/Node.js 部分） + Codex Pro（shell/PS1 部分）
- **対象ファイル**:
  | ファイル | 現在のパス解決 | 変更 |
  |---------|-------------|------|
  | scripts/install.sh:16 | `$(cd "$(dirname "$0")/.." && pwd)` | TAISUN_HOME fallback 追加 |
  | scripts/update.sh:9 | 同上 | 同上 |
  | scripts/setup-project.sh:19-20 | 同上 | 同上 |
  | scripts/install.ps1:37 | `$PSScriptRoot` | 同上 |
  | scripts/setup-project.ps1:26-27 | 同上 | 同上 |
  | scripts/mcp-health-check.js:23 | `__dirname` | 同上 |

---

## Phase D-2: install.sh / setup-project.sh 統合（30分、中リスク）

### 方針: ラッパー + 共有ライブラリ（Codex AGREE）
- **担当**: Opus（実装） + Codex Pro（ゲートキーパー査読）
- **根拠**: Codex 分析で実質重複は 37 行のみ、スクリプトの目的が異なる
  - install.sh: 環境チェック + ビルド + プロファイル設定 + スキル/エージェント登録
  - setup-project.sh: ターゲットプロジェクト引数 + .git init + symlink 作成
- **実装**:
  1. `scripts/lib/register.sh` 新規作成（スキル/エージェント登録の共通ロジック抽出）
  2. install.sh: 登録部分を `source "$REPO_DIR/scripts/lib/register.sh"` に置換
  3. setup-project.sh: 同上
  4. 両スクリプトのパスと CLI 引数はそのまま保持（互換性維持）
- **検証**:
  ```bash
  bash -n scripts/install.sh && bash -n scripts/setup-project.sh
  bash scripts/install.sh --help  # 動作確認
  ```

### D-3: install.ps1 / setup-project.ps1 統合
- **担当**: Codex Pro（主担当） → Opus（査読）
- **方針**: D-2 と同じラッパーパターンを PowerShell に適用
- **対象**: install.ps1 (615行) / setup-project.ps1 (255行)

---

## Phase F: 最終整理

### F-1: debate-v5/ アーカイブ
- **担当**: Opus
- **タイミング**: 全 Phase 完了後（Codex 指摘: 計画ファイルを早期移動しない）
- **作業**: `git mv debate-v5 archived/debates/debate-v5`

### F-2: PR #307 / #309 マージ
- **担当**: ユーザー判断
- **前提**: 全テスト GREEN 確認後

---

## 役割分担まとめ

| Phase | Opus 4.6 | Codex Pro |
|-------|----------|-----------|
| A (hono脆弱性) | ✅ 実行 | — |
| B (gitignore矛盾) | ✅ 実行 | — |
| C (@prisma/client) | ✅ 実行 | ✅ 分析・安全性判定 |
| D-1 (mcp-health-check) | ✅ 実行 | ✅ 影響箇所の網羅的検索 |
| E (TAISUN_HOME設計) | ✅ TS実装 | ✅ shell/PS1 実装 + debate |
| D-2 (install/setup統合) | ✅ bash実装 | ✅ ゲートキーパー査読 |
| D-3 (PS1統合) | 査読 | ✅ PS1 主担当 |
| F (最終整理) | ✅ 実行 | — |

## Codex DISAGREE/PARTIAL への Opus 対応

| # | Codex 判定 | 指摘内容 | Opus 対応 |
|---|-----------|---------|----------|
| 1 | PARTIAL | D-2 の前に E（パス設計）を先行すべき | ✅ 採用: 順序を A→B→C→D-1→E→D-2/D-3 に変更 |
| 2 | DISAGREE | prisma/schema.prisma が存在、完全削除は危険 | ✅ 採用: devDependencies 移動に変更 |
| 3 | PARTIAL | docs 5 箇所に .sh 参照が残っている | ✅ 採用: docs 更新を D-1 に含める |
| 5 | PARTIAL | .taisunrc は不要、env + auto-detect が最適 | ✅ 採用: CLI arg > env > auto-detect 方針 |
| 6 | PARTIAL | D-2 は Codex co-ownership が必要 | ✅ 採用: Codex をゲートキーパーに指定 |
