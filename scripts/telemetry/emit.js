#!/usr/bin/env node
/**
 * Opt-in telemetry emitter for sunagent15 install/update events.
 *
 * Default behavior: NO-OP (telemetry is opt-in only).
 *
 * Activation methods (any one enables emission):
 *   1. Env var:    TAISUN_TELEMETRY=1
 *   2. Opt-in file: ~/.claude/.taisun/telemetry-opt-in (any non-empty content)
 *
 * Disable via either: unset env var + delete the opt-in file.
 *
 * Usage:
 *   node scripts/telemetry/emit.js <event_type> [--key=value ...]
 *
 * Event types:
 *   install_started, install_completed, install_failed,
 *   update_started, update_completed, update_failed,
 *   uninstall_started, uninstall_completed
 *
 * What gets emitted (NO PII):
 *   - anonymous install_id (UUID v4, generated locally, stored in opt-in file)
 *   - event type
 *   - timestamp (ISO 8601)
 *   - sunagent15 version (from package.json)
 *   - OS family (darwin/linux/win32) + major version
 *   - Node major version
 *   - profile name (if applicable)
 *   - duration_ms (if applicable)
 *   - skill_count (if applicable)
 *   - error_category (if failed; e.g. npm_install_fail — NOT raw error message)
 *
 * What is NEVER emitted:
 *   - hostname, username, IP, MAC, exact paths beyond install dir name
 *   - raw error messages, stack traces
 *   - environment variables, .env contents
 *   - any project file content
 *
 * Output destinations:
 *   1. Always (when enabled): append to ~/.claude/.taisun/telemetry/events.jsonl
 *   2. Optionally: HTTP POST to TAISUN_TELEMETRY_ENDPOINT if set
 *
 * This script never fails the caller. All errors are swallowed silently.
 */

'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const TAISUN_DIR    = path.join(os.homedir(), '.claude', '.taisun');
const OPT_IN_FILE   = path.join(TAISUN_DIR, 'telemetry-opt-in');
const TELEMETRY_DIR = path.join(TAISUN_DIR, 'telemetry');
const EVENTS_FILE   = path.join(TELEMETRY_DIR, 'events.jsonl');
const ENDPOINT      = process.env.TAISUN_TELEMETRY_ENDPOINT || '';

function isEnabled() {
  if (process.env.TAISUN_TELEMETRY === '1' || process.env.TAISUN_TELEMETRY === 'true') {
    return true;
  }
  try {
    const c = fs.readFileSync(OPT_IN_FILE, 'utf8');
    return c.trim().length > 0;
  } catch (_) {
    return false;
  }
}

function getOrCreateInstallId() {
  try {
    if (fs.existsSync(OPT_IN_FILE)) {
      const content = fs.readFileSync(OPT_IN_FILE, 'utf8').trim();
      // If file already contains a UUID, reuse it
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(content)) {
        return content;
      }
    }
    // Generate new UUID v4
    const uuid = generateUuid();
    fs.mkdirSync(TAISUN_DIR, { recursive: true });
    fs.writeFileSync(OPT_IN_FILE, uuid + '\n', { mode: 0o600 });
    return uuid;
  } catch (_) {
    return 'unknown';
  }
}

function generateUuid() {
  // Minimal UUID v4 without external deps
  const bytes = require('crypto').randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

function getPackageVersion() {
  try {
    const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  } catch (_) {
    return 'unknown';
  }
}

function buildEvent(eventType, kvArgs) {
  const event = {
    schema_version: 1,
    install_id: getOrCreateInstallId(),
    event_type: eventType,
    timestamp: new Date().toISOString(),
    taisun_version: getPackageVersion(),
    os: {
      family: process.platform,
      major: os.release().split('.')[0],
    },
    node_major: process.versions.node.split('.')[0],
  };

  // Whitelisted optional fields (NEVER add PII to this list)
  const allowedKeys = new Set([
    'profile',
    'duration_ms',
    'skill_count',
    'error_category',
    'flags',
  ]);
  for (const [k, v] of Object.entries(kvArgs)) {
    if (allowedKeys.has(k)) event[k] = v;
  }

  return event;
}

function appendLocal(event) {
  try {
    fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
    fs.appendFileSync(EVENTS_FILE, JSON.stringify(event) + '\n');
  } catch (_) {
    /* never fail caller */
  }
}

async function postRemote(event) {
  if (!ENDPOINT) return;
  try {
    // Node 18+ has global fetch
    if (typeof fetch !== 'function') return;
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      // Short timeout — telemetry MUST NOT block install
      signal: AbortSignal.timeout(2000),
    });
  } catch (_) {
    /* never fail caller */
  }
}

function parseKvArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [k, ...rest] = arg.substring(2).split('=');
      const v = rest.join('=');
      if (k && v !== undefined) {
        // Numeric coercion for known numeric fields
        if (k === 'duration_ms' || k === 'skill_count') {
          const n = Number(v);
          out[k] = Number.isFinite(n) ? n : v;
        } else {
          out[k] = v;
        }
      }
    }
  }
  return out;
}

async function main() {
  if (!isEnabled()) {
    process.exit(0);
  }
  const eventType = process.argv[2];
  if (!eventType) {
    process.exit(0);
  }
  const kv = parseKvArgs(process.argv.slice(3));
  const event = buildEvent(eventType, kv);
  appendLocal(event);
  await postRemote(event);
}

// Wrap in try/catch so this script NEVER causes the caller to fail
main().catch(() => process.exit(0));
