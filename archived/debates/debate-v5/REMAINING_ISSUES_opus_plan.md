# 残課題 実施計画 — Opus 4.6 ドラフト

## 全8課題の優先順位とフェーズ分け

### Phase A: 即時実行（5分、リスクゼロ）

| # | 課題 | 担当 | 作業 |
|---|------|------|------|
| A-1 | hono 脆弱性 | Opus | `npm audit fix` → lock更新 → テスト |
| A-2 | debate-v5/ アーカイブ | Opus | `git mv debate-v5 archived/debates/debate-v5` |

### Phase B: gitignore-tracked 矛盾解消（10分、低リスク）

| # | 課題 | 担当 | 作業 |
|---|------|------|------|
| B-1 | .claude/hooks/data/ 7ファイル | Opus | `git rm --cached` でuntrack → .gitignore で保護済 |
| B-2 | .claude/skills/research/SKILL.md | Opus | 同上 |
| B-3 | docs/logs/ 2ファイル | Opus | 同上 |

検証: `git ls-files -ic --exclude-standard` → 0件

### Phase C: 未使用依存削除（5分、低リスク）

| # | 課題 | 担当 | 作業 |
|---|------|------|------|
| C-1 | @prisma/client 削除 | Codex Pro | `npm uninstall @prisma/client` → tsc/jest 確認 |

**根拠**: `rg --glob '*.{ts,tsx,js,jsx}' "@prisma/client"` = 0件。package.json のみ。
**Codex担当理由**: 依存削除は影響範囲が広く、Codex の静的解析が得意な領域。

### Phase D: 重複コード統合（30分、中リスク）

| # | 課題 | 担当 | 作業 |
|---|------|------|------|
| D-1 | mcp-health-check.sh 削除 | Codex Pro | sh削除 → Makefile:150 を js に切替 → 動作検証 |
| D-2 | install.sh/setup-project.sh 統合 | Opus + Codex | 差分分析→統合案策定→実装→テスト |
| D-3 | install.ps1/setup-project.ps1 統合 | Codex Pro | PowerShell 統合（Opus は PS1 に不慣れ） |

**D-1 根拠**: `scripts/mcp-health-check.js:7` に「Node.js replacement for mcp-health-check.sh」と明記。Makefile:150 が sh を参照中。
**D-2 方針**: setup-project.sh (246行) の機能を install.sh (539行) に統合し、setup-project.sh はラッパーに変換。

### Phase E: TAISUN_HOME 設計（60分、高リスク）

| # | 課題 | 担当 | 作業 |
|---|------|------|------|
| E-1 | TAISUN_HOME 設計議論 | Opus × Codex debate | Issue #308 の設計方針を debate で決定 |
| E-2 | 実装 | Opus (TS) + Codex (shell/PS1) | 設計合意後に分担実装 |

**Issue #308 の核心**: 現在 install.sh が絶対パスをハードコードしている箇所があり、他人の環境で動作しない。TAISUN_HOME 環境変数で解決する設計。

---

## 役割分担の原則

| 領域 | Opus 4.6 | Codex Pro |
|------|----------|-----------|
| TypeScript/Node.js | ✅ 主担当 | 査読 |
| Shell script (bash) | 実装 | ✅ 査読・安全性検証 |
| PowerShell | 支援 | ✅ 主担当 |
| 依存関係解析 | 支援 | ✅ 主担当 |
| アーキテクチャ設計 | ✅ 提案 | 反論・改善 |
| テスト検証 | ✅ 実行 | 結果査読 |
| git操作・PR | ✅ 実行 | - |

## Codex Pro に査読してほしい点

1. Phase 順序の妥当性（A→B→C→D→Eで良いか）
2. @prisma/client 削除の安全性（prisma.schema や migration が存在しないか）
3. mcp-health-check.sh → js 切替で Makefile 以外に影響がないか
4. install.sh/setup-project.sh 統合方針（ラッパー化 vs 完全マージ）
5. TAISUN_HOME の設計方針（環境変数 vs .taisunrc vs 自動検出）
6. 各 Phase の担当割り当ての妥当性
7. Phase D-2 の統合で他人の install/update が壊れないか
