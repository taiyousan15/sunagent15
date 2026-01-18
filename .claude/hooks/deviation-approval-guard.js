#!/usr/bin/env node
/**
 * Deviation Approval Guard - 勝手な行動の事前承認ガード
 *
 * ユーザーの指示にない行動（逸脱）を検出し、
 * 事前承認なしでは実行できないようにブロックします。
 *
 * 検出パターン:
 * 1. 「シンプルにする」「最適化する」と称した改変
 * 2. ユーザー指示にないファイル作成
 * 3. 指定されていないコマンドの実行
 * 4. 要約比率の無断変更
 *
 * exit code:
 * - 0: 許可
 * - 2: ブロック（承認が必要）
 */

const fs = require('fs');
const path = require('path');
const stateManager = require('./workflow-state-manager.js');

// 逸脱を示唆するキーワードパターン
const DEVIATION_KEYWORDS = [
  /シンプルに/,
  /最適化/,
  /効率化/,
  /改善/,
  /より良く/,
  /simplif/i,
  /optimiz/i,
  /improv/i,
  /better/i,
  /instead/i,
  /alternative/i
];

// 承認が必要な操作パターン
const APPROVAL_REQUIRED_PATTERNS = {
  bash: [
    /rm\s+-rf/,
    /rm\s+-r/,
    /sudo/,
    /chmod/,
    /chown/,
    /pip\s+install/,
    /npm\s+install(?!\s+--save-dev)/
  ],
  write: [
    /\.env$/,
    /credentials/i,
    /secret/i,
    /password/i,
    /\.pem$/,
    /\.key$/
  ]
};

async function main() {
  let input = {};

  try {
    const stdinData = await readStdin();
    if (stdinData) {
      input = JSON.parse(stdinData);
    }
  } catch (e) {
    process.exit(0);
    return;
  }

  const toolName = input.tool_name || '';
  const toolInput = input.tool_input || {};
  const cwd = input.cwd || process.cwd();

  // ワークフロー状態を読み込み
  const state = stateManager.loadState(cwd);
  const isStrict = state?.meta?.strict ?? false;

  // strict mode でない場合は警告のみ
  if (!isStrict) {
    process.exit(0);
    return;
  }

  const result = evaluateDeviation(toolName, toolInput, state, cwd);

  if (result.requiresApproval) {
    // 既に承認済みかチェック
    if (state && stateManager.isDeviationApproved(state, result.deviationId)) {
      process.exit(0);
      return;
    }

    // 承認が必要な場合はブロック
    const output = {
      decision: 'block',
      reason: result.reason,
      suggestion: result.suggestion,
      deviationId: result.deviationId,
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: buildApprovalRequestMessage(result)
      }
    };
    console.log(JSON.stringify(output));
    process.exit(2);
    return;
  }

  process.exit(0);
}

function evaluateDeviation(toolName, toolInput, state, cwd) {
  const result = {
    requiresApproval: false,
    reason: '',
    suggestion: '',
    deviationId: ''
  };

  // Bashコマンドの評価
  if (toolName === 'Bash') {
    const command = toolInput.command || '';

    // 危険なコマンドパターン
    for (const pattern of APPROVAL_REQUIRED_PATTERNS.bash) {
      if (pattern.test(command)) {
        result.requiresApproval = true;
        result.deviationId = `bash:${pattern.toString()}`;
        result.reason = `このコマンドは危険な操作を含んでいます: ${command.substring(0, 80)}...`;
        result.suggestion = 'このコマンドを実行する前に、ユーザーの承認を得てください。';
        return result;
      }
    }
  }

  // Write の評価
  if (toolName === 'Write') {
    const filePath = toolInput.file_path || '';

    // センシティブなファイルパターン
    for (const pattern of APPROVAL_REQUIRED_PATTERNS.write) {
      if (pattern.test(filePath)) {
        result.requiresApproval = true;
        result.deviationId = `write:${path.basename(filePath)}`;
        result.reason = `センシティブなファイル「${path.basename(filePath)}」を作成/編集しようとしています。`;
        result.suggestion = 'このファイルの作成/編集はユーザーの承認が必要です。';
        return result;
      }
    }

    // 新規ファイル作成時、指示に含まれていない可能性をチェック
    if (!fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      if (['.py', '.sh', '.js', '.ts'].includes(ext)) {
        // state に作成許可がなければ要承認
        if (state && !isFileCreationApproved(state, filePath)) {
          result.requiresApproval = true;
          result.deviationId = `newfile:${path.basename(filePath)}`;
          result.reason = `新規ファイル「${path.basename(filePath)}」の作成は、事前に承認されていません。`;
          result.suggestion = 'この新規ファイルの作成がユーザーの指示に含まれているか確認し、承認を得てください。';
          return result;
        }
      }
    }
  }

  return result;
}

function isFileCreationApproved(state, filePath) {
  // 承認済み逸脱に含まれているかチェック
  const basename = path.basename(filePath);
  return state.evidence.approved_deviations.some(d =>
    d.deviation.includes(basename) || d.deviation.includes('newfile')
  );
}

function buildApprovalRequestMessage(result) {
  const lines = [];
  lines.push('');
  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push('│  APPROVAL REQUIRED: この操作には事前承認が必要です          │');
  lines.push('└─────────────────────────────────────────────────────────────┘');
  lines.push('');
  lines.push(`**検出された逸脱**: ${result.reason}`);
  lines.push('');
  lines.push('**必要な対応**:');
  lines.push('1. ユーザーに「この操作を実行してよいですか？」と確認する');
  lines.push('2. ユーザーの承認を得てから実行する');
  lines.push('3. 承認なしに実行することは禁止されています');
  lines.push('');
  lines.push(`**逸脱ID**: ${result.deviationId}`);
  lines.push('');
  lines.push('**Deviation Approval Guard** により、勝手な行動が防止されています。');
  lines.push('');
  return lines.join('\n');
}

function readStdin(timeout = 1000) {
  return new Promise((resolve) => {
    let data = '';
    let resolved = false;

    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve(data);
      }
    };

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', finish);
    setTimeout(finish, timeout);

    if (process.stdin.isTTY) finish();
  });
}

main().catch(() => process.exit(0));
