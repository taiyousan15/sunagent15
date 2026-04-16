## CRITICAL issues (must fix before execution)

### 1) Phase collision: `A-2` deletes `debate-v2/`, then `C-1` tries to move it
- Evidence:
  - Plan `A-2` explicitly deletes directory: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:54-65` (`git rm -rf debate-v2/`).
  - Plan `C-1` later still includes `git mv debate-v2 archived/debates/debate-v2`: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:196`.
  - Same section acknowledges it is already deleted (`...スキップ`): `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:201`.
- Why it matters:
  - The execution block is internally contradictory. If run as-is in a strict shell/scripted context, Phase 3 can hard-fail on `git mv` of a non-existent path.
- Proposed fix:
  - Remove one of the actions. Preferred: keep `debate-v2/` handling entirely in Phase 3 move list, or delete in Phase 1 and remove the Phase 3 `git mv` command completely.
  - Update the stated directory count accordingly in the same phase section.

### 2) Phase 4 rollback command reverts more than Phase 4
- Evidence:
  - Rollback section says Phase 4 rollback is `git revert HEAD~3..HEAD`: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:341`.
  - Planned commit sequence is Phase 1 (`:81-86`), Phase 2 (`:167-172`), Phase 3 (`:210-214`), Phase 4 (`:288-292`).
- Why it matters:
  - `HEAD~3..HEAD` reverts the last 3 commits, not only Phase 4. That undoes already-validated earlier phases.
- Proposed fix:
  - Record commit SHAs per phase and revert exact commit(s), e.g. `git revert <phase4_commit_sha>`.
  - Add explicit rollback commands for every phase, including Phase 3, with commit-SHA placeholders.

### 3) Verification commands can report “pass” while commands actually fail
- Evidence:
  - Multiple checks pipe through `grep`/`tail`: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:19-23`, `:90`, `:176-179`, `:300-307`.
  - Pipeline form masks command exit code unless `pipefail` is enabled.
  - Observed now: the same Jest pipeline outputs failures (`Test Suites: 2 failed...`, `Tests: 1 failed...`) yet exits successfully because `grep` matches.
- Why it matters:
  - A broken state can be treated as “verified,” defeating every phase gate and rollback trigger.
- Proposed fix:
  - Add `set -o pipefail` to all verification snippets using pipes.
  - Or split into two-step checks: run command first (preserve exit code), then parse logs for summary display.

### 4) Phase 2 `B-3` verification command currently fails even before refactor quality is evaluated
- Evidence:
  - Plan command: `npx jest --testPathPattern=intelligence/collectors ...`: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:132`.
  - Current run exits with `No tests found, exiting with code 1`.
- Why it matters:
  - This phase can fail regardless of implementation quality, forcing ad-hoc bypasses and weakening confidence in the gate.
- Proposed fix:
  - Replace with reliable current checks: `npx tsc --noEmit` plus existing project suites (`--selectProjects unit regression integration`), or add dedicated collector unit tests first.

### 5) `B-3` shared `makeId` sample changes behavior (signature + hash length)
- Evidence:
  - Plan sample proposes `makeId(input: string)` returning full md5 hex: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:110-120`.
  - Actual collectors currently use `makeId(src, id)` and truncate to 16 chars:
    - `src/intelligence/collectors/apify-collector.ts:16-18`
    - `src/intelligence/collectors/news-collector.ts:9-11`
    - `src/intelligence/collectors/economics-collector.ts:9-11`
  - Dedup uses `item.id` as key: `src/intelligence/aggregator.ts:23-31`.
- Why it matters:
  - Changing ID algorithm/length changes dedup identity behavior and can introduce unexpected duplicate handling changes.
- Proposed fix:
  - Preserve exact current contract in shared util (`makeId(src: string, id: string)` with `${src}:${id}` and `.slice(0, 16)`).
  - Add a regression test vector for a few fixed `(src,id)` pairs before/after extraction.

### 6) `B-2` has no defined fallback if `guard-base.js` cannot be loaded
- Evidence:
  - Plan only states replacing with `require('./utils/guard-base')`: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:269-273`.
  - Hook launcher checks only top-level file existence, then executes node:
    - `.claude/settings.json:183`
    - `.claude/settings.json:193`
  - Installation verifier also checks only referenced hook file paths exist, not transitive requires: `scripts/verify-installation.js:91-99`.
  - Node module load failure is fatal at require-time (`MODULE_NOT_FOUND`), before hook main/fail-open logic runs.
- Why it matters:
  - A missing/misresolved `guard-base.js` can disable checkpoint enforcement behavior in production usage.
- Proposed fix:
  - In each hook entrypoint, wrap `require('./utils/guard-base')` in explicit `try/catch` and fail-open with a clear error log.
  - Add dedicated load tests for both hook entrypoints, not only `guard-base` itself.

## IMPROVEMENTS (should add)

### 1) Split Phase 2 into two atomic commits (`B-3` and `B-1`)
- Evidence:
  - Phase 2 commit currently bundles unrelated TS collector refactor + shell script refactor: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:167-172`.
- Why it matters:
  - Debugging/reverting one concern currently requires touching both domains.
- Proposed fix:
  - Commit `B-3` first (collector util extraction), verify, then separate commit for `B-1` (`scripts/lib/ui.sh` and shell edits).

### 2) Expand lint scope for `B-2` new file location
- Evidence:
  - Plan lint checks only top-level hook JS: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:20`, `:178`, `:303` (`.claude/hooks/*.js`).
  - `B-2` creates `.claude/hooks/utils/guard-base.js`: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:237`.
- Why it matters:
  - Newly introduced utility code can bypass planned lint gates.
- Proposed fix:
  - Change lint target to `.claude/hooks/**/*.js` (or include both top-level and utils explicitly).

### 3) Clarify and harden `B-1` source path strategy
- Evidence:
  - Plan proposes `source "$(dirname "$0")/lib/ui.sh"`: `debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:157`.
  - Scripts already compute repo root (`REPO_DIR`) early:
    - `scripts/install.sh:16`
    - `scripts/update.sh:9`
  - `npm run setup`/`update` execute these via bash scripts from package scripts:
    - `package.json:7-9`
- Why it matters:
  - For `npm run setup` and direct `bash scripts/install.sh`, this path is fine; using `REPO_DIR` is more explicit and reduces ambiguity in unusual invocation forms.
- Proposed fix:
  - Source via `source "$REPO_DIR/scripts/lib/ui.sh"` and keep one preflight existence check with clear error (`fail`) if missing.
  - Add a lightweight non-destructive validation path (`--list-profiles` for install) in phase verification.

### 4) CI currently does not enforce hook test failures
- Evidence:
  - CI hook-test step is `continue-on-error: true`: `.github/workflows/ci.yml:101-104`.
- Why it matters:
  - `B-2` is hook-critical; CI can go green even when new hook tests fail.
- Proposed fix:
  - Make hook-test job blocking for this change set, or add a separate required job specifically for checkpoint/agent-checkpoint hooks.

## AGREE points (no change needed)

1. High-risk-later ordering is directionally correct: placing `B-2` (hook refactor) after low-risk deletions/refactors is sensible (`debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:225-292`).
2. `A-3` pre-check pattern is good: it explicitly checks `package.json`, `Makefile`, and `.github/workflows` before deletion (`debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:69-73`).
3. For the specific check “does `install.sh` source approach work for `npm run setup` and direct bash?”: yes, the proposed `dirname "$0"` method is compatible with the two requested paths, based on invocation points in `package.json:7-9` and current script structure in `scripts/install.sh:16` / `scripts/update.sh:9`.

### Explicit answers to the 7 focus questions
1. Phase order validity: mostly yes, but blocked by the `A-2` vs `C-1` conflict (Critical #1).
2. Commit granularity: not fully atomic (Phase 2 bundles unrelated concerns).
3. Rollback completeness: not complete/correct (Critical #2).
4. Verification command sufficiency: insufficient and can mask failures (Critical #3/#4).
5. Impact on other users: gap exists for install/hook reliability checks (Critical #6, Improvement #3/#4).
6. `B-2` implementation detail sufficiency: insufficient around load-failure behavior (Critical #6).
7. CI impact (`.github/workflows`): no direct path break detected, but hook validation is non-blocking and could miss regressions (Improvement #4).

## Additional concerns Opus did not list

1. Scope drift vs context doc: round-2 rebuttal notes expanded move target count (`debate-v5/opus_round2_rebuttals.md:94`), while this plan uses a different scope and even references `debate-v6` exclusion despite current tree showing no `debate-v6` directory (`debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:193-201`).
2. Baseline expectation values appear stale relative to current repository state: plan expects `57/1107` (`debate-v5/IMPLEMENTATION_PLAN_v1_opus.md:26-30`), while current execution shows `57 total suites / 1106 total tests` with failures present.
3. Cross-reference coverage missed in plan text: `B-2` safety depends on runtime hook invocation wiring (`.claude/settings.json:183,193`) and installation verifier limitations (`scripts/verify-installation.js:91-99`), but these dependencies are not referenced in Phase 4 design/verification steps.
