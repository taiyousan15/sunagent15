#!/usr/bin/env node
/**
 * Skill requires: schema validator (F8.2).
 *
 * Walks top-level .claude/skills/<name>/SKILL.md (excluding _archived/)
 * and validates the optional `requires:` frontmatter block:
 *
 *   requires:
 *     node: ">=18"
 *     tools: ["ffmpeg", "yt-dlp"]
 *     env:   ["OPENAI_API_KEY"]
 *
 * Schema reference: docs/SKILL_REQUIRES_SCHEMA.md
 *
 * Exit codes:
 *   0 — all skills pass (non-strict: requires: may be absent)
 *   1 — any schema violation, or requires: absent under --strict
 *
 * Usage:
 *   node scripts/check-skill-requirements.js
 *   node scripts/check-skill-requirements.js --strict
 *   node scripts/check-skill-requirements.js --verbose
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const yaml   = require('js-yaml');
const semver = require('semver');

const REPO       = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO, '.claude', 'skills');

const TOOL_NAME_RE = /^[a-z0-9][a-z0-9._-]*$/;
const ENV_NAME_RE  = /^[A-Z][A-Z0-9_]*$/;

// Directory name prefixes/names to skip in SKILL.md discovery.
// Update this list and docs/SKILL_REQUIRES_SCHEMA.md together.
const EXCLUDED_DIRS = new Set(['_archived', '_guides']);

// tools[] に書くべきでないランタイム名（requires.node に寄せる）
const RESERVED_TOOL_NAMES = new Set(['node', 'npm', 'npx']);

// 機密露出面を広げやすい env 名（記述自体は許容、警告のみ）
const SENSITIVE_ENV_PATTERNS = [
  /^GITHUB_TOKEN$/,
  /^AWS_(SECRET_ACCESS_KEY|ACCESS_KEY_ID|SESSION_TOKEN)$/,
  /^GCP_[A-Z0-9_]*CREDENTIALS?$/,
  /^GOOGLE_APPLICATION_CREDENTIALS$/,
  /^AZURE_[A-Z0-9_]*(KEY|SECRET)$/,
];

const TOOL_EXAMPLES = 'ffmpeg, yt-dlp, python3, whisper, ollama, docker (kebab-case, lowercase)';
const ENV_EXAMPLES  = 'OPENAI_API_KEY, ANTHROPIC_API_KEY (UPPER_SNAKE_CASE)';

function parseArgs(argv) {
  const args = { strict: false, verbose: false, githubSummary: false };
  for (const a of argv.slice(2)) {
    if (a === '--strict') args.strict = true;
    else if (a === '--verbose') args.verbose = true;
    else if (a === '--github-summary') args.githubSummary = true;
    else if (a === '-h' || a === '--help') args.help = true;
  }
  return args;
}

function listSkillFiles(warnings = []) {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  const files = [];
  for (const entry of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue; // 明示除外 (docs/SKILL_REQUIRES_SCHEMA.md と連動)
    if (entry.name.startsWith('_')) {
      warnings.push(`[discovery] directory '${entry.name}' has _-prefix but is not in EXCLUDED_DIRS — including (update EXCLUDED_DIRS if this is wrong)`);
    }
    // Accept both SKILL.md (standard) and skill.md (legacy lowercase, case-insensitive fs).
    let skillMd = null;
    for (const candidate of ['SKILL.md', 'skill.md']) {
      const p = path.join(SKILLS_DIR, entry.name, candidate);
      if (fs.existsSync(p)) {
        // On case-insensitive fs, fs.existsSync returns true for both, so verify by reading dir
        const dirEntries = fs.readdirSync(path.join(SKILLS_DIR, entry.name));
        if (dirEntries.includes(candidate)) { skillMd = p; break; }
      }
    }
    if (skillMd) {
      if (path.basename(skillMd) === 'skill.md') {
        warnings.push(`[discovery] ${path.relative(REPO, skillMd)} uses lowercase 'skill.md' — convention is SKILL.md (rename recommended, handled as legacy)`);
      }
      files.push({ name: entry.name, path: skillMd });
    }
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

function extractFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try {
    return yaml.load(m[1]);
  } catch (e) {
    return { __parseError: e.message };
  }
}

function validateRequires(req, ctx) {
  const errors = [];
  const warnings = [];
  if (typeof req !== 'object' || req === null || Array.isArray(req)) {
    errors.push(`${ctx}: requires: must be a mapping (got ${Array.isArray(req) ? 'array' : typeof req}). Empty mapping "requires: {}" is allowed for skills with no external deps.`);
    return { errors, warnings };
  }

  const allowedKeys = new Set(['node', 'tools', 'env']);
  for (const k of Object.keys(req)) {
    if (!allowedKeys.has(k)) {
      errors.push(`${ctx}: unknown requires.${k} (allowed: node, tools, env)`);
    }
  }

  if ('node' in req) {
    if (typeof req.node !== 'string') {
      errors.push(`${ctx}: requires.node must be a string SemVer range (got ${typeof req.node}). 例: ">=18", "^20.5.0"`);
    } else if (!semver.validRange(req.node)) {
      errors.push(`${ctx}: requires.node "${req.node}" is not a valid SemVer range. 例: ">=18", "^20.5.0", "~18.19"`);
    }
  }

  if ('tools' in req) {
    if (!Array.isArray(req.tools)) {
      errors.push(`${ctx}: requires.tools must be an array of strings. 例: [${TOOL_EXAMPLES}]`);
    } else {
      const seen = new Set();
      req.tools.forEach((t, i) => {
        if (typeof t !== 'string') {
          errors.push(`${ctx}: requires.tools[${i}] must be a string (got ${typeof t}). 例: "${TOOL_EXAMPLES}"`);
          return;
        }
        if (!TOOL_NAME_RE.test(t)) {
          errors.push(`${ctx}: requires.tools[${i}] "${t}" must be kebab-case lowercase. 例: ${TOOL_EXAMPLES}`);
        }
        if (RESERVED_TOOL_NAMES.has(t)) {
          warnings.push(`${ctx}: requires.tools[${i}] "${t}" is a Node.js runtime — use requires.node: ">=18" instead (see docs/SKILL_REQUIRES_SCHEMA.md)`);
        }
        if (seen.has(t)) errors.push(`${ctx}: requires.tools contains duplicate "${t}"`);
        seen.add(t);
      });
    }
  }

  if ('env' in req) {
    if (!Array.isArray(req.env)) {
      errors.push(`${ctx}: requires.env must be an array. 例: ["${ENV_EXAMPLES}"] or [{name: "X", required: false}]`);
    } else {
      const seen = new Set();
      req.env.forEach((e, i) => {
        let envName = null;
        if (typeof e === 'string') {
          envName = e;
        } else if (e && typeof e === 'object' && !Array.isArray(e)) {
          // object form: {name: "X", required: bool}
          if (typeof e.name !== 'string') {
            errors.push(`${ctx}: requires.env[${i}].name must be a string. 例: {name: "SERPAPI_KEY", required: false}`);
            return;
          }
          envName = e.name;
          if ('required' in e && typeof e.required !== 'boolean') {
            errors.push(`${ctx}: requires.env[${i}].required must be boolean (got ${typeof e.required})`);
          }
          for (const k of Object.keys(e)) {
            if (k !== 'name' && k !== 'required') {
              errors.push(`${ctx}: requires.env[${i}].${k} is unknown (allowed: name, required)`);
            }
          }
        } else {
          errors.push(`${ctx}: requires.env[${i}] must be a string or {name, required} object (got ${typeof e}). 例: "${ENV_EXAMPLES}"`);
          return;
        }
        if (!ENV_NAME_RE.test(envName)) {
          errors.push(`${ctx}: requires.env[${i}] "${envName}" must match UPPER_SNAKE_CASE. 例: ${ENV_EXAMPLES}`);
        }
        if (SENSITIVE_ENV_PATTERNS.some(re => re.test(envName))) {
          warnings.push(`${ctx}: requires.env[${i}] "${envName}" is a platform-embedded credential — declaration is informational only, not a runtime contract (see docs/SKILL_REQUIRES_SCHEMA.md §セキュリティ note)`);
        }
        if (seen.has(envName)) errors.push(`${ctx}: requires.env contains duplicate "${envName}"`);
        seen.add(envName);
      });
    }
  }

  return { errors, warnings };
}

function appendGitHubSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  try {
    fs.appendFileSync(summaryPath, lines.join('\n') + '\n');
  } catch (_) { /* best-effort */ }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('Usage: node scripts/check-skill-requirements.js [--strict] [--verbose] [--github-summary]');
    console.log('See docs/SKILL_REQUIRES_SCHEMA.md for schema details.');
    process.exit(0);
  }

  const warnings = [];
  const files = listSkillFiles(warnings);
  if (files.length === 0) {
    console.error(`No SKILL.md found under ${SKILLS_DIR}`);
    process.exit(1);
  }

  const errors = [];
  let withRequires = 0;
  let withoutRequires = 0;

  for (const { path: p } of files) {
    const rel = path.relative(REPO, p);
    let text;
    try {
      text = fs.readFileSync(p, 'utf8');
    } catch (e) {
      errors.push(`[${rel}] read failed: ${e.message}`);
      continue;
    }

    const fm = extractFrontmatter(text);
    if (!fm) {
      errors.push(`[${rel}] missing or malformed YAML frontmatter (expected '---' delimited block at file start)`);
      continue;
    }
    if (fm.__parseError) {
      errors.push(`[${rel}] frontmatter parse error: ${fm.__parseError}`);
      continue;
    }

    if (!('requires' in fm)) {
      withoutRequires++;
      if (args.strict) {
        errors.push(`[${rel}] requires: missing (--strict mode). Add "requires: {}" for no external deps, or requires: {tools: [...], env: [...]} as applicable.`);
      } else if (args.verbose) {
        console.log(`[skip] ${rel} — no requires:`);
      }
      continue;
    }

    withRequires++;
    const { errors: reqErrors, warnings: reqWarnings } = validateRequires(fm.requires, `[${rel}]`);
    errors.push(...reqErrors);
    warnings.push(...reqWarnings);
    if (reqErrors.length === 0 && args.verbose) {
      console.log(`[ok]   ${rel}`);
    }
  }

  const mode = args.strict ? 'strict' : 'non-strict (requires: optional)';
  console.log('');
  console.log(`Scanned ${files.length} skills (with requires: ${withRequires}, without: ${withoutRequires})`);
  console.log(`Mode: ${mode}`);

  if (warnings.length > 0) {
    console.warn('');
    console.warn(`WARN — ${warnings.length} warning${warnings.length === 1 ? '' : 's'}:`);
    for (const w of warnings) console.warn('  ' + w);
  }

  if (args.githubSummary) {
    const lines = [];
    lines.push(`## Skill Requirements Check`);
    lines.push('');
    lines.push(`- **Scanned**: ${files.length} skills`);
    lines.push(`- **With \`requires:\`**: ${withRequires}`);
    lines.push(`- **Without \`requires:\`**: ${withoutRequires}`);
    lines.push(`- **Mode**: ${mode}`);
    lines.push(`- **Errors**: ${errors.length}`);
    lines.push(`- **Warnings**: ${warnings.length}`);
    lines.push('');
    if (errors.length > 0) {
      lines.push(`### ❌ Errors`);
      for (const e of errors) lines.push(`- ${e}`);
      lines.push('');
    }
    if (warnings.length > 0) {
      lines.push(`### ⚠️ Warnings`);
      for (const w of warnings) lines.push(`- ${w}`);
      lines.push('');
    }
    if (errors.length === 0) lines.push(`✅ All skills pass schema validation.`);
    appendGitHubSummary(lines);
  }

  if (errors.length > 0) {
    console.error('');
    console.error(`FAIL — ${errors.length} error${errors.length === 1 ? '' : 's'}:`);
    for (const e of errors) console.error('  ' + e);
    process.exit(1);
  }

  console.log('');
  console.log('OK — all skills pass schema validation.');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { listSkillFiles, extractFrontmatter, validateRequires };
