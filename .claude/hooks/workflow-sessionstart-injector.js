#!/usr/bin/env node
/**
 * Workflow SessionStart Injector - セッション開始時の状態注入
 *
 * SessionStart 時に実行され、.workflow_state.json の内容を
 * コンテキストとして注入します。
 *
 * これにより、セッション再開時のフェーズ誤認を防止します。
 */

const fs = require('fs');
const path = require('path');
const stateManager = require('./workflow-state-manager.js');
const { readStdin } = require('./utils/read-stdin');

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
  const context = [];

  // ワークフロー状態を読み込み（欠損時は自動初期化）
  let state = stateManager.loadState(cwd);

  if (!state) {
    // .workflow_state.json が存在しない場合、デフォルト状態を自動作成
    state = stateManager.createInitialState('user_request', true);
    const saved = stateManager.saveState(state, cwd);
    if (saved) {
      context.push('=== WORKFLOW STATE AUTO-INITIALIZED ===');
      context.push('');
      context.push('.workflow_state.json が見つからなかったため、デフォルト状態で自動作成しました。');
      context.push('');
    }
  }

  if (state) {
    // 状態要約を生成
    const summary = stateManager.generateStateSummary(state);
    if (summary) {
      context.push(summary);
    }
  }

  // Desktop以下のプロジェクトも検索
  const desktopStates = findDesktopWorkflowStates();
  if (desktopStates.length > 0) {
    context.push('');
    context.push('=== OTHER ACTIVE WORKFLOWS ===');
    context.push('');
    desktopStates.forEach(ws => {
      context.push(`- ${ws.path}: ${ws.workflowId} (Phase ${ws.phase})`);
    });
    context.push('');
  }

  // SESSION_HANDOFF.md も探して注入
  const handoffs = findSessionHandoffs(cwd);
  if (handoffs.length > 0) {
    context.push('');
    context.push('=== SESSION HANDOFF FILES FOUND ===');
    context.push('');
    context.push('以下のハンドオフファイルを確認してください:');
    handoffs.forEach(h => {
      context.push(`- ${h}`);
    });
    context.push('');
  }

  // mistakes.md の存在確認
  const mistakesPath = path.join(__dirname, 'mistakes.md');
  if (fs.existsSync(mistakesPath)) {
    context.push('');
    context.push('=== MISTAKES LOG EXISTS ===');
    context.push('');
    context.push('過去のミスが記録されています。作業開始前に確認してください:');
    context.push(`- ${mistakesPath}`);
    context.push('');
  }

  // ─────────────────────────────────────────
  // CHECKPOINT: 動的質問生成（5問）
  // mistakes.md + SESSION_HANDOFF.md から質問を生成し、
  // Claudeが本当にファイルを読んだか検証する
  // ─────────────────────────────────────────
  const checkpoint = generateCheckpointQuestions(cwd);
  if (checkpoint.length > 0) {
    context.push('');
    context.push('=== BOOT CHECKPOINT（必須・スキップ禁止） ===');
    context.push('');
    context.push('作業開始前に以下の5問に回答せよ。回答できない場合は該当ファイルをReadせよ。');
    context.push('回答は内部処理のみ（ユーザーに表示不要）。全問回答後に作業開始。');
    context.push('');
    checkpoint.forEach((q, i) => {
      context.push(`Q${i + 1}. ${q}`);
    });
    context.push('');
  }

  // コンテキストを出力
  if (context.length > 0) {
    console.log(context.join('\n'));
  }

  process.exit(0);
}

function findDesktopWorkflowStates() {
  const states = [];
  try {
    const desktop = path.join(process.env.HOME, 'Desktop');
    if (fs.existsSync(desktop)) {
      const entries = fs.readdirSync(desktop, { withFileTypes: true });

      entries.forEach(entry => {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const statePath = path.join(desktop, entry.name, '.workflow_state.json');
          if (fs.existsSync(statePath)) {
            try {
              const content = fs.readFileSync(statePath, 'utf8');
              const state = JSON.parse(content);
              states.push({
                path: path.join(desktop, entry.name),
                workflowId: state.meta?.workflowId || 'unknown',
                phase: state.meta?.currentPhase || 1
              });
            } catch (e) {}
          }
        }
      });
    }
  } catch (e) {}
  return states.slice(0, 5);
}

function findSessionHandoffs(cwd) {
  const handoffs = [];

  try {
    // カレントディレクトリ
    const cwdHandoff = path.join(cwd, 'SESSION_HANDOFF.md');
    if (fs.existsSync(cwdHandoff)) {
      handoffs.push(cwdHandoff);
    }

    // Desktop以下を検索
    const desktop = path.join(process.env.HOME, 'Desktop');
    if (fs.existsSync(desktop)) {
      const entries = fs.readdirSync(desktop, { withFileTypes: true });

      entries.forEach(entry => {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const handoffPath = path.join(desktop, entry.name, 'SESSION_HANDOFF.md');
          if (fs.existsSync(handoffPath)) {
            handoffs.push(handoffPath);
          }
        }
      });
    }
  } catch (e) {}

  return [...new Set(handoffs)].slice(0, 5);
}

/**
 * BOOT CHECKPOINT — 動的質問生成
 *
 * mistakes.md / SESSION_HANDOFF.md / workflow_state.json から
 * 5つの質問を動的に生成する。Claudeが本当にファイルを読んだか検証する仕組み。
 * ファイル内容が変わるたびに質問も変わるので丸暗記はできない。
 */
function generateCheckpointQuestions(cwd) {
  const questions = [];

  try {
    // Q1: mistakes.md から最新のミスを質問
    const mistakesPath = path.join(__dirname, 'mistakes.md');
    if (fs.existsSync(mistakesPath)) {
      const content = fs.readFileSync(mistakesPath, 'utf8');
      const patterns = content.match(/### Pattern \d+: (.+)/g);
      if (patterns && patterns.length > 0) {
        const count = patterns.length;
        const lastPattern = patterns[patterns.length - 1].replace(/### Pattern \d+: /, '');
        questions.push(
          `mistakes.md には何個のPatternが記録されている？ また最後のPatternの名前は？（Read .claude/hooks/mistakes.md で確認）`
        );
      }
    }

    // Q2: SESSION_HANDOFF.md から現在の状態を質問
    const handoffPath = path.join(cwd, 'SESSION_HANDOFF.md');
    if (fs.existsSync(handoffPath)) {
      const content = fs.readFileSync(handoffPath, 'utf8');
      const dateMatch = content.match(/\d{4}-\d{2}-\d{2}/);
      questions.push(
        `SESSION_HANDOFF.md の最終更新日は？（Read SESSION_HANDOFF.md で確認）`
      );
    } else {
      questions.push(
        `SESSION_HANDOFF.md は存在するか？ 存在しない場合は「なし」と回答`
      );
    }

    // Q3: workflow_state.json から現在フェーズを質問
    const statePath = path.join(cwd, '.workflow_state.json');
    if (fs.existsSync(statePath)) {
      try {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        const mode = state.meta?.mode || 'unknown';
        questions.push(
          `現在のワークフローモードは何か？（STRICT / NORMAL / GUIDED のいずれか）`
        );
      } catch (e) {
        questions.push('workflow_state.json は正常に読めるか？');
      }
    }

    // Q4: ユーザー指示のスキル検出（常に質問）
    questions.push(
      `ユーザーの指示にスキル名（/xxx）やトリガーワード（「リサーチして」「調べて」等）が含まれているか？ → YES/NO。YESならSkill tool必須。`
    );

    // Q5: 未読ファイル編集禁止の確認（常に質問）
    questions.push(
      `これから編集するファイルを事前にReadしたか？ 未読ファイルへのEdit/Writeは禁止。→ 確認済/未確認`
    );

  } catch (e) {
    // エラー時は最低限の質問のみ
    questions.push('mistakes.md を確認したか？ → YES/NO');
    questions.push('未読ファイルの編集禁止ルールを認識しているか？ → YES/NO');
  }

  return questions.slice(0, 5);
}

main().catch(() => process.exit(0));
