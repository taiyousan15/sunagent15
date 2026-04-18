#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const readmePath = path.join(repoRoot, 'README.md');
const skillsDir = path.join(repoRoot, '.claude', 'skills');
const profileFilePath = path.join(repoRoot, 'scripts', 'skill-profiles.json');

const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const isWrite = args.includes('--write');

if (args.length !== 1 || (isCheck && isWrite) || (!isCheck && !isWrite)) {
  process.stderr.write('Usage: node scripts/sync-readme-counts.js --check|--write\n');
  process.exit(2);
}

function countInstalledSkills(skillsRootPath) {
  if (!fs.existsSync(skillsRootPath)) {
    throw new Error(`Skills directory not found: ${skillsRootPath}`);
  }

  return fs
    .readdirSync(skillsRootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('_'))
    .filter((name) => name !== 'data')
    .length;
}

function loadProfileCounts(profilePath) {
  if (!fs.existsSync(profilePath)) {
    return {
      presetCounts: {},
      groupCounts: {},
      warning: `Profile file not found: ${profilePath}`,
    };
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  } catch (err) {
    return {
      presetCounts: {},
      groupCounts: {},
      warning: `Failed to parse ${profilePath}: ${err.message}`,
    };
  }

  if (!raw || typeof raw !== 'object' || !raw.profiles || !raw.presets) {
    return {
      presetCounts: {},
      groupCounts: {},
      warning: `Invalid profile file shape in ${profilePath} (expected profiles/presets)`,
    };
  }

  const profiles = raw.profiles;
  const presets = raw.presets;
  const groupCounts = {};
  const presetCounts = {};

  for (const [groupName, groupDef] of Object.entries(profiles)) {
    const skills = Array.isArray(groupDef && groupDef.skills) ? groupDef.skills : [];
    const unique = new Set(skills.filter((skill) => typeof skill === 'string' && skill.trim() !== ''));
    groupCounts[groupName] = unique.size;
  }

  for (const [presetName, groupNames] of Object.entries(presets)) {
    if (!Array.isArray(groupNames)) {
      continue;
    }

    const uniqueSkills = new Set();
    for (const groupName of groupNames) {
      const groupDef = profiles[groupName];
      const skills = Array.isArray(groupDef && groupDef.skills) ? groupDef.skills : [];
      for (const skill of skills) {
        if (typeof skill === 'string' && skill.trim() !== '') {
          uniqueSkills.add(skill);
        }
      }
    }
    presetCounts[presetName] = uniqueSkills.size;
  }

  return { presetCounts, groupCounts, warning: null };
}

function replaceFirstCountToken(line, nextCount) {
  const countString = String(nextCount);

  if (/(約?)\d+(\s*個)/.test(line)) {
    return line.replace(/(約?)\d+(\s*個)/, (_m, approx, unit) => `${approx}${countString}${unit}`);
  }
  if (/\d+(\s*skills?\b)/i.test(line)) {
    return line.replace(/\d+(\s*skills?\b)/i, (_m, unit) => `${countString}${unit}`);
  }
  return line;
}

function syncReadmeCounts(readmeContent, installedCount, profileCounts, groupCounts) {
  const pieces = readmeContent.split(/(\r?\n)/);

  for (let index = 0; index < pieces.length; index += 2) {
    let line = pieces[index];

    if (typeof line !== 'string' || line.length === 0) {
      continue;
    }

    if (/スキル:\s*\d+\s*個が利用可能です/.test(line)) {
      line = line.replace(/(スキル:\s*)\d+(\s*個が利用可能です)/, `$1${installedCount}$2`);
    }

    if (/^\s*│\s*スキル\s*│/.test(line) && /\d+\s*個/.test(line)) {
      line = line.replace(/^(\s*│\s*スキル\s*│\s*)\d+(\s*個\s*│.*)$/, `$1${installedCount}$2`);
    }

    if (/スキル定義検証（\d+個）/.test(line)) {
      line = line.replace(/(スキル定義検証（)\d+(個）)/, `$1${installedCount}$2`);
    }

    if (/^\|\s*スキル\s*\|\s*\d+\s*個\s*\|/.test(line)) {
      line = line.replace(/^(\|\s*スキル\s*\|\s*)\d+(\s*個\s*\|.*)$/, `$1${installedCount}$2`);
    }

    if (/^\|\s*skills?\s*\|\s*\d+\s*skills?\s*\|/i.test(line)) {
      line = line.replace(/^(\|\s*skills?\s*\|\s*)\d+(\s*skills?\s*\|.*)$/i, `$1${installedCount}$2`);
    }

    const presetRules = [
      {
        key: 'minimal',
        profile: /(?:--profile|-Profile)\s+minimal\b/i,
        hint: /(最小構成|コアスキルのみ|minimal)/i,
      },
      {
        key: 'standard',
        profile: /(?:--profile|-Profile)\s+standard\b/i,
        hint: /(標準構成|standard)/i,
      },
      {
        key: 'full',
        profile: /(?:--profile|-Profile)\s+full\b/i,
        hint: /(全スキル|full)/i,
      },
    ];

    for (const rule of presetRules) {
      if (
        typeof profileCounts[rule.key] === 'number' &&
        rule.profile.test(line) &&
        rule.hint.test(line) &&
        /(\d+\s*個|\d+\s*skills?\b)/i.test(line)
      ) {
        line = replaceFirstCountToken(line, profileCounts[rule.key]);
      }
    }

    const groupRules = [
      { key: 'docker', flag: /(?:--with-docker|-WithDocker)\b/i },
      { key: 'figma', flag: /(?:--with-figma|-WithFigma)\b/i },
      { key: 'voice', flag: /(?:--with-voice|-WithVoice)\b/i },
      { key: 'deep-research', flag: /(?:--with-deep-research|-WithDeepResearch)\b/i },
    ];

    for (const rule of groupRules) {
      if (
        typeof groupCounts[rule.key] === 'number' &&
        rule.flag.test(line) &&
        /(\d+\s*個|\d+\s*skills?\b)/i.test(line)
      ) {
        line = replaceFirstCountToken(line, groupCounts[rule.key]);
      }
    }

    pieces[index] = line;
  }

  return pieces.join('');
}

let installedSkillCount;
try {
  installedSkillCount = countInstalledSkills(skillsDir);
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
}

const { presetCounts, groupCounts, warning } = loadProfileCounts(profileFilePath);
if (warning) {
  process.stderr.write(`Warning: ${warning}\n`);
}

if (!fs.existsSync(readmePath)) {
  process.stderr.write(`README not found: ${readmePath}\n`);
  process.exit(1);
}

const originalReadme = fs.readFileSync(readmePath, 'utf8');
const syncedReadme = syncReadmeCounts(originalReadme, installedSkillCount, presetCounts, groupCounts);
const hasDrift = syncedReadme !== originalReadme;

if (isCheck) {
  if (hasDrift) {
    process.stderr.write(
      'README skill counts are out of sync. Run: node scripts/sync-readme-counts.js --write\n'
    );
    process.exit(1);
  }
  process.stdout.write('README skill counts are in sync.\n');
  process.exit(0);
}

if (hasDrift) {
  fs.writeFileSync(readmePath, syncedReadme, 'utf8');
  process.stdout.write('Updated README skill counts.\n');
} else {
  process.stdout.write('README skill counts already in sync.\n');
}
