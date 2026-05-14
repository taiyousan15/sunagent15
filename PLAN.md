# PLAN: memory/agents Template/Runtime Separation (Design B)

**Status**: Round 3 revised — final round of claudex review 20260512-135947-1b9eda (max rounds reached after this revision)
**Design ref**: `doc/CODEXレビュー/2026-05-07_202512_memory_agents_separation_design.md`
**Initial review**: `doc/CODEXレビュー/2026-05-07_195056_distribution_runtime_files_review.md` (NO-GO → this plan is the GO path)
**Current branch**: `chore/mistakes-pattern15-baseline-diff` (PR #352 Draft, will branch a new feature branch for this work)

---

## Goal

Split agent stats into three layers:
- (a) **Tracked generic template** `.claude/memory/agents/_template.yaml` — schema skeleton for new agents.
- (b) **Tracked per-agent baseline manifest** `.claude/memory/agents-baseline.yaml` — single distilled file holding per-agent calibration (omega_metrics, dependency lists, completion_probability, specialization) extracted from the 51 legacy stats files (Round 3 H1 resolution).
- (c) **Ignored personal runtime** `.claude/agent-memory/agents/${agent}-stats.yaml` — accumulating personal stats.

The 51 tracked `*-stats.yaml` are not "all-zero stubs" — they contain per-agent baseline calibration that **must be preserved** in the tracked baseline manifest before deletion. Backward compatibility for existing users is guaranteed by (1) the baseline manifest surviving PR-β, (2) proactive migration in every install/update entrypoint, and (3) a documented reconcile command for rollback (Round 3 M1).

---

## Implementation Plan (12 steps)

1. **Add template** — Write `.claude/memory/agents/_template.yaml` mirroring the existing stub schema (agent_name placeholder, totals=0, omega_metrics/learning_metrics/metadata defaults). Tracked in git as the single source of truth. `_template.yaml` filename ensures `getAgentNames()` filter (`endsWith('-stats.yaml')`) ignores it. **SSoT drift guard**: add a Jest test that parses `_template.yaml` and asserts deep-equality with `MemoryService.recordTask`'s implicit "new agent" structure (so template and service output cannot diverge silently — addresses Round 1 M3).

   **NOTE**: full deep-equality test against `recordTask` output is intentionally deferred to OPEN-1 implementation in Step 2-3 (see Known Open Items section); the current 8 assertions cover key presence, nested structure, counter values, and placeholder convention only. Codex adversarial review (2026-05-13 NO-GO, see `doc/CODEXレビュー/2026-05-13_220000_step1-codex-review-no-go.md`) accepted via Option A — `it.skip('full deep-equality ...')` placeholder added to test file with TODO body for OPEN-1 unblocking.

2. **MemoryService.ts: options-object constructor (no positional 2nd arg)** — Change ctor to `constructor(basePath: string = '.claude/memory', opts: { runtimeBasePath?: string } = {})`. Default `opts.runtimeBasePath` is **derived from `basePath`**: if caller passes `basePath = '/tmp/test/memory'`, runtime defaults to `/tmp/test/agent-memory` (sibling directory). Hard-coded `.claude/agent-memory` only when `basePath` is the default. Update every existing `new MemoryService(...)` call site (tests + memory-report + singleton export) so fixtures honor the test path (addresses Round 1 H4).

3. **MemoryService.ts: legacy fallback read + quarantine + atomic writes + slug validation** — `loadAgentStats(name)` tries `runtimeBasePath/agents/${name}-stats.yaml` first. On **missing** OR **YAML parse error**, falls back to `basePath/agents/${name}-stats.yaml` (legacy). On parse error, **quarantine** the corrupt runtime file to `${runtimeBasePath}/agents/.corrupt/${name}-stats-${ISO_TS}.yaml` and emit a console.warn with the quarantine path (Round 1 M5). `getAgentNames()` returns the **union** of runtime + legacy directories, dedup by name. `saveAgentStats`/`recordTask` write **only** to runtime. **Product decision**: `getAgentNames()` returns agents-with-history (Round 1 M4 resolution). **Atomic writes (Round 2 H3 minimum fix)**: replace direct `fs.writeFileSync(path, content)` at lines 393 and 702 with temp-file write → fsync → rename: write to `${path}.tmp.${pid}.${Date.now()}`, fsync the fd, then `fs.renameSync(tmp, path)` (atomic on POSIX/NTFS). This prevents partial writes from corrupting runtime YAML during crashes or concurrent writes. **Per-agent interprocess lock (Round 3 H3 + Final-Round H2)**: load-update-save in `recordTask` is wrapped in a per-agent lock using `proper-lockfile` (npm package) with `${runtimeBasePath}/agents/.locks/${agentName}.lock`, 5-second acquire timeout, stale-lock detection via PID + mtime heartbeat (default 10s stale threshold). **Cache invalidation inside the locked path**: immediately after acquiring the lock, `this.agentStatsCache.delete(agentName)` and re-read the runtime file from disk before applying the update — this is the only way to prevent two `MemoryService` instances from overwriting each other's updates with stale cached values. Lock release happens in a `finally` block to guarantee release on exceptions. Migration script (`init-agent-memory.js`), `update-memory-stats.js`, and `reconcile-memory.js` acquire the same per-agent lock when touching a given agent's stats. Test cases (Step 9): concurrent recordTask with two `MemoryService` instances + interrupt scenarios + stale-lock recovery. **agentName slug validation (Round 2 M1)**: in `loadAgentStats` / `saveAgentStats` / `recordTask`, reject any `agentName` not matching `^[a-zA-Z0-9_-]+$` with an explicit error. Also `path.resolve` the final path and assert it stays within `runtimeBasePath/agents/` (defense-in-depth against future code paths that may bypass validation).

4. **Node helper `scripts/init-agent-memory.js` (with migration mode)** — ~90-line script (was 70; +20 for non-stub-filter migration and conflict resolution). Modes:
   - **`--init`** (default): ensure `${repo}/.claude/agent-memory/agents/` exists, copy `_template.yaml` into runtime with `fs.copyFileSync(src, dst, fs.constants.COPYFILE_EXCL)`. Re-runs safely (EEXIST treated as success).
   - **`--migrate-legacy`**: scan `.claude/memory/agents/*-stats.yaml`. For each legacy file:
     - If runtime sibling does NOT exist → copy legacy → runtime with COPYFILE_EXCL. **Migrate ALL legacy files** regardless of `total_tasks` value, because the legacy yaml contains per-agent baseline calibration data (e.g., `omega_metrics.performance_bounds`, `dependencies_list.tools/agents`, `completion_probability.by_complexity`, `learning_metrics.specialization.primary_category`) that the generic template does not preserve — these would be silently lost otherwise (Round 2 H1).
     - If runtime sibling DOES exist → **normalized deep-diff** the parsed YAML contents (sort keys, strip volatile fields like `last_updated` for comparison). If contents are byte-identical after normalization → skip silently. If contents differ → write a conflict-suffix copy at `${runtime}/agents/${name}-stats.legacy-${ISO_TS}.yaml` regardless of `last_updated` ordering, and emit a Check-8 warning until the user resolves. Timestamp comparison is informational only and used in the warning message (Round 2 M2 + Round 3 M3).
     - **Durable migration log (Round 3 M4)**: write each migration outcome (`migrated`, `skipped-identical`, `conflict-suffix`, `quarantined-corrupt`) to `${runtimeBasePath}/migration-${ISO_TS}.log` with file paths and reason. Check 8 reads this log to report counts.
   - **`--verify-only`**: exit 0 if template + runtime template both present, exit 1 with actionable message otherwise (used by Step 6 Check 8).
   - **agentName slug validation** when reading filenames: reject anything that doesn't match `^[a-zA-Z0-9_-]+$` (no traversal, no separators); log skipped files (Round 2 M1).
   - Cross-platform via `path.join`. Always called automatically as `--init` AND `--migrate-legacy` from installers (Step 5), so existing-user backward compat is **proactive**, not just read-on-demand (addresses Round 1 H3).

5. **Installer parity — exact entrypoint matrix (Round 3 L1)** — Invoke `node scripts/init-agent-memory.js --init --migrate-legacy` from every entrypoint that mutates `.claude/`:

| Entrypoint | Confirmed path | Role | Helper invocation timing |
|---|---|---|---|
| `scripts/install.sh` | ✅ exists | Fresh install (Unix) | After line 514 mkdir |
| `scripts/install.ps1` | ✅ exists | Fresh install (Windows) | After line 483 mkdir; also fix `-SkipVerify` to actually run verify when unset |
| `scripts/install-release.sh` | ✅ exists at repo root | Release-tarball install (Unix) | After dir setup, before verify |
| `scripts/install-release.ps1` | ✅ exists at repo root | Release-tarball install (Windows) | Same as above (PS array invocation) |
| `scripts/setup-project.sh` | ✅ exists | Project bootstrap (Unix) | After dir setup |
| `scripts/setup-project.ps1` | ✅ exists (13KB) | Project bootstrap (Windows) | After dir setup (Round 1 M2) |
| `scripts/update.sh` | ✅ exists (13KB, `npm run update`) | Update (Unix) | After pull/reset/ZIP, before verify (Round 2 H2) |
| `scripts/update.ps1` | ❌ **NOT present** | Update (Windows) | **MUST ADD in PR-α** for parity — Windows users currently have no `npm run update` path; ship a minimal `update.ps1` that pulls + invokes helper + verify |
| `scripts/quick-install.ps1` | ✅ exists (PS only, no `.sh` variant) | One-shot Windows install | After dir setup |
| `quick-install.sh` | ❌ **NOT present** at root or in scripts/ | (no Unix quick-install) | n/a (existing gap, not this PR's responsibility) |

Backup files like `install 2.sh` / `install-release 2.sh` (with space + "2") are macOS Finder duplicates — verify they are not in git via `git ls-files | grep ' 2\.'`; if tracked, untrack in a separate cleanup PR. All listed scripts fail-loud on Node helper non-zero exit. **PowerShell**: invoke with argument arrays `& node @($helper, '--init', '--migrate-legacy')` and check `$LASTEXITCODE` — never use `--%` stop-parsing (breaks variable expansion on paths with spaces / non-ASCII characters, Round 2 M3). Add a Windows CI smoke case under a path containing spaces and Japanese characters.

6. **verify-installation.js Check 8 — exit-code-safe + pre-install aware + installer-safe conflict reporting** — Add Check 8 (~35 lines) after Check 7. **Two-mode operation (Final-Round M2)**: default mode is installer-safe; an explicit `--strict` flag (also `npm run taisun:verify:strict`) escalates conflict-suffix files and divergent legacy to fatal. Conflict-suffix files in default mode are reported as informational `ok()` with a resolution hint, NOT `warn()` — because verify exit 2 is fatal for installers and a legitimate preserved-conflict state must not break install/update. Operators audit conflicts manually via `--strict` or the migration log (Step 4). Checks:
   - **Pre-install detection (Round 2 L1)**: if `.claude/agent-memory/` directory does not exist AT ALL, emit `ok("agent-memory not yet provisioned; run scripts/install.sh or npm run update")` and skip the rest of Check 8. This prevents `npm run taisun:verify` on a fresh checkout from emitting false criticals.
   - `crit()` if `.claude/memory/agents/_template.yaml` missing or unparseable (always required — it's the tracked template).
   - `crit()` if `.claude/agent-memory/` exists but `.claude/agent-memory/agents/_template.yaml` missing (post-install state is broken).
   - **`ok()` (NOT `warn()`)** if legacy `.claude/memory/agents/*-stats.yaml` are still present, with a one-line note "legacy stubs present — will be removed by PR-β; no action required". This is **critical** because verify-installation.js currently `process.exit(2)` on any warning, and install.sh treats exit 2 as fatal — emitting `warn()` during PR-α would break installs (Round 1 H1).
   - **`warn()` (justified exit 2)** only if a legacy file exists, has no runtime sibling, AND its content diverges from `_template.yaml` (i.e., has agent-specific baseline data) — recommending re-run of `init-agent-memory.js --migrate-legacy`. This is the only condition where exit 2 is justified.
   - **`ok()` in default mode** (informational, exit 0) if any `${name}-stats.legacy-${ISO_TS}.yaml` conflict-suffix files exist (Round 2 M2 + Final-Round M2), with a one-line resolution hint pointing at the migration log and `--strict` mode for audit. **`warn()` only under `--strict`** (escalates to exit 2 for explicit audit runs).

7. **update-memory-stats.js — template-safe scan** — Audit current script. Tighten the YAML scan: filter to `*-stats.yaml` (NOT `*.yaml`) and **explicitly exclude** `_template.yaml` even if it ends with `-stats.yaml` after copy (`path.basename(f) !== '_template.yaml'`). Switch read/write root to `runtimeBasePath` via `MemoryService` instance (not direct fs). Add a regression test that loads `_template.yaml` into runtime, runs the script, and asserts the template was NOT mutated (addresses Round 1 M1).

8. **agent-source path audit & rewrite + installed copies refresh (Round 3 M2)** — Two-part fix:
   - **Part A (source)**: `rg -l '\.claude/memory/agents' .claude/agent-source/` returned **10 files** referencing legacy path. Rewrite each to use `MemoryService` API or point to `.claude/agent-memory/agents/`. Add a **portability-guard CI rule** blocking any new write-reference to `.claude/memory/agents/*-stats.yaml` (read-only references to `_template.yaml` / `agents-baseline.yaml` allowed).
   - **Part B (installed copies, Round 3 M2)**: After source rewrite, installed agent prompts at `~/.claude/agents/*.md` and any project-level `.claude` symlinks still contain stale legacy refs (verified: 4 installed files at `~/.claude/agents/` reference legacy path). The helper / installer must **force-refresh installed copies** by re-running `npm run sync:agents` (or equivalent) on every install/update; check 8 scans `~/.claude/agents/*.md` for legacy refs and emits a `warn()` if any are found post-refresh. Without Part B, agents continue writing to legacy path during the soak period even after source rewrite.

9. **Integration tests** — In `tests/integration/memory.integration.test.ts`, parameterize the test fixture to write fake stats into `testRuntimeBasePath/agents/` (sibling of `testBasePath`). Update existing 30+ assertions to point at runtime path. Add new test cases:
   - (a) **Legacy fallback read** returns valid stats when only `basePath` copy exists.
   - (b) **getAgentNames union** returns runtime + legacy without duplicates.
   - (c) **Migration via recordTask**: legacy-only agent → recordTask writes to runtime, legacy untouched.
   - (d) **Corrupt runtime quarantine**: malformed runtime YAML → quarantine + fallback read succeeds.
   - (e) **Template preservation**: run `update-memory-stats.js` with template in runtime → template unchanged.
   - (f) **Options-object ctor**: `new MemoryService('/tmp/x/memory')` derives runtime to `/tmp/x/agent-memory`, NOT to `.claude/agent-memory`.
   - (g) **Atomic write under interrupt** (Round 2 H3): kill -9 the process between tmp-write and rename → original file unchanged + tmp leftover (acceptable, cleaned on next run); no partial-content target file.
   - (h) **Slug validation** (Round 2 M1): `loadAgentStats('../../etc/passwd')` throws; `saveAgentStats({agentName: 'a/b'})` throws; `recordTask('valid-name_1', ...)` succeeds.
   - (i) **Migration: full baseline preservation** (Round 2 H1): legacy yaml with non-default `omega_metrics.performance_bounds` → migrated to runtime intact; round-trip read returns identical structure.
   - (j) **Conflict-suffix resolution** (Round 2 M2): both legacy and runtime exist, legacy is newer → conflict-suffix file created; verify Check 8 emits informational note (not fatal warn) until resolved.
   - (k) **Concurrent recordTask with cache invalidation** (Final-Round H2): spin up two `MemoryService` instances pointing at the same runtime; both load stats; call recordTask serially under lock; assert that **both updates are persisted** (no lost update). Repeat with 10 concurrent calls to verify lock+cache-invalidation under contention.
   - (l) **Baseline manifest E2E seeding** (Final-Round H3): wipe `.claude/memory/agents/` AND `.claude/agent-memory/agents/`; call `recordTask('api-designer', task)`; load resulting stats; assert `omega_metrics.dependencies_list.tools` matches the manifest entry for api-designer (i.e., `[Read, Write, Edit, Grep]`), and `completion_probability.by_complexity` matches manifest values (low: 0.99, medium: 0.95, high: 0.85). This is the **PR-β blocking test** — without it, PR-β deletion is unsafe.

10. **Delete 51 tracked stubs (PR-β) — protected by tracked baseline manifest (Round 3 H1)** — Approach:
    - **In PR-α (NEW Step 1.5)**: generate and commit `.claude/memory/agents-baseline.yaml` — a single tracked file that distills per-agent calibration from all 51 legacy yaml files (omega_metrics, dependencies, completion_probability, specialization). Schema: `{ [agentName]: { omega_metrics: {...}, learning_metrics: {...}, metadata: { schema_version, omega_integration_date } } }` — only the per-agent baseline fields, NOT the volatile counters (task counts, recent_tasks, success_rate). MemoryService reads this manifest on first stats creation for a new agent so the baseline carries forward.
    - **In PR-β**: `git rm .claude/memory/agents/*-stats.yaml`. Now safe because `agents-baseline.yaml` survives — even users who skip the soak period, pull directly through `install-release.sh`, or use `quick-install.ps1` retain the baseline. The previous "CI dry-run against fixture" gate is dropped because it only proved synthetic state, not real users (Round 3 H1).
    - **Sequencing**: PR-α merges first (baseline manifest is in place from day 1) → users get runtime + helper + migration + manifest on next install → soak period (1-2 weeks recommended but no longer load-bearing) → PR-β merged. Soak is now an ergonomic preference, not a safety requirement.
    - **PR-β safety check**: CI step asserts `agents-baseline.yaml` exists and contains all 51 agent names; fails if any agent baseline is missing. This is a structural invariant test, not a fixture simulation.

11. **.gitignore comment clarification** — Edit line 58-59 to read: `# Agent runtime stats (personal, machine-specific; generated from .claude/memory/agents/_template.yaml + agents-baseline.yaml)` followed by `.claude/agent-memory/`. Bundled into PR-α.

12. **NEW: scripts/reconcile-memory.js + proper-lockfile dependency (Round 3 M1 + Final-Round M1)** — Documented rollback command for users who roll back from PR-α. **Dependency wiring**: add `proper-lockfile` (and `@types/proper-lockfile` if needed) to `package.json` dependencies + commit `package-lock.json` update. CI acceptance gate runs `npm ci && npm run test:memory` on a fresh clone to prove lockfile integrity. Script:
    - Reads `.claude/agent-memory/agents/*-stats.yaml` (runtime).
    - For each: if `.claude/memory/agents/${name}-stats.yaml` (legacy) exists, deep-merge counters (runtime wins on conflict). If legacy doesn't exist, write runtime back to legacy path so old code path can read it.
    - Exposed as `npm run reconcile:memory` (entry in package.json).
    - Documented in README + PR-α description: "If you need to roll back to a pre-α release, run `npm run reconcile:memory` BEFORE checking out the old commit; this preserves runtime stats in the legacy path that the old code reads."
    - Without this command, rollback silently forks memory history: new code wrote runtime, old code reads legacy, post-α progress becomes invisible.

---

## PR Split Strategy: **2-PR variant** (formerly "Plan B")

Renamed from "Plan B (3 PRs)" because Step 11 (gitignore comment) is a 1-line docs change with zero conflict risk — folding it into PR-α keeps the comment colocated with the template it documents. Step 10 (51 yaml deletion) stays in its own PR (PR-β) because it touches 51 files and benefits from independent revert/rebase isolation.

| PR | Steps | Files | Why isolated |
|----|-------|-------|--------------|
| **PR-α** | **1, 1.5 (manifest gen), 2, 3, 4, 5, 6, 7, 8 (Parts A+B), 9, 11, 12** | code + tests + **9 installer/update entrypoints** + agent-source rewrites + installed-copy refresh + tracked `agents-baseline.yaml` + new helpers (`init-agent-memory.js`, `reconcile-memory.js`) + `proper-lockfile` dep + gitignore comment + new `update.ps1` | Functionally complete: 3-layer architecture (template + baseline manifest + runtime) with proactive migration, per-agent locking, atomic writes, slug validation, rollback safety. Mergeable on its own — legacy 51 yaml continue to work via fallback during the soak period; baseline manifest already in place so PR-β no longer requires soak. |
| **PR-β** | 10 only | `git rm` of 51 yaml | Pure deletion. Trivially reviewable, trivially revertable. Merged ≥1 week after PR-α so users who install during the window get proactive migration. |

**Branching order**:
1. Wait for **#348 (Phase 1A SKILL.md)** and **#349 (Phase 1B installer portable paths)** to merge → rebase main into local.
2. Create `feat/memory-agents-separation` from updated main; implement Steps 1-9, 11; open PR-α as Draft.
3. After PR-α merges + 1-2 week soak → create `chore/delete-legacy-agent-stubs` from main; `git rm` the 51 yaml; open PR-β.

If #348/#349 stall >7 days, fallback: branch PR-α from main now, accept rebase cost when they land.

---

## Edge Cases & Unhappy Paths

- **Empty runtime on fresh clone before install** — `getAgentNames()` returns `[]` (intentional: history-based). Reports show "no agents have run yet"; this is correct behavior. `loadAgentStats()` returns `null`.
- **`_template.yaml` parse failure** — `init-agent-memory.js` fails loudly with the YAML parse error and the file path; doesn't silently copy garbage.
- **User manually moved `*-stats.yaml` into new runtime** — Union logic handles dedup; runtime takes priority on read.
- **Disk full mid-copy** — `fs.copyFileSync` throws; helper exits non-zero; installer fails loudly. COPYFILE_EXCL is atomic on POSIX/NTFS at FS level.
- **Permission denied on `.claude/agent-memory/`** — Installer surfaces the OS error; no silent fallback to repo-tracked path.
- **Stale in-memory cache after migration** — `clearCache()` already exposed; document in PR-α that long-lived processes should restart.
- **Corrupt runtime YAML** — Quarantined to `.corrupt/${name}-stats-${ISO_TS}.yaml`, fallback reads legacy, `console.warn` surfaces the quarantine path (Step 3).
- **Legacy file content variation** — Migration helper migrates ALL legacy files regardless of `total_tasks` value (Round 3 H2 cleanup). The 51 shipped files contain non-template per-agent baseline data; baselines are additionally distilled into `agents-baseline.yaml` (Step 10) to survive PR-β deletion.

---

## Concurrency / Timing

- **Concurrent `recordTask` for same agent** — Mitigated by Step 3 per-agent `proper-lockfile` lock with cache invalidation: each locked write path drops the in-process `agentStatsCache` entry for that agent, re-reads the runtime file from disk under the lock, applies the update, writes atomically (tmp→rename), then releases the lock. Two long-lived `MemoryService` instances cannot overwrite each other's updates from cached pre-lock stats (Final-Round H2 resolution).
- **Parallel installer runs** — `COPYFILE_EXCL` ensures second copy attempt fails harmlessly with EEXIST; helper treats EEXIST as success.
- **Hook race during `update-memory-stats.js`** — Existing hook locking preserved; we only change the scan filter and read root.

## Data Integrity

- **Atomicity** — Multiple write surfaces in this PR: (1) `init-agent-memory.js` `copyFileSync` (idempotent via COPYFILE_EXCL), (2) `MemoryService.saveAgentStats`/`exportData` tmp→rename atomic writes, (3) `agents-baseline.yaml` generated in PR-α via a one-shot script (single-file write, atomic via tmp→rename), (4) `reconcile-memory.js` deep-merges runtime→legacy (per-file atomic). Each surface is independently atomic; no multi-file transaction is required because nothing depends on cross-file consistency between writes.
- **Legacy files contain per-agent baselines** — Confirmed by re-reading `api-designer-stats.yaml` in full (omega_metrics + dependencies + completion_probability + specialization are populated). Migration helper copies ALL legacy yaml to runtime (Step 4); per-agent baselines are also distilled into the tracked `agents-baseline.yaml` manifest (Step 10) so they survive PR-β.
- **Template SSoT** — Jest test asserts `_template.yaml` parses to the same structure `recordTask` creates for a new agent (Step 1 SSoT drift guard).
- **Cache coherence** — `agentStatsCache` key is agent name (not path), so dual-path read still hits cache correctly.

## User-Facing Failure Modes

- **Installer helper non-zero exit** — `set -e` (bash) / `$LASTEXITCODE` (PS) halt installation with visible error.
- **Check 8 failure post-install** — verify-installation.js prints critical summary; legacy presence is `ok()` not `warn()` to avoid breaking install.sh's exit-2 fatal handling (Step 6).
- **Existing user with non-zero legacy stats** — Migration copies to runtime on next install; user keeps their data. Without migration, only fallback read works — and that breaks after PR-β deletes legacy.
- **Existing user without prior local modifications** — Migration copies the 51 baseline-bearing legacy files to runtime on next install; user inherits per-agent baselines automatically. After PR-β, the baseline manifest provides the same data for fresh clones.

## Topic-Specific Risks Tracked

- **#348/#349 installer collision** — Mitigated by wait-merge-rebase sequencing.
- **Windows install.ps1 + setup-project.ps1 parity** — Mitigated by Step 5 explicit invocation in both PS files + Step 9 fixture(f).
- **Legacy fallback miss → empty stats overwrite** — Mitigated by Step 3 quarantine + Step 4 proactive migration.
- **Test coverage drop 51 → 1** — Mitigated by Step 9 new behavior tests (6 cases) covering union/fallback/migration/quarantine/preservation/options-ctor.
- **Agent-source bypass of MemoryService** — Mitigated by Step 8 rewrite + portability-guard CI rule.

---

## Out of Scope (deferred)

- Problem A `debate/` untrack (separate PR).
- Problem B `.claude/hooks/data/` untrack (separate PR, Critical severity).
- `omega-stats-template.yaml` schema mismatch (`average_quality_score` vs `avg_quality_score`) — pre-existing bug, separate issue.
- `.github/workflows/portability-guard.yml` `!debate/**` exclusion removal — bundled with Problem A.
- History rewrite (`git filter-repo`) of legacy 51 yaml — optional; not required for forward correctness.

---

## Changelog

### Round 1 (Codex Senior-engineer review): all 11 findings **accepted**, all addressed.

**Verified against actual files before accepting:**
- `verify-installation.js:201` exits with code 2 on warnings; `install.sh:637` treats exit 2 as fatal. → H1 confirmed.
- `rg '\.claude/memory/agents' .claude/agent-source/` returned **10 files** with hardcoded refs. → H2 confirmed.
- `scripts/setup-project.ps1` exists (13KB); `install.ps1` has `-SkipVerify` flag at line 28 but no actual verify invocation. → M2 confirmed.
- `MemoryService` ctor takes a single positional `basePath`; proposed 2nd positional `runtimeBasePath` would not respect custom test fixtures. → H4 confirmed.

**Changes applied:**
- **H1**: Step 6 changed `warn()` → `ok()` for legacy file presence (verify-installation exit 2 would otherwise break install.sh during PR-α).
- **H2**: New **Step 8 (agent-source audit & rewrite)** added. Rewrite 10 files + add portability-guard CI rule blocking new write-refs to legacy path.
- **H3**: Step 4 expanded with `--migrate-legacy` mode (skip all-zero stubs, migrate non-zero user-modified files). Step 5 invokes both `--init` and `--migrate-legacy`. Migration is now **proactive**, not just fallback read.
- **H4**: Step 2 ctor changed to options object; default `runtimeBasePath` is **derived from `basePath`** (sibling directory). Test fixtures with custom basePath get matched custom runtime path.
- **M1**: Step 7 update-memory-stats filters `*-stats.yaml` and explicitly excludes `_template.yaml`; regression test added in Step 9(e).
- **M2**: Step 5 expanded to **5 installer scripts** (was 3): added `setup-project.ps1` + fixed `install.ps1` to invoke verify-installation.js when `-SkipVerify` not set. PowerShell quoting documented.
- **M3**: Step 1 added SSoT drift guard Jest test (`_template.yaml` vs `recordTask` new-agent structure deep-equality).
- **M4**: Step 3 added explicit product decision: `getAgentNames()` returns agents-with-history (NOT all available agents). Fresh installs legitimately show "no agents have run". A separate `getAvailableAgents()` API can be added later if reports need the registry.
- **M5**: Step 3 added parse-error fallback + quarantine to `${runtimeBasePath}/agents/.corrupt/${name}-stats-${ISO_TS}.yaml`. Test added in Step 9(d).
- **L1**: Strategy renamed to "**2-PR variant**" with explicit rationale for folding Step 11 into PR-α.

**Rejected**: none.

**New plan size**: 11 steps (was 10). Step count grew due to Step 8 (agent-source rewrite) and Step 4 split into init+migrate modes.

### Round 2 (Codex Security/data-integrity review): all 7 findings **accepted** (3 with scope reduction), all addressed.

**Verified against actual files before accepting:**
- Re-read `.claude/memory/agents/api-designer-stats.yaml` in full: confirmed per-agent baseline data exists (`performance_bounds.min_quality_score: 100`, `dependencies_list.tools: [Read,Write,Edit,Grep]`, `completion_probability.by_complexity: {low:0.99, medium:0.95, high:0.85}`, `specialization.primary_category: implementation`). `total_tasks: 0` was misleading — files are NOT all-zero stubs. → H1 confirmed; the "all-zero filter" was a critical mistake.
- `scripts/update.sh` exists (13KB, executable); `package.json:10` defines `"update": "bash scripts/update.sh"`. → H2 confirmed.
- `scripts/update.ps1` is **NOT present** (verified) — Windows update parity is a pre-existing gap that this PR should document.
- `MemoryService.ts:393` (`exportData`) and `:702` (`saveAgentStats`) both call `fs.writeFileSync(path, content)` directly — no temp+rename, no fsync, no locking. → H3 confirmed.
- Searched MemoryService for `agentName` validation: none exists. `path.join(agentsPath, ${stats.agentName}-stats.yaml)` accepts any input. → M1 confirmed.

**Changes applied:**
- **H1 (Critical)**: Step 4 `--migrate-legacy` removed the "skip all-zero stubs" filter. Now migrates **ALL** legacy yaml files regardless of `total_tasks` value, because per-agent baseline calibration (omega_metrics, dependencies, completion_probability, specialization) would be silently lost. Step 6 Check 8 only emits `warn()` when legacy diverges from `_template.yaml` (true baseline data) — not for "non-zero counters" specifically.
- **H2**: Step 5 expanded to **6 installer scripts** (was 5): added `scripts/update.sh` (between pull/reset/ZIP and verify). Documented `update.ps1` absence as a pre-existing Windows parity gap to address now or as follow-up.
- **H3 (minimum fix)**: Step 3 added **atomic write semantics** — temp file write → fsync → `renameSync`. Applied to `saveAgentStats` (line 702) AND `exportData` (line 393). **Full per-agent locking deferred** as out-of-scope (pre-existing risk, document as known limitation in PR-α + follow-up issue).
- **M1**: Step 3 + Step 4 added **agentName slug validation** (`^[a-zA-Z0-9_-]+$`) in `loadAgentStats`/`saveAgentStats`/`recordTask` and the helper's filename scan. Defense-in-depth: `path.resolve` final path and assert it stays within agents directory.
- **M2**: Step 4 `--migrate-legacy` added conflict resolution. When both legacy and runtime exist: compare `last_updated`; if legacy newer, write to `${runtime}/agents/${name}-stats.legacy-${ISO_TS}.yaml` (conflict suffix) and warn via Check 8 until user resolves; if runtime newer, skip silently.
- **M3**: Step 5 PowerShell guidance changed from `--%` stop-parsing to argument arrays `& node @($helper, '--init', '--migrate-legacy')` (variable expansion preserved). Added Windows CI smoke case for paths with spaces + Japanese characters.
- **L1**: Step 6 Check 8 added pre-install detection — if `.claude/agent-memory/` doesn't exist at all, emit `ok("not yet provisioned; run installer")` instead of `crit()`. Prevents false-positive on `npm run taisun:verify` against a fresh checkout.

**Additionally**: Step 9 (tests) grew from 6 to **10 cases** — added (g) atomic-write-under-interrupt, (h) slug-validation, (i) full-baseline-preservation, (j) conflict-suffix-resolution. Step 10 added PR-β CI preflight gate (dry-run migration test).

**Rejected**: none. All 7 findings have measurable design changes.

**Scope reductions accepted**:
- H3 atomic-write only (not full per-agent locking) — pre-existing risk, document as known limitation.
- H1 migration uses simple "compare to template" rather than introducing a tracked per-agent baseline registry — defer registry as follow-up if baselines need to be re-shippable to new clones.

**New plan size**: 11 steps (unchanged); 10 test cases (was 6); 6 installer scripts (was 5). Step bodies grew substantially.

### Round 3 (Codex Ops/SRE review): all 8 findings **accepted**, all addressed.

**Verified against actual files before accepting:**
- `grep -nE "all-zero|skip.*zero|total_tasks.*0"` against PLAN.md found stale "all-zero stub" text at lines 12, 100, 113, 122 contradicting the Round 2 fix. → H2 confirmed; contradiction was real.
- `ls scripts/quick-install.*` returned only `quick-install.ps1` (no `.sh`); `ls *.{sh,ps1}` at root showed `install-release.{sh,ps1}` and macOS duplicate `install 2.{sh,ps1}` files. → L1 confirmed; installer inventory was incomplete.
- `grep -rln '\.claude/memory/agents' ~/.claude/agents/` returned **4 installed prompt files** at `~/.claude/agents/` with stale legacy refs. → M2 confirmed; source rewrite alone is insufficient.
- Re-evaluated H1: agreed that "CI dry-run vs fixture" was theatre — does not cover users on `install-release.*` / `quick-install.ps1` / pre-α-skip paths. Need a structural data carrier (baseline manifest) that survives PR-β.

**Changes applied:**
- **H1 (Critical, architectural)**: New Step 10 approach — generate tracked `.claude/memory/agents-baseline.yaml` in PR-α distilling per-agent calibration. PR-β safely deletes the 51 yaml because the baseline manifest survives. The CI fixture-dry-run gate is replaced with a structural invariant check (manifest contains all 51 agent names). Soak period becomes ergonomic preference, not safety requirement.
- **H2 (contradictions)**: Swept 4 stale "all-zero stub" / "skip zero" references in Goal, Edge Cases, Data Integrity, and User-Facing sections. Goal section rewritten to describe the 3-layer architecture (template + baseline manifest + runtime). Round 1 Changelog entry at line 157 left intact as historical record.
- **H3 (locking, scope expansion accepted)**: Step 3 changed from "deferred locking" to actively adding per-agent interprocess lock via `proper-lockfile`. Lock at `${runtimeBasePath}/agents/.locks/${name}.lock`, 5s acquire timeout, stale detection via PID + 10s mtime heartbeat. Applied to recordTask, migration, update-memory-stats. Concurrent recordTask + interrupt scenarios added to tests.
- **M1 (rollback)**: New Step 12 — `scripts/reconcile-memory.js` + `npm run reconcile:memory` — copies/merges runtime back to legacy path before rollback. Documented in README and PR-α description.
- **M2 (installed agents refresh)**: Step 8 split into Part A (source rewrite + portability-guard CI) and Part B (force-refresh installed copies at `~/.claude/agents/*.md` on every install/update; Check 8 scans for stale refs).
- **M3 (deep-diff conflict)**: Step 4 conflict detection now uses normalized deep-diff of parsed YAML (sort keys, strip volatile fields) instead of `last_updated`-only. Conflict-suffix created on any content divergence regardless of timestamp ordering.
- **M4 (observability)**: Step 4 adds durable migration log at `${runtimeBasePath}/migration-${ISO_TS}.log` with per-file outcome (migrated/skipped-identical/conflict-suffix/quarantined-corrupt). Check 8 reads the log and reports counts.
- **L1 (installer inventory)**: Step 5 replaced bullet list with **exact entrypoint matrix** (table): install.{sh,ps1}, install-release.{sh,ps1}, setup-project.{sh,ps1}, update.sh, quick-install.ps1, plus documented gaps (update.ps1 missing — must ship in PR-α; no Unix quick-install — pre-existing gap, not this PR's responsibility). macOS Finder duplicates `install 2.*` flagged as out-of-scope cleanup.

**Rejected**: none. All 8 findings have concrete design changes.

**Scope expansions accepted** (PR-α grows significantly):
- Tracked baseline manifest `.claude/memory/agents-baseline.yaml` (new file).
- Per-agent interprocess locking via `proper-lockfile` (was deferred in Round 2).
- New `scripts/update.ps1` (was documented gap; now MUST ship for parity).
- New `scripts/reconcile-memory.js` (rollback safety command).
- Installed agent prompt refresh logic in installer.

**New plan size**: 12 steps (was 11); 10 test cases unchanged but coverage broader due to new fixtures (lock contention, manifest invariants, reconcile round-trip); 9 installer entrypoints documented (vs 6 in Round 2).

**Loop closure**: Round 3 was the final round per `--rounds 3`. After this revision, the hook will detect max-rounds-reached and exit with the round-by-round findings summary. The plan has been pressure-tested through 3 personas (Senior Engineer / Security & Data Integrity / Ops & SRE) and 26 total findings, all accepted, all addressed.

### Final-Round verification (claudex 20260513-084121-232d15, --from-draft --rounds 1): all 6 findings **accepted**, all addressed.

**Verified against actual PLAN.md text before accepting:**
- `grep -n "5 installers\|pre-existing risk; unchanged\|Helper is the only filesystem"` confirmed stale claims at lines 105, 132, 138. → L1 confirmed.
- PR table at line 105 listed steps "1-9, 11" with "5 installers" — Steps 1.5 (manifest gen) and 12 (reconcile) were in body but not in the table or branching instructions. → H1 confirmed.
- Re-read Step 3 lock spec: lock acquisition described but no `agentStatsCache.delete(agentName)` step inside the locked path. Two MemoryService instances each have populated cache → both acquire lock serially → each writes from stale cached stats → last write wins, one update lost. → H2 confirmed.
- Step 9 test cases (a)–(j) did not include a manifest-seeded fresh-checkout E2E test. → H3 confirmed.
- `proper-lockfile` not in package.json yet, no acceptance gate. → M1 confirmed.
- Step 6 Check 8 had `warn()` for conflict-suffix files, but installers treat verify exit 2 as fatal. A user with a legitimately preserved conflict-suffix would have install break. → M2 confirmed.

**Changes applied:**
- **H1**: PR table at line 105 rewritten to explicitly list Steps 1, 1.5, 2, 3, 4, 5, 6, 7, 8 (Parts A+B), 9, 11, 12 with deliverables (manifest, helper, reconcile, proper-lockfile, update.ps1) named in the columns.
- **H2**: Step 3 lock spec amended — inside the locked path, **immediately invalidate the cache** (`this.agentStatsCache.delete(agentName)`) and **re-read runtime from disk** before applying the update. Lock release in `finally`. Step 9 added test (k) for two-instance concurrent recordTask + cache invalidation regression.
- **H3**: Step 9 added test (l) — wipe both legacy and runtime, recordTask for a manifest-listed agent (api-designer), assert resulting stats match manifest values (dependencies_list.tools, completion_probability.by_complexity). Marked as **PR-β blocking test**.
- **M1**: Step 12 expanded — `proper-lockfile` added to package.json dependencies; CI gate runs `npm ci && npm run test:memory` on fresh clone.
- **M2**: Step 6 Check 8 split into two modes — default mode reports conflict-suffix as `ok()` (informational, exit 0, installer-safe); `--strict` flag escalates to `warn()` (exit 2) for explicit audit runs. Default mode preserves install/update safety; strict mode is for operator manual audits.
- **L1**: Swept stale claims in body sections:
  - Line 132 (Concurrency section): "pre-existing risk; unchanged" → rewritten to describe lock + cache invalidation as the active mitigation.
  - Line 138 (Data Integrity / Atomicity): "Helper is the only filesystem mutation" → rewritten to list 4 atomic write surfaces (helper copy, MemoryService tmp→rename, manifest one-shot write, reconcile per-file).
  - Round 1/2/3 Changelog entries left intact as historical record (per established convention).

**Cumulative finding rate**: Round 1: 10 → Round 2: 7 → Round 3: 8 → Verification Round: 6. Trajectory is converging toward zero. **Total findings across all 4 rounds: 31** (all accept, 0 reject).

**Decision point**: After this revision, run one more `/claudex:plan --rounds 1 --from-draft` to verify the 6 fixes don't introduce regressions and to reach Codex AGREE (release-quality GO). If that round produces "No substantive findings", the plan is at GO state and implementation can begin.

### Final note for the implementer
PR-α is no longer a minimal 5-installer refactor. It's a 12-step deliverable with architectural changes (baseline manifest, locking, rollback command). Estimated implementation effort revised from "170-220 lines" to **~400-500 lines** + ~10 new test cases + ~50 lines of installer wiring per script × 9 entrypoints. PR-β remains a pure deletion. Reviewer load shifts to PR-α; PR-β stays trivial.

---

## Known Open Items — Deferred to Implementation (Codex 5-round verification)

The plan was reviewed in **5 Codex rounds** (3 main + 2 verification) producing **37 findings, all accepted, 0 rejected**. After Round 5, **5 remaining items** are deferred to implementation per the user-approved "Option B" path: each will be validated via `/codex:adversarial-review` against actual commits rather than via further planning iteration. Implementers MUST address these before merge; reviewers MUST verify each one.

| # | Severity | Item | Where it lands in implementation | Acceptance criterion |
|---|---|---|---|---|
| OPEN-1 | High | **snake_case ↔ camelCase encode/decode contract** for baseline manifest and runtime YAML. Define canonical on-disk YAML as snake_case; add explicit mappers for `omega_metrics`, `learning_metrics`, `metadata`. | `src/memory/MemoryService.ts` (Steps 2-3) + new mapper module if needed. | Step 9 test (l) extended: assert both typed `MemoryService` object AND serialized runtime YAML preserve api-designer baseline fields after fresh manifest seeding. |
| OPEN-2 | High | **Per-agent lock on ALL write paths**, not just `recordTask`. Centralize via `withAgentStatsLock` / `mutateAgentStats` helper. Apply to `saveAgentStats`, `cleanupOldTasks`, `recordTask`, helper migration, update script, reconcile script. | `src/memory/MemoryService.ts` Step 3 + Step 7 + Step 12. | New regression test: `cleanupOldTasks()` + `recordTask()` race → no lost task; documented in Step 9. |
| OPEN-3 | Medium | **`proper-lockfile` exact API call** — specify `lockfilePath`/`realpath:false`, ensure `.locks` dir exists, document target file choice, smoke test cross-OS. | `src/memory/MemoryService.ts` Step 3 lock initialization. | Smoke test in Step 9 proves lock acquisition for brand-new agent on macOS/Linux + Windows CI. |
| OPEN-4 | Medium | **Split SSoT drift guard**: separate `_template.yaml` vs default-factory test (unknown agent) from manifest-seeded E2E test (known agent like api-designer). Test (l) becomes the known-agent variant; add new test for unknown-agent default factory using `_template.yaml`. | `tests/integration/memory.integration.test.ts` Step 9. | Both tests green; neither implementer is pushed to bypass the manifest. |
| OPEN-5 | Low | **Parent-directory `fsync` after rename** in atomic write path. POSIX requires fsync of containing dir for true crash durability. | `src/memory/MemoryService.ts` Step 3 atomic write. | Document Windows fallback (where parent-dir fsync semantics differ). |

**Verification gate**: PR-α MUST include `/codex:adversarial-review` evidence (linked transcript or `doc/CODEXレビュー/${ISO_TS}_*.md`) demonstrating each OPEN-N is resolved before merge. PR-β additionally requires the manifest-seeded E2E test (Step 9 test l) green on CI as a blocking check.

**Rationale for deferring vs continuing planning**: All 5 items are implementation-detail-level concerns (schema mapping, API specifics, lock surface enumeration, test partition, syscall semantics) that are more efficiently validated against real code than against a planning document. The cost/benefit of Round 6+ planning iteration crossed below the cost/benefit of code-level review at Round 5 (finding rate dropped from 2.0/min to 0.5/min). See user-approved decision at end of Round 5.

### Cumulative Codex round-by-round tally

| Round | Persona | High | Med | Low | Total | All accepted? |
|---|---|---|---|---|---|---|
| 1 | Senior-engineer | 4 | 5 | 1 | 10 | ✅ |
| 2 | Security & data-integrity | 3 | 3 | 1 | 7 | ✅ |
| 3 | Ops & SRE | 3 | 4 | 1 | 8 | ✅ |
| 4 (verification 1) | Senior-engineer | 3 | 2 | 1 | 6 | ✅ |
| 5 (verification 2) | Senior-engineer | 2 | 2 | 1 | 5 | 5 deferred to implementation |
| **Total** | | **15** | **16** | **5** | **36** | 31 addressed + 5 deferred |

---

## Step 1.5 follow-up (commit 7e006b3, Codex re-review NO-GO 2026-05-14 + 3rd round 2026-05-14)

After Codex 2nd-round NO-GO on Step 1.5 fix (commit 30c2051), follow-up commit 7e006b3 expanded the generator with:

1. **F1 (HIGH)** — `REQUIRED_NESTED_TYPES` grown from 7 to 30+ entries (worst_case interior, performance_bounds, dependencies aggregates, completion_probability, learning_metrics trends + specialization, metadata). `null` is now treated as missing for typed leaves.
2. **F2 (MED)** — full catalog comparison vs `.claude/agent-source/*.md`. `compareCatalog` returns surplus + missing. `--strict` fails on surplus (combined with `--check` for read-only CI use). Suffix heuristic demoted to warn-only.
3. **F3 (MED)** — slug denylist (Windows reserved CON/PRN/AUX/NUL/COM1-9/LPT1-9), trailing hyphen forbidden, consecutive hyphens forbidden.
4. **new MED** — `scripts/__tests__/generate-agents-baseline.test.js` (45 Jest tests), `jest.config.js` "scripts" project, `.github/workflows/ci.yml` `generator-baseline-gate` job (runs unit tests + 4 modes).

### Drift cleanup (Step 1.5 follow-up scope addition)

Catalog comparison surfaced 3 stale `*-stats.yaml` files that have no matching agent in `.claude/agent-source/*.md`:
- `tmux-session-manager-stats.yaml` (`min_quality_score: 75`, `dependencies.omega: 0` — orphaned baseline)
- `optimization-report-coordinator-stats.yaml` (`min_quality_score: 91`, `dependencies.omega: 24` — orphaned baseline of a removed coordinator)
- `tmux-session-manager-optimization-report-stats.yaml` (suffix `-report`, orphaned)

All three were `total_tasks: 0` stubs (no observed history) and absent from the catalog. They were removed in commit 7e006b3 as part of the F2 enforcement, consistent with Codex re-review feedback that the manifest must align with the authoritative catalog.

**Effective baseline count post-cleanup: 48** (was 51 in PLAN.md historical references above). CI gate `--validate-manifest --expected-count 48` reflects this. Step 9 test (l) PR-β blocking test will assert 48 entries.

If future work re-introduces any of these agent names (e.g. tmux-session-manager comes back with a real `.claude/agent-source/` entry), the generator will silently re-include them once their `*-stats.yaml` is re-added (or generated fresh by `recordTask`), and the manifest will grow back accordingly.

### CI gate hardening (Codex 3rd-round NO-GO MED findings)

- Path filter expanded: `.claude/memory/agents/**` and `.claude/agent-source/**` added to `code` paths so any drift introduced by hooks or future agent additions triggers the `generator-baseline-gate`.
- `--strict` was previously a write-mode invocation. CI now invokes `--check --strict` so the manifest is not rewritten during CI (read-only). The `--strict` flag still works standalone for local audit + write workflows.
