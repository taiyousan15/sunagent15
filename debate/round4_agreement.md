---
round: 4
type: agreement
topic: 問題#4 hookテスト不在がCI速度・品質に与える影響
---

# Round 4 — 合意結果

## 判定: 部分合意

**合意点（両者一致）**
- `.claude/hooks/__tests__/` の既存6テストファイルが `jest.config.js` の `roots` 外にあり、CIで実行されていない — 即時修正対象
- `cost-hard-stop-guard.js`・`unified-guard.js`・`checkpoint-guard.js` のテストが最優先
- 62ファイル全テストは非現実的。ガード系（exit code を返すもの）に絞るべき

**不合意点**
- Opus: Jestユニットテストを中心に整備
- Codex: `process.exit` のモックに信頼性問題があり、スモークテスト（実プロセス起動）のほうが実態に近い

**採用する方針**
2段階アプローチ:
- Phase 1（即時・低リスク）: 既存テストのCIへの接続 + スモークテストの追加
- Phase 2（中期）: 複雑なガードについてはユニットテストを追加し、pure関数部分を分離してモック不要にする

---

## 具体的なアクション

### Phase 1（即時 — 推定1〜2時間）

1. `jest.config.js` に hookテストプロジェクトを追加:
```javascript
{
  displayName: 'hooks',
  testEnvironment: 'node',
  roots: ['<rootDir>/.claude/hooks/__tests__'],
  testMatch: ['**/*.test.js'],
  transform: {},
}
```

2. `ci.yml` の "Run tests with coverage" ステップの後に hookテスト実行ステップを追加:
```yaml
- name: Run hook smoke tests
  run: npx jest --testPathPattern='hooks/__tests__' --forceExit
  timeout-minutes: 5
```

3. 既存6テストが実際にpassするか確認してから接続（broken testsをCIに入れない）

### Phase 2（中期 — 優先3ガードに絞る）

4. `cost-hard-stop-guard.js` スモークテスト:
   - `COST_HARD_STOP_PHASE=2` + 累積コストが日次上限超のJSONL → exit 2 を確認
   - `COST_HARD_STOP_PHASE=1` + 同条件 → exit 0（警告のみ）を確認

5. `unified-guard.js` スモークテスト:
   - `rm -rf /` を含む Bash コマンド → exit 2
   - 通常の Read コマンド → exit 0
   - U+FFFD を含む入力（コピー安全ガード）→ exit 2

6. `checkpoint-guard.js` スモークテスト:
   - `CHECKPOINT_GUARD_PHASE=3` + チェックポイント未完了状態 + Write コマンド → exit 2
   - `CHECKPOINT_GUARD_PHASE=0` → exit 0（無効化）

### カバレッジへの影響
- hookテストは `coverage/coverage-summary.json` の集計対象外（別プロジェクト設定のため）
- CI の 80% coverage threshold には影響しない（hookは JS 形式で TypeScript カバレッジ計測外）
- これは意図的: hookのカバレッジは別指標で管理するほうが健全

### リスク
- 既存テストが `fs.existsSync` 等をモックしており、CI環境（ファイルシステム状態が異なる）でfailする可能性
- 事前に `npm run test:hooks` をローカルで実行してからCI接続すること
