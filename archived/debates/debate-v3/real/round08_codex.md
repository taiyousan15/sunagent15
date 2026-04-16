### [High] Installer merge logic is not covered by the 15 tests
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/update-settings.js:24
- Evidence: Runtime installer uses this JS script (`scripts/install.sh:434,437`), but tests target TS utility import only (`src/utils/settings-merge.test.ts:1`). Mandatory count command shows 15 tests only in that TS file.
- Impact: Setup regressions can pass CI while breaking real `npm run setup` behavior.
- Fix: Move merge logic to one shared module and test that module plus CLI integration.

### [Medium] Backup/atomic-write/path-rewrite branches have no direct tests
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/update-settings.js:44
- Evidence: Script contains backup rotation (`:65-83`), path rewriting (`:130-146`), and atomic rename write (`:193-195`), but no tests reference `update-settings.js` under `tests/`.
- Impact: Failures in backup safety or path rewriting are likely to be detected only after user settings are touched.
- Fix: Add temp-dir integration tests covering backup failure, FIFO cleanup, path rewrite, and atomic write behavior.

### [Medium] CI reliability is weakened by forced Jest exit
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.github/workflows/ci.yml:98
- Evidence: CI runs `npx jest ... --forceExit`; CD also does (`.github/workflows/cd.yml:40`). `--forceExit` can hide open-handle leaks.
- Impact: Flaky async/resource-leak tests can appear green, reducing trust in test outcomes.
- Fix: Remove `--forceExit`, add `--detectOpenHandles`, and fail on leaks; keep serial mode only where contention is proven.

### [Medium] Docker compose changes are not smoke-tested in CI
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.github/workflows/ci.yml:97
- Evidence: CI executes Jest/hook tests only; no `docker compose` validation. Existing verifier just checks file presence (`scripts/phase1/verify.sh:129-133`).
- Impact: Broken compose wiring can merge undetected and fail only at deployment/runtime.
- Fix: Add CI matrix smoke tests for each compose file: `docker compose -f <file> config`, `up -d --wait`, then `down -v`.

### [Low] Assertion depth is weak in one merge test
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/src/utils/settings-merge.test.ts:136
- Evidence: `freshMerge` non-`mcpServers` preservation test asserts only `toBeDefined()`, not exact value or immutability.
- Impact: Structural regressions can slip through while test still passes.
- Fix: Assert full object equality (e.g., exact `hooks` payload) and add input snapshot immutability check.
