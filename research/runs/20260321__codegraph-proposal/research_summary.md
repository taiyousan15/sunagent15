# TAISUN CodeGraph — リサーチ統合サマリー
> 調査日: 2026-03-21 | パイプライン: v2.4 | STEP 1-2 完了

## 最終結論: 自前実装不要 → 既存MITツール2つの併用が最適

### 採用ツール

| ツール | Stars | License | 役割 | Install |
|--------|-------|---------|------|---------|
| codebase-memory-mcp | 652 | MIT | コードインデックス+Cypher検索+ADR | `curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/scripts/setup.sh \| bash` |
| contextplus | 1,205 | MIT | グラフRAG+メモリ+セマンティック検索 | `bunx contextplus` or `npx -y contextplus` |

### 差別化（TAISUN独自の上乗せ）

1. **PostToolUseフック自動更新** — Write/Edit後にインデックス自動更新（未解決の空白地帯）
2. **スキル統合** — 700+スキルとの直接連携（query結果→planner/architect）
3. **メモリ統合** — contextplusのメモリグラフ × taisun_agentの階層的メモリ

### キーワード宇宙（STEP 1）

- core: Code Knowledge Graph, MCP Server, AST Parsing, Tree-sitter, Graph RAG
- rising: GitNexus代替MIT需要爆発、リアルタイム更新が未解決空白
- niche: 日本語市場で「コード知識グラフ MCP」競合ゼロ

### GitNexusアーキテクチャ分析（ソースコード確認済み）

```
コードファイル → Tree-sitter AST → KnowledgeGraph (Map) → LadybugDB (Cypher)
  → MCP 7ツール: query, cypher, context, impact, detect_changes, rename, list_repos
  → 検索: BM25 (FTS5) + セマンティック (@huggingface/transformers) + RRF (k=60)
```

### MCP代替ツール TOP 3

1. **contextplus** (1,205★) — 17 MCPツール、43言語、グラフRAG内蔵
2. **codebase-memory-mcp** (652★) — ゼロ依存バイナリ、64言語、28M LOC 3分索引
3. **CodeGraphContext** (453★) — KuzuDB/Neo4j、14言語（Python依存が重い）

### 技術選定（全てMIT/Apache）

| レイヤー | 採用 | 理由 |
|---------|------|------|
| AST解析 | codebase-memory-mcp内蔵 | 64言語、3段階品質 |
| 検索 | codebase-memory-mcp (Cypher) + contextplus (セマンティック) | 併用で最高品質 |
| 埋め込み | UniXcoder推奨 / all-MiniLM-L6-v2代替 | コード検索MRR 58.83% |
| グラフRAG | contextplus内蔵 | メモリグラフ+バージョン管理 |
| MCP | @modelcontextprotocol/sdk v1.27.1 | 公式SDK |
| 自動更新 | PostToolUseフック | chokidarより軽量・正確 |
| コミュニティ検出 | graphology-communities-louvain | Leidenは未実装だがLouvainで十分 |

### コスト

$0/月（全てOSS）

### リスク

| リスク | 確率 | 影響 | 代替 |
|-------|------|------|------|
| codebase-memory-mcp メンテ停止 | 低 | 高 | contextplusに集約 |
| contextplus Ollama依存 | 中 | 中 | HuggingFace transformersで代替 |
| KuzuDB npm終了 | 確定 | 低 | better-sqlite3で代替（採用見送り済み） |
| MCP SDK v2破壊的変更 | 中 | 中 | v1.x 6ヶ月サポート継続 |

### 日本語コミュニティ

- Zenn 2記事のみ（2026年2-3月）
- 認知の極初期段階 → 先行者優位あり
- Qiita/はてブはほぼ無反応

### 学術的裏付け

- arxiv 2601.08773: 「決定論的ASTグラフはLLM抽出より信頼性・コスト共に優位」
- Scientific Reports: Louvainはコードグラフ規模で実用十分

### 未解決項目

- [ ] codebase-memory-mcp の商用ライセンス確認
- [ ] contextplus Ollama不要モードの検証
- [ ] 2ツール併用時のMCPツール名衝突チェック
- [ ] PostToolUseフック非同期モードの遅延実測
- [ ] UniXcoder TS/Python二言語特化Recall@10実測
