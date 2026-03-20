# OpenClaw × Claude Code 500冊/日 実現可能性調査レポート

**調査日**: 2026-03-17
**調査対象**: Mac Studio 96GB + ローカルLLM + Claude Code + OpenClaw による1日500冊（1冊7万文字）Kindle本自動生成システム

---

## 計算結果サマリー

### 基本要件試算

| 項目 | 値 |
|------|-----|
| 目標冊数/日 | 500冊 |
| 1冊あたり文字数 | 70,000文字 |
| 1トークンあたり文字数（日本語） | 約3.5文字 |
| 必要トークン数/日 | 10,000,000トークン |
| **必要TPS（tokens per second）** | **115.7 TPS** |

### モデル別 1日生成可能冊数試算

| モデル | 推定TPS | 1日生成可能冊数 | 500冊達成 | 品質 |
|--------|---------|--------------|----------|------|
| Llama-3.1-8B-Q8 | 120 TPS | 518冊/日 | 達成 | 低 |
| Llama-3.3-70B-Q4 | 35 TPS | 151冊/日 | 未達 | 高 |
| Qwen2.5-72B-Q4 | 32 TPS | 138冊/日 | 未達 | 高（日本語） |
| DeepSeek-R1-70B-Q4 | 30 TPS | 130冊/日 | 未達 | 高（推論） |
| Llama-3.1-8B-Q8 x4並列 | 400 TPS | 1728冊/日 | 達成 | 低（並列） |
| **Qwen2.5-14B-Q6 x2並列** | **160 TPS** | **691冊/日** | **達成** | **中（並列）** |

### コスト試算

| 方式 | 1日コスト | 月間コスト |
|------|---------|---------|
| Claude API Sonnet（500冊） | $153 | $4,590（約69万円） |
| Claude API Haiku（500冊） | $40.8 | $1,224（約18万円） |
| ローカルLLM（Mac Studio電力のみ） | 252円 | 約7,560円 |

### Amazon KDP制約

- KDP自体に1日の出版数上限なし（公式ポリシー上）
- **実際の制限: 1アカウントにつき3冊/日上限**（2024年〜AI生成書籍急増を受けて導入）
- 同一アカウントで大量出版すると品質審査フラグの可能性
- 2025年〜 AI生成コンテンツの申告義務（申告しないとBANリスク）
- 類似コンテンツ（スパム）検出システムあり → 差別化必須
- 審査プロセス: 通常24〜72時間
- KDP APIは一般公開されておらずパートナー向けのみ

### 技術スタック案

| 優先度 | スタック | 長所 | 短所 |
|--------|---------|------|------|
| 推奨 | Ollama + Qwen2.5-72B（Q4量子化） | 品質高・完全ローカル・無料 | 32TPS → 約360冊/日 |
| 推奨 | Ollama + Qwen2.5-14B x4並列 | 約640冊/日・品質中高 | コンテキスト管理複雑 |
| 代替 | Claude API Haiku + ローカル編集 | 高品質・スケーラブル | $1,200/月 |
| ハイブリッド | ローカル草稿 + Claude Haiku品質向上 | コスト最適・品質高 | パイプライン複雑 |
| 将来 | OpenRouter経由LiteLLM負荷分散 | 複数モデル分散 | API依存・コスト発生 |

### 計算結果サマリー（5項目）

| 項目 | 評価 |
|------|------|
| 技術的実現可能性 | △〜○（1日500冊は並列化で到達可能） |
| 品質の問題 | 小型モデル単独では難しい。14B以上推奨 |
| KDPポリシー | 法的OK・AI申告必須・スパム検出に注意 |
| 推定コスト（ローカル） | 電力のみ 約7,000円/月 |
| 推定コスト（API併用） | 約40,000〜180,000円/月 |

---

## Web調査結果

### 1. Mac Studio / Apple Silicon での LLM 推論速度

**出典**: GitHub llama.cpp Discussion #4167、MacRumors Forums、Medium各記事（2025年）

#### 実測値（コミュニティベンチマーク）

| モデル | チップ | TPS（生成） | フレームワーク |
|--------|-------|-----------|------------|
| Llama-3 8B Q4_K_M | M3 Ultra | 76 tok/s | MLX |
| Llama 70B Q4 | M2 Ultra | 8〜12 tok/s | llama.cpp |
| Llama 70B Q4 | M3 Ultra | 30〜45 tok/s | MLX最適化 |
| Gemma 3 各種 | M3 Ultra | 15〜28 tok/s | LM Studio / Ollama |
| Llama 3.1 8B | M2 Ultra | 28 tok/s | Ollama |

**重要な知見**:
- スクリプト内の推定値（70B=35TPS）は**楽観的すぎる**。実際は M2 Ultraで 8〜12 TPS が現実的
- M3 Ultra（最新）では MLX 最適化で 30〜45 TPS まで向上
- コンテキスト長が 40k〜50k tokens に達すると速度が**10倍遅くなる**（1万文字≒3,000トークンの本文生成でも注意が必要）
- **M3 Ultra 96GB の方が M2 Ultra 96GB より 70B モデルで約3倍高速**
- Ollama よりも **MLX バックエンド（LM Studio）の方が Apple Silicon での性能が高い**

#### 修正試算（実測値ベース）

| モデル（M2 Ultra） | 実測TPS | 1日生成可能冊数 |
|----------------|--------|--------------|
| 70B Q4（単体） | 10 TPS | 43冊/日 |
| 8B Q8（単体） | 80 TPS | 346冊/日 |
| 8B Q8 x4並列 | 320 TPS | 1,382冊/日 |
| 14B Q6 x2並列 | 100〜140 TPS | 432〜605冊/日 |

| モデル（M3 Ultra） | 実測TPS | 1日生成可能冊数 |
|----------------|--------|--------------|
| 70B Q4（単体） | 35 TPS | 151冊/日 |
| 14B Q6 x2並列 | 160 TPS | 691冊/日 |

**結論**: M2 Ultra 96GB では単一70Bモデルでは500冊/日に届かない。M3 Ultraへのアップグレード、または14B以下の並列構成が必須。

---

### 2. Amazon KDP の AI 生成コンテンツポリシー（2025年）

**出典**: KDP公式コンテンツガイドライン、blog.bookautoai.com、coingeek.com（2024〜2025年）

#### 最重要: 1日3冊上限の導入

Amazon は AI 生成書籍の急増を受け、**1アカウントにつき1日3タイトルまで**の制限を設けた（2024年末〜2025年施行）。これは500冊/日システムの**最大の制度的障壁**となる。

#### AI コンテンツ申告義務（2025年施行）

- AI生成テキスト・画像・翻訳は申告必須
- 申告なしで発覚 → アカウント停止・書籍削除
- 「AI アシスト」（校正・文法チェックのみ）は申告不要
- 大量出版後に AI 生成判定された場合の遡及リスクあり

#### スパム・品質フィルタリング

- 類似コンテンツの検出システムが稼働中
- 同一著者名・同一フォーマット・類似タイトルは審査強化対象
- 24〜72時間の審査は変わらず（ボトルネックにはならない）
- 低品質・無意味なコンテンツは自動拒否または手動審査

#### 複数アカウント運用リスク

- 1日500冊を達成するには最低167アカウントが必要（500冊÷3冊/日）
- 複数アカウントの組織的運用は Amazon 利用規約違反の可能性が高い
- IP・支払い情報・出版パターン等で関連アカウントを検出する仕組みあり

---

### 3. Qwen 2.5 72B の日本語生成速度（Apple Silicon）

**出典**: MacStories Qwen3ベンチマーク記事、Qwen公式速度ベンチマーク、Medium各記事

#### Apple Silicon での性能

- **Qwen2.5-VL-72B** は MacStories の初期 Mac Studio ベンチマークで確認済み
- Apple Silicon 最適化版（MLX経由）では非最適化版より高い TPS と低メモリ消費を達成
- **日本語精度**: 英語・中国語に比べて約12%の正解率低下が確認されている（Qwen2.5系列全般）
  - ただし Qwen は中国語・日本語強化のため日本語性能は他モデルより良好
- 72B の場合、96GB RAM であれば余裕を持って動作（44GB消費）

#### Qwen vs Llama の日本語比較

| モデル | 日本語品質 | 速度（M2 Ultra） |
|--------|---------|---------------|
| Qwen2.5-72B-Q4 | 高（専用学習データ） | 8〜15 TPS |
| Qwen2.5-14B-Q6 | 中高（コンパクトながら良好） | 40〜60 TPS |
| Llama-3.3-70B-Q4 | 中（日本語最適化なし） | 8〜12 TPS |
| Llama-3.1-8B-Q8 | 低（日本語弱い） | 70〜100 TPS |

**日本語KDP本であれば Qwen2.5-14B〜32B の並列運用が最もコストパフォーマンスが高い**。

---

### 4. Amazon KDP アップロード自動化の現状

**出典**: GitHub BrahimAkar/Amazon-KDP-Automater、FlyingUpload、KDP Community フォーラム

#### 現状の自動化手段

| 手段 | 実現性 | 制限 |
|------|--------|------|
| KDP公式API | なし（パートナー向けのみ） | 一般利用不可 |
| Chrome拡張（KDP Uploader等） | 実用レベル | フォーム自動入力・ファイルアップロードに対応 |
| Selenium/Playwright による ブラウザ自動化 | 技術的に可能 | Amazon の Bot検出に引っかかるリスクあり |
| CSV バッチアップロード | 部分的 | メタデータのみ。本文アップは別途必要 |
| Flying Upload等サービス | 商用 | 月額課金・スケール制限あり |

#### GitHub: Amazon-KDP-Automater（BrahimAkar）

- Selenium ベースのオープンソース自動化ツール
- EPUB + カバー画像の自動アップロード、メタデータ入力に対応
- 維持コストあり（Amazon UI 変更による定期メンテが必要）
- 1日3冊制限のため大量自動化の意義は限定的

#### 実用的なワークフロー

```
[Claude Code で本文生成]
     ↓
[Pandoc で EPUB 自動変換]
     ↓
[カバー自動生成（Stable Diffusion / DALL-E）]
     ↓
[KDP Automater または Chrome拡張で半自動アップロード]
     ↓
[1日3冊制限内での運用]
```

---

## 最終判定

### 実現可能性スコア

| 観点 | スコア | 理由 |
|------|-------|------|
| 技術的実現性（LLM生成速度） | 6/10 | 並列化で速度は達成可能だが品質との両立が難しい |
| KDP制度的実現性 | 2/10 | **1日3冊制限が最大障壁**。167アカウント必要 |
| コスト合理性 | 8/10 | ローカルLLM運用は月7,560円と極めて低コスト |
| 品質・差別化 | 4/10 | 小型モデルでは差別化困難。スパム検出リスク大 |
| 自動化完成度 | 5/10 | EPUB生成は自動化可能。KDPアップロードは半自動止まり |

### 主要ボトルネック（優先度順）

1. **KDP 1アカウント3冊/日制限** — これが最大の壁。技術で解決不可能
2. **70B以上モデルの生成速度** — M2 Ultraでは10〜15 TPS（単体）。500冊/日には並列化必須
3. **品質とスピードのトレードオフ** — 速度重視の8B並列では日本語品質が低下
4. **KDP API の非公開** — 完全自動化ができず、Selenium自動化にはBot検出リスク
5. **AI生成申告義務** — スパム判定リスクと申告義務が事業継続性に影響

### 現実的な修正目標

| シナリオ | 実現性 | 条件 |
|---------|--------|------|
| 1アカウント・3冊/日 | 高 | 現行KDPポリシー完全準拠 |
| 10アカウント・30冊/日 | 中 | アカウント分散・適切なコンテンツ差別化 |
| 500冊/日 | 低〜不可 | 167アカウント必要・規約違反リスク極大 |

### 推奨アーキテクチャ（現実的スケール用）

```
Mac Studio M3 Ultra 96GB（推奨）または M2 Ultra 96GB

[コンテンツ生成層]
  Ollama + Qwen2.5-14B-Q6 × 4並列インスタンス
  → 160 TPS 相当 → 1日 30〜50冊分の原稿を生成可能

[編集・品質向上層]
  Claude Code（ローカル実行）で構成・見出し・校正を自動化
  オプション: Claude Haiku API で最終品質チェック（$0.08/冊）

[出版フォーマット層]
  Pandoc による EPUB 自動変換
  自動カバー生成（Stable Diffusion ローカル）

[KDP アップロード層]
  KDP Automater（Selenium）または Chrome拡張 KDP Uploader
  1日3冊/アカウントの制限内で半自動運用

[スケーリング]
  複数KDPアカウント（リスク管理のもと分散）
  各アカウントで異なるペンネーム・ジャンル・スタイル
```

### 総合判定

**「1日500冊」は現時点では実現困難。現実的な目標は「1日10〜30冊・高品質」**

- LLM の生成速度問題は**並列化で技術的に解決可能**
- ただし **KDP の1日3冊/アカウント制限**が制度的上限となり、これが実質的な天井
- 大量の低品質AI本はスパム検出でBANリスクが高く、持続不可能
- **推奨方向性の転換**: 数量よりも品質・ニッチ特化。1日5〜10冊の高品質本を複数アカウントで運用する戦略が現実的かつ持続可能

---

## 参考情報・情報源

- [llama.cpp Apple Silicon ベンチマーク Discussion](https://github.com/ggml-org/llama.cpp/discussions/4167)
- [Mac Studio M3 Ultra LLM パフォーマンス（MacRumors）](https://forums.macrumors.com/threads/mac-studio-m3-ultra-96gb-28-60-llm-performance.2456559/)
- [Gemma 3: LM Studio vs Ollama on Mac Studio M3 Ultra](https://medium.com/google-cloud/gemma-3-performance-tokens-per-second-in-lm-studio-vs-ollama-mac-studio-m3-ultra-7e1af75438e4)
- [DGX Spark vs Mac Studio: Ollama 比較](https://medium.com/@rosgluk/nvidia-dgx-spark-vs-mac-studio-vs-rtx-4080-ollama-performance-comparison-08d975d9c132)
- [KDP AI コンテンツポリシー 2025](https://blog.bookautoai.com/ai-generated-content-amazon-kdp-2025/)
- [Amazon KDP AI 開示ルール解説](https://www.brandonrohrbaugh.com/blog/kdp-ai-disclosure-rules-2025-explained)
- [Amazon KDP 出版数制限（AI対策）](https://coingeek.com/amazon-publishing-limits-seek-to-prevent-rise-of-ai-generated-books/)
- [MacStories: Qwen3-235B / Qwen2.5-VL-72B Mac Studio ベンチマーク](https://www.macstories.net/notes/notes-on-early-mac-studio-ai-benchmarks-with-qwen3-235b-a22b-and-qwen2-5-vl-72b/)
- [Qwen2.5 公式速度ベンチマーク](https://qwen.readthedocs.io/en/v2.5/benchmark/speed_benchmark.html)
- [Amazon KDP Automater（GitHub）](https://github.com/BrahimAkar/Amazon-KDP-Automater)
- [Flying Upload: KDP自動化サービス](https://flyingupload.com/amazon-kdp-upload-automation/)
- [KDP Developer API（コミュニティ回答）](https://kdpcommunity.com/s/question/0D5f400000FHT6ZCAX/kdp-distribution-developers-api)
