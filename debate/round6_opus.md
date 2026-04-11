---
round: 6
perspective: Opus（スタブ処理方針の提言）
topic: 問題#5 スタブの処理方針（削除/実装/文書化の3択）
---

# Round 6 — Opus: スタブ処理方針

## 確認した事実

### スタブ1: grounding.ts の retrieveSnippets（行59-65）
- 常に `[]` を返す
- `groundPrompt` はスニペット0件を正常系として処理し `snippetsUsed: 0` を返す
- 呼び出し元: `server.ts:359` の `rag_ground` ツールハンドラ（実際のMCPツールとして公開済み）
- 依存方向: `server.ts` → `grounding.ts` → `retrieveSnippets`（スタブ）

### スタブ2: graph.ts の executeSafeStep（行293-294）
- `// Execute (placeholder - actual execution depends on the MCP)` コメントのみ
- 実際のMCPディスパッチなし。文字列生成 + メモリ記録 + `success: true` 返却
- 呼び出し元: `skill.ts:455` の `skillRunAsync` → `runSupervisor` 経由
- `runSupervisorSync`（行376-403）は別に存在し、こちらは危険パターン検出のみ（executeSafeStep を経由しない）

---

## 3択の分析

### 選択肢A: 削除

**grounding.ts の場合**
- `rag_ground` ツールを TOOLS 配列から削除し、`server.ts` から import を削除
- ツールの公開を止める
- メリット: サイレント劣化がなくなる、Claudeが存在しないツールを呼ばない
- デメリット: RAG機能への投資が完全に失われる。将来実装する際に公開周りを再構築が必要

**executeSafeStep の場合**
- `runSupervisor` の `execute_safe` ケースで即座に `step: 'error'` に遷移させる
- メリット: プレースホルダーが `success: true` を詐称しなくなる
- デメリット: supervisor機能全体が使用不能になる

**Opusの評価**: grounding.ts は削除候補。executeSafeStep は削除より文書化が適切（supervisorの骨格自体は機能している）。

---

### 選択肢B: 実装

**grounding.ts の場合**
- Qdrant等のベクターDBクライアントを実装
- `RAG_VECTOR_DB_URL` 環境変数でエンドポイントを設定
- 依存パッケージ追加: `@qdrant/js-client-rest` 等

**工数見積もり**: 中〜大（ベクターDB構築 + インデックス作成 + クライアント実装）。本プロジェクトで `.claude/skills/` ディレクトリをベクトル化する処理は `src/rag/indexer.ts` に存在するが内容未確認。

**executeSafeStep の場合**
- `router.ts` の `routeToMcp` 結果に従って実際のMCPを呼び出す実装
- 工数見積もり: 大（MCPプロトコルのクライアント実装が必要）

**Opusの評価**: 実装は正しい方向だが、工数が大きく短期では非現実的。

---

### 選択肢C: 文書化（現状維持 + 透明性向上）

**grounding.ts の場合**
- `rag_ground` ツールの description に「stub mode: ベクターDB未設定時は元プロンプトをそのまま返す」を明記
- `retrieveSnippets` に `@stub` JSDoc タグと設定方法を追記
- `GroundingResult` に `stubMode: boolean` フィールド追加

**executeSafeStep の場合**
- `[PLACEHOLDER]` プレフィックスを summary に追加
- `recordEvent` に `mode: 'placeholder'` を記録
- `SupervisorResult` に `isPlaceholder?: boolean` フィールド追加
- `runSupervisor` の JSDoc に「executeSafeStep は未実装のプレースホルダー」を明記

**Opusの評価**: 最小コスト・最大透明性。推奨。

---

## Opus推奨方針

| スタブ | 推奨 | 理由 |
|--------|------|------|
| `grounding.ts:retrieveSnippets` | **C(文書化) + 将来的にB(実装)** | `src/rag/indexer.ts` が存在しRAGへの投資があるため、削除より維持＆透明化が適切 |
| `graph.ts:executeSafeStep` | **C(文書化)** | supervisorの骨格（ingest→route→plan→approval→finalize）は機能しており、execute_safeだけを切り離すのは過剰 |

### 具体的なアクション（優先順）

1. `grounding.ts:63` コメントを更新: `// Stub: returns []. Set RAG_VECTOR_DB_URL env var to enable vector search.`
2. `server.ts:155` description を更新: `'...Returns the original prompt unchanged when no vector database is configured.'`
3. `graph.ts:293` コメント + `recordEvent` 追加（Round 3合意事項）
4. `src/rag/indexer.ts` の実装状況を確認し、実装可能かどうかの評価をIssueとして起票
5. RAGが完全実装されるまで `rag_ground` ツールの description に `[BETA/STUB]` マーカーを付ける
