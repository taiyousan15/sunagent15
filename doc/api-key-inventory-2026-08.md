# APIキー棚卸し表（2026-08-14 / Rev.2）— Phase 1 / FR-17

**Rev.2 改訂メモ（監査証跡）**: 初版はコード参照数の計測に (a) word境界なしの部分一致 (b) `.claude/hooks/data/`（実行時ログ・変数名が記録される）の混入、という2つの手法欠陥があり、Codexクロス検証（PR-3ゲート）で検出された。本版は下記の固定手法で全48変数を再計測済み。あわせて分類（31/17）・証拠飛躍2件（GITHUB_TOKEN / BRAVE_API_KEY）・料金出典・APIFY表記揺れを是正した。

**作成方針（Codex PR-3ゲート条件準拠）**:
- 対象 = `.env.example` の**全48代入変数**（credential系31 + 設定値・フラグ系17）
- **キーの値・prefixは絶対に記載しない**（gitleaksスキャン済み）
- 死活は**本セッション(2026-08-14)のパイプライン実行ログで「当該変数そのものの使用」が実証された事実のみ**。別経路の成功（例: ghコマンドの独自credential store）は当該変数の証拠にしない
- **コード参照の固定計測手法**: `rg -l -w --no-ignore -g '!**/node_modules/**' -g '!**/data/**' "<VAR>" src scripts .claude/hooks .claude/mcp-servers mcp-servers .claude/skills` のヒットファイル数（2026-08-14実測）
- 料金は**一次情報URL+確認日があるもののみ**記載し、それ以外は「—（未調査）」と明記（推測・孫引き禁止）。リサーチ済みツール群の料金53行は `research/cost_breakdown.csv` に別管理

凡例 — 種別: 🔑credential / 🔧設定値 / 🚩flag / 🆔識別子。死活: ✅生存実証 / ❌失効実証 / ➖未確認

## 1. credential系（31変数）

| 変数名 | 種別 | 用途 | コード参照 | 死活（2026-08-14） | 料金（出典URL・確認日） |
|---|---|---|---:|---|---|
| ANTHROPIC_API_KEY | 🔑 | Claude API推論 | 14 | ➖ env未設定（サブスク認証で運用中） | —（未調査） |
| OPENAI_API_KEY | 🔑 | GPT系API | 8 | ➖ 未確認 | — |
| OPENROUTER_API_KEY | 🔑 | マルチモデルゲートウェイ（QA Gate等） | 9 | ❌ **失効実証**（401 "User not found"×18回・qa_gate.mjsログ） | 上乗せなし・入金手数料Stripe5.5%（openrouter.ai/docs/faq・2026-08-14） |
| GROQ_API_KEY | 🔑 | 高速推論（バッチ処理） | 2 | ➖ 設定ありだが本セッション未使用 | — |
| GOOGLE_API_KEY | 🔑 | Gemini系API | 1 | ➖ 未確認 | — |
| MINIMAX_API_KEY | 🔑 | コード生成特化LLM | **0** | ➖ 未確認（参照0＝未使用の疑い） | — |
| TAVILY_API_KEY | 🔑 | AI検索（リサーチ系スキル） | 10 | ✅ **生存実証**（Pass1.5で10クエリ成功） | Researcher 1,000クレジット/月無料（tavily.com/pricing・2026-08-14） |
| SERPAPI_KEY | 🔑 | Google検索結果取得 | 9 | ❌ **失効実証**（401 Invalid API key×4回） | — |
| BRAVE_SEARCH_API_KEY | 🔑 | Web検索 | 6 | ✅ **生存実証**（10クエリ成功） | 月$5無料クレジット（brave.com/search/api・2026-08-14） |
| NEWSAPI_KEY | 🔑 | ニュース集約 | 11 | ✅ **生存実証**（3クエリ成功） | —（未調査） |
| PERPLEXITY_API_KEY | 🔑 | AI検索+要約 | 9 | ✅ **生存実証**（sonar 4クエリ成功） | 無料枠なし・Low $5/1k req（docs.perplexity.ai/getting-started/pricing・2026-08-14） |
| REDDIT_CLIENT_ID | 🔑 | Reddit OAuth | 1 | ➖ 未確認（本調査の403はOAuth未使用経路のためこのキーの死活とは無関係） | —（未調査） |
| REDDIT_CLIENT_SECRET | 🔑 | 同上 | 1 | ➖ 未確認 | —（未調査） |
| FIGMA_API_KEY | 🔑 | Figma MCP | 1 | ➖ 未確認 | — |
| GITHUB_TOKEN | 🔑 | GitHub API/MCP | 7 | ➖ **未確認**（Agent Cの `gh api` 成功はghの独自credential storeの生存証拠であり、`.env` の本変数の証拠にはならない — Rev.2で✅から訂正） | —（未調査） |
| NOTION_API_KEY | 🔑 | Notion連携 | 2 | ➖ 未確認 | — |
| SLACK_BOT_TOKEN | 🔑 | Slack Bot | 1 | ➖ 未確認 | — |
| BRAVE_API_KEY | 🔑 | Brave検索（重複定義） | 8 | ➖ **未確認**（BRAVE_SEARCH_API_KEYの成功は別変数の証拠にならない — Rev.2で訂正。コードは両変数を参照しており統一が必要） | 同Brave |
| FISH_AUDIO_API_KEY | 🔑 | TTS | 2 | ➖ 未確認 | — |
| N8N_API_KEY | 🔑 | n8n API | **0** | ➖ 未確認（参照0） | — |
| TWITTER_COOKIES | 🔑 | X Cookie認証 | 5 | ➖ 未確認（PRE-FLIGHTで未設定を確認） | —（未調査） |
| TWILIO_ACCOUNT_SID | 🔑 | 電話API | 4 | ➖ 未確認 | — |
| TWILIO_AUTH_TOKEN | 🔑 | 同上 | 5 | ➖ 未確認 | — |
| OPENAI_REALTIME_API_KEY | 🔑 | 音声AI | 4 | ➖ 未確認 | — |
| FIRECRAWL_API_KEY | 🔑 | スクレイピング | 4 | ➖ env未設定（Pass2でスキップを記録） | Free 1,000クレジット/月（firecrawl.dev/pricing・2026-08-14） |
| BROWSERBASE_API_KEY | 🔑 | AIブラウザ操作 | 1 | ➖ 未確認 | —（.env.exampleコメントに記載あるが一次URL未確認のため未採用） |
| BROWSERBASE_PROJECT_ID | 🆔 | 同上ペア | 1 | ➖ 未確認 | — |
| SKYVERN_API_KEY | 🔑 | RPA | **0** | ➖ 未確認（参照0） | — |
| POSTGRES_MCP_DSN | 🔑 | DB接続文字列(RO) | 2 | ➖ 未確認 | — |
| POSTGRES_MCP_DSN_RW | 🔑 | DB接続文字列(RW) | 1 | ➖ 未確認 | — |
| APPRISE_URLS | 🔑 | 通知webhook URL群（**Slack/Discord webhookはURL自体がcredential** — Rev.2で設定値から移動） | **0** | ➖ 未確認（参照0） | — |

## 2. 設定値・フラグ系（17変数）

| 変数名 | 種別 | 用途 | コード参照 | 備考 |
|---|---|---|---:|---|
| PROJECT_NAME | 🔧 | プロジェクト名 | **0** | 参照0（Rev.2訂正: 初版の「2」はdata/ログ混入） |
| PROJECT_ROOT | 🔧 | ルートパス | 25 | — |
| QDRANT_URL / QDRANT_COLLECTION_NAME | 🔧 | ベクタDB | 1 / 1 | ローカル |
| SLACK_TEAM_ID | 🆔 | Slack | 1 | — |
| FISH_AUDIO_MODEL_ID | 🆔 | TTSモデル | 1 | — |
| N8N_API_URL | 🔧 | n8n | 1 | — |
| TRIVY_CACHE_DIR | 🔧 | Trivyキャッシュ | **0** | 参照0（npm script内で直接実行） |
| GOTENBERG_URL | 🔧 | 文書変換 | 2 | — |
| TWILIO_PHONE_NUMBER | 🆔 | 電話番号 | 4 | — |
| OPENAI_REALTIME_MODEL | 🔧 | モデル名 | 2 | — |
| VOICE_WEBHOOK_PORT / VOICE_WEBHOOK_BASE_URL | 🔧 | 音声webhook | 2 / 2 | — |
| ENABLE_MULTI_AGENT_MODE / ENABLE_OMEGA_OPTIMIZATION / ENABLE_LEARNING_SYSTEM / ENABLE_MCP_HEALTH_CHECK | 🚩 | feature flag | 0/0/0/0 | **4種全て参照0** — 飾りフラグの疑い。Phase 2で削除候補 |

## 3. 発見事項

1. **`.env.example` 未記載だがスキルが必要キーとして参照する変数8種**: `EXA_API_KEY`（✅本セッション5クエリ成功実証・**設定済みなのに未文書化**）/ `ALPHA_VANTAGE_API_KEY`（設定あり・未使用）/ `XAI_API_KEY` / `FRED_API_KEY` / `X_BEARER_TOKEN` / `TWITTER_AUTH_TOKEN` / `TWITTER_CT0` / APIFY系（下記4参照）→ **Phase 2で .env.example への追記を推奨**
2. **失効2件（SERPAPI / OPENROUTER）の再発行はユーザー作業**（FR-15/16）。**本PR-3マージをもってFR-15/16を完了扱いにしない**
3. コード参照0の変数は**10変数**（単独6: MINIMAX_API_KEY / N8N_API_KEY / SKYVERN_API_KEY / APPRISE_URLS / TRIVY_CACHE_DIR / PROJECT_NAME + feature flag 4: ENABLE_MULTI_AGENT_MODE / ENABLE_OMEGA_OPTIMIZATION / ENABLE_LEARNING_SYSTEM / ENABLE_MCP_HEALTH_CHECK）— 次回クリーンアップ候補
4. **APIFY変数の表記揺れ**（Rev.2追加・Codex検出）: research-system SKILL.md の frontmatter は `APIFY_API_TOKEN`、本文の必要キー表は `APIFY_TOKEN` と**同一ファイル内で不一致**。どちらが正規名かの決定を含めPhase 2で統一要
5. **BRAVE_SEARCH_API_KEY / BRAVE_API_KEY の重複定義**: コードは両方を参照（6/8ファイル）— 統一候補

## 4. 月次運用ルール

- 死活の定期確認は「実行ログからの実証」方式を維持（監視目的での実キー疎通テストを新設しない）
- 本表の更新時は §冒頭の**固定計測コマンド**で再計測し、gitleaks単体スキャン + キー値・prefix不記載の人手確認を必須とする（guardrails.md G4）
