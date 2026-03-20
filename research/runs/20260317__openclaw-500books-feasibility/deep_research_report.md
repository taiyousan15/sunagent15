# 500冊/日 Kindle自動生成システム 深掘り調査レポート

**調査日**: 2026-03-17
**調査者**: リサーチアナリスト（Claude Sonnet 4.6）
**テーマ**: Mac Studio 96GB + ローカルLLM で1日500冊（7万文字/冊）のKindle本を自動生成するシステムの実現可能性

---

## 問いの再定義と調査観点

### 本来の問い
「Mac Studio 96GB + ローカルLLM で1日500冊（7万文字/冊）のKindle本を自動生成できるか」

### 再定義された問い
この問いは以下3つの独立した制約を同時にクリアできるかという問いである。
1. **技術的制約**: 96GBのUnified Memory上で、1日あたり3.5億文字（500冊 × 7万文字）を生成するスループットが存在するか
2. **プラットフォーム制約**: Amazon KDPが1日500冊のアップロードを許容するか
3. **品質・法的制約**: AI生成コンテンツとして開示しながら500冊を収益化できる現実的なビジネスモデルが成立するか

---

## 1. Mac Studio 96GBのLLM実性能

### 1.1 M2 Ultra vs M3 Ultra の実測値比較

#### M2 Ultra（192GB）実測データ（参照: llama.cpp Discussion #4167）

| モデル | 量子化 | 生成速度（TPS） |
|--------|--------|-----------------|
| LLaMA 2 70B | Q4_K_M | 8〜12 TPS |
| LLaMA 2 70B | Q4 | 約8 TPS |
| 8B (汎用) | Q4_K_M | 76.28 TPS |
| 8B | F16 | 36.25 TPS |

**出典**: [GPU Benchmarks on LLM Inference（GitHub）](https://github.com/XiongjieDai/GPU-Benchmarks-on-LLM-Inference)

#### M3 Ultra（96GB〜512GB）実測データ

| モデル | 量子化 | 生成速度（TPS） |
|--------|--------|-----------------|
| Llama 3 70B | Q8 | 6.22 TPS（実測）/ 理論上限10.9 TPS |
| Gemma 3 27B | Q4 | 約41 TPS |
| Qwen3-235B-A22B | GGUF | 16 TPS |
| Qwen3-235B-A22B | MLX | 24 TPS |
| DeepSeek R1 17B | Q4 | 17〜18 TPS |

**出典**:
- [Local LLM Hardware Performance Benchmarking（lilys.ai）](https://lilys.ai/en/notes/ai-semiconductor-20251027/local-llm-hardware-2025-prices-performance)
- [MacStories: Mac Studio AI Benchmarks with Qwen3-235B and Qwen2.5-VL-72B](https://www.macstories.net/notes/notes-on-early-mac-studio-ai-benchmarks-with-qwen3-235b-a22b-and-qwen2-5-vl-72b/)

#### M3 Ultra の中規模モデル（14B〜32B）

| モデル | 量子化 | 生成速度（TPS） |
|--------|--------|-----------------|
| Qwen3 14B | Q4 | 10〜15 TPS（Mac Mini M4/32GB推定） |
| Qwen3 32B | Q4_K_M | 15〜22 TPS（48GB系） |
| Gemma 3 27B | Q4 | 24 TPS（M3 Ultra 確認） |

**出典**: [Best Local LLMs for Mac in 2026（InsiderLLM）](https://insiderllm.com/guides/best-local-llms-mac-2026/)

### 1.2 96GB制約とモデル収容可能サイズ

**96GB Unified Memory での収容可能モデル（概算）**

| モデルサイズ | 量子化 | VRAM使用量 | 96GBへの収容 |
|------------|--------|-----------|------------|
| 70B | Q8 | 約75GB | ギリギリ可（残り21GB） |
| 70B | Q4_K_M | 約40GB | 余裕あり |
| 32B | Q4_K_M | 約20GB | 余裕あり（複数インスタンス可） |
| 14B | Q4_K_M | 約9GB | 複数ロード可 |

**重要**: M3 Ultra 96GBでは70B Q8モデルをロードすると、OSやプロセスに必要なメモリが圧迫される。実用上は70B Q4_K_M（約40GB）を推奨。

### 1.3 並列推論の実態

Ollamaは `OLLAMA_NUM_PARALLEL` 環境変数でデフォルト4の並列リクエストを処理できる。

- **スループット効果**: 並列度4で逐次処理比3〜4倍の総スループット
- **レイテンシへの影響**: 個別リクエストのレイテンシは20〜40%増加
- **メモリ制約**: 96GB上で70B Q4_K_M（約40GB）を1インスタンスロードした場合、残り56GBで14Bモデルを複数起動可能

**出典**: [How Ollama Handles Parallel Requests（Glukhov）](https://www.glukhov.org/post/2025/05/how-ollama-handles-parallel-requests/)

---

## 2. 1日500冊達成の試算

### 2.1 必要スループットの計算

**前提条件**:
- 1冊 = 7万文字（日本語）
- 日本語7万文字 ≈ 35,000〜70,000トークン（日本語は英語より1文字あたりのトークン数が多い）
  - より正確には日本語1文字 ≈ 1〜2トークン（BPEトークナイザー依存）
  - 保守的見積もり: 7万文字 ≈ 10万トークン（プロンプト + 生成を含む総コスト）
  - 楽観的見積もり: 7万文字 ≈ 5万トークン（生成部分のみ）

**1日500冊の総生成トークン数**:
- 悲観的シナリオ: 500冊 × 10万トークン = **5,000万トークン/日**
- 楽観的シナリオ: 500冊 × 5万トークン = **2,500万トークン/日**

**必要TPS（1台）**:
- 悲観的: 50,000,000 ÷ 86,400秒 = **578 TPS** 継続必要
- 楽観的: 25,000,000 ÷ 86,400秒 = **289 TPS** 継続必要

### 2.2 モデル別達成可能スループット試算

| モデル | 単一TPS | 並列4倍 | 1日生成トークン数 | 1日冊数換算 |
|--------|---------|---------|-----------------|------------|
| 70B Q4_K_M | 8〜12 TPS | 30〜48 TPS | 260〜415万 | **52〜83冊** |
| 32B Q4_K_M | 15〜22 TPS | 60〜88 TPS | 518〜760万 | **104〜152冊** |
| 14B Q4_K_M | 35〜50 TPS | 140〜200 TPS | 1,210〜1,728万 | **242〜346冊** |
| 8B Q4_K_M | 60〜80 TPS | 240〜320 TPS | 2,073〜2,765万 | **415〜553冊** |

※ 1冊あたり5万トークン（楽観値）で換算。並列係数3倍で計算。

### 2.3 500冊達成の現実的シナリオ

**シナリオA（8B Qwen3 × 96GB）**:
- 96GBに8Bモデル（Q4_K_M ≈ 5GB）を最大8〜10インスタンス並走
- 理論スループット: 50〜80 TPS × 8インスタンス = **400〜640 TPS**
- 品質: 7万文字の書籍としては粗い（章立て・構成の乱れが多い）
- **技術的には達成可能だが品質は低い**

**シナリオB（14B Qwen3 × 96GB × 4並列）**:
- 96GBに14B Q4_K_M（9GB）× 4〜5インスタンス
- 理論スループット: 40〜60 TPS × 4 = **160〜240 TPS**
- 1日生成量: 約1,382〜2,074万トークン = **276〜415冊**（5万T/冊換算）
- **現実的上限は約300〜400冊**

**シナリオC（32B Qwen3 × 96GB × 2並列）**:
- 96GBに32B Q4_K_M（20GB）× 2インスタンス
- 理論スループット: 15〜22 TPS × 2 = **30〜44 TPS**
- 1日: 約259〜380万トークン = **52〜76冊**
- 品質は高いが速度は大幅に妥協

**結論**: 「500冊/日」は技術的には8Bクラスでのみ理論値として近づけるが、**品質・実用性を考えると250〜400冊が現実的な上限**。

---

## 3. KDP自動化の実態

### 3.1 Amazon KDP APIの存在確認

**公式API: 存在しない**

Amazon KDPは一般開発者向けの公式バルクアップロードAPIを提供していない。KDPコミュニティでのAPI提供要望は長年却下され続けている。

**出典**: [KDP distribution Developer's API（KDP Community）](https://kdpcommunity.com/s/question/0D5f400000FHT6ZCAX/kdp-distribution-developers-api?language=en_US)

### 3.2 現実の自動化ツール

利用可能な自動化手段は以下のサードパーティツールのみ：

| ツール | 方式 | 特徴 |
|--------|------|------|
| KDP Uploader（Chrome拡張） | ブラウザ自動化 | Excelからメタデータ一括入力 |
| Flying Upload | デスクトップアプリ | デザイン自動アップロード |
| Kindle Prime | デスクトップアプリ | 並列アップロードシステム |
| Amazon-KDP-Automater（GitHub） | Seleniumスクリプト | オープンソース自動化 |

これらはすべて **Selenium/Playwright系のブラウザ自動化**であり、公式APIではない。

**出典**:
- [Amazon KDP Upload Automation（Flying Upload）](https://flyingupload.com/amazon-kdp-upload-automation/)
- [GitHub: Amazon-KDP-Automater](https://github.com/BrahimAkar/Amazon-KDP-Automater)

### 3.3 最大のボトルネック：1日3冊制限

**Amazon KDP 2024年9月実施ポリシー: 1日最大3冊まで**

これは検討中のシステムにとって最大の制約である。

- 1アカウント = 1日3冊まで
- 4冊目のアップロードボタンはグレーアウト（物理的に不可能）
- 毎日上限に達し続けるとアカウントが「不正使用フラグ」

**計算**: 500冊 ÷ 3冊/日 = **167アカウント必要**

### 3.4 複数アカウント運用のリスク

**Amazon KDPの規約**: 複数アカウント保有は規約違反（1人1アカウント原則）

2025年実施の強化措置：
- **本人確認（KYC）の導入**: パスポート・運転免許証による身元確認を義務化
- **自動リスクスコアリング**: 発行パターン・アカウントの振る舞いを常時監視
- **終身BAN**: 規約違反でアカウント停止後の再登録は永久禁止

**出典**:
- [Amazon KDP Account Suspension（Kindlepreneur）](https://kindlepreneur.com/amazon-kdp-account-suspension/)
- [Amazon Now Requires Author Identity Verification（eReadersForum）](https://www.ereadersforum.com/threads/amazon-now-requires-author-identity-verification-on-kindle-direct-publishing.9693/)

### 3.5 AI生成コンテンツの開示義務

2023〜2025年のKDP AIポリシー改定要点：

- AI生成コンテンツの開示は**必須**（アップロード時のフォームで選択）
- 開示はAmazon内部目的のみ（読者には非表示）
- 未開示が発覚した場合: 警告 → 書籍削除 → アカウント永久停止
- 低品質・無編集のAI生成物は品質基準で拒否

**ロイヤリティの変化（2025年6月）**: $9.99以下の本のロイヤリティが60%→50%に削減（スパム対策）

**出典**: [KDP AI Rules 2025（aiboxtools.com）](https://www.aiboxtools.com/amazon-kdp-ai-rules/)

---

## 4. 実際の大量出版事例

### 4.1 成功事例

**個人事例（日本）**:
- 40代ライター: AIで3日間で電子書籍を制作、1ヶ月で1,200DL・印税約6万円
- 従来5ヶ月かかっていた出版プロセスが「企画1日・執筆1日・編集半日・デザイン1時間」に短縮

**海外（Blackhat系コミュニティ）**:
- 「1日$800をKDP + AIで稼ぐ」という主張（BlackHatWorld）
- ただし詳細な検証は困難であり、誇張の可能性が高い

**出典**:
- [生成AIで電子書籍出版する方法（fukugyo-freelance-ai.jp）](https://www.fukugyo-freelance-ai.jp/ai-kindle-publishing/)
- [How I Make $800 Each Day with Amazon KDP Using AI（BlackHatWorld）](https://www.blackhatworld.com/seo/how-i-make-800-each-day-with-amazon-kdp-using-ai-to-write-books.1672354/)

### 4.2 失敗事例・業界全体の動向

**失敗パターン**:
- 無編集のAI出力をそのままアップロード → 品質審査で拒否
- 毎日3冊アップロードを継続 → アカウントフラグ → 突然の停止
- AI生成開示を忘れる → Amazonのボットが検出 → 永久BAN

**業界全体**:
- AI生成スパム本が市場を汚染することへの出版界全体の懸念が高まっている
- 著名出版業界誌「The New Publishing Standard」は「AIスパム洪水は誇張されている部分もあるが実害は出ている」と報告
- 2026年までにAIがセルフパブリッシングを完全破壊するという懸念論もある

**出典**:
- [AI The Book "Flood": Separating Hype from Reality（The New Publishing Standard）](https://thenewpublishingstandard.com/2025/10/04/ai-generated-books-publishing-industry-impact/)
- [Black Pill Article: AI will Totally Destroy Self-Publishing by 2026（KBoards）](https://www.kboards.com/threads/black-pill-article-for-the-week-ai-will-totally-destroy-self-publishing-by-2026-and-corporate-publishing-before-2030.337768/)

---

## 5. 最適技術スタック案

### 5.1 LLMモデル選定（日本語書籍生成）

**推奨モデル（優先順位順）**:

| モデル | 日本語品質 | 速度 | 96GB適合 | 推奨理由 |
|--------|-----------|------|---------|---------|
| Qwen3-14B Q4_K_M | 高 | 35〜50 TPS | 10インスタンス可 | CJK強化・高速・品質バランス最良 |
| Qwen2.5-72B Q4_K_M | 最高 | 8〜12 TPS | 2インスタンス | 品質最高だが遅い |
| Qwen3-32B Q4_K_M | 高 | 15〜22 TPS | 4インスタンス | バランス良 |
| Rakuten AI 2.0 (MoE 8x7B) | 高 | 不明 | 確認要 | 日本語特化MoE |

**最速構成**: Qwen3-14B Q4_K_M × 8並列 ≈ 280〜400 TPS実質スループット

**出典**:
- [Ultimate Guide: Best Open Source LLM for Japanese in 2026（siliconflow.com）](https://www.siliconflow.com/articles/en/best-open-source-LLM-for-Japanese)
- [Rakuten AI 2.0 Press Release（Rakuten Group）](https://global.rakuten.com/corp/news/press/2025/0212_02.html)

### 5.2 EPUB自動生成パイプライン

```
LLM生成テキスト
    ↓
[テキスト後処理] Python（文字数確認・章立て整形）
    ↓
[EPUB生成] ebooklib（Python） または pandoc
    ↓
[KDP変換] Calibre（ebook-convert CLI）
    ↓
[メタデータ設定] Python（タイトル・著者・カテゴリCSV）
    ↓
[アップロード] KDP Uploaderツール または Playwright自動化
```

**必要ライブラリ**:
- `ebooklib` (PyPI): EPUB2/EPUB3生成
- `calibre` (CLI): epub→mobi/KPF変換
- `pandoc`: Markdown→EPUBパイプライン
- `playwright` (Python): KDPブラウザ自動化

**出典**:
- [EbookLib PyPI](https://pypi.org/project/EbookLib/)
- [Calibre ebook-convert documentation](https://manual.calibre-ebook.com/conversion.html)

### 5.3 Claude Code + ローカルLLM 連携

Claude Code（オーケストレーション） + Ollamaローカルモデル（生成ワーカー）の連携は以下のプロキシ構成で実現可能：

```
Claude Code (ANTHROPIC_BASE_URL → localhost:8080)
    ↓
LiteLLM Proxy (モデル名マッピング)
    ↓
Ollama (localhost:11434)
    ↓
Qwen3-14B / Qwen2.5-72B
```

**設定例**:
```yaml
# litellm_config.yaml
model_list:
  - model_name: claude-sonnet-4-6
    litellm_params:
      model: ollama/qwen3:14b
      api_base: http://localhost:11434
```

**出典**:
- [LiteLLM: Use Claude Code with Non-Anthropic Models](https://docs.litellm.ai/docs/tutorials/claude_non_anthropic_models)
- [Using Local LLM Models with Claude Code (Medium/CodeX)](https://medium.com/codex/using-local-llm-models-with-claude-code-a-step-by-step-guide-with-ccproxy-tools-b3551a139d81)

### 5.4 システムアーキテクチャ（推奨構成）

```
┌─────────────────────────────────────────────┐
│           Mac Studio 96GB                    │
│                                              │
│  ┌─────────────┐   ┌──────────────────────┐  │
│  │ Orchestrator │   │  Ollama サーバー     │  │
│  │ (Claude Code │   │  Qwen3-14B × 6      │  │
│  │  + Python)  │──→│  OLLAMA_NUM_PARALLEL=6│  │
│  └─────────────┘   └──────────────────────┘  │
│         │                    │                │
│         ↓                    ↓                │
│  ┌─────────────┐   ┌──────────────────────┐  │
│  │ KDP自動化   │   │  EPUB生成パイプライン │  │
│  │ (Playwright)│   │  ebooklib + Calibre  │  │
│  └─────────────┘   └──────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 6. 総合判定

### 6.1 実現可能性スコア

| 評価軸 | スコア（1-10） | 詳細 |
|--------|--------------|------|
| 技術的実現可能性（LLM速度） | 6/10 | 8Bモデルで300冊級は可能、品質課題あり |
| KDPプラットフォーム制約 | 1/10 | 1日3冊制限が根本的に500冊を阻む |
| 経済的実現可能性 | 3/10 | KDP制限突破のため167アカウント必要 → 規約違反必至 |
| 法的・倫理的リスク | 2/10 | KYC導入・スパム検出強化でBANリスク極めて高い |
| **総合スコア** | **2/10** | **実現不可能（KDP側の制約が致命的）** |

### 6.2 主要ボトルネック（優先順位順）

**1位（致命的）: Amazon KDP の1日3冊制限**
- 500冊 ÷ 3冊 = 167アカウントが必要
- 複数アカウントは規約違反（終身BAN対象）
- 2025年からKYC（身元確認）が導入済みで回避が困難

**2位（重大）: LLMのスループット不足**
- 70Bモデルでは1台では100冊/日が限界
- 8B〜14Bモデルの並列でなら技術的には300〜500冊に届くが…
- そもそもKDP制限がボトルネックのため意味を成さない

**3位（重大）: 品質・収益性の問題**
- $9.99以下の本は2025年6月からロイヤリティが50%に削減
- 7万文字のコンテンツを自動生成すると編集なしでは品質基準を満たさない可能性が高い
- 1冊100〜200円相当の収益では500冊/日でも5〜10万円/日、コスト回収を考えると利益率は低い

### 6.3 推奨アクション

**現実的な代替戦略（実現可能）**:

1. **スケールを下げる**: 1日3冊（上限いっぱい）× 高品質化 → 月90冊の高品質AI支援本
2. **他プラットフォームの活用**: Note（日本）、Gumroad、自社ECサイトなら出版数制限なし
3. **Amazon以外の電子書籍流通**: Rakuten Kobo、楽天Books DTP、Apple Books → 制限が異なる
4. **コンテンツの差別化**: 完全自動生成より「AIアシスト + 人間編集」で品質を高め単価を上げる
5. **法人アカウントの活用**: 出版社として登録すれば上限が異なる可能性の調査が必要（未確認）

**技術スタックとして構築する価値のある部分**:
- LLM書籍生成パイプライン（1日3冊の高品質化に特化）
- EPUB自動生成・Calibre連携
- Claude Code + Ollama連携によるコンテンツ品質管理

---

## 参考URL一覧

### ハードウェア・LLM性能
- [GPU Benchmarks on LLM Inference（GitHub: XiongjieDai）](https://github.com/XiongjieDai/GPU-Benchmarks-on-LLM-Inference)
- [70B LLaMA 2 on Mac Studio M2 Ultra（Medium: Michael O'Brien）](https://obrienlabs.medium.com/running-the-70b-llama-2-llm-locally-on-metal-via-llama-cpp-on-mac-studio-m2-ultra-32b3179e9cbe)
- [Gemma 3 Performance: Mac Studio M3 Ultra（Medium: Rif Kiamil）](https://medium.com/google-cloud/gemma-3-performance-tokens-per-second-in-lm-studio-vs-ollama-mac-studio-m3-ultra-7e1af75438e4)
- [Apple's M3 Ultra Mac Studio Misses the Mark for LLM Inference（Medium: Billy Newport）](https://medium.com/@billynewport/apples-m3-ultra-mac-studio-misses-the-mark-for-llm-inference-f57f1f10a56f)
- [Local LLM Hardware Performance Benchmarking（Olares Blog）](https://blog.olares.com/local-ai-hardware-performance-benchmarking/)
- [Local LLM Hardware 2025: Prices and Performance（lilys.ai）](https://lilys.ai/en/notes/ai-semiconductor-20251027/local-llm-hardware-2025-prices-performance)
- [MacStories: Mac Studio AI Benchmarks with Qwen3-235B](https://www.macstories.net/notes/notes-on-early-mac-studio-ai-benchmarks-with-qwen3-235b-a22b-and-qwen2-5-vl-72b/)
- [Mac Studio Clusters Run Trillion-Parameter Models for $40K（Awesome Agents）](https://awesomeagents.ai/news/mac-studio-clusters-local-llm-inference-rdma/)
- [NVIDIA DGX Spark vs Mac Studio vs RTX-4080 Ollama Comparison（Medium）](https://medium.com/@rosgluk/nvidia-dgx-spark-vs-mac-studio-vs-rtx-4080-ollama-performance-comparison-08d975d9c132)
- [llama.cpp Performance on Apple Silicon M-series（GitHub Discussion）](https://github.com/ggml-org/llama.cpp/discussions/4167)

### Ollama・並列推論
- [How Ollama Handles Parallel Requests（Glukhov.org）](https://www.glukhov.org/post/2025/05/how-ollama-handles-parallel-requests/)
- [Configure Ollama Concurrent Requests（Markaicode）](https://markaicode.com/ollama-concurrent-requests-parallel-inference/)
- [Ollama FAQ（公式）](https://docs.ollama.com/faq)

### 日本語LLMモデル
- [Ultimate Guide: Best Open Source LLM for Japanese 2026（SiliconFlow）](https://www.siliconflow.com/articles/en/best-open-source-LLM-for-Japanese)
- [Qwen2.5: A Party of Foundation Models（Qwen公式ブログ）](https://qwenlm.github.io/blog/qwen2.5/)
- [Rakuten AI 2.0 Press Release（Rakuten Group）](https://global.rakuten.com/corp/news/press/2025/0212_02.html)
- [Japanese LLM Evaluation（Swallow LLM）](https://swallow-llm.github.io/evaluation/index.en.html)

### Amazon KDP ポリシー・自動化
- [KDP AI Rules 2025（aiboxtools.com）](https://www.aiboxtools.com/amazon-kdp-ai-rules/)
- [The Truth About AI-Generated Content on Amazon KDP in 2025（bookautoai.com）](https://blog.bookautoai.com/ai-generated-content-amazon-kdp-2025/)
- [Amazon KDP limits books per day（Jane Friedman）](https://janefriedman.com/amazon-kdp-limits-how-many-books-can-be-uploaded-per-day/)
- [Amazon KDP's 3 Books a Day Limit（Medium: Beast Designer）](https://medium.com/@beastdesigner/amazon-kdps-recent-update-exploring-the-new-3-books-a-day-limit-for-uploads-e65cbb095c1b)
- [Amazon KDP Account Suspension（Kindlepreneur）](https://kindlepreneur.com/amazon-kdp-account-suspension/)
- [Amazon Now Requires Author Identity Verification（eReadersForum）](https://www.ereadersforum.com/threads/amazon-now-requires-author-identity-verification-on-kindle-direct-publishing.9693/)
- [Amazon KDP Upload Automation（Flying Upload）](https://flyingupload.com/amazon-kdp-upload-automation/)
- [KDP Uploader Chrome Extension（Chrome Web Store）](https://chromewebstore.google.com/detail/kdp-uploader/hfnmagmigjbbmjlanikaihcokkmidlfb)
- [GitHub: Amazon-KDP-Automater](https://github.com/BrahimAkar/Amazon-KDP-Automater)
- [KDP distribution Developer's API（KDP Community）](https://kdpcommunity.com/s/question/0D5f400000FHT6ZCAX/kdp-distribution-developers-api?language=en_US)
- [Amazon publishing limits to prevent AI books（CoinGeek）](https://coingeek.com/amazon-publishing-limits-seek-to-prevent-rise-of-ai-generated-books/)

### 技術スタック（EPUB・LiteLLM）
- [EbookLib（PyPI）](https://pypi.org/project/EbookLib/)
- [Calibre ebook-convert documentation](https://manual.calibre-ebook.com/conversion.html)
- [LiteLLM: Use Claude Code with Non-Anthropic Models](https://docs.litellm.ai/docs/tutorials/claude_non_anthropic_models)
- [Using Local LLM Models with Claude Code（Medium/CodeX）](https://medium.com/codex/using-local-llm-models-with-claude-code-a-step-by-step-guide-with-ccproxy-tools-b3551a139d81)
- [GitHub: claude-code-ollama-proxy](https://github.com/mattlqx/claude-code-ollama-proxy)

### 大量出版事例・業界動向
- [生成AIで電子書籍出版する方法（福業フリーランスAI）](https://www.fukugyo-freelance-ai.jp/ai-kindle-publishing/)
- [AI Kindle publishing 2025 日本語（Kindle出版 完全ガイド）](https://note.com/nagoya_blog/n/n48eb37b1148c)
- [The AI Book "Flood": Separating Hype from Reality（The New Publishing Standard）](https://thenewpublishingstandard.com/2025/10/04/ai-generated-books-publishing-industry-impact/)
- [AI will Totally Destroy Self-Publishing by 2026（KBoards）](https://www.kboards.com/threads/black-pill-article-for-the-week-ai-will-totally-destroy-self-publishing-by-2026-and-corporate-publishing-before-2030.337768/)

---

*レポート生成: 2026-03-17 | 調査期間: 同日 | モデル: Claude Sonnet 4.6*
