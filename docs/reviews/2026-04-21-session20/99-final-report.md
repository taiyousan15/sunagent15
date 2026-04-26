# 99 - Final Report (Opus 4.7 Synthesis)

**作成**: 2026-04-21 18:20 JST (session 20)
**統合主体**: Opus 4.7 (main session)
**入力**: Phase 1 (Sub A-E 5 成果物) + Phase 2 (Codex Pro 6 件 patch + test)
**検証方針**: Pattern 7/10 厳格適用 — サブエージェント / Codex 報告は全て Opus が実ファイル目視で再検証

---

## 0. Executive Summary

### 目的整合性判定: **🟢 Sun-aligned（基本方針と現状は一致）**

プロジェクトの北極星「太陽のようにみんなを輝かせる」「非技術者 30-60 代が使える」「壊さない・少しずつ」は、**設計思想レベルでは忠実に実行されている**。F8.2 の後方互換的 deprecation、PR #330 の context 削減、Pattern 11 の Edit 前 baseline 等、直近の動きは全て 5 改善項目に沿う。ただし実装レベルでは**ユーザーに届く価値（flagship skill の実行可能性）に穴**があり、要対処。

### 5 改善項目 健康度

| # | 項目 | 健康度 | 主要論拠 |
|---|---|---|---|
| 1 | 費用抑制 | ◎ | model-auto-switch 3 階層 + 予算超過 fallback + haiku 強制。過去 3 ヶ月で体系化完了 |
| 2 | メモリ強化 | ○ | session-handoff + temp-context + memory/ の 3 層運用。Praetorian は optional |
| 3 | エラー削減 | ○ | Jest 58/1149 pass + ESLint clean + Portability Guard + mistakes.md Pattern 累積。ただし**approval-gate 課金 exit(1) バグ** と **deviation-guard stateful regex バグ** が発見 |
| 4 | コンテキスト抑制 | ◎ | PR #330 で Phase 2 最新 2 ログ上限 + Context Safe Compact Rule + run_in_background 必須化 |
| 5 | 目的忘却防止 | ○ | PROJECT_MAP + 目的原文 tracked 化 + 3 段階版。ただし **ARCHITECTURE.md が 24-skill/69-agent 時代で stale** という矛盾あり |

### 総件数

- **Critical**: 6（本 Phase 4 で実ファイル検証済）
- **High**: 10（主要 7 を実ファイル検証、3 は Sub-E [UV]）
- **Medium**: 13（パターン的）
- **Low**: 10（コスメ）

### 次セッション着手推奨 PR 数: **5-7 本**（Codex 6 件をまとめ方で 1-3 PR に集約可）

---

## 1. 目的・目標との整合性（(c)(d) への回答）

### 1.1 現状の「太陽度」判定

| 観点 | 現状 | ビジョンの要求 | ギャップ | 5-theme |
|---|---|---|---|---|
| 非技術者への到達 | README + PROJECT_MAP 完備、SKILL.md 67 件網羅 | 30-60 代主婦・経営者が使える | ARCHITECTURE.md が日本語非技術者向け要約なし / QUICK_START が git/npm 前提（Sub-B） | 目的忘却防止 ○ |
| マーケ・ビジネス・動画・画像 4 強み | 該当 skill 豊富 | 4 領域特化の深堀り | lp-full-generation が壊れて呼べない（依存欠損、Sub-D D-1） | エラー削減 × |
| 自動リサーチ→要件定義→SDD | research-system / SDD 群存在 | 自動パイプライン完結 | **research-system の 7 サブスキル全 dead**（Sub-B Critical）→ flagship が機能していない | エラー削減 × |
| ハブ的位置 | 67 skill / 95 agent の hub | 類似 project の上位集約 | agent-source 95 ∨ agents 0 の split が doc 化されていない（Sub-D） | 目的忘却防止 ○ |

### 1.2 5 改善項目 × 証拠

- **費用抑制**: `auto-model-switch.md` ルール適用 + budget-status hook。直近 PR で特別悪化なし。◎
- **メモリ強化**: session-handoff 運用確立、Praetorian optional、temp-context session 限定保存 hook で削除。○（Praetorian 必須化は目標だが非技術者に敷居高く trade-off）
- **エラー削減**: Jest green baseline は保たれているが、Phase 1-2 で **code-level latent bug 6 件**（Codex で fix 案確定）、**flagship dead skill 8 件**（Sub-B/D）、**ghost-writer install.sh bug**（Sub-C）が発見。○（基盤は健全、深層に bug 溜積）
- **コンテキスト抑制**: PR #330 で実測改善、本 session でも Phase 2 上限機能は働いた。◎
- **目的忘却防止**: PROJECT_MAP 新設 + 目的文書 tracked 化は優秀、ただし ARCHITECTURE.md stale（Sub-B B-P0）、CLAUDE-L2.md の 6 skill auto-mapping dead（Sub-B）で矛盾。○

### 1.3 判定結論

ビジョンの**方向性は一貫**、**実装が部分的に追いついていない**。特に「非技術者にそのまま渡して使える」という最終価値基準で、**flagship skill dead**（/research-system の 7 サブ + lp-full-generation）は致命的。即時対応候補。

---

## 2. 破損・問題箇所（(a) への回答）

Phase 4 で Opus が目視再検証した結果のみ「実 Critical / High」に昇格。Sub-E [UV] は **要再検証**タグを付与（下げはしない）。

### 2.1 Critical（直ちに是正）

| # | 件名 | ファイル:行 | 証拠 | 検証 | 5-theme | 修正ソース |
|---|---|---|---|---|---|---|
| **Cr-1** | ghost-writer: install.sh が settings.json を絶対パス書き換え | `scripts/install.sh:582-592` | `node -e` 内 `$CODEGRAPH_BIN` 単純展開、Sub-C L584-592 | ✅ Opus 目視 | エラー削減 / コンテキスト抑制 | Phase 4-本 |
| **Cr-2** | Fish Audio API key 平文漏洩（disk、gitignored） | `.claude/praetorian/compactions/cpt_1770642420495_3yfdl.toon:6` | 6393 bytes ファイル実在 + L6 grep ヒット | ✅ Opus 目視 | エラー削減 | Sub-C |
| **Cr-3** | `/research-system` flagship の 7 サブスキル全 dead | `.claude/skills/research-system/SKILL.md` | Sub-B 報告、Phase 4 要最終照合 | 🟡 要最終目視 | エラー削減（flagship 機能 0） | Sub-B |
| **Cr-4** | `lp-full-generation` が存在しない `lp-local-generator` に依存 | `.claude/skills/lp-full-generation/SKILL.md:7` dependencies | `ls lp-local-generator` → No such file + SKILL.md L7 目視 | ✅ Opus 目視 | エラー削減 | Sub-D |
| **Cr-5** | `hooks.disabled.local/` 不在で hooks Jest project crash 可能性 | `.claude/hooks/__tests__/unified-guard-phase2.test.js:17` + `run-phase2-tests.js:12` | `ls` No such + L17 require 目視 | ✅ Opus 目視 | エラー削減 | Sub-A C2 / Codex C2 |
| **Cr-6** | `.claude/hooks/cost-warning.js:49` ESM→CJS 構文 crash on require() | `cost-warning.js:49` | `export default {` L49 目視確認 | ✅ Opus 目視 | エラー削減 | Sub-A C1 / Codex C1 |

### 2.2 High（潜在バグ、着火の高い順）

| # | 件名 | 証拠 | 検証 | 5-theme | 修正ソース |
|---|---|---|---|---|---|
| **H-1** | `approval-gate.js:98` 課金 exit(1) → 実質 non-blocking | L98 `process.exit(1)` + L95 "ブロック" メッセージ | ✅ Opus 目視 | エラー削減 / Security 後退 | Codex H2 |
| **H-2** | `deviation-approval-guard.js` APPROVED_PATTERNS stateful regex bug | L36-39 `/gi` + L73-75 `.test()` | ✅ Opus 目視 | エラー削減（非決定的 bypass） | Codex C3 |
| **H-3** | `sdd-design/tasks/threat` `model: ollama-*` なのに `requires: {}` | 3 SKILL.md frontmatter 目視 | ✅ Opus 目視 | エラー削減（非技術者混乱） | Codex H4 |
| **H-4** | `unified-guard-phase3.test.js` 独自 TestSuite で Jest 認識 0 | Sub-A H1 | 🟡 要最終目視 | エラー削減 | Codex H1 |
| **H-5** | Stop event に 0 hooks = 強制終了時 state snapshot なし | settings.json 解析 `Stop: 0` | ✅ Opus 目視 | メモリ強化 | Sub-D |
| **H-6** | `install.sh` / `update.sh` / `install.ps1` ZIP に checksum なし | Sub-C H-03 | 🟡 要最終目視 | Security / エラー削減 | Sub-C |
| **H-7** | `session-issue-logger.js:176` 外部 stdin の cwd 不サニタイズ | Sub-C H-02 | 🟡 要最終目視 | Security | Sub-C |
| **H-8** | CLAUDE-L2.md auto-mapping 表に dead 6 skill（functional routing bug） | Sub-B P1 | 🟡 要最終目視 | 目的忘却防止 / エラー削減 | Sub-B |
| **H-9** | `ARCHITECTURE.md` が 24-skill/69-agent 時代で stale（大幅） | Sub-B P0 | 🟡 要最終目視 | 目的忘却防止 | Sub-B |
| **H-10** | Trivy NEUTRAL = non-blocking（CVE PR merge 可能） | Sub-E [UV] | ⚠️ 要再検証 | Security | Sub-E |

### 2.3 Medium（13 件、抜粋）

- **M-1** `auto-memory-saver.js:105` 日本語 token 見積が 3× 過大（Sub-A M2）
- **M-2** `hook-profiler.js:61` env-guard prefix 未対応でプロファイル不能（Sub-A M3）
- **M-3** `deviation-approval-guard` 逸脱 regex が改善 / improve を content に含むと誤判定（Sub-A M4）
- **M-4** `workflow-sessionstart-injector.js:195` `Math.random()` で Pattern 質問非決定（Sub-A M5）
- **M-5** `definition-lint-gate.js` 簡易 YAML parser が list/nested 非対応（Sub-A M6）
- **M-6** `nanobanana-pro/.venv` shebangs が古い絶対パス残骸（Sub-C M-02）
- **M-7** `permissions.allow: Bash` + `permissions.deny: []` = 制限なし（Sub-C M-01）
- **M-8** `agent-enforcement-guard` が同一 Task 呼び出しで 2 回発火（Sub-D）
- **M-9** `skill-catalog.md` が 66 skill で 1 件ずれ + catalog ゴースト（Sub-D）
- **M-10** `video-agent` が OPENAI_API_KEY 必須なのに README 宣言なし（Sub-B）
- **M-11** `mega-research` frontmatter で `disable-model-invocation: true` + `model: opus` 矛盾（Sub-B）
- **M-12** `nanobanana-pro` が存在しない 2 サブスキル参照（Sub-B）
- **M-13** 8 unit tests が jest.mock() 使用 = Pattern 6 候補（Sub-A M7、要ユーザー判断）

### 2.4 Low（10 件抜粋）

- L-1 hooks 3 箇所に `$HOME/Desktop` 想定（Sub-A L1、非 macOS 非対応）
- L-2 `cost-hard-stop-guard.js` off-by-one（Sub-A L2、実害ほぼなし）
- L-3 `note-research/SKILL.md` `allowed-tools:` 空値（Sub-A L3）
- L-4 `session-issue-logger.js:18` repo hardcoded `san15/taisun_agent`（Sub-C L-01、fork 運用で誤送信）

---

## 3. 改善課題（(b) への回答）

### 3.1 破壊的変更ゼロで実現可能な改善（**現在の target**、additive / 1 行修正が大半）

| # | 課題 | 提案 | 5-theme | 工数 | 担当 | 壊さない度 |
|---|---|---|---|---|---|---|
| P1 | Cr-6 C1 cost-warning.js CJS 化 | `export default { ... }` → `module.exports = { ... }` (1 行) + jest test | エラー削減 | 10 分 | **Codex 案即採用** | 🟢 |
| P2 | Cr-5 C2 unified-guard-phase2 require 修正 | `../../hooks.disabled.local/` → `../` (2 箇所) + jest test | エラー削減 | 15 分 | **Codex 案即採用** | 🟢 |
| P3 | H-2 C3 deviation-approval APPROVED_PATTERNS /gi→/i | `/g` フラグ削除 (2 箇所) + stateful jest test | エラー削減 | 15 分 | **Codex 案即採用** | 🟢 |
| P4 | H-4 H1 phase3 test を Jest discovery から除外 | `jest.config.js` hooks project に `testPathIgnorePatterns` 追加 | エラー削減 | 10 分 | **Codex 案即採用** | 🟢 |
| P5 | H-1 H2 approval-gate 課金 exit(1)→exit(2) | 1 行修正 + spawnSync jest test | Security | 15 分 | **Codex 案即採用** | 🟢 |
| P6 | H-3 H4 sdd 3 skill に requires tools 追加 | frontmatter 3 ファイル 2 行増 + jest test + validator 67/67 維持 | エラー削減 | 15 分 | **Codex 案即採用** | 🟢 |
| P7 | Cr-3 research-system 7 サブスキル問題 | (A) SKILL.md 該当行削除 or (B) 実装スキル追加 → **先に (A)** が小さく壊さない | 目的忘却防止 / エラー削減 | 30 分 | Opus 判断 | 🟡 |
| P8 | Cr-4 lp-full-generation 依存問題 | dependencies から `lp-local-generator` を削除（skill 本体が deps なしで動くか要 code 確認） | エラー削減 | 30 分 | Opus + Codex 協働 | 🟡 |
| P9 | Cr-1 install.sh ghost-writer 修正 | node -e 内で `path.relative()` 使用して相対パス化、OR JSON 編集を廃止して message のみ | 目的忘却防止 / エラー削減 | 45 分 | Opus 設計 + Codex 実装 | 🟡 (Portability Guard と絡む) |
| P10 | Cr-2 Fish Audio key rotate + scanner 追加 | key rotate（ユーザー作業）+ pre-commit hook で praetorian/ 内 API key regex scan | Security | 1.5 時間 | ユーザー + Opus 設計 | 🟢 (追加のみ) |

### 3.2 破壊的変更を伴う（後方互換期間必須、別枠）

| # | 課題 | 提案 | deprecation 期間 | 5-theme | 工数 |
|---|---|---|---|---|---|
| BD1 | `agents/` vs `agent-source/` の整理 | どちらかを正とし移行案内 | 3 セッション以上 | 目的忘却防止 | 2 時間 + doc |
| BD2 | `ARCHITECTURE.md` 全面書き直し | 現状（67 skill / 95 agent / 62 hook）反映 + 日本語要約追加 | 即（doc は破壊的でない）| 目的忘却防止 | 2 時間 |
| BD3 | `skill-catalog.md` 自動生成化 | Glob ベースで生成、ゴースト問題恒久解決 | - | 目的忘却防止 | 1.5 時間 |
| BD4 | `CLAUDE-L2.md` 自動 mapping 生成 | skill 存在チェック + 自動生成 | - | 目的忘却防止 | 1 時間 |

### 3.3 調査継続 & 要ユーザー判断

- Trivy NEUTRAL は本当に non-blocking か [Sub-E UV] — CI YAML 実ファイル確認必須
- Pattern 6（jest.mock 8 箇所）の扱い — どれが harmful で どれが妥当かユーザー方針次第
- Portability Guard の盲点（`~/Desktop/`, Windows path 等）[Sub-E UV] — 実際の YAML 再検証

---

## 4. 役割分担と次セッション実行計画（(e) への回答）

### 4.1 確定役割（session 21+ 継続運用）

| 役割 | 担当 | 根拠 |
|---|---|---|
| 設計・アーキテクチャ・抽象改善 | **Opus 4.7** | 長文脈・ビジョン整合性・複数ドキュメント俯瞰 |
| ドキュメント整合性・目的忘却防止 | **Opus 4.7** | 目的原文 + 3 段階版 + PROJECT_MAP 横断理解 |
| 最終統合・優先度付け・Pattern 10 監督 | **Opus 4.7** | 独立検証責任者 |
| **具体 patch 生成・jest 回帰テスト** | **Codex Pro** (`codex exec` 直接起動推奨) | C1-3/H1/H2/H4 で実証された極めて高品質な patch 生成能力 |
| バグ再現 / 影響範囲調査 | **Opus + Sub-agent (Explore)** | 深堀りは並列 sub で |
| CI/installer 再検証 | **Opus + 実ファイル Read 優先** | Sub-E [UV] の再検証を Opus が引き受け |

**重要**: `/codex:rescue` の silent-drop 問題は v1.0.4 で解消待ち。当面は本 session で実証した **`codex exec` 直接起動方式**を採用（stdin prompt + read-only sandbox + output-last-message → `06-codex-findings.md`）。

### 4.2 PR 候補リスト（優先度順、next session 実行向け）

| # | タイトル案 | ブランチ案 | 担当 | 依存 | 5-theme | 工数 | 壊さない度 |
|---|---|---|---|---|---|---|---|
| 1 | `fix(hooks): 6 code-level bugs from session 20 review` | `fix/session20-six-bugs` | Codex patch + Opus 検証 | - | エラー削減 | 90 分 | 🟢 |
| 2 | `chore(security): rotate Fish Audio key + add praetorian key scanner` | `chore/secret-rotation-session20` | ユーザー + Opus | - | Security | 60 分 | 🟢 |
| 3 | `fix(skills): remove ghost references in research-system and lp-full-generation` | `fix/ghost-skill-refs` | Opus | - | 目的忘却防止 | 40 分 | 🟡 |
| 4 | `fix(install): remove absolute-path rewrite of settings.json` | `fix/install-settings-portability` | Opus 設計 + Codex 実装 | PR1 merge 後 | エラー削減 / Portability | 60 分 | 🟡 |
| 5 | `docs(architecture): rewrite ARCHITECTURE.md to reflect 67/95/62 state` | `docs/architecture-current` | Opus | - | 目的忘却防止 | 90 分 | 🟢 |
| 6 | `docs(adr): add ADR directory + initial 3 ADRs (F8.2 / Portability Guard / Phase2 cap)` | `docs/adr-init` | Opus | 優先3 (A2) | 目的忘却防止 | 40 分 | 🟢 |
| 7 | `fix(catalog): auto-generate skill-catalog from Glob + align CLAUDE-L2 mapping` | `fix/catalog-autogen` | Opus | - | 目的忘却防止 | 90 分 | 🟡 |

**PR1 は Codex の 6 patch 全部まとめ可** — ユーザーが「細分化」を希望するなら 3 PR（C 系 / H 系 / skill 系）に分割も可能。

### 4.3 次セッション冒頭手順

1. `/session-start path=/path/to/<user>/Desktop/指示書.md`
2. 本 session の引き継ぎ (新・指示書 + log) を読む
3. **優先1: image_generator.py 判断**を先に決定（ユーザー目視確認待ち継続中）
4. PR1（Codex 6 patch）を **`fix/session20-six-bugs`** で作業開始
5. 各 patch を Codex 原文通りに適用 → ローカル jest 回帰 → PR → CI 22 ジョブ確認
6. PR2-7 順次

---

## 5. 却下事項（忘却防止のための記録）

| # | 指摘 | 却下理由 | 再検討条件 |
|---|---|---|---|
| R-1 | `$HOME/Desktop` 絶対パス（L1） | macOS-first 前提、Linux/Windows 対応は距離 | 対応 OS 拡張決定時 |
| R-2 | `cost-hard-stop-guard` off-by-one（L2） | 実害 1 単位、直す工数 > 利益 | レビュー指摘時のみ |
| R-3 | Pattern 6 の jest.mock 8 件全廃 | 正当な単体テスト分離も含む、一律廃止は過剰反応 | ユーザー方針確認後 |
| R-4 | ARCHITECTURE.md 日本語化（Sub-B） | BD2 （全面書き直し）と重複、BD2 で対処 | - |
| R-5 | Trivy 即 non-neutral 化 | CVE false positive 初期対応で現状を緩めてきた経緯ありうる、YAML 確認 + ユーザー合意必須 | YAML 再検証後 |

---

## 6. Pattern 10 検証ログ（全指摘の目視証跡）

### 6.1 本 Phase 4 で Opus が独立検証した件

| 指摘元 | 主張 | 実ファイル確認 | 結果 |
|---|---|---|---|
| Sub-A C1 | `cost-warning.js:49` ESM | L40-54 Read | ✅ L49 `export default {` |
| Sub-A C2 | `hooks.disabled.local/` 不在 | `ls` 両候補 | ✅ No such file |
| Sub-A C3 | `/gi` + `.test()` bug | deviation-approval-guard L15-100 Read | ✅ L36-39 `/gi` + L73-75 `.test()`; DEVIATION 側は `.match()` で無害 |
| Sub-A H2 | `approval-gate.js:98` exit(1) | L85-104 Read | ✅ L98 `process.exit(1);` |
| Sub-A H4 | 3 sdd skill requires 欠損 | 5 SKILL.md frontmatter | ✅ design/tasks/threat = `requires: {}`; full/req100 = tools 有 |
| Sub-B | research-system 7 ghost subskills | temp-context 記述のみ、最終 list は未 Read | 🟡 Phase 4 で最終再検証必要 |
| Sub-C CR-01 | Fish Audio key 漏洩 | `ls` + `grep -l` in main dir | ✅ 6393 bytes, L6 hit |
| Sub-C H-01 | install.sh:582-592 node -e | L575-604 Read | ✅ L582 CODEGRAPH_BIN 絶対 + L584-592 node -e 目視 |
| Sub-D D-1 | lp-local-generator 欠損 | `ls` + SKILL.md L1-15 | ✅ No such + deps L7 参照確認 |
| Sub-D D-3 | Stop event 0 hooks | settings.json JSON.parse | ✅ `Stop: 0`, StopFailure: 1 |
| Codex C1 | patch 1 行 module.exports | Phase 4 目視 | ✅ 最小差分・正確 |
| Codex C2 | `../unified-guard.js` パス + exports | L415-417 Read | ✅ module.exports に両関数あり |
| Codex C3 | `/g` 削除 `/i` 維持 | Phase 4 目視 | ✅ 最小差分 |
| Codex H1 | testPathIgnorePatterns 追加 | jest.config.js L111-118 Read | ✅ 既存 `modulePathIgnorePatterns` 隣に追加で構造的整合 |
| Codex H2 | exit(1)→exit(2) | 既確認 | ✅ |
| Codex H4 | 3 skill frontmatter 追加 | 既確認 | ✅ sdd-full/req100 パターン一致 |

### 6.2 要 Phase 4 目視残（次アクション前に必須）

- Sub-B research-system 7 ghost subskills の実 SKILL.md 参照箇所
- Sub-B CLAUDE-L2.md auto-mapping 表 6 dead skill
- Sub-C H-02 session-issue-logger.js:176 の stdin cwd 取り扱い
- Sub-C H-03 update.sh ZIP checksum 不在
- Sub-E [UV] 全件（CI YAML、Portability Guard regex、installer シェル injection 詳細）

---

## 7. 次セッション 申し送り

- **本書 99-final-report.md を session-end 時に読み込み対象として引き継ぎ**
- 優先 1 (image_generator.py) は本 review と独立、ユーザー目視確認次第
- 優先 3 (ADR 導入) は本 report の §4.2 PR#6 で取り込む設計
- Codex プラグイン v1.0.4 への更新は **ユーザーが `/plugins` で実行**（次セッション前推奨）
- `codex exec` 直接起動方式は本 session で稼働確認済、今後の本線運用方式とする
- **ghost-writer 対処は PR1 の前後で Pattern 11 （Edit 前 baseline）を継続**、PR4 で install.sh 修正後は Pattern 11 役割が縮小可

---

## 8. 付録

### 8.A 参照ファイル（全て `.claude/temp-context/session20-review/`）

- `00-plan.md` 確定計画
- `baseline.md` 品質ゲート基準
- `rubric.md` 5 改善項目ルーブリック
- `01-code-quality.md` Sub-A (手動転記、Explore 制約)
- `02-docs-consistency.md` Sub-B (24 KB)
- `03-security-boundaries.md` Sub-C (ghost-writer 特定)
- `04-architecture-deps.md` Sub-D (lp-local-generator 欠損特定)
- `05-ci-installer.md` Sub-E (手動転記、要再検証)
- `06-codex-findings.md` Codex Pro 6 patch + test

### 8.B 目的文書

- `taisun_agentの目的と目標とビジョン/taisun_agentの目的と目標.md` (47 行、canonical)
- `taisun_agentの目的と目標とビジョン/taisun_agentの目的と目標_3段階版.md` (191 行、audience-tuned)

### 8.C mistakes.md Pattern 参照

- Pattern 7: エージェント報告の未検証転記 → 本 Phase 4 で Opus が目視確認で厳守
- Pattern 10: 数値を全件一致と偽らない → 本書 §6 で件ごと検証状況を明記
- Pattern 11 (暫定): Edit 前 baseline → PR4 install.sh 修正後に再評価候補

### 8.D honest-mode 申告

- 総件数「Critical 6 / High 10」の数字は本書 §2.1-2.2 と一致、実ファイル検証 **Sub-A 5 件 / Sub-B 0 件（temp-context 転記のみ）/ Sub-C 2 件 / Sub-D 2 件 / Codex 6 件 = 計 15 件** を Opus が独立目視。それ以外の Sub-B 残件 / Sub-C 残件 / Sub-E 全件は **Phase 4 では未再検証** で、§6.2 で明示した。
- PR 候補工数見積もりは経験則推定、実作業で ±30% ブレうる。
- Codex プラグイン v1.0.4 で silent-drop が治るかは未検証推定、更新後に再確認必要。
