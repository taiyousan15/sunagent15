#!/usr/bin/env node
/**
 * rules-read-tracker.js — ルールRead履歴トラッカー
 *
 * PostToolUse hookとして動作。Read tool実行後、対象ファイルが
 * .claude/rules/* または重要ルールファイルの場合、
 * 「Read済み」フラグを記録する。
 *
 * このフラグは rules-enforce-guard.js で参照される。
 *
 * 安全設計: フェイルオープン・常に exit 0
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const READ_LOG_DIR = path.join(PROJECT_ROOT, '.claude', 'checkpoints');

// 追跡対象のファイルパターン
const TRACKED_PATTERNS = [
  /\.claude\/rules\/.*\.md$/,
  /\.claude\/CLAUDE\.md$/,
  /\.claude\/hooks\/mistakes\.md$/,
  /SESSION_HANDOFF\.md$/,
];

function getSessionId() {
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;
  const today = new Date().toISOString().split('T')[0];
  return `${today}_${process.pid}`;
}

function recordRead(filePath) {
  try {
    if (!filePath) return;

    // 追跡対象か確認
    const isTracked = TRACKED_PATTERNS.some(p => p.test(filePath));
    if (!isTracked) return;

    // 記録先ファイル
    const sessionId = getSessionId();
    const logFile = path.join(READ_LOG_DIR, `read_${sessionId}.json`);

    fs.mkdirSync(READ_LOG_DIR, { recursive: true });

    let data = { reads: [] };
    if (fs.existsSync(logFile)) {
      try {
        data = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      } catch (e) {}
    }

    if (!data.reads.includes(filePath)) {
      data.reads.push(filePath);
      data.lastUpdate = new Date().toISOString();
      fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
    }
  } catch (e) {}
}

async function main() {
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const input = Buffer.concat(chunks).toString('utf8');
    if (!input) {
      process.exit(0);
      return;
    }

    const data = JSON.parse(input);

    // Read tool の実行のみ追跡
    if (data.tool_name === 'Read') {
      const filePath = data.tool_input && data.tool_input.file_path;
      recordRead(filePath);
    }

    process.exit(0);
  } catch (e) {
    process.exit(0); // フェイルオープン
  }
}

if (require.main === module) main();

module.exports = { recordRead, getSessionId };
