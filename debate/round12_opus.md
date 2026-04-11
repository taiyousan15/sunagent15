# Round 12: 保守性 — Opus Analysis

## 概要
server.ts 分割後のファイル構成と、全10問題修正後の保守コストを実測に基づいて評価する。

---

## Finding 12-1
**Issue**: server.ts (564行) が TOOLS 定義(281行) + switch-case ディスパッチ(260行) の2責務を1ファイルで抱えている。ファイル規約は "800行以下" に収まっているが、14ツールのスキーマと14ハンドラーが混在しており、ツール追加のたびにファイル全体を読む必要がある。
**Evidence**:
- `src/proxy-mcp/server.ts:48-281` TOOLS 配列に全ツールスキーマを静的定義
- `src/proxy-mcp/server.ts:294-537` switch-case で全ハンドラー分岐
- 現状564行で800行制限の70%を占拠。ツール追加のたびに消費が増加
**Category**: maintainability
**Severity**: medium

### 修正案
TOOLS 定義を `src/proxy-mcp/server/tool-registry.ts` に分離し、ハンドラー分岐を `src/proxy-mcp/server/dispatcher.ts` に移す。server.ts は Server初期化とトランスポート接続のみ担当（< 80行）。
```typescript
// tool-registry.ts
export const TOOLS: Tool[] = [...]; // 全スキーマ定義

// dispatcher.ts
export async function dispatch(name: string, args: unknown): Promise<ToolResult> {
  switch (name) { ... }
}

// server.ts (80行以内)
import { TOOLS } from './server/tool-registry';
import { dispatch } from './server/dispatcher';
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const result = await dispatch(req.params.name, req.params.arguments);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: !result.success };
});
```

---

## Finding 12-2
**Issue**: `src/proxy-mcp/tools/` ディレクトリに `enhanced-descriptions.ts` (418行) が存在するが、server.ts から一切 import されておらず、どこからも参照されているか不明。デッドコードの可能性がある。
**Evidence**:
- server.ts の import 一覧に `enhanced-descriptions` が含まれない
- grep でも `from './tools/enhanced-descriptions'` のパターンが見当たらない
**Category**: maintainability
**Severity**: low

### 修正案
`grep -r "enhanced-descriptions"` で参照元を確認。参照なしなら削除または `_archive/` に移動。参照ありなら server.ts に明示的 import を追加してテスト対象に含める。

---

## Finding 12-3
**Issue**: テストファイルの保守コスト問題。修正済み10問題を対象とするテストは `tests/regression/` の4ファイルに加え、unit/integration テストが散在しており、どのテストがどの修正に対応するか追跡不可能。
**Evidence**:
- `tests/regression/` 4ファイルがプレースホルダーのまま (Round 1 Finding 1 で指摘済み)
- 修正対象10問題に対応する regression テストのマッピングドキュメントが存在しない
**Category**: maintainability / test
**Severity**: high

### 修正案
`docs/regression-map.md` を作成し、各修正とテストファイルの対応表を維持する。また各 regression テストファイルの冒頭に `@issue` JSDoc タグで紐付けを明示:
```typescript
/**
 * @issue command-injection-vulnerability
 * @fix src/proxy-mcp/supervisor/github.ts:73-74 (spawnSync instead of execSync)
 */
```
