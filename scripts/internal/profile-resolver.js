#!/usr/bin/env node
/**
 * Resolves a skill profile name (+ extras) to a newline-separated list of skill names.
 *
 * This file replaces an inline `node -e` block that interpolated shell values
 * directly into JavaScript source, which was injection-prone for paths/profile
 * names containing quotes or special characters.
 *
 * Usage:
 *   PROFILE_FILE=/abs/path/skill-profiles.json \
 *   PROFILE=standard \
 *   EXTRAS="docker figma" \
 *     node scripts/internal/profile-resolver.js
 *
 * Output: skill names, one per line, on stdout.
 * Exit codes:
 *   0 = success
 *   1 = profile file missing or invalid
 */

'use strict';

const fs = require('fs');

const PROFILE_FILE = process.env.PROFILE_FILE;
const PROFILE      = process.env.PROFILE || 'standard';
const EXTRAS_RAW   = process.env.EXTRAS || '';

if (!PROFILE_FILE) {
  process.stderr.write('PROFILE_FILE env var is required\n');
  process.exit(1);
}

let profiles;
try {
  profiles = JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf8'));
} catch (err) {
  process.stderr.write(`Failed to read ${PROFILE_FILE}: ${err.message}\n`);
  process.exit(1);
}

if (!profiles.presets || !profiles.profiles) {
  process.stderr.write(`Invalid profile file shape (missing presets/profiles)\n`);
  process.exit(1);
}

const preset = profiles.presets[PROFILE] || profiles.presets.standard;
if (!preset) {
  process.stderr.write(`Profile not found: ${PROFILE}\n`);
  process.exit(1);
}

const extras = EXTRAS_RAW.split(/\s+/).filter(Boolean);
const activeGroups = [...new Set([...preset, ...extras])];

const skills = new Set();
for (const group of activeGroups) {
  const groupDef = profiles.profiles[group];
  if (groupDef && Array.isArray(groupDef.skills)) {
    groupDef.skills.forEach((s) => skills.add(s));
  }
}

process.stdout.write([...skills].join('\n') + (skills.size > 0 ? '\n' : ''));
