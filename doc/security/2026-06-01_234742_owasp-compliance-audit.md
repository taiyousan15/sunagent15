# sunagent15 — OWASP 準拠フルコード監査レポート

- **日時**: 2026-06-01 23:47:42 〜 2026-06-02（マルチエージェント・ワークフロー実行）
- **対象**: `github.com/taiyousan15/sunagent15`（branch: main）配布正本
- **基準**: OWASP Top 10 (2021) 全10項目 + OWASP Top 10 for LLM Applications (2025) 全10項目
- **手法**: 186エージェント並列監査（6ゾーン偵察 → 20カテゴリ精査 → 指摘ごとに反証 → 抜け漏れ監査 → 総合判定）+ **メインClaudeによる主要Highの実ファイル独立再検証**
- **コード規模**: tracked 1,210ファイル / 実コード約72,000行（src 32k・scripts 18k・hooks 18k・mcp-servers 4k）

---

## 結論

| 項目 | 判定 |
|---|---|
| **100% OWASP 準拠か?** | ❌ **いいえ（NOT 100%）** |
| **GO / NO-GO** | 🔴 **NO-GO** |
| 推定準拠率 | 約 62% |
| Critical | 0 件 |
| **High** | **3 件（独立再検証済み）** |
| Medium | 約 8–10 件 |
| Low | 約 24 件 |
| Info | 数件 |
| FAIL したカテゴリ | A01 / A04 / A07 / LLM01 / LLM03 / LLM04 / LLM06（7項目） |

OWASP の基準では **High 以上が 1 件でもあれば 100% 準拠とは言えない**。よって現状は不合格（NO-GO）。
ただし最悪の **Critical は 0 件**、秘密情報の `.env` は Git 管理外（漏洩しにくい）であり、修正の方向性は明確。

---

## ⚠️ 監査の正直な但し書き（重要）

1. **検証サブエージェントの一部が構造化出力に失敗**（StructuredOutput未呼び出しが多数）。そのため自動集計の「confirmed 件数」はそのままでは信頼できない。
2. そこで **メインClaudeが最重要のHigh指摘を1件ずつ実ファイルで再検証**した（mistakes.md Pattern 7「エージェント報告の未検証転記」/ Pattern 10「未検証を全件一致と偽る」への対応）。
3. その結果、**エージェントが最重要(P0)として挙げた `taiyou-integration.js` / `miyabi-integration.js` のコマンドインジェクション（RCE）指摘は、sunagent15 には該当ファイルが存在せず誤検知**と判明（旧 `taisun_agent` リポジトリのファイルを混同していた）。→ **本レポートから除外**。
4. `post-to-issue.ts` の「シェルエスケープ不完全」指摘は、本文(body)のエスケープ `'\''` は POSIX 的に正しく、過大評価 → **Low に降格**（残る軽微な穴は owner/repo の未クォートのみ）。

> つまり本レポートの High 3件・主要Mediumは、**私が実コードを開いて目視確認した確定事項**のみ。

---

## スコアカード

### OWASP Top 10 (2021)

| カテゴリ | 判定 | 最悪重大度 | 要点 |
|---|---|---|---|
| A01 アクセス制御の不備 | 🔴 FAIL | Medium | Webhook無認証、Grafana既定パスワード露出 |
| A02 暗号化の失敗 | 🟡 PARTIAL | Low | APIキーをURLクエリで送信（ログ残留） |
| A03 インジェクション | 🟡 PARTIAL | Medium | `ide-integration.js` のeslint実行で `uri` 未サニタイズ（連鎖時に注入） |
| A04 安全でない設計 | 🔴 FAIL | Medium | Webhookに認証設計なし、DB資格情報の直書き |
| A05 セキュリティ設定ミス | 🟡 PARTIAL | Low | 監視スタックが 0.0.0.0 公開＋既定PW |
| A06 脆弱/古い部品 | 🟡 PARTIAL | Medium | npm audit 5件（hono HIGH 等）＋依存の無固定 |
| A07 識別と認証の失敗 | 🔴 FAIL | **High** | Twilio Webhook の署名検証が皆無 |
| A08 ソフト/データ完全性 | 🟡 PARTIAL | Low | install.sh が curl\|bash＋HEAD取得で検証なし |
| A09 ログと監視の失敗 | 🟡 PARTIAL | Info | セキュリティ操作の監査証跡が薄い |
| A10 SSRF | 🟡 PARTIAL | Low | LLM供給URLにスキーム/内部IP遮断なし |

### OWASP Top 10 for LLM Applications (2025)

| カテゴリ | 判定 | 最悪重大度 | 要点 |
|---|---|---|---|
| LLM01 プロンプトインジェクション | 🔴 FAIL | **High** | RSS/ニュース/Web本文を無加工でClaude文脈へ投入 |
| LLM02 機微情報の漏えい | 🟡 PARTIAL | Info | APIキーのURL露出（ログ経由） |
| LLM03 サプライチェーン | 🔴 FAIL | **High** | MCPサーバ18+個を無固定 `npx -y`/`uvx`/`@latest` で起動時取得 |
| LLM04 データ/モデル汚染 | 🔴 FAIL | Medium | 取得Web本文をRAG/メモリへ無検証で永続化 |
| LLM05 不適切な出力処理 | 🟡 PARTIAL | Low | モデル出力がexec/fsへ流れる経路（要堅牢化） |
| LLM06 過剰なエージェンシー | 🔴 FAIL | Medium | `execute_code` 等、人手承認なしで実行可能な道具 |
| LLM07 システムプロンプト漏えい | 🟡 PARTIAL | Info | 重大な埋め込み秘密は未検出 |
| LLM08 ベクトル/埋め込みの弱点 | 🟡 PARTIAL | Low | RAGの信頼レベル区別なし |
| LLM09 誤情報 | 🟡 PARTIAL | Info | 生成レポートの根拠付け不足 |
| LLM10 無制限消費 | 🟡 PARTIAL | Low | Webhook/プロキシにレート制限・上限なし |

---

## 確定 High 指摘（メインClaude再検証済み）

### H1. Twilio Webhook に署名検証が一切ない（A07 / A01）
- **場所**: `mcp-servers/voice-ai-mcp-server/src/webhook/server.ts:41-62`（バインド: `:95`）
- **事実**: `POST /voice` は `_req`（=未使用の意の命名）でリクエストを一切検査せず `openaiClient.createSession()` を実行。`twilio.validateRequest()` / `X-Twilio-Signature` 検証なし。`POST /voice/status` も無認証。サーバは `httpServer.listen(port)` で全インターフェース(0.0.0.0)に待受、レート制限・サイズ上限なし。
- **影響**: ポートに到達できる者が誰でも OpenAI Realtime セッションを生成可能（コスト悪用／Twilioなりすまし／状態詐称）。
- **修正(P0)**: `twilio.validateRequest()` で署名必須化し未署名は403。`127.0.0.1` バインド or 認証付きリバースプロキシ。express-rate-limit ＋ ペイロード上限を追加。

### H2. サプライチェーン: MCPサーバを無固定で起動時取得（LLM03 / A06）
- **場所**: `.mcp.json.example`（line 18 `@playwright/mcp@latest` ほか、`npx -y <pkg>` 約16件・`uvx <pkg>` 複数）
- **事実**: 配布テンプレートが18+個のMCPサーバをバージョン固定なし（`@latest`/無印）で npm/PyPI から実行時に取得。lockfile/integrity ハッシュなし。
- **影響**: 上流パッケージが乗っ取り・タイポスクワットされると、利用者（非技術者含む）のPCで任意コード実行。
- **修正(P0)**: 正確なバージョン（または `@sha`）に固定。SHA256検証付き `install-release.sh` を README の既定手順に。`curl|bash install.sh` は非推奨化 or チェックサム+commit-SHA固定。

### H3. 間接プロンプトインジェクション: 外部本文を無加工でClaude文脈へ（LLM01 / LLM04）
- **場所**: `src/intelligence/report.ts:22-34` ＋ `src/intelligence/collectors/rss-collector.ts:50-85`（同型: `src/proxy-mcp/browser/skills.ts:476-479`）
- **事実**: RSS/Reddit/Twitter/NewsAPI のタイトル・本文を `extractTextFromHtml`（正規表現でタグ除去→エンティティ復号）した後、Markdownレポートへ**そのまま埋め込み**、それをClaudeが読む。攻撃者がフィードに命令文を仕込める。さらにタグ除去→`&lt;`復号の順序により角括弧が再混入し得る。
- **影響**: 悪意あるフィード購読＋当該スキル実行で、Claudeへの指示乗っ取り（間接プロンプトインジェクション）。
- **修正(P1)**: 外部由来テキストを明示デリミタで「データ」として隔離し、命令的マーカーを除去/エスケープしてから出力・保存。復号順序を修正。

---

## 主要 Medium 指摘（抜粋・実ファイル確認済み）

| # | 指摘 | 場所 | カテゴリ |
|---|---|---|---|
| M1 | `ide-integration.js` の `get_diagnostics` で LLM供給 `uri` を `execSync(\`npx eslint ${targetPath}\`)` に直結（プロンプトインジェクションと連鎖でRCE） | `.claude/mcp-servers/ide-integration.js:130-131` | A03 / LLM06 |
| M2 | Grafana 管理者パスワードが既定 `taisun2024`（未設定時に有効）＋ポート全開放 | `docker-compose.monitoring.yml:41` | A05 / A01 |
| M3 | PostgreSQL 資格情報を平文直書き `litellm_password` | `docker-compose.llm.yml:11,42` | A04 / A05 |
| M4 | npm audit: hono(HTMLインジェクションHIGH), ip-address(XSS), express-rate-limit, qs(DoS) | `package.json` / `package-lock.json` | A06 / LLM03 |
| M5 | Skillize が取得Web本文を SKILL.md/RAG へ無検証で書込（データ汚染） | `src/proxy-mcp/skillize/skillize.ts:239` | LLM04 |
| M6 | `web.read_url` が外部DOMテキストを永続メモリへ保存（注入文ごと） | `src/proxy-mcp/browser/skills.ts:138-150` | LLM04 |
| M7 | install.sh が curl\|bash＋HEAD clone で完全性検証なし（既定手順扱い） | `install.sh:16-18,49-51,57-58` | A08 / LLM03 |

---

## 修正優先度（ロードマップ）

**P0（最優先 / High解消）**
1. Webhook 署名検証＋127.0.0.1バインド＋レート制限 — `voice-ai-mcp-server/src/webhook/server.ts`
2. `.mcp.json(.example)` のバージョン固定＋integrity、`install-release.sh`(SHA256検証)を既定化 — `.mcp.json.example` / `install.sh` / `README.md`
3. 外部由来テキストのデリミタ隔離＋命令マーカー除去 — `src/intelligence/report.ts` / `rss-collector.ts` / `browser/skills.ts` / `skillize.ts`

**P1**
4. `execSync`/`exec` のテンプレ文字列を `execFileSync`/`spawnSync`（argv配列・no shell）へ統一し、`key/value/path/uri` を検証/allowlist — `ide-integration.js:130-131` / `post-to-issue.ts:126,162`
5. ハードコード資格情報の撤去（env必須・不安全な既定値廃止・127.0.0.1バインド） — `docker-compose.llm.yml` / `docker-compose.monitoring.yml`

**P2**
6. APIキーをURLクエリ→Authorizationヘッダ/ボディへ。LLM供給URLにスキームallowlist＋内部IP/メタデータ遮断（SSRF） — `intelligence/collectors/*` / `skillize.ts` / `browser/captcha.ts`
7. npm audit 解消（hono/ip-address/qs アップグレード）、`post-to-issue.ts` を argv方式へ、overlay パスのディレクトリ封じ込め — `package.json` / `post-to-issue.ts` / `internal/overlay.ts`

---

## 付録: 完全カバレッジの確認

- 偵察6ゾーン × 20 OWASPカテゴリで全 tracked コードを走査。抜け漏れ監査官が「未走査の高リスクファイル」「カバレッジ薄のカテゴリ」を再確認し、ギャップは追補監査で補完。
- **誤検知の除去**: `taiyou-integration.js`/`miyabi-integration.js`（旧リポジトリのファイル、sunagent15 に不在）を全件除外。`post-to-issue.ts` の本文エスケープ指摘を Low に降格。
- **良い点**: Critical 0件 / `.env` Git管理外 / `eval`・`yaml.load` 不使用 / `supervisor/github.ts` は `spawnSync(argv)` の安全実装。

> 次段階（コード修正）に進む場合は、プロジェクト規約に従い Codex の AGREE ゲートを通してから実行する。

---

## 追補: Codex（gpt-5.4）クロスチェックによる重大度較正（2026-06-02）

別ベンダーAI Codex の独立検証＋メインClaudeの再検証により、**核心結論（NOT 100% / NO-GO）は一致**のうえ、重大度を以下に較正した（詳細: `doc/CODEXレビュー/2026-06-02_004951_codex-crosscheck-owasp-audit.md`）：

- **ide-integration.js:130-131 を Medium → 「有効化時 High」へ格上げ**（Codex が監査の過小評価を是正。`get_diagnostics` の `uri` を `execSync(npx eslint ${targetPath})` に無サニタイズ投入＝RCEシンク）。
- **Webhook無認証（H1）は「有効化+公開時 High / 既定 Medium」へ較正**（voice-ai は `.mcp.json.example` で `disabled:true` を確認＝既定非起動）。
- **RSS間接プロンプトインジェクション（H3）は High → Medium へ降格**（直接実行シンクなし）。
- **既定で有効な確定 High はサプライチェーン無固定（C2）の1件**。Webhook / ide-integration は opt-in（有効化時 High）。
- post-to-issue は Low 維持（`${title}` も未エスケープだが repo 管理値）。taiyou/miyabi 除外は Codex も妥当と確認。
