# TAISUN_HOME Design Consensus - Opus x Codex Pro

## Core Principle
Resolve hook SCRIPT PATH to absolute without changing CWD.

## Agreed Design

### 3-tier fallback (context-dependent)

For install/update/setup scripts:
```
CLI arg > script-location auto-detect > TAISUN_HOME env
```

For hook launcher (no script context):
```
CLI arg > TAISUN_HOME env > launcher-location fallback
```

### Hook command pattern (NEW)
```
Current:  [ ! -f .claude/hooks/X.js ] && exit 0; node .claude/hooks/X.js
New:      HOOK="$TAISUN_HOME/.claude/hooks/X.js"; [ ! -f "$HOOK" ] && exit 0; node "$HOOK"
```
CWD stays unchanged - hooks still see target project as process.cwd().

### TAISUN_HOME persistence
1. Canonical store: ~/.config/taisun/env
   ```
   export TAISUN_HOME="/path/to/taisun_agent"
   ```
2. Shell RC: one idempotent source marker block
   ```bash
   # >>> taisun >>>
   [ -f ~/.config/taisun/env ] && source ~/.config/taisun/env
   # <<< taisun <<<
   ```
3. PowerShell: [Environment]::SetEnvironmentVariable('TAISUN_HOME', path, 'User')

### Stale TAISUN_HOME handling
- If TAISUN_HOME is set but directory missing: emit warning, fall back to local .claude
- install.sh/update.sh auto-heal: compare REPO_DIR vs persisted, update if different
- verify-installation.js: add stale TAISUN_HOME check

### Migration tool for 31 hook commands
- JSON-aware Node script (extend update-settings.js or new update-hook-commands.js)
- No sed (BSD/GNU difference, JSON quoting hazard)
- Backup before rewrite (existing pattern in update-settings.js:44-87)

## Implementation Steps (for next session)
1. scripts/lib/resolve-home.sh - shared path resolution function
2. scripts/update-hook-commands.js - JSON-based hook command migrator
3. install.sh - write ~/.config/taisun/env + RC source marker + run migrator
4. update.sh - TAISUN_HOME refresh on repo move detection
5. install.ps1 - [Environment]::SetEnvironmentVariable
6. verify-installation.js - stale TAISUN_HOME detection
7. Cross-platform validation

## Codex Disagreements Accepted by Opus
| Point | Codex Position | Accepted |
|-------|---------------|----------|
| No cd prefix | process.cwd() hooks would break | YES |
| ~/.config/taisun/env | Better than direct RC edit | YES |
| JSON-aware migration | sed is unsafe for JSON | YES |
| Stale path handling | Silent skip is insufficient | YES |
| Fallback order split | Scripts vs hooks need different order | YES |
| PS env var first | Profile edit only as fallback | YES |

## Files Affected
- scripts/lib/resolve-home.sh (NEW)
- scripts/update-hook-commands.js (NEW)
- scripts/install.sh
- scripts/update.sh
- scripts/setup-project.sh
- scripts/install.ps1
- scripts/setup-project.ps1
- scripts/verify-installation.js
- .claude/settings.json (31 hook commands)
