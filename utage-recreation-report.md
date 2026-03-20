# UTAGE システム完全解析レポート — 再現・機能追加ガイド

> 作成日: 2026-03-14
> 対象: https://utage-system.com/
> テナント: QaqbDU6SqvhN（松本俊彦 オペレーター）
> 目的: UTAGEの完全クローン + 機能追加を行うための設計書

---

## 目次

1. [システム概要](#1-システム概要)
2. [技術スタック](#2-技術スタック)
3. [デザインシステム](#3-デザインシステム)
4. [URL構造・ルーティング](#4-url構造ルーティング)
5. [認証・マルチテナント設計](#5-認証マルチテナント設計)
6. [機能モジュール詳細](#6-機能モジュール詳細)
   - 6.1 ファネル管理
   - 6.2 ページビルダー
   - 6.3 メール・LINE配信（シナリオ/ステップ）
   - 6.4 会員サイト
   - 6.5 イベント・予約
   - 6.6 商品管理・決済
   - 6.7 パートナー（アフィリエイト）
   - 6.8 アクション設定
   - 6.9 外部連携フォーム
   - 6.10 広告連携
   - 6.11 AIアシスト
7. [データモデル（推定）](#7-データモデル推定)
8. [再現用技術推奨スタック](#8-再現用技術推奨スタック)
9. [追加機能アイデア](#9-追加機能アイデア)
10. [実装ロードマップ](#10-実装ロードマップ)

---

## 1. システム概要

UTAGEは日本製のオールインワン・マーケティング自動化SaaSプラットフォーム。

| 項目 | 内容 |
|------|------|
| 提供会社 | Fountain Co., Ltd. |
| 月額料金 | 19,700円 |
| 対象ユーザー | 日本の中小事業者・個人起業家 |
| 主要機能 | ファネル・LP制作、メール/LINE自動配信、会員サイト、イベント予約、決済 |
| サーバー | AWS (IP: 35.73.68.197, Cookie: AWSALB) |
| テナント方式 | サブドメインなし、パスベース `/operator/{tenantId}/` |

### 競合ポジション
- ClickFunnels（海外）の日本語版 + LINE対応
- ClickFunnels + Kajabi + Calendly + Stripe の機能を統合
- 日本固有機能: LINE連携、UnivaPay/テレコムクレジット決済、カナ氏名対応

---

## 2. 技術スタック

### バックエンド（確認済み）

| 項目 | 内容 | 証拠 |
|------|------|------|
| フレームワーク | Laravel (PHP) | Cookie: `utage_session`, CSRF `_token` |
| 認証 | Laravel標準セッション認証 | `XSRF-TOKEN` cookie |
| セッション管理 | Cookieベース (`utage_session`) | ブラウザCookie確認 |
| CSRF保護 | Laravel CSRF Token (`_token` hidden field) | フォーム確認 |
| ストレージ | AWS S3推定（画像/動画） | AWS環境 |
| ホスティング | AWS EC2 (ALB) | `AWSALB` cookie |

### フロントエンド（確認済み）

| 項目 | 内容 | 証拠 |
|------|------|------|
| UIフレームワーク | Bootstrap 4 | セレクタ・クラス名確認 |
| 管理テンプレート | CoreUI (Bootstrap admin template) | サイドバー構造・アイコン |
| フォント | Noto Sans JP | フォントファミリー |
| ページビルダー | カスタム実装（ドラッグ&ドロップ） | エディター確認 |
| リッチテキスト | カスタムエディター（CKEditor/Quill系） | ツールバー25+ボタン確認 |
| アイコン | Font Awesome / CoreUI Icons | アイコン形状 |

### 決済（確認済み）

| 決済代行 | 状態 |
|---------|------|
| Stripe | 設定済み |
| UnivaPay（新） | 設定済み |
| UnivaPay（旧） | 設定あり |
| AQUAGATES | 設定あり |
| テレコムクレジット | 設定あり |
| FirstPayment | 設定あり |
| 銀行振込 | 対応（disabled=条件付き有効） |

---

## 3. デザインシステム

### カラーパレット

```css
/* サイドバー */
--sidebar-bg: #2c3e50;          /* メインサイドバー背景 */
--sidebar-hover: #34495e;       /* ホバー状態 */
--sidebar-active: #1a252f;      /* アクティブ状態 */
--sidebar-text: #ffffff;        /* サイドバーテキスト */
--sidebar-section-text: #8899aa; /* セクションラベル */

/* ナビゲーション */
--topnav-bg: #ffffff;           /* トップナビ背景 */
--topnav-border: #e4e5e6;       /* ボーダー */
--primary-blue: #20a8d8;        /* UTAGE プライマリブルー（CoreUI） */
--nav-link-active: #20a8d8;     /* アクティブリンクのアンダーライン */

/* ボタン */
--btn-primary: #20a8d8;         /* プライマリボタン（水色） */
--btn-success: #4dbd74;         /* 成功/追加ボタン（緑） */
--btn-info: #63c2de;            /* 情報ボタン（薄水色） */
--btn-warning: #ffc107;         /* 警告ボタン（黄） */
--btn-danger: #f86c6b;          /* 削除ボタン（赤） */

/* コンテンツエリア */
--content-bg: #f0f3f5;          /* メインコンテンツ背景（薄グレー） */
--card-bg: #ffffff;             /* カード背景 */
--card-border: #e4e5e6;         /* カードボーダー */

/* テキスト */
--text-primary: #23282c;        /* メインテキスト */
--text-muted: #73818f;          /* ミュートテキスト */
--text-link: #20a8d8;           /* リンクテキスト */

/* テーブル */
--table-header-bg: #f0f3f5;     /* テーブルヘッダー背景 */
--table-row-hover: #f5f5f5;     /* 行ホバー */
--table-border: #e4e5e6;        /* テーブルボーダー */
```

### タイポグラフィ

```css
/* フォントスタック */
font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* サイズスケール */
--text-xs: 11px;
--text-sm: 12px;
--text-base: 14px;    /* 本文デフォルト */
--text-md: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;

/* ウェイト */
--weight-normal: 400;
--weight-medium: 500;
--weight-bold: 700;
```

### レイアウト構造

```
┌─────────────────────────────────────────────────────┐
│  TOPNAV (height: 55px, bg: white, border-bottom)    │
│  [≡ hamburger]  [ファネル|メール..|会員..]  [? 名前▼] │
├──────────────┬──────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT AREA                   │
│  (width:240px│  (padding: 20px)                     │
│  bg:#2c3e50) │                                      │
│              │  ┌─────────────────────────────────┐ │
│  [LOGO]      │  │ CONTENT CARD (bg:white, shadow) │ │
│              │  │                                  │ │
│  ─ ファネル  │  │                                  │ │
│  ─ アクション │  │                                  │ │
│  ─ 外部連携  │  │                                  │ │
│  ─ 広告連携  │  └─────────────────────────────────┘ │
│              │                                      │
│  決済関連設定 │                                      │
│  ─ 商品管理  │                                      │
│  ─ 売上 ▶   │                                      │
│  ─ 決済連携  │                                      │
│  ─ 事業者設定│                                      │
│              │                                      │
│  サポート    │                                      │
│  ─ マニュアル│  FOOTER: © 2026 Fountain Co., Ltd.  │
├──────────────┴──────────────────────────────────────┤
```

### コンポーネントパターン

```html
<!-- テーブルページ標準パターン -->
<div class="card">
  <div class="card-header">
    <button class="btn btn-success btn-sm">+ 追加</button>
    <button class="btn btn-info btn-sm">グループ管理</button>
    <button class="btn btn-secondary btn-sm">表示順変更</button>
  </div>
  <div class="card-body p-0">
    <table class="table table-hover">
      <thead class="bg-light">
        <tr><th>名称</th>...<th></th></tr>
      </thead>
      <tbody>
        <tr>
          <td class="cursor-pointer">...</td>
          <td>
            <div class="dropdown">
              <button class="btn-operation-menu">⋮</button>
              <!-- 編集/複製/削除 -->
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- タブパネル標準パターン -->
<ul class="nav nav-tabs">
  <li class="nav-item"><a class="nav-link active">商品管理</a></li>
  <li class="nav-item"><a class="nav-link">アーカイブ済</a></li>
</ul>
```

---

## 4. URL構造・ルーティング

### 認証

```
GET  /operator/{tenantId}/login     — テナント別ログインページ
POST /operator/{tenantId}/login     — ログイン処理
POST /logout                        — ログアウト
```

### ファネル

```
GET  /funnel                        — ファネル一覧
GET  /funnel/create                 — ファネル作成
GET  /funnel/{funnelId}             — ファネル詳細（ページ一覧タブ付き）
GET  /funnel/{funnelId}/page/{pageId}/edit  — ページビルダー
```

### メール・LINE配信

```
GET  /account                       — アカウント一覧
GET  /account/{accountId}/scenario  — シナリオ一覧
GET  /account/{accountId}/scenario/{scenarioId}/step  — ステップ一覧
GET  /account/{accountId}/scenario/{scenarioId}/step/mail/create  — メールステップ作成
GET  /account/{accountId}/scenario/{scenarioId}/step/line/create  — LINEステップ作成
```

### 会員サイト

```
GET  /site                          — サイト一覧
GET  /site/{siteId}/course          — コース一覧
GET  /site/{siteId}/course/{courseId}/lesson  — レッスン一覧
GET  /site/{siteId}/course/{courseId}/lesson/{lessonId}/edit  — レッスンエディタ
```

### イベント

```
GET  /event                         — イベント一覧
GET  /event/{eventId}/schedule      — 日程管理
GET  /event/{eventId}/applicant     — 申込者一覧
GET  /event/{eventId}/reminder      — リマインダ配信設定
GET  /event/{eventId}/register      — 申込フォーム設定
GET  /event/{eventId}/config        — イベント設定
```

### 商品・売上

```
GET  /product                       — 商品一覧
GET  /product/create                — 商品作成（基本設定のみ）
GET  /product/{productId}/detail    — 価格ラインナップ一覧
GET  /product/{productId}/detail/{detailId}/edit  — 価格エディタ（フル設定）
GET  /product/{productId}/edit      — 商品基本設定編集
GET  /purchase                      — 売上一覧
GET  /installments                  — 分割払い一覧
GET  /subscription                  — 継続課金一覧
GET  /purchase/month                — 月別売上集計
GET  /purchase/day                  — 日別売上集計
```

### 設定

```
GET  /action                        — アクション設定
GET  /form                          — 外部連携フォーム設定
GET  /ads                           — 広告連携設定
GET  /payment/setting/switch        — 決済連携設定
GET  /payment/business              — 事業者設定
GET  /agent/project                 — パートナー設定
```

---

## 5. 認証・マルチテナント設計

### テナント分離モデル

```
operators テーブル
  - id: string (例: QaqbDU6SqvhN) ← URLに露出するスラッグ
  - name: string
  - email: string
  - password: string (bcrypt)
  - plan_id: FK
  - created_at, updated_at

全データテーブル: operator_id FK で分離
```

### セッション設計

```php
// Laravel セッション設定
SESSION_DRIVER=database (またはredis)
SESSION_COOKIE=utage_session
SESSION_LIFETIME=120 (分)

// ミドルウェア
Route::middleware(['auth:operator', 'tenant'])->group(function() {
    // 全認証ルート
});
```

### ログインフロー

```
1. GET /operator/{tenantId}/login
   → tenantId でオペレーター特定
   → ログインフォーム表示（email, password, _token）

2. POST /operator/{tenantId}/login
   → バリデーション
   → Auth::guard('operator')->attempt(['email'=>$email, 'password'=>$pw, 'tenant_id'=>$tenantId])
   → 成功: redirect → /funnel
   → 失敗: redirect back with errors
```

---

## 6. 機能モジュール詳細

### 6.1 ファネル管理

**概要**: セールスファネルの全体構造管理。複数ページをタブで管理。

**データ構造（推定）**:
```
funnels
  - id, operator_id, name, group_id, sort_order
  - created_at, updated_at

funnel_pages
  - id, funnel_id, name, page_type, url_slug
  - sort_order, status (active/archived)
  - page_content (JSON or longtext)
  - template_id
  - conversion_actions (JSON): [シナリオ登録, コース開放, アクション実行]
```

**ページタイプ（確認済み）**:
- LP（ランディングページ）
- 申込フォームページ
- サンキューページ
- アップセルページ
- ダウンセルページ
- 会員サイトへのリダイレクトページ

**ファネル詳細の特徴**:
- 1ファネルに35以上のページを格納可能
- タブ形式でページを切り替え
- ページごとに個別URLスラッグ設定

### 6.2 ページビルダー

**概要**: ドラッグ&ドロップ式のビジュアルページエディター。

**エディター構成**:
```
┌──────────────────────────────────────────────────────┐
│  [← 戻る]  [ページ設定]  [プレビュー]  [保存] [公開] │
├──────────┬───────────────────────────────────────────┤
│ 要素パネル│           キャンバス（中央）              │
│          │  ┌──────────────────────────────────────┐ │
│ ─ テキスト│  │  [ドロップゾーン]                    │ │
│ ─ 画像   │  │  各セクション:                        │ │
│ ─ ボタン  │  │  ・ヒーローセクション                 │ │
│ ─ フォーム│  │  ・テキストブロック                   │ │
│ ─ 動画   │  │  ・CTAボタン                         │ │
│ ─ セクション│ │  ・フォーム埋め込み                  │ │
│ ─ カラム  │  └──────────────────────────────────────┘ │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

**ページ設定項目**:
- ページ名
- URLスラッグ
- SEOタイトル / ディスクリプション
- OGP設定
- Google Analytics / Facebook Pixel 埋め込み
- フォーム連携設定

### 6.3 メール・LINE配信

#### アカウント（配信元）管理

```
accounts
  - id, operator_id, name, type (mail/line)
  - mail_from, mail_name (メールの場合)
  - line_channel_access_token (LINEの場合)
  - line_channel_secret
```

**アカウント一覧（確認済み）** — 6件:
1. すしたびLINE公式アカウント（LINE）
2. すしたびメルマガ（mail）
3. すしたびLINE 01（LINE）
4. すしたびLINE 02（LINE）
5. すしたびメール01（mail）
6. すしたびメール02（mail）

#### シナリオ管理

```
scenarios
  - id, account_id, name, description
  - trigger_type: 登録時即時/特定日時/購入時 etc.

scenario_steps (=ステップ配信)
  - id, scenario_id, type (mail/line)
  - send_timing_type: immediate/days_after/date
  - send_timing_value: int (日数)
  - send_hour, send_minute
  - conditions: JSON (全員/条件指定)
  - content: JSON
```

**確認済みシナリオ（2件）**:
1. すしたび公式【飲食店・事業者様】専用
2. ウェビナーリマインドシナリオ

#### ステップ配信（メール）フォーム項目

| フィールド | 型 | 内容 |
|-----------|-----|------|
| 管理名称 | text | 内部管理名 |
| 配信条件 | select | 全員 / 条件指定 |
| カスタム送信者 | select | 送信元アカウント選択 |
| メールタイトル | text | 件名 |
| テキスト | textarea | プレーンテキスト版 |
| HTML | rich-editor | HTML版メール本文 |
| テンプレート変数 | — | %name%, %mail%, %sei%, %mei%, %kana%, %phone%, %event_date%, %base_date%, %now%, %cancel%, %cancelall%, %change_mail%, %account_name%, %scenario_name% |
| 送信タイミング | select + number | 即時 / N日後 / 特定日時 |

#### ステップ配信（LINE）フォーム項目

| フィールド | 型 | 内容 |
|-----------|-----|------|
| 管理名称 | text | 内部管理名 |
| 配信条件 | select | 全員 / 条件指定 |
| カスタム送信者 | select | LINEアカウント選択 |
| メッセージタイプ | tabs | テキスト/画像/ボタン/カルーセル/音声/動画/スタンプ |
| 送信タイミング | select + number | 即時 / N日後 / 特定日時 |

**LINEメッセージタイプ詳細**:
- **テキスト**: 自由テキスト（絵文字対応）
- **画像**: 画像アップロード + タップ時アクション
- **ボタン**: サムネイル + タイトル + 説明 + ボタン最大4個
- **カルーセル**: 横スクロールカード複数枚
- **音声**: 音声ファイルアップロード
- **動画**: 動画ファイルアップロード
- **スタンプ**: LINEスタンプ選択

### 6.4 会員サイト

**階層構造**:
```
sites (会員サイト)
  └── courses (コース) ← グループでカテゴリ分け
        └── lessons (レッスン) ← グループでチャプター分け
```

**サイト確認済みデータ（すしたびサイト）**:
```
会員サイト: すしたび - SushiTabi
  ├── グループ: TRIAL
  │   └── コース × 3件
  ├── グループ: BASIC
  │   └── コース × 11件
  ├── グループ: SEAFOODS
  │   └── コース × 22件
  ├── グループ: OTHERS
  │   └── コース × 7件
  └── グループ: DOCUMENTS
      └── コース × 3件
  計: 46コース
```

**レッスンエディタ項目**:

| フィールド | 型 | 内容 |
|-----------|-----|------|
| グループ | select | レッスングループ（チャプター） |
| レッスン名 | text | レッスンタイトル |
| 種類 | radio | リッチテキスト / コンテンツエディター |
| コンテンツ | rich-editor | 本文（動画埋め込み対応） |
| ステータス | select | 公開 / 非公開 |
| コメント設定 | select | コメントの許可/禁止 |
| 自動化設定 | select | 受講完了時のアクション |
| 開放日 | select + date | 即時 / N日後 / Nヶ月後 / 指定日時 |

**リッチテキストエディタツールバー（25+ボタン）**:
- フォントサイズ選択
- B（太字）, I（斜体）, U（下線）
- リンク挿入
- 背景色, 文字色
- 文字揃え（左/中/右/両端）
- リスト（番号付き/記号）
- インデント増/減
- 画像挿入（ファイル/URL）
- 引用
- 表（テーブル）
- メディア埋め込み（YouTube等）
- Undo / Redo
- コードブロック × 2種
- Code（インライン）
- 区切り線
- フォントファミリー
- フォーマット削除
- HTML直接挿入
- 見出し（H1-H6）

### 6.5 イベント・予約

**機能概要**: セミナー・説明会・個別面談等のイベント管理とCRM。

**確認済みイベント（4件）**:
1. すしたび説明会（申込者: 331名）
2. 高級寿司オンラインスクール「すしたび」無料説明会（Zoom）
3. 高級寿司オンラインスクール「すしたび」無料説明会（福岡会場）
4. すしたび個別面談
+ アーカイブ済タブあり

**イベントサイドバー（タブ構造）**:
```
イベント詳細
  ├── 日程（schedule）         — 開催日時・会場・定員管理
  ├── 申込者（applicant）       — CRM（331名確認）
  ├── リマインダ配信             — 申込後の自動メール/LINE設定
  ├── 申込フォーム・申込者項目   — フォームフィールド設定
  ├── 申込フォーム設定           — フォームデザイン設定
  └── イベント設定              — 基本設定（会場/定員等）
```

**申込者一覧カラム**:
- 申込日時
- 日程（参加予定の日程）
- 会場
- お名前
- メールアドレス
- 参加状況（参加予定/参加済/キャンセル等）
- 成約状況（未成約/成約済等）

**日程管理カラム**:
- 日程（開催日時）
- 会場
- 定員
- 申込数
- キャンセル数
- 残数（= 定員 - 申込数 + キャンセル）

**フィルター機能**:
- 申込者: 申込日範囲/日程/参加状況/成約状況
- 日程: 日程範囲フィルター

### 6.6 商品管理・決済

**2層構造**:
```
products（商品）
  └── product_details（価格ラインナップ）
        ← 1商品に複数の価格バリエーション
```

**確認済み商品（4件）**:
1. 初回限定価格 15万円 → ¥150,000（一回払い・UnivaPay）
2. 説明会参加者限定価格 19.8万円 → ¥198,000
3. すしたび開校記念 期間限定価格 22.8万円 → ¥228,000
4. すしたび開校記念 期間限定価格 24.8万円 → ¥248,000

**商品基本設定フォーム**:

| フィールド | 型 | 内容 |
|-----------|-----|------|
| 商品名 | text | 管理名称 |
| 重複購入 | select | 許可する / 禁止する |
| 販売上限 | select | 指定しない / 指定する |
| 発行事業者（領収書） | select | デフォルト / 事業者名 |

**価格ラインナップ（product_detail）設定フォーム**:

| フィールド | 型 | 内容 |
|-----------|-----|------|
| 名称 | text | 価格バリエーション名 |
| 支払方法 | select | クレジットカード払い / 銀行振込 |
| 決済代行会社 | select | Stripe / UnivaPay / AQUAGATES / テレコムクレジット / FirstPayment |
| 支払回数 | select | 一回払い / 複数回払い・分割払い / 継続課金 |
| 分割払いオプション | select | 表示する / 表示しない（UnivaPay専用） |
| 金額 | number | 円 |
| 販売上限 | select | 指定しない / 指定する |
| オーダーバンプ商品 | radio | 通常商品 / オーダーバンプ商品 |
| 連携フォームへの表示 | select | 表示する / 表示しない |
| 連携フォームでの表記指定 | checkbox | ON時: 商品名表記・価格表記をカスタム可 |
| 商品名表記 | text | 購入フォーム上での表示名 |
| 価格表記 | text | 購入フォーム上での価格表示 |
| 販売期間指定 | checkbox | ON時: 開始・終了日時を設定 |
| 領収書の品名 | text | 領収書に記載する品名 |
| 領収書の但し書き | text | 但し書きカスタム |

**購入後の動作設定**:

| フィールド | 型 | 内容 |
|-----------|-----|------|
| 登録するシナリオ | select | シナリオリストから選択 |
| 開放するバンドルコース | select | 会員サイトのコースを開放 |
| 実行するアクション | select + 追加ボタン | アクション設定から選択 |

**通知設定**:

| フィールド | 型 | 内容 |
|-----------|-----|------|
| 通知先メールアドレス | text | カンマ区切りで複数設定可 |
| 通知内容 | select | デフォルト / カスタム |
| チャット通知先 | select | 通知しない / Chatwork / Slack / Discord |
| チャット通知内容 | select | デフォルト / カスタム |

**売上管理サブページ**:

| ページ | URL | 内容 |
|--------|-----|------|
| 売上一覧 | /purchase | 全売上トランザクション一覧 |
| 複数回・分割払い一覧 | /installments | 分割払いの各回支払い状況 |
| 継続課金一覧 | /subscription | サブスクの継続状況 |
| 月別売上集計 | /purchase/month | 年度別・月別集計（年選択付き） |
| 日別売上集計 | /purchase/day | 日別集計 |

### 6.7 パートナー（アフィリエイト）

**機能**: アフィリエイトパートナー管理システム。

**URL**: `/agent/project`

**推定機能**:
- パートナーアカウント管理
- 紹介リンク発行
- 紹介報酬設定（%または固定金額）
- 成果報告・売上集計
- 報酬支払い管理

### 6.8 アクション設定

**機能**: 条件トリガーによる自動アクション定義。

**アクションタイプ（推定）**:
- タグ付け / タグ削除
- シナリオ登録 / 解除
- リスト移動
- Webhook送信
- 外部API連携

### 6.9 外部連携フォーム

**機能**: 外部サービス（WordPress等）への埋め込みフォーム。

**特徴**:
- UTAGE外のサイトに埋め込み可能
- フォーム送信後にシナリオ登録・商品購入処理

### 6.10 広告連携

**対応広告プラットフォーム（推定）**:
- Facebook / Instagram 広告（Meta Pixel）
- Google 広告（Google Ads コンバージョントラッキング）
- Yahoo! 広告

**設定内容**:
- ピクセルID / コンバージョンIDの設定
- イベントトリガー設定（購入完了/申込完了等）

### 6.11 AIアシスト

**URL**: `#`（ナビゲーションに存在、詳細未確認）

**推定機能**:
- AIによるLP文章生成
- メール文章の自動作成
- A/Bテスト提案

---

## 7. データモデル（推定）

### 主要テーブル一覧

```sql
-- マルチテナント
operators           -- テナント（事業者）
operator_plans      -- プラン管理

-- ユーザー/連絡先
contacts            -- 見込み客・顧客
  - operator_id FK
  - email, name, sei, mei, kana, phone
  - tags JSON
  - created_at

contact_tags        -- タグ管理
tag_contacts        -- 中間テーブル

-- ファネル
funnels
funnel_groups       -- ファネルのグループ分け
funnel_pages        -- ページ（1ファネル = N ページ）
funnel_page_elements -- ページビルダーの要素

-- 配信
accounts            -- メール/LINE アカウント
scenarios           -- シナリオ
scenario_steps      -- ステップ（メール or LINE）
contact_scenarios   -- コンタクトのシナリオ登録状態

-- 会員サイト
sites
site_courses
course_groups
site_lessons
lesson_groups
site_memberships    -- コンタクトのアクセス権

-- イベント
events
event_schedules     -- 日程
event_applicants    -- 申込者（contact FK）
event_reminders     -- リマインダ配信設定

-- 商品・決済
products
product_details     -- 価格ラインナップ
purchases           -- 売上トランザクション
installment_plans   -- 分割払いプラン
subscriptions       -- 継続課金

-- アフィリエイト
agent_projects
agents              -- パートナーアカウント
agent_conversions   -- 紹介成果

-- 設定
actions             -- アクション設定
forms               -- 外部連携フォーム
ads_settings        -- 広告連携設定
payment_settings    -- 決済代行設定（per operator）
payment_businesses  -- 事業者設定
```

---

## 8. 再現用技術推奨スタック

### バックエンド

```
Laravel 11 (PHP 8.3)
  - Laravel Sanctum (認証)
  - Laravel Cashier (Stripe連携)
  - Laravel Scout (検索)
  - Laravel Horizon (キュー管理)
  - Spatie/laravel-permission (権限管理)

MySQL 8.0
Redis (キャッシュ・セッション・キュー)
AWS S3 (ファイルストレージ)
```

### フロントエンド（管理画面）

```
Vue 3 + Inertia.js (Laravel + Vue の SPA的UX)
または
Alpine.js + Livewire (Laravelネイティブ)

UIフレームワーク:
  - Tailwind CSS (またはBootstrap 5)
  - Shadcn/ui (コンポーネントライブラリ)

ページビルダー:
  - GrapeJS (オープンソースのドラッグ&ドロップビルダー)
  - または CraftJS

リッチテキスト:
  - TipTap (Vue/React対応の高機能エディタ)
  - または CKEditor 5
```

### フロントエンド（会員サイト・LP公開面）

```
Next.js 15 (SSR/SSG)
または
Laravel Blade + Alpine.js (シンプル実装)

LINE LIFF SDK (LINE内ブラウザ対応)
```

### インフラ

```
AWS:
  - EC2 または ECS (アプリ)
  - RDS MySQL (DB)
  - ElastiCache Redis (キャッシュ)
  - S3 (ファイル)
  - CloudFront (CDN)
  - ALB (ロードバランサー)
  - SES (メール送信)

または

Docker + Railway / Render (低コスト代替)
```

### 決済

```
Stripe (公式SDK)
UnivaPay (日本向けクレジット・コンビニ・銀行振込)
```

### LINE連携

```
LINE Messaging API (公式SDK)
line-bot-sdk-php または line/line-bot-sdk-nodejs
Webhook エンドポイント: POST /webhook/line/{accountId}
```

---

## 9. 追加機能アイデア

### 既存機能の強化

| 機能 | 現状 | 改善案 |
|------|------|--------|
| ページビルダー | 基本的なドラッグ&ドロップ | A/Bテスト機能 + CVR自動最適化 |
| LINE配信 | 7メッセージタイプ | リッチメニュー設定 / LINE Pay連携 |
| 会員サイト | 動画・テキスト | クイズ機能 / 受講進捗グラフ / 修了証発行 |
| イベント | 基本予約管理 | Zoom自動作成 / リアルタイムキャンセル待ち |
| 売上管理 | 集計のみ | 予測売上 / コホート分析 / LTV計算 |

### 新機能提案

| カテゴリ | 機能名 | 説明 |
|---------|--------|------|
| AI強化 | AI LP生成 | プロダクト情報入力 → LP自動生成 |
| AI強化 | メール件名 AI最適化 | A/Bテストデータ学習 → 開封率最大化件名提案 |
| AI強化 | チャットボット | LINEボット + GPT連携で自動応答 |
| 分析 | コンバージョン分析 | ファネル各ステップの離脱率ヒートマップ |
| 分析 | 顧客スコアリング | 行動データ → ホット/コールドリード自動分類 |
| 連携 | Zapier/Make連携 | Webhook受信 → 外部サービス連携自動化 |
| 連携 | Notion連携 | 顧客データ → Notionデータベース同期 |
| 連携 | Shopify連携 | EC購入データ → UTAGE連絡先同期 |
| モバイル | 管理アプリ | iOS/Android ネイティブ管理アプリ |
| 決済 | 定期課金強化 | 無料トライアル期間 / 途中プラン変更 |
| 収益化 | マーケットプレイス | テンプレートの売買機能 |

---

## 10. 実装ロードマップ

### Phase 1: 基盤（3ヶ月）

```
Week 1-2:  プロジェクトセットアップ
  - Laravel + MySQL + Redis 環境構築
  - マルチテナント認証実装
  - 基本UI (CoreUI or Tailwind admin template)

Week 3-4:  ファネル基盤
  - ファネル CRUD
  - ページ CRUD
  - GrapeJS 統合

Week 5-6:  連絡先管理
  - contacts CRUD
  - タグ管理
  - セグメント機能

Week 7-8:  メール配信
  - Amazon SES統合
  - シナリオ/ステップ基盤
  - スケジュールキュー実装

Week 9-10: LINE配信
  - LINE Messaging API統合
  - Webhook実装
  - メッセージタイプ実装

Week 11-12: 商品・決済
  - Stripe統合
  - 商品/価格管理
  - 購入フロー実装
```

### Phase 2: コア機能（2ヶ月）

```
Week 13-14: 会員サイト
  - サイト/コース/レッスン CRUD
  - アクセス制御（購入連動）
  - TipTapエディタ統合

Week 15-16: イベント管理
  - イベント/日程/申込者 CRUD
  - リマインダ配信連携
  - Zoom API統合

Week 17-18: 高度な配信
  - 条件配信（セグメント）
  - アクション設定
  - 自動化ワークフロー

Week 19-20: 分析・集計
  - 売上レポート
  - ファネル分析
  - メール開封率追跡
```

### Phase 3: 差別化（1ヶ月）

```
Week 21-22: AI機能
  - AI LP生成（Claude/OpenAI API）
  - メール件名最適化
  - チャットボット

Week 23-24: 追加連携
  - Stripe Billing（継続課金強化）
  - Zapier Webhook
  - モバイル最適化
```

---

## 付録: 確認済み画面一覧

| スクリーンショット | URL | 内容 |
|----------------|-----|------|
| utage-top-screenshot.png | / | 公開トップページ |
| utage-dashboard-funnel.png | /funnel | ファネル一覧 |
| utage-funnel-detail.png | /funnel/{id} | ファネル詳細（35+ページタブ） |
| utage-page-editor.png | /funnel/{id}/page/{id}/edit | ページビルダー |
| utage-account-list.png | /account | メール・LINE配信アカウント一覧 |
| utage-scenario-list.png | /account/{id}/scenario | シナリオ一覧 |
| utage-scenario-detail.png | /account/{id}/scenario/{id}/step | ステップ一覧 |
| utage-step-list.png | — | ステップ配信一覧（30+件） |
| utage-email-step-editor.png | .../step/mail/create | メールステップ編集 |
| utage-line-step-editor.png | .../step/line/create | LINEステップ編集 |
| utage-site-list.png | /site | 会員サイト一覧 |
| utage-site-course-list.png | /site/{id}/course | コース一覧（46コース） |
| utage-site-lesson-list.png | /site/{id}/course/{id}/lesson | レッスン一覧 |
| utage-site-lesson-editor.png | .../lesson/{id}/edit | レッスンエディタ |
| utage-event-list.png | /event | イベント一覧（4件） |
| utage-event-applicants.png | /event/{id}/applicant | 申込者一覧（331名） |
| utage-event-schedule.png | /event/{id}/schedule | 日程管理 |
| utage-partner.png | /agent/project | パートナー管理 |
| utage-product-list.png | /product | 商品一覧（4件） |
| utage-product-create.png | /product/create | 商品作成フォーム |
| utage-product-detail.png | /product/{id}/detail | 価格ラインナップ |
| utage-product-price-editor.png | .../detail/{id}/edit | 価格エディタ（フル） |
| utage-sales-monthly.png | /purchase/month | 月別売上集計 |
| utage-purchase.png | /purchase | 売上一覧 |
| utage-payment-setting.png | /payment/setting/switch | 決済連携設定 |
| utage-payment-business.png | /payment/business | 事業者設定 |
| utage-action.png | /action | アクション管理 |
| utage-form.png | /form | 外部連携フォーム |
| utage-ads.png | /ads | 広告連携設定 |

---

*Report generated: 2026-03-14*
*Captured by: Claude Code + Playwright MCP authenticated session*
*Tenant: UTAGE / すしたび (QaqbDU6SqvhN)*
