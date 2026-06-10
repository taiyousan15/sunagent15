/**
 * definition-lint-gate lint-all 再帰スキャンのテスト（改善計画 Phase 2-3 / 2-5）
 *
 * - lintAllDefinitions が config/workflows/ 配下（サブディレクトリ含む）の
 *   ワークフローJSONを実際にスキャンすること
 * - 検査件数がハードコードではなく実スキャン結果と一致すること
 * - allowedSkills の未解決名が warning（非ブロッキング）として報告されること
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const scriptPath = path.join(repoRoot, '.claude', 'hooks', 'definition-lint-gate.js');
const { lintAllDefinitions, isLintTarget } = require(scriptPath);

/**
 * config/workflows/ 配下の "_" 始まりでない .json を独立に数える（再帰）
 * 本体 collectLintTargets と同期: "_" 始まりはディレクトリ・ファイルとも除外
 */
function countWorkflowJsons(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countWorkflowJsons(fp);
    else if (entry.isFile() && entry.name.endsWith('.json')) count += 1;
  }
  return count;
}

describe('lintAllDefinitions recursive scan (repo)', () => {
  const results = lintAllDefinitions(repoRoot);
  const workflowsDir = path.join(repoRoot, 'config', 'workflows');

  test('scans every workflow JSON under config/workflows/ including subdirectories', () => {
    // 期待件数は独立した実スキャンから算出（ハードコード禁止）
    const expected = countWorkflowJsons(workflowsDir);
    expect(expected).toBeGreaterThan(0);

    const checkedUnderWorkflows = results.checkedFiles.filter((f) =>
      f.startsWith(workflowsDir + path.sep)
    );
    expect(checkedUnderWorkflows).toHaveLength(expected);

    // examples/ サブディレクトリも含まれる（再帰スキャンの証明）
    expect(
      checkedUnderWorkflows.some((f) => f.includes(path.sep + 'examples' + path.sep))
    ).toBe(true);
  });

  test('workflowFilesChecked counts files detected as workflow definitions', () => {
    expect(results.workflowFilesChecked).toBeGreaterThan(0);
    expect(results.workflowFilesChecked).toBeLessThanOrEqual(results.checkedFiles.length);
  });

  test('repo definitions produce no violations (lint-all green)', () => {
    expect(results.violations).toEqual([]);
    expect(results.valid).toBe(true);
  });
});

describe('isLintTarget (Codex R1 指摘5: main() と lint-all の共通判定)', () => {
  test('matches workflow/policy named files anywhere', () => {
    expect(isLintTarget('/repo/some/dir/my_workflow.yaml')).toBe(true);
    expect(isLintTarget('/repo/some/dir/policy_x.json')).toBe(true);
    expect(isLintTarget('/repo/skill-mapping.json')).toBe(true);
  });

  test('matches any .json under a workflows directory regardless of file name', () => {
    expect(isLintTarget('/repo/config/workflows/content_creation_v1.json')).toBe(true);
    expect(isLintTarget('/repo/config/workflows/examples/priority_based_v1.json')).toBe(true);
  });

  test('does not match unrelated json or underscore-prefixed files', () => {
    expect(isLintTarget('/repo/package.json')).toBe(false);
    expect(isLintTarget('/repo/config/workflows/_schema.json')).toBe(false);
    expect(isLintTarget('/repo/config/workflows/readme.md')).toBe(false);
  });
});

describe('PostToolUse main() lints workflows-dir json (Codex R1 指摘5)', () => {
  const TEMP_BASE = path.join(os.tmpdir(), 'taisun-lint-main-test-' + process.pid);
  const wfDir = path.join(TEMP_BASE, 'config', 'workflows');

  beforeAll(() => {
    fs.mkdirSync(wfDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(TEMP_BASE, { recursive: true, force: true });
  });

  function runHook(filePath) {
    return spawnSync(process.execPath, [scriptPath], {
      encoding: 'utf8',
      input: JSON.stringify({
        tool_name: 'Write',
        tool_input: { file_path: filePath },
      }),
      cwd: TEMP_BASE,
    });
  }

  test('invalid workflow json in workflows dir yields advisory output', () => {
    // "name" を欠落させた定義（ファイル名に "workflow" を含まない）
    const target = path.join(wfDir, 'broken_v1.json');
    fs.writeFileSync(
      target,
      JSON.stringify({ id: 'broken_v1', phases: [{ id: 'p1', name: 'P1' }] }),
      'utf8'
    );

    const run = runHook(target);
    expect(run.status).toBe(0); // 非ブロッキング
    expect(run.stdout).toContain('[Lint Gate]');
    expect(run.stdout).toContain('broken_v1.json');
  });

  test('unrelated json outside workflows dir is ignored', () => {
    const target = path.join(TEMP_BASE, 'data.json');
    fs.writeFileSync(target, JSON.stringify({ foo: 1 }), 'utf8');

    const run = runHook(target);
    expect(run.status).toBe(0);
    expect(run.stdout).toBe('');
  });
});

describe('lintAllDefinitions allowedSkills validation (fixture)', () => {
  const TEMP_BASE = path.join(os.tmpdir(), 'taisun-lint-test-' + process.pid);

  beforeAll(() => {
    const wfDir = path.join(TEMP_BASE, 'config', 'workflows', 'nested');
    fs.mkdirSync(wfDir, { recursive: true });
    fs.writeFileSync(
      path.join(wfDir, 'fixture_v1.json'),
      JSON.stringify({
        id: 'fixture_v1',
        name: 'Fixture',
        version: '1.0.0',
        description: 'lint fixture',
        phases: [
          {
            id: 'phase_1',
            name: 'P1',
            allowedSkills: ['definitely-not-a-real-skill-xyz'],
            nextPhase: null,
          },
        ],
      }),
      'utf8'
    );

    // Codex R1 指摘4: "_" 始まりディレクトリはスキャン対象外であることの fixture
    const draftsDir = path.join(TEMP_BASE, 'config', 'workflows', '_drafts');
    fs.mkdirSync(draftsDir, { recursive: true });
    fs.writeFileSync(
      path.join(draftsDir, 'draft_v1.json'),
      JSON.stringify({ id: 'draft_v1', phases: [] }),
      'utf8'
    );
  });

  afterAll(() => {
    fs.rmSync(TEMP_BASE, { recursive: true, force: true });
  });

  test('unknown allowedSkills entry yields a warning but stays valid (non-blocking)', () => {
    const results = lintAllDefinitions(TEMP_BASE);

    expect(results.workflowFilesChecked).toBe(1);
    expect(results.valid).toBe(true); // warning はブロックしない

    const allWarnings = results.warnings.flatMap((w) => w.issues);
    expect(
      allWarnings.some(
        (w) => w.type === 'unknown_skill' && w.message.includes('definitely-not-a-real-skill-xyz')
      )
    ).toBe(true);
  });

  test('underscore-prefixed directories are skipped entirely (Codex R1 指摘4)', () => {
    const results = lintAllDefinitions(TEMP_BASE);

    // _drafts/draft_v1.json が存在するが、件数にもファイル一覧にも含まれない
    expect(results.workflowFilesChecked).toBe(1);
    expect(results.checkedFiles).toHaveLength(1);
    expect(
      results.checkedFiles.some((f) => f.includes(path.sep + '_drafts' + path.sep))
    ).toBe(false);
  });

  test('CLI lint-all exits 0 and reports scan-derived counts', () => {
    const run = spawnSync(process.execPath, [scriptPath, 'lint-all', TEMP_BASE], {
      encoding: 'utf8',
    });
    expect(run.status).toBe(0);
    const parsed = JSON.parse(run.stdout);
    expect(parsed.workflowFilesChecked).toBe(1);
    expect(parsed.checkedFiles).toHaveLength(1);
  });
});
