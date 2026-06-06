# Codex ゲート: PR #32 coverage gate 較正＋ラチェット — GO（2ラウンド）

- **日時**: 2026-06-06 23:21 / session 51 / Opus 4.8 (ultracode)
- **対象**: PR #32（`fix/model-auto-switch-test-masking` → `main`、HEAD `0bbb2c0`）に積む追加変更。
- **変更ファイル（2件・config/CI のみ・製品/セキュリティ/テストロジック無変更）**:
  - `jest.config.js`: collectCoverageFrom に型専用ファイル除外を追加 + coverageThreshold を実測準拠のラチェット床に変更。
  - `.github/workflows/ci.yml`: out-of-band の `COVERAGE_THRESHOLD: 80` → `66`（jest lines 床と同期）。
- **方針**: ユーザー選択「① 較正＋ラチェット」。80% は宿題として温存し、実測の17未テストモジュールは除外せず債務として計上。

---

## 背景（なぜ CI が red だったか）

`.claude/hooks/model-auto-switch.js` 末尾の `process.exit` が `jest --coverage` を coverage gate 到達前に終了させ、**80% 閾値は一度も強制されていなかった**（このブランチで `require.main===module` ガードにより修正済み）。de-masking で初めて gate が走り、真のカバレッジ（CI: statements 66.79 / branches 52.18 / functions 66.26 / lines 67.8）が露出して red 化。**テストは全 pass（72 suites / 1340 passed）。退行ではなく、休眠していた gate が初めて効いただけ。**

---

## 実測エビデンス（`npx jest --coverage --ci --runInBand --forceExit` をローカル実行・CIと±0.1%以内で一致）

| 状態 | statements | branches | functions | lines | EXIT |
|---|---|---|---|---|---|
| baseline（現行 committed config） | 66.85 | 52.25 | 66.34 | 67.84 | 1（閾値 fail） |
| 除外のみ追加（閾値据置 80） | 66.85 | 52.25 | 66.34 | 67.84 | 1 |
| 除外 + 新床（最終） | 66.85 | **52.22** | 66.34 | 67.84 | **0（pass）** |

> **重要な発見**: 型専用ファイル除外は**数値に 0% の影響**（baseline == 除外後）。除外ファイルは 0/0 で母数に効いていなかった。よって除外は**ノイズ除去のための hygiene**（"Failed to collect coverage" 警告 25→17 件）であり、カバレッジ%を底上げするものではない。green 化は閾値床の調整による。
> branches が 52.25→52.22 と run 間でドリフト（≤0.08）→ 床に安全マージンを置く根拠。

---

## 除外リストの検証（gaming でないことの担保）

- src 配下の `types.ts` は 15 件。runtime コード（export const/enum/function/class/default）を grep → **5 件が runtime 保有**（`intent-parser` / `unified-hooks` / `proxy-mcp/supervisor` / `proxy-mcp/browser/cdp` / `proxy-mcp/ops/schedule`）→ これらは**意図的に除外しない**。
- 除外した 10 件の `types.ts` + 1 件の `.d.ts`（`src/i18n/index.d.ts`）は **runtime 宣言 0**（型専用）を確認。
- 実コードで未テストの 17 モジュール（`intelligence/*`, `rag/*`, `proxy-mcp/handlers/dispatch`, `proxy-mcp/memory/directive-sync`, `observability/tracing`, `workflow/saga`, `validation/verification-layer`, `lib/utils.ts`, `utils/env-check.ts`）は**除外せず**カバレッジ債務として計上（80% への宿題）。
- ∴ blanket `!src/**/types.ts` は誤り（runtime 5件を隠す）。明示リスト方式を採用。

---

## ラチェット床の値（65 / 51 / 65 / 66）

- CI 実測（最低値）: stmts 66.79 / br 52.18 / fn 66.26 / lines 67.8。観測ドリフト ≤0.08。
- 「最低観測値から ≥1.0pt マージン」ルール → **statements 65 / branches 51 / functions 65 / lines 66**（マージン 1.2〜1.8pt）。
- `ci.yml` の out-of-band gate は `.total.lines.pct` のみ判定 → `COVERAGE_THRESHOLD=66`（jest lines 床と一致、コメントで同期義務を明記）。

---

## Codex ゲート記録

### ラウンド1（実装前ゲート）: NO-GO（決定的指摘）
- **Finding（High）**: `jest.config.js` 単独修正は不完全。`ci.yml` に**別系統の 80% gate**（`env COVERAGE_THRESHOLD: 80` + `coverage-summary.json .total.lines.pct < 80` の shell step, L16/160-168）が存在し、jest 内部閾値を pass しても CI は red のまま。
- **追加指摘**: 床 65/50/65/66 はやや緩い（推奨 66/52/66/67）。
- **Opus 独立検証**: 実ファイルで Finding を**確認 → ACCEPT**。私の blind GO は完全性で誤り（dual-gate が捕捉）。

### 対応
- Finding 1: `ci.yml` の `COVERAGE_THRESHOLD: 80→66` を追加し、全 coverage gate を網羅マッピング（ci.yml:145 jest / ci.yml:160 shell / ci.yml:479 quality-gate=summary / integration.yml:149 test-report jest / integration.yml:173 quality-gate=summary）。2ファイルで全 enforcement point を被覆。
- Finding 2: branches を 50→**51** に微調整（ACCEPT 部分）。ただし 52/66/66/67 は**ドリフト ≤0.08 に対しマージン 0.18〜0.8 で flaky risk**ゆえ REJECT。≥1pt ルールで 65/51/65/66 を採用（根拠提示）。

### ラウンド2（実装後ゲート・fresh review）: GO
- Q1 完全性: 他に enforcement point なし（cd.yml は no-coverage、`package.json test:coverage` は workflow 未参照、codecov/sonar config 無し、pre-commit 無し）。
- Q2 `COVERAGE_THRESHOLD=66` 正当（strict `<`、`66<66`→false）。
- Q3 65/51/65/66 をドリフト根拠で**ACCEPT**。
- Q4 YAML/Actions バグ無し（top-level env は全 step から参照可・公式 docs）。
- Q5 gaming 無し（除外境界は honest）。

### Opus 独立再検証（ラウンド2後・鵜呑み回避）
- `package.json:24 test:coverage` は `jest --coverage`、**どの workflow からも未参照**＝ gate でない。
- codecov/sonar 設定ファイル無し。`.github`/`scripts` の他の `80`/`lines.pct` は私の新コメント・jq 行（=66 参照）・無関係な `agentCount < 80` のみ。
- 最終 green を実コマンドで確認: EXIT=0 / 72 suites / 1340 passed / `bc` sim `67.84<66`→0 / YAML OK / `tsc --noEmit` 0。

---

## 最終判定: **GO**

- Codex（2/2 GO）+ Opus 独立判定 GO で**一致**。ラウンド1で実 NO-GO（out-of-band gate）を経た earned consensus（早すぎる全会一致＝sycophancy ではない）。
- リリース品質: PR #32 の CI を honest かつ enforced な状態で green 化。製品コード無変更。閾値は実測ラチェット床で、80% は明示 roadmap。

---

出典: Jest 公式 docs（collectCoverageFrom / coverageThreshold object・29.7）https://jestjs.io/docs/29.7/configuration / GitHub Actions 公式（top-level env scope）https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#env / 実測ログ `.claude/temp-context/cov-baseline.log` `cov-calibrated.log` `cov-verify2.log`。検証: Codex（codex:codex-rescue, gpt-5.5, round1 agentId a32a6c5cc6cc3a697 / round2 agentId a9f9d3a34a9ad0ad7）+ Opus 実コマンド独立再検証。
