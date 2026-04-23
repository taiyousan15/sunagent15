const fs = require('fs');
const path = require('path');

describe('Phase2 unified-guard module path', () => {
  test('active unified-guard exports expected APIs', () => {
    const guard = require(path.join(__dirname, '..', 'unified-guard.js'));
    expect(typeof guard.performIntentCheck).toBe('function');
    expect(typeof guard.buildUserInputFromContext).toBe('function');
  });

  test('phase2 files do not reference hooks.disabled.local', () => {
    const files = [
      path.join(__dirname, 'unified-guard-phase2.test.js'),
      path.join(__dirname, 'run-phase2-tests.js'),
    ];

    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      expect(src).not.toContain('hooks.disabled.local');
      expect(src).toContain("require('../unified-guard.js')");
    }
  });
});
