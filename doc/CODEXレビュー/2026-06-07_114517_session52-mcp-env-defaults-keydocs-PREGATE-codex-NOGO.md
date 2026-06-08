# Codex 実装前ゲート: MCP bare ${VAR} parse-safe 化 + APIキー導線 docs + CI guard — NO-GO

- **日時**: 2026-06-07 11:45 / session 52 / Opus 4.8 (ultracode)
- **対象計画書**: `doc/2026-06-07_114517_session52-mcp-env-defaults-keydocs-PLAN.md`
- **対象 repo**: `taiyousan15/sunagent15`（PUBLIC・配布正本、base origin/main `55cf100`）
- **Codex**: `codex:codex-rescue`（agentId a672dbfcc2bd46cd6, 3 tool_uses, 337s）。実ファイル＋公式docs ベース。
- **Codex 判定**: **NO-GO**（Med 1 + Low 1）
- **Opus 独立判定**: **NO-GO**（両 finding を実ファイル照合で ACCEPT）
- **収束**: 両者 NO-GO・問題認識/修正方向ともに AGREE（plan 修正で解消）

---

## 1. Codex 所見（要点）

### Finding 1 — Med（決定的）
- 箇所: `docs/API_KEY_TROUBLESHOOTING.md:92`（＋計画書が「既に正しい」と誤前提）
- 内容: L92「`.mcp.json` の `${VAR}` 展開が MCP サブプロセスで機能しない」は**公式と不一致**。Claude Code は `${VAR}` をシェル/settings.json env から展開する。失敗するのは「未設定の bare var（既定値なし）」のみ。
- 修正案: L92 を「Claude Code は `${VAR}` を shell/settings env から展開する。プロジェクト `.env` は自動読込しない。未設定 bare var には `:-` 既定が必要」へ訂正。出典: code.claude.com/docs/en/mcp。

### Finding 2 — Low
- 箇所: 計画書 Part 3（CI guard 設計）
- 内容: 文字列レベルの `includes(':-')` 判定だと `"${A}${B:-}"` の `${A}` を見逃す。
- 修正案: `/\$\{([^}]+)\}/g` で placeholder 単位に走査し、内側 token に `:-` が無いものを個別 fail。

### Codex 確認（PASS/参考）
- **A**: 計画の見落とし bare var **なし**。実在行: `.mcp.json.example` L39,40,54-60,107,108,120,171,185,225-227,254,273,297,314,315,329 / `full-optimized` L61,62,73,124,137 / `image` L22 / `research` L26,27,40,53。`.claude/settings.json`・development/marketing/video には無し。
- **B**: disabled flip 4件正確（gpt-researcher 110/113, apify 173/176, tavily 187/190, firecrawl 299/302）。voice-ai(62)/skyvern(331) は既に disabled。meta-ads は cost_warning:false ゆえ enabled 維持は現分類下で妥当（「token無しなら課金不可」は HYPOTHESIS）。
- **C**: `${VAR:-}` は parse-safe（公式）。空キーでの enabled サーバー起動時挙動は repo から未証明（npm/uvx パッケージ未同梱）＝ HYPOTHESIS（最悪その1サーバーのみ起動失敗・全体は無効化されない）。実装後 `/mcp` smoke 推奨。
- **D**: CI 配置妥当（jest.config.js:59-62, ci.yml:149-150 で実行）。F2 の精度修正のみ要。
- **E**: docs は「.env は Claude Code MCP/auth が自動読込しない」と narrow に書けば正しい。「.env は未使用」は誤り（`src/intelligence/index.ts:10-12`, `scripts/mcp-health-check.{js:39-40,sh:30-32}` が読む）。
- **F**: 既存ユーザー無退行（既存 `.mcp.json` は installer の `if [ ! -f ]` で保護）。旧 bare var + export 無しのユーザーは自動修復されない（要 .mcp.json 更新 or テンプレ再コピー）。

---

## 2. Opus 独立再検証（実ファイル・Pattern 7/10）

- **F1 → ACCEPT**: `docs/API_KEY_TROUBLESHOOTING.md:82-118` を実読。L92 は解決策A(settings.json)/B(shell export)（L94-118）と自己矛盾（展開が機能しないなら settings.json/export も効かないはず）。かつ本PR Part1 は「export すれば `${VAR}` が展開される」前提のため、L92 放置は計画と矛盾。訂正は「矛盾解消」スコープ内。
- **F2 → ACCEPT**: placeholder 単位判定が正。CI guard 仕様を `/\$\{([^}]+)\}/g` ベースへ修正。
- **確認A → 採用**: Codex 列挙行を実ファイルと突合し一致（独立2者カウント＝Pattern 7 充足）。
- **確認C → 残課題化**: 空値は parse を壊さない（全体無効化は bare 未設定のみ）。オフラインで MCP smoke 不可のため、実装後 `/mcp` 確認を残課題として記録。ブロッカーにはしない。

**最終判定: NO-GO に同意。** plan を 2 点改訂で GO 相当に到達可能（コード未着手）。

---

## 3. plan 改訂（本ゲート結果の反映・実施済み）
1. Part 2b: `API_KEY_TROUBLESHOOTING.md:92` を**能動的に訂正**する手順へ変更（「確認のみ」→「訂正必須」）。
2. Part 3: CI guard を placeholder 単位の正規表現判定へ修正。

## 4. 次アクション（ユーザー判断・勝手にループ/実装しない）
- 改訂 plan で実装に進むか、改訂 plan を Codex で再ゲートしてから実装するかをユーザーに確認。
- いずれの場合も実装後に Codex 実装後ゲート（実コード）＋ Opus 再検証 → 明示パス commit → push → PR 作成（**マージはユーザー判断**）。

出典: code.claude.com/docs/en/mcp ・/env-vars ・/authentication / 実ファイル（.mcp.json.example, mcp-presets/*, scripts/install.sh, jest.config.js, docs/API_KEY_TROUBLESHOOTING.md, src/intelligence/index.ts, scripts/mcp-health-check.*）。

---

## 5. Round 2 再ゲート（改訂 plan）= GO

- **日時**: 2026-06-07 / session 52 / Codex `codex:codex-rescue`（agentId a0fe19f08ece68c7a, 145s）
- **Codex 判定**: **GO**（round1 の F1/F2 が改訂 plan で解消済みと確認・新規ブロッカーなし）
  - Part 2b（PASS）: `API_KEY_TROUBLESHOOTING.md:92` 訂正文言（plan L74-78）が公式 docs と一致・解決策A/B(L94-118)と整合・round1 の誤記述を除去。
  - Part 3（PASS）: per-placeholder 正規表現（plan L88-93）が `${VAR}` と `${VAR:-default}` を正しく区別・複数placeholder対応・placeholder無し値も不変。
- **Opus 独立判定**: **GO 同意**。改訂2点を実ファイル/plan で再確認。新証拠（実改訂）に基づく立場変更＝Sycophancy ではない（round1 NO-GO → 修正 → round2 GO の正当収束）。
- **次**: ユーザー指示「再ゲートしてから実装」に従い実装へ。実装後に Codex 実装後ゲート（実コード）＋ Opus 再検証 → 明示パス commit → push/PR はユーザー確認後（PUBLIC・outward-facing）。
