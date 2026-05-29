# Backward Compatibility Policy

**Status**: Stable
**Last updated**: 2026-04-19
**Applies to**: sunagent15 v2.x and later

---

## 1. Versioning Scheme — Semantic Versioning 2.0.0

We follow [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html):

```
MAJOR.MINOR.PATCH
```

| Bump | When | Examples |
|------|------|----------|
| **MAJOR** (`X.0.0`) | Backward-**incompatible** changes (see §3) | Removing/renaming a public skill, dropping Node version support |
| **MINOR** (`x.Y.0`) | Backward-**compatible** new features | Adding a new skill, new installer flag, new MCP server |
| **PATCH** (`x.y.Z`) | Backward-**compatible** bug fixes | Fixing a hook crash, correcting README counts |

**Pre-release identifiers** are allowed: `2.54.0-beta.1`, `2.54.0-rc.2`.

**Build metadata** (e.g. `+build.123`) MUST NOT affect precedence.

---

## 2. Public Surface (what compatibility applies to)

The following are considered **public** and protected by this policy:

| Surface | Stability |
|---------|-----------|
| Skill names invocable as `/skill-name` | Stable — rename = MAJOR |
| Installer CLI flags (`--profile`, `--fresh`, `-Profile`, `-Fresh`, etc.) | Stable — removal = MAJOR |
| `scripts/installer-capability-matrix.json` declared capabilities | Stable — removal = MAJOR |
| `~/.claude/settings.json` keys we write/read | Stable — incompatible schema change = MAJOR |
| `.env` variable names consumed by skills | Stable — rename = MAJOR |
| MCP server names registered by installer | Stable — rename = MAJOR |
| Profile names (`minimal`, `standard`, `full`) | Stable — rename = MAJOR |
| `npm run` script names exposed in `package.json` | Stable — rename = MAJOR |
| Public Node modules under `src/` exported via `package.json#main` | Stable — breaking API = MAJOR |

The following are **internal** and NOT covered:

- Internal helper scripts under `scripts/internal/`
- Hook implementation details (interface stable, internals fluid)
- Test files under `tests/`
- Build artifacts under `dist/`
- Anything in `_archived/`, `_guides/`, or starting with `_`

---

## 3. What Counts as a Breaking Change

A change is breaking (and requires a MAJOR bump + a deprecation cycle) if it:

1. **Removes** or renames a public-surface item from §2
2. **Changes the meaning** of an existing CLI flag (e.g., `--fresh` going from "merge with backup" to "destructive overwrite")
3. **Drops support** for a previously supported runtime (e.g., Node 18 → Node 20 minimum)
4. **Drops support** for a previously supported OS (e.g., dropping Windows support)
5. **Changes installer side-effects** in a way that requires user action (e.g., new mandatory env var)
6. **Renames or removes** a profile name
7. **Removes** a skill that was bundled in a tagged release
8. **Changes** the on-disk layout that user customizations depend on (e.g., moving `~/.claude/skills/`)

Non-breaking (MINOR/PATCH) examples:

- Adding a new flag that defaults to current behavior
- Adding a new skill
- Improving error messages
- Faster install / smaller artifact
- Internal refactor with identical observable behavior

---

## 4. Deprecation Cycle

Before any breaking change, the following sequence MUST occur:

| Stage | Min duration | Required action |
|-------|--------------|-----------------|
| **1. Announce** | — | Add to `docs/DEPRECATIONS.md` with target removal version + migration path |
| **2. Warn at runtime** | 1 MINOR cycle | Print a clear deprecation warning whenever the feature is used |
| **3. CHANGELOG entry** | every release | List all currently-deprecated items in CHANGELOG |
| **4. Remove** | next MAJOR | Bump MAJOR, remove the feature |

**Minimum total**: 1 MINOR release between announcement and removal.

Example timeline:
```
v2.53.0  →  feature X added
v2.60.0  →  feature X deprecated (warns at runtime)
v2.65.0  →  feature X still warns (in CHANGELOG)
v3.0.0   →  feature X removed
```

---

## 5. Communication Channels

When a breaking change ships:

| Channel | Required content |
|---------|------------------|
| `CHANGELOG.md` | Full breaking-change list at top of release notes, with migration steps |
| GitHub Release body | Summary + link to CHANGELOG section |
| `docs/MIGRATION_v{N}.md` | Step-by-step upgrade guide for each MAJOR (e.g., `MIGRATION_v3.md`) |
| Installer warning | If user runs old installer against new release, fail with clear hint |

---

## 6. Runtime Support Matrix

| Runtime | Minimum supported | Tested in CI |
|---------|-------------------|--------------|
| Node.js | 18.x | 20.x, 22.x |
| npm | 9.x | 10.x (bundled with Node 20) |
| PowerShell | 5.1 | 7.x (Windows runner) |
| bash | 4.0 | 5.x (macOS), 5.x (Ubuntu) |
| Git | 2.20+ | 2.x (latest) |
| OS — macOS | 12 (Monterey) | macos-latest (CI) |
| OS — Windows | 10 22H2 | windows-latest (CI) |
| OS — Linux | Ubuntu 20.04 | ubuntu-latest (CI) |

Dropping support for any row above = **MAJOR** bump.

---

## 7. Settings & State Migrations

When the installer or update script needs to migrate user state:

1. **Backup first**: existing files copied to `<file>.bak.<timestamp>` (chmod 600 for secrets)
2. **Additive merge default**: user values preserved, new keys added with sensible defaults
3. **Destructive merge opt-in only**: requires `--fresh` / `-Fresh` flag with explicit prompt in CHANGELOG
4. **Idempotent**: running the migration twice MUST produce the same result

Reference implementation: `scripts/update-settings.js`.

---

## 8. CI Enforcement

The following CI guards prevent accidental breaking changes:

| Guard | Job | What it checks |
|-------|-----|----------------|
| Installer Parity | `installer-parity` | Both `install.sh` and `install.ps1` expose the same flags declared in `installer-capability-matrix.json` |
| Install Smoke (3 OS) | `install-smoke` | Real installer runs to completion on macOS / Ubuntu / Windows |
| Portability Guard | `detect-hardcoded-paths` | No user-specific absolute paths leak into committed code |
| README Skill Count | `readme-skill-count-sync` | README matches actual skill directory count |
| Unit Tests | `test` | 1092+ test suite covers regression-prone paths |
| Quality Gate | `quality-gate` | All of the above must pass |

If you intentionally need to introduce a breaking change, you MUST:

1. Update `installer-capability-matrix.json` (and accept the `installer-parity` failure as expected)
2. Add an entry to `CHANGELOG.md` under "Breaking Changes"
3. Get explicit `breaking-change-approved` label on the PR

---

## 9. Out-of-Policy Changes

The following are explicitly NOT covered by this policy and MAY change at any time without notice:

- Internal hook log/data file format under `.claude/hooks/data/`
- Debate artifacts under `debate/`, `debate-v*/`, `debate-audit/`
- Research records under `docs/research-knowledge-scaling/`
- Session log files under `ログ/`
- Anything outside `package.json` scripts, `~/.claude/`, and the public skill directory

---

## 10. Reporting Compatibility Issues

If a release breaks something that this policy says shouldn't break:

1. Open an issue with title prefix `[compat]`
2. Include: `sunagent15` version, OS, Node version, exact error
3. Tag with `breaking-change-regression`
4. Maintainers will treat as P0 — patch release within 7 days

---

## Appendix: Changelog Categories

For consistency, classify each entry in `CHANGELOG.md` under one of:

- **Added** — new public features (MINOR)
- **Changed** — changes to existing functionality (MINOR if compatible, MAJOR if not)
- **Deprecated** — features marked for removal (MINOR + start of cycle)
- **Removed** — features removed after deprecation cycle (MAJOR)
- **Fixed** — bug fixes (PATCH)
- **Security** — vulnerability fixes (PATCH or MINOR)
- **Breaking** — incompatible changes (MAJOR ONLY)

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
