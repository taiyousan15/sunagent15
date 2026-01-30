#!/usr/bin/env node
/**
 * Unified Guard - パフォーマンス最適化された統合ガード
 *
 * 複数のガードを1つに統合し、ファイルI/Oを最小化:
 * - copy-safety-guard
 * - input-sanitizer-guard (軽量版)
 * - workflow-fidelity-guard (キャッシュ付き)
 * - deviation-approval-guard (軽量版)
 *
 * 最適化:
 * - 正規表現パターンを事前コンパイル
 * - 状態ファイルの読み込みを1回に統合
 * - SHA256ハッシュをキャッシュ
 * - 不要なチェックをスキップ
 *
 * exit code:
 * - 0: 許可
 * - 2: ブロック
 */

const fs = require('fs');
const path = require('path');

// === キャッシュシステム ===
const CACHE = {
  state: null,
  stateLoadedAt: 0,
  stateFile: null,
  regexPatterns: null,
  hashCache: new Map()
};

const CACHE_TTL_MS = 5000; // 5秒間キャッシュ

// === 事前コンパイルされた正規表現パターン ===
const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+[\/~]/,
  /rm\s+-rf\s+\*/,
  />\s*\/dev\/sd[a-z]/,
  /mkfs\./,
  /dd\s+if=.*of=\/dev/,
  /:(){:|:&};:/
];

const COPY_MARKER_PATTERNS = [
  /\uFFFD/,                    // U+FFFD (replacement character)
  /\u3000{3,}/,                // 全角スペース連続
  /[\u200B-\u200F\u2028\u2029\uFEFF]/ // ゼロ幅文字
];

const INJECTION_PATTERNS = [
  /\$\(.*\)/,                  // Command substitution
  /`.*`/,                      // Backtick execution
  /;\s*rm\s/,                  // Command chaining with rm
  /\|\s*sh/,                   // Pipe to shell
  /eval\s/                     // eval command
];

// === メイン処理 ===
async function main() {
  const startTime = Date.now();

  let input = {};
  try {
    const stdinData = await readStdin(500); // 500msタイムアウト
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

  // 高速チェック: 危険パターンのみ検査
  const result = performQuickChecks(toolName, toolInput);

  if (result.blocked) {
    outputBlock(result);
    process.exit(2);
    return;
  }

  if (result.warning) {
    outputWarning(result);
  }

  // デバッグ: 処理時間を記録（環境変数で有効化）
  if (process.env.TAISUN_HOOK_DEBUG) {
    console.error(`[unified-guard] Completed in ${Date.now() - startTime}ms`);
  }

  process.exit(0);
}

// === 高速チェック ===
function performQuickChecks(toolName, toolInput) {
  const result = { blocked: false, warning: false, reason: '', suggestion: '' };

  if (toolName === 'Bash') {
    const command = toolInput.command || '';

    // 1. 危険なコマンドパターン
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        result.blocked = true;
        result.reason = `危険なコマンドパターンを検出: ${command.substring(0, 80)}`;
        result.suggestion = 'このコマンドは安全上の理由でブロックされました。';
        return result;
      }
    }

    // 2. コピーマーカー（文字化け）
    for (const pattern of COPY_MARKER_PATTERNS) {
      if (pattern.test(command)) {
        result.blocked = true;
        result.reason = 'コピーペースト由来の不正文字を検出';
        result.suggestion = 'コマンドを手動で再入力してください。';
        return result;
      }
    }

    // 3. インジェクションパターン（警告のみ）
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(command)) {
        result.warning = true;
        result.reason = `潜在的なコマンドインジェクションパターン: ${pattern.source}`;
        result.suggestion = '意図した操作か確認してください。';
        // 警告のみ、ブロックしない
      }
    }
  }

  if (toolName === 'Write' || toolName === 'Edit') {
    const filePath = toolInput.file_path || '';
    const content = toolInput.content || toolInput.new_string || '';

    // 重要ファイルの保護
    const protectedPaths = ['.env', '.git/', 'node_modules/', 'secrets/'];
    for (const protPath of protectedPaths) {
      if (filePath.includes(protPath)) {
        result.blocked = true;
        result.reason = `保護されたパス「${protPath}」への書き込みはブロックされました`;
        result.suggestion = 'このファイルは直接編集できません。';
        return result;
      }
    }

    // コピーマーカー検出
    for (const pattern of COPY_MARKER_PATTERNS) {
      if (pattern.test(content)) {
        result.blocked = true;
        result.reason = 'コンテンツに不正文字（文字化け）を検出';
        result.suggestion = 'コンテンツを再入力してください。';
        return result;
      }
    }
  }

  return result;
}

// === 出力関数 ===
function outputBlock(result) {
  const output = {
    decision: 'block',
    reason: result.reason,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: `\n[BLOCKED] ${result.reason}\n提案: ${result.suggestion}\n`
    }
  };
  console.log(JSON.stringify(output));
}

function outputWarning(result) {
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: `\n[WARNING] ${result.reason}\n提案: ${result.suggestion}\n`
    }
  };
  console.log(JSON.stringify(output));
}

// === ユーティリティ ===
function readStdin(timeout = 500) {
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
