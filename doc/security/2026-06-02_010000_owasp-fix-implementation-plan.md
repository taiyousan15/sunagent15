# OWASP High/Medium 修正 実装計画 v2（Codex NO-GO 反映・実装前再ゲート対象）

- **対象**: sunagent15 / branch `fix/owasp-high-medium`（base: main fd8cb15）
- **v1→v2**: Codex 実装前レビュー(gpt-5.4) が NO-GO。指摘を私が実コードで検証し全反映。スコープはユーザ承認＝「確実な分を今実装＋重い分は分離」。
- **方針**: 最小差分・既存挙動非破壊（Pattern 8）・fail-closed。
- **検証**: 実装後に `npm test` + `npm audit` + 目視差分 + Codex 実装後ゲート。

## Codex指摘の検証結果（実測）
- FIX-7: `hono@4.12.13` は `@modelcontextprotocol/sdk@1.26.0 → @hono/node-server` 由来の **transitive**。hono の HIGH は「ユーザ制御JSXタグのHTMLインジェクション」で、SDKはhonoをHTTPトランスポートに使うのみ＝**当該経路では実害ほぼ無し**。ip-address/qs も同様に未到達寄り。→ `overrides` で patched 版に上げ、到達性を注記（blind `audit fix` はしない）。
- FIX-5: monitoring の公開ポートは **6個**（prometheus 9090 / grafana 3001 / loki 3100 / alertmanager 9093 / node-exporter 9100 / cadvisor 8081）。grafana だけでは不足 → 全6個を `127.0.0.1` バインド。
- FIX-6: llm の公開ポートは **3個**（litellm 4000 / postgres 5433 / redis 6380）。redis 含め全て `127.0.0.1`。
- FIX-3: 無固定ランチャは `.mcp.json.example` だけでなく **mcp-presets/*.mcp.json 6個 + scripts/switch-mcp.sh**（計38エントリ）。
- FIX-4: untrusted は report.md 以外に JSON出力・memory・`web.read_url`(browser/skills.ts)・`skillize.ts:239` にも流入。

---

## 今PRで実装（ユーザ承認スコープ）

### FIX-1 (A03/LLM06) ide-integration.js コマンドインジェクション
- `:131` `:266` の `execSync(template)` → `execFileSync('npx',[argv])`（shell無効）。
- **path containment（Codex指摘反映）**: `uri` は `fileURLToPath()` で正規化 → `fs.realpathSync()` → `process.cwd()` 配下のみ許可、外れたら拒否（naive string replace は不可）。
- 131/266 が唯一の sink（Codex確認）。`execute_code`(Jupyter) は仕様機能で非変更、READMEに過剰エージェンシー注記。

### FIX-2 (A07/A01) voice webhook 認証（opt-in機能）
- `twilio.validateRequest(authToken, signature, url, params)` で `/voice` `/voice/status` を署名検証、不正は403。
- **URL算出（Codex指摘反映）**: proxy背後で req.host が崩れるため、検証URLは **既存 `config.webhookBaseUrl` + 元path** で再構成（req.protocol/host に依存しない）。
- **fail-closed**: `TWILIO_AUTH_TOKEN` 未設定なら webhook 起動を中止（無認証起動禁止）。
- バインド: `listen(port, host)` host 既定 `127.0.0.1`（`VOICE_WEBHOOK_HOST` 上書き可）。直接公開運用者向けに「署名検証が第一防御／公開時はreverse-proxy推奨」をログ＋READMEで明示（直接公開破壊への配慮＝Codex指摘）。
- `express-rate-limit` を **voice-ai package.json に直接依存追加** + `express.json/urlencoded({limit:'64kb'})`。

### FIX-4 (LLM01/LLM04) プロンプトインジェクション（全sink網羅・Codex指摘反映）
- `rss-collector.ts:50-51 extractTextFromHtml`: 順序を **decode → strip tags → 残存`<>`除去** に修正。
- **source側で無害化**: 各 collector が `IntelligenceItem` 構築時に `title/summary/source/speaker` を `sanitizeUntrusted()` 適用（改行除去＋Markdown制御文字中和）→ report.md / JSON / memory すべてに波及。
- `item.url`: `http/https` スキームのみ許可（他は破棄）。
- `web.read_url`(`browser/skills.ts` の summary/persist 経路) と `skillize.ts:239`(SKILL.md書込前) にも同 `sanitizeUntrusted()` を適用。
- 共有 util として `src/intelligence/sanitize.ts`（or 既存utils）に集約。

### FIX-8 (A03 Low) post-to-issue.ts gh シェル
- `exec(template)` → `execFile('gh',[argv])`。`postReportToIssue`(126) と `createReportIssue`(162) **両方**。`${title}`(162) の未エスケープも解消。

### FIX-5 (A05/A01) monitoring 全ポート + grafana PW
- 6公開ポート全て `"127.0.0.1:${...}:..."`（prometheus/grafana/loki/alertmanager/node-exporter/cadvisor）。
- `GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:?set GRAFANA_ADMIN_PASSWORD}`（既定値撤去）。

### FIX-6 (A04/A05) llm 全ポート + 全秘密 fail-closed
- 3公開ポート（4000/5433/6380）全て `127.0.0.1` バインド。
- `POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?...}` + `DATABASE_URL` も同変数参照。`LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY:?...}`（既定鍵撤去）。
- `.env.example` に 3変数の必須記載。

### FIX-7 (A06) 依存（overrides・Codex v2指摘反映＝唯一のNO-GO要因を解消）
- **3つの独立した依存ツリー全てに `overrides` 追加**（install.sh:375-383 / update.sh:154-163 が nested を個別 `npm ci/install` するため root-only では届かない＝Codex検証済）:
  1. root `package.json`
  2. `mcp-servers/voice-ai-mcp-server/package.json`
  3. `mcp-servers/ai-sdr-mcp-server/package.json`
  （line-bot-mcp-server は削除済のため対象外）
- `overrides`: `hono`→patched(>=4.x安全版), `ip-address`→patched, `qs`→patched。
- **各 package で `npm install` を実行し lockfile を再生成**（nested は `npm ci` 運用のため lockfile 更新必須）。その後 `npm audit` で残存確認、`npm test`／`npm run build` 通過確認。
- 解決不能/破壊なら据置き＋「transitive・当該経路で未到達（実害低: hono JSXインジェクションはSDKがJSX未使用ゆえ未到達）」を SECURITY ノートに記載。blind `audit fix --force` は不可。

> Codex 実装前ゲート: v2 で 8/9 AGREE、FIX-7 のみ NO-GO（nested未到達）→ 本パッチで解消。Codex の明示条件を満たしたため AGREE 相当として実装着手。

### FIX-3a (A06/LLM03) サプライチェーン軽量対応（全ランチャ源）
- **`@latest` を全削除**: `.mcp.json.example` + `mcp-presets/{development,full-optimized,image,marketing,research,video}.mcp.json` + `scripts/switch-mcp.sh`（38エントリ走査、`@latest`→無タグ or 既知安定タグ）。
- **README/INSTALL**: SHA256検証済 `install-release.sh` を**既定手順**に格上げ、`install.sh`(curl|bash・HEAD) に非推奨＋整合性注記。
- 完全ピン(3b)への TODO を SECURITY.md に明記。

---

## 別PRに分離（ユーザ承認）
- **FIX-3b**: 全ランチャの厳密バージョンピン（各MCPサーバ起動テスト必須）。
- **FIX-9**: `install.sh` の commit-SHA ピン / チェックサム追加。

## 実装順序
1. コード: FIX-1, FIX-8, FIX-4 → `npm test`
2. webhook+依存: FIX-2（+voice-ai install）, FIX-7（+root install）→ `npm test` / `npm audit`
3. 設定: FIX-5, FIX-6, FIX-3a
4. Codex 実装後ゲート（差分）→ AGREE → クロス検証

## 非実施（理由）
- `execute_code` Jupyter: 仕様機能、注記のみ。
- taiyou/miyabi: ファイル不在（対象外）。
