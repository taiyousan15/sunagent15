# TAISUN_HOME Design Proposal - Opus 4.6

## Findings: Option D Investigation

Claude Code hook execution environment (measured):
- CLAUDECODE=1
- CLAUDE_CODE_EXECPATH=/.../.local/share/claude/versions/2.1.107
- PWD=/Users/.../taisun_agent (CWD at launch time)
- NO CLAUDE_PROJECT_DIR exists

Verdict: Option D is NOT viable. No native env var for project root.

## Opus Recommendation: Option A + B Hybrid

### Core Design: 3-tier fallback chain
```
1. CLI arg (--taisun-home=/path)     <- explicit override
2. TAISUN_HOME env var               <- persistent config
3. Auto-detect from script location  <- current behavior (default)
```

### Implementation

#### Phase E-1: scripts/lib/resolve-home.sh (new shared function)
```bash
resolve_taisun_home() {
  if [ -n "$1" ]; then
    echo "$1"
  elif [ -n "$TAISUN_HOME" ]; then
    echo "$TAISUN_HOME"
  else
    echo "$(cd "$(dirname "$0")/.." && pwd)"
  fi
}
```

#### Phase E-2: install.sh writes TAISUN_HOME to shell rc
- Appends `export TAISUN_HOME=/actual/path` to ~/.zshrc or ~/.bashrc
- Only if not already present (idempotent)
- install.ps1 writes to PowerShell profile

#### Phase E-3: Hook commands use TAISUN_HOME with fallback
Current: `node .claude/hooks/X.js`
New: `[ -n "$TAISUN_HOME" ] && cd "$TAISUN_HOME"; node .claude/hooks/X.js`

Or simpler: hooks already have `[ ! -f .claude/hooks/X.js ] && exit 0` guard.
The guard + TAISUN_HOME env means:
- From taisun_agent dir: works (PWD has the files)
- From other project WITH TAISUN_HOME: cd first, then run
- From other project WITHOUT TAISUN_HOME: guard silently skips (current behavior)

### Why NOT pure Option B (absolute paths in settings.json)
- settings.json becomes user-specific, breaks git pull
- Requires settings.json.template pattern (complexity)
- install.sh already does path rewriting (update-settings.js:130-141) but only for MCP args

### Why NOT pure Option C (wrapper script)
- Adds indirection layer
- Wrapper itself needs path resolution (chicken-egg)

### Files to modify
1. scripts/lib/resolve-home.sh (NEW) - shared path resolution
2. scripts/install.sh:16 - use resolve_taisun_home()
3. scripts/update.sh:9 - same
4. scripts/setup-project.sh:19-20 - same
5. scripts/install.ps1:37 - PowerShell equivalent
6. scripts/setup-project.ps1:26-27 - same
7. .claude/settings.json hook commands (31 entries) - add TAISUN_HOME cd prefix

### Risk Assessment
- Shell rc modification: medium risk (user may have custom rc)
- Hook command changes: low risk (fallback preserves current behavior)
- PowerShell profile: medium risk (Codex should review)

### Questions for Codex
1. Is modifying ~/.zshrc acceptable for install.sh? Or should we use ~/.config/taisun/env instead?
2. Should hook commands use cd prefix or should hooks themselves resolve TAISUN_HOME internally?
3. For the 31 hook commands, is batch sed replacement safe or should we update them individually?
4. PowerShell profile modification strategy?
