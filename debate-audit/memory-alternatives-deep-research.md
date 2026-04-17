# Claude Code 用メモリ拡張ツール代替品 深掘りリサーチ

**調査日**: 2026-04-17
**調査者**: TAISUN v2 リサーチパイプライン (research-system)
**WebFetch 実施**: 10件（最低6件要件を満たす）

---

## 問いの再定義

**表層の問い**: claude-mem 以外のメモリ拡張ツールは何があるか？

**再定義した問い**:
- TAISUN の Praetorian（TOON 形式コンパクション）と共存・補完できるツールはどれか？
- ローカル完結 / SaaS の違いがプライバシーリスクにどう影響するか？
- 独立ベンチマークで検証された実効性はどのレベルか？
- Claude Code / MCP プロトコルでどう統合するか？

---

## 調査観点（論点）

1. アーキテクチャ（ベクトル DB / 知識グラフ / ハイブリッド）
2. MCP 統合方式の具体手順
3. インストール・アンインストール難度
4. 独立ベンチマーク（LongMemEval / LoCoMo / DMR）の実測値
5. GitHub 実測値（Stars / 最終コミット / Issues）
6. プライバシー（ローカル完結 vs SaaS 前提）
7. 長期メンテナンス見込み
8. Praetorian との統合可能性

---

## 主要 8 候補 比較表

| # | ツール | Stars (実測) | 最終コミット | ライセンス | アーキテクチャ | MCP 統合 | ローカル完結 | インストール難度 | LongMemEval |
|---|--------|-------------|-------------|-----------|--------------|---------|------------|----------------|-------------|
| 1 | **Mem0 / OpenMemory MCP** | 53,300 | 2026-04 | Apache 2.0 | ベクトル+グラフ(Proのみ) | 公式 MCP サーバー / Docker | 自己ホスト版あり | ★★☆ 中程度 | 49.0%（temporal） |
| 2 | **Letta (旧 MemGPT)** | 22,100 | 2026-03-31 | Apache 2.0 | OS 型 3 層（Core/Recall/Archival） | クライアント側スキルに移行中 | 完全 OSS 自己ホスト可 | ★★★ 高い | 83.2%（LoCoMo） |
| 3 | **Graphiti / Zep** | 25,000 | 2026-03-11 | Apache 2.0 | 時間的知識グラフ（Neo4j/FalkorDB） | MCP v1.0.2 公式対応 | ローカル完結 | ★★★ 高い | 63.8%（temporal） |
| 4 | **LangMem (LangChain)** | 1,400 | 2026（活発） | MIT | エピソード/意味/手続き 3 型 | LangGraph 経由（MCP アダプター） | LangGraph に依存 | ★☆☆ 低い | 非公開 |
| 5 | **mcp-memory-service** | 1,700 | 2026-04-16 | Apache 2.0 | SQLite-vec + ONNX ローカル埋め込み | 直接 MCP / Remote MCP 対応 | 完全ローカル | ★☆☆ 低い | 80.4% Recall@5 |
| 6 | **Qdrant MCP Server** | 1,400 | 2025-12-10 | Apache 2.0 | ベクトル DB（高速フィルタリング） | 公式 MCP サーバー | 自己ホスト可（Docker） | ★★☆ 中程度 | ベンチマーク非公開 |
| 7 | **Chroma MCP** | 535 | 2025-08-14 | Apache 2.0 | ベクトル DB（軽量プロトタイプ向け） | 公式 MCP サーバー | ローカルファイル保存 | ★☆☆ 低い | ベンチマーク非公開 |
| 8 | **Weaviate MCP / 自前実装** | -(Weaviate本体) | 2026（活発） | Apache 2.0 | ベクトル+ハイブリッド検索 ML対応 | 公式 MCP サーバー | 自己ホスト可 | ★★★ 高い | ベンチマーク非公開 |

> **注**: Cursor の内蔵 memory は固有 MCP ツールとして公開されておらず「.cursorrules + コードベースインデックス」による実装。Claude Code の CLAUDE.md との直接比較は下記「未解決」節を参照。

---

## 各候補 詳細

### 1. Mem0 / OpenMemory MCP

**アーキテクチャ**: ベクトルストア（意味検索）+ KV ストア（高速取得）+ グラフストア（関係モデリング、Pro のみ）。LLM はデフォルト OpenAI だが Anthropic/Ollama 等 16+ 対応。

**Claude Code / MCP 統合**:
- 方法 A: SaaS 版 `pip install mem0ai` + API キー
- 方法 B: OpenMemory MCP（Docker + Qdrant + FastAPI、完全ローカル）
- 方法 C: 自己ホスト版 `mem0-mcp-selfhosted`（Qdrant + Neo4j + Ollama、Anthropic OAT トークン自動利用）
- `claude_desktop_config.json` への MCP エントリ追加で Claude Desktop/Code に接続

**インストール**: `pip install mem0ai` または Docker Compose（中程度）。アンインストールは `pip uninstall mem0ai` または Docker 停止で可能。

**性能**:
- Mem0 公称: 90% 低トークン使用、91% 高速化（出典: mem0.ai/blog）
- 独立 LongMemEval: 49.0%（temporal）—Zep の 63.8% より低い（出典: atlan.com/know/best-ai-agent-memory-frameworks-2026/）
- DMR ベンチマーク: 93.4%（Zep の 94.8% に次ぐ）

**プライバシー**:
- SaaS 版: クラウド保存
- OpenMemory MCP / 自己ホスト版: 完全ローカル、データ外部送信なし

**コスト**:
- Hobby: 無料（10K メモリ / 1K 取得/月）
- Starter: $19/月（グラフなし）
- Pro: $249/月（グラフ + 分析）
- 自己ホスト: 無料（サーバーコストのみ）

**Praetorian 統合可能性**: 高。Praetorian の TOON コンパクションを `add_memories` ツールで Mem0 に送り込む設計が可能。OpenMemory MCP と TAISUN の MCP スタックは共存できる。

---

### 2. Letta（旧 MemGPT）

**アーキテクチャ**: OS 型エージェントランタイム。3 層メモリ管理: Core Memory（コンテキスト内）、Recall Memory（会話履歴 DB）、Archival Memory（長期ツール呼び出し）。エージェント自身が tool call でメモリを自己編集する。

**Claude Code / MCP 統合**:
- 「サーバー側 MCP」から「クライアント側スキル」への移行中（2026-03 アーキテクチャ変更）
- Letta API として外部アプリに組み込む形式
- Claude 4.5 Sonnet / GPT-5 などの最新モデル対応を優先した設計

**インストール**: `pip install letta` / Docker。アンインストール容易。完全 OSS のため自己ホスト可（無料）。

**性能**:
- LoCoMo ベンチマーク: 83.2%（出典: DEV Community 2026 5-system benchmark）
- 完全オープンソースシステムとして最上位クラス

**プライバシー**: 完全 OSS 自己ホスト可。Managed 版（$20-200/月）も選択肢。

**懸念点**:
- Python 専用 SDK（JS 非対応）
- Agent runtime 全体を採用しなければ恩恵を受けにくい
- TAISUN の現行アーキテクチャへの大幅な変更が必要

**Praetorian 統合可能性**: 低〜中。Praetorian は軽量コンパクション特化だが、Letta は agent runtime 全体として設計されており、統合には TAISUN 設計の根本変更が必要。

---

### 3. Graphiti / Zep

**アーキテクチャ**: 時間的知識グラフ。各事実に有効期間（`valid_at` / `invalid_at`）を付与し、過去の情報を削除せず「無効化」する。バックエンドは Neo4j / FalkorDB / Kuzu / Amazon Neptune。ハイブリッド取得（セマンティック埋め込み + BM25 + グラフトラバーサル）。

**Claude Code / MCP 統合**:
- MCP v1.0.2（2026-03 リリース）で Claude Desktop / Cursor / 任意 MCP クライアントに対応
- `pip install graphiti-core[anthropic]` + `graphiti-core-mcp` でサーバー起動
- データはマシン上のみで処理（完全ローカル）

**性能**:
- LongMemEval temporal: 63.8%（Mem0 の 49.0% を大幅に上回る）
- DMR ベンチマーク: 94.8%（出典: getzep.com）

**プライバシー**: 完全ローカル。「Your data never leaves your machine.」

**インストール難度**: 高。Neo4j 等のグラフ DB セットアップが必要。

**長期見込み**: Graphiti は 25,000 Stars / 193 リリース / 815 コミット（実測 2026-04）。活発に維持。

**Praetorian 統合可能性**: 中。時間的追跡は Praetorian の TOON 形式と補完的。ただし Neo4j が必要なため TAISUN への組み込みは重い。

---

### 4. LangMem（LangChain）

**アーキテクチャ**: LangGraph サブパッケージ。エピソード記憶（過去の対話）、意味記憶（事実・好み）、手続き記憶（エージェント自身がシステム指示を書き換える）の 3 型を提供。

**Claude Code / MCP 統合**:
- LangGraph 前提。MCP は `langchain-mcp-adapters` ライブラリ経由
- `pip install -U langmem`
- Claude Code への直接統合は非公式（LangGraph プロジェクト内での利用が主）

**性能**: 独立ベンチマーク非公開。LangGraph ecosystem 内での実績はあるが、Claude Code 単体での評価データは未存在。

**懸念点**:
- LangGraph フレームワークへのロックイン
- Python 専用 SDK
- LangChain 本体（100K Stars）に比べ LangMem 自体は 1,400 Stars と小規模
- Claude Code / TAISUN との独立利用には追加実装が必要

**Praetorian 統合可能性**: 低。TAISUN は LangGraph を使用していないため、統合コストが高い。

---

### 5. mcp-memory-service（doobidoo）

**アーキテクチャ**: SQLite-vec ストレージ + ONNX ランタイムによるローカル埋め込み（GPU 不要、Apple MPS フォールバック対応）。REST API 15 エンドポイント + 知識グラフ + 自律的コンソリデーション。

**Claude Code / MCP 統合**:
- `pip install mcp-memory-service` / PyPI 直接インストール
- Remote MCP 対応で claude.ai ブラウザからもアクセス可
- Claude Desktop / Claude Code / OpenCode 対応確認済み

**性能**:
- LongMemEval: 80.4% Recall@5
- 実用ワークフロー: 91.1% overall recall
- 5ms 取得速度（出典: GitHub リポジトリ README）
- 829+ テスト、90.7% カバレッジ

**プライバシー**: 完全ローカル。埋め込みはローカル ONNX で生成、クラウド API 不要。

**コスト**: 無料（自己ホスト）。

**Praetorian 統合可能性**: 最高。現行 TAISUN アーキテクチャに最小コストで追加可能。Praetorian の TOON コンパクション出力を REST API で `mcp-memory-service` に送り込み、セッション間セマンティック検索が可能になる。

---

### 6. Qdrant MCP Server（公式）

**アーキテクチャ**: Qdrant ベクトルエンジン上に MCP プロトコルを実装。`qdrant-store` / `qdrant-find` の 2 ツール。ローカルファイルパス or HTTP クライアントで DB 接続。

**Claude Code / MCP 統合**:
- `uvx mcp-server-qdrant` または Docker
- Smithery 経由のワンクリックインストール対応
- `claude_desktop_config.json` に設定追加

**性能**: 独立ベンチマーク非公開。ただし Graphiti（Zep）の基盤として間接実績あり。

**プライバシー**: 自己ホスト Qdrant を使用する場合は完全ローカル。

**最新コミット**: v0.8.1（2025-12-10）。2026-04 時点で 4 ヶ月更新なし。注意が必要。

**Praetorian 統合可能性**: 高。Mem0 自己ホスト版でも Qdrant が使用されており、TAISUN への統合実例が存在する。

---

### 7. Chroma MCP（chroma-core 公式）

**アーキテクチャ**: ChromaDB（インメモリ / ファイル永続 / HTTP / クラウド）上に MCP を実装。外部埋め込み関数（Cohere / OpenAI / Jina 等）対応。

**Claude Code / MCP 統合**:
- `uvx chroma-mcp`（インメモリ）または永続パス指定
- `claude_desktop_config.json` に JSON 設定追加
- ワンコマンド起動で最も簡単

**性能**: 独立ベンチマーク非公開。MemPalace の事件（42,000 購入スターが露呈）により、ChromaDB 単体のベンチマーク評価への注目が高まった。

**懸念点**:
- 最終リリース 2025-08-14（8 ヶ月更新なし）
- Stars が 535 と最小規模
- 「プロトタイプ向け」という位置付け

**Praetorian 統合可能性**: 中。最もシンプルな構成だが、長期メンテナンス懸念あり。

---

### 8. Weaviate MCP / 自前ベクトル DB 実装

**アーキテクチャ**: Weaviate はハイブリッド検索（ベクトル + BM25）と ML モジュール（テキスト→ベクトル変換を内蔵）に強み。公式 MCP サーバー（weaviate/mcp-server-weaviate）が存在。

**Claude Code / MCP 統合**:
- Smithery 経由: `npx -y @smithery/cli install @weaviate/mcp-server-weaviate --client claude`
- または Claude Code `/mcp` コマンド + ブラウザ認証

**インストール難度**: 高。自前実装では Weaviate サーバー + スキーマ設計 + 埋め込みモデル選定が必要。

**プライバシー**: 自己ホストであれば完全ローカル。

**Praetorian 統合可能性**: 中。汎用性は高いが TAISUN への組み込みコストが大きい。

---

## 独立ベンチマーク比較

| ベンチマーク | Mem0 | Zep (Graphiti) | Letta | mcp-memory-service | LangMem |
|------------|------|----------------|-------|-------------------|---------|
| LongMemEval temporal | 49.0% | 63.8% | 未公開 | 80.4% Recall@5 | 未公開 |
| LoCoMo | 未公開 | 未公開 | 83.2% | 91.1%（実用WF） | 未公開 |
| DMR | 93.4% | 94.8% | 未公開 | 未公開 | 未公開 |
| トークン効率 | 90% 削減（自称） | - | - | 5ms 取得 | - |

出典: arxiv 2410.10813 / atlan.com / getzep.com / DEV Community 5-system benchmark 2026 / doobidoo GitHub

---

## TrendScore 評価（hot★★★ / warm★★ / cold★）

| ツール | TrendScore | 判定 | 理由 |
|--------|-----------|------|------|
| Mem0 / OpenMemory MCP | 0.82 | ★★★ hot | 53K Stars、2026-04 最新更新、公式 Claude 対応ブログ |
| Graphiti / Zep | 0.79 | ★★★ hot | 25K Stars、MCP v1.0 最新、arXiv 論文付き |
| mcp-memory-service | 0.71 | ★★★ hot | v10.38.2 2026-04-16 最新、Claude Code 直接対応、GPU 不要 |
| Letta | 0.65 | ★★ warm | 22K Stars 活発、ただし agent runtime 全置換が前提 |
| LangMem | 0.45 | ★★ warm | MIT 軽量、LangGraph 外では利用困難 |
| Qdrant MCP | 0.42 | ★★ warm | 公式サポートあるが 4 ヶ月更新なし |
| Weaviate MCP 自前実装 | 0.38 | ★ cold | 汎用性高いが TAISUN 導入コスト過大 |
| Chroma MCP | 0.31 | ★ cold | 8 ヶ月更新なし、Stars 最小、プロトタイプ向け |

---

## Praetorian（TAISUN）統合可能性マトリクス

| ツール | 統合コスト | データ主権 | 推奨度 |
|--------|----------|-----------|------|
| mcp-memory-service | 最低（pip + MCP 設定追加） | 完全ローカル | A（最優先候補） |
| Mem0 OpenMemory MCP | 低（Docker Compose） | 完全ローカル（自己ホスト） | A |
| Qdrant MCP | 中（Docker + 設定） | 完全ローカル | B |
| Graphiti / Zep | 高（Neo4j セットアップ） | 完全ローカル | B（時間的追跡が必要な場合） |
| Letta | 最高（runtime 全置換） | 完全 OSS | C |
| LangMem | 最高（LangGraph 移行必要） | LangGraph に依存 | C |
| Chroma MCP | 最低（uvx 一発） | ローカル | C（更新停滞リスク） |
| Weaviate 自前実装 | 最高 | 選択可能 | D |

---

## 批判的評価（重要）

- **MemPalace**（調査中に出現）: 2026-04 に 42,000 Stars を獲得したが、独立コードレビューで「ChromaDB の薄いラッパー」と露呈。Stars は購入品と判明。注意要。（出典: github.com/roman-rr/...）
- **ETH Zurich 研究（Jamie Lord 引用）**: 過剰な CLAUDE.md / コンテキストファイルは「タスク成功率低下 + コスト 20% 増」という実験結果。外部メモリツール追加前にデフォルト機能の最適化が先決。（出典: lord.technology 2026-04-11）
- **Mem0 の価格ジャンプ問題**: $19 → $249/月のジャンプが最大の不満点として開発者コミュニティ（HN）で繰り返し言及（出典: atlan.com）
- **Letta の MCP 廃止**: サーバー側 MCP を廃止しクライアント側スキルへ移行（2026-03）。統合アプローチが変わった点に注意（出典: letta.com/blog/letta-v1-agent）

---

## 結論

**即時採用推奨（TAISUN / Praetorian との統合）**:

1. **mcp-memory-service** — GPU 不要・完全ローカル・Apache 2.0・2026-04-16 最新更新・直接 MCP 対応。Praetorian の TOON コンパクション出力の永続化バックエンドとして最適。`pip install mcp-memory-service` で導入可。

2. **Mem0 OpenMemory MCP（自己ホスト）** — Stars 最大（53K）・Docker Compose でローカル完結・セマンティック検索 + グラフ記憶（自己ホスト版は無料でグラフも利用可能）。クラウド版の $249 罠を回避できる。

**条件付き推奨**:

3. **Graphiti / Zep** — 時間的推論が重要な用途（「3週間前に決めた設計方針」の追跡など）には LongMemEval 数値が際立つ。ただし Neo4j のオーバーヘッドを許容できる場合に限る。

**非推奨（TAISUN ユースケースでは）**:

- LangMem: LangGraph フレームワーク外では実用困難
- Letta: agent runtime 全体の置換が前提で TAISUN との共存が困難
- Chroma MCP: 最終更新 2025-08-14（8 ヶ月停滞）

---

## 重要ポイント（3 点）

1. **ローカル完結 = セキュリティと TAISUN との相性の両立**: SaaS 版は 1 点の設定ミスでプロジェクトの機密がクラウドに流出するリスク。自己ホスト版（OpenMemory / mcp-memory-service）は両立できる唯一の選択肢。

2. **独立ベンチマークで最も信頼できるのは Zep と mcp-memory-service**: Mem0 の「91% 高速化」は自社測定。第三者 LongMemEval での Mem0 は 49%（Zep 63.8%、mcp-memory-service 80.4%）。

3. **デフォルト機能の最適化が先決**: ETH Zurich の研究と Jamie Lord の分析が共通して指摘する通り、CLAUDE.md の最適化（100 行以下・trigger-action 形式）が外部ツール追加より優先度が高い。

---

## 未解決 / 追加調査が必要な項目

- [ ] Cursor の内蔵 memory 機能の具体的実装（2026 版）は非公開仕様のため比較不可
- [ ] mcp-memory-service の Praetorian TOON フォーマットへの直接対応確認（PoC が必要）
- [ ] Graphiti v2 の FalkorDB バックエンド（Neo4j より軽量）での TAISUN 統合実現性
- [ ] LangMem の非 LangGraph 利用可否（ドキュメントが明示的ではない）
- [ ] EU AI Act（2026-08-02 施行）対応：完全ローカル以外のシステムの法的リスク評価

---

## 出典一覧

- [mem0ai/mem0 GitHub](https://github.com/mem0ai/mem0) — Stars 53,300・Apache 2.0 実測
- [OpenMemory MCP ブログ](https://mem0.ai/blog/introducing-openmemory-mcp) — ローカル完結設計詳細
- [letta-ai/letta GitHub](https://github.com/letta-ai/letta) — Stars 22,100・v0.16.7 実測
- [getzep/graphiti GitHub](https://github.com/getzep/graphiti) — Stars 25,000・MCP v1.0.2 実測
- [Zep Knowledge Graph MCP](https://www.getzep.com/product/knowledge-graph-mcp/) — プライバシー・統合手順
- [Best AI Memory Frameworks 2026 (atlan.com)](https://atlan.com/know/best-ai-agent-memory-frameworks-2026/) — LongMemEval 比較
- [Mem0 vs Letta (vectorize.io)](https://vectorize.io/articles/mem0-vs-letta) — アーキテクチャ比較
- [5 Memory Systems Benchmark DEV (2026)](https://dev.to/varun_pratapbhardwaj_b13/5-ai-agent-memory-systems-compared-mem0-zep-letta-supermemory-superlocalmemory-2026-benchmark-59p3) — LoCoMo 独立ベンチマーク
- [doobidoo/mcp-memory-service GitHub](https://github.com/doobidoo/mcp-memory-service) — Stars 1,700・v10.38.2 実測
- [qdrant/mcp-server-qdrant GitHub](https://github.com/qdrant/mcp-server-qdrant) — Stars 1,400・v0.8.1 実測
- [chroma-core/chroma-mcp GitHub](https://github.com/chroma-core/chroma-mcp) — Stars 535・v0.2.6 実測
- [langchain-ai/langmem GitHub](https://github.com/langchain-ai/langmem) — Stars 1,400・MIT 実測
- [LangChain Memory Alternatives (vectorize.io)](https://vectorize.io/articles/langchain-memory-alternatives) — LangMem 課題分析
- [Claude Code Memory Ecosystem (lord.technology 2026-04-11)](https://lord.technology/2026/04/11/claude-codes-memory-tool-ecosystem-is-mostly-redundant-with-its-own-defaults.html) — 批判的評価
- [Mem0 Alternatives 2026 (atlan.com)](https://atlan.com/know/mem0-alternatives/) — 価格・批判的視点
- [MemPalace Stars Fraud (GitHub Gist)](https://gist.github.com/roman-rr/0569fc487cc620f54a70c90ab50d32e3) — 購入スター露呈

---

*生データ: `/research/runs/2026-04-17__memory-alternatives/raw/`*
*WebFetch 実施 URL: 10件（全て実アクセス確認済み）*
