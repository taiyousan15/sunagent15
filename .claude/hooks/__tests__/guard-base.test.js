'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const guardBase = require('../utils/guard-base');

describe('guard-base', () => {
  describe('logSkip', () => {
    let tmpDir;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-base-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('writes JSONL entry with auto-generated timestamp', () => {
      const logPath = path.join(tmpDir, 'data', 'test.log');
      guardBase.logSkip(logPath, { tool: 'Write', phase: '1' });

      const content = fs.readFileSync(logPath, 'utf8').trim();
      const entry = JSON.parse(content);
      expect(entry.ts).toBeDefined();
      expect(entry.tool).toBe('Write');
      expect(entry.phase).toBe('1');
    });

    test('creates parent directories automatically', () => {
      const logPath = path.join(tmpDir, 'deep', 'nested', 'test.log');
      guardBase.logSkip(logPath, { key: 'value' });

      expect(fs.existsSync(logPath)).toBe(true);
    });

    test('appends multiple entries', () => {
      const logPath = path.join(tmpDir, 'multi.log');
      guardBase.logSkip(logPath, { n: 1 });
      guardBase.logSkip(logPath, { n: 2 });

      const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0]).n).toBe(1);
      expect(JSON.parse(lines[1]).n).toBe(2);
    });
  });

  describe('PROJECT_ROOT', () => {
    test('resolves to repository root', () => {
      expect(fs.existsSync(path.join(guardBase.PROJECT_ROOT, 'package.json'))).toBe(true);
    });
  });

  describe('module loading', () => {
    test('checkpoint-guard loads guard-base without error', () => {
      expect(() => require('../checkpoint-guard')).not.toThrow();
    });

    test('agent-checkpoint-guard loads guard-base without error', () => {
      expect(() => require('../agent-checkpoint-guard')).not.toThrow();
    });
  });
});
