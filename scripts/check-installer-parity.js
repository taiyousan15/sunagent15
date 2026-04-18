#!/usr/bin/env node
/**
 * Installer capability parity checker.
 *
 * Verifies that flags declared in scripts/installer-capability-matrix.json
 * are actually present in scripts/install.sh and scripts/install.ps1.
 *
 * Exits non-zero if any declared flag is missing from its target installer.
 *
 * Usage:
 *   node scripts/check-installer-parity.js
 *
 * CI: invoked by .github/workflows/ci.yml install-smoke job (or its own job).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const REPO       = path.resolve(__dirname, '..');
const MATRIX     = path.join(REPO, 'scripts', 'installer-capability-matrix.json');
const SH_PATH    = path.join(REPO, 'scripts', 'install.sh');
const PS_PATH    = path.join(REPO, 'scripts', 'install.ps1');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  const matrix = JSON.parse(read(MATRIX));
  const sh = read(SH_PATH);
  const ps = read(PS_PATH);

  const errors = [];
  const ok = [];

  for (const cap of matrix.capabilities) {
    // Bash flag check (exact match in case statement, e.g. `--profile)`)
    if (cap.bash) {
      const re = new RegExp(`\\s${escapeRegex(cap.bash)}\\b`);
      if (!re.test(sh)) {
        errors.push(`[install.sh] missing flag: ${cap.bash} (capability: ${cap.name})`);
      } else {
        ok.push(`[install.sh] ${cap.bash}`);
      }
    }

    // PowerShell parameter check (look for $Param or [Alias("Param")])
    if (cap.powershell) {
      const paramName = cap.powershell.replace(/^-/, '');
      // Match either `$ParamName` parameter declaration or `[Alias("Param")]`
      const re = new RegExp(
        `(\\$${escapeRegex(paramName)}\\b|\\[Alias\\("${escapeRegex(paramName)}"\\)\\])`
      );
      // Also accept the alias variant
      const aliasName = cap.powershell_alias ? cap.powershell_alias.replace(/^-/, '') : null;
      const aliasRe = aliasName
        ? new RegExp(`\\$${escapeRegex(aliasName)}\\b`)
        : null;
      if (!re.test(ps) && !(aliasRe && aliasRe.test(ps))) {
        errors.push(`[install.ps1] missing parameter: ${cap.powershell} (capability: ${cap.name})`);
      } else {
        ok.push(`[install.ps1] ${cap.powershell}`);
      }
    }
  }

  console.log('Installer Parity Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Matrix entries: ${matrix.capabilities.length}`);
  console.log(`Verified OK:    ${ok.length}`);
  console.log(`Errors:         ${errors.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('❌ FAIL — the following flags are declared in matrix but missing from installers:');
    errors.forEach((e) => console.log('  ' + e));
    console.log('');
    console.log('Fix: either add the missing flag to the installer, OR remove it from the matrix.');
    process.exit(1);
  }

  console.log('✅ All declared capabilities present in both installers.');
}

main();
