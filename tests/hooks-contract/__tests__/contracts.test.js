'use strict';
/**
 * contracts — 出荷対象9 hookの契約テスト（contracts/<hookId>.json を規範として実行）
 *
 * 設計原則（ADR-009 / Codex Pivot 条件1）:
 *  - テスト対象 = 出荷対象（Class A/B 9登録）と完全一致
 *  - deny 期待は deny 契約を持つ hook（unified-guard）のみ
 *  - 契約JSONは宣言データのみ（正規表現文字列・期待exit・許可書込み）。
 *    動的コードは一切含まず、判定ロジックは本ファイル（レビュー済み静的コード）に限る
 */

const fs = require('fs');
const path = require('path');
const { withSandbox, snapshotSandbox, diffSnapshots } = require('../sandbox');
const { spawnHookInSandbox } = require('../spawn-hook');

const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');

// ===== setup registry（caseId 非依存・契約JSONの setup フィールドで指定） =====
const SETUPS = {
  'seed-workflow-state': (sb) => {
    fs.writeFileSync(path.join(sb.projectDir, '.workflow_state.json'), JSON.stringify({ workflow: 'test', phase: 1 }));
  },
  'seed-handoff-file': (sb) => {
    fs.writeFileSync(path.join(sb.projectDir, 'SESSION_HANDOFF.md'), '# SESSION HANDOFF DOCUMENT\n\nseed\n');
  },
  'seed-compact-state-at-threshold': (sb) => {
    const stateDir = path.join(sb.projectDir, '.claude', 'temp');
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(path.join(stateDir, 'compact-optimizer-state.json'), JSON.stringify({
      sessionStart: Date.now(),
      toolCallCount: 24, // hook 内で ++ されて閾値25に到達
      lastCompactSuggestion: 0,
      compactCount: 0,
      suggestedAt: [],
    }));
  },
  'write-invalid-workflow-json': (sb) => {
    const dir = path.join(sb.projectDir, 'config', 'workflows');
    fs.mkdirSync(dir, { recursive: true });
    // name はあるが必須 "phases" が無い → CRITICAL 1件
    fs.writeFileSync(path.join(dir, 'test_workflow.json'), JSON.stringify({ name: 'broken', version: '1', description: 'd' }));
  },
  'write-valid-workflow-json': (sb) => {
    const dir = path.join(sb.projectDir, 'config', 'workflows');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'ok_workflow.json'), JSON.stringify({
      name: 'ok', version: '1', description: 'd', phases: [{ name: 'p1', steps: ['s1'] }],
    }));
  },
};

// ===== ユーティリティ =====

/** envelope 内の "${projectDir}" 等のプレースホルダを sandbox 実パスへ置換 */
function materialize(value, sb) {
  if (typeof value === 'string') {
    if (value === '${repeat2500}') return 'A'.repeat(2500);
    return value
      .replace(/\$\{projectDir\}/g, sb.projectDir)
      .replace(/\$\{stateDir\}/g, sb.stateDir)
      .replace(/\$\{pluginRoot\}/g, sb.pluginRoot);
  }
  if (Array.isArray(value)) return value.map((v) => materialize(v, sb));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = materialize(v, sb);
    return out;
  }
  return value;
}

/** "area:rel/path/*.json" 形式の期待globが actual（同形式）に一致するか */
function globToRegex(glob) {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^]*');
  return new RegExp(`^${esc}$`);
}

/** 期待リスト（glob可）と実リストの完全一致（双方向・件数一致）を検証 */
function assertWriteList(label, expectedGlobs, actual) {
  expect({ [label]: actual.length }).toEqual({ [label]: expectedGlobs.length });
  const remaining = [...actual];
  for (const g of expectedGlobs) {
    const re = globToRegex(g);
    const idx = remaining.findIndex((a) => re.test(a));
    if (idx === -1) {
      throw new Error(`${label}: expected pattern not matched: ${g}\nactual: ${JSON.stringify(actual)}`);
    }
    remaining.splice(idx, 1);
  }
  expect(remaining).toEqual([]);
}

function loadContracts() {
  return fs.readdirSync(CONTRACTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, f), 'utf8')));
}

// ===== 契約実行 =====

for (const contract of loadContracts()) {
  describe(contract.hookId, () => {
    for (const c of contract.cases) {
      test(c.caseId, async () => {
        await withSandbox(async (sb) => {
          if (c.setup) {
            const setup = SETUPS[c.setup];
            if (!setup) throw new Error(`unknown setup: ${c.setup}`);
            setup(sb);
          }

          const envelope = c.envelopeRaw !== undefined
            ? c.envelopeRaw
            : materialize(c.envelope, sb);

          const before = snapshotSandbox(sb);
          const r = await spawnHookInSandbox(sb, contract.hookId, envelope, {});
          const diff = diffSnapshots(before, snapshotSandbox(sb));

          const exp = c.expect;
          expect(r.timedOut).toBe(false);
          expect(r.exitCode).toBe(exp.exitCode);

          if (exp.stdoutEmpty) expect(r.stdout.trim()).toBe('');
          for (const p of exp.stdoutMatches || []) {
            expect(r.stdout).toMatch(new RegExp(p));
          }
          if (exp.stderrEmpty) expect(r.stderr.trim()).toBe('');
          for (const p of exp.stderrMatches || []) {
            expect(r.stderr).toMatch(new RegExp(p));
          }

          if (exp.noWrites) {
            expect(diff).toEqual({ created: [], modified: [], deleted: [] });
          } else {
            assertWriteList('created', exp.createdExactly || [], diff.created);
            assertWriteList('modified', exp.modifiedExactly || [], diff.modified);
            expect(diff.deleted).toEqual(exp.deletedExactly || []);
          }
        });
      }, 20000);
    }
  });
}
