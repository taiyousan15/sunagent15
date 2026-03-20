# Web自動操作ツール調査レポート（最終版）
## Playwright/Firecrawlを超えるブラウザ自動化スタック提案

**調査日**: 2026-03-12 | **調査エージェント**: A×2 + B×2 + C×2 + intelligence-research
**SUPER_PROMPT v2.2 準拠**

---

## 1. エグゼクティブサマリー

2026年3月時点でのWeb自動操作市場は「スクリプトベース」から「LLMが自律判断するエージェント」への質的転換が確認された。

**主要発見:**
| 発見 | 内容 |
|------|------|
| 業界スタンダード | **browser-use**（Python, ~80k stars）が最速成長OSS |
| TypeScript最適解 | **Stagehand v3**（CDP移行・MCP公式・auto-caching） |
| MCP標準化 | MCP SDKが月9,700万DL、ブラウザ自動化の標準プロトコルに |
| 3層設計確立 | Playwright(80%) + AI層(20%) + Firecrawl が業界コンセンサス |
| Skyvern特筆 | YC出身、**2FA/TOTP/CAPTCHA対応**、Zapier/Make/N8N連携、MCP公式 |
| 法的リスク | Amazon vs Perplexity Comet訴訟（2026年1月）でエージェント操作の法的グレーゾーン顕在化 |

**推奨**: Stagehand MCP + Skyvern MCP の両方を追加。TAISUNの自動操作能力が質的に向上。

---

## 2. ツール比較マトリクス（全4エージェント統合）

### 総合評価表

| ツール | Stars | 言語 | MCP | 2FA/CAPTCHA | AI統合 | コスト | TAISUN適合 |
|--------|-------|------|-----|------------|--------|--------|-----------|
| **browser-use** | ~80k | Python | あり | 部分対応 | 完全自律 | LLM課金のみ | ★★★☆（Python壁） |
| **Stagehand v3** | ~21.5k | TypeScript | **公式** | なし | AI+確定的 | LLM+Browserbase | **★★★★★** |
| **Skyvern** | ~20k | Python | **公式** | **完全対応** | LLM+Vision | $29〜/月 | ★★★★☆ |
| Playwright MCP | 公式 | TS/JS | **ネイティブ** | なし | なし（Claude連携） | $0 | **既存統合済** |
| Computer Use | n/a | any | Claude API | 対応 | 最大汎用 | API課金 | ★★☆（隔離必要） |
| agent-browser | 14k | Rust | あり | なし | あり | $0 OSS | ★★★（CLI） |

### 機能比較（詳細）

| 機能 | Playwright | Firecrawl | Stagehand | browser-use | Skyvern |
|------|----------|-----------|----------|------------|---------|
| ボタンクリック | セレクタ必須 | ✗ | **自然言語** | **自然言語** | **Vision** |
| フォーム入力 | セレクタ必須 | ✗ | **自然言語** | **自然言語** | **自然言語** |
| URL収集・クロール | 可 | **最強** | 可 | 可 | 可 |
| ログイン・認証 | コード必須 | ✗ | 可 | **自律** | **2FA/TOTP/CAPTCHA** |
| レイアウト変更耐性 | 低 | n/a | **中〜高** | **高** | **最高（Vision）** |
| 速度 | **最速** | **最速** | 中（キャッシュ後速） | 低 | 低 |
| LLMコスト | $0 | $0 | 中 | 高 | 中 |

---

## 3. 各ツール詳細

### browser-use（自律エージェントの王者）
- **Stars**: ~80k / Python / MIT / 最終更新: 2026/3
- Playwrightをエンジンに採用、Claude/GPT/Gemini/Ollama対応
- WebVoyagerベンチマーク: **Claude Opus 4.6で78%**（586タスク）
- 2025年CDP直接実装に移行して高速化
- **課題**: Python専用、毎ステップLLM呼出しでコスト高

### Stagehand v3（TypeScript TAISUN最適解）
- **Stars**: ~21.5k / TypeScript / MIT / 最終更新: 2026/3
- **v3でPlaywright依存を廃止、CDP直接実装に移行**（より独立・安定）
- `act()` / `extract()` / `observe()` の3プリミティブ + `agent()` メソッド追加
- **auto-caching**: 一度成功した操作はセレクタをキャッシュ→次回LLM不要で高速再実行
- MCP Server v3.0: 20-40%高速化、Claude/Cursor/VS Code対応
- npm週間37万DL、Browserbase社が$40M Series B調達

### Skyvern（RPA/業務自動化の最強候補）
- **Stars**: ~20k / Python / AGPL-3.0 / YC出身
- LLM+コンピュータビジョンでXPath・CSSセレクタ不要
- **2FA/TOTP/CAPTCHA自動処理**（業務自動化に必須の機能）
- **Zapier/Make.com/N8N連携**（ノーコードワークフローとの統合）
- MCP公式対応: フォーム記入・ファイルダウンロード・Web調査
- Pricing: Free 1,000クレジット / Hobby $29/月 / Pro $149/月 / $0.05/ステップ
- **⚠️ AGPL-3.0**: 商用利用時はソース公開義務。クラウドSaaS利用(API経由)なら問題なし

### Playwright MCP（既存・基盤層）
- TAISUNに統合済み、追加コスト$0
- アクセシビリティツリーベース: Visionモデル比10〜100倍高速、2〜5KBのみ
- 決定論的操作でCI/CD統合に最適
- **改善案**: これ単体でもClaudeの判断力と組み合わせることで多くのタスクが実現可能

---

## 4. アーキテクチャ設計（最終版）

### 推奨 4 層スタック

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: RPA/業務ワークフロー [Skyvern MCP] (新規追加)      │
│  用途: 2FA/TOTP/CAPTCHA対応・複雑な業務フロー自動化          │
│  Zapier/Make/N8N連携。既存ツールで難しいケースに             │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: AI判断操作 [Stagehand MCP] (新規追加・推奨P1)      │
│  用途: 自然言語フォーム入力・動的サイト操作・セルフヒーリング  │
│  TypeScript、auto-caching、Playwright資産継承                │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: 確定的ブラウザ制御 [Playwright MCP] (既存)         │
│  用途: ログイン・スクリーンショット・既知操作・テスト自動化    │
│  高速・$0・Microsoft公式 → 80%のタスクをここで処理           │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: コンテンツ取得 [Firecrawl MCP] (既存・先週追加)     │
│  用途: URL→Markdown変換・クロール・サイト構造分析             │
│  JavaScript動的レンダリング対応・バルクスクレイピング         │
└─────────────────────────────────────────────────────────────┘
```

### ユースケース別ツール選択

| ユースケース | 使用Layer | 具体例 |
|------------|---------|--------|
| サイト全体URL収集 | L1 Firecrawl | 競合サイト構造分析 |
| ページコンテンツ抽出 | L1 Firecrawl | ブログ記事の一括取得 |
| ログイン後のデータ収集 | L2 Playwright | 会員サイトクロール |
| 自然言語でのフォーム入力 | L3 Stagehand | 「申し込みフォームに情報を入れて送信して」 |
| 動的サイトのデータ収集 | L3 Stagehand | SPA/Reactサイトからデータ抽出 |
| 2FA認証が必要な業務システム | L4 Skyvern | kintone/SalesForce等の業務ツール操作 |
| CAPTCHA付きサイトの自動化 | L4 Skyvern | 各種申請フォームの自動送信 |

---

## 5. Stagehand MCP 実装提案

### .mcp.json への追加

```json
"stagehand": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@browserbasehq/mcp-server-browserbase"],
  "env": {
    "BROWSERBASE_API_KEY": "${BROWSERBASE_API_KEY}",
    "BROWSERBASE_PROJECT_ID": "${BROWSERBASE_PROJECT_ID}"
  },
  "disabled": false,
  "defer_loading": true,
  "search_keywords": ["stagehand", "フォーム送信", "ボタン操作", "自然言語操作", "AI操作", "書き込み", "入力"],
  "description": "Stagehand MCP - AI+確定的ハイブリッドブラウザ自動操作（フォーム・ボタン・書き込み）",
  "category": "browser-automation"
}
```

### Skyvern MCP 追加（2FA/CAPTCHA対応）

```json
"skyvern": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@skyvern/mcp"],
  "env": {
    "SKYVERN_API_KEY": "${SKYVERN_API_KEY}"
  },
  "disabled": false,
  "defer_loading": true,
  "search_keywords": ["skyvern", "2FA", "CAPTCHA", "TOTP", "業務自動化", "RPA", "フォーム自動送信"],
  "description": "Skyvern MCP - 2FA/CAPTCHA対応RPA・LLM+Visionブラウザ自動化",
  "category": "browser-automation"
}
```

---

## 6. 実装ロードマップ

| Phase | タスク | 工数 | 効果 |
|-------|--------|------|------|
| **P0（即日）** | Playwright MCP を既存より最大活用（Claude判断で自律化） | 0h | フォーム・ボタン操作の多くが今すぐ可能 |
| **P1（今週）** | Stagehand MCP を .mcp.json + .env.example + スキル追加 | 1-2h | 自然言語操作が本格的に可能に |
| **P2（来週）** | Skyvern MCP 追加（BROWSERBASE持ちなら不要の場合も） | 1h | 2FA/CAPTCHA対応で業務システム自動化 |
| **P3（1ヶ月以内）** | browser-use Python agentの環境構築・MCP化 | 4-8h | 最大コミュニティの完全自律エージェント |

---

## 7. セキュリティ・法的リスク

| リスク | 対策 |
|--------|------|
| Skyvern AGPL-3.0 | クラウドSaaS API経由で利用。ソース非公開で問題なし |
| サプライチェーン攻撃（SANDWORM 2026/02） | `npx socket install` でスキャン必須 |
| Amazon訴訟（Perplexity Comet, 2026/01） | 対象サイトの利用規約・robots.txt を事前確認 |
| LLMへの機密データ送信 | ローカルOllama + browser-use でローカル完結も可 |
| CAPTCHA bypass | サービス規約違反リスクあり。利用前に確認 |

---

## 8. 結論

### 今すぐ実装すべきもの

> **Stagehand MCP を追加する**（P1）

- TypeScript、MCP公式、auto-caching、v3.0で20-40%高速化
- TAISUNの既存Playwright MCPとシームレスに共存
- 「フォームに入力して送信して」「このボタンをクリックして」が自然言語で動作

### 中期的に追加検討すべきもの

> **Skyvern MCP を追加する**（P2）

- 日本のビジネスシステム（2FA付きkintone、SalesForce等）の自動化に必須
- Hobby $29/月で実用十分。YC出身で信頼性高

### 採用しないもの

- **Skyvern OSS版（AGPL-3.0）**: クラウドAPI版を使用
- **Computer Use（本番）**: コスト・速度・セキュリティリスクから本番には不向き

---

## 参考文献（全調査エージェント統合）

1. [browser-use GitHub](https://github.com/browser-use/browser-use) - ~80k stars
2. [Stagehand GitHub](https://github.com/browserbase/stagehand) - ~21.5k stars
3. [Stagehand MCP Server](https://github.com/browserbase/mcp-server-browserbase) - 3.2k stars
4. [Skyvern GitHub](https://github.com/Skyvern-AI/skyvern) - ~20k stars
5. [Skyvern MCP Server](https://mcpservers.org/servers/Skyvern-AI/skyvern)
6. [Stagehand v3 MCP Docs](https://docs.stagehand.dev/v3/integrations/mcp/introduction)
7. [Why Stagehand Is Moving Beyond Playwright](https://www.browserbase.com/blog/stagehand-playwright-evolution-browser-automation)
8. [Stagehand vs browser-use vs Playwright 2026](https://www.nxcode.io/resources/news/stagehand-vs-browser-use-vs-playwright-ai-browser-automation-2026)
9. [Browser Use vs Stagehand Feb 2026](https://www.skyvern.com/blog/browser-use-vs-stagehand-which-is-better/)
10. [11 Best AI Browser Agents 2026 - Firecrawl](https://www.firecrawl.dev/blog/best-browser-agents)
11. [browser-use CDP移行記事](https://browser-use.com/posts/playwright-to-cdp)
12. [Skyvern Pricing](https://www.skyvern.com/pricing)
13. [SANDWORM_MODE Supply Chain Attack](https://www.helpnetsecurity.com/2026/02/24/npm-worm-sandworm-mode-supply-cain-attack/)
14. [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
15. [Top 5 MCP Servers for Browser Automation](https://www.webfuse.com/blog/the-top-5-best-mcp-servers-for-ai-agent-browser-automation)
