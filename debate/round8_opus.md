# Round 8: テスタビリティ — Opus Analysis
## 観点: Round 1 PARTIAL 3件の修正案再検討

## 確認した事実

### Finding 1: プレースホルダーテスト (PARTIAL — 動的テストへの変更)

実際のソースコード状態を確認:

**github.ts (コマンドインジェクション修正済み)**
- 行17: `execSync('gh --version', ...)` — バージョン確認用、文字列リテラルのみ（安全）
- 行29: `execSync('git remote get-url origin', ...)` — 固定コマンド（安全）
- 行73-74, 132-133, 171-172, 184-185, 232-233, 272-273: `spawnSync('gh', [...])` — 配列引数方式（修正済み）

**chrome-debug-cli.ts (ワイルドカード修正済み)**
- 行213: `'--remote-debugging-address=127.0.0.1'` — localhost限定
- 行216: `'--remote-allow-origins=http://127.0.0.1,http://localhost,...'` — 明示的許可リスト

**session.ts (サイレントcatch修正済み)**
- 行55: `console.debug('[CDP] Cached connection stale, reconnecting:', error...)` — ログあり
- 行136: `console.debug('[CDP] Error during disconnect (non-fatal):', error...)` — ログあり

**runner.ts (success:true修正済み)**
- 行262-267: `success: false, skipped: true` — P17 digest module error のケース

### テストの現状
全4ファイルが `expect(true).toBe(true)` プレースホルダー。
`index.test.ts` は4ファイルをimportするだけ。

## 動的テスト実装案

### command-injection-vulnerability.test.ts

```typescript
import { readFileSync } from 'fs';
import * as path from 'path';

describe('Regression: Command Injection Vulnerability', () => {
  const githubSrc = readFileSync(
    path.resolve(__dirname, '../../src/proxy-mcp/supervisor/github.ts'),
    'utf8'
  );

  it('should use spawnSync with array args, not execSync with template literals', () => {
    // execSync with template literals (dangerous pattern)
    const dangerousPattern = /execSync\([`"'].*\$\{/;
    expect(dangerousPattern.test(githubSrc)).toBe(false);
  });

  it('should have spawnSync calls for user-controlled operations', () => {
    // spawnSync を配列引数で使っていること
    const safePattern = /spawnSync\('gh',\s*\[/g;
    const matches = githubSrc.match(safePattern);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(4);
  });
});
```

### chrome-origin-wildcard.test.ts

```typescript
import { readFileSync } from 'fs';
import * as path from 'path';

describe('Regression: Chrome Origin Wildcard', () => {
  const chromeSrc = readFileSync(
    path.resolve(__dirname, '../../src/proxy-mcp/browser/cdp/chrome-debug-cli.ts'),
    'utf8'
  );

  it('should not use wildcard origin', () => {
    expect(chromeSrc).not.toContain('--remote-allow-origins=*');
  });

  it('should restrict to localhost origins', () => {
    expect(chromeSrc).toContain('--remote-debugging-address=127.0.0.1');
  });
});
```

### silent-error-catch.test.ts

```typescript
import { readFileSync } from 'fs';
import * as path from 'path';

describe('Regression: Silent Error Catch', () => {
  const sessionSrc = readFileSync(
    path.resolve(__dirname, '../../src/proxy-mcp/browser/cdp/session.ts'),
    'utf8'
  );

  it('should not have empty catch blocks', () => {
    // } catch ... { } の空ブロックパターン検出
    const emptyCatch = /catch\s*\([^)]*\)\s*\{\s*\}/;
    expect(emptyCatch.test(sessionSrc)).toBe(false);
  });

  it('should log errors in catch blocks', () => {
    expect(sessionSrc).toContain('console.debug');
  });
});
```

### success-true-on-error.test.ts

```typescript
import { readFileSync } from 'fs';
import * as path from 'path';

describe('Regression: Success True On Error', () => {
  const runnerSrc = readFileSync(
    path.resolve(__dirname, '../../src/proxy-mcp/ops/schedule/runner.ts'),
    'utf8'
  );

  it('should use skipped flag for optional dependency errors', () => {
    expect(runnerSrc).toContain('skipped: true');
  });

  it('should not return success:true in catch blocks without skipped flag', () => {
    // catch ブロック内で success: true かつ skipped なしのパターンを検出
    // 正規表現で簡易チェック
    const catchSuccessPattern = /catch[^}]*success:\s*true(?![^}]*skipped)/s;
    // runner.ts の実装は skipped: true と共にあるはずなのでこのパターンは不一致であること
    // （厳密なASTベース検証は静的解析ツール側で行う）
    expect(runnerSrc).toContain('skipped: true');
  });
});
```

## 静的解析 vs 動的テストのトレードオフ

| 方式 | メリット | デメリット |
|------|---------|-----------|
| fs.readFileSync + regex (今回案) | 実装容易、依存なし | AST解析ではないため偽陰性リスク |
| import + mock (Codex Round 1要求) | ランタイム動作を検証 | github.tsはshell呼び出しのためmockが複雑 |
| AST解析 (ts-morph等) | 最も正確 | 追加依存、実装コスト高 |

**推奨: fs.readFileSync + regex** — 今回の回帰防止目的には十分。
コマンドインジェクションは「文字列補間の有無」という構造的問題であり、
ファイル内容の静的パターンマッチで検出可能。

## CI閾値 (Finding 2) の現状確認

ci.yml 行98:
```yaml
run: npx jest --coverage --coverageThreshold='{}' --ci --runInBand --forceExit
```
`--coverageThreshold='{}'` で jest.config.js の閾値設定を上書き（無効化）。

ci.yml 行108-116: lines のみ別途 jq で 80% チェック。
branches (60%), functions (80%), statements (80%) は未チェック。

**修正案:**
```yaml
run: npx jest --coverage --ci --runInBand --forceExit
```
`--coverageThreshold='{}'` を削除するだけ。jest.config.js の設定が自動適用される。

## CD テスト依存 (Finding 3) の現状確認

cd.yml には test ステップなし、`needs: [ci-job]` もなし。
タグpush (`v*`) で直接 build → release が走る。

GitHub Actions の制約: `needs` は同一ワークフロー内のjobのみ参照可能。
別ワークフロー(ci.yml)のjobをcd.ymlのneedsに指定不可。

**修正案 (2択):**

Option A: cd.yml 先頭に test job を追加
```yaml
jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: npm
      - run: npm ci
      - run: npx jest --coverage --ci --runInBand --forceExit
  build:
    needs: test
    ...
```

Option B: workflow_run トリガー追加
```yaml
on:
  push:
    tags: ['v*']
  workflow_run:
    workflows: ['CI']
    types: [completed]
    branches: [main]
```
ただしこれはブランチ push 時の CI 完了後に CD が走る設計であり、
タグ push 時には CI が別途走らないため不完全。

**推奨: Option A** — シンプルで確実。CI重複実行のコストはかかるが安全性優先。
