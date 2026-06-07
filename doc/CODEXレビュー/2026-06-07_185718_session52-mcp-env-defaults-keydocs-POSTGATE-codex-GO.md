# Codex 実装後ゲート: MCP env-defaults + APIキー導線 docs + CI guard — GO

- **日時**: 2026-06-07 / session 52 / Opus 4.8 (ultracode)
- **対象 repo/branch**: `taiyousan15/sunagent15` / `fix/mcp-env-defaults-keydocs`（base origin/main `55cf100`・PUBLIC）
- **対象**: 実装差分（working tree）— `.mcp.json.example`, `mcp-presets/{full-optimized,image,research}.mcp.json`, `scripts/install.sh`, `docs/API_KEY_TROUBLESHOOTING.md`, 新規 `tests/unit/mcp-config-env-defaults.test.ts`
- **計画書(SSoT)**: `doc/2026-06-07_114517_session52-mcp-env-defaults-keydocs-PLAN.md`
- **実装前ゲート記録**: `doc/CODEXレビュー/2026-06-07_114517_…-PREGATE-codex-NOGO.md`（round1 NO-GO → 修正 → round2 GO）

## 経緯
- **Round 1（post-impl）= NO-GO**（Med 3）: codex:codex-rescue agentId a05c7670090ef6b3d。
  - F1: CI guard が env+args のみ走査（command/url/headers の bare var を見逃す false-negative リスク）。
  - F2: `docs/API_KEY_TROUBLESHOOTING.md` の `claude logout`/`claude login` が stale（現行 `claude auth login/logout`）。
  - F3: 同 doc が ANTHROPIC_API_KEY を「推奨」とし install.sh の /login 優先と矛盾＋サブスク上書き/API課金化。
- **Opus 独立判定**: 3件とも実ファイル/実機(v2.1.167 `claude auth` 確認)/公式 docs で ACCEPT。3件修正。
  - F1: `collectExpandableStrings` を command/args/env/url/headers 走査に拡張（自由文は除外）。
  - F2: `claude auth logout`/`claude auth login` に置換（2箇所）。
  - F3: 「（推奨）」を是正し subscription `claude auth login`/`/login` を主・ANTHROPIC_API_KEY は override/API課金の注意付き従に。
- **Round 2（post-impl, retry）= GO**: codex:codex-rescue agentId aefbdc075b82740a6（94s）。
  - 注: 最初の round2 投入（agentId abab4b8eea8de0772）は全検証コマンド完走後、最終判定文の生成手前で **約6時間ハング**（daemon stall）。新規スレッドで再投入し 94s で GO 取得。
  - 確認: guard は env展開対象フィールドを per-placeholder 正規表現＋自己テストで検証 / `claude auth` 形へ統一・stale 残存なし / subscription-first + 課金注意で install.sh と整合。ブロッカーなし。
- **Opus 独立最終判定**: GO 同意（3デルタを grep/実読で再確認・ローカル全 green）。round1 NO-GO→修正→round2 GO の正当収束（新証拠に基づく・Sycophancy ではない）。

## ローカル検証（実測・Pattern 7/10）
- `npx jest --selectProjects unit`：**40 suites / 931 passed**（exit 0）。
- 新ガード `mcp-config-env-defaults`：**18/18 passed**（検出器自己テスト含む）。
- 全 `*.mcp.json`：bare `${VAR}`（`:-` 無し）**ゼロ**・全 valid JSON。
- `npx tsc --noEmit`：エラーなし / `npx eslint tests/unit/…`：clean / `bash -n scripts/install.sh`：OK。
- 削除3件（settings.json.backup / google-auth-system / mcp-servers/line-bot-mcp-server）：**未関与**（commit に混ぜない）。

## 残課題（ブロッカーではない）
- 空キー時の各 enabled MCP（figma/meta-ads/obsidian/twitter-client/stagehand）の起動挙動は、オフライン＆npx/uvx パッケージ未同梱のため実機 smoke 未実施。parse は全件安全（全体無効化は bare 未設定のみ＝解消済み）。インストール後に `/mcp` で確認推奨。

## 次
- 明示パス commit（削除3件・無関係 untracked を除外）→ push → PR 作成は **ユーザー承認後**（PUBLIC・outward-facing）。マージはユーザー判断。

出典: code.claude.com/docs/en/mcp ・/env-vars ・/authentication / 実機 `claude auth --help`(v2.1.167) / 実ファイル・実コマンド。
