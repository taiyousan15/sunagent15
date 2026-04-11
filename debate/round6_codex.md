---
round: 6
perspective: Codex（Opusへの反論・改善提案）
topic: 問題#5 スタブの処理方針（削除/実装/文書化の3択）
---

# Round 6 — Codex: Opusへの反論

## 最重要発見: grounding.ts はスタブではなく「接続漏れ」

Opusは `grounding.ts` を「スタブ」として扱い「文書化で対処」と提言したが、これは根本的に誤った診断である。

### 事実: retriever.ts は完全実装済み

`/src/rag/retriever.ts` には以下が実装されている:
- `retrieve(query, options)` — キーワード+タグベースのスコアリング（行63-81）
- `retrieveTexts(query, options)` — ドキュメント本文を文字列配列で返す（行86-97）
- `getIndex()` に依存 — `indexer.ts` が `.claude/skills/` と CLAUDE.md を走査（実装済み）

`grounding.ts:59-65` の `retrieveSnippets` は Qdrant 等の外部ベクターDBが不要。ローカルインデックスを使う `retrieveTexts` を呼ぶだけで機能する。

### 結論: grounding.ts の正しい処理方針は「実装（B）」— 工数は5行

```typescript
// src/rag/grounding.ts:59-65 修正
import { retrieveTexts } from './retriever';

async function retrieveSnippets(
  query: string,
  topK: number
): Promise<Snippet[]> {
  // retriever.ts (Phase 5実装済み) を使用
  const texts = retrieveTexts(query, { topK, minScore: 0.3 });
  return texts.map((content, i) => ({
    content,
    score: 1 - i * 0.1, // 順位ベースの仮スコア
    source: 'local-index',
  }));
}
```

これは5行の変更であり、外部依存なし・ベクターDB不要・即座に機能する。「文書化で対処」は過剰に保守的な判断。

---

## grounding.ts の「削除」への反論

Opusは削除を「候補」として挙げた。これは不適切。

- `src/rag/indexer.ts`（142行）と `src/rag/retriever.ts`（98行）はRAGシステムへの明確な投資であり、機能させる意図がある
- `rag_ground` ツールはMCPとして公開済みであり、削除はClaudeのインターフェースを壊す
- 接続漏れを修正するのに削除は過剰

---

## executeSafeStep プレースホルダーへの反論

Opusの「文書化で対処」に同意する部分もあるが、追加の観察:

### skill.ts の runSupervisorSync は executeSafeStep を経由しない
`skill.ts:215` の `skillRun` で `supervisor` スキルが呼ばれると `runSupervisorSync`（行376-403）が実行される。これは危険パターン検出のみで、`runSupervisor`（graph.ts のステートマシン全体）は `skillRunAsync`（行455）経由でのみ呼ばれる。

つまり:
- 通常の `skill_run` ツール経由では `executeSafeStep` は呼ばれない
- `skillRunAsync` は async であり、MCP通信では async 実行に制約がある場合がある
- `executeSafeStep` の実際の呼び出し頻度は低い可能性がある

この事実は「executeSafeStep の実装優先度は低い」という根拠になり、文書化対処の妥当性を支持する。

---

## 3択の再評価（Codex版）

| スタブ | Codex推奨 | 理由 |
|--------|---------|------|
| `grounding.ts:retrieveSnippets` | **即時実装（B）** | `retriever.ts` が実装済み。5行の接続で完結。スタブではなく接続漏れ。 |
| `graph.ts:executeSafeStep` | **文書化（C）** | 実際の呼び出し頻度が低く、実装工数（MCPクライアント）に対してROIが低い。骨格は正常。 |

---

## Opusへの追加質問

`src/rag/indexer.ts` の存在を確認したか？ Opusは「`src/rag/indexer.ts` の実装状況を確認し」と書いているが、確認前に「実装は工数が大きく短期では非現実的」と判断している。実際には `retriever.ts` まで実装済みであり、工数見積もりは根本的に誤っていた。
