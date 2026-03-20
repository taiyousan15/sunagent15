# taisun_agent 完全監査レポート
**調査日**: 2026-03-17
**調査手法**: 4エージェント並列リサーチ（MCP評価/API評価/アーキテクチャ評価/GIS 31ソース）
**対象**: taisun_agent システム全体（コンテキスト/エラー/デプロイ/自動チェック/skill/MCP/サイト分析/認証/リサーチ/サブエージェント/hooks/agent）

---

## 総合スコアカード

| カテゴリ | スコア | 評価 |
|---------|--------|------|
| **Hooks/自動化システム** | **9/10** | 業界最高水準の14層Hook設計 |
| **コンテキスト管理** | **8/10** | Praetorian+compact戦略は2026世界水準 |
| **CI/CDパイプライン** | **8/10** | 5ワークフロー・Trivy・80%カバレッジ閾値 |
| **アーキテクチャ設計** | **8/10** | 2層分離・モデル自動切替はLangGraph相当 |
| **セキュリティ設計** | **7/10** | CI/CDは堅牢。2FA突破ツールのTOSリスクあり |
| **リサーチ品質** | **7/10** | Grok+Tavily構成は水準。Exa未統合が弱点 |
| **MCP構成** | **6.5/10** | Web/SNS/自動化強い。DB/インフラ欠如・3重重複あり |
| **HuggingFace活用度** | **4/10** | smolagents/InferenceClient未統合 |
| **エージェント設計** | **4.5/10** | 96個は業界推奨の32倍。重複・過剰 |
| **スキル設計** | **5/10** | 130スキルは「300ページ問題」。効果低下域 |
| **総合** | **67/100** | 独自進化の強みあり。量→質への転換が次フェーズ |

---

## システム構造マップ

```
taisun_agent
├── 【MCP層】 21サーバー
│   ├── proxy-mcp（内製）       → セマンティックルーティング・circuit-breaker・resilience
│   ├── playwright/stagehand/skyvern → ブラウザ自動化（3重重複⚠）
│   ├── firecrawl/tavily/open-websearch → Web収集・検索（一部重複）
│   ├── meta-ads/facebook-ads-library → SNS広告（一部重複）
│   ├── apify/twitter-client    → SNSスクレイピング
│   ├── obsidian/qdrant/context7 → 知識管理・ベクトル検索
│   └── n8n-mcp/figma/youtube等 → 各種連携
│
├── 【Hooks層】 57ファイル・17イベント
│   ├── SessionStart    → workflow-sessionstart-injector
│   ├── UserPromptSubmit → model-auto-switch + skill-usage-guard + agent-enforcement
│   ├── PreToolUse      → unified-guard + deviation-guard + agent-enforcement + compact-save
│   ├── PostToolUse     → auto-adr + definition-lint + trace-capture + compact-optimizer + task-overflow + output-verifier
│   ├── SessionEnd      → session-handoff-generator
│   └── Stop            → auto-changelog + session-end-ledger
│
├── 【エージェント層】 96エージェント（aitait42系 + 専門系）
│
├── 【スキル層】 130+スキル（~/.claude/skills/）
│   ├── リサーチ系: intelligence-research / omega-research / deep-research-grok
│   ├── マーケ系: meta-ads-analyze/bulk/competitors/creative/optimize
│   ├── サイト分析: url-all / url-deep-analysis
│   └── 各種業務: LP生成・動画・音声・SNS等
│
├── 【src/】 TypeScript実装
│   ├── proxy-mcp/      → router/internal/tools/supervisor
│   ├── unified-hooks/  → 4層hookシステム
│   ├── intelligence/   → GIS 31ソース収集
│   ├── intent-parser/  → 意図解析
│   └── rag/            → RAG実装
│
└── 【CI/CD】 .github/workflows/
    ├── ci.yml          → TypeScript build・test・80%カバレッジ
    ├── cd.yml          → デプロイ
    ├── security.yml    → Gitleaks + Trivy + SARIF
    ├── integration.yml → 統合テスト
    └── auto-log.yml    → 自動ログ
```

---

## 🔴 CRITICAL問題（即時対応必須）

### 1. ブラウザ自動化の3重重複 — トークン爆食い
| MCP | 消費量 | 推奨 |
|-----|--------|------|
| playwright | 114k tokens/task | **メイン採用** |
| stagehand | ~8k tokens | 自然言語操作時のみ残す |
| skyvern | ~5k tokens + 課金 | **即廃止候補** |

- **影響**: 推定 +30k tokens/session の余分な消費
- **対処**: settings.json で skyvern を `disabled: true`、playwright/stagehand を `defer_loading: true`

### 2. 有効MCPサーバー数が多すぎる
- 現行21サーバーを全有効化すると開始時点で200kコンテキストの**30-40%**を消費
- Anthropic公式推奨: **アクティブMCP 10個以下・アクティブツール 80個以下**
- GitHub MCP単体で26kトークン消費

### 3. trivy-action@master は供給チェーン攻撃リスク
```yaml
# security.yml 修正前
- uses: aquasecurity/trivy-action@master

# 修正後（コミットSHAまたはタグでピン留め）
- uses: aquasecurity/trivy-action@v0.29.0
```

---

## 🟠 HIGH優先度改善

### 4. エージェント96個は業界推奨の32倍
- 2026年ベストプラクティス: **オーケストレーター + 3-4スペシャリスト**が上限
- 96個は認知的オーバーヘッド・重複リスク・コンテキスト消費の三重苦
- **対処**: カテゴリ統合で 15-20個に削減。ait42系（80個）を1オーケストレーターに集約

### 5. スキル130個の効果低下
- 研究実証: 2-3スキルで +18.6%効果、4+スキルで +5.9%まで低下（TechWireAsia）
- 130スキルは「300ページマニュアル」問題 — Claudeがどのスキルを使うべきか判断できなくなる
- **対処**: コアスキル 20-30個に絞り込み。リサーチ3系統を1スキルに統合

### 6. Exa API未統合（リサーチ品質ボトルネック）
| 指標 | Tavily（現行） | Exa（未採用） |
|------|--------------|-------------|
| 複雑クエリ精度 | 71% | 81% |
| p95レイテンシ | 3.8-4.5s | 1.4-1.7s |
| セマンティック検索 | 基本対応 | 特化設計 |

- omega-research / intelligence-research に即効果あり

### 7. 重要MCP不足
| 不足カテゴリ | 推奨MCP | GitHub Stars |
|------------|---------|-------------|
| コード管理 | GitHub MCP | ★3,500+ |
| データベース | Supabase MCP | ★2,100+ |
| 推論強化 | Sequential Thinking MCP | ★6,200 |
| コンテナ/インフラ | Docker MCP | ★2,100+ |

---

## 🟡 MEDIUM優先度改善

### 8. Playwright/Skyvern 2FA突破のTOS違反リスク
- Google・GitHub等の利用規約「自動化ツールによるログイン禁止」に抵触の可能性
- Noma Security（2026）: playwright-mcp偽パッケージが17,000DL — タイポスクワッティングリスク
- **対処**: input-sanitizer.json にホワイトリスト制限を追加。使用ログの監査を有効化

### 9. CLAUDE.md の肥大化
- 現行: グローバル/プロジェクト/.claude/rules/hooks の5層に分散
- Anthropic公式警告: 「bloated CLAUDE.md causes Claude to ignore rules」
- **対処**: 各ファイルを200行以下に。重複ルールをskillに移動

### 10. ts-node → tsx への移行
- ts-node は型チェック漏れリスクあり
- `tsx`（ESM対応・高速）への移行で TypeScript strict mode 保証を強化

### 11. open-websearch 廃止候補
- tavilyで代替可能な機能を重複保持
- deferred設定でも起動コスト節約可能

### 12. セキュリティトークン管理
- twitter-client / meta-ads / facebook-ads-library の OAuth token を定期ローテーション
- カスタムサーバー（gemsapi, taisun-proxy, ai-sdr）の定期コードレビュー必須
- MCP native権限モデルが存在しないため Zero Trust 外部レイヤーが必要

---

## ✅ 強み（維持・強化すべき）

### S1: Hooks設計は業界最高水準（9/10）
> Anthropic公式: 「Hooks guarantee execution; prompts do not」
- 57ファイル・17イベントカバレッジは世界的にも類を見ない独自進化
- deviation-approval-guard / task-overflow-guard / compact-optimizer の三位一体は独自の強み
- SESSION_HANDOFF.md によるセッション引継ぎは業界で稀有

### S2: コンテキスト管理が世界水準（8/10）
- Praetorian compact + 動的インターバル + task-overflow-guard
- Claude Sonnet 4.6は200Kトークン全域で精度低下5%未満を活用した設計
- 2026年ベストプラクティス「server-side compaction」と一致

### S3: CI/CDは企業レベル（8/10）
- Gitleaks シークレットスキャン + Trivy脆弱性スキャン
- Codecov 80%カバレッジ閾値 + UTF-8 bidi Unicodeチェック
- Node 20/22 マトリクステスト + 5ワークフロー構成

### S4: モデル自動切替オーケストレーション（8/10）
- model-auto-switch.js による haiku/sonnet/opus 動的切替
- LangGraph/CrewAI相当のコスト最適化を内製実現

### S5: intelligence-research GIS 31ソース
- FRED経済指標×X340アカウント×HN/Reddit/RSSの組み合わせは独自競争優位
- 193件/回の情報収集は商用リサーチツールに匹敵

### S6: proxy-mcp の circuit-breaker（強化済み）
- maxAttempts:5 / classifyError()実装 / exponential backoff
- 自律エラーリカバリは2026年エンタープライズ水準

---

## 🚀 アーキテクチャ改善ロードマップ

### Phase 1: 即時（1-2週間）— コスト削減・リスク排除
1. `skyvern` → `disabled: true`（コスト削減）
2. `open-websearch` → `disabled: true`（tavily で代替）
3. `playwright/stagehand/n8n/apify` → `defer_loading: true`（起動トークン-95%）
4. `trivy-action@master` → バージョンピン留め（セキュリティ）
5. input-sanitizer.json にブラウザ自動化のドメインホワイトリスト追加

### Phase 2: 短期（1ヶ月）— 品質向上
6. GitHub MCP 追加（PR/Issue/レビュー自動化）
7. Sequential Thinking MCP 追加（推論強化）
8. Exa API を omega-research に統合（リサーチ品質向上）
9. リサーチ3スキル統合（omega-research + deep-research-grok + intelligence-research）
10. MCPプロファイル設定導入（開発/セキュア/マーケティングモード）

### Phase 3: 中期（3ヶ月）— 質への転換
11. エージェント 96個 → 15-20個 に統合（ait42系を1オーケストレーターへ）
12. スキル 130個 → 20-30コアスキル に絞り込み
13. smolagents/HuggingFace InferenceClient 統合（オープンモデルアクセス）
14. LangSmith相当の分散トレーシング（OpenTelemetry + Jaeger）
15. Sagaパターンによるエラーリカバリの冪等性保証

---

## 世界標準との比較

| 指標 | taisun_agent | LangGraph | CrewAI | Cursor |
|------|-------------|-----------|--------|--------|
| エージェント数 | 96 | 3-5推奨 | 3-4推奨 | 1+ツール群 |
| コンテキスト管理 | **Hooks自動化（◎）** | 手動 | 手動 | 自動 |
| スキル/ツール数 | 130 | 10-20 | 5-15 | ~50 |
| CI/CD統合 | **5ワークフロー（◎）** | 外部依存 | 外部依存 | 内製 |
| MCP統合 | 21サーバー | なし | なし | 一部 |
| セッション引継ぎ | **SESSION_HANDOFF（◎）** | なし | なし | なし |

**結論**: taisun_agentは「量による網羅性」戦略で独自進化。Hooks/CI/CDは世界最高水準。次フェーズは「質による専門性」への転換が競争優位を確立する。

---

## メリット・デメリット総括

### メリット
- **自律性**: hooks57個が人間の介入なしにエラー検知・コンテキスト管理・品質保証を実行
- **セッション継続性**: SESSION_HANDOFF.md + TCPS + compact戦略で長期プロジェクト対応
- **リサーチ深度**: GIS 31ソース + Grok-4 Agent Tools は商用ツールに匹敵
- **企業級CI/CD**: Trivy/Gitleaks/Codecov の組み合わせはOSS最高水準
- **拡張性**: proxy-mcp の router/circuit-breaker 設計は将来のMCP追加が容易

### デメリット
- **過剰複雑性**: 96エージェント+130スキル+57hooksは把握・保守が困難
- **コンテキスト消費**: MCPサーバー全有効化で起動コストが過大
- **法的リスク**: 2FA/CAPTCHA突破ツールのTOS違反リスクが顕在化
- **モノレポ肥大化**: 単一リポジトリに全機能を集約し、複雑性が増大
- **Exa/HuggingFace未活用**: 最新の高品質ツールが未統合

---

*レポート生成: 2026-03-17 | Agent A（MCP評価）+ Agent B（API/HF評価）+ Agent C（アーキテクチャ/コミュニティ）+ Intelligence（GIS 31ソース）統合*
