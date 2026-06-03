# OWASP 4-2 残修正 実装計画 v3（Codex 実装前ゲート round3 対象）

- **作成**: 2026-06-04 04:09 / session 49 / Opus 4.8 (ultracode)
- **対象**: sunagent15 / branch `fix/owasp-high-medium`（HEAD `ad6d767` / base main `fd8cb15`）/ root v2.53.3
- **位置づけ**: v2（`doc/security/2026-06-03_041307_owasp-4-2-implementation-plan-v2.md`）への **round2 残指摘の解消版**。round2 NO-GO（`doc/CODEXレビュー/2026-06-03_042752_4-2-codex-pre-gate-v2-NOGO.md`）で残った3点を確定処理：
  1. **EOVERRIDE（技術・ACCEPT）** → 修正（§TASK-B）
  2. **shell flow（技術・ACCEPT）** → 修正（§TASK-C C2）
  3. **MUST-3 / DIVERGE（ユーザー判断）** → **session 49 でユーザーが決定**（下記）
- **ユーザー決定（session 49・2026-06-04）**:
  - **配布/公開範囲 = 「PUBLIC維持で GitHub release」**。FIX-9 の verified_update は公開 release URL から `tar.gz`+`.sha256` を **認証不要 curl** で取得し sha256 照合。**これは「限定配布」要件を今回緩める明示判断**（memory `project_portability` を session49 で更新）。
  - **push = commit-only 解除 → PR 作成**。branch `fix/owasp-high-medium` を push し PR 化（main 直 push しない）。未push3件（`ad6d767`/`28687d8`/`80b9f32`）も PR に含まれる。
- **運用方針**: 最小差分・既存挙動非破壊（Pattern 8）・fail-closed。**git add は明示パスのみ**（`-A/-u` 禁止）・未コミット削除3件（`settings.json.backup` / `google-auth-system` / `mcp-servers/line-bot-mcp-server`）は混ぜない（Pattern 11）。
- **依存版確定**: Codex はオフラインで `npm view/install/audit` 不可（memory `feedback_codex_offline_override_noop`）→ 依存版は Opus 側で確定し実 `npm audit`/`npm ci` で検証。Codex は本計画の **ロジック/フロー/シェル安全性** をレビュー対象とする。

---

## 0. Opus 実測検証済みの前提（session 49・read-only）

| # | 事実 | 確認方法 |
|---|---|---|
| P1 | repo は **PUBLIC**（isPrivate=false） | `gh repo view --json isPrivate` |
| P2 | GitHub release **0件**（latest=404） | `gh api .../releases/latest` |
| P3 | voice-ai: `ws:^8.18.0`・`uuid:^11.0.0`・`express-rate-limit:^8.3.1` は **direct dependency**。`vitest:^3.0.0` は devDep。overrides=`{hono:4.12.23, ip-address:10.2.0, qs:6.15.2, fast-uri:3.1.2}` | `Read package.json` |
| P4 | ai-sdr: `uuid:^11.0.0` は **direct dependency**。`vitest:^3.0.0` は devDep。overrides=同上4pin。express-rate-limit は直接依存なし（sdk経由） | `Read package.json` |
| P5 | sink: `sanitizeUntrusted(s: string): string` は `src/intelligence/sanitize.ts:1` に実在 | `grep` |
| P6 | 確立パターンは **`src/proxy-mcp/browser/skills.ts`**（v2 の "skills.ts" は doc 誤記）。L43 import / L819-822 safeTabs map / `tabs: safeTabs` | `Read skills.ts:808-842` |
| P7 | `pipeline-tabs-skillize.ts` は `src/proxy-mcp/browser/` 配下＝import パス `'../../intelligence/sanitize'` は正しい。`tabs: filteredTabs,` は L221 に1箇所のみ | `Read` |
| P8 | update.sh: `set -e`(L7)・`.git`ゲート(L41)・ZIP fallback(L82-112)・`NEW_VERSION`(L127)・root npm `npm ci||npm install`(L139-143)・nested loop(L154-166) | `Read` |
| P9 | install.sh: `set -e`(L14)・root npm ci(L335-351)・nested loop(L375-387)・完了メッセージにupdate案内(L714-716) | `Read` |

> **after audit 残数は projection しない**（Pattern 10）。版ターゲットのみ指定し、apply 時に実 `npm audit` で残 moderate/high を記録する。

---

> **【session 49 追補・option B 採択】** Codex 実装前ゲート round3（`doc/CODEXレビュー/2026-06-04_042114_4-2-codex-pre-gate-v3-NOGO.md`）は ①②③(TASK-A/B/D) を全 ADEQUATELY-ADDRESSED と判定、NO-GO は FIX-9(TASK-C) のシェル堅牢化3点のみ。ユーザーは **option B**（①②③ を先行 GO・FIX-9 は3点強化して別PR）を選択。よって本PRは **①②③ のみ実装**し、**FIX-9(TASK-C/§2 TASK-C・§4 段2)は別PRへ DEFER**。実装後ゲート: `doc/CODEXレビュー/2026-06-04_045916_4-2-codex-post-gate-GO.md`（GO）。

## 1. スコープ（option C = 全タスク + release + flip の2段）

ユーザー決定 C は「検証付きを既定」が最終ゴール。ただし **release が存在しない状態で既定 flip すると全ユーザーが 404 で更新停止**（P2）。よって **2段ロールアウト**：

- **段1（本 PR・commit→push→PR）**: TASK-A + TASK-B + TASK-D + **FIX-9 C-MODE-1（opt-in verified_update を完全実装 + git-tree保護も実装。ただし既定は現行 git フローのまま）**。
- **段2（release 公開 + DL検証通過後・別 commit）**: 既定を verified に **flip（C-MODE-2）**。legacy は `TAISUN_UPDATE_UNSAFE=true` opt-out に降格。

段1で「opt-in だが完全動作する verified 経路」を出荷 → 段2で「実 release を公開し DL+sha256 が通ることを確認してから」既定化。これで outage ゼロ。

---

## 2. タスク別 詳細設計

### TASK-A: 残 sink（独立・リスク低・config非依存）

ファイル: `src/proxy-mcp/browser/pipeline-tabs-skillize.ts`

- **A1** L27（`} from './url-bundle-skillize';`）直後に1行追加:
  ```ts
  import { sanitizeUntrusted } from '../../intelligence/sanitize';
  ```
- **A2** memoryAdd（L219）直前、L217 コメント `// Store tabs in memory` の後に safeTabs を定義（`browser/skills.ts:819-822` と同形・null-safe）:
  ```ts
      // Sanitize untrusted tab titles before storing (indirect prompt injection guard)
      const safeTabs = filteredTabs.map((t) => ({
        ...t,
        title: t.title ? sanitizeUntrusted(t.title) : t.title,
      }));
  ```
- **A3** L221 の literal `tabs: filteredTabs,` を `tabs: safeTabs,` に置換。**`totalTabs: filteredTabs.length`（L222）は非変更**（数値・XSS対象外）。
- 検証: `npx tsc --noEmit` 0 / `npm test` 59 suites pass。
- adversarial: filteredTabs 要素は `listTabsViaCDP()` 由来で `.title` 任意（既存 filter は `tab.url` 利用）＝null-safe 三項で網羅。breaks=false。

### TASK-B: nested 依存（MUST-1 vitest削除 + MUST-5 override・EOVERRIDE修正・1パス統合）

> **HIGH 衝突回避**: 両 package.json を**最終形に一括編集 → lockfile 再生成は各サーバ1回のみ**。2回再生成禁止（中間 lock 混入で既存4pin破壊リスク）。

**EOVERRIDE 修正の核心（round2 finding 2）**: npm は **direct dependency を overrides に書くと EOVERRIDE で失敗**する。よって direct な `ws`(voice-ai)・`uuid`(両) は **dependencies の spec を直接 bump**。transitive のみ override。

**B1 `mcp-servers/voice-ai-mcp-server/package.json`（最終形）**
- `scripts.test`: `"vitest run"` → `"echo \"No tests (vitest removed) — skipping\" && exit 0"`、`"test:watch": "vitest"` 行を削除（直前要素のカンマ整合）。
- `devDependencies`: `"vitest": "^3.0.0"` を削除（直前 `typescript` 末尾カンマ除去）。
- `dependencies` 直接bump（**EOVERRIDE回避**）: `"ws": "^8.18.0"` → `"^8.20.1"`、`"uuid": "^11.0.0"` → `"^11.1.1"`。
- `overrides`（最終マージ・**既存4pin保持**）:
  - 保持: `hono:4.12.23, ip-address:10.2.0, qs:6.15.2, fast-uri:3.1.2`
  - scoped path-to-regexp: `"express": { "path-to-regexp": "0.1.13" }`、`"router": { "path-to-regexp": "8.4.2" }`
  - top-level transitive: `axios:1.16.1, ajv:8.18.0, @hono/node-server:1.19.13`
  - **ws/uuid は override に書かない**（direct ゆえ B1 dependencies bump 済）。
  - 注: axios 1.16.1 が patched follow-redirects を pull（follow-redirects override 不要）。postcss/picomatch/vite/rollup は vitest 削除で消滅＝override不要。

**B2 `mcp-servers/ai-sdr-mcp-server/package.json`（最終形）**
- `scripts`: B1 同様（test を no-op echo 化、test:watch 削除）。
- `devDependencies`: `"vitest": "^3.0.0"` 削除（カンマ整合）。
- `dependencies` 直接bump（**EOVERRIDE回避**）: `"uuid": "^11.0.0"` → `"^11.1.1"`。
- `overrides`（最終マージ・既存4pin保持）:
  - 保持: `hono:4.12.23, ip-address:10.2.0, qs:6.15.2, fast-uri:3.1.2`
  - `"router": { "path-to-regexp": "8.4.2" }`（ai-sdr は express@4 無し）
  - top-level transitive: `express-rate-limit:8.5.2, @hono/node-server:1.19.13`
  - **uuid は override に書かない**（direct ゆえ B2 dependencies bump 済）。
  - 注: ip-address:10.2.0 は express-rate-limit 8.5.2 の `^10.2.0` と整合＝保持必須。

**B3 lockfile 再生成（B1+B2 完了後・各1回・実 install）**
```
npm install --prefix mcp-servers/voice-ai-mcp-server
npm install --prefix mcp-servers/ai-sdr-mcp-server
```
（`--package-lock-only` でなく実 install＝node_modules を prune して vitest 群を消す）

**B4 検証（apply 時に実測記録）**
- `grep -c vitest package.json package-lock.json` = 各0（両サーバ）
- 既存4pin（hono/ip-address/qs/fast-uri）grep = 各保持（clobber回帰ガード）
- voice-ai lock: `path-to-regexp` の `0.1.13`（express配下）と `8.4.2`（router配下）併存確認
- `npm ci --dry-run --prefix ...` = exit0 両サーバ（MUST-4 fail-closed の前提）
- `npm audit --prefix ...` = **critical 0** 両サーバ（before: voice 12/ai-sdr 8 は実測。after の mod/high 残数は実測記録）
- `npm run build --prefix ...` = 成功 両サーバ
- adversarial: axios proxy-from-env v1→v2 transitive を apply 時に確認。ws/uuid bump 後に EOVERRIDE が出ないこと（`npm install` が exit0）を確認。

### TASK-C: FIX-9 検証付き更新（MUST-2/3/4・PUBLIC release・shell-flow修正）

**採択**: v2 Approach A（最小 blast-radius）spine + npm-ci fail-closed scoping。PUBLIC release 決定により **取得は公開 URL の認証不要 curl**（v2 の「release 取得方法未定」が解消）。

- **C0 段階**: 本 PR は **C-MODE-1（opt-in）**。`TAISUN_UPDATE_VERIFIED=true` の時のみ verified_update を実行。既定は現行 git フロー逐語温存（非回帰）。flip（C-MODE-2）は段2（release公開後・別commit）。
- **C1 `verified_update()` を update.sh の helper 後・header 前（`.git`ゲート L41 より前）に挿入**。検証パスは `.git` 不要（MUST-2＝非git導入でも到達可能）:
  1. SHA256 コマンド検出（`shasum -a 256` または `sha256sum`。無ければ `return 1`）。
  2. tag 解決: `TAISUN_VERSION` env 優先、無ければ `gh`/`curl` で `releases/latest` の tag_name 取得。空なら `return 1`（→ ゲートで明確メッセージ+exit1）。
  3. DL（PUBLIC・認証不要）: `https://github.com/taiyousan15/sunagent15/releases/download/<tag>/sunagent15-<tag>.tar.gz` と同 `.sha256` を `curl -fsSL`。失敗 `return 1`。
  4. 検証: `shasum -a 256 -c <file>.sha256`（不一致 `return 1`）。
  5. 展開: `local TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' RETURN`。tar 展開 → 適用。**working-tree 保護**: 適用前に tracked への未コミット変更があれば既存 L62-66 同様 stash（または明確中断）。適用は rsync（temp→rename 相当）優先、無ければ `cd "$TMP/x" || return 1` を**関数レベル**で実行し各 `cp -R ... || return 1`（**subshell 化しない**＝subshell の return は errexit 抑制下で成功扱いになるため）。
  6. 関数末で `trap - RETURN` 後 `rm -rf "$TMP"`（明示 cleanup・global trap leak 回避）。
- **C2 ゲート（shell-flow 修正・round2 finding 3/4）**: `set -e` 下では `verified_update; rc=$?` は失敗時 rc 取得前に exit する。→ **`if verified_update; then`** 形式で errexit を回避:
  ```bash
  if [ "${TAISUN_UPDATE_VERIFIED:-}" = true ]; then
      if verified_update; then
          VERIFIED_UPDATE_DONE=true
          ok "署名検証付きで更新しました"
      else
          echo "  ❌ 検証付き更新に失敗しました（署名不一致 or release 未取得）"
          exit 1
      fi
  fi
  ```
- **C3** 旧 legacy block（L41 `.git`ゲート 〜 L125 stash pop）を `if [ "${VERIFIED_UPDATE_DONE:-}" != true ]; then ... fi` で包む。**非破壊 ZIP fallback / FORCE_UPDATE reset は到達可能なまま保持**（gate するのみ・Pattern 8/mistakes Pattern 8）。`bash -n` で brace 均衡確認。
- **C4 NEW_VERSION（L127）**: verified 時のみ `$REPO_DIR/VERSION`（存在すれば）優先、他は package.json（stale VERSION 回避を verified に限定）。
- **C5 root npm（L139-143）**: 検証モードのみ `npm ci`（`||npm install`/`2>/dev/null` 廃止・lockfile 不在 exit1）。UNSAFE/legacy パスは逐語温存。
- **C6 nested loop（L154-166）**: 検証モードのみ lockfile 必須（無ければ exit1）→ `npm ci --no-audit && npm run build --if-present` 失敗時 exit1（`||info skip` 廃止）。UNSAFE 逐語温存。line-bot stale 参照は L155 の `[ -f .../package.json ]` ガードで skip（dir 不在）＝任意 cleanup。
- **C7 install.sh**: L714-716 の update 案内付近（または完了メッセージ）に **stderr 2行の opt-in 推奨注記**（非ブロッキング・固定 SHA ピンはしない）。
- **C8 git-tree 保護（段2 C-MODE-2 の前提・本 PR で実装）**: verified 適用前に (a) 未コミット tracked 変更 → stash/中断、(b) **downgrade ガード**（DL版 < 現行版なら適用拒否+明確メッセージ）、(c) fork/非main 検出時は legacy fallback。tarball 適用ゆえ git 依存は最小だが working-tree clobber を防ぐ。
- 検証: `bash -n scripts/update.sh`/`bash -n install.sh` = 0、`node scripts/check-installer-parity.js` green、throwaway dir で DRY matrix：(a) opt-in verified git (b) opt-in verified 非git (c) **既定=現行 git 同値**（非回帰の要） (d) tampered sha → exit1 未適用 (e) cp fallback mid-fail → exit1 (f) 自己上書き後 parse error 無。
- **--omit=dev 判断**: 本 PR は TASK-B（vitest削除）と同一 PR 出荷ゆえ verified `npm ci` が vitest を入れる事故なし。**FIX-9 単独先行配備は禁止**。

### TASK-D: FIX-3b ランチャピン（config-only・独立・v2 から不変）

round2 で **ADEQUATELY-ADDRESSED**（29 edit 一致・MUST-6 解消）。設計は v2 §TASK-D を踏襲（再掲せず参照）。apply 時に各 occurrence を実 grep で再確認してから edit（行番号は実 Read 確認）。
- 10 npm package を exact pin（token append のみ・既存 flags 非変更）。8ファイル（`.mcp.json.example` + 6 preset + `switch-mcp.sh` heredoc）で計 **29 edit**（figma heredoc:105 含む）。
- 除外: E404 6種 = bare 維持（§7-A 別件）・uvx 5種（§7-B 別件）・local node 5 = repo-pinned 妥当除外。
- 検証: 全7 JSON parse OK + `bash -n switch-mcp.sh` + grep で 10 pin @version 化・6 E404 bare 維持。heredoc 由来 JSON は throwaway で検査（本 checkout の .mcp.json 上書き回避）。

---

## 3. 統合適用順（段1）

| STEP | タスク | 理由 |
|---|---|---|
| 0 | A(sink) | 完全独立・最低リスク |
| 1 | B(vitest削除+override・**EOVERRIDE修正・統合1パス**) | 同一4ファイル co-edit → 各 package.json 最終形 → lockfile 各1回 → `npm ci --dry-run` で ci-clean 検証（STEP2 の前提） |
| 2 | C(FIX-9・B と同一 PR) | fail-closed `npm ci` が STEP1 の clean lock を消費。C-MODE-1 opt-in 既定で配備 |
| 3 | D(FIX-3b・config 独立) | JSON parse + `bash -n` |

最終ゲート（段1）: root `npm audit` 0 / nested `npm audit` critical 0 両サーバ / `npx tsc --noEmit` 0 / `npm test` 59 suites / `bash -n` 3本 0 / installer-parity green / 7 JSON parse OK / FIX-3b 29 edit grep一致 / DRY matrix 全通過 / 目視差分（全分岐・fallback到達性・既存4pin保持） → **Codex 実装後ゲート(GO) → Opus 独立再検証 → 明示パスで commit → push → PR 作成**。

---

## 4. 段2（release 公開 + flip・段1 merge 後）

1. **release 公開**: 段1 の tag（例 `v2.53.3` or 新版）で `sunagent15-<tag>.tar.gz` + `<同>.sha256` を生成し GitHub release を1本公開（PUBLIC）。
2. **DL 検証**: クリーン環境で `curl` DL → `shasum -a 256 -c` 通過 → `TAISUN_UPDATE_VERIFIED=true ./scripts/update.sh` が成功することを実測。
3. **flip（C-MODE-2・別 commit）**: 既定を verified に切替（`TAISUN_UPDATE_VERIFIED` 既定 true 相当）。legacy は `TAISUN_UPDATE_UNSAFE=true` opt-out。404/取得失敗時の legacy fallback を確認。
4. flip も Codex 実装前/後ゲートを通す。

---

## 5. 検証ゲート（合否・段1）

`npx tsc --noEmit`=0 / `npm test` 59 suites pass / root `npm audit`=0 / nested `npm audit` critical=0 両サーバ（残 mod/high は実測記録）/ nested `npm ci --dry-run` exit0 両サーバ / `bash -n` update.sh・install.sh・switch-mcp.sh=0 / installer-parity green / 7 JSON parse OK / FIX-3b 29 edit grep一致 / DRY matrix (a)-(f) 全通過 / 目視差分 / Codex 実装後ゲート GO。

---

## 6. 残オープン判断（§7・別件チケット）

- **7-A**: npm E404 6種 + uvx open-websearch-mcp の起動可否調査（per-file disabled 状態列挙 → private/git/typo 特定）。
- **7-B**: uvx gpt-researcher/chroma/qdrant/meta-ads の PyPI probe + 将来ピン方針。meta-ads BUSL-1.1 注記。
- 非推奨2種 migration（別件）・update.ps1 不在（Windows 更新経路 parity gap）。

## 7. 非実施（段1）

root install.sh 固定 SHA ピン（dev/HEAD 破壊）・非推奨2種 migration・§7-A/7-B（別件）・**C-MODE-2 既定 flip（段2・release 公開後）**。

---

出典: npm overrides docs（EOVERRIDE）/ npm ci docs / Bash `set -e` 仕様（command in `if` は errexit 免除）/ OWASP Software Supply Chain Cheat Sheet。
