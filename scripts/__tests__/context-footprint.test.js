const path = require('path');
const { spawnSync } = require('child_process');

const scriptPath = path.join(__dirname, '..', 'context-footprint.js');
const { estimateTokens } = require(scriptPath);

function run(args) {
  return spawnSync(process.execPath, [scriptPath, ...args], { encoding: 'utf8' });
}

describe('estimateTokens', () => {
  test('CJK characters count as chars/3', () => {
    // ひらがな9文字 → 9/3 = 3 tokens
    expect(estimateTokens('あいうえおかきくけ')).toBe(3);
  });

  test('ASCII characters count as chars/4', () => {
    // 8 ASCII chars → 8/4 = 2 tokens
    expect(estimateTokens('abcdefgh')).toBe(2);
  });

  test('mixed text combines both rates (char-based, not byte-based)', () => {
    // 漢字6文字(6/3=2) + ASCII 4文字(4/4=1) = 3 tokens
    // バイト基準なら 漢字6文字=18バイト で別の値になる — 文字基準であることを固定
    expect(estimateTokens('日本語文字列abcd')).toBe(3);
  });

  test('empty string is 0 tokens', () => {
    expect(estimateTokens('')).toBe(0);
  });

  test('katakana and fullwidth symbols count as CJK', () => {
    // カタカナ3 + 全角句点3 = 6 CJK → 2 tokens
    expect(estimateTokens('アイウ。。。')).toBe(2);
  });
});

describe('context-footprint meter', () => {
  test('report lists gate files and total', () => {
    const result = run([]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('.claude/CLAUDE.md');
    expect(result.stdout).toContain('.claude/rules/mistakes.md');
    expect(result.stdout).toMatch(/毎セッション固定注入（gate合計）: \d+ bytes ≈ \d+ tokens/);
  });

  test('deterministic: two runs produce identical JSON', () => {
    const a = run(['--json']);
    const b = run(['--json']);
    expect(a.status).toBe(0);
    expect(a.stdout).toBe(b.stdout);
  });

  test('JSON output has gate/info/lazy structure', () => {
    const result = run(['--json']);
    const parsed = JSON.parse(result.stdout);
    expect(Array.isArray(parsed.gate)).toBe(true);
    expect(parsed.gate.length).toBeGreaterThanOrEqual(2);
    expect(parsed.gateTotal.tokens).toBeGreaterThan(0);
    for (const item of parsed.gate) {
      expect(typeof item.path).toBe('string');
      expect(typeof item.bytes).toBe('number');
      expect(typeof item.tokens).toBe('number');
    }
  });

  test('check passes when under limit (pass message on stderr)', () => {
    const result = run(['--check', '--limit', '999999']);
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('ゲート通過');
  });

  test('check fails with exit 1 and guidance when over limit', () => {
    const result = run(['--check', '--limit', '1']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ゲート超過');
    expect(result.stderr).toContain('context:report');
  });

  test('check without valid --limit exits 2', () => {
    const result = run(['--check']);
    expect(result.status).toBe(2);
  });

  test('--check --json emits valid JSON with check result (pass message on stderr)', () => {
    const result = run(['--check', '--json', '--limit', '999999']);
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout); // throws if stdout is polluted
    expect(parsed.check).toEqual({ limit: 999999, pass: true });
    expect(result.stderr).toContain('ゲート通過');
  });

  test('--check --json over limit: valid JSON, pass=false, exit 1', () => {
    const result = run(['--check', '--json', '--limit', '1']);
    expect(result.status).toBe(1);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.check.pass).toBe(false);
  });
});
