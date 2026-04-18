#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const SMALL_FILE_LIMIT_BYTES = 1024 * 1024;

function usage() {
  console.log('Usage: node scripts/uninstall-core.js --repo-dir <path> [--apply] [--yes] [--purge] [--help]');
  console.log('');
  console.log('Default mode is dry-run. Use --apply to execute removals.');
}

function parseArgs(argv) {
  const args = {
    apply: false,
    purge: false,
    yes: false,
    help: false,
    repoDir: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') {
      args.apply = true;
      continue;
    }
    if (arg === '--purge') {
      args.purge = true;
      continue;
    }
    if (arg === '--yes') {
      args.yes = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }
    if (arg === '--repo-dir') {
      if (i + 1 >= argv.length) {
        throw new Error('--repo-dir requires a value');
      }
      args.repoDir = argv[i + 1];
      i += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return args;
}

function toPosixDisplay(p) {
  return p.replace(/\\/g, '/');
}

function timestampForBackup() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hour}${minute}${second}`;
}

function listDirEntriesSafe(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_) {
    return [];
  }
}

function readJsonSafe(filePath) {
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { ok: false, error };
  }
}

function normalizeForCompare(p) {
  const resolved = path.resolve(p);
  if (process.platform === 'win32') {
    return resolved.toLowerCase();
  }
  return resolved;
}

function isPathInside(candidatePath, rootPath) {
  const candidate = normalizeForCompare(candidatePath);
  const root = normalizeForCompare(rootPath);
  if (candidate === root) {
    return true;
  }
  const rel = path.relative(root, candidate);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function resolveSymlinkTarget(entryPath) {
  try {
    return fs.realpathSync(entryPath);
  } catch (_) {
    try {
      const linkTarget = fs.readlinkSync(entryPath);
      return path.resolve(path.dirname(entryPath), linkTarget);
    } catch (_) {
      return null;
    }
  }
}

function formatNames(names) {
  if (!names || names.length === 0) {
    return '(none)';
  }
  const max = 8;
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  if (sorted.length <= max) {
    return `(${sorted.join(', ')})`;
  }
  const shown = sorted.slice(0, max);
  return `(${shown.join(', ')}, +${sorted.length - max} more)`;
}

function fileSha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function filesMatch(sourcePath, targetPath) {
  let sourceStat;
  let targetStat;
  try {
    sourceStat = fs.statSync(sourcePath);
    targetStat = fs.statSync(targetPath);
  } catch (_) {
    return false;
  }

  if (!sourceStat.isFile() || !targetStat.isFile()) {
    return false;
  }

  const smallEnough =
    sourceStat.size <= SMALL_FILE_LIMIT_BYTES && targetStat.size <= SMALL_FILE_LIMIT_BYTES;

  if (smallEnough) {
    try {
      return fileSha256(sourcePath) === fileSha256(targetPath);
    } catch (_) {
      return false;
    }
  }

  return path.basename(sourcePath) === path.basename(targetPath);
}

function collectSkillPlan(skillsDir, repoDir) {
  const remove = [];
  const preserve = [];

  for (const entry of listDirEntriesSafe(skillsDir)) {
    const fullPath = path.join(skillsDir, entry.name);
    let stat;
    try {
      stat = fs.lstatSync(fullPath);
    } catch (_) {
      continue;
    }

    if (stat.isSymbolicLink()) {
      const target = resolveSymlinkTarget(fullPath);
      if (target && isPathInside(target, repoDir)) {
        remove.push(entry.name);
      } else {
        preserve.push(entry.name);
      }
      continue;
    }

    preserve.push(entry.name);
  }

  return {
    remove: remove.sort((a, b) => a.localeCompare(b)),
    preserve: preserve.sort((a, b) => a.localeCompare(b)),
  };
}

function collectAgentPlan(agentsDir, sourceAgentsDir) {
  const remove = [];
  const preserve = [];
  const sourceByName = new Map();

  for (const entry of listDirEntriesSafe(sourceAgentsDir)) {
    if (!entry.isFile()) {
      continue;
    }
    if (entry.name === 'CLAUDE.md') {
      continue;
    }
    sourceByName.set(entry.name, path.join(sourceAgentsDir, entry.name));
  }

  for (const entry of listDirEntriesSafe(agentsDir)) {
    const fullPath = path.join(agentsDir, entry.name);
    let stat;
    try {
      stat = fs.lstatSync(fullPath);
    } catch (_) {
      continue;
    }

    if (!stat.isFile()) {
      preserve.push(entry.name);
      continue;
    }

    const sourcePath = sourceByName.get(entry.name);
    if (!sourcePath) {
      preserve.push(entry.name);
      continue;
    }

    if (filesMatch(sourcePath, fullPath)) {
      remove.push(entry.name);
    } else {
      preserve.push(entry.name);
    }
  }

  return {
    remove: remove.sort((a, b) => a.localeCompare(b)),
    preserve: preserve.sort((a, b) => a.localeCompare(b)),
  };
}

function templateMcpKeys(mcpConfigPath) {
  if (!fs.existsSync(mcpConfigPath)) {
    return [];
  }
  const parsed = readJsonSafe(mcpConfigPath);
  if (!parsed.ok || !parsed.value || typeof parsed.value !== 'object') {
    return [];
  }
  const mcpServers = parsed.value.mcpServers || {};
  return Object.keys(mcpServers)
    .filter((key) => !key.startsWith('_comment'))
    .sort((a, b) => a.localeCompare(b));
}

function collectMcpPlan(settingsFile, mcpConfigPath) {
  const templateKeys = templateMcpKeys(mcpConfigPath);

  if (!fs.existsSync(settingsFile)) {
    return {
      remove: [],
      preserve: [],
      settingsExists: false,
      settingsJson: {},
      parseError: null,
    };
  }

  const parsed = readJsonSafe(settingsFile);
  if (!parsed.ok) {
    return {
      remove: [],
      preserve: [],
      settingsExists: true,
      settingsJson: null,
      parseError: parsed.error,
    };
  }

  const settingsJson = parsed.value && typeof parsed.value === 'object' ? parsed.value : {};
  const mcpServers = settingsJson.mcpServers && typeof settingsJson.mcpServers === 'object'
    ? settingsJson.mcpServers
    : {};

  const existingKeys = Object.keys(mcpServers);
  const templateSet = new Set(templateKeys);
  const remove = existingKeys
    .filter((key) => templateSet.has(key))
    .sort((a, b) => a.localeCompare(b));
  const preserve = existingKeys
    .filter((key) => !templateSet.has(key))
    .sort((a, b) => a.localeCompare(b));

  return {
    remove,
    preserve,
    settingsExists: true,
    settingsJson,
    parseError: null,
  };
}

function backupSettings(settingsFile) {
  const backupFile = `${settingsFile}.bak.${timestampForBackup()}`;
  fs.copyFileSync(settingsFile, backupFile);
  try {
    fs.chmodSync(backupFile, 0o600);
  } catch (_) {
    // Non-POSIX filesystems may reject chmod.
  }
  return backupFile;
}

function applyMcpRemoval(plan, settingsFile) {
  if (!plan.settingsExists) {
    return { applied: false, removed: [], backupFile: null, error: null };
  }

  if (plan.parseError) {
    return {
      applied: false,
      removed: [],
      backupFile: null,
      error: `Cannot parse ${settingsFile}: ${plan.parseError.message}`,
    };
  }

  if (plan.remove.length === 0) {
    return { applied: false, removed: [], backupFile: null, error: null };
  }

  const settingsJson = JSON.parse(JSON.stringify(plan.settingsJson || {}));
  if (!settingsJson.mcpServers || typeof settingsJson.mcpServers !== 'object') {
    settingsJson.mcpServers = {};
  }

  for (const key of plan.remove) {
    delete settingsJson.mcpServers[key];
  }

  const backupFile = backupSettings(settingsFile);
  const tmpFile = `${settingsFile}.tmp.${process.pid}`;
  fs.writeFileSync(tmpFile, JSON.stringify(settingsJson, null, 2));
  fs.renameSync(tmpFile, settingsFile);

  return {
    applied: true,
    removed: [...plan.remove],
    backupFile,
    error: null,
  };
}

function emitTelemetry(repoDir, eventName, payload) {
  const emitScript = path.join(repoDir, 'scripts', 'emit.js');

  if (fs.existsSync(emitScript)) {
    try {
      spawnSync(process.execPath, [emitScript, eventName, JSON.stringify(payload || {})], {
        stdio: 'ignore',
      });
      return;
    } catch (_) {
      // Fall through to local fallback.
    }
  }

  try {
    const telemetryDir = path.join(os.homedir(), '.claude', '.taisun');
    const optInFile = path.join(telemetryDir, 'telemetry-opt-in');
    if (!fs.existsSync(optInFile)) {
      return;
    }
    fs.mkdirSync(telemetryDir, { recursive: true });
    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      payload: payload || {},
    };
    const eventFile = path.join(telemetryDir, 'events.log');
    fs.appendFileSync(eventFile, `${JSON.stringify(event)}\n`);
  } catch (_) {
    // Telemetry is best-effort and must never break uninstall.
  }
}

function promptForYes() {
  return new Promise((resolve) => {
    process.stdout.write("Type 'yes' to continue: ");
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
      resolve(String(data || '').trim());
    });
  });
}

function ensureSafeRepoDelete(repoDir) {
  const resolved = path.resolve(repoDir);
  if (resolved === '/' || /^[A-Za-z]:\\?$/.test(resolved)) {
    throw new Error(`Refusing to delete unsafe path: ${resolved}`);
  }
}

function backupEnvFiles(repoDir, homeDir) {
  const entries = listDirEntriesSafe(repoDir);
  const envFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name === '.env' || name.startsWith('.env.'))
    .sort((a, b) => a.localeCompare(b));

  if (envFiles.length === 0) {
    return { moved: [], backupDir: null };
  }

  const backupDir = path.join(homeDir, `.taisun-env-backup.${timestampForBackup()}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const moved = [];
  for (const name of envFiles) {
    const src = path.join(repoDir, name);
    const dst = path.join(backupDir, name);
    try {
      fs.renameSync(src, dst);
      moved.push(name);
    } catch (_) {
      try {
        fs.copyFileSync(src, dst);
        fs.unlinkSync(src);
        moved.push(name);
      } catch (_) {
        // Keep going; best effort.
      }
    }
  }

  return { moved, backupDir };
}

function deleteSkillSymlinks(skillsDir, names) {
  let removed = 0;
  for (const name of names) {
    const fullPath = path.join(skillsDir, name);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      removed += 1;
    } catch (_) {
      // Keep uninstall idempotent.
    }
  }
  return removed;
}

function deleteAgentFiles(agentsDir, names) {
  let removed = 0;
  for (const name of names) {
    const fullPath = path.join(agentsDir, name);
    try {
      fs.rmSync(fullPath, { force: true });
      removed += 1;
    } catch (_) {
      // Keep uninstall idempotent.
    }
  }
  return removed;
}

function scheduleRepoDeletion(repoDir) {
  if (process.platform === 'win32') {
    const escaped = repoDir.replace(/'/g, "''");
    const ps = `Start-Sleep -Seconds 1; if (Test-Path -LiteralPath '${escaped}') { Remove-Item -LiteralPath '${escaped}' -Recurse -Force }`;
    const child = spawn('powershell.exe', ['-NoProfile', '-Command', ps], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    return;
  }

  const escaped = repoDir.replace(/"/g, '\\"');
  const child = spawn('/bin/sh', ['-c', `sleep 1; rm -rf "${escaped}"`], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

function printSummary({ repoDir, skillsPlan, agentsPlan, mcpPlan, purge, repoDeletionAllowed, telemetryDir }) {
  console.log('Would remove:');
  console.log(`  skills:        ${skillsPlan.remove.length} symlinks pointing into ${toPosixDisplay(repoDir)}`);
  console.log(`  agents:        ${agentsPlan.remove.length} files matching source`);
  console.log(`  mcp servers:   ${mcpPlan.remove.length} entries ${formatNames(mcpPlan.remove)}`);
  if (purge) {
    const telemetryExists = fs.existsSync(telemetryDir);
    console.log(`  purge data:    ${telemetryExists ? 1 : 0} directories (~/.claude/.taisun)`);
    console.log(
      `  repo dir:      ${repoDeletionAllowed ? 1 : 0} directory ${repoDeletionAllowed ? `(${toPosixDisplay(repoDir)})` : '(requires --apply --yes --purge)'}`
    );
  }

  console.log('Would preserve:');
  console.log(`  user skills:   ${skillsPlan.preserve.length} ${formatNames(skillsPlan.preserve)}`);
  console.log(`  user agents:   ${agentsPlan.preserve.length} ${formatNames(agentsPlan.preserve)}`);
  console.log(`  user mcps:     ${mcpPlan.preserve.length} ${formatNames(mcpPlan.preserve)}`);

  if (mcpPlan.parseError) {
    console.log(`  note:          skipped MCP removal planning (invalid settings.json: ${mcpPlan.parseError.message})`);
  }
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    usage();
    process.exit(2);
    return;
  }

  if (args.help) {
    usage();
    return;
  }

  if (!args.repoDir) {
    console.error('Error: --repo-dir is required.');
    usage();
    process.exit(2);
    return;
  }

  const repoDir = path.resolve(args.repoDir);
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');
  const skillsDir = path.join(claudeDir, 'skills');
  const agentsDir = path.join(claudeDir, 'agents');
  const sourceAgentsDir = path.join(repoDir, '.claude', 'agent-source');
  const mcpConfigPath = path.join(repoDir, '.mcp.json');
  const settingsFile = path.join(claudeDir, 'settings.json');
  const telemetryDir = path.join(claudeDir, '.taisun');

  const skillsPlan = collectSkillPlan(skillsDir, repoDir);
  const agentsPlan = collectAgentPlan(agentsDir, sourceAgentsDir);
  const mcpPlan = collectMcpPlan(settingsFile, mcpConfigPath);

  const repoDeletionAllowed = args.apply && args.purge && args.yes;

  printSummary({
    repoDir,
    skillsPlan,
    agentsPlan,
    mcpPlan,
    purge: args.purge,
    repoDeletionAllowed,
    telemetryDir,
  });

  if (!args.apply) {
    console.log('');
    console.log('Dry-run only. Re-run with --apply to make changes.');
    return;
  }

  if (!args.yes) {
    if (!process.stdin.isTTY) {
      console.error('Error: --apply requires interactive confirmation or --yes.');
      process.exit(2);
      return;
    }
    const answer = await promptForYes();
    if (answer !== 'yes') {
      console.log('Uninstall canceled. Nothing was removed.');
      process.exit(1);
      return;
    }
  }

  emitTelemetry(repoDir, 'uninstall_started', {
    purge: args.purge,
  });

  const removedSkillCount = deleteSkillSymlinks(skillsDir, skillsPlan.remove);
  const removedAgentCount = deleteAgentFiles(agentsDir, agentsPlan.remove);
  const mcpApplyResult = applyMcpRemoval(mcpPlan, settingsFile);

  emitTelemetry(repoDir, 'uninstall_completed', {
    purge: args.purge,
    removedSkills: removedSkillCount,
    removedAgents: removedAgentCount,
    removedMcpServers: mcpApplyResult.removed.length,
  });

  let telemetryPurged = false;
  if (args.purge && fs.existsSync(telemetryDir)) {
    try {
      fs.rmSync(telemetryDir, { recursive: true, force: true });
      telemetryPurged = true;
    } catch (_) {
      telemetryPurged = false;
    }
  }

  let envBackup = { moved: [], backupDir: null };
  let repoDeleteScheduled = false;
  if (args.purge && args.apply && args.yes) {
    try {
      ensureSafeRepoDelete(repoDir);
      envBackup = backupEnvFiles(repoDir, homeDir);
      scheduleRepoDeletion(repoDir);
      repoDeleteScheduled = true;
    } catch (error) {
      console.error(`Warning: failed to schedule repository purge: ${error.message}`);
    }
  }

  console.log('');
  console.log('Removed:');
  console.log(`  skills:        ${removedSkillCount} symlinks`);
  console.log(`  agents:        ${removedAgentCount} files`);
  console.log(`  mcp servers:   ${mcpApplyResult.removed.length} entries ${formatNames(mcpApplyResult.removed)}`);
  if (mcpApplyResult.backupFile) {
    console.log(`  settings bak:  ${path.basename(mcpApplyResult.backupFile)}`);
  } else {
    console.log('  settings bak:  (not needed)');
  }

  console.log('Preserved:');
  console.log(`  user skills:   ${skillsPlan.preserve.length} ${formatNames(skillsPlan.preserve)}`);
  console.log(`  user agents:   ${agentsPlan.preserve.length} ${formatNames(agentsPlan.preserve)}`);
  console.log(`  user mcps:     ${mcpPlan.preserve.length} ${formatNames(mcpPlan.preserve)}`);

  if (mcpApplyResult.error) {
    console.log(`Warning: ${mcpApplyResult.error}`);
  }

  if (args.purge) {
    console.log(`Purge: telemetry ${telemetryPurged ? 'removed' : 'not found'}`);
    if (repoDeleteScheduled) {
      if (envBackup.moved.length > 0 && envBackup.backupDir) {
        console.log(`Purge: moved env files to ${toPosixDisplay(envBackup.backupDir)} (${envBackup.moved.join(', ')})`);
      }
      console.log(`Purge: repository deletion scheduled for ${toPosixDisplay(repoDir)}`);
    } else {
      console.log('Purge: repository not deleted (requires --apply --yes --purge)');
    }
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
