#!/usr/bin/env node
/**
 * Token Baseline Benchmark
 *
 * 現状の TAISUN Agent のトークン消費を測定:
 * - 全スキル SKILL.md のトークン数（推定）
 * - 全エージェント定義のトークン数（推定）
 * - .claude/settings.json のサイズ
 * - .mcp.json のサイズ
 * - CLAUDE.md チェーン（L1+L2+L3）のトークン数
 *
 * 外部依存なし。Node.js のみで実行可能。
 * トークン推定: 日本語は 1 token ≈ 1.5 文字、英語は 1 token ≈ 4 文字の平均値を使用。
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_DIR = path.resolve(__dirname, '../..');

// 簡易トークン推定（GPT-4/Claude の平均的な換算）
function estimateTokens(text) {
  if (!text) return 0;
  const chars = text.length;
  // 日本語・英語混在の平均的な換算: 1 token ≈ 2.8 文字
  return Math.ceil(chars / 2.8);
}

function sumFileSizesAndTokens(dir, pattern) {
  const results = { count: 0, bytes: 0, tokens: 0, files: [] };
  if (!fs.existsSync(dir)) return results;

  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('_')) continue;
        walk(full);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        const tokens = estimateTokens(content);
        results.count++;
        results.bytes += Buffer.byteLength(content, 'utf8');
        results.tokens += tokens;
        results.files.push({
          path: path.relative(REPO_DIR, full),
          tokens,
          bytes: Buffer.byteLength(content, 'utf8'),
        });
      }
    }
  }
  walk(dir);
  return results;
}

function measureSingleFile(relPath) {
  const abs = path.join(REPO_DIR, relPath);
  if (!fs.existsSync(abs)) return { exists: false, path: relPath };
  const content = fs.readFileSync(abs, 'utf8');
  return {
    exists: true,
    path: relPath,
    bytes: Buffer.byteLength(content, 'utf8'),
    tokens: estimateTokens(content),
  };
}

function main() {
  const skills = sumFileSizesAndTokens(path.join(REPO_DIR, '.claude/skills'), /^SKILL\.md$/);
  const agents = sumFileSizesAndTokens(path.join(REPO_DIR, '.claude/agent-source'), /\.md$/);
  const hooks = sumFileSizesAndTokens(path.join(REPO_DIR, '.claude/hooks'), /\.js$/);

  const settings = measureSingleFile('.claude/settings.json');
  const mcpJson = measureSingleFile('.mcp.json');
  const claudeL1 = measureSingleFile('.claude/CLAUDE.md');
  const claudeL2 = measureSingleFile('.claude/references/CLAUDE-L2.md');
  const claudeL3 = measureSingleFile('.claude/references/CLAUDE-L3.md');
  const memoryMd = measureSingleFile('.claude/rules/mistakes.md');

  const report = {
    generatedAt: new Date().toISOString(),
    repo: path.basename(REPO_DIR),
    method: 'char-based estimate (1 token ≈ 2.8 chars, mixed ja/en)',
    summary: {
      totalSkillTokens: skills.tokens,
      totalAgentTokens: agents.tokens,
      totalHookBytes: hooks.bytes,
      contextChainTokens:
        (claudeL1.tokens || 0) + (claudeL2.tokens || 0) + (claudeL3.tokens || 0),
      top10LargestSkills: skills.files
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 10)
        .map(f => ({ path: f.path, tokens: f.tokens })),
    },
    details: {
      skills: { count: skills.count, bytes: skills.bytes, tokens: skills.tokens },
      agents: { count: agents.count, bytes: agents.bytes, tokens: agents.tokens },
      hooks: { count: hooks.count, bytes: hooks.bytes },
      settings,
      mcpJson,
      claudeL1,
      claudeL2,
      claudeL3,
      memoryMd,
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
