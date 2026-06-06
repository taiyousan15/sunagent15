# Codex レビュー記録：sunagent15 独立化設計 → NO-GO（実装前ゲート）

- **日付**: 2026-06-01（session 45、Opus 4.8 1M）
- **対象**: 設計書 `doc/CODEXレビュー/2026-06-01_003909_sunagent15-isolation-design.md`
- **レビュー方式**: codex.md MANDATORY 4ステップ（Codex adversarial → Opus blind → 一致確認 → クロス検証）
- **Codex 実行**: `codex:codex-rescue`（ChatGPT subscription / API key 不使用）、verdict-first 完走（thread 019e7f0e-...）、READ-ONLY
- **結果**: **NO-GO**（Codex）／ **Opus も全件 accept し NO-GO を受諾**

---

## 1. Codex VERDICT: NO-GO（2 Critical + 3 High）

| # | 重大度 | 指摘 | 根拠 |
|---|---|---|---|
| 1 | Critical | personal(user `~/.claude/skills`) が project(`.claude/skills`) を**上書き**するため、taisun の既存 global スキルが sunagent15 の project スキルを shadow。「global に書かなければ独立」が成立しない | 公式 skills.md L110 |
| 2 | Critical | `.mcp.json.example` に default 無し必須 env `${VAR}` が **22件**。クリーンインストール（`scripts/install.sh:522` が条件付き cp）で env 未設定だと Claude Code が **config 全体の parse に失敗** | 公式 mcp.md「fail to parse the config」/ `.mcp.json.example:39,107,120…` |
| 3 | High | MCP 保存場所の前提が古い。公式は user MCP=`~/.claude.json` / project MCP=root `.mcp.json`、承認制御キーは `enabledMcpjsonServers`/`disabledMcpjsonServers`。コード/`--global` 案は `~/.claude/settings.json`＋`mcpServers` を使用 | 公式 mcp.md / settings.md |
| 4 | High | hook 31件が `[ ! -f .claude/hooks/X.js ] && exit 0; node .claude/hooks/X.js` の cwd 相対ガード。**サブディレクトリ起動で全 hook が無言スキップ**（安全装置が silent no-op） | `.claude/settings.json`（31件）/ 公式 hooks.md / 実機再現 |
| 5 | High | `.claude/agents` 不在・83体は `agent-source/`。in-repo commit すると二重在庫＋drift 対策なし。`code-reviewer` 名重複（`ait42-code-reviewer.md`/`sub-code-reviewer.md`）は片方が無警告 discard | `install.sh:474-491` / `install.ps1:633-648` / 各 .md:2 |

**Non-blocking（Codex）**: 有効skillは70でなく**68**（`_archived`/`_guides`除く）／`.claude-plugin/plugin.json:2` 名が `taisun-agent` 残存／skill localパスは公式 `${CLAUDE_SKILL_DIR}` を使うべき。verify scope 修正・uninstall manifest の方向性は妥当と評価。

---

## 2. Opus blind 判定（Codex を見る前に記録）

- **VERDICT: GO**（設計を段階的計画として採用、高リスク Step は実機検証ゲート前提）
- 事前に挙げた懸念: A(MCP相対パス解決) / B(agent二重持ち) / C(サブフォルダ起動の脆さ) / D(MCP読込元) / E(--globalネームスペース)

---

## 3. 一致確認（cosine 的突合）＋ Opus 独立クロス検証

Codex を鵜呑みにせず、5 blocking + 非blocking を**実リポ＋公式ドキュメントで独立検証**（workflow `wflnvs732`、6 agent）→ **6/6 confirmed、0 refuted**。

| Codex | Opus blind | 突合 | クロス検証 | Opus 最終判定 |
|---|---|---|---|---|
| #5 agent二重持ち | B | ✅AGREE | confirmed | **accept** |
| #4 サブフォルダ hook | C | ✅AGREE | confirmed（実機再現） | **accept** |
| #3 MCP読込元 | D | ✅AGREE | confirmed（公式） | **accept** |
| #2 mcp env no-default | （近: A） | ⚠️PARTIAL | confirmed（22件・公式） | **accept** |
| #1 skill 上書き | （**見落とし**） | ❗DIVERGE | **confirmed（公式 L110）** | **accept** |

- **Opus blind の「GO」は誤り**。skill precedence を agent と同じ（project>user）と誤認したのが原因。公式は **personal>project**。Codex が盲点を捕捉、独立検証で確定。
- **最終合意: NO-GO**（異種 AI レビューが実バグ＝設計の土台欠陥を実装前に捕捉した好例）。

---

## 4. 最重要の含意（#1 が設計を変える）

「フォルダ内 project-local」では、**taisun の global スキルが入った PC で sunagent15 のスキルが恒常的に shadow される**（personal>project）。新規ユーザー（taisun 無し）は project-local で動くが、ユーザー本人や 150名（dual-install）は shadow に当たる。

**公式の正解（同 doc 記載）**: 「**Plugin skills use a `plugin-name:skill-name` namespace, so they cannot conflict with other levels.**」
→ sunagent15 を **namespaced な Claude Code プラグインとして配布**すれば（既に `.claude-plugin/plugin.json` あり）、`sunagent15:research-system` のように名前空間化され、taisun の personal スキルと**衝突しない**＝真の独立・共存が達成できる。ただし呼び出し名が変わる（要 UX 判断）。

---

## 5. 次アクション（codex.md：NO-GO はユーザー判断、実装は GO 後のみ）

設計の**戦略的見直し**が必要。候補方向:
- **(P) プラグイン配布（namespaced）** — 真の独立・共存。skill 呼び出しが `sunagent15:` 前置に。最有力。
- **(L) project-local 継続** — 新規ユーザー限定で成立。dual-install ユーザーは shadow を許容/別対処。
- いずれでも #2（mcp env default 付与）・#4（hook を `${CLAUDE_PROJECT_DIR}` 化）・#5（agents canonical/drift）・#3（MCP 読込元）・非blocking（plugin名/skill数/`${CLAUDE_SKILL_DIR}`）は**共通で要修正**。

→ 方向（P/L）をユーザー決定 → 設計 v2 → 再 Codex レビュー → GO 後に段階実装。
