#!/usr/bin/env node
/**
 * TAISUN Agent - Settings.json updater with non-destructive merge.
 *
 * Replaces the old install.sh inline REPLACE logic that overwrote user MCP
 * customizations on every `npm run setup`. The default mode now PRESERVES
 * user values; --fresh mode restores the old destructive behavior for
 * users who explicitly want a clean reset (via `npm run setup:fresh`).
 *
 * Usage:
 *   node scripts/update-settings.js <REPO_DIR> <SETTINGS_FILE> [--fresh]
 *
 * Behavior:
 *   1. Reads SETTINGS_FILE (or treats as empty if missing).
 *   2. Reads <REPO_DIR>/.mcp.json as the template source.
 *   3. Backs up SETTINGS_FILE to ${SETTINGS_FILE}.bak.${TIMESTAMP}
 *      (chmod 600, keep latest 3 generations). Abort on backup failure.
 *   4. Merges:
 *      - additive (default): user values win, new MCPs added with disabled:true
 *      - fresh (--fresh):    template values win (old behavior)
 *   5. Rewrites SETTINGS_FILE atomically.
 *   6. Prints a summary of added / preserved MCP keys.
 *
 * The merge logic mirrors src/utils/settings-merge.ts (unit tested).
 */

'use strict';

const fs = require('fs');
const path = require('path');

function log(msg) {
  process.stderr.write(msg + '\n');
}

function readJsonOrEmpty(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {
    return {};
  }
}

function backupSettingsFile(settingsFile) {
  if (!fs.existsSync(settingsFile)) {
    return { skipped: true };
  }
  const now = new Date();
  const ts =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const backupFile = `${settingsFile}.bak.${ts}`;
  fs.copyFileSync(settingsFile, backupFile);
  try {
    fs.chmodSync(backupFile, 0o600);
  } catch (_) {
    /* chmod failures are non-fatal on non-POSIX systems */
  }

  // FIFO: keep latest 3 backups, delete older ones.
  const dir = path.dirname(settingsFile);
  const baseName = path.basename(settingsFile);
  try {
    const prefix = `${baseName}.bak.`;
    const backups = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith(prefix))
      .map((f) => ({ f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    for (const old of backups.slice(3)) {
      try {
        fs.unlinkSync(path.join(dir, old.f));
      } catch (_) {
        /* ignore */
      }
    }
  } catch (_) {
    /* directory enumeration failure is non-fatal */
  }

  return { skipped: false, backupFile };
}

function additiveMerge(existing, template) {
  const merged = JSON.parse(JSON.stringify(existing || {}));
  if (!merged.mcpServers) merged.mcpServers = {};
  const existingMcp = merged.mcpServers;
  const templateMcp = (template && template.mcpServers) || {};
  const added = [];
  const preserved = [];
  for (const [key, val] of Object.entries(templateMcp)) {
    if (key.startsWith('_comment')) continue;
    if (!(key in existingMcp)) {
      const cloned = JSON.parse(JSON.stringify(val));
      cloned.disabled = true;
      existingMcp[key] = cloned;
      added.push(key);
    } else {
      preserved.push(key);
    }
  }
  return { merged, added, preserved };
}

function freshMerge(existing, template) {
  const merged = JSON.parse(JSON.stringify(existing || {}));
  if (!merged.mcpServers) merged.mcpServers = {};
  const existingMcp = merged.mcpServers;
  const templateMcp = (template && template.mcpServers) || {};
  const added = [];
  const preserved = [];
  for (const [key, val] of Object.entries(templateMcp)) {
    if (key.startsWith('_comment')) continue;
    if (!(key in existingMcp)) {
      existingMcp[key] = JSON.parse(JSON.stringify(val));
      added.push(key);
    } else {
      existingMcp[key] = JSON.parse(JSON.stringify(val));
      preserved.push(key);
    }
  }
  return { merged, added, preserved };
}

function rewritePaths(merged, repoDir) {
  const mcpServers = merged.mcpServers || {};
  for (const server of Object.values(mcpServers)) {
    if (Array.isArray(server.args)) {
      server.args = server.args.map((arg) => {
        if (
          typeof arg === 'string' &&
          !path.isAbsolute(arg) &&
          (arg.startsWith('dist/') || arg.startsWith('mcp-servers/'))
        ) {
          return path.join(repoDir, arg);
        }
        return arg;
      });
    }
  }
  return merged;
}

function main() {
  const args = process.argv.slice(2);
  const repoDir = args[0];
  const settingsFile = args[1];
  const fresh = args.includes('--fresh');

  if (!repoDir || !settingsFile) {
    log('  ❌ Usage: update-settings.js <REPO_DIR> <SETTINGS_FILE> [--fresh]');
    process.exit(2);
  }

  // Step 1: backup
  let backupInfo;
  try {
    backupInfo = backupSettingsFile(settingsFile);
  } catch (err) {
    log(`  ❌ バックアップに失敗しました: ${err.message}`);
    log('     アップデートを中断します（既存設定を保護）');
    process.exit(1);
  }

  // Step 2: read existing + template
  const existing = readJsonOrEmpty(settingsFile);
  const mcpPath = path.join(repoDir, '.mcp.json');
  const template = readJsonOrEmpty(mcpPath);

  // Step 3: merge
  const merger = fresh ? freshMerge : additiveMerge;
  const result = merger(existing, template);

  // Step 4: rewrite relative paths inside args (dist/... mcp-servers/...)
  rewritePaths(result.merged, repoDir);

  // Step 5: atomic write via temp + rename
  const dir = path.dirname(settingsFile);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${settingsFile}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(result.merged, null, 2));
  fs.renameSync(tmp, settingsFile);

  // Step 6: summary
  const total = Object.keys(result.merged.mcpServers || {}).length;
  const mode = fresh ? 'fresh (destructive reset)' : 'additive (preserves user values)';
  log(`  ✅ ツールを ${total} 個登録しました`);
  log(`     モード: ${mode}`);
  log(`     新規追加: ${result.added.length} 件`);
  log(`     既存保持: ${result.preserved.length} 件`);
  if (!backupInfo.skipped && backupInfo.backupFile) {
    log(`     バックアップ: ${path.basename(backupInfo.backupFile)}`);
  }
  if (result.added.length > 0 && !fresh) {
    log('');
    log(`  ℹ️  新しく追加された ${result.added.length} 個の MCP は安全のため disabled:true です。`);
    log('     使用したい場合は ~/.claude/settings.json の該当キーを false に変更してください。');
    if (result.added.length <= 10) {
      log(`     対象: ${result.added.join(', ')}`);
    }
  }
}

main();
