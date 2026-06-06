# sunagent15 コード監査 ラウンド2 — 削除/修正 最終判定

- **対象**: `/Users/matsumototoshihiko/Desktop/dev04/sunagent15`（branch `main` / HEAD `fd8cb15`）
- **前提レポート**: `doc/コード監査/2026-06-01_114830_sunagent15-code-audit.md`（ラウンド1・全体スキャン）
- **手法**: ラウンド1の93候補に対し **138体の READ-ONLY 敵対的調査**（candidate verdict → refute pass → fix investigation）。全 agent `Explore` 型（Edit/Write ツール非保持）。**何も削除・修正していない**。
- **ラウンド2 集計（実測）**: 93候補 → 確定削除 8 / 反証で却下 24 / KEEP 55 / FIX推奨 6 ＋ fix調査13体。
- **重要**: 以下は Opus が各確定候補を**実コマンドで独立再検証（Pattern 7/10）**した最終判定。**コード/スクリプトの削除・修正は codex.md ゲート対象（Codex GO 後のみ実行）。**

---

## 0. 結論（高校生にも分かる言葉で）

「150体 → さらに138体」の二段調査と、私の手作業チェックを重ねた結果：

- **今すぐ安全に消せるのは実質「1件」**（古いバックアップ1個）。
- **コードの孤立っぽいファイル4件**は「消すなら Codex の確認後」。うち2件は**消さない方が良い**（将来用に温存／争点あり）。
- むしろ価値が高いのは「**消すより直すべき**」発見——**壊れたスクリプト1件**、**中身が空っぽの偽テスト 約42件**、**未宣言の依存パッケージ群**。
- 2回の敵対的調査が、私自身の早合点（ラウンド1の「安全6件」）の**4件を正しく却下**してくれた。

→ **乱暴な一括削除はしない**。下の分類で、あなたが「やる/やらない」を選んでください。

---

## 1. ✅ 今すぐ消せる（非コード・低リスク・あなたのOKで実行）

| ファイル | 検証（Opus 実測） | 種別 |
|---|---|---|
| `.claude/settings.json.backup-20260214-200209` | 現役 `settings.json` の古い控え（73%小・別内容）。全リポで被参照0（`grep backup-20260214` =0） | バックアップ |

> これだけは `git rm` → `git diff --stat` 確認まで、あなたの OK があれば安全に実行可能（commit はせず確認を仰ぐ）。

---

## 2. 🗂 あなたの製品判断（アーカイブ・消すか保管か）

| ファイル | 状況 |
|---|---|
| `.claude/skills/_archived/video-legacy/video-ci-scheduling/SKILL.md` | 後継 `video-agent` に統合・archive外 被参照0。ただし「あえて残す履歴」の可能性 |

> ⚠️ **`_archived/` の一括削除は禁物**。他の archived（lp-generator/manga-production/sales-letter 等）は**反証で却下**＝docs や現役スキルから参照あり（例: `ai-manga-generator/instructions.md:114` が manga-production を参照）。消すなら1件ずつ「後継に完全統合済みか」を確認。

---

## 3. 🔧 コード（削除は Codex GO 必須・本レポートは提案のみ）

| ファイル | Opus 検証 | 判定 |
|---|---|---|
| `scripts/headless/claude-ci.sh` | 被参照0（Makefile/CI/package.json/docs/他script すべて0） | Codex 確認の上で削除候補 |
| `src/lib/animal-fortune/types.ts` | 被参照0 | Codex 確認の上で削除候補 |
| `src/proxy-mcp/workflow/saga.ts` | 被参照0（`saga` の他ヒットは agent-source の一般論のみ。現役 `workflow/engine.ts` とは別物） | Codex 確認の上で削除候補 |
| ⚠️ `src/intelligence/scheduler.ts` | **争点**: verdict=削除 だが dead-code agent=KEEP。私の grep では import 参照0・cron/launchd 登録なし | **Codex で確定**（即断しない） |
| ⛔ `src/proxy-mcp/internal/normalize.ts` | `jest.config.js:15` が `// future embedding utilities` として**意図的にカバレッジ除外＝将来用に温存** | **削除しない**（KEEP 推奨） |

---

## 4. 🛠 削除でなく「修正(FIX)」すべき — 価値が高い発見

### 4-A. 実バグ（Opus 確認済み）
- **`scripts/list-agents.js:41` 構文エラー**: オブジェクトリテラルに**空キー `: [],`** が在り、実行すると SyntaxError。→ 該当行を修正（要 Codex GO）。

### 4-B. 中身ゼロの「偽テスト」（jest で通るが何も検証していない＝誤った安心感）
| ファイル | 実測 |
|---|---|
| `tests/unit/unified-hooks/orchestrator.test.ts` | `it()` 22件すべてが `expect(true).toBe(true)` |
| `tests/unit/unified-hooks/layer-4-observability.test.ts` | `it()` 20件すべてが `expect(true).toBe(true)` |
| （ほか layer-3-security-gate.test.ts / types.test.ts / model-auto-switch.test.js 等にも placeholder 混在） |

> これらは `jest.config.js:46 tests/unit/**/*.test.ts` で集計に乗る。**実装する（FIX）か、誤解を招くので削除するか**を判断。約42件のダミー assertion。

### 4-C. 未宣言の npm 依存（ダッシュボード feature が現状インストール不能）
`react`, `next`, `next-themes`, `@tanstack/react-query`, `lucide-react`（16ファイルで使用）, `@jest/globals` が **import されているのに package.json 未宣言**。
→ **判断**: `src/app`・`src/components`（Next.js ダッシュボード）を使うなら **package.json に追加(FIX)**、使わないなら **feature ごと整理**（§3 の LoginForm/dashboard も連動）。

### 4-D. その他の修正候補
| 対象 | 推奨 |
|---|---|
| `src/i18n/index.js`（index.ts のビルド生成物が tracked） | `.gitignore` 追加＋git 管理から外す |
| `tsconfig.json:15` の `packages` 除外（不在ディレクトリ） | 死んだ設定を除去 |
| `jest.config.js:30` の `udemy-downloader/.venv`（不在） | 同上 |
| `mcp-servers/voice-ai-mcp-server/src/tools/send-voice-message.ts:40,43` の未使用 `_twiml` | 除去（`_`前置は意図的未使用慣習でもある→任意） |
| `@prisma/client`（import 0・`prisma/schema.prisma` は存在） | CLI 専用利用か確認の上、未使用なら package.json から除去 |

---

## 5. 🛡 反証パスが「救った」24件（消さなくて正解だったもの）

ラウンド1で削除寄りに見えたが、敵対的反証で**KEEP/FIX に覆った**主なもの（私の早合点を含む）:

- `config/workflows/examples/{content_creation_v1,priority_based_v1,software_development_v1}.json` … **`config/workflows/examples/README.md` が教材として明示参照**（私のラウンド1 grep は `/examples/` を除外して見落としていた）→ 削除不可
- `.claude/hooks/mistakes.md.backup.20260329` / `.claude/settings.json.backup` … 削除より **gitignore 整理**が適切
- `.claude/skills/_archived/{lp-generator,manga-production,sales-letter}/SKILL.md` … docs/現役スキルから参照あり
- `src/proxy-mcp/{router/types.ts, internal/registry.ts, skillize/skillize.ts, workflow/engine.ts, browser/types.ts}` … 複数の現役ファイルから import（誤検出）
- `tests/test_memory_bank_roundtrip.py` 他テスト … pytest/jest が規約発見＝現役
- `schemas/*.schema.json` … schema は import されないのが正常

### 私の検証で訂正したエージェント誤り（FIX 調査側）
- `.claude/hooks/cost-warning.js`「ESM で壊れている」→ **誤り**。実際は `module.exports`（CommonJS）で正常。
- `.claude/commands/develop-migration.md`「空 stub・削除」→ **誤り**。他コマンドと同形の薄い委譲コマンドで正常 → KEEP。

---

## 6. 推奨アクション（あなたの選択待ち・無断実行しない）

1. **即実行可（あなたの OK のみ）**: §1 の **1件** を `git rm` →差分確認（commit はせず確認）。
2. **Codex GO 後**: §3 のコード削除（claude-ci.sh / animal-fortune/types.ts / saga.ts、＋ scheduler.ts は Codex で確定）。normalize.ts は KEEP。
3. **FIX（要 Codex GO・コード変更）**: §4-A 実バグ修正 → §4-B 偽テストの実装 or 削除 → §4-C 依存の追加/整理 → §4-D。
4. **製品判断**: §2 のアーカイブ skill を消すか保管するか。
5. **触らない**: §5 の24件 ＋ submodule `D` 2件（Pattern11）。

> 数値は二段 workflow（task `w2sj9cozi` / `wocf3rwel`、計288 agent）の結果を Opus が実コマンドで再検証して確定。何も削除・修正していない。
