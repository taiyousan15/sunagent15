# TAISUN_HOME Design Review (Codex)

## Summary Verdict
The proposal identifies the root portability problem correctly (31 relative hook commands in `.claude/settings.json`), but the recommended `cd "$TAISUN_HOME"; node .claude/hooks/X.js` execution model is risky because multiple active hooks depend on `process.cwd()` being the target project. I recommend keeping the 3-tier concept, but resolving only the hook script path (not changing CWD), using JSON-aware rewrite tooling (not `sed`), and adding explicit stale-`TAISUN_HOME` detection/remediation in install/update flows.

## Question-by-Question Review

### Q1: Shell RC modification strategy
**Verdict: PARTIAL**

Modifying shell RC is already used elsewhere in this repo, but direct `export TAISUN_HOME=...` append is not the safest long-term strategy.

Evidence:
- `scripts/install.sh` currently does **not** modify `~/.zshrc`/`~/.bashrc`; line 16 resolves repo from script location: `REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"` (`scripts/install.sh:16`).
- The cited `scripts/install.sh:382-418` block is `.env` creation/warnings, not shell RC edits.
- RC edits do exist in other scripts with marker blocks, e.g. `scripts/setup-litellm.sh:75-115` and `scripts/setup-sdd.sh:382-399`.

Why PARTIAL:
- RC editing is acceptable if done idempotently with markers.
- Better maintainability is: store canonical value in `~/.config/taisun/env`, then add one marker `source` line to shell RC once.

Alternative:
- `install.sh` writes/updates `~/.config/taisun/env` (`export TAISUN_HOME="..."`), then ensures one marker block in RC that sources this file.
- This makes repo-move refresh (Q7) much safer than in-place RC string replacement.

### Q2: Hook resolution strategy
**Verdict: DISAGREE** (with `cd` prefix)

`cd "$TAISUN_HOME"` before running each hook can change behavior because several currently enabled hooks use `process.cwd()` as project root.

Evidence:
- Current hook commands are relative and guarded, e.g. `.claude/settings.json:67` and similar through `:380`.
- Active hook scripts with direct `process.cwd()` usage include:
  - `pre-compact-save.js` (`.claude/hooks/pre-compact-save.js:16-18`, `:72`, `:115`)
  - `task-overflow-guard.js` (`.claude/hooks/task-overflow-guard.js:18`, `:22-23`)
  - `compact-optimizer.js` (`.claude/hooks/compact-optimizer.js:20`, `:26-28`)
  - `definition-lint-gate.js` (`.claude/hooks/definition-lint-gate.js:172`)
  - `agent-trace-capture.js` (`.claude/hooks/agent-trace-capture.js:64`, `:77`)
- By contrast, some hooks already use `input.cwd || process.cwd()` (e.g. `workflow-sessionstart-injector.js:29`, `session-handoff-generator.js:31`) and/or `__dirname` repo-relative paths.

Why DISAGREE:
- `cd` fixes script lookup but can redirect project-scoped reads/writes into TAISUN_HOME.

Alternative:
- Keep caller CWD unchanged.
- Resolve only script path to absolute: run `node "$RESOLVED_TAISUN_HOME/.claude/hooks/X.js"` (or via a tiny launcher), without `cd`.
- Do **not** duplicate path logic inside all 31/28 hooks unless absolutely necessary.

### Q3: Batch rewrite method for 31 hooks
**Verdict: PARTIAL**

`sed` batch replacement is brittle for JSON and shell-quoting; use JSON-aware Node rewrite logic. `update-settings.js` style is directionally right, but current `update-settings.js` does not touch hooks.

Evidence:
- Existing robust JSON tooling pattern in `scripts/update-settings.js` (backup + atomic write): backup flow `:44-87`, merge logic `:89-128`, atomic write `:190-196`.
- Current rewrite function handles only MCP `args` (`scripts/update-settings.js:130-141`), not `.claude/settings.json` hook command strings.

Alternative:
- Implement hook-command migration with a Node JSON parser/writer (either extend `update-settings.js` scope or add a dedicated `scripts/update-hook-commands.js`).
- Avoid `sed -i` differences (BSD/GNU) and escaping hazards.

### Q4: PowerShell profile modification strategy
**Verdict: PARTIAL**

Use persistent user environment variable first; profile edit only as fallback.

Evidence:
- Windows scripts currently resolve repo from script path (`scripts/install.ps1:37`, `scripts/setup-project.ps1:26-27`) and do not modify `$PROFILE`.
- Existing hook command syntax in `.claude/settings.json` is POSIX-style (`[ ! -f ... ] && ...`), so Windows shell behavior needs careful treatment regardless.

Recommended strategy:
- Primary: `[Environment]::SetEnvironmentVariable('TAISUN_HOME', $REPO_DIR, 'User')` and set `$env:TAISUN_HOME` for current session.
- Optional fallback: append marker block to `$PROFILE.CurrentUserAllHosts` only if env var approach is unavailable.
- Keep behavior idempotent and reversible.

### Q5: 3-tier fallback order
**Verdict: PARTIAL**

`CLI > TAISUN_HOME > auto-detect` is good for a hook launcher, but risky as a general script resolver where script-location detection is already reliable.

Evidence:
- Current scripts consistently use script-location auto-detect:
  - `scripts/install.sh:16`
  - `scripts/update.sh:9`
  - `scripts/setup-project.sh:19-20`
  - `scripts/install.ps1:37`
  - `scripts/setup-project.ps1:26-27`

Why PARTIAL:
- If stale `TAISUN_HOME` exists, env-precedence can override correct script path and regress existing behavior.

Alternative order:
- For install/update/setup scripts: `CLI > script-location auto-detect > TAISUN_HOME`.
- For hook launcher (no reliable script context): `CLI > TAISUN_HOME > launcher-location fallback`.

### Q6: Deleted/moved TAISUN_HOME handling
**Verdict: DISAGREE** (current proposal is insufficient)

The proposal does not define explicit stale-path handling and currently treats silent skip as acceptable.

Evidence:
- Proposal explicitly allows silent skip when TAISUN_HOME missing (`debate-v5/TAISUN_HOME_opus_proposal.md:50`).
- Current hook commands already fail-open via guard, e.g. `.claude/settings.json:67` pattern (`[ ! -f ... ] && exit 0; ...`).
- `scripts/verify-installation.js` already has a precedent for moved-repo diagnostics (dangling skill links warning and repair hint at `:128-133`).

Alternative:
- Add explicit validation: if `TAISUN_HOME` set but missing expected file(s), emit one clear warning and fall back to local `.claude` if available.
- In install/update, auto-heal stored TAISUN_HOME when stale.
- Extend diagnostics to report stale TAISUN_HOME directly.

### Q7: update.sh TAISUN_HOME refresh
**Verdict: AGREE**

`update.sh` should refresh persisted TAISUN_HOME metadata when repo location changes.

Evidence:
- `update.sh` derives current path from script location (`scripts/update.sh:9`) but does not update any TAISUN_HOME persistence.
- `update.sh` already performs self-healing style updates for skills/agents (`scripts/update.sh:161-221`), so adding TAISUN_HOME refresh fits existing behavior.

Recommended implementation:
- On update completion, compare persisted TAISUN_HOME with detected `REPO_DIR`; if different, update canonical env store (prefer `~/.config/taisun/env`) and ensure RC source marker exists.

## Additional Risks
- **CWD semantic regression risk**: `cd "$TAISUN_HOME"` can change where hooks write runtime artifacts (`process.cwd()` users listed in Q2).
- **JSON/quote breakage risk**: command-string rewrites with shell text tools can corrupt JSON or quoting; use parser-based rewrite.
- **Verifier mismatch risk**: if command syntax changes (quoted absolute paths, launcher wrappers), `scripts/verify-installation.js` regex (`:92`) may need updates.
- **Windows shell parity risk**: current hook command syntax is POSIX in `.claude/settings.json`; ensure cross-platform behavior is tested before claiming full PowerShell support.
- **Stale env masking risk**: silent skip behavior can hide broken hook execution for long periods without explicit diagnostics.

## Recommended Implementation Order
1. Implement hook-launch path resolution that preserves caller CWD (absolute script path, no `cd`).
2. Add JSON-based migration script for all 31 hook commands in `.claude/settings.json` (no `sed`).
3. Introduce TAISUN_HOME persistence via canonical env file (`~/.config/taisun/env`) plus idempotent RC source marker.
4. Add stale-TAISUN_HOME detection and auto-heal in `install.sh`, `update.sh`, and Windows installer/update path.
5. Update diagnostics (`verify-installation.js`) to validate new hook command forms and stale TAISUN_HOME explicitly.
6. Run cross-platform validation (macOS/Linux/Windows) for hook execution, including repo-move and deleted-path scenarios.
