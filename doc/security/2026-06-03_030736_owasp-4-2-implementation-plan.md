# OWASP 4-2 残修正 実装計画（Codex 実装前ゲート対象）

- **作成**: 2026-06-03 03:07 / session 48 / Opus 4.8 (ultracode)
- **対象**: sunagent15 / branch `fix/owasp-high-medium`（HEAD `28687d8` / base main `fd8cb15`）
- **位置づけ**: session46 で実装済みの FIX-1〜8/3a（commit `80b9f32`）とは別の「重い・判断要」分。指示書 4-2。
- **基礎資料**: `doc/security/2026-06-02_010000_owasp-fix-implementation-plan.md`（v2）＋ session48 Phase 0 read-only 調査（4領域・並列・全数値 Opus 実測検証済み）。
- **運用方針**: 最小差分・既存挙動非破壊（Pattern 8）・fail-closed。**commit-only（pushしない）**。明示パスのみ commit（`git add -A/-u` 禁止）。未コミット削除3件（`settings.json.backup` / `google-auth-system` / `mcp-servers/line-bot-mcp-server`）は混ぜない。
- **依存版の確定**: Codex はオフラインsandboxで `npm view/install/audit` 不可（feedback_codex_offline_override_noop）→ **依存バージョンは Opus 側（ネット可）で確定し、実 `npm audit` で検証**。

---

## 0. Phase 0 調査の実測サマリ（Opus 自己検証済み）

| 項目 | 実測値 | 検証方法 |
|---|---|---|
| voice-ai 脆弱性 | 12件（moderate5/high6/critical1） | `npm audit --prefix` 自実行 |
| ai-sdr 脆弱性 | 8件（moderate2/high5/critical1） | `npm audit --prefix` 自実行 |
| 破壊的変更が要る項目 | **vitest@4.1.8 のみ**（"which is a breaking change"） | `npm audit fix --dry-run` 自実行 |
| ランチャ `@latest` 残存 | 0件（FIX-3a完了） | grep 自実行 |
| ランチャ総数 / npmピン可 | 71エントリ・26種 / npm公開で固定可は **10種のみ** | エージェント調査（`npm view`×16） |
| 残sink | `pipeline-tabs-skillize.ts:219` 生タブ名を memoryAdd・sanitize import無し | 実コード確認 |

---

## 1. スコープ（今回PR・recommended）

### ① 残sink: `src/proxy-mcp/browser/pipeline-tabs-skillize.ts`（リスク低）
- **問題**: :219 の `memoryAdd` が `tabs: filteredTabs`（各 tab.title = 攻撃者制御のブラウザタブ名）を**無害化せず**長期記憶へ保存。session46 は双子の `skills.ts:819-826` を直したが本ファイルを取りこぼし。title は下流 normalize(`url-bundle.ts:148-164`)で破棄されSKILL.mdには到達しない＝sink は memory のみ。
- **修正（session46パターン踏襲・最小差分）**:
  1. line 27 直後に `import { sanitizeUntrusted } from '../../intelligence/sanitize';`
  2. :219 直前に `const safeTabs = filteredTabs.map((t) => ({ ...t, title: t.title ? sanitizeUntrusted(t.title) : t.title }));`
  3. `JSON.stringify` の `tabs: filteredTabs` → `tabs: safeTabs`（URLは下流検証のため非変更＝skills.ts同方針）
- **非破壊**: 既存 `tests/unit/pipeline-tabs-skillize.test.ts` はメタ文字なしtitle＋URL/件数アサート＝通過。

### ② nested依存 Tier-1 非破壊（リスク低）
- **対象**: `mcp-servers/voice-ai-mcp-server` ＋ `mcp-servers/ai-sdr-mcp-server`（各 package.json + package-lock.json）。
- **方針**: 非破壊（patch/minorのみ）で解消。**Opus側で overrides を確定 → `npm install` で lockfile 再生成 → 実 `npm audit` で残数検証**（`audit fix` 自動委任ではなく決定的に固定）。
  - 解消対象（fixAvailable=true・非major）: axios, path-to-regexp(8系/0.1系), postcss, picomatch, uuid, follow-redirects, ajv, ws, @hono/node-server, rollup(minor), vite(minor)。
  - ai-sdr: `express-rate-limit` を `^8.5.2` で直接依存/override 追加（MCP sdk@1.27.1 経由の high を解消。voice-ai は既に直接依存で安全）。
- **目標**: voice-ai 12→1、ai-sdr 8→1（残1=vitest、下記）。

### ④ FIX-9 install/update 完全性（リスク低・想定とスコープ相違）
- **判明**: 指示書名指しの `scripts/install.sh`（34KB）は**遠隔コード取得なし**＝`npm ci`+committed lockfile で依存 tarball の SHA-512 integrity 検証済み → **変更不要**。
- **実ギャップ**: (1) root `install.sh`（curl|bash・`git clone --depth1 --branch main` HEAD を無検証 exec）、(2) `scripts/update.sh`（`git pull origin main`/main の ZIP を無検証で上書き）。
- **既存対策**: SHA256検証付き `install-release.sh` が存在し README/CD で推奨導入として案内済み（FIX-3a）。
- **修正（additive・非破壊）**:
  1. `scripts/update.sh` に **検証付き更新モードを opt-in 追加**（`TAISUN_UPDATE_VERIFIED=true` 等）: release tag の `.tar.gz`+`.sha256` を取得→`install-release.sh` の検証ブロック流用→検証OK時のみ適用。既存 git/ZIP パスは既定 fallback として温存（現挙動不変）。
  2. root `install.sh` の遠隔経路冒頭に「検証導入は install-release.sh 推奨」の stderr 1行（任意・additive）。
- **不採用**: root install.sh を固定 commit-SHA にピンしない（dev/HEAD 経路の用途を壊すため。固定が必要な利用者は既存の install-release.sh=tag+checksum を使用）。

### ③ FIX-3b ランチャ厳密バージョンピン（リスク中・npm-only スコープ）
- **対象8ファイル**: `.mcp.json.example` / `mcp-presets/{development,full-optimized,image,marketing,research,video}.mcp.json` / `scripts/switch-mcp.sh`（**heredoc :63-180 も必須**＝独自定義のため）。
- **ピン対象（公開npm 10種・実測version固定）**: `@playwright/mcp@0.0.75`, `mcp-youtube@0.0.1`, `@upstash/context7-mcp@3.1.0`, `figma-developer-mcp@0.12.0`, `tavily-mcp@0.2.20`, `@modelcontextprotocol/server-sequential-thinking@2025.12.18`, `agent-twitter-client-mcp@0.1.0`, `@modelcontextprotocol/server-puppeteer@2025.5.12`, `firecrawl-mcp@3.20.2`, `@browserbasehq/mcp-server-browserbase@2.4.3`。**重複は全ファイル一貫**。
- **除外（今回対象外）**: 公開npm未存在(E404)6種（`@czlonkowski/n8n-mcp`/`@apify/mcp-server`/`mcp-memory-service`/`facebook-ads-library-mcp`/`@cyanheads/obsidian-mcp-server`/`@skyvern/mcp`）＝ピンすると起動が壊れるため bare 維持。uvx(PyPI)5種・local node 5種＝npmピン対象外。
- **フラグ（別件・本PRでは修正しない）**: 非推奨2種（`server-puppeteer`／`mcp-server-browserbase@2.4.3`→`@browserbasehq/mcp@3.0.0`）の移行。SECURITY ノートに TODO。
- **テスト**: ピン後、代表的なnpxサーバが `npx -y pkg@ver --help` 相当で解決・起動することを確認。
- **最小差分**: npx args 文字列のみ変更（key/env/structure 非変更）。

---

## 2. 今回の判断事項（recommended）

| # | 判断 | recommended | 代替 |
|---|---|---|---|
| vitest CRITICAL | dev専用・`files:['dist']`非出荷・@vitest/ui未インストール・テスト0個＝CVE到達不可 | **据置き＋SECURITYノートに到達不可を明記**（force昇格しない） | devDeps から vitest 削除（critical+dev系high一掃・テスト0なので破壊なし）／force昇格（vitest3→4+vite7→8+rollup→rolldown＝高リスク・非推奨） |
| FIX-3b uvx | npmスコープ外 | **今回は npm-only**（uvx は別途 `==` ピン検討） | uvx 5種も PyPI version 調査の上 `pkg==ver` 固定 |
| FIX-3b E404 6種 | 公開npm未解決 | **bare維持（除外）** | install元(git/private)を特定し coordinates 修正＝別件 |

> vitest は「据置き（最小・非破壊）」を既定とするが、`npm audit` から critical を消したい場合は「削除」が最も安全な一掃手段（テスト0個ゆえ破壊なし）。Codex 判断を仰ぐ。

---

## 3. 実装順序（安全な順・低リスク先行）
1. **① sink**（3行）→ `npx tsc --noEmit`（root）/ `npm test`
2. **② nested deps**（voice-ai/ai-sdr: overrides確定→`npm install`→`npm audit`）→ 各 `npm run build`
3. **④ FIX-9**（update.sh 検証モード追加・install.sh注記）→ `bash -n` 構文チェック＋既存fallbackパス到達性をフロー図で確認（Pattern 8）
4. **③ FIX-3b**（8ファイルpiン・heredoc同期）→ 代表npxサーバ起動確認
5. 全体: `npx tsc --noEmit` / `npm test`（59 suites 維持）/ root `npm audit`（0維持）/ nested `npm audit`（残= vitest のみ想定）

## 4. 検証ゲート
- `npx tsc --noEmit`（root）= 0 errors
- `npm test`（unit/regression/workflow-phase3/integration）= 59 suites / 1198 passed 維持（sink テスト含む）
- root `npm audit` = 0 維持
- nested `npm audit` = voice-ai/ai-sdr とも残 1（vitest）想定。0 を求める場合は判断事項の vitest 削除を採用
- 目視差分（全分岐・fallback到達性）
- **Codex 実装後ゲート（GO）→ Opus 独立再検証 → 明示パスで commit（pushしない）**

## 5. 非実施（理由）
- root install.sh 固定SHAピン（dev/HEAD用途破壊）／uvx・E404・local nodeのnpmピン（対象外）／非推奨2種の移行（別件）／4-1 push（commit-onlyユーザー指示）／4-3 配布設計（解決後に決定とユーザー保留）。
