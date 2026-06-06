# OWASP 4-2 残修正 実装計画 v2（Codex 再ゲート対象）

- **作成**: 2026-06-03 04:13 / session 48 / Opus 4.8 (ultracode)
- **対象**: sunagent15 / branch `fix/owasp-high-medium`（HEAD 28687d8 / base main fd8cb15）
- **位置づけ**: 2026-06-03 Codex 実装前ゲート **NO-GO**（`doc/CODEXレビュー/2026-06-03_032445_4-2-codex-pre-gate-NOGO.md`）の MUST-fix 1〜4 + 精緻化 5〜6 を反映。replan-v2 workflow（28 agents・設計→多レンズadversarial検証→統合）の成果を Opus が実測再検証して確定。
- **運用方針**: 最小差分・既存挙動非破壊（Pattern 8）・fail-closed。**commit-only（push しない）**・明示パスのみ commit（`git add -A/-u` 禁止）・未コミット削除3件（settings.json.backup / google-auth-system / mcp-servers/line-bot-mcp-server）は混ぜない。
- **依存版確定**: Codex はオフラインで `npm view/install/audit` 不可（feedback_codex_offline_override_noop）→ 依存版は Opus 側で確定し実 `npm audit`/`npm ci` で検証。

## Opus 実測検証済みの前提（read-only）
- GitHub release **0件**（`gh api .../releases/latest` = **404**、`gh release list` 空）→ 検証付きを無条件既定化すると既存全ユーザーの `npm run update` が即 exit 1（100% outage）。
- nested 既存 overrides = `{hono:4.12.23, ip-address:10.2.0, qs:6.15.2, fast-uri:3.1.2}`（両サーバ実在・session46で塞いだ穴の蓋＝保持必須）。
- vitest は両サーバ devDependencies に実在（`"vitest":"^3.0.0"`）＋ `test:"vitest run"`。install.sh/update.sh は `npm ci` を `--omit=dev` 無しで実行＝devDeps がユーザー機に入る。
- voice-ai lock: path-to-regexp `~0.1.12`(express@4) と `^8.0.0`(express@5/sdk) が併存。ai-sdr は 8系のみ・express-rate-limit は直接依存なし(sdk経由)。voice-ai は express-rate-limit `^8.3.1` 直接依存あり。

---

## 0. MUST-fix 対応サマリ

| MUST-fix | NO-GO指摘 | v2対応 |
|---|---|---|
| **1** vitest据置き不可 | devDeps が `--omit=dev` 無しでユーザー機に入る | 両nested devDepsから vitest 削除＋test を no-op echo 化＋lockfile再生成（test 0個＝非破壊・critical一掃） |
| **2** 検証経路が非git導入で到達不能 | `.git`無しだと update.sh が更新前 exit1 | `verified_update()` を `.git`ゲート(旧:41)より前に挿入。検証パスは `.git` 不要 |
| **3** 既定がmutable-HEAD | 無検証 main/ZIP が既定 | 検証付き(release tag+.sha256)既定の設計を完成。**release 404 のため無条件flip不可** → 2段階: **C-MODE-1（本PR=opt-in `TAISUN_UPDATE_VERIFIED=true`・既定は現行git温存）** / C-MODE-2（release公開後・別commitでflip+404時legacy fallback）。mutable は `TAISUN_UPDATE_UNSAFE=true` opt-inに降格 |
| **4** 検証後もfail-closedでない | `npm ci || npm install` で frozen 崩れ | 検証モードのみ `npm ci`（`||npm install`廃止・失敗exit1・lockfile不在exit1）。UNSAFE/legacyパスは逐語温存（非回帰） |
| **5** override matrix未記載+path-to-regexpスコープ | blanket 8.4.2 が express@4 を破壊 | 版別scoped override（express@4→0.1.13 / router→8.4.2）。既存4pin保持マージ。axios1.16.1/ajv8.18.0/ws8.20.1/@hono/node-server1.19.13/uuid11.1.1/(ai-sdr)express-rate-limit8.5.2 |
| **6** FIX-3b除外根拠不足 | E404が`disabled:false`で有効・uvx未ピン | E404 6種+open-websearch を §7-A 起動可否調査に切出し。uvx は §7-B(PyPI probe+SECURITY明記)。FIX-3b intra欠陥(figma heredoc取りこぼし・件数28→29)修正 |

---

## 1. タスク別 詳細設計

### TASK-A: 残sink（独立・リスク低）
`src/proxy-mcp/browser/pipeline-tabs-skillize.ts`:
- **A1** L27直後に `import { sanitizeUntrusted } from '../../intelligence/sanitize';`（skills.ts:43と同一・パス検証済）
- **A2** memoryAdd直前に `const safeTabs = filteredTabs.map((t) => ({ ...t, title: t.title ? sanitizeUntrusted(t.title) : t.title }));`（skills.ts:819-822と一致・null-safe）
- **A3** **literal `tabs: filteredTabs,`** を `tabs: safeTabs,` に置換（※行番号でなくliteralを対象。memoryAdd開始はL219、対象literalはL221）。`totalTabs: filteredTabs.length` は非変更（数値）
- adversarial: 2レンズ breaks=false。

### TASK-B: nested依存（MUST-1 vitest削除 + MUST-5 override を1パス統合）
> **HIGH 衝突（integration critic）**: 両者は同一4ファイルを編集し同一2 lockfileを再生成。**両 package.json を最終形に一括編集 → lockfile再生成は1サーバ1回**。2回再生成禁止（中間lock混入・override locator誤適用で既存4pin破壊）。

**B1 voice-ai/package.json（最終形）**:
- scripts: `"test": "vitest run"`→`"test": "echo \"No tests (vitest removed) — skipping\" && exit 0"`、`"test:watch": "vitest"` 行削除（カンマ整合）
- devDependencies: `"vitest": "^3.0.0"` 削除（直前 typescript の末尾カンマ除去）
- overrides（**最終マージobject明示・既存4pin保持**）: `hono:4.12.23, ip-address:10.2.0, qs:6.15.2, fast-uri:3.1.2`（保持）+ scoped `express`→`path-to-regexp:0.1.13` / `router`→`path-to-regexp:8.4.2` + top-level `axios:1.16.1, ajv:8.18.0, ws:8.20.1, @hono/node-server:1.19.13, uuid:11.1.1`
  - axios1.16.1がpatched follow-redirects 1.16.0をpull（follow-redirects override不要）。postcss/picomatch/vite/rollupはvitest削除で消滅＝override不要。

**B2 ai-sdr/package.json（最終形）**:
- scripts: B1同様
- devDependencies: `"vitest": "^3.0.0"` 削除（カンマ整合）
- overrides: 既存4pin保持 + `router`→`path-to-regexp:8.4.2`（ai-sdrはexpress@4無し）+ top-level `express-rate-limit:8.5.2, uuid:11.1.1, @hono/node-server:1.19.13`（ip-address:10.2.0 は express-rate-limit 8.5.2 の `^10.2.0` と整合＝保持必須）

**B3 lockfile再生成（B1+B2完了後・各1回）**: `npm install --prefix mcp-servers/voice-ai-mcp-server` / `... ai-sdr-mcp-server`（`--package-lock-only`でなく実install＝node_modulesをprune）

**B4 検証**:
- `grep -c vitest package.json package-lock.json` = 各0（両サーバ）
- 既存4pin保持grep（hono/ip-address/qs/fast-uri が4件）= clobber回帰ガード
- `grep path-to-regexp voice-ai lock` で 0.1.13 と router配下 8.4.2 併存確認
- `npm ci --dry-run --prefix ...` = exit0（MUST-4 fail-closed の前提）
- `npm audit --prefix ...` = **critical 0**（before voice 12/ai-sdr 8 は実測。after の moderate/high 残数は apply 時に実測記録＝projectionを断定しない・Pattern 10）
- `npm run build --prefix ...` = 成功
- adversarial: axios proxy-from-env v1→v2 transitive bump を apply 時に確認（§6-3）。

### TASK-C: FIX-9 検証付き更新（MUST-2/3/4・リスク中・設計やり直し）
**採択**: Approach A（最小blast-radius）spine + B の npm-ci fail-closed scoping & VERSION読取り graft。B の shared-lib統合・C の marker は不採用（curl|bash で disk無し／.gitが既存signal）。

- **C0 precondition**: release 404 ゆえ本PRは **C-MODE-1（opt-in）**。既定flip(C-MODE-2)はrelease公開後の別commit。
- **C1** `scripts/update.sh` の helper後・header前（旧 `.git`ゲート:41より前）に `verified_update()` 挿入: SHA256_CMD検出→`TAISUN_VERSION`/releases/latest解決(空ならreturn1)→release tar.gz+.sha256取得→`shasum -c --ignore-missing`検証(不一致return1)→tar展開→適用。
  - **制御フロー修正（adversarial）**: `local TMP`+`trap 'rm -rf' RETURN`→関数末で`trap - RETURN`（global leak回避）。cp fallbackを**subshell化しない**（subshellのreturnは関数を抜けず errexit抑制下で成功扱いになる）＝`cd "$TMP/x" || return 1` を関数レベルで実行し各 `cp -R ... || return 1`。自己上書き対策に rsync(temp+rename) 優先 or `exec` で新コピーに再exec。
- **C2** ゲート: `if [ "$TAISUN_UPDATE_VERIFIED" = true ]; then verified_update; rc=$?; ...`（if条件でなく`$?`判定＝errexit維持）。rc0で`VERIFIED_UPDATE_DONE=true`、非0は明確メッセージ+exit1。
- **C3** 旧 legacy block(:41-125)を `if [ "$VERIFIED_UPDATE_DONE" != true ]; then ... fi` で包む。**非破壊ZIP fallback/FORCE_UPDATE reset は到達可能なまま保持**（gateするのみ・Pattern 8）。`bash -n` でbrace均衡確認。
- **C4** NEW_VERSION: verified時のみ`$REPO_DIR/VERSION`優先、他はpackage.json（stale VERSION回避をverifiedに限定）。
- **C5** root npm（:138-144）: 検証モードのみ `npm ci`（`||npm install`/`2>/dev/null`廃止・lockfile不在exit1）。UNSAFE/legacyは逐語温存。
- **C6** nested MCP loop（:154-166）: 検証モードのみ lockfile必須(無ければexit1)→`npm ci --no-audit && npm run build --if-present` 失敗時exit1（`||info skip`廃止）。UNSAFE逐語温存。line-bot stale参照は:155ガードで両系skip＝任意cleanup。
- **C7** `install.sh` の L86後にstderr 2行の推奨注記（非ブロッキング）。固定SHAピンはしない。
- 検証: `bash -n scripts/update.sh`/`bash -n install.sh`=0、`node scripts/check-installer-parity.js` green、throwaway dirでDRY matrix（(a)opt-in verified git (b)opt-in verified 非git (c)既定=現行git同値 (d)tampered sha→exit1未適用 (e)cp fallback mid-fail→exit1 (f)自己上書き後parse error無）。
- **--omit=dev判断**: 本PRは TASK-B(vitest削除)と同一PR出荷ゆえ verified `npm ci` が vitest を入れる事故なし。**FIX-9単独先行配備は禁止**（分割時のみ`--omit=dev`追加）。

### TASK-D: FIX-3b ランチャピン（MUST-6精緻化・config-only・独立）
**intra欠陥修正**: figma heredoc取りこぼし→総 **29 edit**（旧28誤）、switch-mcp.sh heredoc 4 edit、playwright 7 occurrence。
10 npm package を exact pin（token append のみ・既存flags非変更）:
- @playwright/mcp@0.0.75（7箇所: .mcp.json.example/development/full-optimized/image/marketing/video + switch-mcp.sh:134）
- mcp-youtube@0.0.1（3・:89 description string除く）/ @upstash/context7-mcp@3.1.0（4・heredoc:85含）/ figma-developer-mcp@0.12.0（4・**heredoc:105修正**）/ tavily-mcp@0.2.20（3）/ @modelcontextprotocol/server-sequential-thinking@2025.12.18（2）/ agent-twitter-client-mcp@0.1.0（1）/ @modelcontextprotocol/server-puppeteer@2025.5.12（3・heredoc:126含）/ firecrawl-mcp@3.20.2（1）/ @browserbasehq/mcp-server-browserbase@2.4.3（1）
- 除外: E404 6種=bare維持(§7-A調査へ)・uvx 5種(§7-B)・local node 5=repo-pinned妥当除外。
- 検証: 全7 JSON parse + `bash -n switch-mcp.sh` + grep で10 pin @version化・6 E404 bare維持。heredoc由来JSONはthrowawayで`switch-mcp.sh full`実行 or 手動検査（本checkoutの.mcp.json上書き回避）。

---

## 2. 統合適用順
| STEP | タスク | 理由 |
|---|---|---|
| 0 | A(sink) | 完全独立・最低リスク |
| 1 | B(vitest削除+override **統合1パス**) | 同一4ファイルco-edit→各package.json最終形→lockfile各1回→`npm ci --dry-run`でci-clean検証(STEP2の前提) |
| 2 | C(FIX-9・**Bと同一PR**) | fail-closed `npm ci` がSTEP1のclean lockを消費。C-MODE-1 opt-in既定で配備 |
| 3 | D(FIX-3b・config独立) | intra欠陥先行修正→JSON parse+`bash -n` |
最終ゲート: root audit 0 / nested audit critical 0 / `tsc --noEmit` 0 / `npm test` 59 suites / → **Codex 実装後ゲート(GO)→Opus独立再検証→明示パスでcommit(pushしない)**。

## 3. 検証ゲート（合否）
`tsc --noEmit`=0 / `npm test`59 suites pass / root `npm audit`=0 / nested `npm audit` critical=0両サーバ(残mod/highは実測記録) / nested `npm ci --dry-run` exit0両サーバ / `bash -n` update.sh・install.sh・switch-mcp.sh=0 / installer-parity green / 7 JSON parse OK / FIX-3b 29 edit grep一致 / 目視差分(全分岐・fallback到達性・既存4pin保持) / Codex実装後ゲートGO。

## 4. 残オープン判断（§6・ユーザー/Codex sign-off）
1. **C-MODE-2 既定flip**: release(taisun_agent-<VER>.tar.gz+.sha256)を1本公開・download検証通過後に別commitでflip。公開タイミングはユーザー判断。本PRはopt-inまで。
2. **C-MODE-2 git-tree保護(blocking)**: 既定verified化前に(a)未コミット変更stash/abort (b)downgradeガード (c)fork/非main検出→legacy fallback を必須実装。
3. **axios proxy-from-env v1→v2**: apply時に2.x解決+twilioのproxy env尊重を実確認。
4. **§7切出し**: E404起動可否(7-A)/uvx PyPIピン(7-B)の別件チケット化タイミング。
5. nested audit after の正確な残数は apply 時に実測記録（Pattern 10）。

## 5. 非実施
root install.sh固定SHAピン(dev/HEAD破壊)・非推奨2種migration(別件)・4-1 push(commit-only)・4-3配布設計(保留)・C-MODE-2既定flip(release公開後)。

## 7. MUST-6切出し（別件）
- **7-A**: npm E404 6種(n8n-mcp/apify/mcp-memory-service/facebook-ads-library/obsidian/skyvern)+uvx open-websearch-mcp(PyPI/npm双方404)の起動可否調査。launcher消費全config(.mcp.json.example+6preset+heredoc)でper-file disabled状態を列挙し private/git/typo特定して修正or disable。
- **7-B**: uvx gpt-researcher-mcp/chroma-mcp/mcp-server-qdrant/meta-ads-mcp の PyPI probe+将来ピン方針(`pkg==ver` / gpt-researcherは`--from pkg==ver`)。meta-ads BUSL-1.1注記。本PRはnpm-only scopeゆえ未ピン残課題。

## 8. SECURITY ノート TODO
非推奨2種migration / uvx未ピン(§7-B) / E404+open-websearch起動可否(§7-A) / update.ps1不在=Windows更新経路無し(parity gap)。
