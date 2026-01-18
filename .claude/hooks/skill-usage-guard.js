#!/usr/bin/env node
/**
 * Skill Usage Guard - スキル使用指示の検出と強制
 *
 * UserPromptSubmit 時に実行され、
 * 「〇〇のスキルを使って」という指示を検出してコンテキストに追加します。
 *
 * 防止する問題:
 * - スキル使用の指示を無視する
 * - 手動で同等の処理を実装してしまう
 */

const fs = require('fs');
const path = require('path');

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

  const prompt = input.prompt || '';
  const context = [];

  // スキル使用パターンを検出
  const skillPatterns = [
    /([a-zA-Z0-9_-]+)\s*(?:の)?スキルを使(?:って|用)/gi,
    /(?:use|using)\s+(?:the\s+)?([a-zA-Z0-9_-]+)\s+skill/gi,
    /\/([a-zA-Z0-9_-]+)/g,  // スラッシュコマンド
  ];

  const detectedSkills = [];

  skillPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      detectedSkills.push(match[1]);
    }
  });

  // 「同じワークフロー」パターンを検出
  const sameWorkflowPatterns = [
    /同じ(?:ワークフロー|スクリプト|方法|手順)で/gi,
    /(?:same|identical)\s+(?:workflow|script|method)/gi,
    /前回と同じ/gi,
    /既存の(?:スクリプト|ワークフロー)を/gi,
  ];

  let requiresSameWorkflow = false;
  sameWorkflowPatterns.forEach(pattern => {
    if (pattern.test(prompt)) {
      requiresSameWorkflow = true;
    }
  });

  // コンテキストを追加
  if (detectedSkills.length > 0 || requiresSameWorkflow) {
    context.push('');
    context.push('=== SKILL USAGE GUARD ===');
    context.push('');

    if (detectedSkills.length > 0) {
      context.push('**MANDATORY: ユーザーが指定したスキルを使用してください**');
      context.push('');
      context.push('検出されたスキル:');
      [...new Set(detectedSkills)].forEach(skill => {
        context.push(`  - ${skill}`);
      });
      context.push('');
      context.push('**WARNING**: 上記スキルを呼び出さずに手動実装することは禁止です。');
      context.push('必ず Skill ツールまたは /スキル名 コマンドを使用してください。');
      context.push('');
    }

    if (requiresSameWorkflow) {
      context.push('**CRITICAL: 「同じワークフロー」の指示を検出しました**');
      context.push('');
      context.push('以下の手順を必ず実行してください:');
      context.push('1. 既存のスクリプト/ワークフローファイルを特定する');
      context.push('2. Read ツールでそのファイルの内容を確認する');
      context.push('3. 確認した内容を元に作業を進める');
      context.push('4. 新しいスクリプトを作成する場合は、ユーザーに確認を取る');
      context.push('');
      context.push('**禁止事項**:');
      context.push('- 既存ファイルを確認せずに新しいスクリプトを作成すること');
      context.push('- 「シンプルにする」「最適化する」と称して異なる実装をすること');
      context.push('');
    }

    context.push('=== END SKILL USAGE GUARD ===');
    context.push('');
  }

  if (context.length > 0) {
    console.log(context.join('\n'));
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
