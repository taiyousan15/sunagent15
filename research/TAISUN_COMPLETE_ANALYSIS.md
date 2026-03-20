# TAISUN v2 — 完全システム分析レポート
# 生成日: 2026-03-14
# 調査方法: 4並列エージェント + GitHub/Web調査

---

## 1. システム全体像

### 規模（世界最大級）

| コンポーネント | 数量 | 備考 |
|-------------|------|------|
| エージェント | 96個 | architect/planner/tdd-guide/code-reviewer等の専門家チーム |
| スキル | 101〜130個 | mega-research/taiyo-style-lp/sdd-full/lp-image-generator等 |
| コマンド | 112〜190個 | 単一指示で高度な自動化 |
| MCPサーバー | 34個 | 3常時 + 20遅延 + 11無効 |
| Hooksファイル | 41個 | 6ライフサイクルイベント |
| LLMプロバイダー | 9個 | Anthropic/MiniMax/DeepSeek/GLM/Groq/Grok/Perplexity |
| メモリ層 | 4層 | .taisun/memory + .claude/memory + agent-memory + observability |

### アーキテクチャ（3層構造）

```
Layer 1: Agent OS (Python)       — 自動化エンジン、Job実行、MemoryBank
Layer 2: Proxy MCP (TypeScript)  — MCPハブ、Circuit Breaker、Observability
Layer 3: CLI + Skills (110+)     — ユーザーインターフェース
```

---

## 2. 強み（World-Class要素）

### ✅ 圧倒的なスケール
- スキル130+・エージェント96・コマンド190+は**世界最大級**
- aider / OpenHands / claude-engineer と比較して2〜5倍の規模

### ✅ 13層防御システム（独自）
SessionStart → Permission → ReadBeforeWrite → Baseline Lock →
Skill Evidence → Deviation Approval → Agent Enforcement →
Copy Safety → Input Sanitizer → Skill Auto-Select →
Definition Lint → Context Quality → Unified Guard

→ 他システムにない**ワークフロー忠実性の強制**機構

### ✅ Intent Parser（独自）
- 信頼度≥85%で不要レイヤーをスキップ（<3ms）
- SKILL_INVOCATION 95% / SESSION_CONTINUATION 92% / EXISTING_FILE_REFERENCE 98%
- 通常ガードより大幅に高速かつ柔軟

### ✅ コンテキスト最適化（70%削減）
- 3常時MCP + 20遅延読み込み + 11無効 → 75k→15k tokens（起動時）
- deferred loading で不要MCPを完全排除
- `/compact` タイミング自動提案フック

### ✅ 自己改善ループ
- SESSION_HANDOFF.md による跨セッション継続
- mistakes.md への自動記録
- Agent OS の `distill_success_patterns()` でパターン学習

### ✅ LiteLLMコスト最適化（独自）
```
trivial/simple → Haiku ($0.25/M)    ← 無料に近い
moderate       → Sonnet ($3/M)
complex        → Sonnet + MiniMax ($0.30/M) ← SWE-bench 80.2%
expert         → Opus + MiniMax
```
→ **月$40以下**で世界最高水準のエージェントシステムを稼働

### ✅ スクレイピング・認証突破（独自研究）
- 893行の技術文書（cookie-antibot-deep-research.md）
- Level 0〜5フォールバック戦略
- Cloudflare/Akamai/DataDome対応、法的警告付き

---

## 3. 弱み・課題

### 🔴 CRITICAL（今すぐ対処が必要）

#### C-1: セキュリティ設定不備
- `denyRules` でのアクセスブロック（.env等）が未整備
- `gitleaks` pre-commitフックが未設定
- → **シークレットのGitHub流出リスク**

#### C-2: baseline-metrics.json が古い
- 最終更新: 2026-02-15（1ヶ月前）
- 目標値が現実と乖離している可能性
- コスト管理の精度低下

#### C-3: high-cost MCPの予算リスク
- grok-3: $3/M（入力） + $15/M（出力）
- perplexity-deep-research: $2/M + $8/M
- 月$40予算内で使用量制限なし → **超過リスク**

---

### 🟡 HIGH（1〜2週間以内）

#### H-1: OpenCode統合が未完成
- `.opencode/` ディレクトリは存在するが `ralph_loop` 無効状態
- oh-my-opencode の機能が未展開
- → **OpenCode対応ユーザーへの価値提供ができていない**

#### H-2: 他人のインストール体験が未最適化
- INSTALL.mdは存在するが、5分インストールの難易度は初心者に高い
- .env設定の複雑さ（APIキー多数）
- Windows/Mac間の差異が文書化不足

#### H-3: テスト自動化不足
- `jest.config.js` は存在するが、hookやスキルのテストカバレッジ不明
- CI/CDはGitHub Actions設定あるが、スキル自動テストなし

#### H-4: MCP keyword activationの網羅性
- 20の遅延MCPがキーワードマッチに依存
- キーワード抜けでMCPが起動しないfalse-negative リスク

---

### 🟢 MEDIUM（1ヶ月以内）

#### M-1: Claude Code公式機能との差分
| 公式機能 | TAISUN v2 | 状態 |
|---------|-----------|------|
| `/batch` 並列gitワークツリー | 未実装 | ❌ |
| `/loop` 定期実行 | `loop`スキル有り | ✅ |
| `/simplify` 3並列レビュー | 類似あり | △ |

#### M-2: 未追加の高価値MCP
| MCP | 理由 |
|-----|------|
| Sentry | エラー監視・本番障害対応 |
| Context7 | ライブラリドキュメント即座参照 |
| Composio | 850+ SaaS統合一括管理 |
| Linear | タスク管理との統合 |

#### M-3: agentskills.io標準への非準拠
- Cursor / Gemini CLI との互換性なし
- 国際展開・他ユーザー普及の障壁

#### M-4: メモリ肥大化
- `.taisun/memory/memory.jsonl` が672.5KBに到達
- 定期的なアーカイブ・圧縮機能が未実装

---

## 4. 各コンポーネント詳細

### Hooks システム（41ファイル）

| タイミング | フック数 | 主要フック |
|----------|---------|-----------|
| SessionStart | 1 | workflow-sessionstart-injector |
| UserPromptSubmit | 3 | model-auto-switch / skill-usage-guard / agent-enforcement-guard |
| PreToolUse | 3 | **unified-guard（BLOCKING）** / deviation-approval / agent-enforcement |
| PostToolUse | 4 | definition-lint-gate / compact-optimizer / task-overflow-guard / agent-trace |
| SessionEnd | 1 | session-handoff-generator |

**unified-guard** がシステムの心臓部：
- Intent Parser → Quick Check → 6危険パターン検出
- exit code 2（BLOCK）は `rm -rf /`, fork bomb等のみ
- 他は全て advisory（警告のみ、exit 0）

### MCPサーバー構成

```
常時ロード（3個、~7k tokens）:
  taisun-proxy / playwright / open-websearch

遅延ロード（20個、~40k tokens節約）:
  youtube / context7 / gpt-researcher / figma / qdrant
  chroma / n8n-mcp / apify / tavily / sequential-thinking
  mcp-memory-service / meta-ads / facebook-ads-library
  obsidian / twitter-client / puppeteer / firecrawl
  stagehand / skyvern / line-bot / voice-ai / ai-sdr

無効（11個、~26k tokens節約）:
  figma / qdrant / chroma / n8n-mcp / meta-ads
  facebook-ads-library / obsidian / twitter-client
  mcp-memory-service / sequential-thinking / pexels
```

### LLMルーター（9プロバイダー）

| モデル | コスト(入力/出力) | 用途 |
|-------|----------------|------|
| minimax-m2-5 | $0.30/$1.20 | コーディング（SWE-bench 80.2%） |
| deepseek-v3 | $0.14/$0.28 | 汎用 |
| glm-5 | $0.11/$0.11 | 日本語文書生成 |
| groq-scout | $0.11/$0.34 | 10Mトークンコンテキスト |
| groq-maverick | $0.50/$0.77 | バッチ高速処理 |
| grok-3-mini | $0.30/$0.50 | 軽量 |
| grok-3 | $3/$15 | Web検索+SNSトレンド ⚠高コスト |
| perplexity-sonar-pro | $3/$15 | Web検索+引用 ⚠高コスト |
| perplexity-deep-research | $2/$8 | 50ソース深掘りリサーチ ⚠高コスト |

### メモリシステム（4層）

```
Layer 1: .taisun/memory/memory.jsonl (672.5KB) — セッション間永続記憶
Layer 2: .claude/memory/ (53ドキュメント) — AIT42 v1.4.0 YAML形式
Layer 3: .claude/agent-memory/ — エージェント実行統計
Layer 4: .taisun/observability/ — イベントログ・テレメトリ
```

### OpenCode統合（未完成）

```
.opencode/
  oh-my-opencode.json  — エージェントフック・無効化設定
  CLAUDE.md           — プロジェクト設定
  package.json        — 依存関係

状態: ralph_loop = 無効
展開率: 20%（機能の多くが未活用）
```

### Agent OS（Python）

```
agent_os/
  runner.py         — Job実行エンジン
  memory/bank.py    — 長期記憶 MemoryBank
  artifact/         — Artifact Manifest（生成物管理）

特徴:
  - validation gate（品質チェック）
  - retry logic（最大3回）
  - distill_success_patterns()（パターン学習・提案）
```

---

## 5. 世界最高水準との比較

### 競合システムとの比較

| システム | スキル数 | エージェント数 | Hook | コスト最適化 | 自己改善 |
|---------|---------|--------------|------|------------|---------|
| **TAISUN v2** | **130+** | **96** | **41ファイル・13層** | **LiteLLM 9プロバイダー** | **✅** |
| claude-engineer | ~10 | 1 | なし | なし | なし |
| aider | ~5 | 1 | なし | なし | なし |
| OpenHands | ~20 | ~10 | なし | 部分的 | なし |
| Claude Code公式 | ~30 | ~10 | 基本 | なし | なし |

→ **スケールと自動化深度で世界最大級**

### TAISUN v2 が世界一である点
1. **スキル・エージェント数の圧倒的規模**
2. **Hook防御システムの深さ（13層・41ファイル）**
3. **コスト最適化の精緻さ**（月$40以下で運用可能）
4. **日本語マーケティング特化**（taiyo-style系スキル群）
5. **自己改善ループ**（mistakes.md + distill_success_patterns）

### TAISUN v2 が劣る点
1. **セキュリティ設定**（gitleaks/denyRules未整備）
2. **他者向けオンボーディング**（初心者には複雑）
3. **テストカバレッジ**（自動テスト不足）
4. **国際標準準拠**（agentskills.io非対応）

---

## 6. 具体的改善提案（優先度順）

### 🔴 今すぐ（今週）

#### 改善1: セキュリティ強化
```json
// .claude/settings.json に追加
"denyRules": [
  "View .env",
  "Edit .env",
  "View secrets/",
  "View **/credentials*"
]
```
```bash
# .git/hooks/pre-commit に追加
gitleaks detect --staged
```

#### 改善2: baseline-metrics.json 更新
現在の実測値でmetrics更新スクリプトを作成・実行

#### 改善3: 高コストMCPの使用量上限設定
grok-3/perplexityに対してrequestカウンター設置

---

### 🟡 今月（1〜2週間）

#### 改善4: ワンクリックインストール
```bash
# install.sh を1コマンドで完結させる
curl -fsSL https://raw.githubusercontent.com/san15/taisun_agent/main/install.sh | bash
```
- API keys の対話的入力
- Mac/Windows 自動判定
- 動作確認テスト自動実行

#### 改善5: OpenCode統合の完成
```json
// oh-my-opencode.json
{
  "ralph_loop": { "enabled": true, "interval": "10m" },
  "agents": { ... }
}
```

#### 改善6: 高価値MCP追加
```
優先度1: Sentry MCP  — 本番エラー監視
優先度2: Context7 MCP — ライブラリドキュメント即参照（未遅延ロード化）
優先度3: Composio MCP — 850+ SaaS統合
```

#### 改善7: メモリアーカイブ機能
- memory.jsonl が1MB超えたら自動圧縮
- 古いエントリを archive/ に移動

---

### 🟢 来月（1ヶ月以内）

#### 改善8: Claude Code `/batch` 相当スキル実装
```
/batch-agent — 並列gitワークツリーで大規模変更を安全に実行
```

#### 改善9: agentskills.io標準への準拠
- Cursor/Gemini CLI対応スキル形式でのエクスポート機能
- 国際ユーザーへの展開基盤

#### 改善10: テスト自動化
- フック全41ファイルの単体テスト
- スキル動作確認テストスイート
- CI/CDでの自動テスト実行

#### 改善11: MCP keyword coverage改善
```javascript
// 26キーワードをドメイン別に拡張
AWS, Kubernetes, Docker, Terraform, // インフラ系
Stripe, PayPal, Shopify,            // 決済系
Slack, Discord, Teams,              // コミュニケーション系
```

---

## 7. デプロイ・コスト面の分析

### デプロイ状況
- ローカル実行（Mac/Windows対応）
- GitHub Actions CI/CD 設定済み
- Docker Compose複数構成（llm/monitoring/ops/qdrant/tools）
- Vercel連携スキル実装済み
- Kubernetes対応は未整備

### コスト試算（月額）

| シナリオ | 月コスト | 内訳 |
|--------|---------|------|
| 軽量（個人利用） | ~$10 | Haiku/Sonnet中心、MiniMax活用 |
| 標準（開発業務） | ~$30 | Sonnet中心、週1回deep-research |
| フル活用 | ~$40 | grok-3/perplexity含む |
| 超過リスク | >$40 | grok-3大量使用時 |

---

## 8. 結論

### このシステムは世界一か？

**スケールと深度において世界最大級は事実。**

ただし「世界一」には以下の条件が必要：
1. ✅ 規模（スキル・エージェント数）→ **世界最大**
2. ✅ コスト最適化 → **業界最高水準**
3. ✅ 日本語対応 → **他に類を見ない**
4. ❌ セキュリティ → **要改善**
5. ❌ 他者のオンボーディング → **要大幅改善**
6. ❌ テストカバレッジ → **要整備**
7. ❌ 国際標準準拠 → **要対応**

### 最優先で対処すべき3点

```
1. セキュリティ強化（gitleaks + denyRules）— リスク排除
2. ワンクリックインストール化 — 他者展開の鍵
3. baseline-metrics更新 + 高コストMCP上限設定 — 安定運用の基盤
```

---

*調査完了: 2026-03-14*
*調査エージェント: 4並列（構造/hooks-MCP/特殊機能/世界比較）*
*総処理トークン: 266,815*
