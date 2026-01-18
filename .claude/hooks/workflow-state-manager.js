#!/usr/bin/env node
/**
 * Workflow State Manager - ワークフロー状態の永続管理
 *
 * .workflow_state.json を管理し、以下を提供:
 * - フェーズ管理
 * - ベースラインファイルのハッシュ固定
 * - Read履歴の追跡
 * - スキル使用証跡の記録
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STATE_FILENAME = '.workflow_state.json';

/**
 * 初期状態スキーマ
 */
function createInitialState(workflowId, strict = true) {
  return {
    version: '1.0.0',
    meta: {
      workflowId: workflowId,
      strict: strict,
      currentPhase: 1,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    },
    baseline: {
      files: {}
    },
    evidence: {
      skills_used: {},
      read_log: [],
      approved_deviations: []
    },
    completed_phases: [],
    blockers: []
  };
}

/**
 * 状態ファイルのパスを取得
 */
function getStatePath(cwd) {
  return path.join(cwd || process.cwd(), STATE_FILENAME);
}

/**
 * 状態を読み込み
 */
function loadState(cwd) {
  const statePath = getStatePath(cwd);
  try {
    if (fs.existsSync(statePath)) {
      const content = fs.readFileSync(statePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {}
  return null;
}

/**
 * 状態を保存
 */
function saveState(state, cwd) {
  const statePath = getStatePath(cwd);
  state.meta.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * ファイルのSHA256ハッシュを計算
 */
function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

/**
 * ベースラインファイルを登録
 */
function registerBaseline(state, filePath) {
  const basename = path.basename(filePath);
  const hash = calculateFileHash(filePath);

  if (!hash) return false;

  // 既に登録済みの場合はスキップ
  if (state.baseline.files[basename]) {
    return true;
  }

  state.baseline.files[basename] = {
    path: filePath,
    sha256: hash,
    registeredAt: new Date().toISOString()
  };

  return true;
}

/**
 * ベースラインの整合性を確認
 */
function checkBaselineIntegrity(state, filePath) {
  const basename = path.basename(filePath);
  const baseline = state.baseline.files[basename];

  if (!baseline) {
    return { valid: true, reason: 'not_registered' };
  }

  const currentHash = calculateFileHash(filePath);

  if (!currentHash) {
    return { valid: true, reason: 'file_not_found' };
  }

  if (currentHash !== baseline.sha256) {
    return {
      valid: false,
      reason: 'hash_mismatch',
      expected: baseline.sha256,
      actual: currentHash
    };
  }

  return { valid: true, reason: 'match' };
}

/**
 * Read履歴を追加
 */
function addReadLog(state, filePath, sessionId) {
  const entry = {
    path: filePath,
    basename: path.basename(filePath),
    readAt: new Date().toISOString(),
    sessionId: sessionId || 'unknown'
  };

  state.evidence.read_log.push(entry);

  // 最大1000件まで保持
  if (state.evidence.read_log.length > 1000) {
    state.evidence.read_log = state.evidence.read_log.slice(-1000);
  }

  return true;
}

/**
 * ファイルが読み込み済みか確認
 */
function hasBeenRead(state, filePath) {
  const basename = path.basename(filePath);

  return state.evidence.read_log.some(entry =>
    entry.path === filePath || entry.basename === basename
  );
}

/**
 * スキル使用を記録
 */
function recordSkillUsage(state, skillId, details) {
  state.evidence.skills_used[skillId] = {
    usedAt: new Date().toISOString(),
    details: details || {}
  };
  return true;
}

/**
 * スキルが使用されたか確認
 */
function hasSkillBeenUsed(state, skillId) {
  return !!state.evidence.skills_used[skillId];
}

/**
 * 逸脱の承認を記録
 */
function recordDeviationApproval(state, deviation, approvedBy) {
  state.evidence.approved_deviations.push({
    deviation: deviation,
    approvedAt: new Date().toISOString(),
    approvedBy: approvedBy || 'user'
  });
  return true;
}

/**
 * 逸脱が承認済みか確認
 */
function isDeviationApproved(state, deviation) {
  return state.evidence.approved_deviations.some(d =>
    d.deviation === deviation
  );
}

/**
 * フェーズを進める
 */
function advancePhase(state) {
  state.completed_phases.push(state.meta.currentPhase);
  state.meta.currentPhase += 1;
  return true;
}

/**
 * 状態の要約を生成（SessionStart注入用）
 */
function generateStateSummary(state) {
  if (!state) return null;

  const lines = [];
  lines.push('=== WORKFLOW STATE SUMMARY ===');
  lines.push('');
  lines.push(`**Workflow**: ${state.meta.workflowId}`);
  lines.push(`**Mode**: ${state.meta.strict ? 'STRICT (逸脱はブロックされます)' : 'ADVISORY'}`);
  lines.push(`**Current Phase**: ${state.meta.currentPhase}`);
  lines.push(`**Started**: ${state.meta.startedAt}`);
  lines.push('');

  if (state.completed_phases.length > 0) {
    lines.push(`**Completed Phases**: ${state.completed_phases.join(', ')}`);
  }

  if (Object.keys(state.baseline.files).length > 0) {
    lines.push('');
    lines.push('**Baseline Files (変更禁止)**:');
    Object.entries(state.baseline.files).forEach(([name, info]) => {
      lines.push(`  - ${name} (${info.sha256.substring(0, 8)}...)`);
    });
  }

  if (Object.keys(state.evidence.skills_used).length > 0) {
    lines.push('');
    lines.push('**Used Skills**:');
    Object.keys(state.evidence.skills_used).forEach(skill => {
      lines.push(`  - ${skill}`);
    });
  }

  if (state.blockers.length > 0) {
    lines.push('');
    lines.push('**BLOCKERS**:');
    state.blockers.forEach(b => {
      lines.push(`  - ${b}`);
    });
  }

  lines.push('');
  lines.push('**RULES**:');
  lines.push('1. ベースラインファイルの改変は禁止');
  lines.push('2. 未読ファイルの編集は禁止（先にReadせよ）');
  lines.push('3. 指示にない行動は事前承認が必要');
  lines.push('4. スキル指定がある場合はSkillツールを使用');
  lines.push('');
  lines.push('=== END WORKFLOW STATE ===');

  return lines.join('\n');
}

// CLI実行時
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const cwd = process.cwd();

  switch (command) {
    case 'init': {
      const workflowId = args[1] || 'default';
      const strict = args[2] !== 'advisory';
      const state = createInitialState(workflowId, strict);
      if (saveState(state, cwd)) {
        console.log(JSON.stringify({ success: true, state }));
      } else {
        console.log(JSON.stringify({ success: false, error: 'Failed to save state' }));
      }
      break;
    }
    case 'load': {
      const state = loadState(cwd);
      console.log(JSON.stringify({ success: !!state, state }));
      break;
    }
    case 'summary': {
      const state = loadState(cwd);
      const summary = generateStateSummary(state);
      console.log(summary || 'No workflow state found');
      break;
    }
    case 'register-baseline': {
      const filePath = args[1];
      const state = loadState(cwd);
      if (state && filePath) {
        registerBaseline(state, filePath);
        saveState(state, cwd);
        console.log(JSON.stringify({ success: true }));
      } else {
        console.log(JSON.stringify({ success: false, error: 'State or file path missing' }));
      }
      break;
    }
    default:
      console.log('Usage: workflow-state-manager.js [init|load|summary|register-baseline] [args...]');
  }
}

// モジュールエクスポート
module.exports = {
  createInitialState,
  loadState,
  saveState,
  getStatePath,
  calculateFileHash,
  registerBaseline,
  checkBaselineIntegrity,
  addReadLog,
  hasBeenRead,
  recordSkillUsage,
  hasSkillBeenUsed,
  recordDeviationApproval,
  isDeviationApproved,
  advancePhase,
  generateStateSummary
};
