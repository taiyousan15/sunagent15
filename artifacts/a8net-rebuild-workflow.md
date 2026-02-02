# A8.net ゼロから再構築ワークフロー

## 分析結果サマリー

### A8.net 技術スタック（実際）
| 項目 | 技術 |
|------|------|
| CMS | WordPress（カスタムテーマ "a8new"） |
| Backend | PHP |
| Web Server | Nginx |
| Infrastructure | AWS (EC2 + CloudFront) |
| JS Libraries | jQuery, Slick.js, InfiniteSlide.js |
| Image | WebP (@2x), SVG |
| Tracking | Google Tag Manager |
| Security | プライバシーマーク, SSL |

### 再構築時のモダン技術スタック（推奨）
| 項目 | 技術 |
|------|------|
| Frontend | Next.js 15 (App Router) |
| Backend | Next.js API Routes + Node.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payment | Stripe |
| Hosting | Vercel |
| CSS | Tailwind CSS |
| State | Zustand |
| Tracking | Supabase Analytics + PostHog |

---

## Phase 0: 要件定義・設計（Week 1）

### 0-1. 機能要件の整理

```
┌─────────────────────────────────────────┐
│  A8.net コア機能分解                     │
├─────────────────────────────────────────┤
│                                         │
│  ① ユーザー管理                         │
│     ├─ メディア会員登録・ログイン        │
│     ├─ 広告主登録・ログイン              │
│     ├─ プロフィール管理                  │
│     └─ 権限管理（3ロール）               │
│                                         │
│  ② アフィリエイトプログラム管理          │
│     ├─ プログラム登録（広告主）           │
│     ├─ プログラム検索・参加（メディア）    │
│     ├─ 広告素材管理（バナー/テキスト）    │
│     └─ カテゴリ・タグ管理               │
│                                         │
│  ③ トラッキング・成果計測               │
│     ├─ クリック追跡                      │
│     ├─ コンバージョン追跡                │
│     ├─ Cookie管理                       │
│     └─ 不正検知                         │
│                                         │
│  ④ レポート・ダッシュボード             │
│     ├─ メディア向けレポート              │
│     ├─ 広告主向けレポート                │
│     ├─ リアルタイム統計                  │
│     └─ ランキング                       │
│                                         │
│  ⑤ 決済・報酬管理                      │
│     ├─ 報酬計算                         │
│     ├─ 銀行振込処理                     │
│     ├─ 請求書管理                       │
│     └─ 最低支払額管理                   │
│                                         │
│  ⑥ コンテンツ管理                      │
│     ├─ LP（ランディングページ）          │
│     ├─ 学習プラットフォーム（キャンパス）  │
│     ├─ ブログサービス                   │
│     ├─ FAQ                              │
│     └─ キャンペーン                     │
│                                         │
│  ⑦ SNS連携                            │
│     ├─ Instagram                        │
│     ├─ YouTube                          │
│     ├─ TikTok                           │
│     └─ Pinterest                        │
│                                         │
└─────────────────────────────────────────┘
```

### 0-2. データベース設計

```sql
-- コアテーブル
users                  -- ユーザー（メディア/広告主/管理者）
profiles               -- プロフィール詳細
programs               -- アフィリエイトプログラム
program_categories     -- カテゴリ
program_applications   -- プログラム参加申請
ad_creatives          -- 広告素材（バナー/テキスト）
clicks                -- クリックログ
conversions           -- コンバージョンログ
rewards               -- 報酬レコード
payouts               -- 支払い履歴
sites                 -- 登録サイト/SNSアカウント
campaigns             -- キャンペーン
articles              -- 学習コンテンツ
faqs                  -- よくある質問
notifications         -- 通知
```

### 0-3. API設計

```
/api/auth/*              -- 認証（Supabase Auth）
/api/programs/*          -- プログラムCRUD
/api/programs/search     -- プログラム検索
/api/programs/apply      -- プログラム参加
/api/creatives/*         -- 広告素材管理
/api/tracking/click      -- クリック記録
/api/tracking/conversion -- コンバージョン記録
/api/reports/*           -- レポート生成
/api/payouts/*           -- 支払い管理
/api/sites/*             -- サイト管理
/api/campaigns/*         -- キャンペーン管理
/api/admin/*             -- 管理者機能
```

---

## Phase 1: 環境構築（Week 1-2）

### 1-1. プロジェクト初期化

```bash
# Next.js プロジェクト作成
npx create-next-app@latest affiliate-platform \
  --typescript --tailwind --eslint --app --src-dir

# 依存パッケージ
npm install @supabase/supabase-js @supabase/ssr
npm install stripe @stripe/stripe-js
npm install zustand
npm install @tanstack/react-query
npm install zod react-hook-form @hookform/resolvers
npm install lucide-react
npm install @radix-ui/react-accordion @radix-ui/react-dialog
npm install embla-carousel-react  # スライダー（Slick.js代替）
npm install recharts              # チャート
npm install date-fns
```

### 1-2. Supabase セットアップ

```bash
# Supabase CLI
npx supabase init
npx supabase start
npx supabase db push
```

### 1-3. ディレクトリ構造

```
src/
├── app/
│   ├── (marketing)/           # 公開ページ
│   │   ├── page.tsx           # トップページ（A8.netトップ相当）
│   │   ├── about/page.tsx     # A8.netとは
│   │   ├── affiliate/page.tsx # アフィリエイトとは
│   │   ├── start/page.tsx     # 始め方
│   │   └── faq/page.tsx       # FAQ
│   │
│   ├── (auth)/                # 認証ページ
│   │   ├── login/page.tsx     # ログイン
│   │   ├── register/page.tsx  # 新規登録
│   │   └── forgot/page.tsx    # パスワードリセット
│   │
│   ├── dashboard/             # メディア会員ダッシュボード
│   │   ├── page.tsx           # ダッシュボード
│   │   ├── programs/          # プログラム検索・管理
│   │   ├── reports/           # レポート
│   │   ├── sites/             # サイト管理
│   │   ├── rewards/           # 報酬確認
│   │   └── settings/          # 設定
│   │
│   ├── advertiser/            # 広告主ダッシュボード
│   │   ├── page.tsx           # ダッシュボード
│   │   ├── programs/          # プログラム管理
│   │   ├── creatives/         # 広告素材管理
│   │   ├── reports/           # レポート
│   │   └── billing/           # 請求・支払い
│   │
│   ├── admin/                 # 管理者
│   │   ├── users/
│   │   ├── programs/
│   │   └── payouts/
│   │
│   ├── campus/                # 学習プラットフォーム
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   │
│   ├── api/                   # API Routes
│   │   ├── tracking/
│   │   ├── programs/
│   │   ├── reports/
│   │   ├── payouts/
│   │   └── webhooks/
│   │
│   └── layout.tsx
│
├── components/
│   ├── ui/                    # 共通UIコンポーネント
│   ├── marketing/             # マーケティングページ用
│   ├── dashboard/             # ダッシュボード用
│   └── advertiser/            # 広告主用
│
├── lib/
│   ├── supabase/              # Supabase クライアント
│   ├── stripe/                # Stripe 連携
│   ├── tracking/              # トラッキングロジック
│   └── utils/                 # ユーティリティ
│
├── hooks/                     # カスタムフック
├── stores/                    # Zustand ストア
├── types/                     # TypeScript型定義
└── styles/                    # グローバルスタイル
```

---

## Phase 2: 認証・ユーザー管理（Week 2-3）

### 実装項目
1. Supabase Auth セットアップ
2. メディア会員登録フロー（メール認証→プロフィール→サイト登録→審査）
3. 広告主登録フロー（企業情報→審査）
4. ログイン/ログアウト
5. パスワードリセット
6. ロールベースアクセス制御（media/advertiser/admin）
7. セッション管理

---

## Phase 3: トップページ・マーケティングページ（Week 3-4）

### A8.netトップページの再構築

| セクション | コンポーネント | 実装 |
|-----------|--------------|------|
| ヘッダー | ナビ + ログインフォーム×2 | Next.js + Tailwind |
| ヒーロー | スライダー | Embla Carousel |
| 仕組み説明 | ステップ図解 | SVG + CSS Animation |
| 広告主ロゴ | 無限カルーセル | CSS @keyframes |
| 統計 | カウントアップ | Intersection Observer |
| ランキング | カード×3 | Server Component |
| インタビュー | カード群 | Server Component |
| FAQ | アコーディオン | Radix UI |
| CTA | ボタン群 | Tailwind |
| フッター | 4列リンク | Grid Layout |

---

## Phase 4: アフィリエイトプログラム管理（Week 4-6）

### 実装項目
1. プログラム登録（広告主側）
2. 広告素材アップロード（バナー画像/テキスト/HTML）
3. プログラム検索（カテゴリ/キーワード/報酬額）
4. プログラム参加申請（メディア側）
5. 申請承認/却下（広告主側）
6. 広告タグ生成（クリックURL + パラメータ）

---

## Phase 5: トラッキングシステム（Week 6-8）

### 実装項目
1. クリックトラッキング（リダイレクト方式）
2. コンバージョントラッキング（ピクセル/ポストバック）
3. Cookie管理（30日/90日）
4. 重複排除
5. 不正クリック検知
6. リアルタイムログ記録

### アーキテクチャ
```
ユーザークリック
  → /api/tracking/click?pid=xxx&sid=yyy
  → Cookie設定 + ログ記録
  → 広告主サイトへリダイレクト

コンバージョン
  → 広告主サイトから /api/tracking/conversion
  → Cookie照合 → 成果記録
  → 報酬計算
```

---

## Phase 6: レポート・ダッシュボード（Week 8-9）

### 実装項目
1. メディア向けダッシュボード（クリック数/成果数/報酬額）
2. 広告主向けダッシュボード（出稿状況/成果/コスト）
3. 日別/月別レポート
4. プログラム別レポート
5. サイト別レポート
6. ランキング表示
7. CSV/Excelエクスポート
8. リアルタイムチャート（Recharts）

---

## Phase 7: 決済・報酬管理（Week 9-10）

### 実装項目
1. 報酬計算バッチ（月末締め）
2. 最低支払額管理（1,000円）
3. 銀行口座登録
4. 振込処理（Stripe Connect / 銀行API）
5. 支払い履歴
6. 請求書生成（広告主向け）
7. Stripe統合（広告主の広告費支払い）

---

## Phase 8: コンテンツ管理（Week 10-11）

### 実装項目
1. A8キャンパス（学習コンテンツCMS）
2. FAQ管理
3. キャンペーン管理
4. お知らせ・通知
5. ブログサービス（ファンブログ相当）

---

## Phase 9: SNS連携（Week 11-12）

### 実装項目
1. Instagram連携（投稿でのアフィリエイト）
2. YouTube連携（概要欄リンク）
3. TikTok連携
4. Pinterest連携
5. SNSアカウント登録・審査

---

## Phase 10: 管理者機能（Week 12-13）

### 実装項目
1. ユーザー管理（承認/停止/削除）
2. プログラム審査
3. 不正検知ダッシュボード
4. 支払い承認
5. システム設定
6. メンテナンスモード

---

## Phase 11: テスト・品質保証（Week 13-14）

### 実装項目
1. ユニットテスト（Jest/Vitest）
2. E2Eテスト（Playwright）
3. パフォーマンステスト
4. セキュリティスキャン（Trivy）
5. 負荷テスト（k6）
6. アクセシビリティテスト

---

## Phase 12: デプロイ・運用（Week 14-15）

### 実装項目
1. Vercelデプロイ
2. ドメイン設定
3. SSL設定
4. CDN設定
5. 監視設定（Sentry, PostHog）
6. バックアップ設定
7. CI/CDパイプライン

---

# 必要なMCP（Claude Code開発用）

## Tier 1: 必須MCP（6個）

| MCP | 用途 | ソース |
|-----|------|--------|
| **Supabase MCP** | DB操作・Auth・RLS・マイグレーション | [公式](https://supabase.com/docs/guides/getting-started/mcp) |
| **Stripe MCP** | 決済統合・サブスクリプション・請求 | [MCPMarket](https://mcpmarket.com/server/stripe) |
| **GitHub MCP** | リポジトリ管理・PR・Issue | [公式](https://github.com/modelcontextprotocol/servers) |
| **Vercel MCP** | デプロイ・プレビュー・ドメイン管理 | [MCPMarket](https://mcpmarket.com/server/vercel) |
| **Context7 MCP** | Next.js/React/Tailwind最新ドキュメント | 既存(.mcp.json) |
| **Playwright MCP** | E2Eテスト・ブラウザ自動化 | [MCPMarket](https://mcpmarket.com/server/playwright) |

## Tier 2: 推奨MCP（5個）

| MCP | 用途 | ソース |
|-----|------|--------|
| **Postmark/Resend MCP** | トランザクションメール送信 | [MCPMarket](https://mcpmarket.com) |
| **PostHog MCP** | アナリティクス・ユーザー行動分析 | [MCPMarket](https://mcpmarket.com/server/posthog) |
| **Sentry MCP** | エラー監視・パフォーマンス | [MCPMarket](https://mcpmarket.com/server/sentry) |
| **n8n MCP** | ワークフロー自動化（報酬計算バッチ等） | [MCPMarket](https://mcpmarket.com/server/n8n) |
| **Figma MCP** | UIデザイン→コード変換 | 既存(.mcp.json) |

## Tier 3: オプションMCP（4個）

| MCP | 用途 | ソース |
|-----|------|--------|
| **Cloudflare MCP** | CDN・WAF・DDoS防御 | [MCPMarket](https://mcpmarket.com/server/cloudflare) |
| **Redis/Upstash MCP** | キャッシュ・セッション・レート制限 | [MCPMarket](https://mcpmarket.com) |
| **Slack MCP** | チーム通知・アラート | [MCPMarket](https://mcpmarket.com/server/slack) |
| **GPT Researcher MCP** | 競合分析・市場調査 | 既存(.mcp.json) |

---

# 必要なTAISUNスキル

## 既存スキル（活用可能）

| スキル | 用途 |
|--------|------|
| `sales-letter` | LP（ランディングページ）のコピーライティング |
| `taiyo-style` | 太陽スタイルでのコンバージョン最適化 |
| `taiyo-style-lp` | LP構造・心理トリガー最適化 |
| `lp-analysis` | LP分析・成約率改善 |
| `lp-json-generator` | LP画像テキスト差し替え |
| `copywriting-helper` | マーケティングコピー全般 |
| `step-mail` | ステップメール（新規登録後のオンボーディング） |
| `customer-support` | カスタマーサポート対応テンプレート |
| `security-scan-trivy` | セキュリティ脆弱性スキャン |
| `workflow-automation-n8n` | n8nワークフロー構築 |
| `postgres-mcp-analyst` | PostgreSQL分析クエリ |
| `doc-convert-pandoc` | ドキュメント変換 |
| `research-cited-report` | 競合調査レポート |

## 新規スキル（作成推奨）

| スキル | 用途 |
|--------|------|
| `affiliate-platform-builder` | アフィリエイトプラットフォーム構築ガイド |
| `tracking-system-builder` | クリック/CV追跡システム構築 |
| `payment-integration` | Stripe決済・銀行振込統合 |
| `dashboard-builder` | ダッシュボード・レポートUI構築 |
| `supabase-schema-designer` | Supabase DB スキーマ設計 |

---

# 工数見積り

| Phase | 期間 | 重要度 |
|-------|------|--------|
| Phase 0: 要件定義・設計 | Week 1 | ★★★ |
| Phase 1: 環境構築 | Week 1-2 | ★★★ |
| Phase 2: 認証・ユーザー管理 | Week 2-3 | ★★★ |
| Phase 3: トップページ・LP | Week 3-4 | ★★☆ |
| Phase 4: プログラム管理 | Week 4-6 | ★★★ |
| Phase 5: トラッキング | Week 6-8 | ★★★ |
| Phase 6: レポート | Week 8-9 | ★★☆ |
| Phase 7: 決済・報酬 | Week 9-10 | ★★★ |
| Phase 8: コンテンツ管理 | Week 10-11 | ★★☆ |
| Phase 9: SNS連携 | Week 11-12 | ★☆☆ |
| Phase 10: 管理者機能 | Week 12-13 | ★★☆ |
| Phase 11: テスト・品質 | Week 13-14 | ★★★ |
| Phase 12: デプロイ | Week 14-15 | ★★☆ |
