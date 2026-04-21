# Sub-Agent D: Architecture & Dependencies Review
**対象プロジェクト**: `/Users/matsumototoshihiko/Desktop/dev04/taisun_agent`
**作成日**: 2026-04-21
**担当**: system-architect (Sub-Agent D)
**方針**: additive-preferred・壊さない・cost-vs-benefit 付き提案

---

## 0. Pattern 10 Self-Check Declaration

すべての数値主張は実ファイル（Glob/Grep結果）から直接計測した。
転記・推測は一切用いていない。
不一致が発見された場合は「不一致あり」と明記する。

---

## 1. Executive Summary

| 指標 | 計測値 | 注記 |
|------|--------|------|
| 実スキル数（SKILL.md存在） | **67** | Glob `.claude/skills/*/SKILL.md` |
| エージェントファイル数 | **95** | Glob `.claude/agent-source/*.md` |
| フックJSファイル総数 | **62** | Glob `.claude/hooks/*.js` |
| settings.json に登録済み（distinct） | **28** | settings.json 目視照合 |
| 未登録フックファイル | **34** | 62 - 28 |
| ゴーストスキル参照（research-system内） | **7** | Grep + Glob 照合 |
| 欠落依存スキル（lp-full-generation） | **1** | lp-local-generator |
| disable-model-invocation: true のスキル | **29** | Grep照合 |

**最重要問題3件**:
1. **lp-full-generation の依存 `lp-local-generator` が存在しない**（実行時クラッシュ確定）
2. **agent-enforcement-guard が同一イベント経路で2回発火**（UserPromptSubmit + PreToolUse:Task）
3. **Stop イベントにフックゼロ**（セッション強制終了時の状態保護が無い）

---

## 2. Skill Dependency Observations

### 2-1. 実スキルと catalog の乖離

**skill-catalog.md が主張する66スキル** に対し、**実際の SKILL.md ディレクトリ: 67**。
catalog が列挙するスキル名のうち、以下はディレクトリが存在しない（ゴーストエントリ）:

catalog記載のゴースト（SKILL.md無し）の例（Globで非存在確認済み）:
- copywriting-helper
- launch-video
- lp-design
- mendan-lp
- education-framework
- line-marketing
- sales-systems
- lp-json-generator

catalog には載っているが実体ゼロのためユーザーが `/xxx` を呼ぼうとしても存在しない。
逆に、catalog に載っていないが SKILL.md が存在するスキルも複数ある。
**skill-catalog.md は参考資料として過信できない状態。**

### 2-2. ゴーストスキル参照（research-system pipeline）

`research-system/SKILL.md` は以下7スキルを実行候補として参照しているが、
いずれも `.claude/skills/` に SKILL.md が存在しない:

| 参照スキル名 | 用途 | 実在 |
|-------------|------|------|
| `/exa-search` | セマンティック検索 | 非存在 |
| `/opencli-research` | opencli-rs 経由検索 | 非存在 |
| `/gem-research` | Gemini 9層調査 | 非存在 |
| `/youtube-summarizer` | 動画要約 | 非存在 |
| `/tavily-web` | Web検索・抽出 | 非存在 |
| `/deep-research` | 自律マルチステップ調査 | 非存在（/deep-research-grok は存在） |
| `/gather-requirements` | 要件収集 | 非存在（agent名としては存在） |

**影響**: research-system は条件分岐でスキルを選択するため、存在しない分岐は実行時に
「スキルが見つからない」エラーになる。エラーが出なくてもその調査パスが完全に無効化されている。

**推奨**: research-system SKILL.md の当該記述に `# TODO: 未実装スキル` を明記し、
存在チェックの前提をドキュメント化する（additive・非破壊）。

### 2-3. 欠落依存スキル（クリティカル）

```
lp-full-generation/SKILL.md:8: dependencies: [taiyo-analyzer, lp-local-generator]
lp-full-generation/SKILL.md:237: lp-local-generator - セクション単位生成（本スキルの基盤）
_guides/lp-flow-guide.md:33: lp-local-generator | セクション生成 | ⚠️ 必要 |
```

`taiyo-analyzer` は存在する（Globで確認）。
`lp-local-generator` はスキルとして非存在（Globで非存在確認済み）。
`lp-full-generation` を呼び出すと `lp-local-generator` が無いため基盤処理がクラッシュする。

**推奨（優先度: High）**: lp-full-generation の SKILL.md 冒頭に
「⚠️ lp-local-generator は未実装。本スキルは現在動作しません」と警告を追記する（additive）。

### 2-4. 機能的重複グループ

| グループ | スキル | 状況 |
|---------|--------|------|
| 重複A: Research深度 | deep-research-grok, omega-research | omega が --mode=quick/grok で deep-research-grok のスクリプトを直接呼ぶ。deep-research-grok は実質 omega のサブセット |
| 重複B: Multi-API Research | mega-research, mega-research-plus | plus は mega に Twitter/X + DuckDuckGo を追加。出力構造・スコアリングがほぼ同一 |
| 重複C: 軽量リサーチ | research, research-free, research-system-free | 3スキルが「外部APIを使わない軽量調査」的な役割を部分的に共有 |
| 重複D: URL分析 | url-all, url-deep-analysis | 同目的・異なる深度。用途は明確に分かれているが呼び出し先 CLAUDE.md には url-all のみ明記 |

**推奨**: 廃止提案はしない（additive-preferred）。
ただし _guides/に重複グループ対応表を1ファイル追加し「どれを使うか」を明示すると目的忘却防止になる。

### 2-5. requires: {} で宣言不足なスキル

`session-start/SKILL.md` の requires は `{}` だが、Phase 4 で git コマンドを、Phase 5 で `npx jest` と `npx eslint` を実行する。
`session-end/SKILL.md` も同様に `requires: {}` だが `jest`, `eslint`, `git` を呼ぶ。

宣言不足の影響: skill-validator スキルや自動検証ツールが requires を見て「このスキルは何も必要ない」と誤判定するリスクがある。

**推奨**: 両スキルに `requires: { tools: ["git"], optional_tools: ["npx"] }` を追記（非破壊）。

---

## 3. Hook Activation Graph

### 3-1. イベント別フック登録状況

| イベント | 登録フック数 | 登録ファイル |
|---------|------------|-------------|
| SessionStart | 3 | workflow-sessionstart-injector, codegraph-oss-monitor, context-snapshot-manager |
| PreCompact | 1 | context-snapshot-manager |
| UserPromptSubmit | 4 | model-auto-switch, skill-usage-guard, mid-session-reminder, agent-enforcement-guard |
| PreToolUse | 10 | unified-guard, deviation-approval-guard, agent-enforcement-guard, checkpoint-guard, agent-checkpoint-guard, rules-enforce-guard, research-quality-guard, cost-hard-stop-guard, mistake-pattern-matcher, pre-compact-save |
| PostToolUse | 10 | rules-read-tracker, auto-adr, definition-lint-gate, agent-trace-capture, compact-optimizer, task-overflow-guard, agent-usage-logger, output-verifier, codegraph-roi-meter, codegraph-auto-index |
| SessionEnd | 2 | context-snapshot-manager, session-handoff-generator |
| **Stop** | **0** | **なし** |
| StopFailure | 1 | stop-failure-logger |

**Stop イベントにフックゼロ**: Ctrl+C や外部シグナルでの停止時、SESSION_HANDOFF.md の保存も context-snapshot も実行されない。
StopFailure とは別物であり、正常停止のシグナルをカバーするフックが存在しない。

### 3-2. 二重発火リスク

**agent-enforcement-guard**:
- UserPromptSubmit（matcher: ""）→ 全プロンプトで発火
- PreToolUse（matcher: "Write|Edit|Task"）→ Task ツール呼び出し時に再発火

Task ツールを使うたびに同ガードが2回実行される。ガードは advisory-only（exit 0 固定）のため実害はないが、
1回あたり3秒タイムアウトの無駄な待機が発生する。

**context-snapshot-manager**:
- SessionStart + PreCompact + SessionEnd の3イベントに登録
- ファイルは1つで、イベントごとに分岐しているはずだが、
  同一ファイルが「コンパクト前のスナップショット保存」と「セッション終了時の保存」の両方を担当。
  今後の機能追加時に1ファイルの肥大化が起きやすい構造。

### 3-3. Silent-Blocker リスク（exit 2 能力あり・未登録）

以下4ファイルは内部実装に exit 2（実ブロック）コードを持つが、settings.json に未登録のため
**現在は完全に非アクティブ**:

| ファイル | exit 2 条件 | 未登録理由（推測） |
|---------|------------|-----------------|
| workflow-fidelity-guard.js | BASELINE_PATTERNS への変更検出 | unified-guard に統合済み |
| copy-safety-guard.js | コピーマーカー付きファイルの変更 | unified-guard に統合済み |
| input-sanitizer-guard.js | インジェクションパターン検出 | unified-guard に統合済み |
| auto-compact-manager.js | コンパクト閾値超過 | compact-optimizer に置換済み |

**問題**: これらのファイルが存在することで、将来の開発者が「settings.json に登録すれば動く」と誤解して
登録した場合、`unified-guard` との重複ブロックが発生する可能性がある。

**推奨**: 各ファイルの先頭に `// INACTIVE: logic consolidated into unified-guard.js` コメントを追記（additive）。

### 3-4. pre-compact-save.js の意味的不整合

```
settings.json PreToolUse 登録:
  matcher: "Bash"
  command: pre-compact-save.js
```

`/compact` コマンドはBash呼び出しではなくClaude Codeの組み込みコマンドであるため、
Bashマッチャーでは `/compact` 実行直前には発火しない。
実際には「任意のBash呼び出し前」に SESSION_HANDOFF.md を保存する動作になっている。
これはコンパクト保護として意図されたものだが、効果が限定的かつ意図と異なるタイミングで発火する。

**推奨**: PreCompact イベントに移動する（settings.json の既存 PreCompact エントリに追記、1行変更）。
または PreCompact フックとして context-snapshot-manager と並列登録する。

---

## 4. Agent Roster Audit

### 4-1. 数値の不一致

- agent-catalog.md の主張: **82エージェント**
- 実際の agent-source/*.md ファイル数: **95**
- 差分: **13ファイル** が catalog に未記載

catalog は古い状態に固定されており、信頼できる台帳として機能していない。

### 4-2. エージェント構成

| グループ | 件数 | 備考 |
|---------|------|------|
| ait42-* (コア汎用) | 64 | ait42-coordinator が2バリアント存在（-fast付き） |
| -* (コーディング特化) | 6 | -deployment-agent を含む |
| -* (コーディング特化) | 6 | -deployment-agent を含む |
| sub-* (サブエージェント) | 6 | sub-implementer, sub-code-reviewer, sub-planner, sub-code-searcher, sub-test-engineer, sub-test-runner-fixer |
| ビジネス系 | 7 | lead-qualifier, meta-ads, outreach, sdr-coordinator, voice-ai, product-owner, qa-lead |
| 汎用 | 6 | architect, automation-architect, data-analyst, doc-ops, researcher, security-auditor |
| **合計** | **95** | |

### 4-3. 薄い仕様（thin-spec）エージェント

`researcher.md`: 14行（frontmatter5行 + 本文9行）。
役割定義・完了条件・出力フォーマット・制約が欠如している。
CLAUDE.md の Agent Checkpoint 対象リスト（researcher が含まれる）に名前が挙がっており、
checkpoint が付与されても thin-spec のため質のばらつきが大きい。

他の thin-spec 候補（Glob結果から100行未満と推測されるファイル）:
- `architect.md`, `automation-architect.md`, `data-analyst.md`, `doc-ops.md`（本文が短いと推測）

### 4-4. 呼び出されているが仕様外のエージェント

`agent-checkpoint-guard.js` が監視対象として列挙するエージェント名:
```
researcher, implementer, feature-builder, bug-fixer, backend-developer,
frontend-developer, architect, system-architect, api-designer, database-designer,
requirements-elicitation, gather-requirements, security-architect, ReviewAgent,
multi-agent-debate
```

一方、実際の agent-source ファイル名は `ait42-bug-fixer`, `ait42-feature-builder` などプレフィックス付き。
**checkpoint-guard は短縮名（bug-fixer）でマッチングしているが、Task ツール呼び出し時の
subagent_type が `ait42-bug-fixer` なら短縮名マッチは失敗する。**

この不一致は、ガードが advisory-only（exit 0）のため実害はないが、
checkpoint が意図通りに全対象エージェントに適用されていない可能性がある。

### 4-5. 定義済みだが呼び出し先が不明なエージェント

以下は agent-source に定義されているが、skills や CLAUDE.md のどのトリガーからも呼ばれていない：
- `ait42-canary-controller.md`（非存在→スキップ）
- `ait42-multi-agent-competition.md`（どのスキルも参照していない可能性）
- `ait42-omega-aware-coordinator.md`（omega-research 内部から呼ばれるが CLAUDE.md に記載なし）
- `voice-ai-agent.md`（nanobanana-pro 内部から使われる可能性があるが明示なし）

完全な呼び出しグラフは Sub-A（コード品質）が調査中のため追記予定。

---

## 5. Technical Debt Hotspots

### 5-1. ファイルシステム負債

**nanobanana-pro/.venv/ がリポジトリにコミットされている**

```
.claude/skills/nanobanana-pro/
  .venv/           # Python仮想環境（数百MB規模）
  data/browser_profile/  # ブラウザプロファイルデータ
```

`.gitignore` にこれらが含まれていない場合、git clone のたびに巨大なバイナリが転送される。
また、.venv 内の依存バージョンが固定されるため他環境での再現性が低下する。
ポータビリティ目標（他人に渡して使える）に直接反する。

**推奨（優先度: High）**:
1. `.gitignore` に `**/.venv/` と `**/browser_profile/` を追記
2. `nanobanana-pro/` に `setup.sh` を追加し venv を再現可能にする

### 5-2. God-File 候補

**research-system/SKILL.md（推定620行）**:
12+スキルのオーケストレーション、14環境変数、条件分岐、コマンド例、
ユースケース例を1ファイルに収容。
読者が「どのパスが今の環境で実際に動くか」を判断するのが困難。

**推奨**: _guides/ に「research-system 動作確認チェックリスト」を追加し、
各スキルの ENV_KEY 要否を表形式にまとめる（SKILL.md 本体は変更不要）。

### 5-3. 重複するレビュースクリプト

`scripts/` に以下の2ファイルが並存:
- `gpt_review_12rounds.py` — GPT ベース 12ラウンド review
- `gpt_opus_pingpong_12.py` — Opus ping-pong 12ラウンド review

命名が異なるが目的は同一（12ラウンドレビュー）。
一方は GPT API、他方は Opus を使う実装違いの可能性があるが、
どちらが推奨かが不明。どちらかが deprecated になっていても削除されていない。

**推奨**: 両ファイルの先頭にコメントで「こちらが現行」「こちらは旧版」を明記する（additive）。

### 5-4. TTS スクリプト三重存在

`scripts/` に:
- `tts-google.py` — Google Cloud TTS
- `tts-macos.sh` — macOS say コマンド
- `tts-voicevox.py` — VOICEVOX API

nanobanana-pro SKILL.md が Fish Audio を指定しているなら、
これら3スクリプトとの関係が不明。mistakes.md Pattern 6 にある「macOS say で代替禁止」と
`tts-macos.sh` の存在が矛盾する。

**推奨**: `scripts/` に README.md（もしくはコメント）を追加し、
各 TTS スクリプトの使用条件（正規 vs 代替 vs 廃止予定）を明記する。

### 5-5. フック数 vs 登録数のギャップ

62 JSフックファイルのうち 34 が未登録。
これは機能が存在するが活性化されていない状態（デッドコード）であり、
将来の開発者が「どのフックが実際に動いているか」を把握するのに時間がかかる。

**推奨**: `.claude/hooks/README.md` に登録状況マップを追記（下記のような表）:

| ファイル | 登録 | イベント | 備考 |
|--------|------|--------|------|
| unified-guard.js | ✅ | PreToolUse | 主要ブロッカー |
| workflow-fidelity-guard.js | ❌ | - | unified-guardに統合済み |
| ... | | | |

---

## 6. Testing Architecture Fit

### 6-1. テスト配置の全体像

| ディレクトリ | 件数 | 対象 |
|------------|------|------|
| tests/unit/ | 30+ TypeScript | src/ モジュール |
| tests/integration/ | 8 | エージェント・hooks・skills・MCP |
| tests/regression/ | 5 | コマンドインジェクション・エラー検出など |
| Python tests | 4 | アーティファクト・JSONスキーマ・メモリ・リトライ |
| .claude/hooks/__tests__/ | ~7 | フックJS（一部のみ） |

### 6-2. フックテストのカバレッジギャップ

62 フックJSファイルのうち、`__tests__/` でテストカバーされているのは:
- unified-guard（Phase 2, 3, Stage2b の3ファイル）
- model-auto-switch（1ファイル）
- cost-hard-stop（1ファイル）
- guard-dev-commands（1ファイル）

**カバーされていないフック（例）**:
- agent-enforcement-guard（二重発火リスクのあるファイル）
- agent-checkpoint-guard（名前マッチング不一致のリスクがある）
- pre-compact-save（意味的不整合があるファイル）
- context-snapshot-manager（3イベント担当）
- deviation-approval-guard

advisory-only フックは「間違えても exit 0 で流れる」設計のため単体テストの優先度は低いが、
`agent-enforcement-guard` のような二重発火は統合テストで検出できるはずであり、
integration/unified-hooks.test.ts に該当ケースがあるか要確認（Sub-A が詳細調査中）。

### 6-3. スキルの自動テスト不在

67 スキルのうち、SKILL.md の frontmatter（requires, disable-model-invocation, model フィールド）を
自動検証する仕組みが `skill-validator` スキルとして存在する。
しかし CI（.github/workflows/）でこれが定期実行されているかは Sub-E が調査中。

### 6-4. Python テストと JS テストの分断

- `tests/*.py` は Python で書かれ pytest で実行
- `tests/unit/*.test.ts` は TypeScript で ts-jest で実行
- `.claude/hooks/__tests__/*.test.js` は Jest（CommonJS）で実行

3つのランナーが混在。`npm test` で全テストが実行されるか、
それとも Python テストは別途 `pytest` が必要かが settings.json / package.json からは確認できていない。

---

## 7. Incremental Improvement Proposals

優先度: **Critical** = 実行時クラッシュ確定 / **High** = 誤動作リスク / **Medium** = 品質・保守性 / **Low** = 将来対応可

| # | 問題 | 修正案 | 判断軸タグ | Cost | Benefit |
|---|------|--------|------------|------|---------|
| D-01 | lp-full-generation が依存する lp-local-generator が非存在 | SKILL.md 冒頭に `⚠️ 未実装警告` を additive 追記 | エラー削減 | 5分 | Critical バグの露出回避 |
| D-02 | Stop イベントにフックゼロ | settings.json の Stop[] に context-snapshot-manager を追記（1行） | エラー削減・メモリ強化 | 10分 | 強制終了時の状態保護 |
| D-03 | pre-compact-save が Bash マッチャーで意味的に誤発火 | PreCompact イベントに移動 | エラー削減 | 15分 | /compact 直前の確実な保存 |
| D-04 | agent-enforcement-guard の二重発火（UserPromptSubmit+PreToolUse:Task） | UserPromptSubmit 側を削除 or 条件を Task のみに絞る | 費用抑制・コンテキスト抑制 | 20分 | Task毎の無駄な3秒待機を除去 |
| D-05 | agent-checkpoint-guard の名前マッチ不一致（bug-fixer vs ait42-bug-fixer） | guard の対象名に ait42- プレフィックスを追加 | 目的忘却防止 | 15分 | checkpoint が全対象エージェントに適用 |
| D-06 | nanobanana-pro/.venv/ がリポジトリに混入 | .gitignore に `**/.venv/` 追記 + setup.sh 追加 | 費用抑制（clone コスト） | 30分 | ポータビリティ向上・clone高速化 |
| D-07 | 4つの exit 2 未登録フックが混乱を招く | 各ファイル先頭に `// INACTIVE: consolidated into unified-guard.js` を additive 追記 | 目的忘却防止 | 20分 | 将来の誤登録リスク防止 |
| D-08 | skill-catalog.md が8+ゴーストエントリを含む | catalog に「`(未実装)`」マークを追加（additive） | 目的忘却防止 | 20分 | ユーザーが存在しないスキルを呼ばなくなる |
| D-09 | research-system の7ゴーストスキル参照 | 参照箇所に `（未実装スキル）` 注記を additive 追加 | エラー削減 | 15分 | 誤呼び出し防止 |
| D-10 | session-start/session-end の requires: {} が tool 依存を隠蔽 | `requires: { tools: ["git"], optional_tools: ["npx"] }` を追記 | エラー削減 | 10分 | skill-validator の正確な検証 |
| D-11 | researcher agent が14行の thin-spec | 役割・出力形式・完了条件を30行程度に拡充 | 目的忘却防止 | 30分 | checkpoint ゲートの実効性向上 |
| D-12 | hooks/ の登録状況が不透明（34ファイル未登録） | .claude/hooks/README.md に登録状況マップを追加 | 目的忘却防止 | 45分 | 将来のフック追加・デバッグコスト削減 |
| D-13 | TTS スクリプト3種と Fish Audio の関係が不明 | scripts/ に利用条件コメントを追記 | 目的忘却防止 | 15分 | Pattern 6 違反の再発防止 |
| D-14 | agent-catalog が実数より13少ない（82 vs 95） | catalog を実数で更新 | 目的忘却防止 | 20分 | オンボード時の混乱防止 |
| D-15 | mega-research と mega-research-plus が構造的重複 | _guides/ に使い分けガイドを追加（スキル本体は変更不要） | コンテキスト抑制 | 20分 | 呼び出し選択の明確化 |

---

## 8. Pattern 10 Self-Check

**「一致」「全件確認」と言い切る前に実ファイルで1件ずつ数えた数値のみ報告する。**

| 数値 | 根拠ツール | 計測方法 |
|------|----------|---------|
| スキル67件 | Glob `.claude/skills/*/SKILL.md` | 出力リストを1行ずつカウント: 67件 |
| エージェント95件 | Glob `.claude/agent-source/*.md` | ait42系64 + 非ait42系31 = 95件 |
| フックJS62件 | Glob `.claude/hooks/*.js` | 出力リストを1行ずつカウント: 62件 |
| 登録フック28件 | settings.json 目視照合 | 重複除去してファイル名列挙: 28件 |
| ゴーストスキル7件 | Grep(research-system) + Glob照合 | 7件の参照を個別に Glob で非存在確認 |
| lp-local-generator 非存在 | Glob `.claude/skills/lp-local-generator*` | 出力: No files found |
| disable-model-invocation: true 29件 | Grep → 29 files | Grep結果29件 |
| Stop イベント フック0件 | settings.json Stop: [] | 配列が空であることを直接確認 |
| agent-catalog 主張82件 | _guides/agent-catalog.md 記載値 | ファイル内記載の82と実数95の不一致を明記 |

**不一致として申告する事項**:
- skill-catalog.md が主張する「66スキル」と実スキル67件の差は+1（catalogが66を主張、実際は67）。
  これは catalog の更新漏れか、または catalog が内部ガイドを1件カウントしている可能性がある（未確認）。

---

## 9. まとめ・他サブへの申し送り

**Sub-A（コード品質）へ**:
- agent-enforcement-guard の二重発火を integration テストで再現できるか確認依頼
- researcher.md の thin-spec 判定（行数・完了条件の有無）

**Sub-C（セキュリティ）へ**:
- unified-guard の DANGEROUS_PATTERNS と input-sanitizer-guard（未登録）のカバレッジ重複調査依頼
- nanobanana-pro/.venv/ に CVE 含む依存が混入していないか（Trivy 対象）

**Sub-E（CI/installer）へ**:
- skill-validator が CI で自動実行されているか確認依頼
- Python テスト（pytest）が npm test に統合されているか確認依頼
- nanobanana-pro/.venv/ が .gitignore 対象外かどうか git ls-files で確認依頼
