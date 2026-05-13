#!/usr/bin/env node
/**
 * Generate Agents Baseline Manifest (PLAN.md Step 1.5 / Step 10 — H1 Resolution)
 *
 * Distills per-agent calibration from the 51 legacy `.claude/memory/agents/*-stats.yaml`
 * files into a single tracked manifest `.claude/memory/agents-baseline.yaml`.
 *
 * This manifest survives PR-β (deletion of the 51 yaml) so MemoryService can seed
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
 *   node scripts/generate-agents-baseline.js                        # write manifest
 *   node scripts/generate-agents-baseline.js --check                # compare-to-existing (CI invariance gate)
 *   node scripts/generate-agents-baseline.js --validate-manifest    # validate manifest alone (post-PR-β CI)
 *   node scripts/generate-agents-baseline.js --validate-manifest --expected-count N
 *   node scripts/generate-agents-baseline.js --strict               # extra: fail on unknown agent names (Step 1.5 fix Finding 2 partial)
 *
 * Step 1.5 fix (Codex review 2026-05-14, doc/CODEXレビュー/2026-05-14_001000_step1.5-codex-review-no-go.md):
 *   - Finding 1 (HIGH): deep nested validator added (REQUIRED_NESTED_CHILDREN + REQUIRED_NESTED_TYPES)
 *   - Finding 2 (MED partial): --strict flag added (full agent-source catalog comparison deferred to follow-up)
 *   - Finding 3 (MED): agent_name slug regex + filename match validation added
 *   - Finding 4 (MED): --validate-manifest mode added (no source files required)
 *   - Finding 5 (LOW deferred to OPEN-5): parent-dir fsync — see TODO in atomicWrite()
 *   - Finding 6 (LOW deferred to follow-up): byte-compare --check; semantic deep-equal not yet added
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const REPO_ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'memory', 'agents');
const OUTPUT_PATH = path.join(REPO_ROOT, '.claude', 'memory', 'agents-baseline.yaml');
const TEMPLATE_FILE = '_template.yaml';

// Step 1.5 fix Finding 1 (HIGH): explicit nested-children validation
// REQUIRED_NESTED_CHILDREN[parent_path] = [child1, child2, ...]
const REQUIRED_NESTED_CHILDREN = {
  'omega_metrics': ['performance_bounds', 'dependencies', 'completion_probability'],
  'omega_metrics.performance_bounds': ['min_quality_score', 'min_success_rate', 'max_latency_ms', 'worst_case'],
  'omega_metrics.dependencies': ['omega', 'little_omega', 'coupling_ratio', 'dependencies_list', 'coupling_health'],
  'omega_metrics.dependencies.dependencies_list': ['tools', 'agents', 'external'],
  'omega_metrics.completion_probability': ['base_omega', 'by_complexity', 'by_category', 'confidence_interval', 'sample_size', 'prediction_accuracy'],
  'omega_metrics.completion_probability.by_complexity': ['low', 'medium', 'high'],
  'learning_metrics': ['learning_rate', 'quality_trend', 'success_trend', 'specialization'],
  'learning_metrics.quality_trend': ['direction', 'rate'],
  'learning_metrics.success_trend': ['direction', 'rate'],
  'learning_metrics.specialization': ['primary_category', 'specialization_score', 'categories'],
  'metadata': ['schema_version', 'omega_integration_date'],
};

// Step 1.5 fix Finding 1 (HIGH): explicit type checks on PR-β-blocking-test (Step 9 test l) leaf fields
const REQUIRED_NESTED_TYPES = {
  'omega_metrics.dependencies.dependencies_list.tools': 'array',
  'omega_metrics.dependencies.dependencies_list.agents': 'array',
  'omega_metrics.dependencies.dependencies_list.external': 'array',
  'omega_metrics.completion_probability.by_complexity.low': 'number',
  'omega_metrics.completion_probability.by_complexity.medium': 'number',
  'omega_metrics.completion_probability.by_complexity.high': 'number',
  'learning_metrics.learning_rate': 'number',
};

// Step 1.5 fix Finding 3 (MED): agent_name slug validation
const AGENT_NAME_REGEX = /^[a-z][a-z0-9-]*$/;

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
  const expectedFilename = `${agentName}-stats.yaml`;
  if (sourceFile !== expectedFilename) {
    throw new Error(`${sourceFile}: agent_name "${agentName}" does not match filename (expected "${expectedFilename}")`);
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

  for (const [leafPath, expectedType] of Object.entries(REQUIRED_NESTED_TYPES)) {
    const value = getPath(stats, leafPath);
    if (value === undefined) {
      errors.push(`${sourceFile}: ${leafPath} missing`);
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
  const unknownAgents = [];

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

    // Step 1.5 fix Finding 3 (MED): slug + filename validation
    validateSlug(agentName, file);

    if (manifest[agentName]) {
      throw new Error(`duplicate agent_name "${agentName}" (in ${file})`);
    }

    // Step 1.5 fix Finding 1 (HIGH): deep nested validation
    deepValidate(parsed, file);

    // Step 1.5 fix Finding 2 (MED partial): --strict flag flags unknown agents
    // For now, "unknown" = agent_name with telltale non-agent suffix patterns.
    // Full catalog comparison vs `.claude/agent-source/*.md` deferred to follow-up.
    const isLikelyNonAgent = /-report$|-summary$|-log$/.test(agentName);
    if (isLikelyNonAgent) {
      unknownAgents.push(agentName);
      if (strict) {
        throw new Error(
          `${file}: agent_name "${agentName}" matches non-agent suffix pattern (-report/-summary/-log). ` +
          `Use --strict=false to allow; full catalog audit recommended as follow-up.`
        );
      }
    }

    manifest[agentName] = extractBaseline(parsed);
  }

  const sortedManifest = {};
  for (const key of Object.keys(manifest).sort()) {
    sortedManifest[key] = manifest[key];
  }

  return { manifest: sortedManifest, fileCount: files.length, unknownAgents };
}

function renderHeader(agentCount) {
  return [
    '# Per-Agent Baseline Manifest (PLAN.md Step 1.5 / Step 10)',
    '#',
    '# Generated by scripts/generate-agents-baseline.js — DO NOT EDIT BY HAND.',
    '# Source of truth: .claude/memory/agents/*-stats.yaml (51 files).',
    '#',
    '# Purpose: survive PR-β (deletion of the 51 yaml). MemoryService reads this',
    '# manifest on first stats creation for a known agent so per-agent calibration',
    '# (omega_metrics / learning_metrics / metadata) is preserved on fresh clones.',
    '#',
    `# Agent count: ${agentCount}`,
    '# Regenerate: node scripts/generate-agents-baseline.js',
    '# Verify:     node scripts/generate-agents-baseline.js --check',
    '# Manifest-only validate (post-PR-β CI): node scripts/generate-agents-baseline.js --validate-manifest',
    '',
  ].join('\n');
}

function serialize(manifest, agentCount) {
  const body = yaml.stringify(manifest, { lineWidth: 0 });
  return renderHeader(agentCount) + body;
}

function atomicWrite(targetPath, content) {
  // Step 1.5 fix Finding 5 (LOW, deferred to OPEN-5):
  //   Add parent-dir fsync (POSIX) and {flush: true} (Node 20.10+) for crash durability.
  //   Currently uses tmp+rename which is namespace-atomic but not crash-durable.
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, targetPath);
}

function validateManifestFile(expectedCount) {
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
    if (!AGENT_NAME_REGEX.test(agentName)) {
      errors.push(`agent_name "${agentName}" violates slug regex ${AGENT_NAME_REGEX}`);
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
    console.log('=== Validate Manifest (post-PR-β CI gate) ===');
    console.log(`Manifest: ${OUTPUT_PATH}`);
    if (expectedCount !== null) console.log(`Expected count: ${expectedCount}`);
    console.log('');
    validateManifestFile(expectedCount);
    return;
  }

  console.log('=== Generate Agents Baseline Manifest ===');
  console.log(`Input:  ${AGENTS_DIR}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Mode:   ${checkMode ? 'check (CI invariance gate)' : 'write'}`);
  if (strict) console.log('Flag:   --strict (non-agent suffix patterns will fail)');
  console.log('');

  const { manifest, fileCount, unknownAgents } = buildManifest({ strict });
  const serialized = serialize(manifest, Object.keys(manifest).length);

  console.log(`Processed ${fileCount} *-stats.yaml files`);
  console.log(`Manifest contains ${Object.keys(manifest).length} agents`);
  if (unknownAgents.length > 0) {
    console.log(`WARN: ${unknownAgents.length} agent_name(s) match non-agent suffix patterns (use --strict to fail):`);
    for (const name of unknownAgents) console.log(`  - ${name}`);
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

main();
