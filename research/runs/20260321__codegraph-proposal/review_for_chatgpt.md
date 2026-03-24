# ChatGPTへの指示

以下の「TAISUN CodeGraph 導入提案レビュー」を読んで、**シニアソフトウェアアーキテクト＋プロダクトマネージャーの視点**で批評してください。

## レビュー観点（必ず全て回答すること）

1. **提案の妥当性** — 自前実装せず既存OSSツール2つの併用という判断は正しいか？見落としているリスクはないか？
2. **技術選定の穴** — codebase-memory-mcp + contextplus の組み合わせに問題はないか？他に検討すべきツールはあるか？
3. **コスト分析の甘さ** — 「$0/月」は本当か？隠れたコスト（運用負荷、学習コスト、トラブルシューティング時間等）はないか？
4. **メモリ・コンテキスト設計** — 既存メモリシステムとの共存設計は妥当か？コンテキスト99%削減は誇大表現ではないか？
5. **セキュリティ懸念** — Go製バイナリ（codebase-memory-mcp）をcurlでインストールすることのリスクは？
6. **スケーラビリティ** — taisun_agent（900+ファイル）規模で問題ないか？将来10倍になった場合は？
7. **採用しない場合の代替案** — もしこの提案を却下する場合、次善の策は何か？
8. **最も弱い主張TOP 3** — このレポートで最も根拠が弱い・楽観的すぎる主張を3つ指摘してください

## 出力フォーマット

```
## 総合評価: [A/B/C/D/F]

### 1. 提案の妥当性
[回答]

### 2. 技術選定の穴
[回答]

...（8項目全て）

### 総合コメント
[200文字以内の総括]

### 推奨アクション
- [具体的な次のステップを3つ]
```

---

# TAISUN CodeGraph 導入提案レビュー

## 背景

TAISUN Agent（v2.43.0）は、Claude Code上で動作するAIエージェントシステム。96エージェント、700+スキル、15+ MCPサーバーを統合した日本語マーケティング＋エージェント開発プラットフォーム。

現在の課題: Claude Codeがコードベース全体の構造（関数間の呼び出し関係、依存グラフ、変更影響範囲）を即座に理解できない。毎回Grep/Read/Globを繰り返す必要があり、コンテキストを大量消費する。

## 調査プロセス

リサーチパイプライン v2.4（5ステップ・QA Gate付き）をフル実行:
- STEP 1: キーワード展開 + GIS 31ソース収集（186件）
- STEP 2 Pass 1: 3エージェント並列（MCP発掘/API調査/アーキテクチャ）
- STEP 2 Pass 2: 7項目ギャップ補完（3エージェント並列）
- STEP 3: TrendScore計算 + アーキテクチャ設計 + 実装計画
- STEP 4: 12セクション完全レポート生成
- STEP 4.5: QA Gate（GPT-4o × 3レビュアー → 85.4/100 PASS）

加えて、GitNexus（18,400★）のソースコードを完全クローン・分析済み。

## 調査の核心発見

### 1. GitNexusのアーキテクチャ（ソースコード確認済み）

```
コードファイル → Tree-sitter AST → KnowledgeGraph (Map) → LadybugDB (Cypher)
→ MCP 7ツール: query, cypher, context, impact, detect_changes, rename, list_repos
→ 検索: BM25 (FTS5) + セマンティック (@huggingface/transformers) + RRF (k=60)
```

- PolyForm Noncommercial 1.0.0 ライセンス（商用利用不可）
- LadybugDB（独自グラフDB）に依存

### 2. MIT/Apache代替が20個以上存在

調査で発見したコード知識グラフMCPサーバーのうち、MITライセンスのものが17本。

### 3. 最有力候補2つ

| ツール | Stars | License | 言語 | 特徴 |
|--------|-------|---------|------|------|
| codebase-memory-mcp | 652 | MIT | Go | ゼロ依存バイナリ、64言語、28M LOC 3分索引、99.2%トークン削減、Cypher対応、14 MCPツール |
| contextplus | 1,205 | MIT | TypeScript | 43言語、17 MCPツール、GraphRAG内蔵、メモリグラフ、ファイル変更追跡(700ms debounce) |

### 4. 学術的裏付け

- arxiv 2601.08773: 「決定論的ASTグラフはLLM抽出より信頼性・コスト共に優位」
- Scientific Reports: Louvainはコードグラフ規模で実用十分（Leiden不要）

## 提案内容

### 結論: 自前実装せず、既存MITツール2つの併用 + TAISUN独自差別化3つ

**採用ツール:**
1. codebase-memory-mcp — コードインデックス + Cypher検索 + ADR管理
2. contextplus — グラフRAG + メモリ + セマンティック検索

**TAISUN独自の差別化:**
1. PostToolUseフック自動更新 — Write/Edit後にインデックスを自動再構築（未解決の空白地帯）
2. スキル統合 — query結果をplanner/architect/code-reviewerエージェントに直接連携
3. メモリ統合 — contextplusのメモリグラフ × taisun_agentの階層的メモリシステム

### アーキテクチャ

```
開発者 (Claude Code)
  ↓ MCP Protocol
taisun-proxy MCP（既存統合エントリポイント）
  ├→ codebase-memory-mcp: コード構造索引 + Cypherクエリ
  └→ contextplus: セマンティック検索 + メモリグラフ

PostToolUse Hook (Write/Edit)
  ↓ CodeGraph Bridge
  ├→ codebase-memory-mcp: 差分再索引
  └→ contextplus: メモリグラフ更新
```

### コスト

| 項目 | コスト |
|------|--------|
| codebase-memory-mcp | $0（MIT、ローカル実行） |
| contextplus | $0（MIT、ローカル実行） |
| Ollama（contextplus用） | $0（ローカルLLM） |
| 合計 | **$0/月** |

### 実装工数

| フェーズ | 工数 | 内容 |
|---------|------|------|
| Phase 1 MVP | 2-4h | インストール + フック実装 |
| Phase 2 スキル統合 | 6-8h | Bridge + CLAUDE.md自動生成 + メモリ統合 |
| Phase 3 最適化 | 13h | UniXcoder切替 + Louvain + クロスリポジトリ |

### メモリ・コンテキストへの影響

**既存メモリシステムは変更なし。追加レイヤーとして乗るだけ。**

- auto memory (memory/MEMORY.md) → そのまま
- SESSION_HANDOFF.md → そのまま
- .workflow_state.json → そのまま
- Praetorian compact → そのまま

追加されるもの:
- codebase-memory → コード構造の索引DB（SQLiteファイル、数十MB）
- contextplus memory graph → コード理解のセッション間共有

コンテキスト節約: ファイル全文Read（数千トークン/ファイル）→ 必要シンボルだけ取得（数十トークン）

### リスク

| リスク | 確率 | 影響 | 代替案 |
|-------|------|------|-------|
| codebase-memory-mcp メンテ停止 | 低 | 高 | contextplus単体 or narsil-mcp移行 |
| contextplus Ollama依存 | 中 | 中 | @huggingface/transformersで代替 |
| MCP SDK v2 破壊的変更 | 中 | 中 | v1.x 6ヶ月サポート継続 |
| MCP追加でツール定義トークン増 | 中 | 低 | defer_loadingで遅延ロード |
| Go製バイナリのセキュリティ | 低 | 中 | ソースビルドで検証 |

### QA Gate結果

| レビュアー | スコア | 判定 |
|-----------|--------|------|
| 網羅性 | 87.5/100 | PASS |
| 信頼性 | 83.5/100 | PASS |
| 実用性 | 85.2/100 | PASS |
| **総合** | **85.4/100** | **PASS** |

### 自前実装案との比較

| 観点 | 自前実装 | 既存ツール併用 |
|------|---------|-------------|
| 実装工数 | 16-24h | 2-4h |
| メンテナンス | 自己責任 | コミュニティ維持 |
| パフォーマンス | 未知 | ベンチマーク実証済み |
| 言語対応 | TS/Python のみ | 64言語 |
| リスク | 高 | 低 |

## 未解決項目

- [ ] codebase-memory-mcp の大規模本番での安定性実測
- [ ] contextplus Ollama不要モードの実機検証
- [ ] 2ツール併用時のMCPツール名衝突チェック
- [ ] PostToolUseフック非同期モードの遅延実測
- [ ] Go製バイナリのセキュリティ監査
