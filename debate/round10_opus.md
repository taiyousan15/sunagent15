# Round 10: エッジケース — Opus Analysis
## 観点: .env.example で環境変数が未設定の場合の各スキルの挙動

---

## 確認した事実

### 環境変数の使用箇所（process.env 全棚卸し）

| 変数名 | ファイル | 未設定時の挙動 |
|--------|---------|--------------|
| `ANTHROPIC_API_KEY` | src/proxy-mcp/validation/llm-judge.ts:100 | `shouldSkip()` が `skip: true, reason: 'no_api_key'` を返す → LLMJudgeをスキップ（安全側） |
| `ANTHROPIC_API_KEY` | src/performance/ModelRouter.ts:175 | `healthy = false` → anthropic プロバイダが unhealthy 扱い |
| `ANTHROPIC_API_KEY` | src/proxy-mcp/validation/llm-judge.ts:179 | APIヘッダーに空文字が渡る → Anthropic APIが401を返す |
| `OPENAI_API_KEY` | src/performance/ModelRouter.ts:177 | `healthy = false` → openaiプロバイダが unhealthy |
| `OPENROUTER_API_KEY` | src/performance/ModelRouter.ts:179 | `healthy = false` → openrouterが unhealthy |
| `NEWS_API_KEY` | src/intelligence/index.ts:26 | `undefined` が渡る → intelligence スキル内で条件分岐が必要 |
| `FRED_API_KEY` | src/intelligence/index.ts:27 | `undefined` が渡る |
| `REDDIT_CLIENT_ID/SECRET` | src/intelligence/index.ts:28-29 | `undefined` が渡る |
| `VALIDATION_MODE` | src/proxy-mcp/validation/config.ts:24 | デフォルト `'advisory'` にフォールバック（安全） |
| `CONSTITUTIONAL_THRESHOLD` | src/proxy-mcp/validation/config.ts:27 | `parseFloat(undefined ?? '0.3')` = 0.3（安全） |
| `DEEPEVAL_ENABLED` | src/proxy-mcp/validation/config.ts:29 | `false`（無効化、安全） |
| `OPS_SCHEDULE_ENABLED` | src/proxy-mcp/ops/schedule/runner.ts:44 | `false`（スケジューラ無効、安全） |
| `GITHUB_TOKEN` | src/utils/env-check.ts:49 | 未設定チェックロジックあり |
| `TAISUN_INTERNAL_MCPS_OVERLAY_PATH` | src/proxy-mcp/internal/overlay.ts:75 | `null` を返す（安全） |

---

## 問題のあるエッジケース

### エッジケース 1: llm-judge.ts の ANTHROPIC_API_KEY 未設定時

**ファイル:** `src/proxy-mcp/validation/llm-judge.ts`

- 行100: `if (!process.env.ANTHROPIC_API_KEY)` → skip
- 行179: `'x-api-key': process.env.ANTHROPIC_API_KEY ?? ''`

**問題:** `shouldSkip` でガードしているが、`enabled: true` が明示的に渡された場合は
skip チェックを迂回できる（行139: `enabled = process.env.VALIDATION_LLM_JUDGE_ENABLED === 'true'`
とは別に、呼び出し元が `enabled: true` を渡せる）。

その場合、行179 で `'x-api-key': ''` が渡り、Anthropic API が **401 Unauthorized** を返す。
この 401 は llm-judge.ts の catch ブロックで握りつぶされている可能性がある。

**確認が必要な箇所:** llm-judge.ts の runLLMJudge の catch ブロック

### エッジケース 2: intelligence/index.ts の undefined 伝播

**ファイル:** `src/intelligence/index.ts:26-32`

```typescript
newsApiKey: process.env.NEWS_API_KEY,   // undefined
fredApiKey: process.env.FRED_API_KEY,   // undefined
redditClientId: process.env.REDDIT_CLIENT_ID,  // undefined
```

`undefined` がそのままオブジェクトに渡る。
intelligence スキルの内部で `if (config.newsApiKey)` のようなガードがなければ、
API呼び出し時に `Authorization: Bearer undefined` というヘッダーが送信される。

### エッジケース 3: ModelRouter の unhealthy 判定後のフォールバック

**ファイル:** `src/performance/ModelRouter.ts:175-183`

`ANTHROPIC_API_KEY` 未設定 → `healthy = false`
しかし `getFallbackModel()` は同一 fallbackChain 内の次のモデルを返すだけ。
anthropic が unhealthy で openai も未設定の場合、最終的に `null` が返る可能性。
`null` を受け取った呼び出し元がエラーハンドリングしているか未確認。

### エッジケース 4: CHROME_PATH 未設定時のパス検出失敗

**ファイル:** `src/proxy-mcp/browser/cdp/chrome-debug-cli.ts:169`

```typescript
const chromePath = process.env.CHROME_PATH || detectChromePath();
```

`detectChromePath()` の実装次第では、Chrome が非標準パスにある場合に空文字か
undefined が返り、その後の `spawnSync` が `ENOENT` を返す可能性がある。

---

## 修正案

### 修正1: llm-judge.ts の enabled=true 強制時の防御

```typescript
// llm-judge.ts runLLMJudge 内
if (!process.env.ANTHROPIC_API_KEY) {
  // enabled が明示的にtrueでもAPIキーなしでは実行不可
  return { skipped: true, passed: true, score: 0.5,
           reasoning: 'ANTHROPIC_API_KEY not set', issues: [] };
}
```

### 修正2: intelligence/index.ts の undefined ガード

```typescript
// 渡す前に明示的に undefined を除外
newsApiKey: process.env.NEWS_API_KEY || undefined,
```
これは現状と同じに見えるが、型レベルで明示することで
TypeScript が `string | undefined` として扱い、
呼び出し先での nullable チェックが強制される。

実際には intelligence スキル内部でのガードが必要:
```typescript
if (!config.newsApiKey) {
  logger.warn('NEWS_API_KEY not set, skipping NewsAPI fetch');
  return [];
}
```

### 修正3: .env.example への動作注記追加

現状の .env.example には「このキーがないと○○が動かない」という記述がない。
Round 7 のラベル付けと組み合わせて、OPTIONAL キーにも動作影響を明記:

```bash
# [OPTIONAL] NewsAPI (intelligence-researchスキル用)
# 未設定の場合: NewsAPIフェッチはスキップされ、他のソースのみ使用
NEWSAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 総括: 安全な未設定 vs 危険な未設定

| カテゴリ | 変数 | 未設定挙動 | 安全か |
|---------|------|-----------|--------|
| Validation config | VALIDATION_MODE 等 | デフォルト値にフォールバック | 安全 ✅ |
| Validation LLM | ANTHROPIC_API_KEY | shouldSkipガード（enabled強制時に抜け穴あり） | 要修正 ⚠️ |
| Model routing | OPENAI_API_KEY 等 | unhealthy判定（フォールバック先がnullになり得る） | 要確認 ⚠️ |
| Intelligence | NEWS_API_KEY 等 | undefined伝播（ガードが呼び出し先依存） | 要確認 ⚠️ |
| Scheduler | OPS_SCHEDULE_ENABLED | 無効化（安全） | 安全 ✅ |
| Overlay path | TAISUN_INTERNAL_MCPS_OVERLAY_PATH | null（安全） | 安全 ✅ |
