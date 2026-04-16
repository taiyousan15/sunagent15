### [Medium] Partial: Opus Finding 1 (`git rm --cached` testability)
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v3/real/round08_opus.md:4
- Evidence: I agree a CI regression guard is needed, but it is not implemented now; workflow files contain no `git ls-files`/tracked-artifact gate.
- Impact: Ignored artifacts can be re-tracked without an automated failure signal.
- Fix: Add a CI step that fails when forbidden tracked paths appear.

### [High] Disagree: Opus Finding 2 overstates merge coverage
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v3/real/round08_opus.md:11
- Evidence: Mandatory verification ran: `grep -E '^\s+test\(' src/utils/settings-merge.test.ts | wc -l` => **15** (correct). But runtime uses `scripts/update-settings.js` (`scripts/install.sh:434,437`), and those script branches are not directly tested.
- Impact: “covered” is too strong; installer regressions can slip through.
- Fix: Test the runtime script path (or unify logic into one tested module).

### [Medium] Agree: Opus Finding 3 (compose test method gap)
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v3/real/round08_opus.md:18
- Evidence: CI runs Jest/hook tests only (`.github/workflows/ci.yml:97-103`); no compose smoke. Existing verifier checks existence only (`scripts/phase1/verify.sh:129-133`).
- Impact: Compose breakage may be found only after merge/deploy.
- Fix: Add per-file compose smoke (`config`, `up --wait`, `down -v`) in CI.

### [Medium] Unique to Codex: CI uses `--forceExit`
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.github/workflows/ci.yml:98
- Evidence: CI and CD both invoke Jest with `--forceExit` (`.github/workflows/cd.yml:40`).
- Impact: Open handles/leaks can be hidden, reducing signal quality and increasing flake risk.
- Fix: Remove `--forceExit`, add `--detectOpenHandles`, and fail on leaks.

### [Low] Unique to Codex: shallow assertion in merge tests
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/src/utils/settings-merge.test.ts:136
- Evidence: `freshMerge` non-`mcpServers` test checks only `toBeDefined()`, not exact value integrity.
- Impact: Partial regressions can pass while behavior changes.
- Fix: Assert exact object equality and immutability snapshot.

### [Low] Opus claim verification status
- File: /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v3/real/round08_opus.md:12
- Evidence: No wrong-count failure for the explicit count claim: observed value is 15. The broader `57 suites / 1107 tests` statement is not demonstrated by Opus evidence in this round file.
- Impact: Numeric confidence is mixed: local count verified, suite-wide total not evidenced.
- Fix: Include raw Jest summary output/artifact when asserting suite totals.
