---
round: 5
perspective: Opus（セキュリティ批評）
topic: 問題#4 セキュリティ重要3ガードのテスト不在リスク
---

# Round 5 — Opus: セキュリティ

## 対象ガードの実装確認

### unified-guard.js（行40-62）
```javascript
const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+[\/~]/,
  /rm\s+-rf\s+\*/,
  />\s*\/dev\/sd[a-z]/,
  /mkfs\./,
  /dd\s+if=.*of=\/dev/,
  /:(){:|:&};:/                // Fork bomb
];

const INJECTION_PATTERNS = [
  /\$\(.*\)/,                  // Command substitution
  /`.*`/,                      // Backtick execution
  /;\s*rm\s/,                  // Command chaining with rm
  /\|\s*sh/,                   // Pipe to shell
  /eval\s/                     // eval command
];
```

Intent検出ロジック（行106-220+）が `shouldSkip: true` を返した場合、後続の危険パターンチェックがスキップされるレイヤー制御がある。

### cost-hard-stop-guard.js（行144-206）
- `check()` 関数: `PHASE=2` 時に `daily > DAILY_LIMIT` でブロック
- **重大な実装問題（行152-156）**: 累積コスト取得 `getCumulativeCost()` → `recordCost()` の順序
  ```javascript
  const { daily, monthly } = getCumulativeCost();  // 行153: チェック前に現在値取得
  recordCost(toolName, estimatedCost);              // 行156: 記録（チェック後）
  ```
  コメントに「上限超過時の二重計上を防止」とあるが、記録はチェック「後」に行っており、ブロック判定は「記録前」の値で行う。つまり上限を超えているはずなのに、最後の1回のツール呼び出しがコスト記録前にブロック判定を受けてすり抜ける可能性がある。テストがないためこのロジックが意図通りか検証できていない。

### checkpoint-guard.js（行118-180）
- `isCheckpointDone()`: フラグファイルの存在とTTL（8時間）を確認
- **バイパス可能な経路（行141-145）**:
  ```javascript
  if (toolName === 'Bash') {
    const cmd = ((toolInput && toolInput.command) || '').trim();
    const hasDangerousChars = /[;&|`$()<>]/.test(cmd);
    if (!hasDangerousChars && ALWAYS_ALLOW_BASH_PATTERNS.some(p => p.test(cmd))) return null;
  }
  ```
  `ALWAYS_ALLOW_BASH_PATTERNS` の1つ目は `/^cat\s+\.claude\//`。
  `cat .claude/CLAUDE.md` はホワイトリスト通過する（`hasDangerousChars` なし）。
  しかし `cat .claude/hooks/../../../etc/passwd` もパターンにマッチする可能性がある — `.claude/` に続く文字列の検証が不十分。

---

## セキュリティリスクの分類

### リスク1（重大）: cost-hard-stop のオフバイワン問題
**説明**: 上限値ちょうどでの最後の呼び出しがすり抜ける可能性。`daily > DAILY_LIMIT`（厳密な不等号）で判定するため、`daily === DAILY_LIMIT` は通過する。  
**影響**: PHASE=2 で $50 上限のとき、$50.00 ちょうどで判定するとブロックされない。  
**テストで検出可能か**: YES — `daily = DAILY_LIMIT` のシナリオをテストすれば即座に検出できる。

### リスク2（中程度）: checkpoint-guard のパス traversal 不検証
**説明**: `ALWAYS_ALLOW_BASH_PATTERNS[0]` = `/^cat\s+\.claude\//` がパス traversal を防いでいない。  
**影響**: `cat .claude/../../etc/passwd` が `hasDangerousChars` チェック（`;|&` 等）を通過し、さらに `/^cat\s+\.claude\//` にマッチすることでチェックポイント未完了でも実行される。ただし実際の被害は `cat` コマンドであり、書き込み系ではないため限定的。  
**テストで検出可能か**: YES — パストラバーサルパターンを含むペイロードでスモークテストすれば検出できる。

### リスク3（中程度）: unified-guard の Intent スキップによる危険パターンチェック迂回
**説明**: `performIntentCheck()` が `shouldSkip: true + skipLayers: [2,3,4,6]` を返した場合、レイヤー2（Permission Check）がスキップされる可能性がある（unified-guard.js の実装全体を確認していないが、skipLayers の処理が正しく実装されているか未検証）。  
**影響**: 意図せず `EXISTING_FILE_EDIT` として分類されたファイル操作が危険パターンチェックをバイパスする可能性。  
**テストで検出可能か**: YES — `Edit` ツールで `old_string` に `rm -rf /` を含むペイロードを送るスモークテストで検証できる。

---

## 修正案

### cost-hard-stop-guard.js（行159）
```javascript
// 修正前
const dailyExceeded = daily > DAILY_LIMIT;
// 修正後（>= で上限値も含める）
const dailyExceeded = daily >= DAILY_LIMIT;
```

### checkpoint-guard.js — パストラバーサル防止
```javascript
// ALWAYS_ALLOW_BASH_PATTERNS[0] の修正前
/^cat\s+\.claude\//,
// 修正後（'..' を含むパスを除外）
/^cat\s+\.claude\/(?!.*\.\.)[\w\-./]+$/,
```

### テスト追加（優先3件）
```javascript
// cost-hard-stop: オフバイワン
test('ブロック: daily === DAILY_LIMIT で上限到達', () => {
  // daily = 50, DAILY_LIMIT = 50, PHASE=2
  // expect: permissionDecision === 'deny'
});

// checkpoint-guard: パストラバーサル
test('パストラバーサルはホワイトリスト通過しない', () => {
  const cmd = 'cat .claude/../../etc/passwd';
  // expect: ブロック（チェックポイント未完了時）
});

// unified-guard: Editの危険パターン迂回確認
test('Edit tool + rm -rf はINJECTIONとして検出', () => {
  // old_string に危険パターンを含むEditペイロード
  // expect: exit 2
});
```
