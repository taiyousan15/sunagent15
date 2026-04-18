#!/usr/bin/env node
/**
 * Telemetry opt-in/opt-out and inspection CLI.
 *
 * Usage:
 *   node scripts/telemetry/manage.js status
 *   node scripts/telemetry/manage.js enable
 *   node scripts/telemetry/manage.js disable
 *   node scripts/telemetry/manage.js show [--last N]
 *   node scripts/telemetry/manage.js purge
 */

'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const TAISUN_DIR    = path.join(os.homedir(), '.claude', '.taisun');
const OPT_IN_FILE   = path.join(TAISUN_DIR, 'telemetry-opt-in');
const TELEMETRY_DIR = path.join(TAISUN_DIR, 'telemetry');
const EVENTS_FILE   = path.join(TELEMETRY_DIR, 'events.jsonl');

function isEnabled() {
  if (process.env.TAISUN_TELEMETRY === '1' || process.env.TAISUN_TELEMETRY === 'true') {
    return { enabled: true, source: 'env var TAISUN_TELEMETRY' };
  }
  try {
    const c = fs.readFileSync(OPT_IN_FILE, 'utf8').trim();
    if (c.length > 0) return { enabled: true, source: 'opt-in file', install_id: c };
  } catch (_) { /* not enabled */ }
  return { enabled: false };
}

function generateUuid() {
  const bytes = require('crypto').randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),  hex.substring(8, 12),  hex.substring(12, 16),
    hex.substring(16, 20), hex.substring(20, 32),
  ].join('-');
}

function cmdStatus() {
  const s = isEnabled();
  if (s.enabled) {
    console.log('Telemetry: ENABLED');
    console.log('  Source:     ' + s.source);
    if (s.install_id) console.log('  Install ID: ' + s.install_id);
    console.log('  Endpoint:   ' + (process.env.TAISUN_TELEMETRY_ENDPOINT || '(local file only)'));
    console.log('  Events log: ' + EVENTS_FILE);
  } else {
    console.log('Telemetry: DISABLED (default)');
    console.log('  Enable with: node scripts/telemetry/manage.js enable');
  }
}

function cmdEnable() {
  fs.mkdirSync(TAISUN_DIR, { recursive: true });
  let id;
  try {
    id = fs.readFileSync(OPT_IN_FILE, 'utf8').trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) id = generateUuid();
  } catch (_) {
    id = generateUuid();
  }
  fs.writeFileSync(OPT_IN_FILE, id + '\n', { mode: 0o600 });
  console.log('Telemetry ENABLED.');
  console.log('  Install ID: ' + id);
  console.log('  Stored in:  ' + OPT_IN_FILE);
  console.log('');
  console.log('See docs/TELEMETRY.md for what gets sent (no PII).');
  console.log('Disable with: node scripts/telemetry/manage.js disable');
}

function cmdDisable() {
  try {
    fs.unlinkSync(OPT_IN_FILE);
    console.log('Telemetry DISABLED. Opt-in file removed.');
  } catch (_) {
    console.log('Telemetry already disabled (no opt-in file).');
  }
  if (process.env.TAISUN_TELEMETRY === '1' || process.env.TAISUN_TELEMETRY === 'true') {
    console.log('  ⚠ TAISUN_TELEMETRY env var is still set. Unset it to fully disable.');
  }
}

function cmdShow(args) {
  let lastN = 10;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--last' && args[i + 1]) {
      lastN = parseInt(args[i + 1], 10);
    }
  }
  if (!fs.existsSync(EVENTS_FILE)) {
    console.log('No events recorded yet.');
    return;
  }
  const lines = fs.readFileSync(EVENTS_FILE, 'utf8').trim().split('\n').filter(Boolean);
  const tail = lines.slice(-lastN);
  for (const line of tail) {
    try {
      const ev = JSON.parse(line);
      console.log(`${ev.timestamp}  ${ev.event_type.padEnd(20)}  v${ev.taisun_version}  ${ev.os.family}  node${ev.node_major}` +
                  (ev.profile ? `  profile=${ev.profile}` : '') +
                  (ev.duration_ms ? `  ${ev.duration_ms}ms` : '') +
                  (ev.error_category ? `  err=${ev.error_category}` : ''));
    } catch (_) {
      console.log('(corrupt line)');
    }
  }
  console.log('');
  console.log(`Total events: ${lines.length} (showing last ${tail.length})`);
}

function cmdPurge() {
  let removed = 0;
  for (const f of [EVENTS_FILE]) {
    try { fs.unlinkSync(f); removed++; } catch (_) {}
  }
  console.log(`Purged ${removed} event file(s). Opt-in file kept (use 'disable' to remove).`);
}

function help() {
  console.log('taisun telemetry — opt-in install/update event tracking');
  console.log('');
  console.log('Commands:');
  console.log('  status   show current opt-in state and install ID');
  console.log('  enable   opt in (creates ~/.claude/.taisun/telemetry-opt-in)');
  console.log('  disable  opt out (removes opt-in file)');
  console.log('  show     show recent events  [--last N]  (default 10)');
  console.log('  purge    delete local event log');
  console.log('');
  console.log('Default: DISABLED. Enable is explicit & reversible.');
  console.log('See docs/TELEMETRY.md for the full data spec.');
}

const cmd = process.argv[2];
const rest = process.argv.slice(3);
switch (cmd) {
  case 'status':  cmdStatus(); break;
  case 'enable':  cmdEnable(); break;
  case 'disable': cmdDisable(); break;
  case 'show':    cmdShow(rest); break;
  case 'purge':   cmdPurge(); break;
  default:        help();
}
