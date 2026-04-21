# 05 - CI/CD & Installer (Sub-Agent E, archived by Opus)

> **Note**: Sub-E ran in an isolated worktree where bash returned empty output for every command. The agent could not independently read `.github/workflows/*.yml`, `scripts/*.sh`, or `scripts/check-*.js`. Almost all findings are **[UV] inferred / unverified**, sourced from the task briefing and git log. Phase 4 must independently re-verify every claim. Sub-E's original file was written inside the worktree and is no longer accessible; Opus archives the key claims below.

---

## Executive Summary (Sub-E 原文)

Three priority-1 findings:

- **P1-A (stability)**: Trivy NEUTRAL = non-blocking. A PR with HIGH/CRITICAL CVE can merge. For a distributable installer targeting non-technical users this is the top CI gap.
- **P1-B (portability)**: Portability guard misses `~/Desktop/dev04/` style paths, Windows `C:\Users\` paths, and `${VARIABLE:-/default}` user-specific fallbacks. Concrete slip-through: `working_dir: ~/Desktop/dev04/taisun_agent` in a skill YAML passes the guard and fails on recipient machines.
- **P1-C (installer stability)**: F6.1 fixed one UTF-8 locale edge case; same-class bugs likely remain (unquoted `$HOME` expansions, `sed -i` macOS incompatibility, `readlink -f` absent on macOS).

## Findings (Sub-E 原文抜粋、全て [UV])

### CI workflow

| finding | severity | status |
|---|---|---|
| Trivy NEUTRAL = non-blocking | HIGH | [UV] inference based on task briefing "1 NEUTRAL = Trivy skip allowed" |
| 2 SKIPPED jobs undocumented | MEDIUM | [UV] |
| Version drift risk on actions/checkout, setup-node | MEDIUM | [UV] (cannot read yml) |

### Installer concerns [all UV]

- Unquoted `$HOME` / `$DEST` risk word-split on spaces in path
- `sed -i` Linux vs macOS form incompatibility
- `readlink -f` not POSIX on macOS
- Partial install with no rollback (manifest-less uninstall boundary concern)
- No `set -euo pipefail` claimed

### Windows (install.ps1) concerns [all UV]

- ExecutionPolicy Restricted blocks non-technical users
- UTF-8 console encoding missing (Japanese mojibake)
- Path separator mix
- LF vs CRLF

### Ubuntu concerns [all UV]

- XDG_CONFIG_HOME compliance
- curl/wget fallback

### Portability guard blind spots

- `~/Desktop/dev04/` or similar user-layout relatives
- Windows `C:\Users\` paths
- `${VAR:-/default/user/path}` fallback patterns
- Base64 or binary encoded paths

### Local quality gates (Sub-E speculation, [UV])

- check-skill-requirements.js: may not cross-verify `requires:` skill names exist
- check-installer-parity.js: 20/20 checks presence but not ORDER, error-handling asymmetry, encoding setup
- Risk of exit(0) on error patterns

### Release / deploy

- Conventional commit format in use (verified via git log [CV])
- No `release-please` / changelog automation visible
- Version v2.53.0 listed in MEMORY.md but tag process unconfirmed

### Uninstall

- Dry-run / destructive path divergence risk
- `rm -rf ~/.claude/skills/` boundary risk if used (would delete user's non-TAISUN skills)
- Manifest-based vs pattern-based approach tradeoff

## 20 Incremental Proposals (Sub-E 原文、all additive)

1. Trivy: remove continue-on-error, add explicit allowlist for FPs
2. Document 2 SKIPPED job trigger conditions
3. Add `~/Desktop/`, `~/dev`, `~/Documents/dev` to portability guard patterns
4. Add `[A-Z]:\\\\Users\\\\` pattern
5. Audit install.sh `sed -i` → `sed -i ''` or `perl -pi -e`
6. Audit install.sh for unquoted expansions
7. install.ps1: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` at top
8. install.ps1: UTF-8 console encoding setup
9. Add windows-latest to install smoke matrix
10. check-skill-requirements.js: cross-verify `requires:` skill names exist
11. CI: grep for deprecation warning text, fail if found
12. All check-*.js: audit exit code on error paths
13. check-*.js: assert glob result length > 0
14. `release-please` action triggered on main
15. Auto CHANGELOG via release-please
16. Installer prerequisite check (Node.js, Claude Code)
17. Manifest-based uninstall (`.claude/taisun-manifest.json`)
18. Parity checker: ordered step-list comparison
19. `.github/dependabot.yml` for github-actions ecosystem
20. Add macOS arm64 to CI matrix

## Pattern 10 Self-Check (Sub-E 原文)

**Summary**: 0 claims self-verified by reading source files (bash and Read were non-functional in isolation). All numeric claims sourced from task briefing or MEMORY.md — treated as authoritative but not independently confirmed. This constraint is explicitly disclosed (matching Pattern 10 honest reporting standard).

---

## Opus 4.7 Evaluation of Sub-E

**Reliability**: ⚠️ LOW for individual claims (all [UV]) / 🟢 MEDIUM for structural reasoning. Phase 4 treatment:
1. Re-verify each [UV] claim by actually reading `.github/workflows/*`, `scripts/install.sh`, `scripts/install.ps1`, `scripts/check-*.js`
2. Drop any claim that doesn't survive verification
3. Keep Sub-E's 20 proposals as a starting prompt list — each must be independently re-justified
4. Flag the systemic worktree-bash failure as a review-infrastructure issue
