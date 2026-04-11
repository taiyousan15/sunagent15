---
round: 5
type: agreement
topic: 問題#4 セキュリティ重要3ガードのテスト不在リスク
---

# Round 5 — 合意結果

## cost-hard-stop-guard.js オフバイワン問題

### 判定: 部分合意

**合意点**
- `daily > DAILY_LIMIT` + `recordCost` の呼び出し順序の組み合わせが意図する動作を保証しているかテストなしには確認不可能（両者一致）
- テスト追加が最優先（両者一致）

**不合意点**
- Opus: `>` を `>=` に修正
- Codex: 修正前に意図を明確化し、コメント更新を先行させるべき

**採用する方針**
コメント明確化を先行させ、テストを追加してから修正方向を確定する。

**具体的なアクション**
1. `cost-hard-stop-guard.js:152-156` のコメントを更新: 「上限値ちょうど（`daily === DAILY_LIMIT`）はブロックする/しない」の方針を明記
2. テスト追加: `daily = DAILY_LIMIT`（ちょうど上限）・`daily = DAILY_LIMIT + 0.01`（超過）・`daily = DAILY_LIMIT - 0.01`（未満）の3ケース
3. テスト結果で現行挙動を確認してから `>` vs `>=` を判断し修正

---

## checkpoint-guard.js パストラバーサル

### 判定: 部分合意

**合意点**
- `cat .claude/../../etc/passwd` がホワイトリストを通過する可能性は事実（両者一致）
- 修正は必要（両者一致）

**不合意点**
- Opus: 正規表現に否定先読み `(?!.*\.\.)` を追加
- Codex: `hasDangerousChars` に `|\.\.` を追加するだけ（シンプル）

**採用する方針**
Codexの最小変更案を採用。正規表現に複雑なパターンを加えるより、既存の `hasDangerousChars` チェックを拡張するほうが副作用が少ない。

**具体的なアクション**
1. `checkpoint-guard.js:144` を修正:
   ```javascript
   // 修正前
   const hasDangerousChars = /[;&|`$()<>]/.test(cmd);
   // 修正後
   const hasDangerousChars = /[;&|`$()<>]|\.\./.test(cmd);
   ```
2. テスト追加:
   - `cat .claude/../../etc/passwd` → ホワイトリスト通過しない（チェックポイント未完了時はブロック）
   - `cat .claude/CLAUDE.md` → 正規通過（回帰確認）

---

## unified-guard.js Intent スキップと危険パターンの優先関係

### 判定: 部分合意

**合意点**
- `Edit` ツールで危険パターンを含む `old_string` が INJECTION として検出されるかのテストは有効（両者一致）
- Intent スキップと危険パターンチェックの優先関係を明確化するテストが必要（両者一致）

**不合意点**
- Opus: skipLayers の処理が正しく実装されているか不明と主張
- Codex: 全体コード未読での指摘は推測と批判

**採用する方針**
スモークテストで実際に確認してから判断する（コード全体の追加読み込みは今回のスコープ外）。

**具体的なアクション**
1. スモークテスト追加:
   - `Bash: 'rm -rf /'` → exit 2（DANGEROUS_PATTERNS 検出）
   - `Edit: file_path='existing.ts', old_string='...'` （危険パターンなし） → exit 0
   - `Edit: file_path='existing.ts', old_string='$(rm -rf /)'` → exit 2 または 0（実測値を記録）
2. ステップ3の実測結果に応じて、Intent スキップが危険パターンチェックより先に実行されているか判断

---

## Codex 追加指摘事項

### フェイルオープン設計の明文化

### 判定: 完全合意

**採用する方針**
3ガード（unified-guard, cost-hard-stop-guard, checkpoint-guard）それぞれの `catch (e) { return null; }` 箇所にコメントを追加:

```javascript
} catch (e) {
  // フェイルオープン: ガードのエラーで作業を止めない（意図的設計）
  // セキュリティより可用性を優先する。ガードは補助的な安全網。
  return null;
}
```

これにより将来の開発者がフェイルクローズへの誤修正を防ぐ。

---

## 総合優先順位

| 優先度 | アクション | 対象ファイル |
|--------|-----------|-------------|
| 高 | `hasDangerousChars` に `|\.\.` 追加 | checkpoint-guard.js:144 |
| 高 | cost-hard-stop オフバイワンのテスト追加 | __tests__/smoke.test.js |
| 高 | 既存6テストファイルのCIへの接続 | jest.config.js |
| 中 | unified-guard のスモークテスト（Edit+危険パターン） | __tests__/smoke.test.js |
| 中 | フェイルオープン設計コメントの明文化 | 3ガードファイル |
| 低 | cost-hard-stop `>` vs `>=` の最終判断（テスト確認後） | cost-hard-stop-guard.js:159 |
