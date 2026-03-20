# TAISUN v2 世界最高水準システム比較分析・改善提案

**作成日**: 2026-03-14
**調査対象**: Claude Code公式・claude-engineer・aider・OpenHands・MCP Registry・awesome-agent-skills

---

## 1. 競合システム概要

### Claude Code 公式 (77.5k stars)
- ターミナル・IDE・GitHub統合の三方向インターフェース
- スキルシステム2.0: YAML frontmatter + `context: fork` でサブエージェント実行
- `!`command`` による動的コンテキスト注入
- `/batch` コマンド: 並列gitワークツリーでの大規模変更
- `/simplify`, `/loop`, `/debug` 等のバンドルスキル
- MCP Tool Search（遅延ロード）でコンテキスト使用量95%削減
- 公式Skills: agentskills.io 標準（Cursor/Gemini CLI/Codex互換）

### claude-engineer v3 (Doriandarko)
- **動的ツール生成**: 会話中に不足ツールを自動生成・ロード
- ホットリロード対応モジュールシステム
- 高精度トークン追跡（コンテキストウィンドウ管理）

### aider (41.9k stars, 5.3M PyPI install/week)
- コードマップによる大規模コードベース理解
- 「コードの88%をaider自身が書いた」自己改善
- git自動コミット（変更追跡）
- 100言語対応、音声入力対応
- **ベンチマーク重視**: SWE-bench等での客観的評価公開

### OpenHands (旧OpenDevin)
- 15以上の評価ベンチマーク対応（SWE-bench, WebArena等）
- LocalWorkspace対応（Docker不要化、2026年4月〜）
- 階層型マルチエージェント（コーディング→ブラウザ移譲等）
- OpenHands Index: Issue解決・フロントエンド開発・ソフトウェアテストの統一評価

---

## 2. TAISUN v2 現状評価

### 強み
| 項目 | 評価 |
|------|------|
| スキル数 | 130+（業界最大級） |
| エージェント数 | 96（フル覆域） |
| コマンド数 | 190+（世界最多クラス） |
| MCPサーバー | 15+（独自実装含む） |
| 自己改善ループ | AGENTS.md + /learnで実装済み |
| コスト最適化 | LiteLLM/OpenRouter/Groq統合、モデル自動切替 |
| Hook System | PreToolUse/PostToolUse/Stop完備 |
| マルチOS対応 | Mac + Windows PowerShellスクリプト |

### 改善が必要な領域（ギャップ分析）

---

## 3. 改善提案

### 3.1 インストール・オンボーディング

**現状の課題**
- インストールは5分で完了するが、初回体験（ファーストラン）が不明確
- `claude /init`相当のインタラクティブセットアップがない
- Windows向けPowerShellスクリプトはあるが、WSL環境での動作保証が弱い

**改善提案**

```bash
# 提案: インタラクティブオンボーディングスクリプト
bash scripts/onboard.sh
# → プロジェクト種別を質問（Web/Mobile/AI/General）
# → 推奨スキルセットを自動有効化
# → .envテンプレートを対話式に設定
# → /hello スキルで動作確認
```

- `scripts/onboard.sh` 新規作成: 対話型セットアップ（10問以内）
- ファーストラン向け `/welcome` スキル: 使い方ガイドを提示
- `QUICKSTART.md` (5分版) と `INSTALL.md` (詳細版) を分離
- Docker Compose ワンライナーインストール対応（環境汚染ゼロ）

---

### 3.2 ドキュメント・README品質

**現状の課題**
- README.mdは機能一覧が中心で「なぜTAISUNか」が不明確
- バッジは充実しているが、スクリーンショット/GIFが少ない
- 英語版READMEが存在しない（国際展開の障壁）

**改善提案**

```markdown
## Why TAISUN? (追加セクション案)
- 1コマンドで世界水準のClaude Code環境が手に入る
- スキル/エージェントが agentskills.io 標準に準拠
- 日本語プロジェクトに最適化されたワークフロー
```

- `README.en.md` 作成（英語圏コミュニティへの展開）
- `docs/demo.gif` 追加（インストール〜スキル実行の30秒デモ）
- `docs/architecture.md`: システムアーキテクチャ図（Mermaid）
- skill/agentのドキュメントをJSONスキーマ自動生成に移行

---

### 3.3 セキュリティ（.env管理・Secrets）

**現状の課題**
- `.env`ファイルが平文管理（業界標準はVault使用）
- `gitleaks`はCI/CDに追加済みだが、ローカルpre-commitに未導入
- CLAUDE.mdにsecretsアクセスブロックルールが弱い

**改善提案（優先度: 高）**

```json
// .claude/settings.json に追加
{
  "denyRules": [
    "Read(.env*)",
    "Read(*secret*)",
    "Read(~/.ssh/*)",
    "Bash(curl * | bash)",
    "Bash(wget * | sh)"
  ]
}
```

```bash
# pre-commitフック追加
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
gitleaks detect --staged --no-banner || exit 1
EOF
chmod +x .git/hooks/pre-commit
```

- `scripts/setup-security.sh` 新規作成: gitleaks pre-commitフック自動設定
- `.env.example` の全APIキー欄にコメント追加（用途・取得URL）
- `SECURITY.md` 追加: 脆弱性報告先・secrets管理ガイドライン
- 1Password/Vault連携スキル (`/secrets-rotate`) の追加検討

---

### 3.4 CI/CDとテスト自動化

**現状の課題**
- テストカバレッジ閾値が70→80%に上昇（良好）
- E2Eテストが未整備（Playwrightスキルはあるが、CIに組み込まれていない）
- スキル品質の自動評価がない

**改善提案**

```yaml
# .github/workflows/skill-quality.yml (新規)
name: Skill Quality Gate
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate SKILL.md frontmatter
        run: node scripts/validate-skills.js
      - name: Check skill YAML schema
        run: npx ajv validate -s schemas/skill.schema.json -d ".claude/skills/*/SKILL.md"
```

- スキルYAMLスキーマバリデーションをCI必須チェックに追加
- `scripts/validate-skills.js` 新規作成: frontmatter必須フィールド検証
- 主要スキル（deep-research, intelligence-research等）の統合テスト追加
- `act`でのローカルCI実行ガイドを`INSTALL.md`に追記

---

### 3.5 MCPサーバー（未実装・追加候補）

**現在実装済み**: Playwright, Firecrawl, Stagehand/Skyvern, Pexels, Qdrant等

**未実装で高価値なMCPサーバー（優先度順）**

| MCP | 優先度 | 理由 |
|-----|--------|------|
| **Sentry MCP** | ★★★ | 本番エラーをClaude Codeに直接フィード。デバッグ自動化 |
| **Context7 MCP** | ★★★ | バージョン固有ドキュメントの自動取得（React/Next.js等） |
| **PostgreSQL MCP** | ★★★ | 自然言語DBクエリ（開発効率直結） |
| **Composio MCP** | ★★★ | 850+ SaaS OAuth統合（Slack/HubSpot/Salesforce等） |
| **Apidog MCP** | ★★ | API仕様書とClaude Codeの連携 |
| **Linear MCP** | ★★ | イシュー管理のClaude統合 |
| **Notion MCP** | ★★ | ドキュメント・ナレッジベース連携 |
| **Browserbase MCP** | ★★ | クラウドブラウザ（ローカル不要） |
| **Supabase MCP** | ★★ | バックエンドサービス直接操作 |
| **Cloudflare MCP** | ★★ | Workers/KV/R2の自然言語操作 |
| **Google Workspace MCP** | ★ | Docs/Sheets/Gmail統合（24サービス） |

**実装優先推奨**:
```bash
# mcp-presets/ に追加（既存のプリセット管理機能を活用）
mcp-presets/
  backend-dev.json     # PostgreSQL + Supabase + Sentry
  frontend-dev.json    # Context7 + Browserbase + Playwright
  saas-dev.json        # Composio + Linear + Notion
```

---

### 3.6 スキルで不足しているもの

**agentskills.io標準との比較**

| カテゴリ | 現状 | 不足スキル |
|----------|------|----------|
| コード品質 | code-reviewer | `/batch` 相当（並列大規模変更）|
| IaC/インフラ | docker-mcp-ops | `/terraform`, `/cloudformation` |
| テスト | tdd-guide | `/mutation-test`, `/load-test` |
| セキュリティ | security-reviewer | `/pentest`, `/dependency-audit` |
| パフォーマンス | なし | `/lighthouse`, `/profile-perf` |
| データ分析 | なし | `/analyze-csv`, `/sql-explore` |
| ドキュメント | doc-updater | `/api-docs`, `/storybook` |
| デプロイ | なし | `/deploy-vercel`, `/deploy-cf` |

**最優先で追加すべきスキル**:
1. `/batch-refactor`: 並列gitワークツリーを使った大規模リファクタリング（Claude Code公式`/batch`相当の独自実装）
2. `/dependency-audit`: npm audit + gitleaks + Snyk連携の統合セキュリティスキャン
3. `/performance-profile`: Lighthouse + Node.jsプロファイリング統合
4. `/deploy`: Vercel/Netlify/Cloudflare Pagesへのワンコマンドデプロイ

---

### 3.7 コスト最適化

**現状**: LiteLLM + OpenRouter/Groq統合、haiku/sonnet/opus自動切替

**追加改善**

```typescript
// 提案: トークン使用量ダッシュボード
// src/proxy-mcp/tools/cost-tracker.ts
export function getDailyTokenSummary(): CostReport {
  return {
    today: { tokens: 45230, cost_usd: 0.23, model_breakdown: {...} },
    budget_alert: dailyCost > BUDGET_LIMIT,
    recommendation: "haiku使用率を70%→85%に上げると月$12削減可能"
  }
}
```

- `/cost-report` スキル新規作成: 日次・週次トークン使用量と推定コストを表示
- バジェットアラート機能: 設定閾値超過時に警告
- スキル別トークン消費分析: 高コストスキルの特定と最適化提案
- キャッシュ活用強化: Anthropic Prompt Caching APIとの連携

---

### 3.8 エラー回復・自己修復機能

**現状**: circuit-breaker実装済み、build-error-resolver エージェント有

**不足している機能**

```typescript
// 提案: 自己修復ループ (src/proxy-mcp/tools/self-heal.ts)
export async function selfHealMcp(mcpName: string): Promise<HealResult> {
  // 1. ヘルスチェック
  const health = await checkMcpHealth(mcpName)
  if (health.status === 'unhealthy') {
    // 2. 自動再起動
    await restartMcp(mcpName)
    // 3. 依存関係確認
    await validateDependencies(mcpName)
    // 4. フォールバック有効化
    return await enableFallback(mcpName)
  }
}
```

- **MCPヘルスチェックスケジューラ**: `/loop 5m check-mcp-health` パターンの標準化
- **段階的フォールバック**: MCPが失敗した場合の代替ツールチェーン自動切替
- **エラーパターン学習**: `mcp__claude-historian__get_error_solutions`との統合強化
- **自動バージョン回復**: `git stash`/`git checkout`を使ったロールバック自動化

---

## 4. 世界一システムへのロードマップ

### Phase 1（即時対応、1-2週間）
- [ ] セキュリティ強化: denyRules追加、pre-commitフック設定
- [ ] Sentry MCP + Context7 MCPの追加
- [ ] `/dependency-audit` スキル新規作成
- [ ] `README.en.md` 初版作成

### Phase 2（短期、1ヶ月）
- [ ] インタラクティブオンボーディング (`scripts/onboard.sh`)
- [ ] スキルYAMLバリデーション CI追加
- [ ] `/batch-refactor` スキル（並列gitワークツリー活用）
- [ ] `/cost-report` スキル + トークンダッシュボード
- [ ] MCPプリセット3種（backend/frontend/saas）

### Phase 3（中期、3ヶ月）
- [ ] agentskills.io標準への完全準拠（Cursor/Gemini CLI互換）
- [ ] ベンチマーク評価実装（SWE-bench等での客観的性能測定）
- [ ] PostgreSQL/Composio MCP統合
- [ ] `/deploy` スキル群（Vercel/CF/Netlify）
- [ ] 英語版コミュニティ向けドキュメント整備

---

## 5. 総括

TAISUN v2は現時点でスキル数・エージェント数・コマンド数において世界最大規模のClaude Code拡張システムの一つ。

**最大の差別化ポイント**（他システムにない強み）:
- 日本語プロジェクトに最適化されたワークフロー
- Hook System + 自己改善ループの組み合わせ
- LiteLLM/OpenRouterによる積極的コスト最適化

**優先対応の3点**:
1. **セキュリティ強化** (denyRules + gitleaks pre-commit) — リスクが高い
2. **Sentry + Context7 MCP追加** — 開発効率に直結、実装コスト低
3. **agentskills.io標準準拠** — 国際コミュニティへの展開に必須

---

*Sources: [Claude Code Docs](https://code.claude.com/docs/en/skills), [awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills), [claudefa.st MCP Guide](https://claudefa.st/blog/tools/mcp-extensions/best-addons), [OpenHands](https://github.com/OpenHands/OpenHands), [aider](https://github.com/paul-gauthier/aider), [claude-engineer](https://github.com/Doriandarko/claude-engineer)*
