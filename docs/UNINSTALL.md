# TAISUN Uninstall Guide

## Command

macOS/Linux:

```bash
bash scripts/uninstall.sh
```

Windows (PowerShell):

```powershell
./scripts/uninstall.ps1
```

Default behavior is **dry-run**. Nothing is deleted unless you pass `--apply` (or `-Apply` on PowerShell).

## Flags

macOS/Linux:

- `--apply`: Execute removals (otherwise dry-run only).
- `--yes`: Skip interactive `yes` prompt for `--apply`.
- `--purge`: Also remove `~/.claude/.taisun/` and schedule repository deletion.

Windows:

- `-Apply`: Execute removals (otherwise dry-run only).
- `-Yes`: Skip interactive `yes` prompt for `-Apply`.
- `-Purge`: Also remove `~/.claude/.taisun/` and schedule repository deletion.

## What Gets Removed

1. `~/.claude/skills/*`
Only entries that are symlinks/junctions pointing into this TAISUN repo are removed.

2. `~/.claude/agents/*`
Only files that match `.claude/agent-source/*` are removed.
Small files are compared by SHA-256; larger files fall back to path match.

3. `~/.claude/settings.json` MCP entries
Only MCP keys listed in this repo's `.mcp.json` are removed from `mcpServers`.
A backup is created first: `~/.claude/settings.json.bak.YYYYMMDD_HHMMSS`.

4. Optional purge (`--purge` / `-Purge`)
- Removes `~/.claude/.taisun/`.
- Deletes the repository directory **only when all are set**: `--purge --apply --yes`.

## What Is Preserved

- User-created skills in `~/.claude/skills/` that are real directories/files.
- Symlinks in `~/.claude/skills/` pointing outside this repo.
- User-created or modified agent files in `~/.claude/agents/` that do not match source.
- User-added MCP servers in `~/.claude/settings.json` that are not in `.mcp.json`.
- `.env` and `.env.*` files are not deleted directly. During full repo purge, they are moved to `$HOME/.taisun-env-backup.<timestamp>/` first.

## Confirmation Model

- `--apply` / `-Apply` always prints a summary first.
- Interactive mode requires typing exactly `yes`.
- Non-interactive runs must use `--yes` / `-Yes`.

## Recovery

1. Restore MCP settings backup if needed:

```bash
cp ~/.claude/settings.json.bak.<timestamp> ~/.claude/settings.json
```

2. Reinstall TAISUN assets:

```bash
npm run setup
```

3. If you ran purge with repo deletion, recover environment files from:

- macOS/Linux: `$HOME/.taisun-env-backup.<timestamp>/`
- Windows: `$HOME/.taisun-env-backup.<timestamp>/`
