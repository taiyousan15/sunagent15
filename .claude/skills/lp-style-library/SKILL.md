---
name: lp-style-library
description: LP画像からデザインスタイルを自動抽出・保存し、再利用可能なスタイルライブラリを構築。テキスト差し替えでLP画像を量産。
version: "1.0.0"
author: TAISUN
category: marketing
tags: [lp, style-library, image-generation, design-system]
dependencies: []
---

# LP Style Library

LP画像を渡すとデザインスタイルをAI分析してJSON化・保存し、後から選択して再利用できるスキル。
テキストだけ差し替えることで同一デザインのLP画像を量産できる。

---

## コマンド一覧

| コマンド | 説明 |
|----------|------|
| `/lp-style-register` | LP画像を分析してスタイルをJSONで保存 |
| `/lp-style-list` | 保存済みスタイルの一覧表示 |
| `/lp-style-generate` | 保存済みスタイル + 新テキストでLP画像生成 |

---

## 使い方

### スタイル登録

「この画像をLPスタイルとして登録して」+ 画像パス + スタイル名

手順:
1. 指定された画像パスを読み込む（Read toolでバイナリ読み込みまたは画像として認識）
2. AI画像分析を実施し、以下の要素を抽出:
   - canvas（サイズ・背景色・グラデーション）
   - colorPalette（メイン色・アクセント色・テキスト色）
   - layout（セクション配置・余白・カラム）
   - typography（見出しサイズ・本文サイズ・フォントスタイル）
   - decorations（枠線・影・アイコン・背景パターン）
   - components（topBar / bottomBar / ctaButton / personPhoto）
   - textElements（各テキスト要素のキーと内容）
   - overallMood（modern / pop / premium / friendly / corporate）
3. 下記のJSONテンプレートに従いスタイルJSONを生成
4. `.claude/skills/lp-style-library/styles/[スタイル名].json` に保存（Write tool）
5. 保存完了を報告

### スタイル一覧

「登録済みLPスタイルを見せて」

手順:
1. `.claude/skills/lp-style-library/styles/` ディレクトリを確認（Glob tool）
2. 各JSONファイルを読み込み（Read tool）
3. 以下の形式で表形式表示:

| スタイル名 | ムード | メインカラー | 説明 | 登録日 |
|-----------|--------|------------|------|--------|

### スタイル適用生成

「[スタイル名]で新しいLP画像を作って」+ テキスト内容

手順:
1. `.claude/skills/lp-style-library/styles/[スタイル名].json` を読み込む（Read tool）
2. `textElements` の各テキストをユーザー指定の新テキストに差し替え
3. スタイルJSONの情報をもとに詳細な画像生成プロンプトを構築:
   - 背景色・グラデーション
   - カラーパレット
   - レイアウト構造
   - タイポグラフィ指定
   - 装飾要素
   - 各コンポーネント（topBar・bottomBar・ctaButton等）
   - 新しいテキスト内容
4. `mcp__mcp-image__generate_image` で画像生成
5. 生成された画像パスを報告

---

## JSONテンプレート (styles/*.json)

```json
{
  "meta": {
    "name": "スタイル名",
    "description": "スタイルの説明",
    "sourceImage": "元画像のパス（絶対パス）",
    "createdAt": "YYYY-MM-DD",
    "mood": "modern | pop | premium | friendly | corporate"
  },
  "canvas": {
    "width": 1080,
    "height": 1080,
    "backgroundColor": "#FFFFFF",
    "gradient": null
  },
  "colorPalette": {
    "primary": "#C92A2A",
    "secondary": "#1A4D80",
    "accent": "#FFD700",
    "text": "#333333",
    "background": "#FFFFFF"
  },
  "layout": {
    "type": "single-column",
    "sections": ["topBar", "headline", "subtext", "cta", "bottomBar"],
    "padding": "20px"
  },
  "typography": {
    "headline": { "fontSize": "72px", "fontFamily": "brush calligraphy", "fontWeight": "bold" },
    "subHeadline": { "fontSize": "28px", "fontFamily": "serif", "fontWeight": "normal" },
    "body": { "fontSize": "18px", "fontFamily": "sans-serif" },
    "cta": { "fontSize": "24px", "fontFamily": "sans-serif", "fontWeight": "bold" }
  },
  "decorations": {
    "borderStyle": "none",
    "shadowStyle": "none",
    "backgroundPattern": "none",
    "specialEffects": []
  },
  "components": {
    "topBar": {
      "backgroundColor": "#C92A2A",
      "textColor": "#FFFFFF",
      "text": "トップバーテキスト"
    },
    "bottomBar": {
      "backgroundColor": "#C92A2A",
      "textColor": "#FFFFFF",
      "text": "ボトムバーテキスト"
    },
    "ctaButton": {
      "backgroundColor": "green gradient",
      "textColor": "#FFFFFF",
      "text": "CTAボタンテキスト",
      "shape": "rounded"
    },
    "personPhoto": {
      "position": "right",
      "width": "50%",
      "description": "人物写真の説明"
    }
  },
  "textElements": [
    { "key": "pre_headline", "text": "プリヘッド", "style": "subHeadline" },
    { "key": "main_headline", "text": "メインヘッドライン", "style": "headline" },
    { "key": "sub_copy", "text": "サブコピー", "style": "body" },
    { "key": "cta_text", "text": "CTAテキスト", "style": "cta" }
  ]
}
```

---

## 画像生成プロンプト構築ガイドライン

`/lp-style-generate` 実行時、以下の構造でプロンプトを構築する:

```
[スタイル全体の説明]
Japanese LP (landing page) image, [mood]style, [width]x[height]px

[レイアウト]
Layout: [sections] arrangement, [padding] padding

[カラー]
Colors: background [backgroundColor], primary [primary], accent [accent], text [text]

[コンポーネント]
Top bar: "[topBarText]" on [topBar.backgroundColor] background
Headline: "[main_headline]" in [headline.fontSize] [headline.fontFamily], [colorPalette.text]
Sub-copy: "[sub_copy]" in [body.fontSize]
CTA button: "[cta_text]", [ctaButton.backgroundColor], [ctaButton.shape] shape
Bottom bar: "[bottomBarText]" on [bottomBar.backgroundColor] background

[装飾]
Decorations: [borderStyle], [shadowStyle], [backgroundPattern]

[品質指定]
High quality, sharp text, professional design, no blur
```

---

## エラーハンドリング

- 画像が読み込めない場合: パスを確認して再試行を促す
- スタイルJSONが見つからない場合: `/lp-style-list` で一覧確認を促す
- `mcp__mcp-image__generate_image` が利用できない場合: プロンプトのみ出力して手動生成を案内
