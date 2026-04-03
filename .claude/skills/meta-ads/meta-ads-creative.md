---
name: meta-ads-creative
description: Meta広告クリエイティブ生成スキル - 画像・コピー・バリエーション自動生成
---

# Meta Ads Creative Skill

Meta広告用のクリエイティブ（画像・コピー）を自動生成するスキル。

## 概要

このスキルは以下を生成します：

1. **広告画像** - NanoBanana/Geminiによる無料生成
2. **広告コピー** - 太陽スタイルによる高CVRコピー
3. **バリエーション** - A/Bテスト用の複数パターン
4. **サイズ別出力** - Feed/Story/Reels対応

## 使用方法

```
/meta-ads-creative <type> [options]
```

### 画像生成

```bash
# 基本生成
/meta-ads-creative image --product "商品名"

# スタイル指定
/meta-ads-creative image --product "商品名" --style "luxury"

# 複数サイズ生成
/meta-ads-creative image --product "商品名" --sizes feed,story,square

# バリエーション生成
/meta-ads-creative image --product "商品名" --variations 5
```

### コピー生成

```bash
# 基本生成
/meta-ads-creative copy --product "商品名" --target "30代女性"

# 太陽スタイル適用
/meta-ads-creative copy --product "商品名" --style taiyo

# 複数パターン
/meta-ads-creative copy --product "商品名" --variations 10
```

### フルセット生成

```bash
# 画像+コピーセット
/meta-ads-creative full --product "商品名" --target "30代女性"

# キャンペーン用フルパッケージ
/meta-ads-creative package --product "商品名" --campaign-type conversion
```

## 生成パイプライン

```
┌─────────────────────────────────────────────────────────────┐
│                  クリエイティブ生成パイプライン              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [入力] 商品情報 + ターゲット + スタイル                     │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  画像生成        │    │  コピー生成      │                │
│  │  NanoBanana Pro  │    │  太陽スタイル    │                │
│  └────────┬────────┘    └────────┬────────┘                │
│           │                      │                          │
│           ▼                      ▼                          │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  サイズ変換      │    │  長さ調整        │                │
│  │  Feed/Story/Sq  │    │  文字数制限      │                │
│  └────────┬────────┘    └────────┬────────┘                │
│           │                      │                          │
│           └──────────┬───────────┘                          │
│                      ▼                                      │
│           ┌─────────────────┐                              │
│           │  品質チェック    │                              │
│           │  • 解像度        │                              │
│           │  • テキスト量    │                              │
│           │  • ポリシー準拠  │                              │
│           └────────┬────────┘                              │
│                    ▼                                        │
│           [出力] クリエイティブパッケージ                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 出力構造

```
creative-output/
├── images/
│   ├── feed-1200x628.png
│   ├── story-1080x1920.png
│   └── square-1080x1080.png
├── copy/
│   ├── headlines.json        # ヘッドライン候補（10件）
│   ├── primary_text.json     # 本文候補（5件）
│   └── descriptions.json     # 説明文候補（5件）
├── variations/
│   ├── variation-1/
│   ├── variation-2/
│   └── variation-3/
└── meta-upload-ready/
    └── bulk-upload.csv       # Meta Ads Manager用CSVテンプレート
```

## 太陽スタイル コピー生成ルール

### ヘッドライン（40文字以内）

```
パターン:
1. 【数字】+ ベネフィット
   例: 「3日で-5kg」「月収100万円」

2. 【疑問形】+ 解決提示
   例: 「まだ○○で消耗してる？」

3. 【限定性】+ 緊急性
   例: 「本日限り」「残り3名」

4. 【否定形】+ 好奇心
   例: 「○○はもう古い」「知らないと損」
```

### 本文（125文字以内）

```
構成:
1. フック（問題提起/共感）
2. ベネフィット提示
3. 証拠/実績
4. CTA
```

## Meta広告ポリシーチェック

自動チェック項目：
- [ ] 画像内テキスト20%以下
- [ ] 誇大広告表現なし
- [ ] 禁止コンテンツなし
- [ ] 年齢制限確認
- [ ] ランディングページ一致

## 関連スキル

- `/nanobanana-pro` - 画像生成エンジン
- `/taiyo-style-headline` - ヘッドライン生成
- `/taiyo-style` - コピーライティング
