const path = require('path');
const { spawnSync } = require('child_process');

const scriptPath = path.join(__dirname, '..', 'output-verifier.js');

function runHook(output) {
  return spawnSync(process.execPath, [scriptPath], {
    input: JSON.stringify({ tool_result: { output } }),
    encoding: 'utf8',
  });
}

describe('output-verifier fail-open', () => {
  test('HIGH uncertainty score warns on stderr but exits 0', () => {
    // 「確認していませんが」(0.8) + 「と思います」(0.6) + 「かもしれません」(0.7) + 「おそらく」(0.5)
    // → totalWeight 2.6 / 3.0 ≈ 0.87 >= RETRY_THRESHOLD(0.5)
    const result = runHook(
      'このAPIの挙動は確認していませんが、おそらく正しいと思います。' +
      '別の原因かもしれません。'.padEnd(60, '　')
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toContain('不確実性スコア HIGH');
  });

  test('MEDIUM uncertainty score warns on stderr and exits 0', () => {
    // 「おそらく」(0.5) のみ → 0.5/3.0 = 0.17 ... WARN には足りないため
    // 「と思います」(0.6) を加えて 1.1/3.0 = 0.37 >= WARN_THRESHOLD(0.3)
    const result = runHook(
      'おそらくこの設定で動くと思います。'.padEnd(60, '　')
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toContain('不確実性スコア MEDIUM');
  });

  test('clean output exits 0 with no warning', () => {
    const result = runHook(
      'テストを実行し、全12件が成功したことを確認済みです。'.padEnd(60, '　')
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  test('malformed JSON input exits 0 (fail-open)', () => {
    const result = spawnSync(process.execPath, [scriptPath], {
      input: 'not-json{{{',
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
  });
});
