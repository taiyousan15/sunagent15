---
name: meta-ads-competitors
description: Meta広告競合分析スキル - Ad Library分析・競合クリエイティブ調査
---

# Meta Ads Competitors Skill

Meta Ad Libraryを活用した競合広告分析スキル。

## 概要

このスキルは以下の競合分析を実行します：

1. **Ad Library検索** - 競合の広告を検索
2. **クリエイティブ分析** - 画像・コピーのパターン分析
3. **出稿傾向分析** - 時期・頻度・予算推定
4. **インサイト抽出** - 勝ちパターンの発見

## 使用方法

```
/meta-ads-competitors <operation> [options]
```

### 競合検索

```bash
# 企業名で検索
/meta-ads-competitors search "競合会社名"

# ページIDで検索
/meta-ads-competitors search --page-id 123456789

# カテゴリ検索
/meta-ads-competitors search --category "ECサイト" --country JP

# キーワード検索
/meta-ads-competitors search --keyword "ダイエット サプリ"
```

### クリエイティブ分析

```bash
# 特定ページの広告分析
/meta-ads-competitors analyze --page-id 123456789

# 複数競合の比較分析
/meta-ads-competitors compare --pages "id1,id2,id3"

# トップ広告の抽出
/meta-ads-competitors top --category "美容" --limit 20
```

### トレンド分析

```bash
# 業界トレンド
/meta-ads-competitors trends --industry "EC"

# 季節性分析
/meta-ads-competitors seasonal --keyword "バレンタイン"

# 新規参入者検出
/meta-ads-competitors newcomers --category "サプリメント"
```

## Ad Library API / Scraping

### データソース選択

```
1. Meta Ad Library API（公式）
   - 制限: 政治広告中心
   - 無料

2. Apify Actor（推奨）
   - 全広告対象
   - $49~/月

3. Playwright スクレイピング
   - 無料
   - レート制限注意
```

### 取得データ

```json
{
  "ad_id": "123456789",
  "page_name": "競合会社名",
  "page_id": "987654321",
  "ad_creative": {
    "title": "広告ヘッドライン",
    "body": "広告本文テキスト",
    "image_url": "https://...",
    "video_url": null,
    "cta_type": "SHOP_NOW",
    "link_url": "https://..."
  },
  "start_date": "2026-01-01",
  "end_date": null,
  "status": "ACTIVE",
  "platforms": ["facebook", "instagram"],
  "estimated_audience": "100K-500K",
  "spend_estimate": {
    "min": 100000,
    "max": 500000,
    "currency": "JPY"
  }
}
```

## 分析レポート

### 競合サマリー

```markdown
# 競合広告分析レポート

## 対象: 競合会社A

### 基本情報
- アクティブ広告数: 45件
- 推定月間広告費: ¥500万〜¥1,000万
- 主要プラットフォーム: Instagram (70%), Facebook (30%)

### クリエイティブ傾向

#### 画像分析
- 人物写真: 60%
- 商品写真: 30%
- イラスト: 10%
- 主要カラー: 白, ピンク, ゴールド

#### コピー分析
- 平均ヘッドライン長: 18文字
- 頻出キーワード: 「限定」「今だけ」「○○%OFF」
- CTA: SHOP_NOW (80%), LEARN_MORE (20%)

### 勝ちパターン
1. ビフォーアフター形式の画像
2. 数字を含むヘッドライン
3. 緊急性を煽るコピー

### 出稿タイミング
- 月初・月末に集中
- 給料日前後にスパイク
- 季節イベント連動あり
```

### 比較マトリクス

```
| 項目 | 競合A | 競合B | 自社 |
|------|-------|-------|------|
| 広告数 | 45 | 32 | 28 |
| 推定予算 | ¥500万 | ¥300万 | ¥200万 |
| CTR推定 | 高 | 中 | 中 |
| クリエイティブ多様性 | 高 | 低 | 中 |
| 更新頻度 | 週2回 | 月1回 | 週1回 |
```

## 監視設定

```json
{
  "monitoring": {
    "competitors": [
      {"name": "競合A", "page_id": "123456"},
      {"name": "競合B", "page_id": "789012"}
    ],
    "keywords": ["ダイエット", "サプリ"],
    "schedule": "weekly",
    "alerts": {
      "new_ad": true,
      "spend_spike": true,
      "new_competitor": true
    },
    "notification": {
      "slack_webhook": "${SLACK_WEBHOOK_URL}"
    }
  }
}
```

## MCP連携

```
使用MCP:
├── facebook-ads-library - Ad Library検索
├── apify - 詳細スクレイピング（オプション）
└── playwright - 補助スクレイピング
```

## 出力ファイル

```
competitor-analysis/
├── raw-data/
│   ├── competitor-a-ads.json
│   └── competitor-b-ads.json
├── analysis/
│   ├── creative-patterns.md
│   ├── copy-analysis.md
│   └── timing-analysis.md
├── insights/
│   └── recommendations.md
└── report/
    └── competitor-report.pdf
```

## 関連

- `/meta-ads-analyze` - 自社広告分析
- `/mega-research` - 深層市場調査
- `/research-free` - 無料リサーチ
