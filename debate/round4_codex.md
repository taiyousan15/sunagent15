---
round: 4
perspective: Codex（Opusへの反論・改善提案）
topic: 問題#4 hookテスト不在がCI速度・品質に与える影響
---

# Round 4 — Codex: Opusへの反論

## hookをJestでテストすることへの根本的な反論

### 反論点1: hookはNode.js CLIプロセスとして動作する — Jestモデルと構造的に相性が悪い
hookは `process.stdin` を読んで `process.exit(0|2)` を返す CLI プロセスとして設計されている（`unified-guard.js:19-20` のコメント: `exit code: 0=許可, 2=ブロック`）。

Jestでユニットテストするには:
- `process.exit` をモックする
- `stdin` をモックする
- ファイルシステム（`fs.readFileSync` 等）をモックする

この量のモックは「テストがプロダクションコードの動作を再現しているか」という信頼性問題を生む。既存の `unified-guard-phase2.test.js` がそのアプローチを取っているかを確認せずに「65ケースがCIに入る」と言うのは楽観的すぎる。

### 反論点2: hookの本物のテストは「Claude Codeのセッション内で動かす」こと
hookの品質保証として最も確実なのは、hookを実際のClaude Codeセッションの中で動かすE2Eテストである。ユニットテストでモックした `process.exit(2)` が正しく動いても、実際のClaude Codeが `exit 2` を受け取ってブロックするかどうかは別の問題。

### 反論点3: 62ファイル全てのテストは現実的でない
Opusは「62ファイルにテストがない」と指摘するが、hookの中には `log-commands.sh`（シェルスクリプト）、`mistakes.md`（ドキュメント）、`data/`ディレクトリのデータファイルも含まれており、実質的にテストすべき `.js` hookは62より少ない。また、`context-monitor.js`、`auto-memory-saver.js` 等の観測系hookはべき等性があり、副作用のあるガード系hookと区別して優先度をつけるべき。

## 合意できる点

- **既存テストファイル6本がCIで実行されていない**という事実は重大（両者一致）
- `jest.config.js` の `roots` に `.claude/hooks/__tests__` が含まれていないのは明確な設定漏れ（両者一致）
- `cost-hard-stop-guard.js` と `unified-guard.js` のテストが最優先（両者一致）

## 代替案: 最小コストで最大の安全網を張る

### 案1: 既存6テストをまずCIに接続する（所要時間: ~30分）
Opusの `jest.config.js` 修正案は正しい。ただし既存テストが実際にpassするかを先に確認すべき。

```javascript
// jest.config.js に追加するプロジェクト設定
{
  displayName: 'hooks',
  testEnvironment: 'node',
  roots: ['<rootDir>/.claude/hooks/__tests__'],
  testMatch: ['**/*.test.js'],
  transform: {},
}
```

### 案2: スモークテストアプローチ（Jestモック不要）
ユニットテストの代わりに、各hookを実際のJSONペイロードで起動するスモークテスト:

```javascript
// hooks/__tests__/smoke.test.js
const { execSync } = require('child_process');

test('cost-hard-stop-guard exits 0 for normal input', () => {
  const payload = JSON.stringify({ tool_name: 'Read', tool_input: {} });
  const result = execSync(
    `echo '${payload}' | node .claude/hooks/cost-hard-stop-guard.js`,
    { env: { ...process.env, COST_HARD_STOP_PHASE: '2' } }
  );
  // exit 0 = no throw
});

test('unified-guard exits 2 for dangerous rm -rf input', () => {
  const payload = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'rm -rf /' } });
  expect(() => execSync(`echo '${payload}' | node .claude/hooks/unified-guard.js`)).toThrow();
  // exit 2 = throws in execSync
});
```

このアプローチはモックなし・プロダクションコードそのままを検証できる。

### 優先対象（Opusと同意）
1. 既存6テストファイルをCIに接続（即時）
2. `cost-hard-stop-guard.js` のスモークテスト追加
3. `unified-guard.js` の危険パターンブロック確認テスト
4. `checkpoint-guard.js` の `exit 2` 動作確認
