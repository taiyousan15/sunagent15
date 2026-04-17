#!/usr/bin/env node
/**
 * Contract Audit Hook - Workflow Fidelity Contract 違反の監査記録
 *
 * Stop/SessionEnd 時に実行。
 * .workflow_state.json の required_skills で used:false があれば
 * contract-violations.jsonl に追記（audit-only、ブロックしない）。
 *
 * 目的:
 *   - Contract 違反パターンを可視化
 *   - mistakes.md への自動追記の前段階
 *   - 誤検出に備え audit-only で開始（Codex Pro Phase 3 #19 推奨）
 *
 * 環境変数:
 *   CONTRACT_AUDIT_PHASE='0' = 完全無効化
 *   CONTRACT_AUDIT_PHASE='1' = audit-only（既定、ログのみ）
 *
 * 安全設計: フェイルオープン・タイムアウト3秒・環境変数で即停止可能
 */

'use strict';

const fs = require('fs');
const path = require('path');

let guardBase;
try {
  guardBase = require('./utils/guard-base');
} catch (e) {
  console.error('contract-audit: guard-base load failed:', e.message);
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
const STATE_PATH = path.join(PROJECT_ROOT, '.workflow_state.json');
const VIOLATION_LOG = path.join(PROJECT_ROOT, '.claude', 'hooks', 'data', 'contract-violations.jsonl');
const PHASE = process.env.CONTRACT_AUDIT_PHASE || '1';

function check(_toolName, _toolInput, data) {
  try {
    if (PHASE === '0') return null;

    if (!fs.existsSync(STATE_PATH)) return null;

    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    const required = state?.evidence?.required_skills;
    if (!required || typeof required !== 'object') return null;

    const violations = Object.entries(required)
      .filter(([, info]) => info && info.used === false)
      .map(([name, info]) => ({ skill: name, requestedAt: info.requestedAt, autoMapped: !!info.autoMapped }));

    if (violations.length === 0) return null;

    const entry = {
      ts: new Date().toISOString(),
      sessionId: state?.meta?.sessionId || data?.session_id || 'unknown',
      violationCount: violations.length,
      skills: violations.map(v => v.skill),
      workflow: state?.meta?.workflow,
      startedAt: state?.meta?.startedAt,
    };

    guardBase.logSkip(VIOLATION_LOG, entry);
    return null; // audit-only, never block
  } catch (e) {
    return null;
  }
}

if (require.main === module) {
  guardBase.runGuard('contract-audit', check);
}

module.exports = { check, PHASE };
