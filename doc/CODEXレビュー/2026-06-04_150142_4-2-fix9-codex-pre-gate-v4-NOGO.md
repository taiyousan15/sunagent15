# Codex 実装前 ゲート（round 4）: FIX-9 計画v4 — NO-GO

- **日時**: 2026-06-04 15:01 / session 49 / Opus 4.8 (ultracode)
- **対象**: `doc/security/2026-06-04_144433_owasp-4-2-fix9-implementation-plan-v4.md`（FIX-9 C-MODE-1 opt-in）
- **Codex 判定**: **NO-GO**（round2/3 の caller-errexit・cd・root build fail-closed は解消を確認。新たに release-blocking 3件）
- **Opus 最終判定**: **3 MUST-fix すべて ACCEPT（実ファイルで独立検証）**。加えて Opus 自身が **MUST-2(round3)非git到達の gate 配置リグレッション**を検出。

## Codex per-check
| # | 項目 | 判定 |
|---|---|---|
|1| errexit-in-if | PARTIAL（cleanup `rm -rf "$TMP"` 無guard・blocker でない）|
|2| build-then-prune | **FAIL**（npm 文法は正だが repo が実行時に ts-node/tsx 必須）|
|3| gate-before-wrapper | PASS |
|4| return 90 skip | PARTIAL（90 捕捉OK・但し stash 未復元＋MCP loop が走る）|
|5| self-overwrite | PASS |
|6| cwd fix | PASS |
|7| fork detection | **FAIL**（空 origin バイパス）|
|8| exit vs return | PASS |
|9| tag 解決 | PARTIAL（404 は fail-closed・prerelease は素通り）|
|10| stash 二重機構 | **FAIL**（verified stash が全 exit/90 で確実に pop されない）|
|11| default-off 回帰 | PASS（無 regression・unconditional cd は既存 ZIP fallback の cwd leak をむしろ修正）|

## MUST-fix（Opus 全 ACCEPT・実測根拠）
1. **verified stash の取り残し**（MUST-1）: stash は git-tree保護で**早期**に作るが、その後の tag/download/sha/extract 失敗や **return 90** の経路で pop されない → ユーザーの未コミット変更が stash に消える。legacy 側 pop は legacy の `STASHED` のみ対象。
   - **修正**: stash を **apply 直前**（sha検証+展開 成功後）に移す。これで早期失敗・90 経路では stash 自体が存在しない。
   - 検証: v4 関数の stash 位置（git保護ブロック）と各 return パスを確認＝取り残し成立。**ACCEPT**。
2. **`npm prune --omit=dev` がブリック**（MUST-2・最重要）: `ts-node`/`tsx`/`typescript` は **全て devDep**。だが多数のユーザー向けコマンドが**実行時に** `npx ts-node`/`npx tsx` で .ts を直接実行（`proxy:start`/`doctor`/`memory:report`/`perf:*`/`workflow:*`/`briefing`/`text:utf8-guard` 他）＋ `.claude/mcp-servers/ide-integration.js:209` が `npx tsx`。prune --omit=dev は**これら全てを破壊**。
   - **修正**: **build-then-prune を廃止**。verified root = `npm ci`（full・fail-closed: `||npm install`無・lockfile必須）→ postinstall(build:all)で自動ビルド、または `npm ci --ignore-scripts` + 明示 `npm run build:all`（診断性）。**prune しない**。
   - **重要**: 「devDeps を出荷しない（--omit=dev）」は**このrepoでは原理的に不可**（TS実行時設計）。OWASP の実脆弱性は nested vitest で①②③（PR#30）が解消済。root の --omit=dev は元々過剰要求だった。FIX-9 の価値は **sha256検証付き更新（完全性）のみ**に絞る。
   - 検証: `node -e` で ts-node/tsx/typescript=devDep・runtime script 多数・ide-integration.js:209 を実確認。**ACCEPT**。
3. **空 origin が fork ガードを素通り**（MUST-3）: `"" ) : ;;` が origin 無しを信頼。.git があるのに origin を消した fork がバイパス可能。
   - **修正**: `.git` がある場合は**公式 origin を必須**（空は `return 1`→legacy）。`if [ -d .git ]` ブロックに入らない非git(ZIP)install は別途（下記 Opus 追加）。
   - 検証: case の空文字許容を確認。**ACCEPT**。

## Opus 追加検出（round3 MUST-2 の gate 配置リグレッション）
- round3 で ACCEPT 済の **MUST-2「verified は .git 無しでも到達可能」**（ZIP install の唯一の安全更新路）を、v4 は **gate を L48（.git ゲート L41-45 の後）**に置いたため**満たさない**（非git は L45 で exit）。
- **修正**: verified gate を **.git ゲート(L41)より前**に置き、**`.git`ゲート+legacy(L41-125) を丸ごと wrapper で包む**。非git+verified は安全（公式URL固定+sha256・git tree 無し）。fork/origin チェックは `[ -d .git ]` 時のみ。

## SHOULD-fix（Opus 採用）
1. return 90（同版）時、MCP loop(L154-166)も skip（現状走る）。
2. tag を stable-only に（`-rc`等 prerelease を除外）。
3. cleanup `rm -rf "$TMP"` は冪等なので無害だが design note に明記（Pattern 10）。

## 重要な含意（ユーザー判断事項）
- **FIX-9 C-MODE-1 は release が無い限り「不活性」**: release 0件→verified は毎回 return 1→legacy（既定OFF）。実 release 公開（別CI）まで何も起きない足場。
- **完全性のみ・真正性なし**: 署名(GPG/sigstore)は C-MODE-2 前に必須。
- → 「足場を今入れる」vs「release+署名+flip が揃うまで FIX-9 ごと保留」はユーザーが選ぶべき。

## ループ状況
FIX-9 pre-gate round 4。毎回**異なる実バグ**（同一意見の反復でない＝divergence/consensus-trap でない）。超重い枠15Rに対し round4。修正は全て確定済（特に MUST-2 は prune 廃止で**簡素化**）。codex.md「勝手にループしない」によりユーザーにエスカレーション。

出典: Bash Reference Manual（errexit/pipeline/関数）/ npm ci・prune・--ignore-scripts docs / GitHub releases redirect / OWASP Software Supply Chain Cheat Sheet（Codex 引用・Opus 実コマンド検証）。
