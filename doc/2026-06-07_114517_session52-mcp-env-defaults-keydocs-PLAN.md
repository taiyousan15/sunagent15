# 実装計画書: MCP bare ${VAR} parse-safe 化 + APIキー導線 docs 整合 + CI guard

- **日時**: 2026-06-07 / session 52 / Opus 4.8 (ultracode)
- **対象 repo**: `taiyousan15/sunagent15`（PUBLIC・配布正本、base = origin/main `55cf100`）
- **起点**: 配布監査レポート `doc/2026-06-07_055551_distribution-audit-sunagent15.md` §3（最優先・実害）
- **ユーザー承認済み方針**: (1) MCP既定 = **B「課金系のみ既定OFF」**、(2) docs = **「矛盾解消に限定」**（広域同期は task6 へ分離）
- **位置づけ**: 本書は Codex 実装前ゲート用の SSoT。GO 後に実装、実装後ゲート GO + Opus 再検証を経て明示パス commit。

---

## 0. 確定した仕様（公式ドキュメント裏取り済み・推測なし）

| # | 事実 | 出典 |
|---|------|------|
| Q1 | `.mcp.json` 内の bare `${VAR}`（`:-` 既定値なし）が未設定だと **ファイル全体の parse に失敗**＝**全 MCP サーバーが無効**（1サーバーだけ skip ではない） | code.claude.com/docs/en/mcp.md |
| Q2 | `"disabled": true` のサーバーで env 展開が skip されるかは **公式に未記載** → disabled 含め全 bare `${VAR}` を直すのが安全 | mcp.md（記載なし＝inferred） |
| Q3 | `${VAR:-default}` / `${VAR:-}`（空既定）は **公式サポート**された正式構文 | mcp.md |
| Q4 | Claude Code はプロジェクト `.env` を**自動で読まない**（ANTHROPIC_API_KEY も MCP キーも）。シェル export / `~/.claude/settings.json` env / `/login` のいずれかが必要 | code.claude.com/docs/en/authentication.md ＋ 本repo `docs/API_KEY_TROUBLESHOOTING.md:92,247-248` |

**実害の確証**: `scripts/install.sh:522-524` が `.mcp.json.example` を **verbatim コピー**して `.mcp.json` を生成 → bare `${VAR}` が新規ユーザーに出荷 → キー未export の新規ユーザーは **コア無料MCP(taisun-proxy/playwright/sequential-thinking)まで含め全MCP無効**。

**補足（Part2 の精度）**: `.env` は本repoの一部が実際に読む（`src/intelligence/index.ts` dotenv / `scripts/mcp-health-check.{sh,js}` / `scripts/setup-sdd.sh`）。よって docs 修正は「.env を消せ」ではなく「**Claude Code 認証と MCP キーは .env では効かない**」と精密に書く（過剰主張＝Pattern 10 を回避）。

---

## Part 1: MCP 設定の parse-safe 化 + 課金系既定OFF

### 方針
1. 全 `*.mcp.json` の bare `${VAR}` → `${VAR:-}`（空既定）に置換。これで Q1 の全体 parse 破綻を解消。
2. `.mcp.json.example` のみ、**現在 enabled かつ `cost_warning:true`** のサーバーを `disabled:false → true` に flip（Decision B）。
3. presets は明示選択プロファイルのため `:-` 付与のみ（disabled 変更なし）。

### 1a. `.mcp.json.example`（全 bare `${VAR}` → `:-}`、4サーバー flip）

| server | env/args 置換 | disabled |
|--------|---------------|----------|
| line-bot | CHANNEL_ACCESS_TOKEN, DESTINATION_USER_ID → `:-}` | true（変更なし） |
| voice-ai | TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER, OPENAI_REALTIME_API_KEY/MODEL, VOICE_WEBHOOK_PORT/BASE_URL → `:-}` | true（変更なし） |
| **gpt-researcher** | OPENAI_API_KEY, TAVILY_API_KEY → `:-}` | **false → true** |
| figma | args `--figma-api-key=${FIGMA_API_KEY:-}` | false（維持） |
| **apify** | APIFY_API_TOKEN → `:-}` | **false → true** |
| **tavily** | TAVILY_API_KEY → `:-}` | **false → true** |
| meta-ads | META_ACCESS_TOKEN/META_APP_SECRET/META_AD_ACCOUNT_ID → `:-}` | false（維持※） |
| obsidian | OBSIDIAN_API_KEY → `:-}` | false（維持） |
| twitter-client | TWITTER_COOKIES → `:-}` | false（維持） |
| **firecrawl** | FIRECRAWL_API_KEY → `:-}` | **false → true** |
| stagehand | BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID → `:-}` | false（維持） |
| skyvern | SKYVERN_API_KEY → `:-}` | true（変更なし） |

- flip 対象＝**gpt-researcher / apify / tavily / firecrawl の4つだけ**（voice-ai/skyvern は cost_warning:true だが既に disabled）。
- ※ meta-ads は `cost_warning:false`。API呼出は無料、広告費は明示操作時のみ＝メータ課金ではない。かつキー未設定（`:-}` 空）では認証失敗で何も実行不可＝誤課金しない。よって figma/obsidian 等と同じ「非メータ・キー要・enabled 維持」に分類。
- 既に安全な箇所は触らない: qdrant（`${QDRANT_URL:-http://localhost:6333}` 等は `:-` 既定あり）/ chroma・mcp-memory-service（リテラル値）。

### 1b. presets（`:-}` のみ・disabled 変更なし）
- `mcp-presets/full-optimized.mcp.json`: gpt-researcher(OPENAI/TAVILY), figma(args), apify(APIFY), tavily(TAVILY)
- `mcp-presets/image.mcp.json`: figma(args)
- `mcp-presets/research.mcp.json`: gpt-researcher(OPENAI/TAVILY), apify(APIFY), tavily(TAVILY)
- `development / marketing / video`: bare `${VAR}` なし → 変更なし

---

## Part 2: APIキー導線 docs 整合（scope: install.sh + API_KEY_TROUBLESHOOTING.md のみ）

### 2a. `scripts/install.sh`
- **L538-554（.env 新規作成ブロック）**: 「.env に ANTHROPIC_API_KEY を入れれば動く」案内を訂正。新文言の要点:
  - 最も簡単な経路＝Claude Code 起動 → `/login`（サブスクリプション）。APIキー不要で動く。
  - APIキーを使う場合: **`.env` に書くだけでは Claude Code は読み込まない**。`~/.zshrc` に `export ANTHROPIC_API_KEY=...` するか `~/.claude/settings.json` の `env` に設定する。
  - リサーチ/MCP系キー(TAVILY/OPENAI等)も同様に `~/.claude/settings.json` env かシェル export（`.mcp.json` の `${VAR}` はシェル環境から展開・`.env` 不可）。詳細は `docs/API_KEY_TROUBLESHOOTING.md`。
  - 有料MCP(gpt-researcher/tavily/apify/firecrawl)は**既定OFF**。使う時は `.mcp.json` で該当サーバーを `"disabled": false` にしてキー設定。
  - `.env` 自体は一部スクリプト/機能が使うため作成は維持。
- **L558-563（.env 既存ブロック）**: warn 文言を「.env を開いて設定」→「`/login` か `~/.claude/settings.json`/シェル export」に訂正。
- **L695-697（完了バナー step 1️⃣）**: 「.env に ANTHROPIC_API_KEY」→「Claude Code を起動して `/login`、または `~/.claude/settings.json`/シェルに ANTHROPIC_API_KEY を設定」に訂正。

### 2b. `docs/API_KEY_TROUBLESHOOTING.md`（Codex F1 反映・要修正）
- **L92 の不正確記述を訂正（必須）**: 現状 L92「`.mcp.json`の環境変数展開（`${VAR}`）がMCPサブプロセスで機能しない」は誤り。実際は Claude Code が `${VAR}` を**自身の環境(シェル export / `~/.claude/settings.json` env)から展開**して MCP サブプロセスに渡す（だから解決策A/Bが効く＝L92 は自己矛盾）。正しい原因へ書換え:
  - 「Claude Code は `${VAR}` を**シェル/`~/.claude/settings.json` の環境変数から展開**する。プロジェクト `.env` は**自動読込しない**ため、`.env` だけにキーを書くと展開元が無く空になる。さらに `:-` 既定値の無い bare `${VAR}` が未設定だと `.mcp.json` 全体が parse 失敗する（→ 本PRで `:-}` を付与済み）。」
- Part1 の「有料MCP(gpt-researcher/tavily/apify/firecrawl)は既定OFF・使う時 `disabled:false`」を1ブロック追記。
- 出典: code.claude.com/docs/en/mcp ・/env-vars ・/authentication。

### scope外（task6 へ分離・本PRでは触らない）
- README / INSTALL.md / docs/QUICK_START.md / docs/getting-started-ja.md のキー設定節・数値同期
- `.env.example` の変更

---

## Part 3: CI 再発防止ガード

### 新規 `tests/unit/mcp-config-env-defaults.test.ts`
- 対象: `.mcp.json.example` + `mcp-presets/*.mcp.json`（リポジトリルートから fs で読む）
- 検証:
  1. 各ファイルが **valid JSON**（JSON.parse 成功）。
  2. 各 server の `env` 値 + `args` 文字列を走査。**placeholder 単位**で判定（Codex F2 反映）: 各文字列に `/\$\{([^}]+)\}/g` を適用し、**マッチした placeholder の内側 token に `:-` を含まないもの**を**検出したら fail**（file/server/var を列挙）。※ 文字列レベルの `includes(':-')` は不可（`"${A}${B:-}"` の `${A}` を見逃すため）。
- 配置理由: `jest.config.js` の `unit` project testMatch = `tests/unit/**/*.test.ts` → CI の `npx jest --coverage`（全projects）で自動実行。src/** 対象外ゆえ coverage 閾値に影響なし。

---

## テスト計画（実装後に実コマンドで実行・Pattern 7/10）
1. `python3 -c "import json; ..."` で編集した全 `*.mcp.json` を parse → valid JSON 確認。
2. 新テストが **修正前は RED（違反検出）/ 修正後は GREEN** を確認（ガードが機能する証明）。
3. `npx jest --selectProjects unit --testPathPattern=mcp-config-env-defaults` → green。
4. `npx jest`（standard projects）→ 既存リグレッションなし。
5. `bash -n scripts/install.sh` → 構文OK。
6. `npx tsc --noEmit` → 0（新 .ts テストのコンパイル）。
7. CI は push 後 `gh pr checks` で実確認（緑と推測しない）。

## ゲート / commit 方針
- branch: origin/main(`55cf100`) から `fix/mcp-env-defaults-keydocs` を新規作成（PR #30/#31 と独立）。
- **明示パスのみ** commit:
  - `.mcp.json.example`
  - `mcp-presets/full-optimized.mcp.json` / `mcp-presets/image.mcp.json` / `mcp-presets/research.mcp.json`
  - `scripts/install.sh`
  - `docs/API_KEY_TROUBLESHOOTING.md`（編集時のみ）
  - `tests/unit/mcp-config-env-defaults.test.ts`
  - `doc/2026-06-07_114517_session52-…-PLAN.md` + `doc/CODEXレビュー/…`（記録）
- **禁止**: `git add -A` / `git add -u`。未コミット削除3件（settings.json.backup / google-auth-system / mcp-servers/line-bot-mcp-server）は絶対混ぜない（Pattern 11）。
- フロー: Codex 実装前GO → 実装 → 上記テスト → Codex 実装後GO → Opus 独立再検証 → commit → push → PR 作成（**マージはユーザー判断**）。

## リスク / 未確定点（Codex に重点確認依頼）
- Q2（disabled サーバーの env 展開）未文書化 → 全 bare var を直すので結論に依らず安全。
- meta-ads を enabled 維持の判断（cost_warning:false・キー空で誤課金不可）が妥当か。
- presets で課金系 enabled を維持（明示 opt-in profile）方針が妥当か。
- enabled 維持の非メータ・キー要サーバー（figma/meta-ads/obsidian/twitter-client/stagehand）はキー未設定ユーザーで「使った時に失敗」する＝UX 上の許容範囲か（docs で緩和）。
- `${VAR:-}` 空既定が figma の `args` 連結（`--figma-api-key=`）で MCP 起動に副作用を起こさないか（disabled でないため）。
