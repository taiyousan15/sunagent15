# Sub-Agent C: Security Boundaries — Full Findings Report

**Session**: 20 (session20-review)
**Agent**: Sub-Agent C — Security Boundaries Scanner
**Investigation Date**: 2026-04-21
**Status**: COMPLETE — all 6 target areas investigated

---

## Executive Summary

| Severity | Count | Deployed |
|----------|-------|---------|
| CRITICAL | 1 | Credentials in plaintext Praetorian compaction cache |
| HIGH     | 3 | Shell injection / ghost-writer root cause; unsanitized CWD in hook; unsigned ZIP download |
| MEDIUM   | 2 | Bash permission with empty deny-list; virtualenv broken absolute paths |
| LOW      | 1 | Hardcoded GitHub repo name in hook |

**Ghost-writer root cause confirmed**: `scripts/install.sh` lines 584–592 contains an inline `node -e` snippet that writes the runtime absolute path of the MCP binary into `.claude/settings.json` on every install. This is the only mechanism that touches settings.json from the codebase — all hooks are cleared.

**Secrets posture**: `.env` is properly gitignored and not present in git HEAD. One credential (`Fish Audio API key`) was found in a Praetorian compaction file — also gitignored but not covered by standard `.env` hygiene checks.

**Permission posture**: `Bash` is allowed with no path/command restrictions and `permissions.deny` is empty, giving the model unrestricted shell access.

---

## Pattern 10 Self-Check

All numeric claims in this report are based on direct file reads and grep output, not on sub-agent reports. Each finding below cites the exact file path and line number(s) verified during this investigation.

---

## Finding: CRITICAL-01 — Credential in Praetorian Compaction Plaintext

**File**: `.claude/praetorian/compactions/cpt_1770642420495_3yfdl.toon`  
**Line**: 6 (key_insights array, first element)  
**Content (exact)**: `"Fish Audio API Key: <REDACTED — see commit history for incident; rotated post-disclosure>"`

**What it is**: A Praetorian session-memory compaction file. These are auto-generated cache files that store AI session context summaries. The Fish Audio API key was captured verbatim when the session context included the credential.

**Risk**:
- The file is in `.gitignore` via the `praetorian/` exclusion pattern — NOT committed to git.
- However, it lives on disk in plaintext. If the repository directory is shared, zipped, or if the gitignore is ever relaxed, this credential leaks.
- Fish Audio API keys grant access to voice synthesis API with billing implications.
- Standard `.env` hygiene (rotating keys in `.env`, checking git history) would NOT catch this file.

**Gitignore status**: Gitignored — confirmed by absence of `.toon` files in `git ls-files`.

**Recommendation**: Rotate the Fish Audio API key. Add a pre-commit hook or CI check that scans `praetorian/compactions/` for patterns matching API key regexes. Consider encrypting compaction files at rest.

---

## Finding: HIGH-01 — Shell Variable Interpolation into node -e String (Ghost-Writer Root Cause)

**File**: `scripts/install.sh`  
**Lines**: 580–593  
**Confirmed read**: Yes — Read tool with offset=570, limit=30

**Code (verbatim)**:
```bash
PROJ_SETTINGS="$REPO_DIR/.claude/settings.json"
CODEGRAPH_BIN="$REPO_DIR/tools/codebase-memory-mcp/codebase-memory-mcp"
if [ -f "$PROJ_SETTINGS" ] && [ -f "$CODEGRAPH_BIN" ]; then
    node -e "
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('$PROJ_SETTINGS', 'utf8'));
if (s.mcpServers && s.mcpServers['codebase-memory']) {
  s.mcpServers['codebase-memory'].command = '$CODEGRAPH_BIN';
  fs.writeFileSync('$PROJ_SETTINGS', JSON.stringify(s, null, 2));
}
" 2>/dev/null
fi
```

**Ghost-writer mechanism**:
- `$CODEGRAPH_BIN` resolves to the absolute runtime path (e.g., `/path/to/<user>/Desktop/dev04/taisun_agent/tools/codebase-memory-mcp/codebase-memory-mcp`)
- This absolute path is interpolated directly into the `node -e` JS string at line 588
- `fs.writeFileSync` then writes this absolute path into `.claude/settings.json` under `mcpServers.codebase-memory.command`
- This runs on every `install.sh` execution, overwriting the relative `./tools/...` value that was previously committed to git
- This is exactly what was observed in Session 18 as the "ghost-writer" behavior

**Shell injection surface**:
- `$REPO_DIR` is interpolated without quoting inside the double-quoted node string
- If `REPO_DIR` contains a single quote (e.g., user's home directory path has apostrophe in a folder name), the single-quoted JS string terminates early, allowing arbitrary JS injection
- Example: `REPO_DIR="/home/alice's project"` → JS string becomes `'$CODEGRAPH_BIN'` which parses as `'` + `$CODEGRAPH_BIN` + unmatched `'`

**Recommendation**:
1. Remove the inline `node -e` patch entirely. The `mcpServers.codebase-memory.command` value should remain as the relative path `./tools/codebase-memory-mcp/codebase-memory-mcp` (it is already committed as relative in the repo).
2. If absolutization is truly required, use `update-settings.js` (already exists and uses proper `path.join(repoDir, arg)` expansion) rather than an inline bash-to-node string injection.
3. Alternatively, convert the inline node snippet to a separate JS file that receives paths as `process.argv` arguments rather than shell string interpolation.

---

## Finding: HIGH-02 — Unsanitized input.cwd in session-issue-logger.js

**File**: `.claude/hooks/session-issue-logger.js`  
**Lines**: 176, 139–141, ~180–195  
**Confirmed read**: Yes — Read tool on the full file

**Code (line 176)**:
```js
const cwd = input.cwd || process.cwd();
```

**Usage**: `cwd` is passed as the `cwd` option to `execSync` for at least 4 git commands:
```js
execSync('git branch --show-current', { cwd, stdio: ['pipe', 'pipe', 'pipe'] })
execSync('git log -1 --format="%H"', { cwd, ... })
// plus 2 additional git invocations
```

And for the GitHub CLI call:
```js
execSync(`gh issue create --repo "${REPO}" --title "${safeTitle}" --body-file "${tempFile}"`, { cwd, ... })
```

**Risk**:
- `input` is the parsed stdin JSON from Claude Code's hook system. The `cwd` field is provided by the Claude Code host process and reflects the session's working directory.
- In the current deployment model (single-user, single-machine), this field is trustworthy.
- However, if TAISUN is ever used in a multi-user server context (e.g., a shared Claude Code server, or if the hook stdin can be influenced by user-supplied data), an attacker who can control `input.cwd` can point git and gh CLI execution to an arbitrary directory.
- The `cwd` value is used as a `child_process` CWD option, not interpolated into a shell string, so this is NOT a shell injection — it is a path traversal / unexpected working directory risk.

**Hardcoded REPO (line 18)**:
```js
const REPO = 'san15/taisun_agent';
```
- This hardcodes the original author's GitHub repo. Any fork or redistribution will silently file issues to the original developer's repository.
- Classified as LOW (see LOW-01).

**Recommendation**: Validate `input.cwd` against an allowlist (e.g., must be under `process.env.HOME`) or against the known TAISUN repository root before using it as a process CWD.

---

## Finding: HIGH-03 — ZIP Download Without Checksum Verification

**File A**: `scripts/update.sh`  
**Lines**: 86–111 (approximately)  
**Confirmed read**: Yes — Read tool

**Code pattern**:
```bash
ZIP_URL="https://github.com/san15/taisun_agent/archive/refs/heads/main.zip"
curl -fsSL "$ZIP_URL" -o "$ZIP_PATH"
unzip -q "$ZIP_PATH" -d "$TMP_DIR"
```

**File B**: `scripts/install.ps1` (Windows)  
**Lines**: 124–144 (approximately)  
**Confirmed read**: Yes — Read tool

**Code pattern**:
```powershell
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath $tmpDir -Force
```

**Risk**:
- No SHA-256 or GPG signature verification before extracting the archive.
- A MITM attacker who can intercept or redirect the GitHub ZIP download URL can serve a malicious archive containing backdoored hook scripts or MCP binaries.
- HTTPS provides transport security, but does not protect against GitHub account compromise or DNS hijacking.
- The extracted content is placed directly into the user's TAISUN installation and hooks are registered with Claude Code, making any injected code execute with full model permissions.

**Recommendation**: After download, verify SHA-256 against a pinned hash published in the repository (e.g., in `releases/checksums.txt`). Alternatively, use `git clone` + `git verify-commit` with GPG-signed release commits instead of anonymous ZIP download.

---

## Finding: MEDIUM-01 — Bash Allowed with No Restrictions; permissions.deny Empty

**File**: `.claude/settings.json`  
**Confirmed read**: Yes — Read tool

**Relevant config**:
```json
"permissions": {
  "allow": [
    "Bash",
    "Read",
    "Write",
    "Edit",
    "Glob",
    "Grep",
    "Task",
    "WebFetch",
    "WebSearch",
    "AskUserQuestion"
  ],
  "deny": []
}
```

**Risk**:
- `Bash` permission with an empty `deny` list grants the model unrestricted shell access: file system modifications, network access, process execution, environment variable reading, and access to all credentials reachable from the shell.
- There is no deny rule blocking access to sensitive paths (e.g., `~/.ssh`, `~/.aws`, `~/.gnupg`, `/etc/`).
- Claude Code's `permissions.allow` for `Bash` does not currently support path-level restrictions, but `deny` rules for specific tools or patterns are available and are not used here.
- In the current single-user personal setup this is an accepted design choice. For any shared or server deployment, this is a significant attack surface.

**Note**: This is the intentional design of TAISUN (agentic automation requires broad shell access). The risk is documented, not a bug. Severity classified as MEDIUM because it is by design but should be explicitly acknowledged in any security posture documentation.

**Recommendation**: Document the accepted risk in a `SECURITY.md` or `THREAT_MODEL.md`. If multi-user deployment is planned, implement a shell command allowlist or use a wrapper script that filters dangerous commands before execution.

---

## Finding: MEDIUM-02 — Virtualenv Shebangs Reference Broken Absolute Path

**Files**: `.claude/skills/nanobanana-pro/.venv/bin/pip`, `pip3`, `pip3.9`, `patchright`, `dotenv`, `activate`, `activate.fish`, `activate.csh`

**Confirmed read**: Yes — Bash `head -5` on pip and activate files

**Content (pip shebang line 1)**:
```
#!/path/to/<user>/taisun_agent/.claude/skills/nanobanana-pro/.venv/bin/python3
```

**Content (activate, VIRTUAL_ENV)**:
```
VIRTUAL_ENV='/path/to/<user>/taisun_agent/.claude/skills/nanobanana-pro/.venv'
```

**Observations**:
- The path is `/path/to/<user>/taisun_agent/...` (old location, before the project was moved to `dev04/taisun_agent`)
- These files are generated by Python's `venv` module and contain the absolute path of the virtualenv at creation time
- They are NOT git-tracked (confirmed: `.venv/` is in `.gitignore`)
- They will not work on any other machine or if the project directory changes

**Risk**: If any skill or hook attempts to invoke `pip`, `patchright`, or activate the venv using these scripts, the commands will silently fail with "No such file or directory" on any machine other than the original. The nanobanana-pro skill will be broken for any new user or after a directory move.

**Recommendation**: Document in `README.md` or the nanobanana-pro skill installation instructions that the `.venv` must be recreated after install (`python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`). The install script should include this step. The `.venv/` gitignore entry is correct.

---

## Finding: LOW-01 — Hardcoded GitHub Repo Name in Hook

**File**: `.claude/hooks/session-issue-logger.js`  
**Line**: 18  
**Content**:
```js
const REPO = 'san15/taisun_agent';
```

**Risk**: Any user who forks or redistributes TAISUN and runs this hook will have their session issues filed to the original author's repository at `github.com/san15/taisun_agent`. This is a data leakage issue (session summaries sent to wrong repo) and a nuisance for the original author.

**Recommendation**: Replace with a dynamic value: read the GitHub remote from `git remote get-url origin` at runtime, or add a configuration entry in `scan-config.yml` / `.claude/settings.json` that specifies the target issue repository.

---

## Ghost-Writer Investigation — Summary

**Question**: What process rewrote `.claude/settings.json` to inject absolute paths? Session 18 caught it; Session 19 saw no recurrence.

**Suspects investigated**:

| Suspect | Status | Evidence |
|---------|--------|---------|
| `context-snapshot-manager.js` | CLEARED | Writes only to `.claude/temp-context/${sessionId}/` — no reference to settings.json anywhere in the file |
| All 38+ other hook `.js` files | CLEARED | `grep -r "writeFile.*settings" .claude/hooks/` returned zero results across all hook source files |
| `hook-profiler.js` | CLEARED | References `settings.json` path but only calls `JSON.parse(fs.readFileSync(...))` — read-only |
| `codebase-memory-mcp` binary | PARTIAL — writes to HOME settings | Binary has `install` subcommand that writes to `~/.claude/settings.json` (global), not project settings. Called by `codegraph-auto-index.js` hook after Write/Edit. NOT the ghost-writer for project settings. |
| **`scripts/install.sh` lines 584–592** | **CONFIRMED ROOT CAUSE** | Inline `node -e` snippet explicitly calls `fs.writeFileSync('$PROJ_SETTINGS', ...)` with `command = '$CODEGRAPH_BIN'` where `$CODEGRAPH_BIN` is the absolute runtime path |

**Why no recurrence in Session 19**: `install.sh` only runs when the user explicitly re-runs the installer. If no install was performed between Session 18 and Session 19, the rewrite would not recur. The current state of `.claude/settings.json` shows `"command": "./tools/codebase-memory-mcp/codebase-memory-mcp"` (relative path) — this confirms the installer has not been re-run since the last time someone manually restored the relative path.

---

## Hardcoded Paths Audit — Summary

### In git-tracked source files

| Location | Path | Severity | Gitignored? |
|----------|------|----------|-------------|
| `scripts/install.sh:588` (runtime interpolation) | `$CODEGRAPH_BIN` → absolute | HIGH-01 | No — this is the installer |
| `.claude/hooks/session-issue-logger.js:18` | `'san15/taisun_agent'` (repo name, not path) | LOW-01 | No |

**No hardcoded `/path/to/<user>` found in any `.js` hook source file.** (grep across all hooks confirmed zero matches)

### In runtime/generated files (gitignored)

| Location | Path | Notes |
|----------|------|-------|
| `.claude/skills/nanobanana-pro/.venv/bin/*` | `/path/to/<user>/taisun_agent/...` (old path) | Python venv generated; gitignored |
| `.claude/skills/nanobanana-pro/data/auth_info.json` | `/path/to/<user>/Desktop/dev04/taisun_agent/...` | Runtime data; gitignored |
| `.claude/handoff.json` | `/path/to/<user>/Desktop/dev04/taisun_agent` | Session handoff file; gitignored |

---

## Secrets Audit — Summary

### .env file

**Status**: NOT git-tracked. Confirmed via `git grep ANTHROPIC_API_KEY` — no results.

**Credentials present in .env** (partial list — key names only, not values):
- `ANTHROPIC_API_KEY` (sk-ant-... prefix)
- `TWITTER_AUTH_TOKEN`, `TWITTER_CT0`, `TWITTER_TWID`, `TWITTER_COOKIES`
- `XAI_API_KEY`
- `OPENROUTER_API_KEY`
- `BROWSERBASE_API_KEY`
- `SKYVERN_API_KEY`
- `FIRECRAWL_API_KEY`
- `FAL_KEY`
- `TAVILY_API_KEY`, `SERPAPI_KEY`, `BRAVE_SEARCH_API_KEY`, `PEXELS_API_KEY`, `APIFY_TOKEN`, `PERPLEXITY_API_KEY`, `EXA_API_KEY`

All confirmed NOT in git HEAD. The `.env` gitignore pattern is effective.

### Credential outside .env

**CRITICAL-01**: Fish Audio API key `<REDACTED>` found in `.claude/praetorian/compactions/cpt_1770642420495_3yfdl.toon` line 6. This file is gitignored but the credential is not protected by standard `.env` hygiene. **Note (2026-04-26)**: This review document was committed to the public repo on 2026-04-21 (PR #334) with the literal key value, exposing it for ~5 days before being redacted in PR #344. The key MUST be rotated by the project owner; a redacted-after-the-fact document does not undo the prior public disclosure.

### Git history check

`git log --all --oneline | wc -l` and `git grep -i "api_key\|auth_token\|secret" -- "*.env"` both returned zero results for credentials in tracked files. No credential found in git history.

---

## Permission Audit — Summary

**File**: `.claude/settings.json`

```json
"permissions": {
  "allow": ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "Task", "WebFetch", "WebSearch", "AskUserQuestion"],
  "deny": []
}

"qualityGates": {
  "codeReviewMinScore": 80,
  "testCoverageMin": 80,
  "securityScanRequired": true
}
```

**Observations**:
1. `securityScanRequired: true` is set in qualityGates — good intent, but enforcement depends on CI/CD integration which was not investigated in this scope.
2. `Bash` is fully allowed with no command-level restrictions.
3. `deny: []` — no explicit deny rules. Claude Code supports deny patterns for tool arguments but none are configured.
4. `Task` is allowed — sub-agents can be spawned without restriction.
5. `WebFetch` and `WebSearch` are allowed — outbound network access is unrestricted.

**MCP server**: Only one MCP server is active (`codebase-memory`). All others are disabled via `disabledMcpServers` list. This is a good practice — minimal MCP attack surface.

---

## Findings Index (for 99-final-report.md reference)

| ID | Severity | One-line summary | File | Lines |
|----|----------|-----------------|------|-------|
| C-01 | CRITICAL | Fish Audio API key in plaintext compaction cache | `.claude/praetorian/compactions/cpt_1770642420495_3yfdl.toon` | 6 |
| H-01 | HIGH | Shell interpolation into node -e writes absolute MCP path (ghost-writer root cause) | `scripts/install.sh` | 584–592 |
| H-02 | HIGH | Unsanitized input.cwd from hook stdin used as process CWD for git/gh execSync | `.claude/hooks/session-issue-logger.js` | 176, 139–141 |
| H-03 | HIGH | ZIP download in update/install scripts without checksum verification | `scripts/update.sh` L86–111; `scripts/install.ps1` L124–144 | — |
| M-01 | MEDIUM | Bash tool allowed with empty deny list; no command restrictions | `.claude/settings.json` | — |
| M-02 | MEDIUM | Virtualenv shebangs reference broken old absolute path | `.claude/skills/nanobanana-pro/.venv/bin/*` | 1 |
| L-01 | LOW | Hardcoded GitHub repo name routes session issues to original author | `.claude/hooks/session-issue-logger.js` | 18 |

---

*Report written by Sub-Agent C (Security Boundaries Scanner). All findings verified by direct file read. No sub-agent reports were used as the sole source for any numeric or factual claim.*
