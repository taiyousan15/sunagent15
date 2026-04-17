#!/usr/bin/env node
/**
 * Reasoning Capture Hook - 判断文脈の記録
 *
 * PreToolUse で実行され、以下を .claude/hooks/data/reasoning-log.jsonl に記録:
 *   - ツール選択のタイミング
 *   - Task/Skill/Write/Edit 時の判断文脈
 *   - session_id, timestamp, tool_name, reasoning_hint
 *
 * 目的: TAISUN メモリ監査（2026-04-17）で特定されたブラインドスポットを解消
 *   - ツール選択の理由が空白
 *   - 判断の根拠が消える
 *   - セッション間の因果関係が見えない
 *
 * 環境変数:
 *   REASONING_CAPTURE_PHASE='0' = 完全無効化
 *   REASONING_CAPTURE_PHASE='1' = 記録のみ（既定）
 *
 * 非ブロッキング、フェイルオープン。
 */

'use strict';

const path = require('path');

let guardBase;
try {
  guardBase = require('./utils/guard-base');
} catch (e) {
  guardBase = {
    logSkip: () => {},
    runGuard: async (_name, checkFn) => {
      try {
        const chunks = [];
        for await (const chunk of process.stdin) chunks.push(chunk);
        const input = Buffer.concat(chunks).toString('utf8');
        if (!input) { process.exit(0); return; }
        const data = JSON.parse(input);
        checkFn(data.tool_name, data.tool_input || {}, data);
        process.exit(0);
      } catch (err) { process.exit(0); }
    },
    PROJECT_ROOT: path.resolve(__dirname, '../../'),
  };
}

const PROJECT_ROOT = guardBase.PROJECT_ROOT;
const LOG_PATH = path.join(PROJECT_ROOT, '.claude', 'hooks', 'data', 'reasoning-log.jsonl');
const PHASE = process.env.REASONING_CAPTURE_PHASE || '1';

const CAPTURE_TOOLS = ['Task', 'Skill', 'Write', 'Edit', 'MultiEdit', 'Bash'];

function extractReasoningHint(toolName, toolInput) {
  if (!toolInput) return null;
  switch (toolName) {
    case 'Task':
      return {
        subagent_type: toolInput.subagent_type || null,
        description: toolInput.description || null,
        prompt_first_120: (toolInput.prompt || '').slice(0, 120),
      };
    case 'Write':
    case 'Edit':
    case 'MultiEdit':
      return {
        file_path: toolInput.file_path || null,
        has_content: !!toolInput.content || !!toolInput.new_string,
      };
    case 'Bash':
      return {
        command_first_80: (toolInput.command || '').slice(0, 80),
        description: toolInput.description || null,
      };
    default:
      return null;
  }
}

function check(toolName, toolInput, data) {
  try {
    if (PHASE === '0') return null;
    if (!CAPTURE_TOOLS.includes(toolName)) return null;

    const hint = extractReasoningHint(toolName, toolInput);
    if (!hint) return null;

    const entry = {
      sessionId: data?.session_id || process.env.CLAUDE_SESSION_ID || 'unknown',
      tool: toolName,
      hint,
    };

    guardBase.logSkip(LOG_PATH, entry);
    return null; // non-blocking
  } catch (e) {
    return null;
  }
}

if (require.main === module) {
  guardBase.runGuard('reasoning-capture', check);
}

module.exports = { check, PHASE };
