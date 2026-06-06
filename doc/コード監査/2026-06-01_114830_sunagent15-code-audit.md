# sunagent15 コード監査レポート — 2026-06-01

- **対象 repo**: `/Users/matsumototoshihiko/Desktop/dev04/sunagent15`（branch `main` / HEAD `fd8cb15`）
- **手法**: Dynamic Workflow（全体コードチェック＋安全削除判断）を **150 agent の READ-ONLY ワークフロー**で実行。どの agent も `Explore` 型（Edit/Write ツール非保持）で、**1ファイルも削除・編集していない**（findings only）。
- **実行規模（実測）**: 150 agents / 1,205 files analyzed / 254 raw candidates / 93 unique candidates verified / 所要 ~16分 / subagent tokens 18.9M
- **重要**: 本レポートはコード修正を伴う削除提案を含むため、コード本体の削除実行は **codex.md / codex-review.md ゲート対象（Codex GO 後のみ）**。何も削除していない。
- **PHASE 0 注記**: `git stash` は実行していない（読むだけの監査で退避不要 / 変更系コマンド回避 / submodule `D` 2件は Pattern11 で touch 禁止）。

---

## 0. エグゼクティブサマリ（高校生にも分かる言葉で）

150体の調査エージェントが「消せるゴミ」を探した結果、エージェント自身は **「35件は消して安全」** と報告した。
**しかし私（Opus）が1件ずつ自分で確かめたところ、その35件はそのまま信用できない**——次の通り内訳が大きく変わった：

| 私の再判定 | 件数 | 意味 |
|---|---|---|
| ❌ **誤検出（消すと壊れる）** | **5件** | テスト3件・Makefile が呼ぶスクリプト1件・検証スクリプトが参照する JSON 1件。「import されてないだけ」で、実際は現役。**消してはいけない** |
| ✅ **低リスクで消せる（要あなた承認）** | **6件** | バックアップ3件＋完全重複JSON3件。明白なゴミ |
| 🗂 **アーカイブ製品（製品判断）** | **8件** | `_archived/` のSKILL.md。消すかは「機能を捨てるか」の判断 |
| 🔧 **コード（Codex GO 必須・提案のみ）** | **約6件** | 未参照の src ファイル等。消すなら Codex レビュー必須 |
| ⚠️ **低信頼の孤立（要確認）** | 約10件 | docs/schemas/debate履歴/.claude内部。文書・履歴は「ゴミ」ではない |

**→ 今すぐ安全に消せるのは実質「6件」だけ**。エージェントの「35件safe」は **約14%（5件）が確実に誤り**で、残りも「未参照＝不要」とは限らない（テスト・スクリプト・文書・スキーマ・履歴は import されないのが正常）。

---

## 1. ❌ 確実な誤検出（KEEP 厳守・消すと壊れる）

エージェントが「safe_to_delete・refs=0」と報告したが、**私の独立検証で現役と確認**。これらは絶対に消さない。

| ファイル | エージェント判定 | 私の検証（根拠） | 正しい判定 |
|---|---|---|---|
| `tests/test_memory_bank_roundtrip.py` | safe | pytest が `test_*.py` を規約発見（requirements.txt に pytest 有） | **KEEP（現役テスト）** |
| `tests/test_runner_retry_stop.py` | safe | 同上 | **KEEP（現役テスト）** |
| `tests/unit/unified-hooks/layer-2-policy-validator.test.ts` | safe | `jest.config.js:5` testMatch `**/?(*.)+(spec\|test).ts` が拾う | **KEEP（現役テスト）** |
| `scripts/phase2/health-check.sh` | safe | `Makefile:133` が `@./scripts/phase2/health-check.sh` で呼ぶ | **KEEP（Makefile 依存）** |
| `.claude/hooks/data/baseline-metrics.json` | safe | `scripts/validate-final.sh:47-49` が存在チェック | **KEEP（検証スクリプト依存）** |

> **教訓**: テスト・単体スクリプト・データ JSON は「import される」種類ではないため、import grep の「refs=0」は無意味。Pattern 7/10（エージェント報告の未検証転記禁止）が効いた典型例。

---

## 2. ✅ 低リスクで消せる（あなたの承認後に実行可）

私の検証で「明白なゴミ／完全重複」と確認。これらは比較的安全だが、削除はあなたの OK 後に explicit pathspec で1件ずつ。

### 2-A. バックアップファイル（tracked・現役ファイルの控え）
| ファイル | 根拠 |
|---|---|
| `.claude/hooks/mistakes.md.backup.20260329` | `mistakes.md` の日付付き控え。被参照0 |
| `.claude/settings.json.backup` | `settings.json` の控え。被参照0 |
| `.claude/settings.json.backup-20260214-200209` | 同上（日付付き）。被参照0 |

### 2-B. 完全重複 JSON（`cmp -s` でバイト一致を確認）
| ファイル | 正本（保持） |
|---|---|
| `config/workflows/examples/content_creation_v1.json` | `config/workflows/content_creation_v1.json` と**完全一致** |
| `config/workflows/examples/priority_based_v1.json` | `config/workflows/priority_based_v1.json` と**完全一致** |
| `config/workflows/examples/software_development_v1.json` | `config/workflows/software_development_v1.json` と**完全一致** |

> `examples/` ディレクトリはコード/設定から一切参照されていない（`grep "workflows/examples"` =0）。3件とも親ディレクトリのコピー。

---

## 3. 🗂 アーカイブ済みスキル（製品判断・あなた決定）

`.claude/skills/_archived/` 配下の SKILL.md（8件）。「消す＝その機能を完全に捨てる」判断。一部は QUALITY_REPORT 等から参照あり（refs>0）なので、消す前に「新版に統合済みか」を確認すべき。

| ファイル | 備考 |
|---|---|
| `.claude/skills/_archived/lp-generator/SKILL.md` | refs=5（doc 参照あり）。新版 `taiyo-style-lp` に統合との記録 |
| `.claude/skills/_archived/manga-production/SKILL.md` | refs=2。新版 `ai-manga-generator` に統合 |
| `.claude/skills/_archived/sales-letter/SKILL.md` | refs=5。新版 `taiyo-style-sales-letter` に統合 |
| `.claude/skills/_archived/video-legacy/video-ci-scheduling/SKILL.md` | refs=0 |
| `.claude/skills/_archived/video-legacy/video-dispatch/SKILL.md` | refs=0 |
| `.claude/skills/_archived/video-legacy/video-metrics/SKILL.md` | refs=0 |
| `.claude/skills/_archived/video-legacy/video-policy/SKILL.md` | refs=0 |
| `.claude/skills/_archived/video-legacy/video-transcribe/SKILL.md` | refs=0 |

> 推奨: `_archived/` は「あえて残してある履歴」の可能性。一括削除より「フォルダごと残す or git 履歴に委ねて削除」をあなたが選ぶ。

---

## 4. 🔧 コード関連（Codex GO 必須・本レポートでは提案のみ）

未参照に見える src コード。削除はコード本体変更＝**Codex レビュー GO 後のみ**。今は提案だけ。

| ファイル | 状態（私の検証） | 注意 |
|---|---|---|
| `src/components/LoginForm.tsx` | src 内で被参照0 | Next.js 系（下記 §5 で `react`/`next` が package.json 未宣言＝**未統合 feature の疑い**）。消す前にダッシュボード機能の要否を判断 |
| `src/app/dashboard/page.tsx` | 被参照0 | 同上（Next.js ページ） |
| `src/proxy-mcp/workflow/saga.ts` | 被参照0 | workflow コンポーネント。動的ロードの可能性を要確認 |
| `src/lib/animal-fortune/types.ts` | 被参照0 | 型定義のみ |
| `src/i18n/index.js` | **tracked なビルド生成物**（`index.ts` が正本・両方 tracked・gitignore されていない） | import は `'../i18n'`（ディレクトリ解決）。`dist/` にビルドする方針なら src の `.js` は冗長。**`.gitignore` 追加＋削除**を推奨だがビルド構成の確認が先 |
| `src/proxy-mcp/internal/normalize.ts` | 6関数すべて未呼び出し（normalizeText 他） | デッドコード。要 Codex |
| `src/proxy-mcp/browser/types.ts` | `CaptchaGuardrails`/`DomComponent` 未使用 interface | デッドコード。要 Codex |

> ⚠️ 注意: `mcp-servers/voice-ai-mcp-server/src/tools/send-voice-message.ts` はエージェントが「Tier1」と誤ラベルしたが、**現役ファイル**。中の `_twiml` 未使用変数（行40,43）が指摘されただけ。**ファイル削除候補ではない**（`_` 前置は意図的未使用の慣習でもある）。

---

## 5. 📦 依存関係の整合（PHASE 1-D・情報）

| 領域 | 検出 |
|---|---|
| npm 未使用 | `@prisma/client`（import 0件。ただし `prisma/schema.prisma` 有＝CLI 利用の可能性、削除前に要確認） |
| **npm 未宣言（重要）** | `react`, `next`, `@tanstack/react-query`, `lucide-react`, `next-themes`, `@jest/globals` が **import されているのに package.json 未宣言**。→ `src/app`・`src/components`（ダッシュボード）が**依存未宣言の半統合 feature**である裏付け（§4 と一致） |
| python | requirements.txt 未使用=`jsonschema`,`pytest-cov` / 未宣言=`openai`,`requests` 他（skill 個別 venv の可能性、要確認） |
| tsconfig/jest | 死んだ除外設定: `tsconfig.json:15` の `packages`（不在）, `jest.config.js:30` の `udemy-downloader/.venv`（不在）。無害な孤立設定 |
| MCP | `.mcp.json.example:37` が参照する `mcp-servers/line-bot-mcp-server/dist/index.js` が不在（既知の submodule `D`）。voice-ai/ai-sdr は `dist/` 未ビルド（`npm run build` 未実行） |

---

## 6. ⚠️ 低信頼の孤立候補（「ゴミ」と即断しない・要確認）

エージェントが refs=0 と報告。**文書・スキーマ・履歴は import されないのが正常**なので、未参照＝不要ではない。削除は個別判断。

- **docs（設計/提案文書）**: `docs/AGENT_BROWSER_INTEGRATION_PROPOSAL.md`, `docs/model-routing-system-design-v3.md`, `docs/proposal-v1-cost-optimized-model-routing.md` → 文書。消すより保管が普通
- **debate（議事録・プロジェクト履歴）**: `debate/round1_codex.md`, `round1_opus.md`, `round14_codex.md`, `round3_agreement.md`, `round9_opus.md`, `rounds12-15_summary.md` → 監査証跡。安易に消さない
- **schemas**: `schemas/artifact_manifest.schema.json`, `schemas/memory_update.schema.json` → `$ref`/外部ツール参照の可能性
- **.claude 内部**: `.claude/mcp-tools/file.json`, `.claude/mcp-servers/research-apis.js`, `.claude/includes/extended-thinking.md`, `.claude/reports/context-warehouse-diagnostic-2026-02-15.md` → hook の動的参照を個別確認
- **scripts**: `scripts/optimize-skills.py`（全リポ参照0＝手動運用スクリプトの可能性）
- **未 tracked**: `tests/.tmp`（空ディレクトリ・git 管理外。消しても repo 配布に影響なし）

---

## 7. 📋 情報系（Tier3・提案のみ・削除しない）

- **デッドコード 74件**（top: `.claude/lib/trace-store.ts` 4件 / `src/intent-parser/integrations/hook-integration.ts` 3件 / `voice-ai .../send-voice-message.ts` 3件 ほか）
- **TODO/FIXME/HACK 12件**（`scripts/mistake-to-test.ts` の未実装 TODO 2件 / `it.skip(...OPEN-1)` 系の意図的延期 / agent-source の未実装メモ 等）
- **重複コード疑い 37件**（top: `src/rag/retriever.ts vs grounding.ts` / `src/proxy-mcp/skillize/skillize.ts vs templates.ts` / `src/performance/types.ts vs src/unified-hooks/types.ts` ほか）→ 統合は「提案」であり削除ではない

---

## 8. 推奨アクション

1. **今すぐ安全に着手できる**: §2 の **6件のみ**（バックアップ3＋重複JSON3）。あなたの OK 後、私が explicit pathspec で個別削除→`git diff --stat` 確認→テスト。
2. **§4 のコード**は Codex GO ゲート対象。やるなら別途 Codex レビューを通す。
3. **§3 アーカイブ / §6 文書・履歴**はあなたの製品判断（消すか保管か）。
4. **§5 の「npm 未宣言（react/next 等）」**は別件のバグ。ダッシュボード feature を使うなら package.json に追記、使わないなら §4 と合わせて feature ごと整理。
5. **何も自動削除していない**。次の一手はあなたの指示待ち。

---

*本レポートは Opus 4.8 (1M) が 150-agent READ-ONLY workflow（task `w2sj9cozi`）の結果を、各 false-positive 候補を実コマンドで独立検証（Pattern 7/10）して作成。数値は実測。*
