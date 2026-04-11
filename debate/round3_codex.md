---
round: 3
perspective: Codex（Opusへの反論・改善提案）
topic: 問題#5 スタブ/プレースホルダーが障害時にどうなるか
---

# Round 3 — Codex: Opusへの反論

## grounding.ts スタブへの反論

### 反論点1: サイレント劣化は意図された設計である可能性
`retrieveSnippets` が `[]` を返すと `groundedPrompt: prompt`（元のプロンプトそのまま）が返る設計は、**RAGなし時のフォールバック**として機能している。スニペット0件でも `groundPrompt` は正常にプロンプトを返すため、Claudeの動作は壊れない。

問題は「Claudeがツールを呼んでいる事実」ではなく「ツールの説明文（description）にRAGが機能していない可能性を示す記載がない」点に絞られる。

### 反論点2: `warning` フィールドの追加は過剰
`GroundingResult` インターフェースに `warning?: string` を追加すると、型の変更がダウンストリームの型チェックに波及する。より低コストな修正は、ツール定義の `description` フィールドを修正すること:

```typescript
// server.ts 行155-170 (TOOLS配列)
{
  name: 'rag_ground',
  description: 'Retrieve relevant skill/context snippets and prepend them to a prompt. ' +
    'Returns the original prompt unchanged when no vector database is configured (stub mode).',
  // ...
}
```

これはゼロ行の型変更でClaudeに正確な期待値を伝えられる。

### 合意できる点
- `snippetsUsed: 0` が返った時点でClaudeが「RAGは機能していない」と認識できる設計は不十分（両者一致）
- 何らかの形で呼び出し元への通知が必要（両者一致）

---

## executeSafeStep プレースホルダーへの反論

### 反論点: `success: false` への変更は連鎖的な破壊を引き起こす
Opusが提案する `result.success: false` への変更は、`runSupervisor` の呼び出し元が `success` フラグで後続処理を分岐している場合に、プレースホルダーフェーズのすべての呼び出しを「失敗」扱いにする。これはテスト環境や開発環境で混乱を引き起こす。

**より適切な対応**: `success: true` は維持しつつ `summary` に明示的なプレースホルダー注記を含め、`data.isPlaceholder: true` フラグを追加する:

```typescript
return {
  ...state,
  step: 'finalize',
  result: {
    success: true,
    summary: '[PLACEHOLDER] ' + `Executed plan for: ${state.input.substring(0, 100)}`,
    refId: memResult.referenceId,
  },
};
```

あるいは `SupervisorResult` に `isPlaceholder?: boolean` を追加して呼び出し元が識別できるようにする。

### 反論点2: コメントの改善だけでも一定の効果がある
現行の `// Execute (placeholder - actual execution depends on the MCP)` は開発者向けには存在するが、**ログやメトリクスには記録されない**。`recordEvent` への追加で監視可能性を担保できる:

```typescript
// graph.ts:293付近
recordEvent('supervisor_step', state.runId, 'ok', {
  metadata: { step: 'execute_safe', mode: 'placeholder', warning: 'no_dispatch_performed' },
});
```

これはインターフェース変更なしに実装可能。

---

## server.ts try/catch への反論

### 反論点なし — Opusの提案に完全同意
`setRequestHandler` コールバックに try/catch がゼロという事実は明確なバグ。MCP SDKが例外を握ってプロトコルエラーとして返す動作はSDK実装に依存しており、将来の SDK バージョンアップで変わりうる。

Opusの修正案（コールバック全体を try/catch で包む）を採用すべき。エラーメッセージに `tool: name` を含めるのも診断性向上で正しい。
