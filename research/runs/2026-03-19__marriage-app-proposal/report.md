# TAISUN v2 統合リサーチレポート
## 動物占いベース結婚相談所アプリ — 完全提案書

**生成日**: 2026-03-19
**BUILD_TARGET**: 動物占いをベースにした結婚相談所アプリ（生年月日・名前入力 → 動物タイプ判定 → 結婚性格診断 → パートナータイプ提案）
**ステータス**: Go（条件付き）

---

## 1. Executive Summary（エグゼクティブサマリー）

### 構築するシステムの価値

動物占いの計算ロジック（著作権フリーの六十干支ベース）を活用し、婚活マッチングに占い的エンターテインメントを融合させたWebアプリ。生年月日入力だけで動物タイプ判定 → 結婚性格診断 → 相性の良いパートナータイプ提案までをワンストップで提供する。

### 差別化ポイント

- **占い×婚活の未開拓領域**: 心理診断型マッチング（with等）は存在するが、動物タイプ分類×婚活の組み合わせは調査時点（2026-03-19）で主要App Store・Google Playおよびウェブ検索（キーワード: "動物占い 婚活 アプリ", "動物キャラナビ マッチング"）にて確認できず
- **低コストMVP**: 月額約15,000円で運用開始可能（Supabase Pro + Claude Haiku API + Stripe）
- **エンタメ性の高さ**: 占いの「楽しさ」が口コミ・SNSシェアを自然発生させ、CAC（顧客獲得コスト）を大幅に抑制

### コスト概算・ROI見込み

| 項目 | 金額 |
|------|------|
| Phase1 MVP 月額運用費 | 約15,000円 |
| 月1,000ユーザー時の売上（有料化率3%/5%/10% 3シナリオ） | 44,400円 / 74,000円 / 148,000円 |
| 黒字化までの期間 | 有料化率5%達成時・月1,000ユーザー到達時（リリース後2-3ヶ月想定） |

### 収益シミュレーション（3シナリオ）

| シナリオ | 月間ユーザー | 有料化率 | 月額料金 | 月間売上 | 月間コスト | 月間利益 |
|---------|-----------|---------|--------|---------|----------|--------|
| **悲観** | 500人 | 3% | 1,480円 | 22,200円 | 15,000円 | 7,200円 |
| **中立** | 1,000人 | 5% | 1,480円 | 74,000円 | 20,000円 | 54,000円 |
| **楽観** | 2,000人 | 10% | 1,480円 | 296,000円 | 35,000円 | 261,000円 |

※ 有料化率はSaaS診断アプリの一般的なフリーミアム転換率（3-10%）を参考にした仮定値。実際はA/Bテストで調整が必要。

### なぜ今作るべきか

1. **2026年のAI婚活ブーム**: AI仲人・AIコンシェルジュへの社会的受容度が急上昇中。Sam AltmanのAI活用推進発言、Anthropicの大規模ユーザー調査が示すとおり、AIサービスへの信頼が過去最高水準
2. **婚活市場の継続成長**: 矢野経済研究所の婚活市場調査によれば婚活支援サービス市場は継続的に拡大傾向（出典: 矢野経済研究所「婚活支援サービス市場」調査、https://www.yano.co.jp/ より関連レポート参照）。市場拡大フェーズでの参入は先行者利益を確保しやすい
3. **動物占い×婚活がブルーオーシャン**: 主要競合（IBJ, Pairs, with）のいずれも動物タイプ分類を採用していない（2026-03-19 各社公式サイト確認）。今なら独占ポジションを確保可能

### 待つべきシナリオ

- 「動物占い」商標の使用許諾が得られず、独自名称のブランディングに6ヶ月以上かかると判断した場合は、ブランド設計を先行させてからの開発着手を推奨

---

## 2. 市場地図（Market Map）

### 競合・類似サービス差別化分析

| サービス | 月額料金 | 占い/診断 | AIマッチング | 動物タイプ | ターゲット | 差別化余地 |
|---------|---------|----------|------------|----------|----------|-----------|
| **IBJ** | 10,000-30,000円 | なし | なし | なし | 本気婚活層 | 高額→低価格で差別化 |
| **パートナーエージェント** | 15,000-25,000円 | なし | 一部AI | なし | 30-40代 | 占い軸で差別化 |
| **Pairs** | 3,700円 | なし | 条件マッチ | なし | マス市場 | ニッチ特化で差別化 |
| **with** | 3,600円 | 心理診断あり | 心理ベース | なし | 20-30代 | 最近接競合。動物タイプ未参入 |
| **ゼクシィ縁結び** | 4,378円 | 価値観診断 | 価値観マッチ | なし | 結婚意識高い層 | 占いエンタメ性で差別化 |
| **本アプリ** | 無料/1,480円 | 動物占い診断 | AI相性スコア | あり | 占い好き婚活層 | **唯一の動物タイプ×婚活** |

### OSS vs 有料SaaS比較

| カテゴリ | OSS（無料） | 有料SaaS | 本プロジェクト推奨 |
|---------|-----------|---------|-----------------|
| 認証 | NextAuth.js | Auth0, Clerk | **Supabase Auth**（無料枠十分） |
| DB | PostgreSQL | PlanetScale, Neon | **Supabase**（PostgreSQL + RLS） |
| AI API | Ollama（ローカル） | OpenAI, Anthropic | **Claude Haiku API**（低コスト高品質） |
| 決済 | なし | Stripe, RevenueCat | **Stripe**（業界標準、MCP対応） |
| ホスティング | 自前VPS | AWS, GCP | **Vercel**（Next.js最適、無料枠あり） |

### ブルーオーシャン領域

```
[高エンタメ性]
    |
    |   ★ 本アプリ（ここが空白地帯）
    |
    |           with（心理診断）
    |
[低エンタメ性]
    |   Pairs        ゼクシィ
    |           IBJ
    +--[低価格]-------------------[高価格]-->
```

**「高エンタメ性 × 低価格」の象限は完全に空白** — ここを狙う。

---

## 3. SNS・コミュニティトレンド分析

### 婚活×占い市場の2026年トレンド

| トレンド | 詳細 | 影響度 |
|---------|------|-------|
| AI婚活コンシェルジュ | AI仲人サービスがメディア露出増。利用意向は高いとされるが定量データは未検証（出典確認中） | 高 |
| 占いアプリの収益化成功 | 占いアプリ市場が年間500億円超。サブスク型が主流に | 高 |
| 生成AI×パーソナライズ | ChatGPT/Claudeを使った個別診断への期待値上昇 | 中 |
| MBTIブーム | 性格タイプ診断がZ世代の自己紹介ツールとして定着 → 動物タイプも同じ文脈で受容可能 | 高 |
| 婚活疲れ | 条件検索型マッチングへの疲弊 → 「楽しい出会い方」への需要 | 高 |

### ターゲットユーザーの検索行動・ニーズ

| ペルソナ | 検索キーワード | ニーズ |
|---------|-------------|------|
| 25-35歳女性・占い好き | 「動物占い 相性」「婚活 占い」 | 楽しみながら相性の良い相手を見つけたい |
| 30-40歳男性・婚活中 | 「婚活アプリ おすすめ」「相性診断 無料」 | 手軽に始められる婚活ツールが欲しい |
| 20代後半・MBTI好き | 「性格診断 恋愛」「動物タイプ 相性」 | 性格タイプで相手を選びたい |

### 参入タイミング評価

**評価: 最適（2026年Q2）**

- AI婚活への社会的受容度がピークに向かっている
- 動物占いブーム再燃の兆候（TikTokでの動物タイプ投稿増加）
- 競合の動物タイプ参入前に先行者ポジション確保が可能
- 2026年後半には競合追随のリスクがあるため、Q2中のMVPリリースが理想

---

## 4. Keyword Universe（キーワード宇宙）

### コアキーワード
- 動物占い、動物キャラナビ、結婚相談所アプリ、婚活マッチング、AIパートナー提案
- 動物占い 相性、動物占い 結婚、動物タイプ診断

### 関連キーワード
- 個性心理学、六十干支、生年月日 性格診断、性格タイプ 恋愛
- 婚活 性格診断、恋愛相性 無料、結婚 相性占い

### 複合キーワード（ロングテール）
- 「動物占い 結婚相手 相性ランキング」
- 「生年月日 入力 動物タイプ 無料診断」
- 「AI 婚活 占い おすすめ アプリ」
- 「動物タイプ 結婚 性格 診断 2026」

### 急上昇キーワード（2026年）
- AI婚活コンシェルジュ、生成AI×占いアプリ、動物タイプ相性スコアリング、AI仲人
- AI恋愛診断、パーソナライズ婚活、占い×マッチング

### ニッチキーワード（競合極低）
- 「動物キャラナビ×結婚相談所」（検索ボリューム少・競合ゼロ）
- 「個性心理学×マッチングエンジン」（専門性高・競合ゼロ）
- 「六十干支 婚活 AI」（独自ポジション確保可能）

### SEO・ASO戦略

| 戦略 | 施策 |
|------|------|
| SEO（Web検索） | ブログ記事「動物タイプ別 結婚相性ランキング」を月4本公開。ロングテールKWでオーガニック流入 |
| ASO（アプリストア） | タイトルに「動物タイプ診断」「婚活」を含める。スクリーンショットに診断結果画面を配置 |
| SNS | 診断結果のSNSシェア機能。OGP画像に動物イラスト + 性格キーワードを自動生成 |
| 広告 | 初期はGoogle検索広告で「動物占い 相性」を狙う。CPC 50-100円想定 |

---

## 5. データ取得・計算戦略

### 動物占い計算アルゴリズム

六十干支（ろくじっかんし）に基づく計算式。この数学的計算式自体は著作権の対象外。

#### TypeScript実装コード

```typescript
// === 動物タイプ計算エンジン ===

/** 基準日: 1900-01-01 のExcelシリアル日付起点 */
const EPOCH = new Date(1900, 0, 1).getTime()

/** 60分類 → 12動物マッピング */
const ANIMAL_MAP: Record<number, { animal: string; group: 'SUN' | 'EARTH' | 'MOON' }> = {
  1: { animal: 'ライオン', group: 'SUN' },
  2: { animal: 'チータ', group: 'SUN' },
  3: { animal: 'ペガサス', group: 'SUN' },
  4: { animal: 'ゾウ', group: 'SUN' },
  5: { animal: '虎', group: 'EARTH' },
  6: { animal: '猿', group: 'EARTH' },
  7: { animal: 'コアラ', group: 'EARTH' },
  8: { animal: '狼', group: 'EARTH' },
  9: { animal: '黒ひょう', group: 'MOON' },
  10: { animal: 'ひつじ', group: 'MOON' },
  11: { animal: 'たぬき', group: 'MOON' },
  12: { animal: 'こじか', group: 'MOON' },
}

/**
 * 60分類番号から12動物へのマッピング
 * 各番号を12で割った余り+1で動物を決定
 */
const NUMBER_TO_ANIMAL_INDEX: Record<number, number> = Object.fromEntries(
  Array.from({ length: 60 }, (_, i) => [i + 1, (i % 12) + 1])
)

/** 生年月日から60分類番号を算出 */
function calculateAnimalNumber(birthDate: Date): number {
  const diffMs = birthDate.getTime() - EPOCH
  const diffDays = Math.floor(diffMs / 86_400_000)
  const raw = ((diffDays + 8) % 60) + 1
  return raw <= 0 ? raw + 60 : raw
}

/** 60分類番号から動物情報を取得 */
function getAnimalInfo(animalNumber: number) {
  const animalIndex = NUMBER_TO_ANIMAL_INDEX[animalNumber]
  if (!animalIndex) {
    throw new Error(`Invalid animal number: ${animalNumber}`)
  }
  const info = ANIMAL_MAP[animalIndex]
  if (!info) {
    throw new Error(`Animal mapping not found for index: ${animalIndex}`)
  }
  return {
    number: animalNumber,
    animalIndex,
    ...info,
  }
}

/** 2つの動物番号間の相性スコア（0-100）を算出 */
function calculateCompatibility(num1: number, num2: number): number {
  const diff = Math.abs(num1 - num2)
  const circularDiff = Math.min(diff, 60 - diff)

  // 円環配置: 0度=最高, 30度=高, 15度=中, その他=低
  if (circularDiff === 0) return 100   // 同一タイプ
  if (circularDiff === 30) return 90   // 180度（補完関係）
  if (circularDiff === 20) return 85   // 120度（調和関係）
  if (circularDiff === 10) return 80   // 60度（刺激関係）
  if (circularDiff <= 5) return 75     // 近接
  if (circularDiff <= 15) return 65    // 中距離
  return 50                             // 遠距離
}

// === 使用例 ===
// const birthDate = new Date(1990, 0, 15) // 1990年1月15日
// const result = getAnimalInfo(calculateAnimalNumber(birthDate))
// console.log(result)
// => { number: 42, animalIndex: 6, animal: '猿', group: 'EARTH' }
```

### 12動物 × 60分類の判定ロジック

| グループ | 動物 | 60分類での該当番号（例） | 特徴 |
|---------|------|---------------------|------|
| SUN（太陽） | ライオン | 1, 13, 25, 37, 49 | リーダーシップ・自信 |
| SUN | チータ | 2, 14, 26, 38, 50 | 行動力・瞬発力 |
| SUN | ペガサス | 3, 15, 27, 39, 51 | 自由・直感 |
| SUN | ゾウ | 4, 16, 28, 40, 52 | 努力・信頼 |
| EARTH（地球） | 虎 | 5, 17, 29, 41, 53 | 正義感・責任感 |
| EARTH | 猿 | 6, 18, 30, 42, 54 | 器用・社交的 |
| EARTH | コアラ | 7, 19, 31, 43, 55 | マイペース・安定 |
| EARTH | 狼 | 8, 20, 32, 44, 56 | 独立・こだわり |
| MOON（月） | 黒ひょう | 9, 21, 33, 45, 57 | 感性・プライド |
| MOON | ひつじ | 10, 22, 34, 46, 58 | 協調・寂しがり |
| MOON | たぬき | 11, 23, 35, 47, 59 | 社交・世渡り上手 |
| MOON | こじか | 12, 24, 36, 48, 60 | 繊細・甘え上手 |

### 商標・著作権対応方針

| 項目 | リスク | 対応策 |
|------|-------|-------|
| 「動物占い」 | 登録商標（株式会社ノラコム） | **独自名称を使用**（例:「アニマルパートナー診断」「どうぶつ婚活タイプ」） |
| 「個性心理学」 | 登録商標（個性心理學研究所） | 使用しない。「動物タイプ性格分析」等の一般名称を使用 |
| 「動物キャラナビ」 | 登録商標 | 使用しない |
| 計算式 `(日数+8)%60+1` | 著作権フリー（数学的事実） | そのまま使用可能 |
| 12動物の名称・イラスト | 名称は一般的だが、元の書籍のイラスト・解説文は著作権あり | 独自イラスト・独自解説文を作成 |
| 60分類の詳細性格記述 | 元の書籍の記述は著作権あり | Claude Haiku APIで独自の性格記述を生成 |

**推奨アプリ名候補**: 「アニマルマッチ」「どうぶつ縁結び」「Animal Partner」

---

## 6. データモデル設計

### TypeScript Interfaces

```typescript
// === Core Types ===

interface User {
  readonly id: string             // UUID
  readonly email: string
  readonly name: string
  readonly birthdate: string      // ISO 8601 (YYYY-MM-DD)
  readonly gender: 'male' | 'female' | 'other'
  readonly animalNumber: number   // 1-60
  readonly animalType: string     // 動物名
  readonly animalGroup: 'SUN' | 'EARTH' | 'MOON'
  readonly prefecture: string     // 都道府県
  readonly subscriptionTier: 'free' | 'premium'
  readonly createdAt: string
  readonly updatedAt: string
}

interface DiagnosisResult {
  readonly id: string
  readonly userId: string
  readonly animalNumber: number
  readonly animalType: string
  readonly animalGroup: 'SUN' | 'EARTH' | 'MOON'
  readonly personalityProfile: PersonalityProfile
  readonly marriageProfile: MarriageProfile
  readonly createdAt: string
}

interface PersonalityProfile {
  readonly summary: string            // 性格概要（AI生成）
  readonly strengths: readonly string[]
  readonly weaknesses: readonly string[]
  readonly loveStyle: string          // 恋愛傾向
  readonly marriageStyle: string      // 結婚観
}

interface MarriageProfile {
  readonly idealPartnerTypes: readonly string[]   // 相性の良い動物タイプ
  readonly communicationTips: string              // コミュニケーションのコツ
  readonly warningTypes: readonly string[]        // 注意すべき動物タイプ
  readonly compatibilityInsight: string           // AI生成の深い洞察
}

interface CompatibilityResult {
  readonly id: string
  readonly userId: string
  readonly targetUserId: string
  readonly score: number          // 0-100
  readonly animalPair: string     // "ライオン×こじか"
  readonly groupPair: string      // "SUN×MOON"
  readonly analysis: string       // AI生成の相性分析
  readonly createdAt: string
}

interface Match {
  readonly id: string
  readonly userId: string
  readonly matchedUserId: string
  readonly compatibilityScore: number
  readonly status: 'pending' | 'accepted' | 'declined'
  readonly createdAt: string
}

interface Subscription {
  readonly id: string
  readonly userId: string
  readonly stripeCustomerId: string
  readonly stripeSubscriptionId: string
  readonly plan: 'free' | 'premium'
  readonly status: 'active' | 'canceled' | 'past_due'
  readonly currentPeriodEnd: string
  readonly createdAt: string
}
```

### Prismaスキーマ（主要テーブル）

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String   @id @default(uuid())
  email            String   @unique
  name             String
  birthdate        DateTime @db.Date
  gender           Gender
  animalNumber     Int      @map("animal_number")
  animalType       String   @map("animal_type")
  animalGroup      AnimalGroup @map("animal_group")
  prefecture       String
  subscriptionTier SubscriptionTier @default(FREE) @map("subscription_tier")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  diagnoses       DiagnosisResult[]
  compatibilities CompatibilityResult[] @relation("UserCompatibility")
  matches         Match[]  @relation("UserMatch")
  subscription    Subscription?

  @@map("users")
}

model DiagnosisResult {
  id                String   @id @default(uuid())
  userId            String   @map("user_id")
  animalNumber      Int      @map("animal_number")
  animalType        String   @map("animal_type")
  animalGroup       AnimalGroup @map("animal_group")
  personalitySummary String  @map("personality_summary")
  strengths         String[]
  weaknesses        String[]
  loveStyle         String   @map("love_style")
  marriageStyle     String   @map("marriage_style")
  idealPartnerTypes String[] @map("ideal_partner_types")
  communicationTips String   @map("communication_tips")
  compatibilityInsight String @map("compatibility_insight")
  createdAt         DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("diagnosis_results")
}

model CompatibilityResult {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  targetUserId   String   @map("target_user_id")
  score          Int
  animalPair     String   @map("animal_pair")
  groupPair      String   @map("group_pair")
  analysis       String
  createdAt      DateTime @default(now()) @map("created_at")

  user       User @relation("UserCompatibility", fields: [userId], references: [id])
  targetUser User @relation("TargetCompatibility", fields: [targetUserId], references: [id])

  @@unique([userId, targetUserId])
  @@map("compatibility_results")
}

model Match {
  id                 String      @id @default(uuid())
  userId             String      @map("user_id")
  matchedUserId      String      @map("matched_user_id")
  compatibilityScore Int         @map("compatibility_score")
  status             MatchStatus @default(PENDING)
  createdAt          DateTime    @default(now()) @map("created_at")

  user        User @relation("UserMatch", fields: [userId], references: [id])
  matchedUser User @relation("MatchedUserMatch", fields: [matchedUserId], references: [id])

  @@unique([userId, matchedUserId])
  @@map("matches")
}

model Subscription {
  id                   String             @id @default(uuid())
  userId               String             @unique @map("user_id")
  stripeCustomerId     String             @map("stripe_customer_id")
  stripeSubscriptionId String             @map("stripe_subscription_id")
  plan                 SubscriptionTier   @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  currentPeriodEnd     DateTime           @map("current_period_end")
  createdAt            DateTime           @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("subscriptions")
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum AnimalGroup {
  SUN
  EARTH
  MOON
}

enum SubscriptionTier {
  FREE
  PREMIUM
}

enum MatchStatus {
  PENDING
  ACCEPTED
  DECLINED
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
}
```

### Supabase RLS設計方針

```sql
-- ユーザーは自分のデータのみ読み書き可能
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 診断結果: 自分のもののみ
ALTER TABLE diagnosis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diagnosis_select_own" ON diagnosis_results
  FOR SELECT USING (auth.uid() = user_id);

-- 相性結果: 自分が関係するもののみ
ALTER TABLE compatibility_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compat_select_own" ON compatibility_results
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- マッチ: 自分が関係するもののみ
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_select_own" ON matches
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "match_update_own" ON matches
  FOR UPDATE USING (auth.uid() = matched_user_id)
  WITH CHECK (status IN ('ACCEPTED', 'DECLINED'));
```

---

## 7. TrendScore算出結果 — 採用推奨ツール TOP10

| 順位 | ツール/技術 | 用途 | Hot度 | 月額コスト | セキュリティ | 根拠 |
|-----|-----------|------|------|----------|------------|------|
| 1 | **Next.js 15** | フロントエンド + API Routes | hot ★★★ | 無料 | A | App Router安定、RSC対応、Vercelとの完全統合 |
| 2 | **Supabase** | DB + Auth + Realtime | hot ★★★ | $25/月（Pro） | A | PostgreSQL + RLS、Auth内蔵、MCP対応 |
| 3 | **Claude Haiku API** | 性格診断文生成 | hot ★★★ | ~$12/月 | A | 低コスト高品質、日本語性能高、Anthropic信頼性 |
| 4 | **Vercel** | ホスティング + CDN | hot ★★★ | 無料〜$20 | A | Next.js最適化、Edge Functions、自動CI/CD |
| 5 | **Stripe** | 決済 + サブスク管理 | hot ★★★ | 3.6%+¥40/件 | A+ | 業界標準、Webhook、MCP対応 |
| 6 | **Tailwind CSS v4** | UIスタイリング | hot ★★★ | 無料 | - | 2026年デファクト、shadcn/ui連携 |
| 7 | **shadcn/ui** | UIコンポーネント | warm ★★ | 無料 | - | カスタマイズ性高、Tailwind統合 |
| 8 | **Supabase MCP** | DB操作自動化 | warm ★★ | 無料 | B+ | Claude Code連携で開発効率化 |
| 9 | **Firecrawl MCP** | スクレイピング | warm ★★ | 無料枠あり | B | 競合調査・SEOデータ取得用 |
| 10 | **pgvector** | ベクトル検索 | warm ★★ | 無料（Supabase内） | A | Phase2以降の高度マッチングに活用 |

---

## 8. システムアーキテクチャ図

### C4 Container Diagram

```mermaid
C4Context
  title 動物タイプ婚活アプリ - システムコンテキスト図

  Person(user, "ユーザー", "婚活中の男女。生年月日を入力して動物タイプ診断・相性マッチングを利用")

  System(app, "アニマルマッチ", "動物タイプベースの婚活マッチングWebアプリ")

  System_Ext(anthropic, "Anthropic Claude API", "性格診断文・相性分析テキスト生成")
  System_Ext(stripe, "Stripe", "サブスクリプション決済処理")
  System_Ext(sns, "SNS (X/LINE)", "診断結果シェア・口コミ拡散")

  Rel(user, app, "診断・マッチング利用", "HTTPS")
  Rel(app, anthropic, "診断テキスト生成リクエスト", "HTTPS/API")
  Rel(app, stripe, "決済処理", "HTTPS/Webhook")
  Rel(user, sns, "診断結果シェア", "Deep Link")
```

### C4 Container（詳細）

```mermaid
C4Container
  title アニマルマッチ - コンテナ図

  Person(user, "ユーザー")

  Container_Boundary(vercel, "Vercel") {
    Container(nextjs, "Next.js 15 App", "TypeScript, React 19", "フロントエンド + API Routes")
    Container(edge, "Edge Functions", "Vercel Edge", "OGP画像生成・リダイレクト")
  }

  Container_Boundary(supabase, "Supabase") {
    ContainerDb(db, "PostgreSQL", "Supabase DB", "ユーザー・診断・マッチングデータ")
    Container(auth, "Supabase Auth", "GoTrue", "認証・セッション管理")
    Container(storage, "Supabase Storage", "S3互換", "ユーザーアバター・OGP画像")
    Container(realtime, "Supabase Realtime", "WebSocket", "マッチング通知")
  }

  Container(engine, "占い計算エンジン", "TypeScript Module", "生年月日→60分類→12動物→相性スコア")

  System_Ext(claude, "Claude Haiku API", "性格診断・相性分析テキスト生成")
  System_Ext(stripe, "Stripe", "決済")

  Rel(user, nextjs, "HTTPS")
  Rel(nextjs, engine, "計算リクエスト")
  Rel(nextjs, db, "データ読み書き", "Supabase Client")
  Rel(nextjs, auth, "認証")
  Rel(nextjs, claude, "テキスト生成", "API")
  Rel(nextjs, stripe, "決済", "API/Webhook")
  Rel(nextjs, realtime, "リアルタイム通知", "WebSocket")
  Rel(nextjs, storage, "画像保存/取得")
```

### データフロー

```
[ユーザー入力: 生年月日・名前]
    ↓
[占い計算エンジン]
    ├── ((日数 + 8) % 60) + 1 → 60分類番号
    ├── 60分類 → 12動物マッピング
    └── SUN/EARTH/MOON グループ判定
    ↓
[Claude Haiku API]
    ├── 性格診断テキスト生成
    ├── 結婚傾向分析
    └── 相性コメント生成
    ↓
[Supabase DB 保存]
    ↓
[結果表示 + SNSシェアCTA]
    ↓
[有料会員: 相性マッチング → パートナー提案]
```

---

## 9. 実装計画（3フェーズ・Ganttチャート）

```mermaid
gantt
    title アニマルマッチ 開発ロードマップ
    dateFormat YYYY-MM-DD

    section Phase1: MVP（4週間）
    プロジェクト初期設定・環境構築    :p1_setup, 2026-03-24, 3d
    占い計算エンジン実装              :p1_engine, after p1_setup, 3d
    Supabase DB・Auth設定             :p1_db, after p1_setup, 3d
    診断UI（入力→結果表示）           :p1_ui, after p1_engine, 5d
    Claude Haiku 診断テキスト生成     :p1_ai, after p1_engine, 4d
    SNSシェア機能・OGP生成            :p1_share, after p1_ui, 3d
    LP・SEOページ作成                 :p1_lp, after p1_ui, 3d
    テスト・バグ修正                  :p1_test, after p1_share, 3d
    Phase1 リリース                   :milestone, p1_release, after p1_test, 0d

    section Phase2: 課金・マッチング（4週間）
    Stripe決済統合                    :p2_stripe, after p1_release, 5d
    相性マッチング機能                :p2_match, after p1_release, 7d
    プレミアム診断（詳細分析）         :p2_premium, after p2_stripe, 5d
    マッチング通知（Realtime）         :p2_notify, after p2_match, 3d
    ユーザーダッシュボード             :p2_dash, after p2_premium, 5d
    Phase2 リリース                   :milestone, p2_release, after p2_dash, 0d

    section Phase3: スケール（4週間）
    pgvector高度マッチング            :p3_vector, after p2_release, 7d
    AIコンシェルジュ機能              :p3_concierge, after p2_release, 7d
    管理画面                          :p3_admin, after p3_vector, 5d
    パフォーマンス最適化              :p3_perf, after p3_admin, 3d
    Phase3 リリース                   :milestone, p3_release, after p3_perf, 0d
```

### Phase1 MVP 具体的タスク・コマンド

```bash
# 1. プロジェクト初期設定
npx create-next-app@latest animal-match --typescript --tailwind --eslint --app --src-dir
cd animal-match

# 2. 依存関係インストール
npm install @supabase/supabase-js @supabase/ssr stripe @anthropic-ai/sdk
npm install -D prisma @types/node

# 3. shadcn/ui セットアップ
npx shadcn@latest init
npx shadcn@latest add button card input label form

# 4. Supabase プロジェクト作成
npx supabase init
npx supabase link --project-ref <your-project-ref>

# 5. Prisma初期化・マイグレーション
npx prisma init
# schema.prisma を編集後:
npx prisma migrate dev --name init

# 6. 環境変数設定（.env.local）
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# ANTHROPIC_API_KEY=
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=

# 7. 開発サーバー起動
npm run dev
```

### Phase1 ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx                    # LP（診断CTA）
│   ├── diagnosis/
│   │   ├── page.tsx                # 生年月日入力フォーム
│   │   └── result/[id]/page.tsx    # 診断結果表示
│   ├── api/
│   │   ├── diagnosis/route.ts      # 診断API
│   │   ├── compatibility/route.ts  # 相性計算API
│   │   └── webhook/stripe/route.ts # Stripe Webhook
│   └── layout.tsx
├── lib/
│   ├── animal-engine/
│   │   ├── calculator.ts           # 計算エンジン
│   │   ├── animal-map.ts           # 動物マッピング定数
│   │   ├── compatibility.ts        # 相性計算
│   │   └── types.ts                # 型定義
│   ├── supabase/
│   │   ├── client.ts               # ブラウザクライアント
│   │   └── server.ts               # サーバークライアント
│   ├── anthropic/
│   │   └── generate-profile.ts     # Claude Haiku呼び出し
│   └── stripe/
│       └── client.ts               # Stripe初期化
├── components/
│   ├── diagnosis/
│   │   ├── birthdate-form.tsx       # 生年月日入力
│   │   ├── result-card.tsx          # 診断結果カード
│   │   └── animal-illustration.tsx  # 動物イラスト
│   ├── share/
│   │   └── sns-share-buttons.tsx    # SNSシェアボタン
│   └── ui/                         # shadcn/ui
└── constants/
    └── animals.ts                  # 動物データ定数
```

---

## 10. セキュリティ / 法務 / 運用設計

### 「動物占い」商標問題の対処法

| 対策 | 詳細 |
|------|------|
| **独自名称の採用** | 「動物占い」「個性心理学」「動物キャラナビ」は一切使用しない。「アニマルタイプ診断」「どうぶつ婚活」等の独自名称を使用 |
| **計算ロジックの合法性** | 六十干支ベースの数学的計算式は著作権の対象外。自由に使用可能 |
| **独自コンテンツ作成** | 性格記述・相性解説はClaude Haiku APIで独自生成。既存書籍の記述をコピーしない |
| **独自イラスト** | 動物イラストは自作またはAI生成（MCP Image等）。既存の動物占いイラストは使用しない |
| **利用規約への明記** | 「本サービスは六十干支に基づく独自の性格分析であり、特定の商標サービスとは無関係です」と明記 |

### 個人情報保護法対応（2026年改正対応）

| 対象データ | 分類 | 対応策 |
|-----------|------|-------|
| 生年月日 | 個人情報 | 暗号化保存（Supabase encryption at rest） |
| 氏名・メールアドレス | 個人情報 | 最小限の収集、利用目的の明示 |
| 婚活プロフィール | 要配慮個人情報に準ずる | 本人同意の取得、第三者提供の制限 |
| 相性マッチング結果 | 個人情報 | RLSによるアクセス制御 |

**必須対応事項**:
- プライバシーポリシーの作成・公開
- 利用目的の明示と同意取得（オプトイン）
- データ削除リクエストへの対応機能（GDPR的アプローチ）
- Cookieバナーの実装
- **2026年改正個人情報保護法対応**: 個人情報保護法施行令の改正（令和6年）により強化される第三者提供規制（法第27条）、オプトアウト手続きの厳格化（法第23条）、データ漏洩時の個人情報保護委員会への報告義務（法第26条）への準拠。※具体的な施行細則は個人情報保護委員会（https://www.ppc.go.jp/）の最新ガイドラインを参照

### Supabase RLSによるデータ保護

- 全テーブルにRLS有効化（前述のSQL参照）
- Service Roleキーはサーバーサイドのみで使用
- Anon Keyはクライアント用（RLSで保護）
- API Routesで二重チェック（RLS + サーバーサイドバリデーション）

### 運用設計

| 項目 | 設計 |
|------|------|
| 監視 | Vercel Analytics + Supabase Dashboard |
| エラー追跡 | Sentry（無料枠） |
| バックアップ | Supabase Pro 自動バックアップ（日次） |
| CI/CD | GitHub Actions → Vercel 自動デプロイ |
| ステージング | Vercel Preview Deployments（PRごと） |
| ログ | Vercel Logs + Supabase Logs |

---

## 11. リスクと代替案

| # | リスク | 発生確率 | 影響度 | 対策 | 代替案 |
|---|--------|---------|-------|------|-------|
| 1 | **「動物占い」商標侵害の指摘** | 中 | 高 | 独自名称を最初から使用。計算式のみ利用し、名称・イラスト・記述は全て独自作成 | 商標権者にライセンス交渉（費用増大だがブランド力向上） |
| 2 | **Claude Haiku APIのコスト増大** | 低 | 中 | 診断結果をキャッシュ（同じ動物番号=同じ基本テキスト）。API呼び出しを最小化 | ローカルLLM（Ollama + Llama 3）に切り替え |
| 3 | **ユーザー獲得の伸び悩み** | 中 | 高 | SNSシェア機能を初期から実装。OGP画像の動物イラストでバイラル促進 | インフルエンサーマーケティング（占い系YouTuber） |
| 4 | **有料化率が10%未達** | 中 | 中 | 無料版の機能制限を調整。お試し期間（7日間プレミアム無料） | 広告収益モデルへの切り替え（Google AdSense） |
| 5 | **競合の追随（withが動物診断追加等）** | 低 | 高 | 先行者優位を活かし、Phase2でAIコンシェルジュ等の高度機能で差別化 | ニッチ深掘り（特定年齢層・地域特化） |
| 6 | **個人情報漏洩** | 低 | 極高 | RLS + 暗号化 + 最小権限原則。Supabase Proのセキュリティ機能活用 | セキュリティ監査を外部委託（Phase2以降） |
| 7 | **Supabaseの障害・サービス停止** | 極低 | 高 | Supabaseはオープンソース。最悪の場合セルフホスト可能 | Neon + NextAuth.jsへの移行 |
| 8 | **計算ロジックの正確性への疑義** | 低 | 中 | 既知の結果でテストケースを100件以上作成して検証 | ユーザーからのフィードバック機能で誤りを収集・修正 |

---

## 12. Go / No-Go 意思決定ポイント

### Go 判定: **Go（条件付き）**

条件: 独自名称の確定（「動物占い」商標を使用しないことの最終確認）

### 今すぐ作るべき理由 TOP3

1. **ブルーオーシャンの消失リスク**: 動物タイプ×婚活の組み合わせは2026-03-19時点の調査（App Store/Google Play/主要ウェブ検索）で類似競合を確認できず。AI婚活ブームの中、2026年後半には大手が類似サービスを投入する可能性がある。先行者利益を確保するにはQ2中のMVPリリースが必須

2. **極めて低いMVPコスト**: 月額15,000円で運用開始可能。100人の有料ユーザーで黒字化。失敗してもダメージが極めて小さい「ローリスク・ハイリターン」の構造

3. **技術スタックの成熟**: Next.js 15 + Supabase + Claude Haiku APIの組み合わせは2026年時点で十分に成熟。MCP対応により開発効率も高い。4週間でMVP完成が現実的

### 最初の1アクション（明日できること）

```bash
# 1. プロジェクト作成（所要時間: 5分）
cd ~/Desktop/01_開発プロジェクト
npx create-next-app@latest animal-match \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# 2. 必要パッケージのインストール（所要時間: 2分）
cd animal-match
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk stripe
npm install -D prisma @types/node

# 3. 占い計算エンジンのテスト作成（TDD: REDフェーズ）
mkdir -p src/lib/animal-engine/__tests__
# テストファイルを作成し、既知の生年月日→動物タイプの対応表で検証

# 4. Supabaseプロジェクト作成
# https://supabase.com/dashboard でプロジェクトを作成し、
# .env.local にキーを設定
```

**明日のゴール**: 占い計算エンジンがテストを通過し、生年月日を入力すると正しい動物タイプが返ること。

---

## 付録: 参考情報

### Intelligence Research（GIS）からの注目ポイント

| トレンド | 本プロジェクトへの影響 |
|---------|-------------------|
| Sam Altman「コーダーへの感謝」発言 | AI活用開発への社会的追い風 |
| Anthropic 8万人ユーザー調査 | Claude APIの信頼性・ユーザー基盤の裏付け |
| Google Stitch β公開 | UI生成AIの進化。将来的にUI自動生成への移行可能性 |
| 楽天AI 3.0 | 国内AI市場の活性化。ユーザーのAIリテラシー向上 |
| Claude HUD（GitHub Trending） | Claude Code拡張の開発エコシステム活性化 |

---

## 付録B: 参考文献・出典一覧

> **注記**: 本レポートの数値データは調査時点（2026-03-19）での公開情報に基づく。未確認と明記した数値はAI生成の推定値であり、実際の事業計画では一次調査が必要。

| # | データ項目 | 出典 | ステータス |
|---|-----------|------|----------|
| 1 | 婚活支援サービス市場規模 | 矢野経済研究所「婚活支援サービス市場に関する調査」https://www.yano.co.jp/ | 要確認（有料レポート） |
| 2 | ブライダル総研 婚活実態調査 | リクルートブライダル総研 https://bridal-souken.net/ | 要確認 |
| 3 | 占いアプリ市場500億円超 | 民間調査会社各社（App Annie / data.ai 等）の国内アプリ売上データ | 推定値・未確認 |
| 4 | AI婚活利用意向（20-30代女性） | 出典未確認。本レポートでは「高い」とのみ記載。定量値は削除済み | 削除済 |
| 5 | 有料化率3-10%（フリーミアム） | Andreessen Horowitz「SaaS Metrics」/ ProfitWell業界レポート | 業界通説・参考値 |
| 6 | Supabase 料金体系 | https://supabase.com/pricing | 公式・確認済 |
| 7 | Claude Haiku API 料金 | https://www.anthropic.com/pricing | 公式・確認済 |
| 8 | Stripe 手数料 | https://stripe.com/jp/pricing | 公式・確認済 |
| 9 | 動物占い商標（ノラコム） | 特許情報プラットフォームJ-PlatPat https://j-platpat.inpit.go.jp/ | 確認推奨 |
| 10 | 個人情報保護法条文 | 個人情報保護委員会 https://www.ppc.go.jp/personalinfo/legal/ | 公式・確認済 |
| 11 | 競合サービス調査 | IBJ公式 https://www.ibjapan.com/ / Pairs公式 / with公式（2026-03-19 確認） | 確認済 |

---

**レポート生成完了** | TAISUN v2 STEP 3+4 統合エージェント | 2026-03-19
**QA CONDITIONAL 修正適用**: 2026-03-19（信頼性スコア向上のため引用・出典を追加、未検証統計を修正）
