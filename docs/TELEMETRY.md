# Telemetry — Opt-in Install/Update Tracking

**Status**: Stable
**Default**: **DISABLED** (opt-in only)
**Last updated**: 2026-04-19

---

## TL;DR

- Telemetry is **OFF by default** and never sends anything.
- Enable explicitly: `node scripts/telemetry/manage.js enable`
- Disable any time: `node scripts/telemetry/manage.js disable`
- See what's logged locally: `node scripts/telemetry/manage.js show`

No personally identifiable information is ever collected.

---

## Why telemetry exists

Without aggregate install/failure data, the maintainers cannot answer:

- Which OS combinations have the highest install failure rate?
- Are users hitting the new fail-fast Node 18 check?
- Which profile (minimal/standard/full) is most popular?
- Are updates failing more on Windows than macOS?

These signals drive bug-fix prioritization. They're useful only with **explicit user consent**.

---

## Activation

Either method enables telemetry:

### Method 1: CLI (recommended)
```bash
node scripts/telemetry/manage.js enable
```
Creates `~/.claude/.taisun/telemetry-opt-in` containing your anonymous install ID (UUID v4).

### Method 2: Environment variable
```bash
export TAISUN_TELEMETRY=1
```
Useful for CI / scripted environments. Overrides absence of opt-in file but does NOT create persistent state.

To verify:
```bash
node scripts/telemetry/manage.js status
```

---

## Deactivation

```bash
node scripts/telemetry/manage.js disable
```
Removes the opt-in file. Also unset `TAISUN_TELEMETRY` env var if set.

After disabling, **no further events are emitted**. Existing local event log can be deleted with:
```bash
node scripts/telemetry/manage.js purge
```

---

## Exact data sent (full schema)

Each event is a single JSON object:

```json
{
  "schema_version": 1,
  "install_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "install_completed",
  "timestamp": "2026-04-19T12:34:56.789Z",
  "taisun_version": "2.53.3",
  "os": {
    "family": "darwin",
    "major": "23"
  },
  "node_major": "20",
  "profile": "standard",
  "duration_ms": 187234,
  "skill_count": 67,
  "flags": "--profile standard",
  "error_category": "npm_install_fail"
}
```

| Field | Type | Always present? | Notes |
|-------|------|-----------------|-------|
| `schema_version` | int | yes | Bumped on incompatible schema change |
| `install_id` | UUID v4 | yes | Generated locally, opaque, no link to your identity |
| `event_type` | enum | yes | See event types below |
| `timestamp` | ISO 8601 | yes | UTC |
| `taisun_version` | semver | yes | From `package.json` |
| `os.family` | enum | yes | `darwin` / `linux` / `win32` |
| `os.major` | string | yes | e.g. `23` for macOS 14, `10` for Windows 10 |
| `node_major` | string | yes | e.g. `20` |
| `profile` | enum | conditional | `minimal` / `standard` / `full` |
| `duration_ms` | int | conditional | install/update wall-clock time |
| `skill_count` | int | conditional | post-install skill directory count |
| `flags` | string | conditional | exact CLI flags used (no values that could be paths) |
| `error_category` | enum | failed events only | See error categories below |

### Event types

- `install_started` / `install_completed` / `install_failed`
- `update_started` / `update_completed` / `update_failed`
- `uninstall_started` / `uninstall_completed`

### Error categories (categorical, never raw error text)

- `node_version_too_old`
- `npm_install_fail`
- `npm_build_fail`
- `mcp_setup_fail`
- `verify_fail`
- `git_pull_fail`
- `disk_space_fail`
- `network_fail`
- `unknown`

---

## What is NEVER collected

The following are **explicitly excluded** by code in `scripts/telemetry/emit.js`. The whitelist of optional fields is hard-coded — anything outside it is dropped.

- ❌ Hostname, username, real name
- ❌ IP address (server may see it via TCP — but client never sends it)
- ❌ MAC address, machine UUID
- ❌ File paths beyond install dir name
- ❌ Raw error messages or stack traces
- ❌ Environment variables (entire `process.env`)
- ❌ `.env` file contents (API keys etc.)
- ❌ Project file content
- ❌ Skill output, prompt content, or model responses
- ❌ Network request/response bodies

---

## Where data goes

### Local (always when enabled)
Events are appended to:
```
~/.claude/.taisun/telemetry/events.jsonl
```
You can inspect with:
```bash
node scripts/telemetry/manage.js show --last 50
```

### Remote (only if explicitly configured)
Set the endpoint URL:
```bash
export TAISUN_TELEMETRY_ENDPOINT="https://example.com/collect"
```

If unset (default), **no remote transmission occurs**. The current upstream maintainers have **not yet announced an official endpoint** — local-only collection is the current state.

When set:
- HTTP POST with `Content-Type: application/json`
- 2-second timeout
- Failure is silent (telemetry MUST NOT block install)
- Same data as local file

---

## Implementation guarantees

The emitter (`scripts/telemetry/emit.js`) is designed to:

1. **Never fail the caller** — all errors swallowed, exits 0
2. **Never block** — local write is sync (fast), remote POST has 2s timeout
3. **Never log when disabled** — first check is `isEnabled()`; early return
4. **Hard-coded whitelist** — only known-safe fields make it into events
5. **No external deps** — pure Node stdlib, no npm packages
6. **File permissions 0600** — opt-in file is readable only by user

---

## CI behavior

Telemetry is automatically disabled in CI environments:

- Install scripts detect `CI=true` and skip emission
- This avoids noise from automated runs

If you want to test the telemetry path in CI, explicitly set `TAISUN_TELEMETRY=1` and unset `CI=true` in that test job only.

---

## For maintainers / contributors

### Add a new event type

1. Add the type to the list in this doc
2. Add a hook call to `install.sh` / `install.ps1` / `update.sh`:
   ```bash
   node scripts/telemetry/emit.js my_new_event --duration_ms=$((SECONDS * 1000)) || true
   ```
3. The `|| true` guard is mandatory — telemetry MUST NOT fail the caller

### Add a new field

1. Add to the `allowedKeys` set in `emit.js` (hard-coded whitelist)
2. Document it in this doc
3. Bump `schema_version` if the change is breaking
4. Coordinate with downstream consumers if a remote endpoint is in use

### Threat model

| Risk | Mitigation |
|------|-----------|
| Sensitive data leak | Hard-coded whitelist + this doc as review checklist |
| Network blocking install | 2s timeout + silent failure |
| Replay/tamper | Out of scope — telemetry is informational, not authoritative |
| Identity correlation | UUID is local-generated; no link to GitHub/email/etc |
| Quitting via opt-out | Removing opt-in file fully stops emission immediately |

---

## Changing your mind

You can switch between enabled/disabled freely. Disabling does NOT delete your install ID — it stays in the file in case you re-enable later. To fully forget:

```bash
node scripts/telemetry/manage.js disable
node scripts/telemetry/manage.js purge
rm -rf ~/.claude/.taisun
```

---

## Audit trail

This document defines the contract. Any expansion of collected data MUST:

1. Update this document
2. Be reviewed in PR with `telemetry-scope-change` label
3. Be announced in CHANGELOG
4. Get explicit re-consent if breaking (per `docs/COMPATIBILITY_POLICY.md` §4)
