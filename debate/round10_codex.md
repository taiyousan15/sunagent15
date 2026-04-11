# Round 10: エッジケース — Codex Challenge

---

## エッジケース 1: llm-judge.ts の enabled=true 強制抜け穴 — DISAGREE（問題の深刻度）

### 実ファイル確認結果

`src/proxy-mcp/validation/llm-judge.ts` の実際の処理順序:

```
行146: if (!enabled) → skip
行150: shouldSkip(text) → ANTHROPIC_API_KEY 未設定なら skip
行172: try { fetch(...) }
行200: catch → passed: true, skipped: true, skipReason: reason
```

**Opusの懸念「enabled=true 強制時にAPIキー未設定で401が返る」は事実だが、**
行200-206 の catch ブロックで 401 エラーを `passed: true, skipped: true` として
安全側に処理している。握りつぶしではなく、`skipReason: 'Anthropic API error: 401'`
がログに記録される。

**したがって実際の動作:**
1. ANTHROPIC_API_KEY 未設定 + enabled=false（デフォルト）→ skip（shouldSkipでガード）
2. ANTHROPIC_API_KEY 未設定 + enabled=true（明示的） → 401 → catch → skip、skipReason='Anthropic API error: 401'

どちらの場合も最終的に `passed: true, skipped: true` で安全側に倒れる。

**Opusの「抜け穴」という評価は過剰。問題なし。**
ただし、skipReason が `'Anthropic API error: 401'` になるのは診断性が低い。
`'ANTHROPIC_API_KEY not set'` という明確なメッセージの方が運用上有益。

**修正案（軽微）:**
```typescript
// shouldSkip の前に明示的なAPIキーチェックを追加
if (!process.env.ANTHROPIC_API_KEY) {
  return { passed: true, score: 1.0, reasoning: '', issues: [],
           skipped: true, skipReason: 'ANTHROPIC_API_KEY_not_set' };
}
```
これにより 401 を無駄に発生させずに済む（わずかなネットワーク節約）。

---

## エッジケース 2: intelligence/index.ts の undefined 伝播 — AGREE（問題なし）

### 実ファイル確認結果

`src/intelligence/index.ts:38`:
```typescript
console.log(`📡 有効ソース: RSS, HackerNews, GitHub Trending, World Bank, Reddit
${fullConfig.fredApiKey ? ', FRED' : ''}
${fullConfig.newsApiKey ? ', NewsAPI' : ''}
...`)
```

**行38で既にガードチェックが行われている。** `fredApiKey`、`newsApiKey`、
`apifyToken`、`xaiApiKey` の truthy チェックでスキップが判定される。

`aggregate(fullConfig)` の内部実装は未確認だが、ログ出力が示すように、
各ソースは設定の有無で動的に切り替わる設計になっている。

**Opusの「undefined 伝播が危険」という評価は根拠が薄い。**
ただし `aggregate()` 内部の各フェッチャーがガードしているかは未確認のため、
「推測で安全」とするのはリスクがある。

**合意: 要確認（amber）**
`src/intelligence/` 配下のフェッチャー実装を個別確認しないと断言できない。

---

## エッジケース 3: ModelRouter のフォールバック null — AGREE（問題あり）

### Opus 分析に同意するが追記

`getFallbackModel()` が `null` を返した場合の呼び出し元:

```typescript
// src/performance/ModelRouter.ts:189-194
getFallbackModel(currentModel: ModelType): ModelType | null {
  const currentIndex = this.fallbackChain.indexOf(currentModel)
  if (currentIndex === -1 || currentIndex >= this.fallbackChain.length - 1) {
    return null
  }
  return this.fallbackChain[currentIndex + 1]
}
```

`null` が返った場合、呼び出し元が TypeScript 型チェックで `null` を処理していれば問題なし。
しかし `null` を受けてさらに route() を呼ぼうとした場合、
TypeScript の `strict: true` 設定がなければ実行時 NPE になる可能性。

**tsconfig.json の strict 設定を確認する必要がある。**

---

## エッジケース 4: CHROME_PATH 未設定 — AGREE（潜在的問題、優先度低）

`detectChromePath()` の実装次第。ENOENT は `spawnSync` の戻り値 `error` フィールドで
捕捉可能であり、Chrome 関連スキルを使わない限り影響なし。優先度低。

---

## 追加エッジケース（Opusが見落とし）

### エッジケース 5: QDRANT_URL 未設定時の memory_add 挙動

`.env.example` 行62-63:
```
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=taisun_memory
```

`memory_add` ツールは Qdrant へのベクター書き込みに依存する可能性がある。
Qdrant が未起動の場合、`memory_add` が接続エラーを返すか、
ローカルファイルにフォールバックするかが不明。

これは `[REQUIRED]` ではないが、`[RECOMMENDED]` セクションに載っていない変数。
実際には Proxy MCP の中核機能（memory_add）に影響する可能性がある。

### エッジケース 6: VALIDATION_MODE=strict かつ ANTHROPIC_API_KEY 未設定

`config.ts:24` で `VALIDATION_MODE=strict` が設定され、かつ `ANTHROPIC_API_KEY` が未設定の場合:
- `constitutional_check` などは外部API不要のため動作する
- `llm-judge` が skip される
- `validation_pipeline` は「strict モードで LLM Judge がスキップ」という矛盾状態になる

この組み合わせの挙動は文書化されていない。

---

## 合意サマリー

| エッジケース | Opus評価 | Codex評価 | 最終判定 |
|------------|---------|---------|---------|
| 1. llm-judge ANTHROPIC_API_KEY抜け穴 | 要修正 ⚠️ | 安全（catchで処理済み）、診断性改善のみ | 軽微修正推奨 |
| 2. intelligence undefined伝播 | 要確認 ⚠️ | 行38でガードあり、内部実装は要確認 | 要確認（amber） |
| 3. ModelRouter null フォールバック | 要確認 ⚠️ | 同意、tsconfig strict 設定確認が必要 | 要確認（amber） |
| 4. CHROME_PATH未設定 | 潜在的問題 | 優先度低、Chrome非使用時は影響なし | 低優先度 |
| 5. QDRANT_URL未設定（新規） | 未検討 | memory_add の中核機能に影響する可能性 | 要調査 ⚠️ |
| 6. VALIDATION_MODE=strict + APIキー無し（新規） | 未検討 | 矛盾状態が文書化されていない | 文書化推奨 |
