# Codex 実装前 ゲート（round 5）: FIX-9 計画v5 — NO-GO（1 trivial MUST-fix のみ・収束直前）

- **日時**: 2026-06-04 15:36 / session 49 / Opus 4.8 (ultracode)
- **対象**: `doc/security/2026-06-04_152517_owasp-4-2-fix9-implementation-plan-v5.md`
- **Codex 判定**: **NO-GO**（round4 の 3 MUST + gate配置 + SHOULD は全 RESOLVED。新規 High 1件のみ）
- **Opus 最終判定**: 唯一の MUST-fix を **ACCEPT（npm 仕様確認済み）** → plan v5 に `--include=dev` 反映済み。

## round4 fix の検証（Codex）
| 項目 | 判定 |
|---|---|
| F1 stash 取り残し | **RESOLVED**（stash は apply 直前のみ・早期/return90/非git で取得前 return） |
| F3 空origin | **RESOLVED**（.git有+空origin→return1・非git は非通過） |
| F4 非git到達+CUR_VER | **RESOLVED**（gate≺.gitゲート・wrapper が L41-125 を内包・CUR_VER=$VERSION・EDIT4 cd+CURRENT_VERSION 補完） |
| F5 skip/stable-tag | **RESOLVED**（VERIFIED_SKIP で MCP skip・`*-*` prerelease 拒否・find\|head は後続ガード明記） |
| errexit-in-if | RESOLVED | self-overwrite | RESOLVED（rsync/tar-pipe 共に scripts/update.sh 除外・pipefail subshell） |
| exit vs return | RESOLVED | bash-n / if-fi | RESOLVED | default-off 非回帰 | RESOLVED |

## 新規 MUST-fix（High・Opus ACCEPT）
- **F2 が未完**（`--ignore-scripts` だけでは devDeps を強制しない）: ユーザー環境が `NODE_ENV=production` または npm config `omit=dev`（`.npmrc`/`npm_config_omit`）の場合、検証 `npm ci --ignore-scripts` が **devDeps を入れない** → 直後の `npm run build:all`(tsc) が typescript 不在で失敗。しかも node_modules は既に prod-only に書換え済＝**実行時 ts-node/tsx が消えた壊れた状態**で update 失敗終了。
  - **修正（Codex 提案・採用）**: `npm ci --ignore-scripts --include=dev --prefer-offline --no-audit`。`--include=dev` は omit/`NODE_ENV=production` を上書きし devDeps を強制導入。
  - **Opus 検証**: npm docs — `--include=<dev|optional|peer>` は依存種別の導入を明示指定し `--omit`/production 既定を上書き（npm ci でも有効）。**ACCEPT**。
  - 反映: plan v5 EDIT 5 の該当行に `--include=dev` 追加済み。

## ループ状況
FIX-9 pre-gate round 5。round4→5 で 3 MUST + gate配置 + SHOULD が全解消し、残りは **1 つの trivial flag のみ**＝明確な収束（divergence/consensus-trap でない）。超重い枠15Rに対し round5。次は `--include=dev` 反映版で round6（明示 GO 確認）→ GO なら実装。

出典: npm docs（`--include`/`--omit`/`npm ci`・NODE_ENV=production の omit 既定）/ Bash Reference Manual / OWASP Software Supply Chain Cheat Sheet（Codex 引用・Opus 検証）。
