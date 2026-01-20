# LP JSON Generator

参考画像のデザインスタイルを維持しながら、テキストのみを変更したLP画像を生成するスキル。

## 概要

```
[参考画像] → [JSON仕様書] → [テキスト変更] → [Gemini生成] → [新LP画像]
```

従来のAI画像生成では「参考画像と同じデザインでテキストだけ変更」が困難でしたが、
JSON形式でデザインを構造化することで、テキスト部分のみを正確に差し替えて再生成できます。

## インストール

```bash
# このスキルはnanobanana-proに依存
cd .claude/skills
git clone https://github.com/RenTonoduka/NanobananaPro-skill.git nanobanana-pro

# 認証（初回のみ）
cd nanobanana-pro
python3 scripts/run.py auth_manager.py setup
```

## ディレクトリ構造

```
lp-json-generator/
├── SKILL.md              # Claude Code用の指示書
├── WORKFLOW.md           # ワークフロー詳細解説
├── README.md             # このファイル
├── scripts/
│   └── generate_lp.py    # メイン生成スクリプト
└── templates/
    ├── basic_lp.json     # 汎用テンプレート
    └── 7years_silence.json  # 「7年間の沈黙」テンプレート
```

## 使い方

### 方法1: Claudeに依頼

```
「このLPの画像で、文字だけ変えて新しいLP画像を作って」
→ /lp-json-generator スキルが起動
```

### 方法2: コマンドラインで実行

```bash
cd .claude/skills/lp-json-generator

# テンプレートから生成
python3 scripts/generate_lp.py \
  --template templates/7years_silence.json \
  --output ../../output/my_lp.png

# タイムアウト延長
python3 scripts/generate_lp.py \
  --template templates/7years_silence.json \
  --output ../../output/my_lp.png \
  --timeout 300

# デバッグ（ブラウザ表示）
python3 scripts/generate_lp.py \
  --template templates/7years_silence.json \
  --output ../../output/my_lp.png \
  --show-browser
```

### 方法3: NanoBanana Proを直接使用

```bash
cd .claude/skills/nanobanana-pro

python3 scripts/run.py image_generator.py \
  --prompt 'Generate a Japanese marketing LP header image exactly according to this JSON specification: {...}' \
  --output output/lp.png \
  --timeout 180
```

## JSONテンプレートの作成方法

### Step 1: 参考画像を分析

以下の要素を特定:
- キャンバスサイズ、背景色
- レイアウト（テキスト位置、写真位置）
- 各テキスト要素（内容、フォント、色、サイズ）
- 装飾要素（楕円ブラシストロークなど）
- ボタン（色、形、テキスト）

### Step 2: JSON構造に落とし込む

```json
{
  "canvas": { "width": 900, "height": 800, "backgroundColor": "#FFFFFF" },
  "topBar": { "backgroundColor": "#C92A2A", "text": "...", "textColor": "#FFFFFF" },
  "textElements": [
    { "text": "...", "fontSize": "22px", "color": "#333333" },
    { "text": "...", "fontSize": "72px", "decoration": "golden oval brush stroke" }
  ],
  "ctaButton": { "backgroundColor": "green gradient", "text": "..." },
  "bottomBar": { "backgroundColor": "#C92A2A", "text1": "...", "text2": "..." }
}
```

### Step 3: テキスト部分を変更

`text` プロパティのみを変更し、他の属性は維持。

## 成功のコツ

1. **具体的に記述**: 色はHEXコード、サイズは数値
2. **装飾を詳細に**: 「golden beige oval brush stroke circle」のように
3. **複数回試行**: 結果が微妙なら同じプロンプトで再生成
4. **JSONを簡潔に**: 複雑すぎると精度が下がる

## 制限事項

- 日本語テキストの完全な再現は困難（AIの制限）
- 毎回完全に同じ結果にはならない
- 特定の人物写真の再現は不可能（別途合成が必要）

## 技術スタック

| コンポーネント | 技術 |
|---------------|------|
| 画像生成AI | Google Gemini (Imagen 3) |
| ブラウザ自動化 | Playwright |
| スキル基盤 | NanoBanana Pro |
| プロンプト形式 | JSON |

## 関連ファイル

- `WORKFLOW.md` - 詳細なワークフロー解説
- `SKILL.md` - Claude Code用の指示書
- `templates/` - JSONテンプレート集

## ライセンス

MIT License
