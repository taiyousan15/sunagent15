# REMAINING_ISSUES Opus Plan Review (Codex)

## 1. Is the phase ordering A→B→C→D→E sound?
**Verdict: PARTIAL**

Evidence:
- The proposed ordering is explicitly A→B→C→D→E in [debate-v5/REMAINING_ISSUES_opus_plan.md:5-47](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v5/REMAINING_ISSUES_opus_plan.md#L5).
- Phase D-2 consolidates `install.sh/setup-project.sh` ([debate-v5/REMAINING_ISSUES_opus_plan.md:36-40](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v5/REMAINING_ISSUES_opus_plan.md#L36)).
- Phase E then defines TAISUN_HOME path design due install path concerns ([debate-v5/REMAINING_ISSUES_opus_plan.md:42-50](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v5/REMAINING_ISSUES_opus_plan.md#L42)).
- Current scripts already contain path-resolution logic, so D-2 and E both touch the same surface: [scripts/install.sh:16](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.sh#L16), [scripts/setup-project.sh:19-20](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/setup-project.sh#L19), [scripts/update.sh:9](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/update.sh#L9).

Improvement suggestions:
- Move path design before deep script consolidation: `A → B → C → D-1 → E → D-2/D-3`.
- Keep A-2 archive (`debate-v5` move) last to avoid moving plan artifacts early ([debate-v5/REMAINING_ISSUES_opus_plan.md:10](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v5/REMAINING_ISSUES_opus_plan.md#L10)).

## 2. Is removing @prisma/client safe?
**Verdict: DISAGREE**

Evidence:
- `@prisma/client` is present in dependencies: [package.json:116](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/package.json#L116).
- Prisma schema exists: [prisma/schema.prisma:1-7](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/prisma/schema.prisma#L1) (`generator client { provider = "prisma-client-js" }`).
- Verification command output:
```text
$ find . -type f -name 'schema.prisma'
./prisma/schema.prisma
$ find . -type d -name 'migrations'
(no output)
$ find . -type f \( -name 'seed.ts' -o -name 'seed.js' -o -name 'seed.sql' -o -name '*seed*' \)
(no output)
```
- Runtime imports are not found in app code (only package + prisma files matched): command `rg -n "@prisma/client|prisma" package.json package-lock.json prisma scripts src tests docs README.md INSTALL.md`.

Why this is unsafe:
- No runtime import does not prove removability while `schema.prisma` with client generator still exists; removing `@prisma/client` can break Prisma client generation/CLI workflows.

Improvement suggestions:
- Safer default: move `@prisma/client` to `devDependencies` first, not full removal.
- Only remove fully if Prisma stack is retired together (`prisma/` removal + CI checks for no Prisma usage).

## 3. mcp-health-check.sh → .js: references beyond Makefile:150?
**Verdict: PARTIAL**

Evidence:
- Makefile runtime reference exists: [Makefile:150](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/Makefile#L150).
- Package script already points to JS: [package.json:85](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/package.json#L85).
- Docs still reference `.sh`: [docs/MCP_GUIDE.md:36](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/docs/MCP_GUIDE.md#L36), [docs/MCP_GUIDE.md:200](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/docs/MCP_GUIDE.md#L200), [docs/WINDOWS_SETUP.md:336](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/docs/WINDOWS_SETUP.md#L336), [docs/WINDOWS_SETUP.md:399](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/docs/WINDOWS_SETUP.md#L399), [docs/WINDOWS_SETUP.md:404](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/docs/WINDOWS_SETUP.md#L404).
- No additional call sites found in package/CI/README/shell scripts:
```text
$ rg -n "mcp-health-check\.sh" package.json
NO_MATCH
$ rg -n "mcp-health-check\.sh" .github/workflows/*.yml
NO_MATCH
$ rg -n "mcp-health-check\.sh" README.md
NO_MATCH
$ rg -n "mcp-health-check\.sh" scripts/*.sh scripts/**/*.sh
NO_MATCH
```

Improvement suggestions:
- Update Makefile target to JS and update docs in same PR.
- Keep a temporary compatibility stub `scripts/mcp-health-check.sh` that execs `node scripts/mcp-health-check.js` until docs/users migrate.

## 4. install.sh / setup-project.sh consolidation: wrapper-pattern or full-merge safer?
**Verdict: AGREE (wrapper-pattern is safer)**

Evidence:
- File sizes differ significantly: `scripts/install.sh` 539 lines, `scripts/setup-project.sh` 246 lines (`wc -l` output).
- Low overlap by line-content sampling:
```text
install_nonblank_noncomment 418
setup_nonblank_noncomment 180
common_unique_lines 37
setup_lines_found_in_install 63
```
- `setup-project.sh` has project-linking responsibilities absent from installer: target project arg and `.git` init/symlink flow ([scripts/setup-project.sh:22-30](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/setup-project.sh#L22), [scripts/setup-project.sh:61-116](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/setup-project.sh#L61)).
- `install.sh` has environment checks/build/profile logic absent from setup flow ([scripts/install.sh:41-98](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.sh#L41), [scripts/install.sh:141-233](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.sh#L141), [scripts/install.sh:382-418](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.sh#L382)).
- Main overlap is only shared global registration blocks ([scripts/setup-project.sh:142-214](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/setup-project.sh#L142), [scripts/install.sh:276-353](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.sh#L276), [scripts/install.sh:420-435](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.sh#L420)).

Improvement suggestions:
- Keep two entrypoints; extract shared registration logic into `scripts/lib/*` and call from both.
- Preserve current `setup-project.sh` CLI behavior for cross-project onboarding compatibility.

## 5. TAISUN_HOME design: env var vs .taisunrc vs auto-detect
**Verdict: PARTIAL**

Evidence:
- Current repo pattern is auto-detect-from-script-location:
  - [scripts/install.sh:16](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.sh#L16)
  - [scripts/update.sh:9](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/update.sh#L9)
  - [scripts/setup-project.sh:19-20](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/setup-project.sh#L19)
  - [scripts/install.ps1:37](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.ps1#L37)
  - [scripts/setup-project.ps1:26-27](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/setup-project.ps1#L26)
  - [scripts/mcp-health-check.js:23](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/mcp-health-check.js#L23)
- No existing TAISUN_HOME or `.taisunrc` usage in active code/docs:
```text
$ rg -n "TAISUN_HOME|taisunrc" scripts src .github/workflows README.md INSTALL.md package.json docs/MCP_GUIDE.md docs/WINDOWS_SETUP.md
NO_MATCH
$ find . -name '.taisunrc'
(no output)
```
- Path rewriting already uses computed `REPO_DIR` values (not literal hardcoded source paths): [scripts/install.sh:438-446](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.sh#L438), [scripts/update-settings.js:130-141](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/update-settings.js#L130).

Improvement suggestions:
- Best fit for this repo: `CLI arg > TAISUN_HOME env > auto-detect` fallback chain.
- Do not introduce `.taisunrc` now; it adds a new config system with zero current usage.

## 6. Are Opus/Codex role assignments for each phase appropriate?
**Verdict: PARTIAL**

Evidence:
- Role matrix and phase assignment are defined at [debate-v5/REMAINING_ISSUES_opus_plan.md:35-37](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v5/REMAINING_ISSUES_opus_plan.md#L35), [debate-v5/REMAINING_ISSUES_opus_plan.md:46-47](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v5/REMAINING_ISSUES_opus_plan.md#L46), [debate-v5/REMAINING_ISSUES_opus_plan.md:55-63](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v5/REMAINING_ISSUES_opus_plan.md#L55).
- PowerShell-heavy surface is large (`install.ps1` 615 lines, `setup-project.ps1` 255 lines; `wc -l` output) and CI has explicit PS regression guards ([.github/workflows/ci.yml:216-264](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.github/workflows/ci.yml#L216)), so D-3 Codex ownership is sensible.
- Dependency-analysis ownership for C-1 also aligns with actual dependency concern in [package.json:116](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/package.json#L116) and [prisma/schema.prisma:1-3](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/prisma/schema.prisma#L1).

Improvement suggestions:
- Keep D-3 as Codex-led.
- Make D-2 explicitly co-owned with Codex as final gatekeeper because it impacts onboarding/update scripts used by all users.

## 7. Could Phase D-2 consolidation break another user's install or update flow?
**Verdict: AGREE**

Evidence:
- Core entrypoints depend on `scripts/install.sh`:
  - [package.json:7-8](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/package.json#L7)
  - [README.md:77-80](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/README.md#L77)
  - [README.md:204-207](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/README.md#L204)
  - [INSTALL.md:28](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/INSTALL.md#L28), [INSTALL.md:50](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/INSTALL.md#L50), [INSTALL.md:89](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/INSTALL.md#L89)
- `setup-project.sh` is documented for cross-project use: [README.md:129-138](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/README.md#L129), [scripts/setup-project.sh:9-12](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/setup-project.sh#L9).
- Update guidance still tells users to rerun installer in some paths/messages: [scripts/update.sh:235-238](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/update.sh#L235).
- External-facing release artifact currently points to root `install.sh` URL ([.github/workflows/cd.yml:165](/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.github/workflows/cd.yml#L165)) while repository root has no `install.sh`:
```text
$ test -f install.sh && echo exists || echo missing
missing
```

Improvement suggestions:
- Preserve `scripts/install.sh` path and argument compatibility during D-2.
- If internals are consolidated, keep stable wrapper shims for both `install.sh` and `setup-project.sh`.
- Fix release workflow install snippet to real path or provide root-level shim script.

## Summary
| Point | Verdict | One-line rationale |
|---|---|---|
| 1 | PARTIAL | Overall progression is reasonable, but D-2 before E risks rework on path logic. |
| 2 | DISAGREE | `prisma/schema.prisma` with client generator exists, so full `@prisma/client` removal is not safely proven. |
| 3 | PARTIAL | Operationally mostly Makefile-only, but docs still contain multiple `.sh` references. |
| 4 | AGREE | Script goals diverge heavily; wrapper + shared-lib extraction is safer than full merge. |
| 5 | PARTIAL | Existing pattern is auto-detect; best fit is env override plus auto-detect fallback, not `.taisunrc`. |
| 6 | PARTIAL | D-3/C-1 ownership is sensible, but D-2 should have stricter Codex co-ownership gate. |
| 7 | AGREE | `install.sh`/`setup-project.sh` are widely referenced; consolidation can break onboarding/update flows if paths/CLI change. |
