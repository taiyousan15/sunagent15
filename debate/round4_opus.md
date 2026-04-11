---
round: 4
perspective: Opus（パフォーマンス批評）
topic: 問題#4 hookテスト不在がCI速度・品質に与える影響
---

# Round 4 — Opus: パフォーマンス

## 確認した事実

### hookファイルの規模
- `.claude/hooks/` に `.js` ファイル: **62個**
- `__tests__/` に存在するテストファイル: **6個**（うち実質テストコードを持つもの）
  - `unified-guard-phase2.test.js` — 25テストケース
  - `unified-guard-phase3.test.js` — 19テストケース
  - `unified-guard-stage2b.test.js` — 21テストケース
  - `guard-dev-commands.test.js` — テスト有
  - `model-auto-switch.test.js` — テスト有
  - `run-phase2-tests.js` — テストランナー兼テスト

### CIでのhookテスト実行状況
- `jest.config.js:4` の `roots: ['<rootDir>/src', '<rootDir>/tests']`
- `.claude/hooks/__tests__/` は **CI の Jest roots に含まれていない**
- `__tests__/` 内のファイルは `.js` 形式（Jest defaultの `testMatch` は `.ts` のみ）
- 結論: **既存の6テストファイルもCIで実行されていない**

### テストが存在しない主要hookの一覧（62個中の代表例）
- `checkpoint-guard.js` — セッション開始手順を物理強制
- `cost-hard-stop-guard.js` — コスト爆発防止（日次$50/月次$500上限）
- `unified-guard.js` — copy-safety + input-sanitizer + workflow-fidelity 統合
- `agent-enforcement-guard.js`
- `approval-gate.js`
- `deviation-approval-guard.js`
- `input-sanitizer-guard.js`（standalone版）
- `workflow-fidelity-guard.js`（standalone版）
- `session-end-ledger.js`
- `context-monitor.js`（その他計55ファイル）

---

## CI速度への影響

### 現状: hookテストが実行されないことの「速度メリット」
CIはhookをスキップするため、逆説的にCI実行時間は短い。しかしこれはカバレッジの欠如による見かけ上の速さであり、hookの回帰は本番hookが実行されて初めて検出される。

### 品質への実コスト
1. **hookの回帰検出に要する平均時間**: hookは Claude Code セッション開始時（UserPromptSubmit）・ツール実行時（PreToolUse/PostToolUse）に起動。回帰は「次回の実際の使用時」に初めて発覚する。開発→検出のサイクルが数時間〜数日になりうる。

2. **hookの副作用**: `cost-hard-stop-guard.js` にバグがあり誤ってブロックした場合、すべてのツール呼び出しがブロックされる。`exit code 2` を誤って返すだけで全操作停止。テストなしではこの回帰が見えない。

3. **62ファイルに対する変更頻度**: git logで確認できないが、フックは `unified-guard.js`（4ガードを統合）のような大規模統合が過去に行われており、変更頻度は高いと推測される。

---

## CIへの統合案

### 問題: hookは `.js`、JestはデフォルトでTypeScriptを期待
`jest.config.js` の `testMatch: ['**/__tests__/**/*.ts', ...]` は `.js` にマッチしない。

### 修正案A: jest.config.js に hookテストプロジェクトを追加
```javascript
// jest.config.js への追加
{
  displayName: 'hooks',
  testEnvironment: 'node',
  roots: ['<rootDir>/.claude/hooks/__tests__'],
  testMatch: ['**/*.test.js'],
  transform: {},  // JSはトランスパイル不要
}
```

### 修正案B: package.json に独立したテストスクリプトを追加し、CI で並列実行
```json
// package.json
"test:hooks": "node --experimental-vm-modules node_modules/.bin/jest --config jest.hooks.config.js"
```

```yaml
# ci.yml への追加ジョブ（既存テストと並列）
- name: Run hook tests
  run: npm run test:hooks
  timeout-minutes: 5
```

### 優先対象（追加すべきテストの順序）
1. `cost-hard-stop-guard.js` — 誤ブロックの影響が最大
2. `unified-guard.js` — 4ガードを統合しているため回帰範囲が広い
3. `checkpoint-guard.js` — セッション開始を制御
4. `model-auto-switch.js` — 既にテストファイルあり、CIへの接続のみ必要

### 推定テスト追加工数
既存テストファイル6本のCIへの接続: `jest.config.js` 修正 + `ci.yml` 修正 = 約30行。追加テストなしで即座に65ケースがCIに取り込まれる。
