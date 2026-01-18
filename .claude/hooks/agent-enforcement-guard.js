#!/usr/bin/env node
/**
 * Agent Enforcement Guard - エージェント強制使用ガード
 *
 * 複雑なタスクでTask toolが使用されていない場合、exit code 2でブロックします。
 *
 * 検出する複雑タスクパターン:
 * - 3ファイル以上の編集
 * - バグ修正、機能追加、リファクタリング
 * - API実装、テスト作成
 * - レビュー、セキュリティスキャン
 *
 * 防止する問題:
 * - 80個のエージェントが稼働しない
 * - 専門エージェントの知識が活用されない
 * - 品質ゲートがスキップされる
 */

const fs = require('fs');
const path = require('path');

// エージェント使用を要求する複雑タスクパターン
const COMPLEX_TASK_PATTERNS = [
  // 開発タスク
  /バグ(?:修正|を直|をfix)/gi,
  /機能(?:追加|実装|を作)/gi,
  /リファクタ(?:リング|する)/gi,
  /API(?:を)?(?:実装|作成|開発)/gi,
  /テスト(?:を)?(?:作成|書|追加)/gi,
  /コード(?:レビュー|を確認)/gi,
  /セキュリティ(?:スキャン|チェック|確認)/gi,

  // 英語パターン
  /(?:fix|debug|resolve)\s+(?:bug|issue|error)/gi,
  /(?:add|implement|create)\s+(?:feature|function|api)/gi,
  /refactor/gi,
  /(?:write|create|add)\s+tests?/gi,
  /(?:code\s+)?review/gi,
  /security\s+(?:scan|check|audit)/gi,

  // 設計タスク
  /アーキテクチャ(?:設計|を設計)/gi,
  /(?:DB|データベース)(?:設計|スキーマ)/gi,
  /(?:design|architect)/gi,

  // インフラタスク
  /(?:CI|CD|パイプライン)(?:を)?(?:設定|構築)/gi,
  /(?:Docker|Kubernetes|K8s)/gi,
  /デプロイ(?:設定|自動化)/gi,
];

// 除外パターン（単純タスク）
const SIMPLE_TASK_PATTERNS = [
  /typo/gi,
  /誤字/gi,
  /コメント(?:追加|修正)/gi,
  /README/gi,
  /ログ(?:を)?(?:確認|見)/gi,
  /状態(?:を)?確認/gi,
  /(?:git\s+)?status/gi,
];

// 状態ファイルのパス
const STATE_FILE = '.agent_usage_state.json';

function loadState(cwd) {
  const statePath = path.join(cwd, STATE_FILE);
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return {
    sessionId: Date.now().toString(),
    taskToolUsed: false,
    filesEdited: [],
    complexTaskDetected: false,
    detectedPatterns: [],
    lastUpdated: new Date().toISOString()
  };
}

function saveState(state, cwd) {
  const statePath = path.join(cwd, STATE_FILE);
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function isComplexTask(prompt) {
  // 単純タスクなら除外
  for (const pattern of SIMPLE_TASK_PATTERNS) {
    if (pattern.test(prompt)) {
      return { isComplex: false, patterns: [] };
    }
  }

  // 複雑タスクパターンをチェック
  const matchedPatterns = [];
  for (const pattern of COMPLEX_TASK_PATTERNS) {
    const match = prompt.match(pattern);
    if (match) {
      matchedPatterns.push(match[0]);
    }
  }

  return {
    isComplex: matchedPatterns.length > 0,
    patterns: matchedPatterns
  };
}

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

  const cwd = input.cwd || process.cwd();
  const toolName = input.tool_name || '';
  const toolInput = input.tool_input || {};

  let state = loadState(cwd);

  // Task tool使用を記録
  if (toolName === 'Task') {
    state.taskToolUsed = true;
    state.lastTaskToolAt = new Date().toISOString();
    saveState(state, cwd);
    process.exit(0);
    return;
  }

  // UserPromptSubmit時の複雑タスク検出
  if (input.prompt) {
    const { isComplex, patterns } = isComplexTask(input.prompt);
    if (isComplex) {
      state.complexTaskDetected = true;
      state.detectedPatterns = patterns;
      state.taskToolUsed = false; // リセット
      state.filesEdited = [];
      saveState(state, cwd);

      // 警告メッセージを出力（まだブロックしない）
      console.log('');
      console.log('=== AGENT ENFORCEMENT GUARD ===');
      console.log('');
      console.log('**複雑なタスクが検出されました**');
      console.log('');
      console.log('検出されたパターン:');
      patterns.forEach(p => console.log(`  - ${p}`));
      console.log('');
      console.log('**推奨**: このタスクには専門エージェントを使用してください。');
      console.log('');
      console.log('利用可能なエージェント:');
      console.log('  - bug-fixer: バグ修正');
      console.log('  - feature-builder: 機能追加');
      console.log('  - refactor-specialist: リファクタリング');
      console.log('  - api-developer: API実装');
      console.log('  - test-generator: テスト作成');
      console.log('  - code-reviewer: コードレビュー');
      console.log('  - security-scanner: セキュリティスキャン');
      console.log('');
      console.log('Task toolでエージェントを呼び出さない場合、');
      console.log('3ファイル以上の編集時にブロックされます。');
      console.log('');
      console.log('=== END AGENT ENFORCEMENT GUARD ===');
      console.log('');
    }
    process.exit(0);
    return;
  }

  // Write/Edit時のファイル数チェック
  if ((toolName === 'Write' || toolName === 'Edit') && state.complexTaskDetected) {
    const filePath = toolInput.file_path || toolInput.path || '';

    if (filePath && !state.filesEdited.includes(filePath)) {
      state.filesEdited.push(filePath);
      saveState(state, cwd);
    }

    // 3ファイル以上の編集でTask tool未使用ならブロック
    if (state.filesEdited.length >= 3 && !state.taskToolUsed) {
      console.error('');
      console.error('=== AGENT ENFORCEMENT GUARD: BLOCKED ===');
      console.error('');
      console.error('**ERROR**: 複雑タスクでエージェントが使用されていません。');
      console.error('');
      console.error(`検出されたタスク: ${state.detectedPatterns.join(', ')}`);
      console.error(`編集済みファイル数: ${state.filesEdited.length}`);
      console.error('');
      console.error('**解決方法**:');
      console.error('1. Task toolで適切なエージェントを呼び出してください');
      console.error('2. または、このタスクが単純であることをユーザーに確認してください');
      console.error('');
      console.error('推奨エージェント:');
      console.error('  Task tool → subagent_type: "bug-fixer" | "feature-builder" | "refactor-specialist"');
      console.error('');
      console.error('=== BLOCKED WITH EXIT CODE 2 ===');
      console.error('');

      // ブロック！
      process.exit(2);
      return;
    }
  }

  process.exit(0);
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
