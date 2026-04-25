#!/usr/bin/env node
/**
 * Project Metadata Audit
 *
 * `git ls-files` を正本としてプロジェクトの metadata を集計し、JSON または text で出力する。
 * Codex 戦略 §7.2 の出力 schema に準拠。
 *
 * Source of Truth (§7.1):
 *   - version: package.json
 *   - trackedFiles: git ls-files
 *   - active skills: git tracked .claude/skills/<dir>/SKILL.md (直下のみ、_archived 等除外)
 *   - archived skills: .claude/skills/_archived/**\/SKILL.md
 *   - installed agents: git tracked .claude/agents/*.md
 *   - agent-source templates: git tracked .claude/agent-source/* (深さ1)
 *   - commands.tracked: git ls-files .claude/commands
 *   - commands.untracked: working tree - tracked
 *   - mcp.servers: 配布正本 .mcp.json.example (git tracked) を優先採用。
 *                  個人ローカルの .mcp.json (gitignored) は配布対象外のため数えない。
 *                  .example が無い環境（旧バージョン互換）でのみ .mcp.json にフォールバック。
 *                  _comment_* 疑似キーは除外。
 *   - mcp.tools: 未測定なので null
 *
 * Usage:
 *   node scripts/audit-project-metadata.js          # human-readable
 *   node scripts/audit-project-metadata.js --json   # machine-readable
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

function git(...args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8'));
}

function getVersion() {
  return readJson('package.json').version;
}

function getTrackedFiles() {
  return git('ls-files').split('\n').filter(Boolean).length;
}

function getSkillCounts() {
  const lsFiles = git('ls-files', '.claude/skills').split('\n').filter(Boolean);

  // active = .claude/skills/<dir>/SKILL.md (深さ4要素、_ で始まらない)
  const active = lsFiles.filter((p) => {
    const parts = p.split('/');
    return (
      parts.length === 4 &&
      parts[3] === 'SKILL.md' &&
      parts[2] &&
      !parts[2].startsWith('_')
    );
  }).length;

  // archived = .claude/skills/_archived/**/SKILL.md (任意の深さ)
  const archived = lsFiles.filter(
    (p) => p.startsWith('.claude/skills/_archived/') && p.endsWith('/SKILL.md')
  ).length;

  return { active, archived };
}

function getAgentCounts() {
  const installedFiles = git('ls-files', '.claude/agents').split('\n').filter(Boolean);
  const installed = installedFiles.filter((p) => p.endsWith('.md')).length;

  const sourceFiles = git('ls-files', '.claude/agent-source').split('\n').filter(Boolean);
  // 直下ファイルのみ (深さ3要素 = .claude / agent-source / <file>)
  const agentSourceTemplates = sourceFiles.filter((p) => p.split('/').length === 3).length;

  return { installed, agentSourceTemplates };
}

function getCommandCounts() {
  const tracked = git('ls-files', '.claude/commands').split('\n').filter(Boolean).length;

  // untracked: working tree 全体 - tracked
  let total = 0;
  try {
    const findOutput = execFileSync(
      'find',
      ['.claude/commands', '-maxdepth', '2', '-type', 'f'],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    total = findOutput.split('\n').filter(Boolean).length;
  } catch (_err) {
    // .claude/commands が存在しない場合
    total = 0;
  }

  return { tracked, untracked: Math.max(0, total - tracked) };
}

function getMcpInfo() {
  // Source of Truth: 配布正本である .mcp.json.example (git tracked) を優先採用。
  // 個人ローカルの .mcp.json (gitignored, ユーザー固有 server を含む) は配布対象外。
  // .example が存在しない環境では .mcp.json にフォールバック（旧バージョン互換）。
  const examplePath = path.join(REPO_ROOT, '.mcp.json.example');
  const localPath = path.join(REPO_ROOT, '.mcp.json');
  const sourcePath = fs.existsSync(examplePath)
    ? examplePath
    : fs.existsSync(localPath)
      ? localPath
      : null;
  if (!sourcePath) {
    return { servers: 0, tools: null };
  }
  const j = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const keys = Object.keys(j.mcpServers || {});
  const servers = keys.filter((k) => !k.startsWith('_')).length;
  return { servers, tools: null };
}

function audit() {
  return {
    version: getVersion(),
    trackedFiles: getTrackedFiles(),
    skills: getSkillCounts(),
    agents: getAgentCounts(),
    commands: getCommandCounts(),
    mcp: getMcpInfo(),
  };
}

function formatText(result) {
  const lines = [
    '=== TAISUN Project Metadata Audit ===',
    '',
    `version:                  ${result.version}`,
    `trackedFiles:             ${result.trackedFiles}`,
    `skills.active:            ${result.skills.active}`,
    `skills.archived:          ${result.skills.archived}`,
    `agents.installed:         ${result.agents.installed}`,
    `agents.agentSourceTpl:    ${result.agents.agentSourceTemplates}`,
    `commands.tracked:         ${result.commands.tracked}`,
    `commands.untracked:       ${result.commands.untracked}`,
    `mcp.servers:              ${result.mcp.servers}`,
    `mcp.tools:                ${result.mcp.tools ?? 'null (未測定)'}`,
    '',
    'Source of Truth: git ls-files (commands/skills/agents) + .mcp.json.example (mcp distribution, fallback .mcp.json) + package.json (version)',
  ];
  return lines.join('\n') + '\n';
}

function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes('--json');

  const result = audit();

  if (isJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  process.stdout.write(formatText(result));
}

if (require.main === module) {
  main();
}

module.exports = { audit };
