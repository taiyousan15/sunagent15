---
round: 2
perspective: Codex（Opusへの反論・改善提案）
topic: 問題#6 server.ts God Object + 問題#7 CAPTCHA二重実装
---

# Round 2 — Codex: Opusへの反論

## 問題#6 反論: 分割コストとMCPプロトコルの制約

### 反論点1: MCPは「1サーバー = 1エントリポイント」が前提
`server.ts` はMCPプロトコル上のアダプター層であり、すべてのツールコールは必ず1つのswitch文を通る設計が正しい。Opusが提案する `handleMemory(name, args)` 委譲パターンでは、ハンドラ内でのエラーが `ToolResult` の型保証なしにバブルアップするリスクがある。現行のインラインは明示的なエラーハンドリングを各ケースで行えるという利点もある。

### 反論点2: 分割の粒度が細かすぎる
7つのハンドラファイルは過分割の可能性がある。`system.handler.ts` は実質1関数（`systemHealth()`）のラッパーであり、ファイルを作る意味が薄い。真の問題は「コードが読みにくい」ではなく「ハンドラをテストできない」点に絞られる。

### 合意できる点
- 分割自体は正当。ただし粒度はドメインではなく「テスト境界」で決めるべき
- `memory_add` 内のconstitutional check（行310-322）は確かに server.ts に置く理由がなく、`memoryAdd()` 内部またはミドルウェア層に移すべき

### 代替案: 最小変更で効果を出す
フルリファクタリングの前に以下が有効:

```typescript
// handlers/index.ts — 全ハンドラを1ファイルに集約（分割は後で）
export async function dispatch(name: string, args: unknown): Promise<ToolResult> {
  switch (name) {
    case 'memory_add': return handleMemoryAdd(args);
    // ...
    default: return { success: false, error: `Unknown tool: ${name}` };
  }
}
```

`server.ts` の `setRequestHandler` は `dispatch(name, args)` を1行で呼ぶだけにする。これだけで「server.ts はプロトコル層のみ」という境界が確立し、ハンドラのユニットテストが可能になる。ファイル分割は段階的に行える。

---

## 問題#7 反論: types.ts への再エクスポートは過剰

### 反論点: CDPとブラウザ層は独立性を保つべきケースもある
`cdp/types.ts` が `captcha.ts` の実装に依存するようになると、CDPモジュール単体での利用（Playwright非使用環境など）が難しくなる。現在の二重実装は「独立性確保」という意図がある可能性を考慮すべき。

ただし、同名定数が2ファイルに存在してパターンが乖離している現状は明確なバグリスクであり、このまま放置は不可。

### 代替案: 共有定数を第三の場所に置く

```
browser/
  captcha-patterns.ts   ← 定数と純粋関数のみ（副作用なし）
  captcha.ts            ← WebSkillResult を返すガード関数（captcha-patterns に依存）
  cdp/types.ts          ← CDPの型定義 + captcha-patterns から定数のみimport
```

これにより:
- `captcha-patterns.ts` は playwright-core に依存しない（CDPから安全にインポート可能）
- `captcha.ts` は `WebSkillResult` などブラウザ固有の型を持ち続けられる
- `cf-turnstile` と `please.*sign.*in` の不一致は1ファイル修正で解消
