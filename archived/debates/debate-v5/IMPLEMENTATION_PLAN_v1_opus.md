# 7 項目 実施計画書 v1 — Opus 4.6 ドラフト

**作成**: Opus 4.6 メインセッション (`claude-opus-4-6[1m]`)
**対象**: v5 debate で 100% 一致した 7 項目
**目的**: 他人ユーザーの install/update を壊さず安全に実施

---

## Phase 0: 前提条件と環境準備

### 0.1 作業ブランチ
```bash
git checkout -b feature/v5-cleanup
git status  # main から派生確認
```

### 0.2 baseline 計測（実施前の状態を記録）
```bash
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration 2>&1 | grep -E "^(Test Suites|Tests):" > /tmp/baseline_tests.txt
npx eslint .claude/hooks/*.js --no-ignore --format compact 2>&1 | tail -1 > /tmp/baseline_eslint.txt
npx tsc --noEmit 2>&1 | tail -3 > /tmp/baseline_tsc.txt
npm audit --json 2>&1 | python3 -c "import json,sys; d=json.load(sys.stdin); print('vulnerabilities:', d['metadata']['vulnerabilities']['total'])" > /tmp/baseline_audit.txt
cat /tmp/baseline_*.txt
```

期待 baseline:
- Tests: 57 suites / 1107 tests
- ESLint: 0 problems
- tsc: 0 errors
- npm audit: 0 vulnerabilities

### 0.3 rollback 用 tag
```bash
git tag pre-v5-cleanup
```

---

## Phase 1: 孤立ファイル削除（A-1, A-2, A-3）超低リスク

### 1.1 A-1: mistakes.md.backup 削除
```bash
# 事前検証
test -f .claude/hooks/mistakes.md.backup.20260329 && echo "EXISTS" || echo "NOT FOUND"
rg "mistakes.md.backup.20260329" --glob '!debate*/**' --glob '!**/node_modules/**' | head -5

# 実施
git rm .claude/hooks/mistakes.md.backup.20260329

# 事後検証
test ! -f .claude/hooks/mistakes.md.backup.20260329 && echo "DELETED OK"
```

### 1.2 A-2: debate-v2/ 削除
```bash
# 事前検証
ls debate-v2/
rg "debate-v2" --glob '!debate*/**' --glob '!**/node_modules/**' | head -5

# 実施
git rm -rf debate-v2/

# 事後検証
test ! -d debate-v2 && echo "DELETED OK"
```

### 1.3 A-3: verify-skill-warehouse.sh 削除
```bash
# 事前検証
test -f scripts/verify-skill-warehouse.sh && echo "EXISTS"
grep -n "verify-skill-warehouse" package.json Makefile .github/workflows/*.yml 2>&1 | head -5
rg "verify-skill-warehouse" --glob '!debate*/**' --glob '!**/node_modules/**' | head -5

# 実施（参照ゼロ確認後）
git rm scripts/verify-skill-warehouse.sh

# 事後検証
test ! -f scripts/verify-skill-warehouse.sh && echo "DELETED OK"
```

### Phase 1 commit
```bash
git add -A
git status  # debate-v2/, mistakes.md.backup, verify-skill-warehouse.sh が deleted 表示
git commit -m "chore: remove 3 orphan files (v5 debate consensus)"
```

### Phase 1 検証
```bash
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration 2>&1 | grep -E "^(Test Suites|Tests):"
# baseline と同じ 57/1107 を確認
```

---

## Phase 2: 低リスク refactoring（B-1, B-3）

### 2.1 B-3: makeId 共通化（最も安全な refactoring 先行）
```bash
# 事前読込（必須）
cat src/intelligence/collectors/apify-collector.ts | head -25
cat src/intelligence/collectors/news-collector.ts | head -15
cat src/intelligence/collectors/economics-collector.ts | head -25

# 新規ファイル作成
mkdir -p src/intelligence/collectors/utils
# collector-id.ts に makeId 関数を抽出（手動 Edit）
```

`src/intelligence/collectors/utils/collector-id.ts`:
```typescript
import { createHash } from 'crypto';

/**
 * Generate a deterministic ID for a collector item.
 * Originally duplicated across apify/news/economics collectors.
 */
export function makeId(input: string): string {
  return createHash('md5').update(input).digest('hex');
}
```

各 collector を修正:
```bash
# 既存の makeId 関数を削除
# import { makeId } from './utils/collector-id'; を追加
```

### 2.2 B-3 検証
```bash
npx tsc --noEmit
npx jest --testPathPattern=intelligence/collectors --no-coverage --forceExit
```

### 2.3 B-1: ui.sh 共通化
```bash
# 事前読込
sed -n '95,110p' scripts/install.sh
sed -n '12,20p' scripts/update.sh
```

`scripts/lib/ui.sh` 新規作成:
```bash
#!/bin/bash
# UI helper functions extracted from install.sh and update.sh
# Source this file to get ok/warn/info/step/fail functions

ok()   { echo "  ✅ $1"; }
warn() { echo "  ⚠️  $1"; }
info() { echo "  ℹ️  $1"; }
fail() { echo ""; echo "  ❌ エラー: $1"; echo "     → $2"; echo ""; exit 1; }
step() { echo ""; echo "━━━ $1 ━━━"; }
```

install.sh と update.sh を修正:
- 既存の ok/warn/info/step/fail 定義を削除
- 冒頭近くに `source "$(dirname "$0")/lib/ui.sh"` 追加

### 2.4 B-1 検証
```bash
bash -n scripts/install.sh && echo "install.sh syntax OK"
bash -n scripts/update.sh && echo "update.sh syntax OK"
# 関数定義テスト
bash -c "source scripts/lib/ui.sh && ok 'test message' && warn 'test warning'"
```

### Phase 2 commit
```bash
git add scripts/lib/ui.sh scripts/install.sh scripts/update.sh
git add src/intelligence/collectors/utils/collector-id.ts src/intelligence/collectors/{apify,news,economics}-collector.ts
git commit -m "refactor: extract ui.sh + collector-id.ts (v5 debate consensus B-1, B-3)"
```

### Phase 2 全体検証
```bash
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration 2>&1 | grep -E "^(Test Suites|Tests):"
npx tsc --noEmit
npx eslint .claude/hooks/*.js --no-ignore --format compact 2>&1 | tail -1
```

---

## Phase 3: ディレクトリ整理（C-1）

### 3.1 debate/ 5 dir → archived/debates/
```bash
# 事前確認
ls -d debate*/

# archived/debates/ 作成
mkdir -p archived/debates/

# 5 dir を移動（debate-v5/v6 は除外、現在使用中）
git mv debate archived/debates/debate
git mv debate-plan-review archived/debates/debate-plan-review
git mv debate-v2 archived/debates/debate-v2  # ← 既に Phase 1 で削除されているのでスキップ
git mv debate-v3 archived/debates/debate-v3
git mv debate-v4 archived/debates/debate-v4
```

**注意**: debate-v2 は Phase 1 で削除済のため、移動対象は実質 4 dir。

### 3.2 README.md 参照更新
```bash
# README.md:24 の "debate/下34ファイル" を "archived/debates/debate/下34ファイル" に更新
# ただし plain text なのでリンク切れにはならない（Codex 確認済）
# 必須ではないが正確性のために更新推奨
```

### Phase 3 commit
```bash
git add -A
git commit -m "chore: consolidate debate/ dirs to archived/debates/ (v5 C-1)"
```

### Phase 3 検証
```bash
ls archived/debates/
ls -d debate*/  # debate-v5, debate-v6 のみ残る予定
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration 2>&1 | grep -E "^(Test Suites|Tests):"
```

---

## Phase 4: 中リスク refactoring（B-2）

### 4.1 事前準備
```bash
# 既存 hook を完全に Read
cat .claude/hooks/checkpoint-guard.js
cat .claude/hooks/agent-checkpoint-guard.js

# 既存テスト確認
ls .claude/hooks/__tests__/
```

### 4.2 .claude/hooks/utils/guard-base.js 作成
```bash
mkdir -p .claude/hooks/utils
```

`guard-base.js`:
```javascript
'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Common scaffolding for checkpoint-style guards.
 * Extracts main + logSkip from checkpoint-guard.js and agent-checkpoint-guard.js.
 * The check() function remains hook-specific.
 */

function logSkip(reason, detail) {
  // shared logSkip implementation (extract from existing hooks)
}

async function runGuard(hookName, checkFn) {
  // shared main loop:
  // - read stdin
  // - call hook-specific checkFn(input)
  // - handle exit codes
  // - logSkip on bypass
}

module.exports = { logSkip, runGuard };
```

### 4.3 既存 hook を guard-base 使用に修正
- checkpoint-guard.js: 既存 main/logSkip を削除、`require('./utils/guard-base')` で置換
- agent-checkpoint-guard.js: 同上
- check() 関数は各 hook 内で独立維持

### 4.4 unit test 追加
`.claude/hooks/__tests__/guard-base.test.js`:
- logSkip が正しく log を書く
- runGuard が exit code を保持する
- 両 hook で guard-base が同じように動く

### 4.5 Phase 4 検証（必須・厳密）
```bash
npx jest .claude/hooks/__tests__/ --no-coverage --forceExit
node -e "require('./.claude/hooks/utils/guard-base')" && echo "guard-base loadable"
node .claude/hooks/checkpoint-guard.js < /dev/null  # smoke
node .claude/hooks/agent-checkpoint-guard.js < /dev/null  # smoke
```

### Phase 4 commit
```bash
git add .claude/hooks/utils/ .claude/hooks/checkpoint-guard.js .claude/hooks/agent-checkpoint-guard.js .claude/hooks/__tests__/
git commit -m "refactor: extract guard-base from checkpoint-guard hooks (v5 B-2)"
```

---

## Phase 5: 最終検証

```bash
# 全テスト
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration 2>&1 | grep -E "^(Test Suites|Tests):"

# ESLint
npx eslint .claude/hooks/*.js --no-ignore --format compact 2>&1 | tail -1

# TypeScript
npx tsc --noEmit 2>&1 | tail -3

# npm audit
npm audit --json 2>&1 | python3 -c "import json,sys; d=json.load(sys.stdin); print('vulnerabilities:', d['metadata']['vulnerabilities']['total'])"

# install.sh smoke (実行はしない、syntax のみ)
bash -n scripts/install.sh && echo "install.sh OK"
bash -n scripts/update.sh && echo "update.sh OK"

# verify-installation
node scripts/verify-installation.js
```

期待値:
- Tests: ≥ 57 suites / ≥ 1107 tests（B-2 追加 test 分が増える）
- ESLint: 0 problems
- tsc: 0 errors
- npm audit: 0 vulnerabilities

---

## Phase 6: PR 作成 + マージ

```bash
git push -u origin feature/v5-cleanup
gh pr create --title "v5-cleanup: 7 items consensus from Opus × Real Codex debate" --body "..."
```

---

## Rollback 計画

各 phase 失敗時:
- Phase 1 失敗: `git reset --hard pre-v5-cleanup`
- Phase 2 失敗: `git revert HEAD` (Phase 2 commit のみ)
- Phase 4 失敗: `git revert HEAD~3..HEAD` で Phase 4 のみ取り消し

最悪: `git checkout main && git branch -D feature/v5-cleanup`

---

## 想定リスクと緩和策

| Phase | リスク | 緩和策 |
|-------|-------|-------|
| 1 | 削除ファイル参照漏れ | rg 事前検証 + 各 commit 後 jest |
| 2 (B-3) | TypeScript import エラー | tsc --noEmit + jest pattern |
| 2 (B-1) | bash source path 解決失敗 | $(dirname "$0") 使用 + smoke test |
| 3 | git mv で履歴喪失 | git mv 使用（cp+rm 禁止）、git log --follow で履歴確認 |
| 4 | hook silent fail | __tests__ 必須、smoke test、本物 stdin で検証 |

---

## Codex に査読してほしい点

1. Phase 順序の妥当性（高リスク後置で良いか）
2. 各 commit 粒度の妥当性（atomic か）
3. rollback 計画の網羅性
4. 各 phase 検証コマンドの過不足
5. 他人ユーザーへの影響評価の漏れ
6. B-2 (guard-base) の実装方針詳細不足
7. CI 影響（GitHub Actions が壊れないか）
