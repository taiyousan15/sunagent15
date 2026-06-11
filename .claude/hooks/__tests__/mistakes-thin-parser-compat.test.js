/**
 * mistakes.md 薄型化（Phase 3-1）のパーサ/ライター互換テスト
 *
 * 薄型化後の mistakes.md（### Pattern N: 見出し + ✅ 正解: 1行）が
 * 既存の読み書き hook と互換であることを固定する:
 *   - mistake-pattern-matcher.js: extractPatterns / findSimilarPatterns
 *   - workflow-sessionstart-injector.js: BOOT CHECKPOINT Q1 の生成 regex
 *   - violation-recorder.js: 既存内容を破棄せず追記する（全消去バグの回帰防止）
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOKS_DIR = path.join(__dirname, '..');
const MISTAKES_PATH = path.join(HOOKS_DIR, '..', 'rules', 'mistakes.md');

const {
  extractPatterns,
  findSimilarPatterns,
} = require('../mistake-pattern-matcher.js');

describe('mistake-pattern-matcher: 薄型化後の実ファイル互換', () => {
  // 件数は >= で固定する（台帳は「失敗が起きたら必ず追記」されるため、
  // Pattern 16 以降の追加で CI が割れる件数依存を作らない）
  test('extractPatterns が 15 パターン以上を抽出する', () => {
    const patterns = extractPatterns().filter(p => typeof p.id === 'number');
    expect(patterns.length).toBeGreaterThanOrEqual(15);
  });

  test('全パターンに非空の title がある', () => {
    const patterns = extractPatterns().filter(p => typeof p.id === 'number');
    for (const p of patterns) {
      expect(p.title.length).toBeGreaterThan(0);
    }
  });

  test('全パターンで ✅ 正解 行が right として抽出される', () => {
    const patterns = extractPatterns().filter(p => typeof p.id === 'number');
    for (const p of patterns) {
      expect(p.right.length).toBeGreaterThan(0);
    }
  });

  test('findSimilarPatterns が類似アクションにマッチする（スモーク）', () => {
    const action =
      'ユーザーにスキル指示されたのに手動でコードを書く スキル指示の無視';
    const matches = findSimilarPatterns(action, 0.05);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].pattern.title).toContain('スキル');
  });

  test('実運用しきい値 0.25 で代表プローブが正しいパターンにマッチする', () => {
    // hook 本番パスは findSimilarPatterns(action, 0.25)（mistake-pattern-matcher.js の check()）。
    // 薄型化後も詳細版コーパスで recall が維持されることを live threshold で固定する
    const action =
      '同じワークフローで動画2を作成するために新しいスクリプトを作成する';
    const matches = findSimilarPatterns(action, 0.25);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].pattern.id).toBe(2);
  });

  test('検索コーパスは詳細版（mistakes-extended.md）を使う: 全パターンで ❌ 行が抽出される', () => {
    // 薄型版 mistakes.md には ❌ 行がない（wrong は空になる）ため、
    // wrong が全件非空であることは詳細版コーパスが選択されている証拠
    const patterns = extractPatterns().filter(p => typeof p.id === 'number');
    expect(patterns.length).toBeGreaterThanOrEqual(15);
    for (const p of patterns) {
      expect(p.wrong.length).toBeGreaterThan(0);
    }
  });
});

describe('workflow-sessionstart-injector: BOOT CHECKPOINT Q1 互換', () => {
  test('Q1 生成 regex（### Pattern \\d+: ）が 15 件以上マッチする', () => {
    const content = fs.readFileSync(MISTAKES_PATH, 'utf8');
    const matches = content.match(/### Pattern \d+: (.+)/g);
    expect(matches).not.toBeNull();
    expect(matches.length).toBeGreaterThanOrEqual(15);
  });

  test('Q1 の解答対象（✅ 正解: 行）が全パターンに存在する', () => {
    const content = fs.readFileSync(MISTAKES_PATH, 'utf8');
    const blocks = content.split(/### Pattern \d+:/).slice(1);
    expect(blocks.length).toBeGreaterThanOrEqual(15);
    for (const block of blocks) {
      expect(block).toMatch(/✅ 正解: .+/);
    }
  });

  test('詳細版への明示リンクが本文にある（Pattern 13 準拠）', () => {
    const content = fs.readFileSync(MISTAKES_PATH, 'utf8');
    expect(content).toContain('.claude/references/mistakes-extended.md');
  });
});

describe('violation-recorder: 追記が既存内容を破棄しない', () => {
  const recorderPath = path.join(HOOKS_DIR, 'violation-recorder.js');
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'violation-recorder-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function runRecorder(targetPath, args) {
    return spawnSync(process.execPath, [recorderPath, ...args], {
      encoding: 'utf8',
      env: { ...process.env, VIOLATION_RECORDER_TARGET: targetPath },
    });
  }

  test('既存の台帳（# Mistakes Ledger ヘッダー）に追記し、パターンを保持する', () => {
    const target = path.join(tmpDir, 'mistakes.md');
    const existing =
      '# Mistakes Ledger（ミス台帳）\n\n### Pattern 1: テスト用パターン\n✅ 正解: テスト\n';
    fs.writeFileSync(target, existing, 'utf8');

    const result = runRecorder(target, ['テスト違反', 'test.js', '再発防止策']);
    expect(result.status).toBe(0);

    const after = fs.readFileSync(target, 'utf8');
    expect(after).toContain('### Pattern 1: テスト用パターン');
    expect(after).toContain('**違反**: テスト違反');
  });

  test('旧バグ回帰: ヘッダー文字列がない既存内容も破棄されない', () => {
    const target = path.join(tmpDir, 'mistakes.md');
    fs.writeFileSync(target, '任意の既存メモ\n', 'utf8');

    const result = runRecorder(target, ['違反X']);
    expect(result.status).toBe(0);

    const after = fs.readFileSync(target, 'utf8');
    expect(after).toContain('任意の既存メモ');
    expect(after).toContain('**違反**: 違反X');
  });

  test('空ファイルにはヘッダーを初期化してから追記する', () => {
    const target = path.join(tmpDir, 'mistakes.md');
    fs.writeFileSync(target, '', 'utf8');

    const result = runRecorder(target, ['違反Y']);
    expect(result.status).toBe(0);

    const after = fs.readFileSync(target, 'utf8');
    expect(after).toContain('# Mistakes Ledger（ミス台帳）');
    expect(after).toContain('**違反**: 違反Y');
  });

  test('引数なしは何もせず exit 0（fail-open）', () => {
    const target = path.join(tmpDir, 'mistakes.md');
    const result = runRecorder(target, []);
    expect(result.status).toBe(0);
    expect(fs.existsSync(target)).toBe(false);
  });

  function runConcurrent(target, n) {
    const { spawn } = require('child_process');
    return Promise.all(
      Array.from({ length: n }, (_, i) =>
        new Promise((resolve) => {
          const child = spawn(process.execPath, [recorderPath, `violation-${i}`], {
            env: { ...process.env, VIOLATION_RECORDER_TARGET: target },
            stdio: 'ignore',
          });
          child.on('close', resolve);
        })
      )
    );
  }

  test('並行実行でエントリが欠落しない（O_APPEND 追記）', async () => {
    const target = path.join(tmpDir, 'mistakes.md');
    fs.writeFileSync(target, '# Mistakes Ledger（ミス台帳）\n\nBASE\n', 'utf8');

    await runConcurrent(target, 10);

    const after = fs.readFileSync(target, 'utf8');
    expect(after).toContain('BASE');
    expect((after.match(/\*\*違反\*\*/g) || []).length).toBe(10);
  });

  test('新規ファイルへの並行初回作成でもエントリが欠落しない（wx 初期化）', async () => {
    const target = path.join(tmpDir, 'mistakes.md');

    await runConcurrent(target, 10);

    const after = fs.readFileSync(target, 'utf8');
    expect((after.match(/\*\*違反\*\*/g) || []).length).toBe(10);
    expect(after).toContain('# Mistakes Ledger（ミス台帳）');
  });

  // chmod による読取制限は root では効かないため、root/win32 はスキップ
  const canRestrictRead =
    process.platform !== 'win32' && typeof process.getuid === 'function' && process.getuid() !== 0;
  (canRestrictRead ? test : test.skip)(
    '読み取り不能（write-only）でも既存内容をテンプレートで上書きしない',
    () => {
      const target = path.join(tmpDir, 'mistakes.md');
      fs.writeFileSync(target, '# Mistakes Ledger（ミス台帳）\n\nPRECIOUS\n', 'utf8');
      fs.chmodSync(target, 0o222);

      const result = runRecorder(target, ['違反Z']);
      expect(result.status).toBe(0);

      fs.chmodSync(target, 0o644);
      const after = fs.readFileSync(target, 'utf8');
      expect(after).toContain('PRECIOUS');
      expect(after).toContain('**違反**: 違反Z');
    }
  );
});
