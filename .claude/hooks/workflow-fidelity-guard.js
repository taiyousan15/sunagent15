#!/usr/bin/env node
/**
 * Workflow Fidelity Guard - ワークフロー忠実性の強制ガード
 *
 * PreToolUse / PostToolUse で実行され、以下を物理的にブロック:
 * 1. ベースラインファイルの改変
 * 2. 未読ファイルの編集（Read-before-Write）
 * 3. フェーズ外の危険なコマンド実行
 * 4. 新規スクリプトの勝手な作成
 *
 * exit code:
 * - 0: 許可
 * - 2: ブロック（実行不能）
 */

const fs = require('fs');
const path = require('path');
const stateManager = require('./workflow-state-manager.js');

// ベースラインとして保護するファイルパターン
const BASELINE_PATTERNS = [
  /create_video\.py$/,
  /generate_video\.py$/,
  /main\.py$/,
  /run\.sh$/,
  /process\.py$/
];

// 危険なBashコマンドパターン（strict時にstateなしでブロック）
const DANGEROUS_BASH_PATTERNS = [
  /ffmpeg/,
  /python.*create_video\.py/,
  /python.*generate_video\.py/,
  /rm\s+-rf/,
  /rm\s+-r/
];

// 新規スクリプト作成パターン（ブロック対象）
const NEW_SCRIPT_PATTERNS = [
  /\.py$/,
  /\.sh$/,
  /\.js$/,
  /\.ts$/
];

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
  const hookEvent = input.hook_event || 'PreToolUse';
  const cwd = input.cwd || process.cwd();

  // ワークフロー状態を読み込み
  const state = stateManager.loadState(cwd);
  const isStrict = state?.meta?.strict ?? false;

  // PostToolUse: Read履歴を記録
  if (hookEvent === 'PostToolUse' && toolName === 'Read') {
    if (state) {
      const filePath = toolInput.file_path || '';
      stateManager.addReadLog(state, filePath, process.env.SESSION_ID);

      // ベースラインファイルなら自動登録
      if (isBaselineFile(filePath)) {
        stateManager.registerBaseline(state, filePath);
      }

      stateManager.saveState(state, cwd);
    }
    process.exit(0);
    return;
  }

  // PreToolUse: ブロック判定
  if (hookEvent === 'PreToolUse') {
    const result = evaluatePreToolUse(toolName, toolInput, state, isStrict, cwd);

    if (result.blocked) {
      // ブロック時は理由を出力してexit 2
      const output = {
        decision: 'block',
        reason: result.reason,
        suggestion: result.suggestion,
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: buildBlockMessage(result)
        }
      };
      console.log(JSON.stringify(output));
      process.exit(2);
      return;
    }

    // 警告のみ（ブロックしない）
    if (result.warning) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: buildWarningMessage(result)
        }
      };
      console.log(JSON.stringify(output));
    }
  }

  process.exit(0);
}

function evaluatePreToolUse(toolName, toolInput, state, isStrict, cwd) {
  const result = {
    blocked: false,
    warning: false,
    reason: '',
    suggestion: ''
  };

  // Bashコマンドの評価
  if (toolName === 'Bash') {
    const command = toolInput.command || '';

    // 危険なコマンドのチェック
    for (const pattern of DANGEROUS_BASH_PATTERNS) {
      if (pattern.test(command)) {
        if (!state) {
          result.blocked = isStrict;
          result.warning = !isStrict;
          result.reason = `危険なコマンド「${command.substring(0, 50)}...」を実行しようとしていますが、ワークフロー状態が存在しません。`;
          result.suggestion = 'まず `npm run workflow:start -- <workflow_id> --strict` を実行してワークフローを開始してください。';
          return result;
        }
      }
    }
  }

  // Write/Edit の評価
  if (toolName === 'Write' || toolName === 'Edit') {
    const filePath = toolInput.file_path || '';
    const basename = path.basename(filePath);

    // 1. ベースラインファイルの改変チェック
    if (state && isBaselineFile(filePath)) {
      const integrity = stateManager.checkBaselineIntegrity(state, filePath);
      if (!integrity.valid && integrity.reason === 'hash_mismatch') {
        result.blocked = true;
        result.reason = `ベースラインファイル「${basename}」は保護されています。内容を変更することはできません。`;
        result.suggestion = '既存のベースラインファイルをそのまま使用してください。変更が必要な場合は、ユーザーの明示的な承認を得てください。';
        return result;
      }
    }

    // 2. Read-before-Write チェック
    if (state && isStrict) {
      // 既存ファイルの場合のみチェック
      if (fs.existsSync(filePath)) {
        if (!stateManager.hasBeenRead(state, filePath)) {
          result.blocked = true;
          result.reason = `ファイル「${basename}」を編集しようとしていますが、まだ読み込んでいません。`;
          result.suggestion = `まず Read ツールで「${filePath}」を読み込んでから編集してください。`;
          return result;
        }
      }
    }

    // 3. 新規スクリプト作成のチェック
    if (toolName === 'Write' && !fs.existsSync(filePath)) {
      if (NEW_SCRIPT_PATTERNS.some(p => p.test(filePath))) {
        // ベースラインファイルと同名の新規作成は特に危険
        if (state && state.baseline.files[basename]) {
          result.blocked = true;
          result.reason = `ベースラインとして登録済みの「${basename}」と同名の新規ファイルを作成しようとしています。`;
          result.suggestion = `既存のベースラインファイル「${state.baseline.files[basename].path}」を使用してください。`;
          return result;
        }

        // strict時は新規スクリプト作成をブロック
        if (isStrict) {
          result.blocked = true;
          result.reason = `新規スクリプト「${basename}」の作成は、strict mode では禁止されています。`;
          result.suggestion = '既存のスクリプトを使用するか、ユーザーの明示的な承認を得てください。';
          return result;
        } else {
          result.warning = true;
          result.reason = `新規スクリプト「${basename}」を作成しようとしています。`;
          result.suggestion = '既存のスクリプトがないか確認してください。';
        }
      }
    }
  }

  return result;
}

function isBaselineFile(filePath) {
  return BASELINE_PATTERNS.some(p => p.test(filePath));
}

function buildBlockMessage(result) {
  const lines = [];
  lines.push('');
  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push('│  BLOCKED: この操作は実行できません                          │');
  lines.push('└─────────────────────────────────────────────────────────────┘');
  lines.push('');
  lines.push(`**理由**: ${result.reason}`);
  lines.push('');
  lines.push(`**対処方法**: ${result.suggestion}`);
  lines.push('');
  lines.push('**Workflow Fidelity Guard** により、ワークフローの忠実性が保護されています。');
  lines.push('');
  return lines.join('\n');
}

function buildWarningMessage(result) {
  const lines = [];
  lines.push('');
  lines.push('=== WORKFLOW FIDELITY WARNING ===');
  lines.push('');
  lines.push(`**警告**: ${result.reason}`);
  lines.push(`**推奨**: ${result.suggestion}`);
  lines.push('');
  lines.push('=== END WARNING ===');
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
