---
# 🔬 TAISUN v2 リサーチレポート
## 日本語Instagram Reel動画 フレーズ単位 テキスト-映像セマンティックマッチングシステム

**レポート生成日**: 2026-03-14
**プロトコル**: TAISUN v2 リサーチ提案v2_SUPER_PROMPT
**ステータス**: ✅ STEP 1〜4 完了 → ユーザー承認待ち

---

## 📋 目次

1. エグゼクティブサマリー
2. 問題定義・現状分析
3. ビルドターゲット定義
4. グローバルSOTA技術スキャン結果
5. テキスト-映像セマンティックマッチングモデル比較
6. 候補技術のTrendScore評価
7. 推奨アーキテクチャ設計
8. 実装計画（フェーズ分割）
9. コスト分析
10. リスク評価・軽減策
11. 既存システムとの統合方針
12. 次のアクション・承認事項

---

## 1. エグゼクティブサマリー

### 問題の核心

現在の `generate_clips_from_template()` は **機械的な循環（cyclic rotation）** でKlingプロンプトを選択しており、台本テキストとの意味的対応がゼロである。

```python
# 現状（完全に壊れている）
keyword = bg_keywords[i % len(bg_keywords)]  # 台本内容を一切見ていない
```

**実例での失敗**:
- 「Kindle 50冊・手数料0円」 → トロピカルビーチ作業 (NG)
- 「投資で騙されたことがある」 → 高級リゾートプール (NG)
- 「孫正義さんが2025年7月に言い切りました」 → 都市ウォーキング (NG)

### 推奨ソリューション: 3層ハイブリッドアーキテクチャ

```
台本テキスト（日本語）
    Layer 1: Claude Haiku 構造化出力
    → emotion / topic / pexels_query（英語）/ mood
    Layer 2: Pexels API キーワード検索
    → 10-15候補動画
    Layer 3: Jina CLIP v2 コサイン類似度再ランキング
    → 最適マッチ（31ms/クエリ）
    スコア < 0.25 → Kling v3 Pro フォールバック生成
    ↓
最終背景動画（テキストと意味的に一致）
```

### 期待効果

| 指標 | 現状 | 実装後 |
|------|------|--------|
| テキスト-映像マッチ精度 | ~10% (偶然) | ~75-85% |
| Kling生成コスト/動画 | $16 | $3-8 |
| 処理時間/行 | 90-120秒 | 5-15秒 (Pexels優先) |
| 台本感情との対応 | 0% | 80%+ |

---

## 2. 問題定義・現状分析

### 2.1 現状の問題箇所

**ファイル**: `scripts/run_template_videos.py` の `generate_clips_from_template()` 関数

```python
for i, group in enumerate(groups):
    keyword = bg_keywords[i % len(bg_keywords)]  # 問題箇所：意味無視の循環
    prompt = keyword + BRAND_STYLE_SUFFIX
```

**問題の本質**:
- `bg_keywords` は分析レポートから4つの固定キーワードのみ
- グループ数がキーワード数を超えると単純に繰り返す
- 台本の感情・テーマ・話者意図は一切考慮されない

### 2.2 CLIP分析による失敗パターン

| 台本行 | 感情 | 割当キーワード | 推定類似度 |
|--------|------|--------------|-----------|
| 「毎月の収入が安定しない」 | 不安/焦り | luxury resort pool | 0.08 |
| 「投資で騙されたことがある」 | 怒り/後悔 | botanical cafe work | 0.06 |
| 「孫正義さんが言い切りました」 | 権威/説得 | urban walking | 0.12 |
| 「WIN-WINのパートナーとなる」 | 共感/信頼 | luxury resort | 0.15 |
| 「専門知識？不要です」 | 解放感/喜び | minimalist office | 0.22 |

**目標**: 全行でコサイン類似度 ≥ 0.25

### 2.3 intelligence-research 収集データ（2026-03-14）

GIS 198件収集:
- AI/ML: 82件（Gemini Embedding 2, Kling 3.0, SigLIP 2等が上位）
- Dev Tools: 65件
- Finance/Economics: 50件
- 注目: Gemini Embedding 2が2026-03-10リリース（マルチモーダル統合埋め込み）

---

## 3. ビルドターゲット定義

**システム名**: SemanticBG — 日本語Instagram Reel フレーズ単位セマンティック背景マッチングシステム

### 機能要件

| ID | 要件 | 優先度 |
|----|------|--------|
| F-01 | 日本語テキスト1行 → 感情・テーマ・英語クエリの自動抽出 | P0 |
| F-02 | Pexels APIから関連動画を10-15件取得 | P0 |
| F-03 | CLIP系モデルで候補動画とテキストのコサイン類似度計算 | P0 |
| F-04 | 最高スコアの動画を選択してパスを返す | P0 |
| F-05 | スコア閾値未満の場合Kling v3 Proで新規生成 | P1 |
| F-06 | 処理結果のキャッシュ（同一テキスト再処理防止） | P1 |
| F-07 | 並列処理（68行スクリプトを並列10で処理） | P1 |
| F-08 | 既存 `generate_clips_from_template()` の代替として動作 | P0 |

### 非機能要件

| 指標 | 目標値 |
|------|--------|
| 1行あたり処理時間 | < 15秒（Pexelsヒット時） |
| テキスト-映像一致率 | ≥ 75%（コサイン類似度 ≥ 0.25） |
| Kling生成コスト削減 | 70%以上（現状比） |
| 日本語対応 | 完全対応 |

---

## 4. グローバルSOTA技術スキャン結果

### 4.1 2025-2026年の主要ブレークスルー

#### Gemini Embedding 2（Google、2026-03-10）
- リリースわずか4日前（調査時点で最新）
- テキスト+画像+動画+音声+PDFを1つのベクトル空間に統合
- 3072次元（Matryoshka対応）、100+言語
- 既存マルチモデルパイプライン比でレイテンシ70%減、再現率20%向上
- 制約: Public Preview（本番利用は要注意）

#### Jina CLIP v2（Jina AI）
- 89言語対応、テキスト-画像クロスモーダル
- ~3GB VRAM（ローカル実行可能）
- 多言語CLIPのデファクトスタンダード
- Apache 2.0ライセンス

#### SigLIP 2 SO400M（Google、2025-02-04）
- MSR-VTT R@1 ~68%
- 6GB VRAM
- `google/siglip2-so400m-patch14-384`

#### InternVideo2-6B
- SOTA性能だが12GB VRAM必須（実用困難）

### 4.2 OSS実装事例

- **short-video-maker** (gyoridavid): Pexels API + キーワード検索 + Remotion（本プロジェクトと同スタック）
- **ai-reel-generator** (inframarauder): sentence-transformers + コサイン類似度でシーン説明マッチング

---

## 5. テキスト-映像セマンティックマッチングモデル比較

| モデル | MSR-VTT R@1 | VRAM | 日本語 | 速度 | ライセンス | 推奨度 |
|--------|-------------|------|--------|------|-----------|--------|
| **Jina CLIP v2** | ~65% | ~3GB | 89言語 | 20-50ms | Apache 2.0 | ★★★★★ |
| SigLIP 2 SO400M | ~68% | 6GB | 89言語 | 50-100ms | Apache 2.0 | ★★★★ |
| CLIP ViT-L14 | ~60% | 4GB | 翻訳必要 | 20-70ms | MIT | ★★★ |
| InternVideo2-6B | ~75% | 12GB | △ | 200ms+ | CC-BY-NC | ★★ |
| Gemini Embedding 2 | 未公開 | クラウド | 100+言語 | API依存 | Google API | ★★★★ (Preview) |

### 日本語処理アプローチ比較

| アプローチ | 翻訳コスト | 精度 |
|-----------|-----------|------|
| ネイティブ多言語CLIP (Jina v2) | 不要 | 高 |
| 翻訳→CLIP (ViT-L14) | $0.001/行 | 中 |
| LLM構造化出力 (Claude Haiku) | $0.0003/行 | 中〜高（文脈理解） |
| **ハイブリッド (Haiku + Jina CLIP v2)** | $0.0003/行 | **最高** |

---

## 6. 候補技術のTrendScore評価

TrendScore (0-100) = コミュニティ×0.25 + Stars/増加率×0.20 + リリース×0.20 + 日本語×0.15 + 本番実績×0.15 + コスト×0.05

| 技術 | TrendScore | 選択 |
|------|-----------|------|
| Claude Haiku 4.5 | 94 | Layer 1: テキスト分析 |
| pgvector | 90 | ベクターDB（本番候補） |
| **Qdrant** | **89** | **ベクターDB（推奨）** |
| **Jina CLIP v2** | **88** | **Layer 3: 再ランキング** |
| ChromaDB | 87 | ベクターDB（開発用） |
| Gemini Embedding 2 | 85 | 将来候補（Preview卒業後） |
| SigLIP 2 SO400M | 84 | Jina v2代替 |
| Pexels API | 83 | Layer 2: 動画検索 |
| Kling 3.0 | 74 | Fallback生成 |

---

## 7. 推奨アーキテクチャ設計

### 7.1 3層ハイブリッドフロー

```
INPUT: 日本語テキスト 1行
    ↓
[Layer 1] Claude Haiku 4.5 構造化出力
  → VideoContext {
      emotion: "anxiety",
      pexels_query: "stressed person financial worry",
      secondary_query: "person looking at bills concerned",
      mood: "serious"
    }
  コスト: $0.0003/行  速度: 1-3秒
    ↓
[Layer 2] Pexels API 動画検索
  → pexels_query: 8件 + secondary_query: 5件 = 13候補
  → 各動画の代表フレーム3枚抽出 (ffmpeg)
  コスト: 無料  速度: 2-5秒
    ↓
[Layer 3] Jina CLIP v2 再ランキング
  → テキスト埋め込み + 画像埋め込み → コサイン類似度
  → 最高スコア動画選択
  コスト: $0（ローカル）  速度: 31ms/query
    ↓
スコア ≥ 0.25? → YES: Pexels動画パスを返す
              → NO:  Kling v3 Pro 生成 ($0.70/clip)
    ↓
OUTPUT: 最適背景動画パス
```

### 7.2 コアデータクラス設計

```python
from pydantic import BaseModel
from typing import Optional

class VideoContext(BaseModel):
    emotion: str           # "anxiety", "joy", "urgency", "trust"
    topic: str             # "financial_instability", "ai_opportunity"
    pexels_query: str      # Pexels向け英語クエリ
    mood: str              # "serious", "uplifting", "inspiring"
    secondary_query: str   # 補完クエリ

class SemanticBGResult(BaseModel):
    line_index: int
    text: str
    video_path: str
    similarity_score: float
    source: str            # "pexels" or "kling"
    context: VideoContext
    processing_time_ms: float
```

### 7.3 既存関数との接続

```python
# run_template_videos.py への最小変更
def generate_clips_from_template(
    script_lines, bg_keywords,
    lines_per_clip=3, parallel=PARALLEL_GENERATIONS,
    use_semantic=True,  # デフォルトONで新機能使用
):
    if use_semantic:
        return _generate_clips_semantic(script_lines, parallel)
    else:
        return _generate_clips_legacy(script_lines, bg_keywords, lines_per_clip)
```

---

## 8. 実装計画（フェーズ分割）

| Phase | 内容 | 期間 | 成果物 |
|-------|------|------|--------|
| 0 | 環境準備 (pip install, APIキー確認) | 1日 | 動作環境 |
| 1 | Claude Haiku テキスト分析レイヤー | 2日 | TextAnalyzer + テスト |
| 2 | Pexels動画検索 + キャッシュ | 1日 | PexelsSearcher |
| 3 | Jina CLIP v2 再ランキング | 2日 | CLIPRanker + ベンチマーク |
| 4 | 統合 + Klingフォールバック | 2日 | SemanticBGMatcher |
| 5 | 既存スクリプト統合 | 1日 | run_template_videos.py更新 |
| 6 | 評価・チューニング | 1-2日 | 精度/コスト測定レポート |

**先行推奨**: Phase 0-1 のみ先行実装して動作確認後、続行判断

### Phase 0: 依存関係

```bash
pip install transformers torch torchvision
pip install chromadb pydantic requests
pip install deep-translator
pip install anthropic
# Pexels APIキー: 既存の $PEXELS_API_KEY を使用
```

---

## 9. コスト分析

### 1動画（68行スクリプト）あたりコスト比較

#### 現状（機械的循環）
| コンポーネント | 数量 | 単価 | 小計 |
|--------------|------|------|------|
| Kling v3 Pro (5s) | 23 clips | $0.70 | $16.10 |
| Fish Audio TTS | 3min | $0.10/min | $0.30 |
| **合計** | | | **$16.40** |

#### 新システム（SemanticBG、Kling 30%想定）
| コンポーネント | 数量 | 単価 | 小計 |
|--------------|------|------|------|
| Claude Haiku 4.5 | 68行 | $0.0003 | $0.02 |
| Pexels API | 1,020 req | 無料 | $0.00 |
| Jina CLIP v2 | 1,020 比較 | $0（ローカル） | $0.00 |
| Kling v3 Pro (フォールバック) | ~7 clips | $0.70 | $4.90 |
| Fish Audio TTS | 3min | $0.10/min | $0.30 |
| **合計** | | | **$5.22** |

**コスト削減率: 68%**

### フォールバック率別コスト

| Kling使用率 | コスト | 削減率 |
|-----------|--------|--------|
| 0% | $0.32 | 98% |
| 10% | $1.94 | 88% |
| **30% (推奨閾値)** | **$5.17** | **68%** |
| 50% | $8.37 | 49% |

---

## 10. リスク評価・軽減策

| リスク | 影響 | 確率 | 軽減策 |
|--------|------|------|--------|
| Jina CLIP v2 Mac ARM VRAM制限 | 高 | 中 | MPS対応確認、CPU fallback |
| Pexels APIレート制限(200req/h) | 中 | 高 | キャッシュ層、レート制御 |
| Claude Haiku API障害 | 中 | 低 | ルールベースフォールバック |
| CLIP類似度が全行0.25未満 | 高 | 低 | 閾値調整可能に設計 |
| Gemini Embedding 2 Preview不安定 | 高 | 中 | v1.0正式リリースまで本番禁止 |
| Pexels動画低品質 | 中 | 中 | 解像度フィルタ(≥720p) |

---

## 11. 既存システムとの統合方針

### 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `scripts/semantic_bg/__init__.py` | 新規 | SemanticBGMatcher（メインクラス） |
| `scripts/semantic_bg/text_analyzer.py` | 新規 | Claude Haiku構造化出力 |
| `scripts/semantic_bg/pexels_searcher.py` | 新規 | Pexels検索+キャッシュ |
| `scripts/semantic_bg/clip_ranker.py` | 新規 | Jina CLIP v2再ランキング |
| `scripts/run_template_videos.py` | 修正 | use_semantic=True フラグ追加 |
| `scripts/run_custom_script.py` | 修正 | 同上 |
| `requirements.txt` | 修正 | 新依存関係追加 |

### 変更しないファイル（ベースライン保護）

- `scripts/fetch_background_kling.py` — Kling生成コア
- `scripts/compose_video_remotion.py` — 動画合成
- `scripts/generate_tts.py` — TTS処理
- `analysis/reel_analysis_report.json` — テンプレート参照

---

## 12. 次のアクション・承認事項

### ユーザー承認が必要な項目

#### 承認1: 実装開始
このレポートを確認の上、実装を開始するか確認してください。

推奨: Phase 0-1 先行実装（1-2日）→ 結果確認後、続行判断

#### 承認2: モデル選択

| 選択肢 | 推奨度 | 特徴 |
|--------|--------|------|
| **Jina CLIP v2** | ★★★★★ | 日本語最強、軽量、Apache 2.0 |
| SigLIP 2 SO400M | ★★★★ | 性能高いが重い（6GB VRAM） |
| Gemini Embedding 2 | ★★★★ | 最新最強だがPreview中 |

デフォルト推奨: **Jina CLIP v2**

#### 承認3: 類似度閾値

| 閾値 | Kling使用率 | コスト/動画 |
|------|-----------|---------|
| 0.15 | ~10% | $1.94 |
| **0.25（推奨）** | **~30%** | **$5.17** |
| 0.35 | ~50% | $8.37 |

デフォルト推奨: **0.25**（実装後に調整可能）

#### 確認チェックリスト

```
[ ] 1. Jina CLIP v2 を使うことを承認する
[ ] 2. 類似度閾値 0.25 を承認する（後で調整可能）
[ ] 3. Phase 0-1 を先行実装することを承認する
[ ] 4. 後方互換フラグ（use_semantic=True）の設計を承認する
[ ] 5. Pexels API をプライマリソースとして使用することを承認する
```

---

*レポート生成: TAISUN v2 リサーチプロトコル準拠*
*調査期間: 2026-03-14*
*次のステップ: ユーザー承認後、Phase 0 実装開始*
