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
 * 初期状態スキーマ (v2.0.0 - Intent Contract First 対応)
 */
function createInitialState(workflowId, strict = true) {
  return {
    version: '2.0.0',
    meta: {
      workflowId: workflowId,
      strict: strict,
      currentPhase: 1,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    },
    // Intent Contract First (Phase 1)
    intentContractRef: null,
    // Active skill/step tracking (Phase 4)
    activeSkillId: null,
    activeSkillStepId: null,
    // Baseline files
    baseline: {
      files: {}
    },
    // Reference assets (Phase 2, 5)
    registeredInputs: {
      referenceAssets: []
    },
    locks: {
      referenceAssets: []
    },
    // Evidence ledger (Phase 3)
    evidence: {
      skills_used: {},
      read_log: [],
      approved_deviations: [],
      skillEvidence: [],
      skillEvidenceIndexByStepId: {}
    },
    // Decisions (Phase 6)
    decisions: {
      assetReuse: []
    },
    // Approvals (enhanced for Phase deviation)
    approvals: {
      deviations: []
    },
    // Validations (Phase 7)
    validations: {
      lastResults: []
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

// ===== Intent Contract First (Phase 1) =====

const INTENT_CONTRACT_PATH = 'artifacts/intent_contract.yaml';
const INTENT_CONTRACT_REQUIRED_FIELDS = [
  'objective',
  'non_goals',
  'inputs',
  'constraints',
  'definition_of_done',
  'allowed_deviations_policy'
];

/**
 * Intent Contract の存在と必須フィールドを検証
 */
function validateIntentContract(cwd) {
  const contractPath = path.join(cwd, INTENT_CONTRACT_PATH);

  if (!fs.existsSync(contractPath)) {
    return {
      valid: false,
      reason: 'not_found',
      message: `Intent Contract が見つかりません: ${INTENT_CONTRACT_PATH}`
    };
  }

  try {
    const content = fs.readFileSync(contractPath, 'utf8');
    const data = parseYamlSimple(content);

    if (!data) {
      return {
        valid: false,
        reason: 'parse_error',
        message: 'Intent Contract のパースに失敗しました'
      };
    }

    const missingFields = [];
    for (const field of INTENT_CONTRACT_REQUIRED_FIELDS) {
      if (!data[field] && data[field] !== false && data[field] !== 0) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return {
        valid: false,
        reason: 'missing_fields',
        message: `必須フィールドが不足: ${missingFields.join(', ')}`,
        missingFields
      };
    }

    return {
      valid: true,
      reason: 'valid',
      data
    };
  } catch (e) {
    return {
      valid: false,
      reason: 'read_error',
      message: `Intent Contract の読み込みエラー: ${e.message}`
    };
  }
}

/**
 * Intent Contract の参照をstateに登録
 */
function registerIntentContract(state, contractPath, contractHash) {
  state.intentContractRef = {
    path: contractPath,
    sha256: contractHash,
    registeredAt: new Date().toISOString()
  };
  return true;
}

// ===== Phase 2: Deterministic Reference Analyzer =====

const REFERENCE_ANALYSIS_PATH = 'artifacts/reference_analysis.json';

/**
 * 参考アセットを登録し、sha256をロック
 */
function registerReferenceAsset(state, assetId, sha256, metadata = {}) {
  // registeredInputs に追加
  const existingIndex = state.registeredInputs.referenceAssets.findIndex(a => a.asset_id === assetId);
  const registration = {
    asset_id: assetId,
    sha256: sha256,
    metadata: metadata,
    registeredAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    state.registeredInputs.referenceAssets[existingIndex] = registration;
  } else {
    state.registeredInputs.referenceAssets.push(registration);
  }

  // locks にも追加
  const lockIndex = state.locks.referenceAssets.findIndex(l => l.asset_id === assetId);
  const lock = {
    asset_id: assetId,
    sha256: sha256,
    lockedAt: new Date().toISOString()
  };

  if (lockIndex >= 0) {
    state.locks.referenceAssets[lockIndex] = lock;
  } else {
    state.locks.referenceAssets.push(lock);
  }

  return true;
}

/**
 * reference_analysis.json の存在と内容を検証
 */
function validateReferenceAnalysis(cwd) {
  const analysisPath = path.join(cwd, REFERENCE_ANALYSIS_PATH);

  if (!fs.existsSync(analysisPath)) {
    return {
      valid: false,
      reason: 'not_found',
      message: `参考入力の分析結果が見つかりません: ${REFERENCE_ANALYSIS_PATH}`
    };
  }

  try {
    const content = fs.readFileSync(analysisPath, 'utf8');
    const data = JSON.parse(content);

    if (!data.assets || data.assets.length === 0) {
      return {
        valid: false,
        reason: 'empty',
        message: '分析結果にアセットが含まれていません'
      };
    }

    // 各アセットに必須フィールドがあるか確認
    const requiredFields = ['asset_id', 'type', 'sha256', 'metadata', 'derived_features', 'timestamp'];
    for (const asset of data.assets) {
      for (const field of requiredFields) {
        if (!(field in asset)) {
          return {
            valid: false,
            reason: 'missing_field',
            message: `アセット ${asset.asset_id || 'unknown'} に必須フィールド "${field}" がありません`
          };
        }
      }
    }

    return {
      valid: true,
      reason: 'valid',
      data
    };
  } catch (e) {
    return {
      valid: false,
      reason: 'parse_error',
      message: `分析結果のパースエラー: ${e.message}`
    };
  }
}

/**
 * 登録済みアセットと分析結果のsha256が一致するか検証
 */
function verifyReferenceProvenance(state, cwd) {
  if (!state.locks.referenceAssets || state.locks.referenceAssets.length === 0) {
    return { valid: true, reason: 'no_locks' };
  }

  const analysisValidation = validateReferenceAnalysis(cwd);
  if (!analysisValidation.valid) {
    return analysisValidation;
  }

  const mismatches = [];
  for (const lock of state.locks.referenceAssets) {
    const analyzed = analysisValidation.data.assets.find(a => a.asset_id === lock.asset_id);

    if (!analyzed) {
      mismatches.push({
        asset_id: lock.asset_id,
        reason: 'not_analyzed',
        expected: lock.sha256
      });
    } else if (analyzed.sha256 !== lock.sha256) {
      mismatches.push({
        asset_id: lock.asset_id,
        reason: 'hash_mismatch',
        expected: lock.sha256,
        actual: analyzed.sha256
      });
    }
  }

  if (mismatches.length > 0) {
    return {
      valid: false,
      reason: 'provenance_mismatch',
      message: '参考入力のすり替えを検知しました',
      mismatches
    };
  }

  return { valid: true, reason: 'verified' };
}

// ===== Phase 3: Evidence Auto Capture Ledger =====

/**
 * 証跡タイプ定義
 */
const EVIDENCE_TYPES = {
  READ_FILE: 'read:file',
  SEARCH_REPO: 'search:repo',
  ARTIFACT_CREATED: 'artifact:file_created',
  ARTIFACT_UPDATED: 'artifact:file_updated',
  HASH_REFERENCE: 'hash:sha256_of_reference_asset',
  COMMAND_EXECUTED: 'command:executed',
  SKILL_INVOKED: 'skill:invoked',
  DECISION_MADE: 'decision:made'
};

/**
 * 自動証跡キャプチャ（Hook PostToolUseから呼ばれる）
 */
function captureEvidence(state, evidenceType, data) {
  if (!state.evidence.skillEvidence) {
    state.evidence.skillEvidence = [];
  }

  const evidence = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    type: evidenceType,
    data: data,
    capturedAt: new Date().toISOString(),
    activeSkillId: state.activeSkillId,
    activeSkillStepId: state.activeSkillStepId
  };

  state.evidence.skillEvidence.push(evidence);

  // stepIdがあればインデックスにも追加
  if (state.activeSkillStepId) {
    if (!state.evidence.skillEvidenceIndexByStepId) {
      state.evidence.skillEvidenceIndexByStepId = {};
    }
    if (!state.evidence.skillEvidenceIndexByStepId[state.activeSkillStepId]) {
      state.evidence.skillEvidenceIndexByStepId[state.activeSkillStepId] = [];
    }
    state.evidence.skillEvidenceIndexByStepId[state.activeSkillStepId].push(evidence.id);
  }

  return evidence;
}

/**
 * Read証跡をキャプチャ
 */
function captureReadEvidence(state, filePath, sessionId) {
  return captureEvidence(state, EVIDENCE_TYPES.READ_FILE, {
    file_path: filePath,
    session_id: sessionId
  });
}

/**
 * Search証跡をキャプチャ（Glob/Grep）
 */
function captureSearchEvidence(state, searchType, pattern, results) {
  return captureEvidence(state, EVIDENCE_TYPES.SEARCH_REPO, {
    search_type: searchType,
    pattern: pattern,
    result_count: results?.length || 0,
    results_summary: results?.slice(0, 5) // 最初の5件のみ
  });
}

/**
 * Artifact証跡をキャプチャ（Write/Edit）
 */
function captureArtifactEvidence(state, filePath, operation, sha256) {
  const type = operation === 'create'
    ? EVIDENCE_TYPES.ARTIFACT_CREATED
    : EVIDENCE_TYPES.ARTIFACT_UPDATED;

  return captureEvidence(state, type, {
    file_path: filePath,
    operation: operation,
    sha256: sha256
  });
}

/**
 * Command実行証跡をキャプチャ（Bash）
 */
function captureCommandEvidence(state, command, exitCode) {
  return captureEvidence(state, EVIDENCE_TYPES.COMMAND_EXECUTED, {
    command_preview: command.substring(0, 100),
    exit_code: exitCode
  });
}

/**
 * Skill呼び出し証跡をキャプチャ
 */
function captureSkillEvidence(state, skillName, args) {
  return captureEvidence(state, EVIDENCE_TYPES.SKILL_INVOKED, {
    skill_name: skillName,
    args_preview: JSON.stringify(args).substring(0, 200)
  });
}

/**
 * 意思決定証跡をキャプチャ
 */
function captureDecisionEvidence(state, decision, rationale) {
  return captureEvidence(state, EVIDENCE_TYPES.DECISION_MADE, {
    decision: decision,
    rationale: rationale
  });
}

/**
 * 特定Stepに必要な証跡があるかチェック
 */
function hasRequiredEvidence(state, stepId, requiredTypes) {
  if (!state.evidence.skillEvidenceIndexByStepId) {
    return { valid: false, missing: requiredTypes };
  }

  const stepEvidenceIds = state.evidence.skillEvidenceIndexByStepId[stepId] || [];
  const stepEvidence = state.evidence.skillEvidence.filter(e => stepEvidenceIds.includes(e.id));
  const presentTypes = stepEvidence.map(e => e.type);

  const missing = requiredTypes.filter(t => !presentTypes.includes(t));

  return {
    valid: missing.length === 0,
    missing: missing,
    present: presentTypes
  };
}

// ===== Phase 6: Read Before Create Gate =====

/**
 * 新規ファイル作成前に必要な探索/Read/決定があるか検証
 * PreToolUse の Write/Edit 時に呼び出し、証跡が不足していればブロック
 */
function validateNewFileCreation(state, filePath) {
  const checks = {
    hasSearch: false,
    hasRead: false,
    hasDecision: false,
    searchCount: 0,
    readCount: 0,
    decisionCount: 0
  };

  // 証跡から探索/Read/決定の有無をチェック
  const evidence = state.evidence.skillEvidence || [];
  const recentEvidence = evidence.slice(-20); // 直近20件をチェック

  for (const ev of recentEvidence) {
    if (ev.type === EVIDENCE_TYPES.SEARCH_REPO) {
      checks.hasSearch = true;
      checks.searchCount++;
    }
    if (ev.type === EVIDENCE_TYPES.READ_FILE) {
      checks.hasRead = true;
      checks.readCount++;
    }
    if (ev.type === EVIDENCE_TYPES.DECISION_MADE) {
      checks.hasDecision = true;
      checks.decisionCount++;
    }
  }

  // 既存のRead履歴も確認
  if (state.evidence.read_log && state.evidence.read_log.length > 0) {
    checks.hasRead = true;
    checks.readCount = Math.max(checks.readCount, state.evidence.read_log.length);
  }

  // 決定証跡は state.decisions.assetReuse からも確認
  if (state.decisions.assetReuse && state.decisions.assetReuse.length > 0) {
    checks.hasDecision = true;
    checks.decisionCount = Math.max(checks.decisionCount, state.decisions.assetReuse.length);
  }

  // 条件: 探索または決定が必要
  // 最低限、Readまたは決定が必要（探索なしでも明確な決定があればOK）
  const valid = (checks.hasSearch || checks.hasRead) && (checks.hasDecision || checks.readCount >= 2);

  return {
    valid: valid,
    checks: checks,
    reason: valid ? null : 'no_read_evidence',
    message: valid ? '' : '探索+Read+決定が不足しています'
  };
}

// ===== Phase 4: Skill Step Transition Gate =====

/**
 * スキルを開始（activeSkillIdを設定）
 */
function startSkill(state, skillId) {
  state.activeSkillId = skillId;
  state.activeSkillStepId = null;
  state.evidence.skills_used[skillId] = {
    startedAt: new Date().toISOString(),
    steps: []
  };
  return { success: true, skillId };
}

/**
 * ステップを開始（activeSkillStepIdを設定）
 */
function startStep(state, stepId) {
  if (!state.activeSkillId) {
    return { success: false, reason: 'no_active_skill', message: 'スキルが開始されていません' };
  }

  state.activeSkillStepId = stepId;

  // ステップ証跡インデックスを初期化
  if (!state.evidence.skillEvidenceIndexByStepId[stepId]) {
    state.evidence.skillEvidenceIndexByStepId[stepId] = [];
  }

  // スキル使用履歴に記録
  if (state.evidence.skills_used[state.activeSkillId]) {
    state.evidence.skills_used[state.activeSkillId].steps.push({
      stepId: stepId,
      startedAt: new Date().toISOString()
    });
  }

  return { success: true, stepId };
}

/**
 * ステップを完了（Gate関数 - requiredEvidenceがなければブロック）
 */
function completeStep(state, stepId, requiredEvidence = []) {
  if (!state.activeSkillId) {
    return { success: false, reason: 'no_active_skill', message: 'スキルが開始されていません' };
  }

  if (state.activeSkillStepId !== stepId) {
    return {
      success: false,
      reason: 'step_mismatch',
      message: `現在のステップは${state.activeSkillStepId}ですが、${stepId}を完了しようとしています`
    };
  }

  // 必要証跡のチェック
  if (requiredEvidence.length > 0) {
    const evidenceCheck = hasRequiredEvidence(state, stepId, requiredEvidence);
    if (!evidenceCheck.valid) {
      return {
        success: false,
        reason: 'missing_evidence',
        message: `ステップ完了に必要な証跡が不足しています`,
        missing: evidenceCheck.missing,
        present: evidenceCheck.present
      };
    }
  }

  // ステップ完了を記録
  const skillSteps = state.evidence.skills_used[state.activeSkillId]?.steps || [];
  const currentStep = skillSteps.find(s => s.stepId === stepId);
  if (currentStep) {
    currentStep.completedAt = new Date().toISOString();
  }

  // activeSkillStepIdをクリア（次のステップを待つ）
  state.activeSkillStepId = null;

  return { success: true, stepId, message: `ステップ${stepId}が完了しました` };
}

/**
 * スキルを完了
 */
function completeSkill(state, skillId) {
  if (state.activeSkillId !== skillId) {
    return {
      success: false,
      reason: 'skill_mismatch',
      message: `現在のスキルは${state.activeSkillId}ですが、${skillId}を完了しようとしています`
    };
  }

  // スキル完了を記録
  if (state.evidence.skills_used[skillId]) {
    state.evidence.skills_used[skillId].completedAt = new Date().toISOString();
  }

  // activeSkillIdをクリア
  state.activeSkillId = null;
  state.activeSkillStepId = null;

  return { success: true, skillId, message: `スキル${skillId}が完了しました` };
}

/**
 * 現在のスキル/ステップ状態を取得
 */
function getActiveSkillState(state) {
  return {
    activeSkillId: state.activeSkillId,
    activeSkillStepId: state.activeSkillStepId,
    skillHistory: state.evidence.skills_used
  };
}

// ===== Phase 7: Definition Lint Hard Gate =====

/**
 * 定義ファイルのLintを実行（ワークフロー開始時）
 */
function runDefinitionLint(cwd) {
  try {
    const lintGate = require('./definition-lint-gate.js');
    return lintGate.lintAllDefinitions(cwd);
  } catch (e) {
    return {
      valid: true,
      error: `Lint module load error: ${e.message}`,
      checkedFiles: []
    };
  }
}

/**
 * Strict モードでワークフローを開始する前のチェック
 */
function validateWorkflowStart(cwd, strict = true) {
  const checks = {
    intentContract: null,
    definitionLint: null,
    valid: true,
    blockers: []
  };

  // Intent Contract チェック
  if (strict) {
    const contractCheck = validateIntentContract(cwd);
    checks.intentContract = contractCheck;
    if (!contractCheck.valid) {
      checks.valid = false;
      checks.blockers.push(`Intent Contract: ${contractCheck.reason}`);
    }
  }

  // Definition Lint チェック
  if (strict) {
    const lintCheck = runDefinitionLint(cwd);
    checks.definitionLint = lintCheck;
    if (!lintCheck.valid) {
      checks.valid = false;
      checks.blockers.push(`Definition Lint: ${lintCheck.violations.length}件の違反`);
    }
  }

  return checks;
}

/**
 * 簡易YAMLパーサー（基本的なkey: valueのみ対応）
 */
function parseYamlSimple(content) {
  const lines = content.split('\n');
  const result = {};
  let currentKey = null;
  let currentIndent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (value === '' || value === '|' || value === '>') {
        result[key] = true; // 値がある（空でも）
      } else if (value.startsWith('[') || value.startsWith('{')) {
        result[key] = value;
      } else if (value === 'true' || value === 'false') {
        result[key] = value === 'true';
      } else {
        result[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
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
  generateStateSummary,
  // Phase 1: Intent Contract First
  validateIntentContract,
  registerIntentContract,
  INTENT_CONTRACT_PATH,
  INTENT_CONTRACT_REQUIRED_FIELDS,
  // Phase 2: Deterministic Reference Analyzer
  registerReferenceAsset,
  validateReferenceAnalysis,
  verifyReferenceProvenance,
  REFERENCE_ANALYSIS_PATH: 'artifacts/reference_analysis.json',
  // Phase 3: Evidence Auto Capture Ledger
  EVIDENCE_TYPES,
  captureEvidence,
  captureReadEvidence,
  captureSearchEvidence,
  captureArtifactEvidence,
  captureCommandEvidence,
  captureSkillEvidence,
  captureDecisionEvidence,
  hasRequiredEvidence,
  // Phase 6: Read Before Create Gate
  validateNewFileCreation,
  // Phase 4: Skill Step Transition Gate
  startSkill,
  startStep,
  completeStep,
  completeSkill,
  getActiveSkillState,
  // Phase 7: Definition Lint Hard Gate
  runDefinitionLint,
  validateWorkflowStart
};
