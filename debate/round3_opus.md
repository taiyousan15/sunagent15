---
round: 3
perspective: Opus（エラー処理批評）
topic: 問題#5 スタブ/プレースホルダーが障害時にどうなるか
---

# Round 3 — Opus: エラー処理

## 確認した事実（推測禁止）

### grounding.ts のスタブ（行59-65）
```typescript
// src/rag/grounding.ts:59-65
async function retrieveSnippets(
  _query: string,
  topK: number
): Promise<Snippet[]> {
  // Stub: In production, this would query a vector database (e.g., Qdrant)
  return [];
}
```
- 常に空配列を返す
- 例外は発生しない
- `groundPrompt` はスニペット0件を正常系として処理（行36-43）
- エラー処理は一切ない

### executeSafeStep のプレースホルダー（graph.ts:293-294）
```typescript
// src/proxy-mcp/supervisor/graph.ts:293-294
// Execute (placeholder - actual execution depends on the MCP)
const summary = `Executed plan for: ${state.input.substring(0, 100)}`;
```
- 実際にはMCPへのディスパッチを行わず文字列生成のみ
- その後 `memoryAdd` でログを記録して `step: 'finalize'` に進む
- `result.success: true` を返す（行323）

### server.ts のエラーハンドリング不在
- `setRequestHandler` のコールバック（行289-548）に try/catch が**ゼロ**
- `groundPrompt`、`runCoVe`、`runValidationPipeline` 等がスローした場合、MCP SDKのエラーハンドラに委ねられる
- `memoryAdd` の失敗（行297）も uncaught

---

## 障害シナリオ別の実際の挙動

### シナリオ1: `rag_ground` ツール呼び出し時
```
Claude → rag_ground(prompt="...") 
→ server.ts:358 groundPrompt() 呼び出し
→ grounding.ts:34 retrieveSnippets() → [] 常時返却
→ GroundingResult { snippetsUsed: 0, groundedPrompt: prompt }
→ Claude は「コンテキストなしのプロンプト」を受け取る（エラーなし）
```
**問題**: Claudeは RAG が機能しているものと信じてツールを呼んでいるが、実際には何もグラウンドされていない。`snippetsUsed: 0` は返るが、ツール説明に「コンテキストなし」の警告はない。**サイレント劣化**。

### シナリオ2: `execute_safe` ステップ実行時
```
supervisor → executeSafeStep()
→ graph.ts:294 summary = "Executed plan for: ..."（文字列のみ）
→ memoryAdd でログ記録
→ result.success: true を返す
```
**問題**: ユーザーはタスクが「実行完了」と信じるが、実際にはMCPへの委譲は行われていない。`success: true` は虚偽報告。障害ではなくシステムが正常稼働中に発生する。

### シナリオ3: server.ts でハンドラが例外をスローした場合
```
case 'rag_ground': groundPrompt() が突然例外を投げた場合
→ try/catch なし
→ MCP SDK の setRequestHandler が catch → プロトコルレベルのエラーレスポンス
→ Claude Code 側でツール失敗として認識
```
実はこちらは MCP SDKが握っている（フェイルオープンではなくフェイルクローズ）。しかしエラー内容が `ToolResult` 型ではないため、Claude が解析できるフォーマットで返るかは SDK依存。

---

## 修正案

### grounding.ts
```typescript
export async function groundPrompt(
  prompt: string,
  options: GroundingOptions = {}
): Promise<GroundingResult> {
  const { topK = 3 } = options;
  const snippets = await retrieveSnippets(prompt, topK);

  // スタブ状態を呼び出し元に明示する
  const isStub = snippets.length === 0 && !process.env.RAG_VECTOR_DB_URL;

  return {
    groundedPrompt: snippets.length > 0
      ? `${contextBlock}\n\n---\n\n${prompt}`
      : prompt,
    snippetsUsed: snippets.length,
    contextLength: snippets.length > 0 ? contextBlock.length : 0,
    originalPrompt: prompt,
    warning: isStub ? 'RAG grounding is not configured (stub mode). No context was retrieved.' : undefined,
  };
}
```

GroundingResult インターフェースに `warning?: string` を追加。`server.ts` の `rag_ground` ハンドラは `warning` があれば `data.warning` に含めて返す。

### graph.ts executeSafeStep
```typescript
// Execute (placeholder - actual execution depends on the MCP)
// TODO: Replace with actual MCP dispatch when supervisor is fully implemented
const summary = `Executed plan for: ${state.input.substring(0, 100)}`;
return {
  ...state,
  step: 'finalize',
  result: {
    success: false,           // プレースホルダーは成功を主張しない
    summary,
    warning: 'Supervisor execution is not yet implemented. Plan was recorded but not dispatched.',
  },
};
```

### server.ts — ハンドラ全体への try/catch 追加
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let result: ToolResult;
    switch (name) {
      // ... 各ケース ...
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: !result.success };
  } catch (err) {
    const errResult: ToolResult = {
      success: false,
      error: `Internal error in tool '${name}': ${err instanceof Error ? err.message : String(err)}`,
    };
    return { content: [{ type: 'text', text: JSON.stringify(errResult, null, 2) }], isError: true };
  }
});
```
