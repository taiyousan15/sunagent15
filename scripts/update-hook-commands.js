#!/usr/bin/env node
/**
 * Migrate hook commands in .claude/settings.json to use TAISUN_HOME.
 *
 * Transforms:
 *   [ ! -f .claude/hooks/X.js ] && exit 0; node .claude/hooks/X.js
 * Into:
 *   H="${TAISUN_HOME:-.}/.claude/hooks/X.js"; [ ! -f "$H" ] && exit 0; node "$H"
 *
 * Uses JSON parser (not sed) to avoid quoting/encoding hazards.
 * Creates backup before modification.
 *
 * Usage: node scripts/update-hook-commands.js [--dry-run]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const positionalArgs = process.argv.slice(2).filter(a => !a.startsWith('--'));
const REPO_DIR = positionalArgs[0] || path.resolve(__dirname, '..');
const SETTINGS_PATH = path.join(REPO_DIR, '.claude', 'settings.json');

const HOOK_PATTERN = /^\[ ! -f (\.claude\/hooks\/[^\]]+) \] && exit 0; node \1$/;

function migrateCommand(cmd) {
  const match = cmd.match(HOOK_PATTERN);
  if (!match) return null;
  const hookPath = match[1];
  return `H="\${TAISUN_HOME:-.}/${hookPath}"; [ ! -f "$H" ] && exit 0; node "$H"`;
}

function processHooks(obj) {
  let count = 0;
  if (!obj || typeof obj !== 'object') return count;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += processHooks(item);
    }
  } else {
    if (obj.command && typeof obj.command === 'string') {
      const migrated = migrateCommand(obj.command);
      if (migrated) {
        if (!DRY_RUN) obj.command = migrated;
        count++;
      }
    }
    for (const val of Object.values(obj)) {
      if (val && typeof val === 'object') {
        count += processHooks(val);
      }
    }
  }
  return count;
}

function main() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    console.error('settings.json not found:', SETTINGS_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
  const settings = JSON.parse(raw);

  const migrated = processHooks(settings.hooks || {});

  if (migrated === 0) {
    console.log('No hook commands to migrate (already migrated or none found).');
    return;
  }

  console.log(`${DRY_RUN ? '[DRY RUN] Would migrate' : 'Migrating'} ${migrated} hook commands.`);

  if (!DRY_RUN) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backup = `${SETTINGS_PATH}.bak.${ts}`;
    fs.writeFileSync(backup, raw);
    fs.chmodSync(backup, 0o600);
    console.log('Backup:', backup);

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
    console.log('settings.json updated.');
  }
}

main();
