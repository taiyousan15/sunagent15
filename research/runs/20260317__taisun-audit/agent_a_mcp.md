# taisun_agent MCP構成 世界標準比較評価レポート
**調査日**: 2026-03-17
**調査対象**: taisun_agent 現行MCP構成 (21個)

---

## 1. 現行構成の評価サマリー

| 評価軸 | スコア | 所見 |
|--------|--------|------|
| 機能カバレッジ | 65/100 | Web・SNS・自動化は強い。DB・インフラ・セキュリティが欠如 |
| コンテキスト効率 | 55/100 | playwright+stagehand+skyvernの三重重複が深刻（推定+30k tokens） |
| セキュリティリスク | 中〜高 | twitter-client / meta-ads のOAuth管理に注意 |
| 実用活用率 | 70/100 | defer_loading活用でトークンコスト大幅削減可能 |

---

## 2. 重複・冗長なMCP（削減推奨）

### ブラウザ自動操作: 3重重複 ⚠️ CRITICAL
| MCP | 特徴 | 推奨 |
|-----|------|------|
| **playwright** | 114k tokens/task、フルスナップショット | **優先採用**（最汎用） |
| **stagehand** | playwright上位互換、自然言語→操作変換、キャッシュあり | 用途限定で残す |
| **skyvern** | 高度なビジュアルナビゲーション、API課金型 | **廃止候補**（コスト高） |

**推奨**: playwright + stagehand の2本化。skyvernは特殊用途のみ。
**節約効果**: 推定 -15k〜30k tokens/session

### Web検索: 2重重複
| MCP | 特徴 |
|-----|------|
| **tavily** | 高精度、AI特化検索 |
| **open-websearch** | 汎用、無料 |
| **firecrawl** | スクレイピング特化 |

→ tavilyとfirecrawlは用途が異なるため両立可。open-websearchはtavilyで代替可能。**open-websearch廃止候補**。

### SNS広告: 2重重複
- **meta-ads** + **facebook-ads-library**: 機能重複あり。用途を明確化すべき。

---

## 3. 不足している重要MCP（追加推奨）

### CRITICAL不足
| カテゴリ | 推奨MCP | 理由 | GitHub Stars |
|----------|---------|------|-------------|
| **コード管理** | GitHub MCP | PR/Issue/コードレビュー自動化 | ★3,500+ |
| **データベース** | PostgreSQL MCP / Supabase MCP | データ直接操作 | ★2,100+ |
| **インフラ/IaC** | Terraform-Cloud MCP | クラウドインフラ管理 | 急増中 |
| **コンテナ** | Docker MCP | コンテナライフサイクル管理 | ★2,100+ |
| **CI/CD** | GitHub Actions MCP | 自動デプロイ連携 | 新興 |

### HIGH推奨
| カテゴリ | 推奨MCP | 理由 |
|----------|---------|------|
| **モニタリング** | Datadog MCP | セキュリティ・パフォーマンス監視 |
| **セキュリティOSINT** | OSINT-MCP / VirusTotal-MCP | 本調査のような用途 |
| **チームコラボ** | Slack MCP / Notion MCP | 自動通知・ドキュメント管理 |
| **AI推論強化** | Sequential Thinking MCP | 複雑推論タスク ★6,200 |

---

## 4. コンテキストトークン消費の問題点

### 現状の推定消費量（セッション起動時）
```
playwright:          ~8,000 tokens (tool定義)
stagehand:           ~6,000 tokens
skyvern:             ~5,000 tokens
n8n-mcp:             ~4,000 tokens
firecrawl:           ~3,500 tokens
apify:               ~3,500 tokens
合計(重複3サーバー): +20,000 tokens 余分
```

### Playwright実行時の消費量問題
- **Playwright MCP**: 114k tokens/task（ページ遷移ごとにフルスナップショットを蓄積）
- **Playwright CLI**: 27k tokens（約4倍効率的）
- **対策**: 2026年1月実装のMCP Tool Search（deferred loading）を活用すれば起動コスト-95%可能

### 推奨最適化
```json
// .claude/settings.json
{
  "disabledMcpServers": ["skyvern", "open-websearch"],
  "deferredMcpServers": ["playwright", "stagehand", "apify", "n8n-mcp"]
}
```

---

## 5. 2026年「hot」な新規MCP（GitHub Stars急増中）

| MCP | Stars/トレンド | 用途 |
|-----|---------------|------|
| **Sequential Thinking MCP** | ★6,200（急増） | 複雑推論・問題解決の強化 |
| **AWS MCP Servers** | ★8,400 | AWSリソース全般管理 |
| **Supabase MCP** | ★2,100 | DB+認証+ストレージ統合 |
| **MindsDB MCP** | ★39,000 | 複数DBソース統合・ML |
| **Kubernetes MCP** | ★1,300（急増） | K8sオーケストレーション |
| **Google Cloud MCP** | 公式提供開始 | Spanner/AlloyDB/Firestore統合 |
| **Zapier MCP** | ★2,200 | 5,000+アプリ統合 |

---

## 6. セキュリティリスク評価

| リスク | 該当MCP | 対策 |
|--------|---------|------|
| OAuth token漏洩 | twitter-client, meta-ads, facebook-ads-library | 環境変数管理、定期ローテーション |
| 権限過剰付与 | n8n-mcp（ワークフロー全権限） | スコープを最小化 |
| サプライチェーン | 非公式カスタムサーバー（gemsapi, taisun-proxy, ai-sdr等） | 定期的なコードレビュー必須 |
| MCP native権限なし | 全サーバー共通 | Zero Trust + 外部IAMレイヤーが必要 |

---

## 7. アクションアイテム（優先度順）

### 即座に実施
1. **skyvern廃止** or deferred化（コスト削減）
2. **open-websearch廃止**（tavilyで代替可能）
3. **playwright/stagehand/n8n/apify を deferred loading設定**

### 短期追加（1ヶ月以内）
4. **GitHub MCP追加**（コード管理自動化）
5. **PostgreSQL or Supabase MCP追加**（データアクセス）
6. **Sequential Thinking MCP追加**（推論強化）

### 中期検討（3ヶ月）
7. Docker/Terraform MCP追加（インフラ管理）
8. Datadog MCPによるモニタリング強化
9. Slack MCP統合（通知自動化）

---

## 参考ソース
- [Most Popular MCP Tools 2026 - FastMCP](https://fastmcp.me/blog/most-popular-mcp-tools-2026)
- [Playwright MCP Burns 114K Tokens Per Test - Medium](https://scrolltest.medium.com/playwright-mcp-burns-114k-tokens-per-test-the-new-cli-uses-27k-heres-when-to-use-each-65dabeaac7a0)
- [Top MCP Servers for Cybersecurity 2026 - Levo.ai](https://www.levo.ai/resources/blogs/top-mcp-servers-for-cybersecurity-2026)
- [Awesome MCP Servers - mcp-awesome.com](https://mcp-awesome.com/)
- [MCP Servers GitHub](https://github.com/modelcontextprotocol/servers)
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
