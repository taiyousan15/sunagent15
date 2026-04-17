# TAISUN Memory 最終判定 (2026-04-17)

## 3 リサーチ統合結果

### A. claude-mem: 🚨 **採用不可（セキュリティ・安定性問題）**
- **4 件の Critical 脆弱性**（Issue #1251）
  - ポート 37777 が無認証バインド
  - GET /api/settings で API キー平文漏洩
  - 観測データ（コード）が Anthropic/Gemini API に送信
- **未解決バグ**: macOS RAM 35GB 消費 / Linux segfault / Windows FTS5 全件NoResults
- **10x savings は独立検証ゼロ**
- **アンインストール非公式**（個別削除要求 #659 Closed as not planned）

### B. TAISUN 現状メモリ: 部分的に限界
- Praetorian は SQLite ではなく**単語バケット索引**（全文マッチのみ）
- 245 `.toon` ファイル、意味検索なし
- **8 ブラインドスポット**（判断理由・失敗根因・因果関係・優先度履歴・ツール選択理由・サイレント失敗・解釈ズレ）
- 短期記憶 5/5、長期記憶 3/5

### C. 代替ツール: **3 つ有力**
| ツール | Stars | 独立ベンチ | 推奨度 |
|--------|------:|----------|-------|
| **mcp-memory-service** | 1,700 | Recall@5 80.4% | ⭐⭐⭐⭐⭐ |
| **Mem0 OpenMemory MCP (self-host)** | 53,300 | 91% low-token (自称) | ⭐⭐⭐⭐ |
| **Graphiti/Zep** | 25,000 | LongMemEval 63.8% | ⭐⭐⭐ |

**重要**: ETH Zurich 研究 (2026-04-11) - 過剰な外部メモリは**タスク成功率を下げ、コスト +20%**。Claude Code 本体の CLAUDE.md 最適化が先決。

## 結論

### ❌ claude-mem の採用を明確に却下
安全性・安定性・検証性すべてで TAISUN の要件を満たさない。Issue #1251 の脆弱性は致命的。

### ✅ TAISUN はメモリ強化を行うべき
B の 8 ブラインドスポットは実害あり。ただし**外部依存を増やさない方法**を優先。

## 推奨ロードマップ（優先順）

### Priority 1: In-house Semantic Search (2-3日)
**Praetorian に意味検索層を追加**
- `sentence-transformers` or `transformers.js` ローカル埋め込み
- 既存 `.toon` + index.json は保持、embedding index を並列追加
- 完全可逆、外部依存ゼロ、Workflow Fidelity Contract と整合
- **効果予測**: 意味検索精度 2→5、長期記憶 3→4

### Priority 2: 判断文脈の記録 (1-2日)
**Workflow state に "reasoning" フィールドを追加**
- ツール選択時、スキル起動時に「なぜ」を記録
- mistakes.md の Pattern 追加時に「認知バイアス / 時間圧力 / 誤解」タグ付与
- **効果予測**: 監査証跡 2→4、失敗予防 3→4.5

### Priority 3: mcp-memory-service を opt-in 評価 (1日)
**インストールせずに別マシンで試験**
- `pip install mcp-memory-service` を検証用 VM/Docker で
- Praetorian との機能オーバーラップを実測
- 20% 以上の独自価値があれば本採用検討

### Priority 4: ❌ Mem0 / Letta / Graphiti 採用見送り
- Mem0: SaaS 依存リスク、OpenMemory MCP は選択肢として保留
- Letta: agent runtime 全置換必要、破壊的変更
- Graphiti: Neo4j 依存、TAISUN の配布性悪化

## 実行可能な次アクション

1. **何もしない（当面保留）** — 現状の TAISUN メモリでも 80% のユースケースは充足
2. **Priority 1 を実装** — Praetorian semantic search 拡張（2-3日）
3. **Priority 1 + 2 を実装** — 意味検索 + 判断文脈記録（3-5日、効果最大）
4. **外部ツール評価を先に** — Priority 3 を 1 日で実施、その後判断

## 決定的な事実

- **TAISUN は claude-mem を必要としない**（セキュリティ問題で採用不可）
- **メモリ強化は Priority 1（semantic search）で達成可能**
- **ETH Zurich 研究により「外部メモリ追加すれば良い」という単純論は否定**
- **TAISUN の Praetorian + Contract の組合せは claude-mem にない独自資産**

## 回答: 「claude-mem は taisun_agent に必要か？」

**NO**. 以下 3 つの理由で決定的。

1. **Critical 脆弱性 4 件**（Issue #1251）がある限り、他人配布するプロダクトに組み込めない
2. **10x savings は独立検証ゼロ**（自称値のみ）、設計上も Layer 1 vs Layer 3 比較で TAISUN 比較ではない
3. **TAISUN の真の弱点は semantic search と判断文脈記録**であり、claude-mem を入れてもこれは解決しない

**代わりに**: Priority 1（Praetorian semantic search 自前実装）で要件充足、TAISUN の独自性維持、外部依存ゼロ、完全可逆。
