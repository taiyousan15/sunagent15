# LP JSON Generator ワークフロー解説

## 概要

参考画像のデザインを維持しながら、テキストのみを変更したLP画像を生成するワークフロー。

---

## 使用技術スタック

| コンポーネント | 技術 | 役割 |
|---------------|------|------|
| 画像生成AI | Google Gemini (Imagen 3) | 画像生成エンジン |
| ブラウザ自動化 | Playwright | Gemini UIの操作 |
| スキル基盤 | NanoBanana Pro | 認証・生成の自動化 |
| プロンプト形式 | JSON | デザイン仕様の構造化 |

---

## ワークフロー全体図

```
┌─────────────────────────────────────────────────────────────────┐
│                    LP JSON Generator Workflow                    │
└─────────────────────────────────────────────────────────────────┘

[Phase 1: 分析]
     │
     ▼
┌─────────────┐
│ 参考画像    │ ──→ デザイン要素を分析
│ (入力)      │     ・レイアウト
└─────────────┘     ・色
                    ・フォント
                    ・装飾
     │
     ▼
[Phase 2: JSON化]
     │
     ▼
┌─────────────┐
│ JSON仕様書  │ ──→ 構造化されたデザイン定義
│ (中間成果物) │     ・canvas (サイズ、背景色)
└─────────────┘     ・textElements (テキスト、位置、色)
                    ・decorations (装飾要素)
                    ・ctaButton (ボタン仕様)
     │
     ▼
[Phase 3: テキスト変更]
     │
     ▼
┌─────────────┐
│ 修正JSON    │ ──→ テキスト部分のみ書き換え
│             │     構造・スタイルは維持
└─────────────┘
     │
     ▼
[Phase 4: 画像生成]
     │
     ▼
┌─────────────┐
│ NanoBanana  │ ──→ Gemini (Imagen 3) で画像生成
│ Pro         │
└─────────────┘
     │
     ▼
┌─────────────┐
│ 生成画像    │
│ (出力)      │
└─────────────┘
```

---

## Phase別詳細解説

### Phase 1: 参考画像の分析

**目的**: 参考画像のデザイン要素を特定・抽出

**分析項目**:
```
1. キャンバス
   - サイズ（幅×高さ）
   - アスペクト比
   - 背景色

2. レイアウト
   - テキストエリアの位置（左60%など）
   - 写真エリアの位置（右40%など）
   - 上下バーの有無

3. テキスト要素（各要素ごとに）
   - テキスト内容
   - フォントファミリー（明朝体、ゴシック、筆文字など）
   - フォントサイズ（相対的な大きさ）
   - フォントウェイト（太さ）
   - 色（HEXコード）
   - 位置（x%, y%）
   - 特殊効果（下線、影、装飾など）

4. 装飾要素
   - 楕円ブラシストローク（色、太さ、スタイル）
   - その他の装飾

5. ボタン
   - 背景色（グラデーション）
   - 形状（角丸）
   - テキスト
   - アイコン

6. 写真エリア
   - 位置
   - サイズ比率
```

### Phase 2: JSON仕様書の作成

**目的**: デザインを構造化されたJSON形式で定義

**JSON構造**:
```json
{
  "canvas": { /* キャンバス設定 */ },
  "topBar": { /* 上部バー */ },
  "textElements": [ /* テキスト要素の配列 */ ],
  "decorations": [ /* 装飾要素 */ ],
  "personPhoto": { /* 人物写真エリア */ },
  "ctaButton": { /* CTAボタン */ },
  "bottomBar": { /* 下部バー */ }
}
```

### Phase 3: テキスト変更

**目的**: JSON内のテキスト値のみを変更

**変更対象**: `text` プロパティのみ
**維持対象**: `fontSize`, `color`, `position`, `fontFamily` など

### Phase 4: 画像生成

**目的**: JSONプロンプトからGeminiで画像生成

**使用ツール**: NanoBanana Pro (image_generator.py)

**生成コマンド**:
```bash
python3 scripts/run.py image_generator.py \
  --prompt "[JSONプロンプト]" \
  --output output/generated.png \
  --timeout 180
```

---

## 今回実行した具体的な手順

### Step 1: NanoBanana Proのセットアップ

```bash
# GitHubからクローン
cd .claude/skills
git clone https://github.com/RenTonoduka/NanobananaPro-skill.git nanobanana-pro

# 認証
python3 scripts/run.py auth_manager.py setup
# → ブラウザでGoogleログイン
```

### Step 2: 参考画像の分析（手動）

参考画像を目視で分析し、以下を特定：
- 白背景 + 赤バー（上下）
- 左側60%にテキスト、右側40%に人物写真
- 金色の楕円ブラシストロークで「寿司職人」を装飾
- 緑のCTAボタン（黄色再生アイコン）

### Step 3: JSON仕様書の作成

```json
{
  "canvas": {"width": 900, "height": 800, "backgroundColor": "#FFFFFF"},
  "topBar": {"backgroundColor": "#C92A2A", "text": "...", "textColor": "#FFFFFF"},
  "textElements": [
    {"text": "えっ！", "fontSize": "22px", "fontStyle": "italic handwritten", "color": "#333333"},
    {"text": "7年間の『沈黙』で", "fontSize": "28px", "fontFamily": "serif", "color": "#111111"},
    {"text": "残酷な真実", "fontSize": "72px", "fontFamily": "brush calligraphy", "decoration": "golden oval brush stroke"},
    // ... 他のテキスト要素
  ],
  "ctaButton": {"backgroundColor": "green gradient", "text": "...", "playIcon": "yellow circle"},
  "bottomBar": {"backgroundColor": "#C92A2A", "text1": "...", "text2": "..."}
}
```

### Step 4: 画像生成

```bash
python3 scripts/run.py image_generator.py \
  --prompt 'Generate a Japanese marketing LP header image exactly according to this JSON specification: {...}' \
  --output output/lp_header_json_v1.png \
  --timeout 180
```

---

## 成功のポイント

1. **構造化されたプロンプト**: JSONでデザインを明確に定義
2. **具体的な指示**: 色はHEXコード、サイズは具体的な数値
3. **装飾の明示**: 「golden beige oval brush stroke」のように具体的に記述
4. **レイアウトの指定**: 位置を%で指定

---

## 制限事項

| 制限 | 説明 | 回避策 |
|------|------|--------|
| 日本語テキストの精度 | AIは日本語を正確に描画できないことがある | 複数回生成して選択 |
| 完全な再現性 | 毎回微妙に異なる結果 | JSONを詳細に記述 |
| 人物写真 | 指定した人物と同じにはならない | 別途合成が必要 |

---

## 次のステップ

1. **スキル化**: このワークフローを `/lp-json-generator` スキルとして定型化
2. **テンプレート化**: 汎用的なJSON構造テンプレートを作成
3. **自動化**: 参考画像→JSON変換の自動化
