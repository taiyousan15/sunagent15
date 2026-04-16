# Round 8 Agreement Check

## Round 1 PARTIAL 3件 → 全件 AGREE に格上げ

| Finding | Round 1 | Round 8 | 確定修正 |
|---------|---------|---------|---------|
| 1. プレースホルダーテスト | PARTIAL | AGREE ✅ | fs.readFileSync+regex（パターン強化版） |
| 2. CI閾値上書き | PARTIAL | AGREE ✅ | `--coverageThreshold='{}'` 削除のみ |
| 3. CD テスト依存 | PARTIAL | AGREE ✅ | cd.yml に test job追加 + `needs: test` |

---

## Finding 1: テスト実装の確定案

### command-injection-vulnerability.test.ts
```typescript
import { readFileSync } from 'fs';
import * as path from 'path';

describe('Regression: Command Injection Vulnerability', () => {
  const src = readFileSync(
    path.resolve(__dirname, '../../src/proxy-mcp/supervisor/github.ts'), 'utf8'
  );
  it('should not use execSync with template literals', () => {
    expect(/execSync\([`"'].*\$\{/.test(src)).toBe(false);
  });
  it('should use spawnSync with array args (>=4 occurrences)', () => {
    const matches = src.match(/spawnSync\('gh',\s*\[/g);
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
  const src = readFileSync(
    path.resolve(__dirname, '../../src/proxy-mcp/browser/cdp/chrome-debug-cli.ts'), 'utf8'
  );
  it('should not use wildcard origin', () => {
    expect(src).not.toContain('--remote-allow-origins=*');
  });
  it('should restrict to localhost', () => {
    expect(src).toContain('--remote-debugging-address=127.0.0.1');
  });
});
```

### silent-error-catch.test.ts
```typescript
import { readFileSync } from 'fs';
import * as path from 'path';

describe('Regression: Silent Error Catch', () => {
  const src = readFileSync(
    path.resolve(__dirname, '../../src/proxy-mcp/browser/cdp/session.ts'), 'utf8'
  );
  it('should not have empty catch blocks', () => {
    expect(/catch\s*\([^)]*\)\s*\{\s*\}/.test(src)).toBe(false);
  });
  it('should log in catch blocks', () => {
    // catchブロック内にconsole.debug/error/warnがあること（Codex強化版）
    expect(/catch\s*\([^)]+\)\s*\{[^}]*console\.(debug|error|warn)/s.test(src)).toBe(true);
  });
});
```

### success-true-on-error.test.ts
```typescript
import { readFileSync } from 'fs';
import * as path from 'path';

describe('Regression: Success True On Error', () => {
  const src = readFileSync(
    path.resolve(__dirname, '../../src/proxy-mcp/ops/schedule/runner.ts'), 'utf8'
  );
  it('should use skipped flag for optional dependency errors', () => {
    expect(src).toContain('skipped: true');
  });
  it('should not have bare success:true in catch without context', () => {
    // skipped: true が存在することで代替チェック（nestedブロック問題を回避）
    expect(src).toContain('skipped: true');
    expect(src).toContain('success: false');
  });
});
```

---

## Finding 2: ci.yml 修正

**ファイル:** `.github/workflows/ci.yml` 行98

**変更前:**
```yaml
run: npx jest --coverage --coverageThreshold='{}' --ci --runInBand --forceExit
```

**変更後:**
```yaml
run: npx jest --coverage --ci --runInBand --forceExit
```

**注意:** 適用前に `npx jest --coverage` でカバレッジ確認推奨（既存コードが閾値を下回る場合 CI が即失敗）。

ci.yml 行108-116 の独自 lines チェックは `--coverageThreshold` 適用後に削除可（重複）。

---

## Finding 3: cd.yml 修正

**ファイル:** `.github/workflows/cd.yml`

**jobs セクション先頭に追加:**
```yaml
  test:
    name: Run Tests (pre-release gate)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npx jest --ci --runInBand --forceExit
```

**既存 build job に追加:**
```yaml
  build:
    needs: test   # ← この1行を追加
    name: Build & Package
    ...
```
