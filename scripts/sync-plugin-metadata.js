#!/usr/bin/env node
/**
 * Sync Plugin Metadata
 *
 * `package.json` を正本として `.claude-plugin/plugin.json` の `version` を、
 * `audit-project-metadata.js` を正本として `plugin.json` / `marketplace.json` の
 * description 内の数値 (スキル / コマンド / MCP) を同期する。
 *
 * Codex 戦略 §7.2 (Source of Truth) / §7.3 (Drift Check) に基づき、
 * 「公開説明 vs 実体」のズレを CI で検出して Pattern 10 の再発を防ぐのが目的。
 *
 * Modes:
 *   --check : drift 検出時 exit 1 (CI 用)
 *   --write : drift があれば自動修正 (numeric / version のみ。agent claim は警告)
 *
 * Sync 対象:
 *   - .claude-plugin/plugin.json :: version  ←  package.json :: version
 *   - .claude-plugin/plugin.json :: description (数値 drift)
 *   - .claude-plugin/marketplace.json :: metadata.description (数値 drift)
 *   - .claude-plugin/marketplace.json :: plugins[*].description (数値 drift)
 *
 * 数値パターン:
 *   N スキル        ← audit.skills.active
 *   N+ コマンド     ← audit.commands.tracked
 *   N MCP {ツール|サーバー|servers|tools} ← audit.mcp.servers
 *   N エージェント   ← installed agents = 0 のため "N エージェント" 表現は無条件で警告。
 *                     文言ごと書き換える必要があるため --write では自動修正しない
 *
 * Usage:
 *   node scripts/sync-plugin-metadata.js --check
 *   node scripts/sync-plugin-metadata.js --write
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { audit } = require('./audit-project-metadata');

const REPO_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(REPO_ROOT, 'package.json');
const PLUGIN_JSON = path.join(REPO_ROOT, '.claude-plugin', 'plugin.json');
const MARKETPLACE_JSON = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');

const PLUGIN_JSON_REL = '.claude-plugin/plugin.json';
const MARKETPLACE_JSON_REL = '.claude-plugin/marketplace.json';

const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const isWrite = args.includes('--write');

if (args.length !== 1 || (isCheck && isWrite) || (!isCheck && !isWrite)) {
  process.stderr.write('Usage: node scripts/sync-plugin-metadata.js --check|--write\n');
  process.exit(2);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, json) {
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
}

const NUMERIC_PATTERNS = [
  {
    key: 'skills.active',
    label: 'N スキル',
    // 「63スキル」「63 スキル」「63 skills」(英) を許容
    regex: /(\d+)(\s*スキル|\s*skills?\b)/gi,
    expectedFrom: (m) => m.skills.active,
    allowPlusAsAtLeast: false,
  },
  {
    key: 'commands.tracked',
    label: 'N コマンド (or N+)',
    // 「110+コマンド」「111 コマンド」「110+ commands」
    regex: /(\d+)(\+?\s*コマンド|\+?\s*commands?\b)/gi,
    expectedFrom: (m) => m.commands.tracked,
    // 「N+」は慣例表現で "N 以上" の意味。actual <= tracked なら OK と判定する。
    allowPlusAsAtLeast: true,
  },
  {
    key: 'mcp.servers',
    label: 'N MCP {ツール|サーバー|servers|tools}',
    regex: /(\d+)(\s*MCP\s*(?:ツール|サーバー|servers?|tools?))/gi,
    expectedFrom: (m) => m.mcp.servers,
    allowPlusAsAtLeast: false,
  },
];

function isNumericMatchOk(pat, actual, expected, unit) {
  const hasPlus = pat.allowPlusAsAtLeast && unit.startsWith('+');
  if (hasPlus) {
    // 「N+」表記: actual <= expected なら "N 以上" として整合
    return actual <= expected;
  }
  return actual === expected;
}

// "N エージェント" は無条件で警告 (installed agents = 0 のため誤解を招く表現)
const AGENT_CLAIM_REGEX = /(\d+)(\s*エージェント)/g;

function getDescriptions() {
  const descriptions = [];

  if (fs.existsSync(PLUGIN_JSON)) {
    const plugin = readJson(PLUGIN_JSON);
    if (typeof plugin.description === 'string' && plugin.description.length > 0) {
      descriptions.push({
        file: PLUGIN_JSON_REL,
        absPath: PLUGIN_JSON,
        field: 'description',
        text: plugin.description,
        jsonPath: ['description'],
      });
    }
  }

  if (fs.existsSync(MARKETPLACE_JSON)) {
    const market = readJson(MARKETPLACE_JSON);
    if (
      market.metadata &&
      typeof market.metadata.description === 'string' &&
      market.metadata.description.length > 0
    ) {
      descriptions.push({
        file: MARKETPLACE_JSON_REL,
        absPath: MARKETPLACE_JSON,
        field: 'metadata.description',
        text: market.metadata.description,
        jsonPath: ['metadata', 'description'],
      });
    }
    if (Array.isArray(market.plugins)) {
      market.plugins.forEach((p, idx) => {
        if (p && typeof p.description === 'string' && p.description.length > 0) {
          descriptions.push({
            file: MARKETPLACE_JSON_REL,
            absPath: MARKETPLACE_JSON,
            field: `plugins[${idx}].description`,
            text: p.description,
            jsonPath: ['plugins', idx, 'description'],
          });
        }
      });
    }
  }

  return descriptions;
}

function findVersionDrift(pkg) {
  const drifts = [];
  if (!fs.existsSync(PLUGIN_JSON)) {
    drifts.push({
      type: 'missing',
      file: PLUGIN_JSON_REL,
      field: 'file',
      expected: 'present',
      actual: 'missing',
      fixable: false,
    });
    return drifts;
  }
  const plugin = readJson(PLUGIN_JSON);
  if (plugin.version !== pkg.version) {
    drifts.push({
      type: 'version',
      file: PLUGIN_JSON_REL,
      field: 'version',
      expected: pkg.version,
      actual: plugin.version,
      fixable: true,
    });
  }
  return drifts;
}

function findNumericDrifts(metric, descriptions) {
  const drifts = [];
  for (const desc of descriptions) {
    for (const pat of NUMERIC_PATTERNS) {
      const expected = pat.expectedFrom(metric);
      const re = new RegExp(pat.regex.source, pat.regex.flags);
      let m;
      while ((m = re.exec(desc.text)) !== null) {
        const actual = parseInt(m[1], 10);
        const unit = m[2] || '';
        if (!isNumericMatchOk(pat, actual, expected, unit)) {
          drifts.push({
            type: 'numeric',
            file: desc.file,
            field: desc.field,
            patternKey: pat.key,
            label: pat.label,
            expected,
            actual,
            text: m[0],
            fixable: true,
          });
        }
      }
    }
  }
  return drifts;
}

function findAgentClaimDrifts(descriptions) {
  const drifts = [];
  for (const desc of descriptions) {
    const re = new RegExp(AGENT_CLAIM_REGEX.source, AGENT_CLAIM_REGEX.flags);
    let m;
    while ((m = re.exec(desc.text)) !== null) {
      drifts.push({
        type: 'agent-claim',
        file: desc.file,
        field: desc.field,
        actual: m[0],
        expected: '"N エージェント" 表現は禁止 (installed agents=0)',
        fixable: false,
      });
    }
  }
  return drifts;
}

function findAllDrifts() {
  const pkg = readJson(PACKAGE_JSON);
  const metric = audit();
  const descriptions = getDescriptions();
  return {
    pkg,
    metric,
    descriptions,
    drifts: [
      ...findVersionDrift(pkg),
      ...findNumericDrifts(metric, descriptions),
      ...findAgentClaimDrifts(descriptions),
    ],
  };
}

function setByJsonPath(json, jsonPath, value) {
  let target = json;
  for (let i = 0; i < jsonPath.length - 1; i++) {
    target = target[jsonPath[i]];
  }
  target[jsonPath[jsonPath.length - 1]] = value;
}

function applyWrite() {
  const changes = [];
  const skipped = [];

  // 1. version sync
  const stateA = findAllDrifts();
  const verDrift = stateA.drifts.find((d) => d.type === 'version');
  if (verDrift) {
    const plugin = readJson(PLUGIN_JSON);
    plugin.version = stateA.pkg.version;
    writeJson(PLUGIN_JSON, plugin);
    changes.push({
      file: PLUGIN_JSON_REL,
      field: 'version',
      kind: 'version',
      before: verDrift.actual,
      after: verDrift.expected,
    });
  }

  // 2. numeric drifts: file 単位でまとめて書き換え (description は file 内で複数 field の可能性)
  const stateB = findAllDrifts();
  const numericByAbsPath = {};
  for (const d of stateB.drifts) {
    if (d.type !== 'numeric') continue;
    if (!numericByAbsPath[d.file]) {
      numericByAbsPath[d.file] = { absPath: null, fields: new Map() };
    }
  }

  for (const desc of stateB.descriptions) {
    if (!numericByAbsPath[desc.file]) continue;
    numericByAbsPath[desc.file].absPath = desc.absPath;
    numericByAbsPath[desc.file].fields.set(desc.field, desc);
  }

  for (const [file, group] of Object.entries(numericByAbsPath)) {
    const json = readJson(group.absPath);
    let fileChanged = false;

    for (const desc of group.fields.values()) {
      let newText = desc.text;
      for (const pat of NUMERIC_PATTERNS) {
        const expected = pat.expectedFrom(stateB.metric);
        const re = new RegExp(pat.regex.source, pat.regex.flags);
        newText = newText.replace(re, (full, n, unit) => {
          const actual = parseInt(n, 10);
          if (isNumericMatchOk(pat, actual, expected, unit || '')) {
            return full; // 整合済み (慣例 N+ 含む) なので変更しない
          }
          return `${expected}${unit}`;
        });
      }
      if (newText !== desc.text) {
        setByJsonPath(json, desc.jsonPath, newText);
        fileChanged = true;
        changes.push({
          file,
          field: desc.field,
          kind: 'numeric',
          before: desc.text,
          after: newText,
        });
      }
    }

    if (fileChanged) {
      writeJson(group.absPath, json);
    }
  }

  // 3. agent-claim drifts: 自動修正不可、警告のみ
  const stateC = findAllDrifts();
  for (const d of stateC.drifts) {
    if (d.type === 'agent-claim') {
      skipped.push(d);
    }
  }

  return { changes, skipped };
}

function reportCheck(state) {
  if (state.drifts.length === 0) {
    process.stdout.write('Plugin metadata is in sync with package.json + audit.\n');
    process.exit(0);
  }
  const fixable = state.drifts.filter((d) => d.fixable).length;
  const warnings = state.drifts.filter((d) => !d.fixable).length;
  process.stderr.write(
    `Plugin metadata drift detected (${state.drifts.length} total: ${fixable} fixable, ${warnings} warnings):\n`
  );
  for (const d of state.drifts) {
    if (d.type === 'version') {
      process.stderr.write(
        `  [version]      ${d.file} :: ${d.field}: expected="${d.expected}" actual="${d.actual}"\n`
      );
    } else if (d.type === 'numeric') {
      process.stderr.write(
        `  [numeric]      ${d.file} :: ${d.field}: "${d.text}" should be ${d.expected} (audit ${d.patternKey})\n`
      );
    } else if (d.type === 'agent-claim') {
      process.stderr.write(
        `  [WARNING]      ${d.file} :: ${d.field}: "${d.actual}" — installed agents=0 のため "N エージェント" 表現は禁止。文言ごと書き換えてください\n`
      );
    } else if (d.type === 'missing') {
      process.stderr.write(
        `  [missing]      ${d.file}: expected="${d.expected}" actual="${d.actual}"\n`
      );
    }
  }
  process.stderr.write('Run: node scripts/sync-plugin-metadata.js --write (numeric/version のみ自動修正)\n');
  process.exit(1);
}

function reportWrite(result) {
  if (result.changes.length === 0) {
    process.stdout.write('Plugin metadata already in sync (numeric/version).\n');
  } else {
    for (const c of result.changes) {
      if (c.kind === 'version') {
        process.stdout.write(
          `Updated ${c.file} :: ${c.field}: ${c.before} -> ${c.after}\n`
        );
      } else {
        process.stdout.write(
          `Updated ${c.file} :: ${c.field}: numeric drift fixed\n`
        );
      }
    }
  }
  if (result.skipped.length > 0) {
    process.stdout.write('\nWarnings (auto-fix not applied):\n');
    for (const d of result.skipped) {
      process.stdout.write(
        `  [agent-claim] ${d.file} :: ${d.field}: "${d.actual}" — installed agents=0 のため文言ごと書き換えてください\n`
      );
    }
  }
}

function main() {
  if (isCheck) {
    const state = findAllDrifts();
    reportCheck(state);
    return;
  }

  if (isWrite) {
    const result = applyWrite();
    reportWrite(result);
    process.exit(0);
  }
}

main();
