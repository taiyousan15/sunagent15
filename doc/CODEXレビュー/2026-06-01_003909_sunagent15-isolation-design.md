# sunagent15 自己完結型インストーラ 設計書（Codexレビュー用・実装前）

- **作成**: 2026-06-01（session 45、Opus 4.8 1M context）
- **対象 repo**: `/Users/matsumototoshihiko/Desktop/dev04/sunagent15`（HEAD `fd8cb15` / branch `main`）
- **スコープ**: **設計（実装計画書）のみ。コード変更なし・read-only 調査＋検証済み**
- **生成経路**: 多段並列ワークフロー（設計13 agent ＋ 検証6 agent）＋ Opus による独立再検証
- **次工程**: 本設計を Codex adversarial-review（`--scope working-tree`）に提出 → GO 後にのみ段階的実装（codex.md / codex-review.md ゲート）

---

## 0. 確定した前提（ユーザー判断・2026-05-31〜06-01）

1. **taisun_agent と sunagent15 は完全に独立**。両者間で **何も移行・同期しない**（agent / skill / MCP / その他、taisun_agent → sunagent15 への移行・結合は一切なし）。
2. taisun_agent = 既存150名の継続利用システム（凍結・触らない）。sunagent15 = **新規プロジェクト用**。
3. sunagent15 は **「フォルダの中に入って作業」する自己完結型**。新規=clone してその中で開発。
4. **他人がインストールして使える / スキルも動く / 別PCでも動く**（ポータブル・クロスプラットフォーム Mac+Windows）。
5. 共有グローバル `~/.claude/` の **「総取り（winner-take-all）」を回避**し、既存 taisun_agent インストールを破壊しない。

---

## 1. 問題の核心（実測）

現状の `scripts/install.sh` / `scripts/install.ps1` は、インストール時に **全PC共通の `~/.claude/`（共有道具箱）** に書き込む：
- skills を `~/.claude/skills/` に symlink（`scripts/install.sh:423-461`）
- agents を `~/.claude/agents/` に copy（`scripts/install.sh:474-500`）
- MCP を `~/.claude/settings.json` に global 登録（`scripts/install.sh:567-582`）
- `TAISUN_AGENT_DIR` を `~/.zshrc`/`~/.bashrc` に永続化（`scripts/install.sh:650-672`）

2つは clean fork で **在庫がほぼ同一**（実測の衝突率）：

| 種類 | sunagent15 | global現在 | 同名衝突 |
|---|---|---|---|
| skills | 70 | 90（うち67が taisun_agent を指す symlink） | **67（96%）** |
| agents | 83 | 98 | **83（100%）** |
| MCP（内部） | — | 26 | taisun-proxy 含む同名多数 |

→ sunagent15 を入れると **同名を後勝ち上書き** = 共有道具箱の所有者が taisun_agent → sunagent15 に総取りされ、**既存150名のプロジェクトが知らぬ間に新システムの挙動に変わる**。これが「独立」を壊している主因。

---

## 2. 推奨設計：local-default + safe-optional-global

**核心**：`install.sh` / `install.ps1` から `~/.claude/` への書き込み（skills symlink・agents copy・settings.json MCP登録・rc/$PROFILE 永続化）を **既定で全廃**し、**Claude Code の cwd walk-up による project-local 自動探索に委譲**する。global 経路は `--global` 明示オプトイン時のみ・`sunagent15-` ネームスペース付きで残す（上級者の安全弁）。

### フォルダ内で全機能が動く仕組み（公式仕様確認済み）
ユーザーが `cd <repo> && claude` で **フォルダ内を cwd にして起動**すると、Claude Code は cwd から walk-up して以下を **global 登録ゼロ**で自動ロード（出典: 公式 sub-agents.md / mcp.md / skills.md）：
- **Skills**: `.claude/skills/<name>/SKILL.md`（実測70）
- **Commands**: `.claude/commands/*.md`（実測101）
- **Agents**: `.claude/agents/*.md`（priority: project `.claude/agents/` > user `~/.claude/agents/`、同名は最高優先のみ採用＝二重ロードしない）
- **MCP**: project root の `.mcp.json`（初回 workspace trust 承認1回）

### 設計が依存する「3つの落とし穴」と対策（批評で発見）
1. **MCP の相対 args**：唯一 enabled な内部 MCP `taisun-proxy` の args が bare relative `dist/proxy-mcp/server.js`（実測・enabled）。サブディレクトリ起動で cwd 依存に壊れうる → **`${CLAUDE_PROJECT_DIR:-.}/dist/proxy-mcp/server.js` 前置**（公式 mcp.md が `${VAR}`/`${VAR:-default}` 展開を明記）。
2. **agent name 重複**：`.claude/agents/` へ配置する前に、frontmatter `name:` 重複 **`code-reviewer` 1件**（`ait42-code-reviewer.md` と `sub-code-reviewer.md`）の解消が **blocking gate**（同一 scope の name 重複は片方が無警告で discard）。
3. **verify の exit 2 連鎖**：`scripts/verify-installation.js:201` が warning でも `exit 2`、`scripts/install.sh:637` が `! node ...` で fail 連鎖。温存した taisun の dangling symlink で sunagent15 install が abort し得る → **検査範囲を project-local / `--global` で分離**。

---

## 3. 変更一覧（18件・パス/行番号は検証で訂正済み）

> 注: 行番号は **`scripts/install.sh`（731行・実体インストーラ）/ `scripts/install.ps1`（896行）** 基準。リポ直下の `install.sh`（115行）/ `install.ps1`（82行）は curl|bash 用ブートストラップで生成ロジックを持たず `scripts/` に委譲。

| # | 対象（訂正後） | 変更 |
|---|---|---|
| 0 | `.mcp.json.example`(taisun-proxy) + `scripts/install.sh:520-524` | 内部MCP args を `${CLAUDE_PROJECT_DIR:-.}/...` 前置 |
| 1 | `.claude/agents/`(新規 in-repo) + `ait42-code-reviewer.md`/`sub-code-reviewer.md` | agent-source を `.claude/agents/` へ配置（**name重複 code-reviewer 解消が前提**） |
| 2 | `scripts/install.sh:423-461` | skills の global symlink を既定OFF・`--global` 時のみ（`sunagent15-` ネームスペース） |
| 3 | `scripts/install.sh:474-500` | agents の global copy を既定OFF・`--global` 時のみ |
| 4 | `scripts/install.sh:567-582` | MCP の global 登録を既定OFF・`--global` 時のみ |
| 5 | `scripts/install.sh:650-672` | `TAISUN_AGENT_DIR` の rc 永続化を削除（src 非依存=実測 grep 0） |
| 6 | 5 research skill の `${TAISUN_AGENT_DIR:-$HOME/sunagent15}`（codegraph/deep-research-grok/udemy-download/intelligence-research/omega-research） | 多段フォールバック化（`__dirname`/symlink-realpath 優先、CLAUDE_PROJECT_DIR は実機確認後昇格） |
| 7 | `scripts/install.ps1:597-606` | スキル Junction の旧 taisun_agent retarget 分岐を除去 |
| 8 | `scripts/install.ps1:183-252,768-770` | `Repair-McpServerPaths`（taisun_agent→sunagent15 張り替え結合）と呼び出しを削除 |
| 9 | `scripts/install.ps1:632-659` | agents の `Copy-Item -Force` を既定OFF・`--global` 時のみ |
| 10 | `scripts/install.ps1:818-847` | `$PROFILE` への `TAISUN_AGENT_DIR` 永続化を削除 |
| 11 | `scripts/install.sh:585-597`/`scripts/install.ps1:773-790` | CodeGraph MCP の絶対パス焼き込みを廃止→相対 or `settings.local.json` 退避 |
| 12 | `scripts/setup-project.sh:147-214`/`.ps1` | global 登録（特に無条件 MCP 上書き）を廃止/オプトイン化 |
| 13 | `scripts/verify-installation.js:109-152,200-202` + `scripts/install.sh:637` | 検査範囲を project-local / `--global` で分離（abort 連鎖遮断） |
| 14 | `scripts/installer-capability-matrix.json` + `check-installer-parity.js` + 新規 smoke test | `--global`/`-Global` 登録＋ parity は flag 名対称のみ（副作用は sandbox-HOME smoke で担保） |
| 15 | `scripts/uninstall-core.js:140-166,200-240` | `--global` で入れた物のみ manifest 記録→manifest 内のみ削除（cross-uninstall ハザード解消） |
| 16 | `install.sh`(bootstrap) | curl|bash の固定 `$HOME/.taisun-agent` clone を見直し（手動 `git clone` 正本化） |
| 17 | `.mcp.json.example`(line-bot) + INSTALL/README | line-bot（git submodule・disk不在）の同梱可否を判断 |

### 除去する taisun_agent 結合（独立化の本丸）
- `scripts/install.ps1:597-606`（Junction retarget「旧 taisun_agent」）
- `scripts/install.ps1:183-252` `Repair-McpServerPaths` + 呼び出し`:770`（コメント言及 L176/595/768）
- `scripts/install.sh:446,449,453-454`（同名 skill symlink の retarget）
- `scripts/install.sh:650-672` / `scripts/install.ps1:819-845`（`TAISUN_AGENT_DIR` 上書き永続化）
- `scripts/uninstall-core.js:140-166,200-240`（filename-gated SHA256 exact-match による cross-uninstall）
- `scripts/setup-project.sh:209`（無条件 MCP 上書き）
- **注**: install スクリプトのソースに taisun_agent への import/同期コードは **0件**（clean fork）。除去対象は全て「共有 global での後勝ち上書き」と「Windows 固有の能動的張り替え」であり、実体依存ではない。

---

## 4. 段階的実装手順（低→高リスク）

- **Step0**[低/gate] agent name 重複 `code-reviewer` 解消（リネーム or 統合、CI gate 追加）
- **Step1**[低/実機検証] 実機 Claude Code で 3点裏取り（後述「実機残件」）
- **Step2**[低] `TAISUN_AGENT_DIR` rc/$PROFILE 永続化削除（src 非依存）
- **Step3**[低] Windows 固有結合除去（`Repair-McpServerPaths` + Junction retarget）
- **Step4**[中] `.mcp.json` 生成の `${CLAUDE_PROJECT_DIR:-.}` 前置
- **Step5**[中] `.claude/agents/` in-repo commit（Step0 完了後）
- **Step6**[中] research 5 skill フォールバック多段化
- **Step7**[中] CodeGraph 絶対パス焼き込み廃止 + line-bot 判断
- **Step8**[高] global 書き込みの `--global` 降格本体（install.sh/.ps1/setup-project）
- **Step9**[高] verify 検査範囲分離 + abort 連鎖遮断
- **Step10**[高] uninstall manifest 方式
- **Step11**[中] parity + sandbox-HOME smoke test + ドキュメント

---

## 5. 破壊的変更（要周知）
- 「どのフォルダからでも使えていた」運用は folder-in 既定化で失われる（`--global` で復帰可）。ゴール1と整合する意図的変更。
- 既定 install（`--global` 無し）は `~/.claude/` を一切書かない → 既存 taisun の symlink/agents/MCP を **温存（破壊しない）**＝ゴール4合致。
- MCP 機能は最低1回の install（`.mcp.json` 生成）+ `npm build`（dist 生成）が前提。skills/commands/agents のみ真の zero-install。

---

## 6. 検証台帳（Opus 独立再検証込み）

**結果: 33事実主張中 confirmed 28 / refuted 1 / partial 3、致命的誤認 0、`ready_for_codex: true`。**
- 「refuted」1件＝「`.claude/agents` が公式自動探索される」→ 実際は不在。これは設計の **copy/in-repo 方式の正しさを裏付ける**（誤りではない）。
- partial 3件＝パス/行番号の精度のみ（下記訂正で解消）。

**Opus が自分の手で再確認した最重要主張**：
- `.claude/agents` 不在 ✅ / `.claude/agent-source/*.md` = 83 ✅
- frontmatter `name:` 重複 = **`code-reviewer` 1件のみ**（awk 独立抽出 `2 code-reviewer`）✅
- `taisun-proxy` args = `["dist/proxy-mcp/server.js"]` enabled ✅
- root `install.sh`=115行（生成0）／生成は `scripts/install.sh:520-524` ✅

**Codex 提出前に反映した訂正**：
- パス統一: `plugin.json:29`→`.claude-plugin/plugin.json:29`、`install.sh`→`scripts/install.sh`、agent 名に `ait42-` 前置
- `.mcp.json` 生成: `scripts/install.sh:520-524`（comment 520 / cp 523）
- `Repair-McpServerPaths` 関数開始: L173→**L183**（L173-182 はコメント）、呼び出し L770、言及 L768 も
- line-bot: 「repo 不在」→「**git submodule gitlink（mode 160000, commit 54a8fd8）として tracked、working-tree D（未チェックアウト）。fresh clone では submodule 未初期化で実体不在**」
- MCP 読込元: Claude Code は user/local scope MCP を **`~/.claude.json`** から、project scope を **`.mcp.json`**（project root）から読む（公式 mcp.md）。global を書かない方針は不変。

---

## 7. 実機 Claude Code でしか確認できない残件（実装前 Step1）
- **Step1a**: project `.claude/agents` と global `~/.claude/agents` 同名時の二重ロード/優先順位の実挙動
- **Step1b**: `.mcp.json` の相対 args が cwd / `${CLAUDE_PROJECT_DIR}` どちらで解決されるか（サブディレクトリ起動時）
- **Step1c**: `${CLAUDE_PROJECT_DIR}` が skill 内 bash スニペット実行環境に export されるか（公式は hooks/MCP server 環境への export を明記、skill bash は未記載）

---

## 8. Codex レビュー観点（codex_review_targets）
1. verify exit-2 + install abort 連鎖の検査範囲分離設計の妥当性
2. `.mcp.json` 内部MCP の `${CLAUDE_PROJECT_DIR:-.}` 前置案（公式 docs 解釈）
3. uninstall の cross-uninstall ハザードと manifest 方式
4. project/global agent 二重ロードの両立可否
5. `--global` の両OS実装と parity/smoke test の担保範囲
6. skill bash への `CLAUDE_PROJECT_DIR` 注入可否とフォールバック順
7. Windows 固有結合除去が taisun 乗り換え既存ユーザーに与える影響（`--migrate-from-taisun` 要否）

---

## 9. ユーザー判断が必要（open questions）
1. agent name 重複 `code-reviewer`（ait42 と sub）→ **リネームで2体維持** か **統合で1体** か
2. `--global` オプトインを **残す** か、ゴール3/4最優先で **完全削除（pure-local 一択）** か
3. 既存環境の旧 global 残骸 → **(a)放置+警告** か **(b)旧名→`sunagent15-` rename 移行スクリプト** か
4. line-bot MCP（submodule・disk不在・disabled）→ **同梱** か **宣言から除外** か
5. リモート `curl|bash`（`$HOME/.taisun-agent` clone）→ **完全廃止して手動 clone のみ** か **非推奨で残す** か

---

## 10. 残存リスク
- §7 の実機未検証3点（Step1a/b/c）。検証で前提が崩れたら MCP の working dir 明示設定等の追加策が要る。
- `--global` 旧インストール残骸（manifest 無し）は安全特定不能 → 移行の完全自動化は不可。
- in-repo `.claude/agents` commit でファイル最大83件増。将来の name 重複再発を CI gate（Step0）で継続防止。
- **本設計はコード修正を伴うため codex.md / codex-review.md ゲート対象。実装前に Codex の GO が必須。**
