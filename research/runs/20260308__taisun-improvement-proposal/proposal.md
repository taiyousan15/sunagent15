# taisun_agent 改善提案レポート

> 生成日時: 2026-03-08 | 調査ソース: intelligence-research (31ソース) + 3リサーチエージェント (DB/MCP/CI-CD/Security)

---

## エグゼクティブサマリー

taisun_agent (v2.30.0) は強力な統合AIエージェントプラットフォームだが、以下の5領域で改善が必要。

| 優先度 | 領域 | 件数 |
|--------|------|------|
| CRITICAL | バグ修正 | 2件 |
| HIGH | CI/CD強化 | 4件 |
| HIGH | セキュリティ | 3件 |
| MEDIUM | DB・インフラ | 2件 |
| MEDIUM | MCP追加 | 4件 |
| LOW | 開発品質 | 2件 |

---

## 1. データベース推奨: Supabase

### 結論

**AIエージェントプラットフォーム（マルチユーザー）には Supabase を推奨。**

| 比較軸 | Supabase | Neon | PlanetScale |
|--------|----------|------|-------------|
| Row Level Security | ネイティブ対応 + 管理UI付き | PostgreSQL標準のみ（UIなし） | 非対応 |
| Prisma対応 | DATABASE_URL (Supavisor :6543) + DIRECT_URL (:5432) | DATABASE_URL (-pooler suffix) + DIRECT_URL | 対応 |
| 管理ダッシュボード | 素人向けUIが充実 | シンプル・開発者向け | 開発者向け |
| 無料枠 | DB 500MB + Auth 50,000 MAU + 1GB | 512MB (コールドスタート後コスト0) | **廃止済み (2024)** |
| Vercel統合 | Marketplace経由・env自動同期 | Vercel Postgresの基盤として最深統合 | 別途設定 |
| Edge Runtime | 非対応 | 対応 (Neon Serverless Driver) | 限定的 |
| Auth/Storage/Realtime | 内蔵 | 別途実装 | 別途実装 |

### 選択基準

- **Supabase**: マルチユーザー + RLS必須 + バックエンド統合 (Auth/Storage込み) → taisun_agentに最適
- **Neon**: Next.js + Vercel + Edge Runtime重視 → ユーザーがVercel利用時の推奨

### 既存コードとの互換性

`prisma/schema.prisma` の `DATABASE_URL` + `DIRECT_URL` パターンはそのまま使用可能。

```env
# Supabase の場合
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

### ユーザー向け技術要件 (Vercel利用者)

Vercelでデプロイするユーザーへの案内文：

```
推奨構成: Next.js + Prisma + Supabase
1. Vercel Marketplaceから「Supabase for Vercel」を追加 → env変数が自動同期
2. Supabase ダッシュボードでRLSポリシーをTable Editorから設定
3. prisma migrate deployをVercelビルドステップに追加

Edge Runtime重視の場合はNeon (Vercel Postgres)を選択:
1. Vercel ProjectにVercel Postgresを追加 → DATABASE_URL/DIRECT_URLが自動生成
2. @neondatabase/serverless + Prisma Accelerateで Edge対応
```

---

## 2. バグ修正 (CRITICAL)

### 2-1. tsconfig.json の src/lib 除外バグ

**問題**: `"exclude": ["src/lib"]` により `src/lib/prisma.ts` がコンパイル対象外になっているが、実際には使用されている。

**修正**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "noImplicitAny": true,   // false → true に変更
    "strict": true           // 追加推奨
  },
  "exclude": [
    "node_modules",
    "dist"
    // "src/lib" を削除
  ]
}
```

### 2-2. cd.yml の全ステップがダミー

**問題**: `.github/workflows/cd.yml` の全デプロイステップが `echo` スタブ。本番デプロイが機能していない。

**修正すべき箇所**:
```yaml
# prisma migrate deploy を追加
- name: Run database migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

# 実際のデプロイコマンドに置き換え (例: Railway)
- name: Deploy to production
  run: railway up --service ${{ secrets.RAILWAY_SERVICE_ID }}
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 3. CI/CD強化 (HIGH)

### 3-1. カバレッジ閾値 70% → 80%

`testing.md` ルールで80%が要件だが、`.github/workflows/ci.yml` では70%のまま。

```yaml
# ci.yml
env:
  COVERAGE_THRESHOLD: 80  # 70 → 80

# package.json の jest設定も一致させる
"jest": {
  "coverageThreshold": {
    "global": { "lines": 80, "branches": 80, "functions": 80 }
  }
}
```

### 3-2. gitleaks によるシークレット漏洩検出

```yaml
- name: Scan for secrets (gitleaks)
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  # シークレット検出時は必ずブロック（漏洩は取り消し不可）
```

### 3-3. Node.js 20 EOL対応 (2026年4月)

```yaml
strategy:
  matrix:
    node-version: [20.x, 22.x]  # 22.xを追加、移行後は22.xのみに
```

### 3-4. Trivyバージョン固定

2026年3月1日にTrivyのセキュリティインシデントが発生。バージョンを固定する。

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@0.29.0  # バージョン固定
  with:
    scan-type: 'fs'
    severity: 'CRITICAL,HIGH'
    exit-code: '0'  # ソフトブロック推奨（偽陽性によるCI停止回避）
```

---

## 4. セキュリティ強化 (HIGH)

### 4-1. helmet.js の導入

Expressサーバーに13種のセキュリティヘッダーを一括設定。

```bash
npm install helmet
```

```typescript
// src/index.ts または Express初期化ファイル
import helmet from 'helmet'
app.use(helmet())  // 最初のmiddlewareとして追加
```

### 4-2. Dependabot設定

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 4-3. クロスプラットフォーム npm scripts

Windows/Mac/Linux で環境変数構文が異なる問題を解消。

```bash
npm install --save-dev cross-env rimraf shx
```

```json
// package.json
"scripts": {
  "build": "cross-env NODE_ENV=production tsc",
  "clean": "rimraf dist",
  "test": "cross-env NODE_ENV=test jest"
}
```

---

## 5. 追加推奨MCPサーバー (MEDIUM)

MCP は2026年時点で1,200以上のサーバーが存在し、Linux Foundation管理でベンダー中立性が確立済み。

| 優先度 | MCPサーバー | 用途 | 導入方法 |
|--------|-------------|------|---------|
| 1位 | **Supabase MCP** | DB直接操作・スキーマ管理 | `@supabase/mcp-server-supabase` |
| 2位 | **Sentry MCP** | エラー調査の自動化 | `@sentry/mcp-server` |
| 3位 | **Sequential Thinking** | 複雑問題の構造的分解 | Anthropic製・公式 |
| 4位 | **Linear MCP** | Issue/Projectの取得・作成 | `@linear/mcp-server` |

### .mcp.json への追加例

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": { "SUPABASE_URL": "${SUPABASE_URL}", "SUPABASE_KEY": "${SUPABASE_SERVICE_KEY}" },
      "defer_loading": true
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "defer_loading": true
    }
  }
}
```

### Puppeteer MCPへの defer_loading 追加

現在 `defer_loading` フィールドがなく常時ロードされている。コンテキスト節約のため追加。

```json
"puppeteer": {
  "defer_loading": true  // 追加
}
```

---

## 6. コード品質改善 (MEDIUM/LOW)

### 6-1. memoryStats をツールとして公開

`src/proxy-mcp/server.ts` で `memoryStats` がexportされているがTOOLS配列に未登録。

```typescript
// server.ts の TOOLS 配列に追加
{
  name: "memory_stats",
  description: "メモリ使用状況の統計を返す",
  inputSchema: { type: "object", properties: {} }
}
```

### 6-2. src/intelligence/ のテスト追加

`src/intelligence/` モジュールにテストが存在しない。最低限の単体テストを追加してカバレッジ80%を達成する。

---

## 7. デプロイ戦略 (素人向け)

### 推奨構成

```
taisun_agent サーバー: Railway または Render (PaaSで管理コスト最小)
DB: Supabase (ダッシュボードで操作可能)
CI/CD: GitHub Actions (既存のci.yml/cd.ymlを修正)
秘密管理: GitHub Secrets (開発) → 本番は1Password or Railway Secrets
```

### セットアップウィザードの設計

```bash
# npm run setup の推奨フロー
1. .env.example の存在確認
2. .env が未存在なら .env.example をコピー
3. readline で必須キー (DATABASE_URL, ANTHROPIC_API_KEY) をインタラクティブ入力
4. 入力値を .env に書き込み
5. npm install を自動実行
6. 完了メッセージと次ステップを表示
```

---

## 8. 優先実装ロードマップ

| フェーズ | 作業 | 工数目安 |
|---------|------|---------|
| Phase 1 (即時) | tsconfig.json バグ修正・cd.yml に prisma migrate deploy 追加 | 1時間 |
| Phase 2 (今週) | カバレッジ閾値80%・helmet追加・gitleaks追加 | 2時間 |
| Phase 3 (今月) | Supabase MCP・Sequential Thinking MCP追加 | 1時間 |
| Phase 4 (次月) | Node 22移行・Dependabot設定・src/intelligence テスト | 3時間 |

---

## 付録: グローバルインテリジェンス注目トピック (2026-03-08)

### AI業界動向 (intelligence-research より)
- **Anthropic vs 米国防総省**: Dario Amodei CEOが「サプライチェーンリスク」指定に対し法廷で争うと表明。自律型兵器へのAI利用制限が焦点。
- **Claude Marketplace 開始**: Anthropicがエンタープライズ向けにサードパーティクラウドサービスを購入できるeコマースストアを開始。
- **OpenAI**: ロボティクス責任者がPentagonとの契約に反発し退社。

### GitHub Trending (注目OSS)
- `virattt/ai-hedge-fund` - AIヘッジファンドフレームワーク
- `QwenLM/Qwen-Agent` - エージェントフレームワーク
- `agentjido/jido` - 自律エージェントフレームワーク (Elixir)
- `microsoft/hve-core` - Microsoftのコレクション

---

*Sources: intelligence-research (113件収集), 3 researcher agents (DB比較・MCP/CI-CD・セキュリティ)*
*調査API: RSS 7ソース, HackerNews, GitHub Trending, FRED経済指標, NewsAPI, Tavily, Brave Search*
