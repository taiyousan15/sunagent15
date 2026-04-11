# Round 13: データ整合性 — Opus Analysis

## Finding 13-1
**Issue**: `JsonlStore.compact()` が自動的に呼ばれる仕組みが存在しない。コメント「with periodic compaction」は実態と乖離している。長期運用でJSONLファイルが無制限に肥大化し、起動時の全行読み込みが低速化する。
**Evidence**:
- `src/proxy-mcp/memory/stores/jsonl.ts:211` に `compact()` メソッドは存在する
- `src/proxy-mcp/memory/types.ts:69-77` の `MemoryStore` インターフェースに `compact()` が定義されていない → 自動呼び出しの仕掛けがない
- `src/proxy-mcp/memory/service.ts` および `store.ts` で `compact()` を呼び出す箇所は存在しない
- `delete` および `clear` 操作も append-only で追記するため、削除後もファイルサイズは増加し続ける (`jsonl.ts:143-146`, `jsonl.ts:157-168`)
**Category**: data-integrity / resource-leak
**Severity**: high

### 修正案
`JsonlStore` に自動コンパクション閾値を実装する:
```typescript
// jsonl.ts に追加
private readonly COMPACT_THRESHOLD = 1000; // ops件数
private operationCount = 0;

private async maybeCompact(): Promise<void> {
  this.operationCount++;
  if (this.operationCount >= this.COMPACT_THRESHOLD) {
    await this.compact();
    this.operationCount = 0;
  }
}

// add() / delete() の末尾で呼び出す
async add(entry: MemoryEntry): Promise<void> {
  await this.ensureInitialized();
  this.entries.set(entry.id, entry);
  this.appendLog({ op: 'add', entry, timestamp: Date.now() });
  await this.maybeCompact();
}
```
また `MemoryStore` インターフェースに `compact?(): Promise<void>` を追加してサービス層から明示的に呼べるようにする。

---

## Finding 13-2
**Issue**: `.claude/hooks/data/` の4つのJSONLファイルが無制限に蓄積されている。`unified-metrics.jsonl` は4000行、`cost-tracking.jsonl` は1930行、`compact-metrics.jsonl` は578行。ローテーション・削除ポリシーが存在しない。
**Evidence**:
- `wc -l` 実測値: unified-metrics.jsonl=4000行, cost-tracking.jsonl=1930行, compact-metrics.jsonl=578行, agent-usage-log.jsonl=197行
- これらのファイルを書き込む hook スクリプトにファイルサイズ上限ロジックが見当たらない（Makefile, scripts/ を確認）
**Category**: resource-leak
**Severity**: medium

### 修正案
各hook書き込み関数にローテーション処理を追加:
```javascript
// hooks/write-metrics.js（例）
const MAX_LINES = 5000;
function appendWithRotation(filePath, line) {
  fs.appendFileSync(filePath, line + '\n');
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
  if (lines.length > MAX_LINES) {
    // 古い半分を削除
    fs.writeFileSync(filePath, lines.slice(lines.length - MAX_LINES / 2).join('\n') + '\n');
  }
}
```
または logrotate 設定ファイルを `scripts/logrotate.conf` に追加してOSレベルで管理する。

---

## Finding 13-3
**Issue**: `supervisor/graph.ts` の `loadState()` がメモリ検索の `contentPreview` を State の JSON として `JSON.parse()` しているが、`contentPreview` は1200文字で切り詰められる。大きな SupervisorState（plan が複数ステップ、input が長い等）は切り詰められた状態で復元され、パースエラーまたは不完全なState復元が発生する。
**Evidence**:
- `src/proxy-mcp/supervisor/graph.ts:97` — `const content = entry.contentPreview || entry.summary;`
- `src/proxy-mcp/memory/service.ts:260-264` — `contentPreview` は `contentPreviewChars: 1200` で切り詰め
- `src/proxy-mcp/supervisor/graph.ts:103` — `return JSON.parse(content) as SupervisorState;`
- 切り詰められたJSONのparseは `SyntaxError` になるか、末尾フィールドが欠落した不完全なオブジェクトを返す (JSON.parseはエラー、不完全JSONではない)
- `loadState()` の catch は `console.error` のみで `null` を返す → 復元失敗がサイレントに起きる
**Category**: data-integrity
**Severity**: critical

### 修正案
`loadState()` で `getContent(id)` を使い完全なコンテンツを取得する:
```typescript
async function loadState(runId: string): Promise<SupervisorState | null> {
  try {
    const stateKey = `${STATE_KEY_PREFIX}${runId}`;
    const result = await memorySearch(stateKey, {
      tags: ['supervisor', 'state', runId],
      includeContent: false,  // IDのみ取得
      limit: 1,
    });

    const data = result.data as { found?: boolean; results?: Array<{ id?: string }> } | undefined;
    if (!result.success || !data?.found || !data.results?.length) {
      return null;
    }

    const entryId = data.results[0].id;
    if (!entryId) return null;

    // 完全コンテンツをIDで取得（切り詰めなし）
    const fullContent = await memoryGetContent(entryId);
    if (!fullContent) return null;

    return JSON.parse(fullContent) as SupervisorState;
  } catch (error) {
    console.error('[supervisor] Failed to load state:', error);
    return null;
  }
}
```
`memoryGetContent` は `service.ts:124` の `getContent(id)` をツール層に公開する必要がある。
