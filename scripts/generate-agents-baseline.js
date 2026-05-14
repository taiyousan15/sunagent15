#!/usr/bin/env node
/**
 * Generate Agents Baseline Manifest (PLAN.md Step 1.5 / Step 10 — H1 Resolution)
 *
 * Distills per-agent calibration from the legacy `.claude/memory/agents/*-stats.yaml`
 * files into a single tracked manifest `.claude/memory/agents-baseline.yaml`.
 *
 * Step 1.5 follow-up (commit 7e006b3) removed 3 drift files (not in catalog),
 * leaving 48 baseline entries (originally 51, see PLAN.md drift cleanup note).
 *
 * This manifest survives PR-β (deletion of the remaining yaml) so MemoryService can seed
 * baselines on first stats creation for known agents, even on fresh clones / installs
 * that skip the soak period (install-release.sh / quick-install.ps1 / etc.).
 *
 * Fields preserved per PLAN.md Step 10:
 *   - omega_metrics: { performance_bounds, dependencies, completion_probability }
 *   - learning_metrics: { learning_rate, quality_trend, success_trend, specialization }
 *   - metadata: { schema_version, omega_integration_date }   (other metadata fields are volatile)
 *
 * Fields explicitly excluded (volatile counters; runtime-only):
 *   - total_tasks, successful_tasks, failed_tasks, success_rate
 *   - avg_quality_score, avg_duration_ms, last_updated
 *   - recent_tasks, trends, specializations
 *   - metadata.last_updated, metadata.passes_quality_gates, metadata.overall_health
 *
 * Output is sorted alphabetically by agent_name for deterministic diffs.
 *
 * Usage:
 *   node scripts/generate-agents-baseline.js                                     # write manifest
 *   node scripts/generate-agents-baseline.js --check                             # compare-to-existing (CI invariance gate)
 *   node scripts/generate-agents-baseline.js --validate-manifest                 # validate manifest alone (manifest-only mode; no source *-stats.yaml required)
 *   node scripts/generate-agents-baseline.js --validate-manifest --expected-count N
 *   node scripts/generate-agents-baseline.js --validate-manifest --strict        # manifest-only + catalog cross-check (post-PR-β CI gate)
 *   node scripts/generate-agents-baseline.js --validate-manifest --strict --expected-count 48
 *   node scripts/generate-agents-baseline.js --strict                            # extra: catalog surplus fails; suffix patterns warn only
 *   node scripts/generate-agents-baseline.js --check --strict                    # read-only strict gate (CI default)
 *
 * Step 1.5 follow-up (Codex re-review 2026-05-14, doc/CODEXレビュー/2026-05-14_120000_step1.5-rereview-no-go.md):
 *   - F1 (HIGH): extended REQUIRED_NESTED_TYPES (30+ leaf types incl. performance_bounds, worst_case,
 *                dependencies aggregates, completion_probability, learning_metrics trends, metadata)
 *   - F2 (MED): full catalog comparison vs `.claude/agent-source/*.md` — surplus = fail, missing = warn
 *   - F3 (MED): slug denylist (Windows reserved names) + trailing/consecutive hyphen forbidden
 *   - new MED: dedicated Jest unit tests at scripts/__tests__/generate-agents-baseline.test.js
 *              + CI gate at .github/workflows/ci.yml (generator-baseline-gate job)
 *   - F4 (MED, prior review): --validate-manifest mode (kept)
 *   - F5/F6 (LOW, deferred to OPEN-5): parent-dir fsync; byte-compare --check
 *
 * Step 1.5 follow-up³ (Codex 4th-round 2026-05-14, doc/CODEXレビュー/2026-05-14_160000_step1.5-4thround-no-go.md):
 *   - NEW-MED-2: --validate-manifest --strict now adds catalog cross-check from manifest perspective
 *                (manifest agents must be a subset of .claude/agent-source/*.md). Enables PR-β CI gate
 *                that does NOT require .claude/memory/agents/*-stats.yaml to exist.
 *   - NEW-LOW-1: --strict help text corrected: catalog surplus fails; suffix patterns warn only.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const REPO_ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'memory', 'agents');
const AGENT_SOURCE_DIR = path.join(REPO_ROOT, '.claude', 'agent-source');
const OUTPUT_PATH = path.join(REPO_ROOT, '.claude', 'memory', 'agents-baseline.yaml');
const TEMPLATE_FILE = '_template.yaml';

// F1: explicit nested-children validation
// REQUIRED_NESTED_CHILDREN[parent_path] = [child1, child2, ...]
const REQUIRED_NESTED_CHILDREN = {
  'omega_metrics': ['performance_bounds', 'dependencies', 'completion_probability'],
  'omega_metrics.performance_bounds': ['min_quality_score', 'min_success_rate', 'max_latency_ms', 'worst_case'],
  'omega_metrics.performance_bounds.worst_case': ['quality_score', 'success_rate', 'latency_ms'],
  'omega_metrics.dependencies': ['omega', 'little_omega', 'coupling_ratio', 'dependencies_list', 'coupling_health'],
  'omega_metrics.dependencies.dependencies_list': ['tools', 'agents', 'external'],
  'omega_metrics.dependencies.coupling_health': ['status', 'recommendation'],
  'omega_metrics.completion_probability': ['base_omega', 'by_complexity', 'by_category', 'confidence_interval', 'sample_size', 'prediction_accuracy'],
  'omega_metrics.completion_probability.by_complexity': ['low', 'medium', 'high'],
  'omega_metrics.completion_probability.prediction_accuracy': ['total_predictions', 'accurate_predictions', 'accuracy_rate'],
  'learning_metrics': ['learning_rate', 'quality_trend', 'success_trend', 'specialization'],
  'learning_metrics.quality_trend': ['direction', 'rate'],
  'learning_metrics.success_trend': ['direction', 'rate'],
  'learning_metrics.specialization': ['primary_category', 'specialization_score', 'categories'],
  'metadata': ['schema_version', 'omega_integration_date'],
};

// F1: explicit type checks on leaf fields. null is treated as missing for typed fields.
const REQUIRED_NESTED_TYPES = {
  // performance_bounds
  'omega_metrics.performance_bounds.min_quality_score': 'number',
  'omega_metrics.performance_bounds.min_success_rate': 'number',
  'omega_metrics.performance_bounds.max_latency_ms': 'number',
  'omega_metrics.performance_bounds.worst_case.quality_score': 'number',
  'omega_metrics.performance_bounds.worst_case.success_rate': 'number',
  'omega_metrics.performance_bounds.worst_case.latency_ms': 'number',
  // dependencies aggregates
  'omega_metrics.dependencies.omega': 'number',
  'omega_metrics.dependencies.little_omega': 'number',
  'omega_metrics.dependencies.coupling_ratio': 'number',
  'omega_metrics.dependencies.coupling_health.status': 'string',
  'omega_metrics.dependencies.coupling_health.recommendation': 'string',
  // dependencies_list
  'omega_metrics.dependencies.dependencies_list.tools': 'array',
  'omega_metrics.dependencies.dependencies_list.agents': 'array',
  'omega_metrics.dependencies.dependencies_list.external': 'array',
  // completion_probability aggregates
  'omega_metrics.completion_probability.base_omega': 'number',
  'omega_metrics.completion_probability.confidence_interval': 'number',
  'omega_metrics.completion_probability.sample_size': 'number',
  'omega_metrics.completion_probability.by_complexity.low': 'number',
  'omega_metrics.completion_probability.by_complexity.medium': 'number',
  'omega_metrics.completion_probability.by_complexity.high': 'number',
  'omega_metrics.completion_probability.prediction_accuracy.total_predictions': 'number',
  'omega_metrics.completion_probability.prediction_accuracy.accurate_predictions': 'number',
  'omega_metrics.completion_probability.prediction_accuracy.accuracy_rate': 'number',
  // learning_metrics
  'learning_metrics.learning_rate': 'number',
  'learning_metrics.quality_trend.direction': 'string',
  'learning_metrics.quality_trend.rate': 'number',
  'learning_metrics.success_trend.direction': 'string',
  'learning_metrics.success_trend.rate': 'number',
  'learning_metrics.specialization.primary_category': 'string',
  'learning_metrics.specialization.specialization_score': 'number',
  // metadata
  'metadata.schema_version': 'string',
  'metadata.omega_integration_date': 'string',
};

// F3: slug regex + denylist
const AGENT_NAME_REGEX = /^[a-z][a-z0-9-]*$/;
// Windows reserved device names (case-insensitive) — would break filesystem ops on Windows CI.
const WINDOWS_RESERVED = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

function getPath(obj, dotPath) {
  const parts = dotPath.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

function validateSlug(agentName, sourceFile) {
  if (!AGENT_NAME_REGEX.test(agentName)) {
    throw new Error(`${sourceFile}: agent_name "${agentName}" violates slug regex ${AGENT_NAME_REGEX}`);
  }
  if (/--/.test(agentName)) {
    throw new Error(`${sourceFile}: agent_name "${agentName}" contains consecutive hyphens`);
  }
  if (/-$/.test(agentName)) {
    throw new Error(`${sourceFile}: agent_name "${agentName}" ends with a hyphen`);
  }
  if (WINDOWS_RESERVED.has(agentName.toUpperCase())) {
    throw new Error(`${sourceFile}: agent_name "${agentName}" is a Windows reserved name (would break filesystem ops on Windows CI)`);
  }
  // Filename match check is skipped when sourceFile is null (manifest validation context)
  if (sourceFile !== null) {
    const expectedFilename = `${agentName}-stats.yaml`;
    if (sourceFile !== expectedFilename) {
      throw new Error(`${sourceFile}: agent_name "${agentName}" does not match filename (expected "${expectedFilename}")`);
    }
  }
}

function deepValidate(stats, sourceFile) {
  const errors = [];

  for (const [parentPath, requiredChildren] of Object.entries(REQUIRED_NESTED_CHILDREN)) {
    const parent = getPath(stats, parentPath);
    if (parent == null || typeof parent !== 'object') {
      errors.push(`${sourceFile}: ${parentPath} missing or not an object`);
      continue;
    }
    for (const child of requiredChildren) {
      if (!(child in parent)) {
        errors.push(`${sourceFile}: ${parentPath}.${child} missing`);
      }
    }
  }

  // F1 (HIGH fix): null is treated as missing for typed leaf fields. Existence alone is not enough.
  for (const [leafPath, expectedType] of Object.entries(REQUIRED_NESTED_TYPES)) {
    const value = getPath(stats, leafPath);
    if (value === undefined || value === null) {
      errors.push(`${sourceFile}: ${leafPath} missing or null (expected ${expectedType})`);
      continue;
    }
    if (expectedType === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${sourceFile}: ${leafPath} should be array, got ${typeof value}`);
      }
    } else if (typeof value !== expectedType) {
      errors.push(`${sourceFile}: ${leafPath} should be ${expectedType}, got ${typeof value}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Deep validation failed for ${sourceFile}:\n  ${errors.join('\n  ')}`);
  }
}

function listStatsFiles() {
  if (!fs.existsSync(AGENTS_DIR)) {
    throw new Error(`agents directory not found: ${AGENTS_DIR}`);
  }
  return fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('-stats.yaml') && f !== TEMPLATE_FILE)
    .sort();
}

// F2: full catalog comparison helpers
function extractAgentNameFromCatalog(filename) {
  let name = filename.replace(/\.md$/, '');
  // Iteratively strip "NN-" and "ait42-" prefixes (filenames have inconsistent prefixes
  // e.g. "00-ait42-coordinator.md" and "ait42-01-ait42-coordinator-fast.md").
  let prev;
  do {
    prev = name;
    name = name.replace(/^\d+-/, '');
    name = name.replace(/^ait42-/, '');
  } while (name !== prev);
  return name;
}

function listAgentSourceCatalog() {
  if (!fs.existsSync(AGENT_SOURCE_DIR)) {
    return null; // catalog not present, skip comparison
  }
  return fs
    .readdirSync(AGENT_SOURCE_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(extractAgentNameFromCatalog);
}

function compareCatalog(manifestAgents, catalogAgents) {
  const manifestSet = new Set(manifestAgents);
  const catalogSet = new Set(catalogAgents);
  const surplus = manifestAgents.filter((a) => !catalogSet.has(a));
  const missing = catalogAgents.filter((a) => !manifestSet.has(a));
  return { surplus, missing };
}

function extractBaseline(stats) {
  return {
    omega_metrics: stats.omega_metrics,
    learning_metrics: stats.learning_metrics,
    metadata: {
      schema_version: stats.metadata.schema_version,
      omega_integration_date: stats.metadata.omega_integration_date,
    },
  };
}

function buildManifest(options = {}) {
  const { strict = false } = options;
  const files = listStatsFiles();
  if (files.length === 0) {
    throw new Error(`no *-stats.yaml files found in ${AGENTS_DIR}`);
  }

  const manifest = {};
  const suffixFlagged = [];

  for (const file of files) {
    const fullPath = path.join(AGENTS_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    let parsed;
    try {
      parsed = yaml.parse(content);
    } catch (err) {
      throw new Error(`failed to parse ${file}: ${err.message}`);
    }

    const agentName = parsed.agent_name;
    if (!agentName || typeof agentName !== 'string') {
      throw new Error(`${file}: missing or invalid agent_name field`);
    }

    // F3: slug + filename + denylist + hyphen checks
    validateSlug(agentName, file);

    if (manifest[agentName]) {
      throw new Error(`duplicate agent_name "${agentName}" (in ${file})`);
    }

    // F1: deep nested validation (existence + type, null treated as missing)
    deepValidate(parsed, file);

    // F2 follow-up: suffix is a cheap heuristic only (cosmetic warning).
    // Authoritative drift detection is the full catalog comparison below.
    // We no longer fail --strict on suffix alone — that would create false positives for
    // legitimate "*-report" agent names while the catalog comparison already detects surplus.
    const isLikelyNonAgent = /-report$|-summary$|-log$/.test(agentName);
    if (isLikelyNonAgent) {
      suffixFlagged.push(agentName);
    }

    manifest[agentName] = extractBaseline(parsed);
  }

  const sortedManifest = {};
  for (const key of Object.keys(manifest).sort()) {
    sortedManifest[key] = manifest[key];
  }

  // F2: full catalog comparison (only meaningful when catalog is present)
  let catalogReport = null;
  const catalog = listAgentSourceCatalog();
  if (catalog) {
    catalogReport = compareCatalog(Object.keys(sortedManifest), catalog);
    if (strict && catalogReport.surplus.length > 0) {
      throw new Error(
        `--strict catalog mismatch: ${catalogReport.surplus.length} agent(s) in manifest not present in catalog:\n  ` +
        catalogReport.surplus.join('\n  ') +
        `\n(missing in manifest, present in catalog — informational only: ${catalogReport.missing.length} agent(s))`
      );
    }
  }

  return {
    manifest: sortedManifest,
    fileCount: files.length,
    suffixFlagged,
    catalogReport,
  };
}

function renderHeader(agentCount) {
  return [
    '# Per-Agent Baseline Manifest (PLAN.md Step 1.5 / Step 10)',
    '#',
    '# Generated by scripts/generate-agents-baseline.js — DO NOT EDIT BY HAND.',
    '# Source of truth: .claude/memory/agents/*-stats.yaml (48 files after Step 1.5 drift cleanup).',
    '#',
    '# Purpose: survive PR-β (deletion of the remaining yaml). MemoryService reads this',
    '# manifest on first stats creation for a known agent so per-agent calibration',
    '# (omega_metrics / learning_metrics / metadata) is preserved on fresh clones.',
    '#',
    `# Agent count: ${agentCount}`,
    '# Regenerate: node scripts/generate-agents-baseline.js',
    '# Verify:     node scripts/generate-agents-baseline.js --check',
    '# Manifest-only validate (post-PR-β CI): node scripts/generate-agents-baseline.js --validate-manifest --strict --expected-count 48',
    '',
  ].join('\n');
}

function serialize(manifest, agentCount) {
  const body = yaml.stringify(manifest, { lineWidth: 0 });
  return renderHeader(agentCount) + body;
}

function atomicWrite(targetPath, content) {
  // F5 (LOW, deferred to OPEN-5):
  //   Add parent-dir fsync (POSIX) and {flush: true} (Node 20.10+) for crash durability.
  //   Currently uses tmp+rename which is namespace-atomic but not crash-durable.
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, targetPath);
}

function validateManifestFile(expectedCount, strict = false) {
  if (!fs.existsSync(OUTPUT_PATH)) {
    console.error(`FAIL: manifest does not exist at ${OUTPUT_PATH}`);
    process.exit(1);
  }
  const content = fs.readFileSync(OUTPUT_PATH, 'utf8');
  let parsed;
  try {
    parsed = yaml.parse(content);
  } catch (err) {
    console.error(`FAIL: manifest is not valid YAML: ${err.message}`);
    process.exit(1);
  }

  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error('FAIL: manifest top-level must be a YAML mapping');
    process.exit(1);
  }

  const agentNames = Object.keys(parsed);
  if (agentNames.length === 0) {
    console.error('FAIL: manifest contains no agents');
    process.exit(1);
  }

  const errors = [];

  for (const agentName of agentNames) {
    try {
      // sourceFile=null skips the filename match (manifest entries have no filename context)
      validateSlug(agentName, null);
    } catch (err) {
      errors.push(err.message);
    }
    try {
      deepValidate(parsed[agentName], `manifest entry ${agentName}`);
    } catch (err) {
      errors.push(err.message);
    }
  }

  if (errors.length > 0) {
    console.error('FAIL: manifest schema validation errors:');
    for (const e of errors) console.error('  ' + e);
    process.exit(1);
  }

  if (expectedCount !== null && agentNames.length !== expectedCount) {
    console.error(`FAIL: expected ${expectedCount} agents, manifest contains ${agentNames.length}`);
    process.exit(1);
  }

  // Step 1.5 follow-up³ NEW-MED-2: when --strict, also do catalog cross-check from manifest side.
  // This makes --validate-manifest --strict a complete post-PR-β CI gate without requiring
  // source *-stats.yaml to exist.
  if (strict) {
    const catalog = listAgentSourceCatalog();
    if (catalog === null) {
      console.error(`FAIL: --strict requires ${AGENT_SOURCE_DIR} catalog directory to exist`);
      process.exit(1);
    }
    const report = compareCatalog(agentNames, catalog);
    if (report.surplus.length > 0) {
      console.error(
        `FAIL: --strict catalog mismatch: ${report.surplus.length} agent(s) in manifest not present in catalog:`
      );
      for (const name of report.surplus) console.error(`  - ${name}`);
      console.error(
        `(missing in manifest, present in catalog — informational only: ${report.missing.length} agent(s))`
      );
      process.exit(1);
    }
    console.log(`OK: catalog cross-check passed (manifest is a subset of catalog; ${report.missing.length} catalog entries not in manifest, expected)`);
  }

  console.log(`OK: manifest schema valid, ${agentNames.length} agents present`);
  console.log('Agents:');
  for (const name of agentNames.sort()) {
    console.log(`  - ${name}`);
  }
}

function parseExpectedCount(args) {
  const idx = args.indexOf('--expected-count');
  if (idx < 0) return null;
  const val = args[idx + 1];
  if (!val || !/^\d+$/.test(val)) {
    console.error('FAIL: --expected-count requires a non-negative integer argument');
    process.exit(1);
  }
  return parseInt(val, 10);
}

function main() {
  const args = process.argv.slice(2);
  const checkMode = args.includes('--check');
  const validateManifestMode = args.includes('--validate-manifest');
  const strict = args.includes('--strict');
  const expectedCount = parseExpectedCount(args);

  if (validateManifestMode) {
    console.log('=== Validate Manifest (manifest-only mode; no source *-stats.yaml required) ===');
    console.log(`Manifest: ${OUTPUT_PATH}`);
    if (expectedCount !== null) console.log(`Expected count: ${expectedCount}`);
    if (strict) console.log('Flag:     --strict (manifest agents must be subset of catalog at .claude/agent-source/*.md)');
    console.log('');
    validateManifestFile(expectedCount, strict);
    return;
  }

  console.log('=== Generate Agents Baseline Manifest ===');
  console.log(`Input:  ${AGENTS_DIR}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Mode:   ${checkMode ? 'check (CI invariance gate)' : 'write'}`);
  if (strict) console.log('Flag:   --strict (catalog surplus fails; suffix patterns warn only)');
  console.log('');

  const { manifest, fileCount, suffixFlagged, catalogReport } = buildManifest({ strict });
  const serialized = serialize(manifest, Object.keys(manifest).length);

  console.log(`Processed ${fileCount} *-stats.yaml files`);
  console.log(`Manifest contains ${Object.keys(manifest).length} agents`);
  if (suffixFlagged.length > 0) {
    console.log(`WARN: ${suffixFlagged.length} agent_name(s) match non-agent suffix patterns (suffix patterns are warning-only; catalog surplus is the strict failure condition):`);
    for (const name of suffixFlagged) console.log(`  - ${name}`);
  }
  if (catalogReport) {
    if (catalogReport.surplus.length > 0) {
      console.log(`WARN: ${catalogReport.surplus.length} agent(s) in manifest but not in catalog (use --strict to fail):`);
      for (const name of catalogReport.surplus) console.log(`  - ${name}`);
    }
    if (catalogReport.missing.length > 0) {
      console.log(`INFO: ${catalogReport.missing.length} agent(s) in catalog but not in manifest (PR-β baseline subset is expected to be a subset of catalog):`);
      for (const name of catalogReport.missing.slice(0, 10)) console.log(`  - ${name}`);
      if (catalogReport.missing.length > 10) console.log(`  ... and ${catalogReport.missing.length - 10} more`);
    }
  }

  if (checkMode) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      console.error('FAIL: manifest does not exist at expected path');
      process.exit(1);
    }
    const existing = fs.readFileSync(OUTPUT_PATH, 'utf8');
    if (existing !== serialized) {
      console.error('FAIL: manifest is out of sync with source *-stats.yaml files');
      console.error('Run: node scripts/generate-agents-baseline.js');
      process.exit(1);
    }
    console.log('OK: manifest matches source files');
    return;
  }

  atomicWrite(OUTPUT_PATH, serialized);
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Size: ${serialized.length} bytes`);
}

// Module exports for unit tests (scripts/__tests__/generate-agents-baseline.test.js)
module.exports = {
  AGENT_NAME_REGEX,
  WINDOWS_RESERVED,
  REQUIRED_NESTED_CHILDREN,
  REQUIRED_NESTED_TYPES,
  getPath,
  validateSlug,
  deepValidate,
  extractAgentNameFromCatalog,
  compareCatalog,
};

// Only run main() when invoked as a script, not when imported as a module
if (require.main === module) {
  main();
}
