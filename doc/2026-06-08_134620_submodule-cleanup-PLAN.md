# 実装計画書: broken submodule / orphan gitlink 2件掃除

- **日時**: 2026-06-08 / session 53 / Opus 4.8 (ultracode)
- **対象 repo**: `taiyousan15/sunagent15`（PUBLIC・配布正本、base = origin/main `6027de8`／PR #33 マージ後）
- **起点**: 配布監査レポート `doc/2026-06-07_055551_distribution-audit-sunagent15.md` §2「壊れた git submodule 2件」
- **位置づけ**: Codex 実装前ゲート用 SSoT。GO 後に実装 → 実装後ゲート GO + Opus 再検証 → 明示パス commit → push/PR は**ユーザー承認後**。
- **重さ**: 普通（複数ファイル・破壊性低）。

---

## 0. 確定した現状（実測・推測なし）

| # | 事実 | 根拠（実コマンド） |
|---|------|------|
| F1 | `.gitmodules` のエントリは **`google-auth-system` 1件のみ**（path=google-auth-system, url=https://github.com/san15/google-auth-system.git） | `cat .gitmodules`（全3行） |
| F2 | index に gitlink **2件**（mode 160000）: `google-auth-system` (96a19d4) と `mcp-servers/line-bot-mcp-server` (54a8fd8) | `git ls-files -s` |
| F3 | `mcp-servers/line-bot-mcp-server` は **.gitmodules に mapping 無し＝orphan gitlink** | `git submodule status` が当該 path で `fatal: no submodule mapping` |
| F4 | `google-auth-system` は未初期化（`-` 接頭辞）。URL は 404（監査記載） | `git submodule status` → `-96a19d4… google-auth-system` |
| F5 | `.git/config` に submodule セクション **無し**（local deinit 不要） | `git config --local --get-regexp '^submodule\.'` → none |
| F6 | working tree は両 path とも既に **削除済み（` D`）**。3つ目 `.claude/settings.json.backup-20260214-200209` も ` D`（**本タスク対象外**） | `git status --short` |
| F7 | build ループの line-bot 参照: `scripts/install.sh:375` / `scripts/update.sh:154` / `scripts/install.ps1:497`。いずれも `if [ -f .../package.json ]`（PS は `Test-Path`）ガード付き＝dir 消失時は body skip（現状は無害だが残骸） | `git grep -n line-bot` |
| F8 | CI「Installer Parity Check」(`scripts/check-installer-parity.js`) は **CLI フラグのみ**を matrix と照合。MCP build ループ・server 名は**検査対象外** → build ループ編集で parity check は壊れない | `check-installer-parity.js` L42-71 / `installer-capability-matrix.json` |

**実害（監査）**: 普通の `git clone` は無事だが、`git clone --recurse-submodules` / `git submodule update` で **fatal 停止**（F3 の orphan gitlink ＋ F4 の 404 URL）。配布対象が素人/主婦のため「公式手順の派生コマンドで詰む」リスク。

---

## 1. 変更スコープ（Core・本PRで実施）

### 1a. gitlink / .gitmodules 除去（**明示パスのみ**・`git add -A/-u` 禁止）
1. `git rm --cached google-auth-system` … index から gitlink 除去（worktree は既に無い）
2. `git rm --cached mcp-servers/line-bot-mcp-server` … orphan gitlink 除去
3. `git rm .gitmodules` … 唯一の entry（google-auth-system）が消え**空になる**ため file ごと削除（submodule ゼロの正規状態）

> 補足: 標準手順は `git submodule deinit` → `git rm <path>` だが、F5（.git/config 無し）・F6（worktree 既削除）より deinit 不要。`git rm --cached` で index gitlink を確定削除すれば足りる。

### 1b. build ループの line-bot 参照削除（残骸除去・cross-OS 整合）
4. `scripts/install.sh:375` の for リストから `"mcp-servers/line-bot-mcp-server"` を削除（残= voice-ai, ai-sdr）
5. `scripts/update.sh:154` の for リストから同上を削除
6. `scripts/install.ps1:497` の foreach リストから `"line-bot-mcp-server"` を削除（cross-OS 整合。F8 より parity check は影響なし）

---

## 2. 明示的に**スコープ外**（本PRでは触らない／別タスク or 不要）

| 対象 | 理由 |
|------|------|
| `.mcp.json.example:34-42` の `line-bot` MCP **server エントリ**（`disabled:true`・args[0]=`mcp-servers/line-bot-mcp-server/dist/index.js`） | **重要訂正（Codex round1 反映）**: これは単なる doc でなく、`scripts/install.sh:522-524`（と install.ps1）が `.mcp.json` へ**verbatim コピーして出荷する配布テンプレート**。ただし(1)`disabled:true`＋PR#33 で `${...:-}` 既定済み＝parse 安全・実行されない、(2)orphan gitlink で**従来から dist 不在**＝本掃除で**悪化しない**（Codex も "Not a clone/submodule fatal" と確認）。除去は「line-bot **MCP 機能**の decommission」判断＝本PRの承認スコープ（submodule 掃除）外。**Codex round1 が "split is acceptable" と確認**したため**別タスク（§6 follow-up）に分離**する。 |
| `scripts/mcp-health-check.sh:99-106` が line-bot の `args[0]` dist 存在を**disabled 無関係に**チェックし `MISSING` 表示＋`SERVER_OK=false` | **pre-existing**（dist は従来から不在）。install-smoke CI は main/#33 で green＝**非ブロッキング実証済**。decommission follow-up（§6）で「disabled サーバーは dist チェック skip」を併修するのが筋。本PRでは不変。 |
| `scripts/install.ps1:192` `$KNOWN_INTERNAL_MCPS` の `'line-bot'` / `scripts/mcp-health-check.sh:99` `"line-bot"` / `.claude/mcp-profiles.json` / `.claude/presets/*.json` / `.claude/hooks/approval-gate.js:17` | いずれも line-bot **server 名**の参照（build dir ではない）。機能 decommission 時の範囲。submodule 掃除では不変 |
| `.gitignore:115` `google-auth-system/chrome-profile/` | 削除後 vestigial だが無害。cosmetic |
| `docs/PROJECT_MAP.md:45` `google-auth-system/` ディレクトリ記載 / `README.md:33` / `CHANGELOG.md:216` | doc の歴史/構造記述。数値・doc 同期タスク（§3-5）でまとめて処理 |
| `.claude/settings.json.backup-20260214-200209` の削除 | **Pattern 11・指示書§5**: 未コミット削除3件は絶対 commit に混ぜない。submodule でないため本タスクでも touch しない |

---

## 3. テスト計画（実装後・実コマンドで実行／Pattern 7・10）
1. `git submodule status` → `fatal` も `-` エントリも消え、**出力空**（submodule ゼロ）。
2. `git ls-files -s | grep '^160000'` → **gitlink ゼロ**（160000 mode が無い）。
3. `bash -n scripts/install.sh` / `bash -n scripts/update.sh` → 構文 OK。
4. `node scripts/check-installer-parity.js` → ✅（フラグ parity 維持）。
5. install.ps1 は PowerShell 構文を直接 lint できないため、編集は**配列要素1個の削除のみ**に限定し diff を目視（Windows Script Validation CI で push 後確認）。
6. `git status --short` → staged は **明示6パスのみ**（`google-auth-system`削除 / `mcp-servers/line-bot-mcp-server`削除 / `.gitmodules`削除 / install.sh / update.sh / install.ps1）。`.claude/settings.json.backup-…` が staged に**入っていない**ことを確認。
7. `npx jest --selectProjects unit`（影響範囲確認・既存リグレッション無し）。※スクリプト/submodule 変更ゆえ TS テストへの影響は無い想定だが念のため。
8. push 後 `gh pr checks` で実確認（緑と推測しない・Generate Test Report の CANCELLED は main 既存の非ゲート事象として扱う）。

---

## 4. ゲート / commit 方針
- branch: origin/main(`6027de8`) から **`fix/submodule-cleanup`** を新規作成（PR #30/#31 と独立）。作成後、未コミット3削除＋未追跡保全 doc が新 branch にそのまま持ち越されることを確認（tracked 内容は同一ゆえ conflict 無し）。
- **明示パスのみ** commit（`git rm --cached`/`git rm`/`git add <明示>`）。**禁止**: `git add -A` / `git add -u`。
- commit 対象（6パス）:
  - 削除: `google-auth-system`（gitlink）/ `mcp-servers/line-bot-mcp-server`（gitlink）/ `.gitmodules`
  - 編集: `scripts/install.sh` / `scripts/update.sh` / `scripts/install.ps1`
  - 記録: 本 PLAN ＋ `doc/CODEXレビュー/…`（前後ゲート）も同 commit に明示追加
- フロー: Codex 実装前 GO → 実装 → §3 テスト → Codex 実装後 GO → Opus 独立再検証 → commit → push → PR 作成（**マージはユーザー判断**）。

---

## 5. リスク / Codex 重点確認依頼
- **Q1（スコープ）**: → **Codex round1 = "Split is acceptable"。決着**: `.mcp.json.example` の line-bot server エントリ除去＋health-check の disabled-skip は **§6 follow-up（line-bot MCP decommission）** に分離。本PRは submodule 掃除に限定（WORKFLOW FIDELITY 厳守）。PLAN §2 に「配布テンプレート」である旨を訂正済み。
- **Q2（.gitmodules 全削除）**: → **Codex round1 GO 同意**。entry 1件のみゆえ file ごと `git rm .gitmodules`（submodule ゼロ→.gitmodules 無し が正規）。
- **Q3（install.ps1 同時編集）**: → **Codex round1 "Sound"**。install.ps1:497-499 は bash の guarded loop と同形。parity check（check-installer-parity.js:42-71）は CLI フラグのみ照合＝build ループ無影響を Codex も確認。cross-OS 整合で同時削除。
- **Q4（worktree 既削除との整合）**: → **VERIFIED（2026-06-08・Opus 書込環境で実測）**。`git rm --cached -n google-auth-system mcp-servers/line-bot-mcp-server` → `rm 'google-auth-system'` / `rm 'mcp-servers/line-bot-mcp-server'` / EXIT=0、dry-run 後も index は 160000 gitlink 不変、`.git/index.lock` 残存なし。Codex round1 が未検証だったのは**Codex 側 read-only sandbox が index.lock を作れなかった環境制約**（`Operation not permitted`）であり PLAN の欠陥ではない。
- **Q5（Pattern 11 厳守）**: → **Codex round1 "sufficient if followed"**。`git add -A/-u` を使わず明示パスのみ、commit 前に `git diff --cached --name-status` で `.claude/settings.json.backup-…` が含まれないことを確認。

## 6. Follow-up（本PR後・別タスク／Codex round1 で分離合意）
- **line-bot MCP decommission**: `.mcp.json.example` の line-bot server エントリ除去、`scripts/mcp-health-check.sh` の disabled サーバー dist チェック skip、`install.ps1:192` `$KNOWN_INTERNAL_MCPS`・`.claude/mcp-profiles.json`・`.claude/presets/*.json`・`approval-gate.js:17` の line-bot server 名整理。配布対象縮小の判断を要すためユーザー承認＋Codex ゲートで別 PR。
- **cosmetic**: `.gitignore:115` の `google-auth-system/chrome-profile/`、`docs/PROJECT_MAP.md:45` の dir 記載（§3-5 doc 同期にまとめる）。

出典: git-scm submodule / gitmodules(5) / `git rm --cached` semantics・本repo 実コマンド実測（§0）。
