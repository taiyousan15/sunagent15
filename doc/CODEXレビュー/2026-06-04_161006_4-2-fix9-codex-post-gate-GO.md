# Codex 実装後 ゲート: FIX-9 verified-update（scripts/update.sh + scripts/install.sh）— GO

- **日時**: 2026-06-04 16:10 / session 49 / Opus 4.8 (ultracode)
- **対象 diff**: `scripts/update.sh`（+197/-5）・`scripts/install.sh`（+6・コメントのみ）。branch `fix/owasp-4-2-verified-update`（off fix/owasp-high-medium）。C-MODE-1 OPT-IN（既定 OFF）。
- **Codex 判定**: **GO**（全8 EDIT faithful・if/fi 均衡・default-off 非回帰・MUST-fix 空）
- **Opus 最終判定**: **ACCEPT / GO**（実コマンドで独立検証）。

## Codex per-EDIT（新ファイル行・GO）
| EDIT | 判定 |
|---|---|
| verified_update() | faithful（CUR_VER=$VERSION・official-origin guard・stable tag・return90・SHA-before-apply・stash apply直前・self-overwrite除外） |
| 2 gate≺.gitゲート | faithful（gate L186-193・.gitゲート L199 開始） |
| 3 legacy wrapper | faithful（open L197・close L284） |
| 4 cd + CURRENT_VERSION | faithful（NEW_VERSION L286→cd L288→CURRENT_VERSION L291） |
| 5 root npm（--include=dev・非prune） | faithful（L312-313 verified・legacy else L315-321） |
| 6 build:all 整合 | faithful（L326-330） |
| 7 MCP skip-gate | faithful（open L337・else L339・close L353） |
| 8 install.sh 注記 | faithful（comment-only L67） |

if/fi 均衡: gate(186-193)/wrapper(197-284)/MCP(337-353) 全balanced。default-off 非回帰: フラグ false → legacy .git/cd/git/ZIP/FORCE/stash + npm legacy-else + build legacy-elif + MCP loop が byte-identical 到達。

## Opus 独立再検証（実コマンド）
- `bash -n scripts/update.sh` / `bash -n scripts/install.sh` = OK
- `node scripts/check-installer-parity.js` = 0 errors
- `git diff` 削除5行は EDIT5/6 の置換のみ（コマンドは新 legacy else/elif に保持）。legacy `git pull`/`FORCE_UPDATE`(4)/`sunagent15_update.zip`/`taisun-update-auto-stash` は grep で存置確認（byte-identical wrap）。
- `npm run update` = `bash scripts/update.sh`（bash 実行確定＝`trap RETURN` 有効）。bash 3.2.57 対象。
- **DRY（bash 隔離）**: (T1) 非git+opt-in（release 0件）→ verified_update **rc=1・repo 書込み 0**（package.json のみ）。(T2) 非公式 origin の git repo → **rc=1**（fork 拒否）。(T3) default-off ゲート → **legacy wrapper 進入**。return 90 経路存在（L86 相当）。
  - 注: 初回テストの `undefined signal: RETURN` は zsh ハーネスのアーティファクト。bash 明示実行で trap 警告なし・rc=1 を再確認。

## 結論
FIX-9 C-MODE-1 実装は **release 品質・GO**。明示パスで commit（scripts/update.sh + scripts/install.sh + FIX-9 doc 群）→ push → FIX-9 別PR（base=fix/owasp-high-medium）。3 削除（settings.json.backup/google-auth-system/line-bot-mcp-server）は混ぜない（Pattern 11）。

## 残（C-MODE-2・別commit）
release CI（named tarball+.sha256 upload）/ GPG/sigstore 署名検証 / 既定 flip / 適用の原子化 / MCP fail-closed化。

出典: Bash Reference Manual（RETURN trap・errexit-in-if・`set -o pipefail` subshell）/ npm docs（`--include=dev`/`npm ci`）/ OWASP Software Supply Chain Cheat Sheet（Codex 引用・Opus 実コマンド検証）。
