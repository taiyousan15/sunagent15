const path = require('path');

describe('cost-warning CommonJS export', () => {
  test('require() does not throw and exports hook shape', () => {
    const modulePath = path.join(__dirname, '..', 'cost-warning.js');

    expect(() => {
      const hook = require(modulePath);
      expect(hook).toBeDefined();
      expect(hook.name).toBe('cost-warning');
      expect(typeof hook.run).toBe('function');
    }).not.toThrow();
  });
});
