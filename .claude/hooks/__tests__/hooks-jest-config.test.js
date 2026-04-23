const path = require('path');

describe('hooks Jest project config', () => {
  test('excludes custom Phase3 TestSuite runner from Jest discovery', () => {
    const config = require(path.join(__dirname, '..', '..', '..', 'jest.config.js'));
    const hooksProject = config.projects.find((p) => p.displayName === 'hooks');

    expect(hooksProject).toBeDefined();
    expect(hooksProject.testPathIgnorePatterns).toContain(
      '<rootDir>/.claude/hooks/__tests__/unified-guard-phase3.test.js'
    );
  });
});
