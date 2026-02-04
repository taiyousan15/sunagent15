---
name: meta-ads-bulk
description: Meta広告バルク入稿スキル - 大量広告の一括作成・更新・管理
---

# Meta Ads Bulk Skill

Meta広告の大量入稿・一括操作を行うスキル。

## 概要

このスキルは以下のバルク操作を実行します：

1. **バルク広告作成** - CSVから一括作成
2. **バルク更新** - 複数広告の一括編集
3. **テンプレート展開** - 1つのテンプレートから複数バリエーション
4. **バルクステータス変更** - 一括ON/OFF

## 使用方法

```
/meta-ads-bulk <operation> [options]
```

### バルクアップロード

```bash
# CSVから広告作成
/meta-ads-bulk upload --file ads.csv

# ドライラン（検証のみ）
/meta-ads-bulk upload --file ads.csv --dry-run

# キャンペーン指定
/meta-ads-bulk upload --file ads.csv --campaign-id 123456
```

### テンプレート展開

```bash
# テンプレートから10バリエーション生成
/meta-ads-bulk generate --template template.json --variations 10

# ヘッドラインのみ変更
/meta-ads-bulk generate --template template.json --vary headline --count 5

# 画像のみ変更
/meta-ads-bulk generate --template template.json --vary image --count 5
```

### バルク更新

```bash
# ステータス一括変更
/meta-ads-bulk update --status PAUSED --campaign-id 123456

# 予算一括変更
/meta-ads-bulk update --budget 5000 --adset-ids "id1,id2,id3"

# CSVから一括更新
/meta-ads-bulk update --file updates.csv
```

## CSVフォーマット

### 広告作成用CSV

```csv
campaign_name,adset_name,ad_name,headline,primary_text,description,image_url,link_url,cta
Campaign A,AdSet 1,Ad 1,最大50%OFF,今だけの特別価格,詳細はこちら,https://...,https://...,SHOP_NOW
Campaign A,AdSet 1,Ad 2,限定セール,見逃せないチャンス,今すぐチェック,https://...,https://...,LEARN_MORE
```

### 更新用CSV

```csv
ad_id,field,new_value
23456789,status,PAUSED
23456790,headline,新しいヘッドライン
23456791,daily_budget,10000
```

## テンプレートJSON

```json
{
  "campaign": {
    "name": "{{product_name}} - {{date}}",
    "objective": "CONVERSIONS",
    "daily_budget": 10000
  },
  "adset": {
    "name": "{{target_audience}}",
    "targeting": {
      "age_min": 25,
      "age_max": 45,
      "genders": [1, 2],
      "geo_locations": {
        "countries": ["JP"]
      },
      "interests": ["{{interest}}"]
    },
    "optimization_goal": "OFFSITE_CONVERSIONS",
    "billing_event": "IMPRESSIONS"
  },
  "ad": {
    "name": "{{creative_name}}",
    "creative": {
      "title": "{{headline}}",
      "body": "{{primary_text}}",
      "image_url": "{{image_url}}",
      "link_url": "{{link_url}}",
      "call_to_action": {
        "type": "{{cta_type}}"
      }
    }
  },
  "variables": {
    "product_name": "商品A",
    "headlines": [
      "最大50%OFF！今だけ",
      "限定セール開催中",
      "見逃せないチャンス"
    ],
    "primary_texts": [
      "人気商品が特別価格で登場",
      "今だけの限定オファー"
    ],
    "images": [
      "image1.png",
      "image2.png",
      "image3.png"
    ]
  }
}
```

## バリデーション

アップロード前に自動チェック：

- [ ] 必須フィールドの存在
- [ ] 文字数制限（ヘッドライン40文字、本文125文字等）
- [ ] URL形式の検証
- [ ] 画像URLのアクセス確認
- [ ] CTAタイプの有効性
- [ ] ターゲティング設定の整合性

## エラーハンドリング

```
バルクアップロード結果:
├── 成功: 45件
├── 失敗: 5件
│   ├── Row 12: ヘッドライン文字数超過（42文字 > 40文字）
│   ├── Row 23: 画像URLアクセス不可
│   ├── Row 34: 無効なCTAタイプ "BUY"
│   ├── Row 45: 必須フィールド missing: link_url
│   └── Row 56: 予算が最低額未満（100 < 200）
└── スキップ: 0件
```

## 出力

```
bulk-upload-result/
├── success.csv          # 成功した広告のID一覧
├── failed.csv           # 失敗した行とエラー理由
├── summary.json         # 実行サマリー
└── meta-upload-log.txt  # 詳細ログ
```

## レート制限対応

- 自動バッチ処理（50件/バッチ）
- バッチ間インターバル（2秒）
- エラー時リトライ（最大3回）
- 429エラー時の自動待機

## 関連

- `/meta-ads` - メインコマンド
- `/meta-ads-creative` - クリエイティブ生成
- `automation-architect` エージェント
