---
round: 6
type: agreement
topic: 問題#5 スタブの処理方針（削除/実装/文書化の3択）
---

# Round 6 — 合意結果

## 最重要発見の共有

Codexが Round 6 中に発見した事実:
- `/src/rag/retriever.ts`（98行）が完全実装済み（キーワード+タグスコアリング）
- `/src/rag/indexer.ts`（142行）が `.claude/skills/` と CLAUDE.md を走査するインデクサーとして実装済み
- `grounding.ts:retrieveSnippets` は Qdrant 等の外部ベクターDBを必要とせず、`retriever.ts` の `retrieveTexts()` を呼ぶだけで機能する
- これはスタブではなく「接続漏れ」であり、修正工数は約5行

---

## grounding.ts:retrieveSnippets

### 判定: 完全合意（実装B — 即時）

**合意点（両者一致）**
- `retriever.ts` が実装済みである以上、文書化対処（Opus初期案）は過剰に保守的
- 5行の変更で機能するため、削除も不要
- 外部依存なし・ベクターDB不要

**採用する方針**
即時実装（B）。`retriever.ts` の `retrieveTexts` を接続する。

**具体的なアクション**
1. `src/rag/grounding.ts` を修正:
   ```typescript
   import { retrieveTexts } from './retriever';

   async function retrieveSnippets(
     query: string,
     topK: number
   ): Promise<Snippet[]> {
     const texts = retrieveTexts(query, { topK, minScore: 0.3 });
     return texts.map((content, i) => ({
       content,
       score: 1 - i * 0.1,
       source: 'local-index',
     }));
   }
   ```
2. `server.ts:155` の `rag_ground` description から「stub mode」の記載は不要になるため、description をそのまま維持（機能するツールとして）
3. `grounding.ts:33` の「Stub implementation」コメントを「Local index-based retrieval via retriever.ts」に更新
4. ユニットテスト追加: `groundPrompt` が `retrieveTexts` の結果を組み込んだ `groundedPrompt` を返すことを確認

**優先度: 最高（5行の変更、即座に`rag_ground`ツールが機能する）**

---

## graph.ts:executeSafeStep

### 判定: 完全合意（文書化C）

**合意点（両者一致）**
- 実際の呼び出し頻度が低い（`skill_run` 通常経路では `runSupervisorSync` が使われ `executeSafeStep` を経由しない）
- MCPクライアントの実装工数に対してROIが低い
- supervisorの骨格（ingest→route→plan→approval→finalize）は機能しており、`execute_safe` 1ステップだけの問題
- Round 3合意事項（`recordEvent` + `[PLACEHOLDER]` prefix + `isPlaceholder` フラグ）を実施

**具体的なアクション**（Round 3合意の再確認）
1. `graph.ts:293` に `recordEvent` 追加:
   ```typescript
   recordEvent('supervisor_step', state.runId, 'ok', {
     metadata: { step: 'execute_safe', mode: 'placeholder', warning: 'no_dispatch_performed' },
   });
   ```
2. `summary` を `'[PLACEHOLDER] Executed plan for: ...'` に変更
3. `SupervisorResult` 型に `isPlaceholder?: boolean` を追加
4. JSDoc に「executeSafeStep は未実装のプレースホルダー。実装時は router.ts 経由でターゲット MCP を呼び出すこと」を追記
5. GitHub Issue として「supervisor/graph.ts executeSafeStep の実装」を起票（実装の優先度は低、文書化で追跡）

---

## 全体総括

| スタブ | 最終方針 | 工数 | 優先度 |
|--------|---------|------|--------|
| `grounding.ts:retrieveSnippets` | 実装（B）— retriever.ts 接続 | ~5行 | 最高 |
| `graph.ts:executeSafeStep` | 文書化（C）— recordEvent + isPlaceholder | ~15行 | 中 |

**Opus初期診断の修正**: `grounding.ts` を「将来的に実装」として文書化対処としていたが、`retriever.ts` の発見により即時実装が正しい判断と確定。コードレビューにおいて関連ファイル（`retriever.ts`、`indexer.ts`）を先に確認すべきだった。
