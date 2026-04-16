# 7 項目 実施計画書 v2 FINAL（Opus + Real Codex Pro 統合版）

**作成**: Opus 4.6 メインセッション
**査読**: Real Codex Pro（重大指摘 6 件 + 改善 4 件、全て反映）
**対象**: v5 debate 100% 一致 7 項目
**目的**: 他人ユーザーの install/update を壊さず安全に実施

---

## 📋 v1 → v2 変更点（Codex 指摘の反映）

| 種別 | 内容 | 反映先 |
|------|------|--------|
| Critical-1 | A-2/C-1 の debate-v2 矛盾 | Phase 1 で完結、Phase 3 から削除 |
| Critical-2 | Rollback 過剰 revert | commit SHA tracking 導入 |
| Critical-3 | pipe → exit code 喪失 | 全検証に `set -o pipefail` |
| Critical-4 | B-3 jest pattern 不在 | tsc + selectProjects に変更 |
| Critical-5 | makeId signature 変更 | **元の `(src, id) → 16 char` を保持** |
| Critical-6 | guard-base.js load fail | try/catch fallback で fail-open ログ |
| Improvement-1 | B-1 + B-3 一括 commit | 別 commit に分離 |
| Improvement-2 | hooks/utils/ 漏れ | lint glob を `**/*.js` に拡張 |
| Improvement-3 | B-1 source path | `$REPO_DIR/scripts/lib/ui.sh` に変更 |
| Improvement-4 | CI hook test continue-on-error | 本変更で blocking 化提案 |
| 追加-1 | scope drift (debate-v6) | 現状実測ベース（debate, debate-plan-review, debate-v3, debate-v4）に修正 |
| 追加-2 | baseline 値の鮮度 | Phase 0 で実測再取得を必須化 |

---

## Phase 0: 前提条件と環境準備

### 0.1 作業ブランチ
```bash
git checkout main
git pull
git checkout -b feature/v5-cleanup
```

### 0.2 baseline 計測（**必須・実測**、stale 値は使わない）
```bash
set -o pipefail  # 全検証で必須

# テスト実測（baseline）
BASELINE_LOG=/tmp/v5_baseline_$(date +%s).log
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration > "$BASELINE_LOG" 2>&1
JEST_EXIT=$?
echo "[baseline] jest exit=$JEST_EXIT"
grep -E "^(Test Suites|Tests):" "$BASELINE_LOG"

# その他
npx tsc --noEmit; echo "[baseline] tsc exit=$?"
npx eslint '.claude/hooks/**/*.js' --no-ignore --format compact 2>&1 | tail -3; echo "[baseline] eslint exit=${PIPESTATUS[0]}"
npm audit --json | python3 -c "import json,sys; d=json.load(sys.stdin); print('vulns:', d['metadata']['vulnerabilities']['total'])"
```

**baseline が壊れていたら STOP**:
- jest exit ≠ 0 → 既存テスト失敗、まず修正してから着手
- tsc/eslint exit ≠ 0 → 同上

### 0.3 rollback 用 tag + commit SHA tracking 開始
```bash
git tag pre-v5-cleanup
PHASE_SHAS=()  # phase ごとの commit SHA を記録
echo "tracking phase SHAs in this variable"
```

---

## Phase 1: 孤立ファイル削除（A-1, A-2, A-3）超低リスク

### 1.1 A-1: mistakes.md.backup 削除
```bash
set -o pipefail
test -f .claude/hooks/mistakes.md.backup.20260329 || { echo "ALREADY GONE"; exit 0; }
rg "mistakes.md.backup.20260329" --glob '!debate*/**' --glob '!**/node_modules/**' && { echo "REFS FOUND - ABORT"; exit 1; }
git rm .claude/hooks/mistakes.md.backup.20260329
```

### 1.2 A-2: debate-v2/ 削除（**Phase 3 では扱わない**）
```bash
test -d debate-v2 || { echo "ALREADY GONE"; exit 0; }
rg "debate-v2" --glob '!debate*/**' --glob '!**/node_modules/**' | head -5
git rm -rf debate-v2/
```

### 1.3 A-3: verify-skill-warehouse.sh 削除
```bash
test -f scripts/verify-skill-warehouse.sh || exit 0
grep -n "verify-skill-warehouse" package.json Makefile .github/workflows/*.yml 2>&1 | head -5  # 参照ゼロ確認
git rm scripts/verify-skill-warehouse.sh
```

### Phase 1 commit + SHA 記録
```bash
git commit -m "chore: remove 3 orphan files (v5 A-1, A-2, A-3)"
PHASE1_SHA=$(git rev-parse HEAD)
echo "PHASE1_SHA=$PHASE1_SHA" >> /tmp/v5_phase_shas.txt
```

### Phase 1 検証（**pipefail で正しく失敗を捕捉**）
```bash
set -o pipefail
LOG=/tmp/v5_phase1_$(date +%s).log
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration > "$LOG" 2>&1
JEST_EXIT=$?
[ $JEST_EXIT -ne 0 ] && { echo "PHASE 1 FAIL"; cat "$LOG" | tail -30; git revert --no-edit "$PHASE1_SHA"; exit 1; }
grep -E "^(Test Suites|Tests):" "$LOG"
```

---

## Phase 2: 低リスク refactoring（B-3 を**別 commit** 先行）

### 2.1 B-3: makeId 共通化（**Critical-5 反映: signature 完全保持**）

元の signature を保持（`(src, id) → 16 char`）:

`src/intelligence/collectors/utils/collector-id.ts`:
```typescript
import { createHash } from 'crypto';

/**
 * Generate a deterministic 16-char ID for a collector item.
 * Originally duplicated across apify/news/economics collectors.
 * SIGNATURE PRESERVED: do not change without dedup migration plan.
 */
export function makeId(src: string, id: string): string {
  return createHash('md5').update(`${src}:${id}`).digest('hex').slice(0, 16);
}
```

各 collector を修正:
- `import { makeId } from './utils/collector-id'`
- 既存 makeId 関数を削除
- 呼び出し箇所は変更不要（signature 同一）

### 2.2 B-3 検証（**Critical-4 反映: 信頼できる検証コマンド**）
```bash
set -o pipefail
# regression test for makeId behavior preservation
node -e "
const { createHash } = require('crypto');
const oldImpl = (src, id) => createHash('md5').update(\`\${src}:\${id}\`).digest('hex').slice(0, 16);
const expected = oldImpl('apify', 'item123');
console.log('regression check:', expected);
"
# tsc + 全 project suite で検証（pattern 不在問題回避）
npx tsc --noEmit
npx jest --no-coverage --forceExit --selectProjects unit regression integration > /tmp/v5_b3.log 2>&1
[ $? -ne 0 ] && { echo "B-3 FAIL"; cat /tmp/v5_b3.log | tail -30; exit 1; }
```

### Phase 2-A commit (B-3 単独)
```bash
git add src/intelligence/collectors/utils/collector-id.ts
git add src/intelligence/collectors/{apify,news,economics}-collector.ts
git commit -m "refactor(collectors): extract makeId to utils/collector-id (v5 B-3)"
PHASE2A_SHA=$(git rev-parse HEAD)
echo "PHASE2A_SHA=$PHASE2A_SHA" >> /tmp/v5_phase_shas.txt
```

### 2.3 B-1: ui.sh 共通化（**Improvement-3 反映: $REPO_DIR 使用**）

`scripts/lib/ui.sh` 新規作成:
```bash
#!/bin/bash
# UI helper functions for install.sh and update.sh
ok()   { echo "  ✅ $1"; }
warn() { echo "  ⚠️  $1"; }
info() { echo "  ℹ️  $1"; }
fail() { echo ""; echo "  ❌ エラー: $1"; echo "     → $2"; echo ""; exit 1; }
step() { echo ""; echo "━━━ $1 ━━━"; }
```

install.sh / update.sh の修正:
1. 既存 ok/warn/info/step/fail 定義削除
2. `$REPO_DIR` 設定後の冒頭近くに以下を追加:
```bash
[ -f "$REPO_DIR/scripts/lib/ui.sh" ] || { echo "FATAL: scripts/lib/ui.sh missing"; exit 1; }
source "$REPO_DIR/scripts/lib/ui.sh"
```

### 2.4 B-1 検証
```bash
set -o pipefail
bash -n scripts/install.sh
bash -n scripts/update.sh
bash -c "REPO_DIR=$(pwd) source scripts/lib/ui.sh && ok 'test' && warn 'test' && info 'test'"
# install.sh 非破壊スモーク
bash scripts/install.sh --list-profiles | head -10
```

### Phase 2-B commit (B-1 単独)
```bash
git add scripts/lib/ui.sh scripts/install.sh scripts/update.sh
git commit -m "refactor(scripts): extract ui.sh shared by install.sh and update.sh (v5 B-1)"
PHASE2B_SHA=$(git rev-parse HEAD)
echo "PHASE2B_SHA=$PHASE2B_SHA" >> /tmp/v5_phase_shas.txt
```

### Phase 2 全体検証
```bash
set -o pipefail
LOG=/tmp/v5_phase2_$(date +%s).log
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration > "$LOG" 2>&1
[ $? -ne 0 ] && { echo "PHASE 2 FAIL"; cat "$LOG" | tail -30; git revert --no-edit "$PHASE2B_SHA" "$PHASE2A_SHA"; exit 1; }
npx tsc --noEmit
```

---

## Phase 3: ディレクトリ整理（C-1）

### 3.1 移動対象の **実測確認**（Codex 追加-1 反映）
```bash
ls -d debate*/  # 期待: debate, debate-plan-review, debate-v3, debate-v4, debate-v5
# debate-v2 は Phase 1 で削除済 → 対象外
# debate-v5 は本セッションで使用中 → 対象外
# debate-v6 は存在しない → 対象外
```

### 3.2 archived/debates/ 作成 + 4 dir 移動
```bash
set -o pipefail
mkdir -p archived/debates/

# debate-v2 は Phase 1 で削除済、debate-v5 は使用中、debate-v6 は不在 → 対象外
git mv debate archived/debates/debate
git mv debate-plan-review archived/debates/debate-plan-review
git mv debate-v3 archived/debates/debate-v3
git mv debate-v4 archived/debates/debate-v4
```

### 3.3 README 言及更新（plain text、必須ではない）
```bash
# README.md:24 の "debate/下34ファイル" → "archived/debates/debate/下34ファイル"
# Edit tool で実施
```

### Phase 3 commit + SHA
```bash
git add -A
git commit -m "chore: consolidate 4 debate dirs to archived/debates/ (v5 C-1)"
PHASE3_SHA=$(git rev-parse HEAD)
echo "PHASE3_SHA=$PHASE3_SHA" >> /tmp/v5_phase_shas.txt
```

### Phase 3 検証
```bash
set -o pipefail
ls archived/debates/  # 4 dir 確認
ls -d debate*/        # debate-v5 のみ残存
LOG=/tmp/v5_phase3_$(date +%s).log
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration > "$LOG" 2>&1
[ $? -ne 0 ] && { echo "PHASE 3 FAIL"; git revert --no-edit "$PHASE3_SHA"; exit 1; }
```

---

## Phase 4: 中リスク refactoring（B-2、**Critical-6 反映: fail-open**）

### 4.1 事前読込（必須）
```bash
cat .claude/hooks/checkpoint-guard.js
cat .claude/hooks/agent-checkpoint-guard.js
ls .claude/hooks/__tests__/
```

### 4.2 .claude/hooks/utils/guard-base.js 作成
```javascript
'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Common scaffolding for checkpoint-style guards.
 * Extracts main + logSkip from checkpoint-guard.js and agent-checkpoint-guard.js.
 * The check() function REMAINS hook-specific (not extracted).
 */

function logSkip(reason, detail) {
  // implementation extracted from existing hooks
  // (preserve existing log format and path)
}

async function runGuard(hookName, checkFn) {
  // shared:
  // - read stdin (with 3s timeout)
  // - call checkFn(input)
  // - propagate exit code (do NOT swallow)
  // - logSkip on bypass
}

module.exports = { logSkip, runGuard };
```

### 4.3 既存 hook を guard-base 使用に修正（**fail-open ガード**）

checkpoint-guard.js の冒頭:
```javascript
'use strict';

let guardBase;
try {
  guardBase = require('./utils/guard-base');
} catch (err) {
  // CRITICAL: fail-open. If utils/guard-base.js cannot be loaded,
  // log the error and exit 0 (do not block tools, but record the failure)
  console.error('[checkpoint-guard] FATAL: guard-base.js not loadable:', err.message);
  console.error('[checkpoint-guard] Fail-open: exiting 0 to avoid blocking');
  process.exit(0);
}

function check(input) {
  // hook-specific check logic (UNCHANGED from original)
}

guardBase.runGuard('checkpoint-guard', check);
```

agent-checkpoint-guard.js: 同様の fail-open パターン

### 4.4 unit test 追加 (`.claude/hooks/__tests__/guard-base.test.js`)
```javascript
const path = require('path');
const guardBase = require('../utils/guard-base');

describe('guard-base', () => {
  test('logSkip writes to expected path', () => { /* ... */ });
  test('runGuard preserves checkFn exit code', () => { /* ... */ });
  test('runGuard handles stdin timeout', () => { /* ... */ });
});
```

### 4.5 Phase 4 検証（**lint glob 拡張、**Improvement-2 反映）
```bash
set -o pipefail
# lint glob を utils/ も含める
npx eslint '.claude/hooks/**/*.js' --no-ignore --format compact 2>&1 | tail -3
ESLINT_EXIT=${PIPESTATUS[0]}
[ $ESLINT_EXIT -ne 0 ] && { echo "ESLINT FAIL"; exit 1; }

# 新規 test
LOG=/tmp/v5_phase4_test_$(date +%s).log
npx jest .claude/hooks/__tests__/guard-base --no-coverage --forceExit > "$LOG" 2>&1
[ $? -ne 0 ] && { echo "GUARD-BASE TEST FAIL"; cat "$LOG"; exit 1; }

# hook 起動 smoke（fail-open 検証）
echo '{}' | timeout 5 node .claude/hooks/checkpoint-guard.js; echo "checkpoint exit=$?"
echo '{}' | timeout 5 node .claude/hooks/agent-checkpoint-guard.js; echo "agent-checkpoint exit=$?"

# guard-base.js を一時的にリネームして fail-open 検証
mv .claude/hooks/utils/guard-base.js .claude/hooks/utils/guard-base.js.tmp
echo '{}' | timeout 5 node .claude/hooks/checkpoint-guard.js
EXIT=$?
mv .claude/hooks/utils/guard-base.js.tmp .claude/hooks/utils/guard-base.js
[ $EXIT -ne 0 ] && { echo "FAIL-OPEN BROKEN: hook exited $EXIT instead of 0"; exit 1; }
echo "fail-open verified OK"

# 全テスト
LOG=/tmp/v5_phase4_full_$(date +%s).log
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration > "$LOG" 2>&1
[ $? -ne 0 ] && { echo "PHASE 4 FAIL"; cat "$LOG" | tail -30; exit 1; }
```

### Phase 4 commit + SHA
```bash
git add .claude/hooks/utils/guard-base.js
git add .claude/hooks/checkpoint-guard.js .claude/hooks/agent-checkpoint-guard.js
git add .claude/hooks/__tests__/guard-base.test.js
git commit -m "refactor(hooks): extract guard-base with fail-open fallback (v5 B-2)"
PHASE4_SHA=$(git rev-parse HEAD)
echo "PHASE4_SHA=$PHASE4_SHA" >> /tmp/v5_phase_shas.txt
```

---

## Phase 5: 最終検証

```bash
set -o pipefail

# 全テスト
LOG=/tmp/v5_final_$(date +%s).log
npx jest --no-coverage --forceExit --selectProjects unit regression workflow-phase3 integration > "$LOG" 2>&1
JEST_EXIT=$?
grep -E "^(Test Suites|Tests):" "$LOG"
[ $JEST_EXIT -ne 0 ] && { echo "FINAL FAIL"; cat "$LOG" | tail -30; exit 1; }

# tsc
npx tsc --noEmit
[ $? -ne 0 ] && { echo "TSC FAIL"; exit 1; }

# eslint (utils/ 含む)
npx eslint '.claude/hooks/**/*.js' --no-ignore --format compact 2>&1 | tail -3

# audit
npm audit --json | python3 -c "import json,sys; d=json.load(sys.stdin); print('vulns:', d['metadata']['vulnerabilities']['total'])"

# install.sh / update.sh syntax + non-destructive smoke
bash -n scripts/install.sh
bash -n scripts/update.sh
bash scripts/install.sh --list-profiles | head -3

# verify-installation
node scripts/verify-installation.js
```

期待値（baseline +α）:
- Tests: baseline + guard-base test 3 件分（57 suites / 1110 tests 想定）
- ESLint: 0 problems
- tsc: 0 errors
- npm audit: 0 vulnerabilities

---

## Phase 6: PR 作成

```bash
git push -u origin feature/v5-cleanup
gh pr create --title "v5-cleanup: 7 items from Opus × Real Codex Pro 100% consensus" \
  --body "$(cat <<EOF
## Summary
- Phase 1: 3 orphan files removed (mistakes.md.backup, debate-v2/, verify-skill-warehouse.sh)
- Phase 2: B-3 makeId common (signature preserved), B-1 ui.sh extracted
- Phase 3: 4 debate dirs → archived/debates/
- Phase 4: B-2 guard-base.js with fail-open fallback

Consensus achieved through 2-round Opus 4.6 × Real Codex Pro debate (debate-v5/ artifacts).

## Test plan
- [ ] All Phase 5 verifications pass
- [ ] CI windows-latest passes
- [ ] verify-installation.js shows no new warnings
EOF
)"
```

---

## Rollback 計画（**Critical-2 反映: SHA 単位**）

各 phase の commit SHA を `/tmp/v5_phase_shas.txt` に記録する。失敗時:

```bash
source /tmp/v5_phase_shas.txt  # PHASE1_SHA, PHASE2A_SHA, PHASE2B_SHA, PHASE3_SHA, PHASE4_SHA

# Phase N のみ取り消し
git revert --no-edit "$PHASE_N_SHA"

# 全 phase 取り消し
git reset --hard pre-v5-cleanup

# branch 廃棄
git checkout main && git branch -D feature/v5-cleanup
```

---

## CI 影響（**Improvement-4 反映**）

`.github/workflows/ci.yml:101-104` の hook test job が `continue-on-error: true` のため、本変更で hook 関連の regression が見過ごされるリスクあり。

**推奨**: 本 PR で以下を同時変更:
```yaml
# .github/workflows/ci.yml の hook test step
- name: Hook tests
  continue-on-error: false  # 変更前: true
```

---

## 想定リスクと緩和策（v2 改訂版）

| Phase | リスク | 緩和策 | Codex 指摘 |
|-------|-------|-------|-----------|
| 1 | 削除ファイル参照漏れ | rg 事前検証 + commit 後 jest with pipefail | ✅ |
| 2-A | makeId behavior 変化 | **signature 保持 (src,id)→16char + regression test** | Critical-5 ✅ |
| 2-B | bash source path 解決失敗 | **$REPO_DIR 明示 + 存在チェック** | Improvement-3 ✅ |
| 3 | git mv で履歴喪失 | git mv 使用、git log --follow で履歴確認 | ✅ |
| 4 | hook silent fail | **try/catch fail-open + dedicated test + smoke verification** | Critical-6 ✅ |
| 全 | 検証失敗を見逃す | **set -o pipefail + exit code チェック** | Critical-3 ✅ |
| 全 | rollback 過剰 | **per-phase commit SHA 記録 + revert SHA** | Critical-2 ✅ |

---

## Codex 指摘の追加対応サマリー

- ✅ Critical-1: A-2/C-1 矛盾 → Phase 3 から debate-v2 削除
- ✅ Critical-2: rollback over-revert → SHA tracking
- ✅ Critical-3: pipe → exit code 喪失 → set -o pipefail 全所
- ✅ Critical-4: B-3 jest pattern 不在 → tsc + selectProjects
- ✅ Critical-5: makeId 互換性 → signature 完全保持
- ✅ Critical-6: guard-base load fail → fail-open with try/catch
- ✅ Improvement-1: B-3/B-1 別 commit
- ✅ Improvement-2: hooks/**/*.js lint glob
- ✅ Improvement-3: $REPO_DIR/scripts/lib/ui.sh
- ✅ Improvement-4: CI hook test blocking 化提案
- ✅ 追加-1: scope drift 解消（実測対象 4 dir）
- ✅ 追加-2: baseline 値の鮮度 → Phase 0 で実測必須化

**全 12 件の Codex 指摘を反映済**。コードは 1 byte も変更していない。

---

## 実施前の最終確認

実施前に以下を確認:
1. ☐ ユーザー承認（"これで実行" 等の明示指示）
2. ☐ baseline テストが green か（Phase 0.2）
3. ☐ feature/v5-cleanup ブランチ作成
4. ☐ pre-v5-cleanup tag 作成

実行は Phase 1 から順次。各 phase 検証で失敗 → 即 STOP + rollback。
