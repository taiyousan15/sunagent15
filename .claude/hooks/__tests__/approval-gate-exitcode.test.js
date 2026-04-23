const path = require('path');
const { spawnSync } = require('child_process');

describe('approval-gate billing hard-block', () => {
  test('billing classification exits with code 2', () => {
    const scriptPath = path.join(__dirname, '..', 'approval-gate.js');

    const result = spawnSync(process.execPath, [scriptPath], {
      input: JSON.stringify({
        tool_name: 'meta-ads',
        tool_input: { action: 'create campaign', budget: 1000 },
      }),
      encoding: 'utf8',
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('課金・広告系操作を検出しました');
  });
});
