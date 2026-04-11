/**
 * Regression Test: Success True On Error
 *
 * Date: 2026-01-07
 * @issue success-true-on-error (mistakes.md)
 * Location: `src/proxy-mcp/ops/schedule/runner.ts`
 * Root Cause: Optional dependency errors reported as success: true
 * Fix: Changed to success: false with skipped: true flag
 *
 * Verification method: fs.readFileSync + regex static analysis (debate Round 8 AGREE)
 */

import * as fs from 'fs';
import * as path from 'path';

const TARGET_FILE = path.resolve(__dirname, '../../src/proxy-mcp/ops/schedule/runner.ts');

describe('Regression: Success True On Error', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(TARGET_FILE, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('should use skipped flag for optional dependency failures', () => {
    // The fix introduced `skipped: true` to distinguish from hard failures
    expect(content).toMatch(/skipped:\s*true/);
  });

  it('should not return success:true in catch blocks without skipped flag', () => {
    // The original bug: catch block returned { success: true } masking errors
    // After fix: catch blocks use { skipped: true } to distinguish optional failures
    const lines = content.split('\n');
    let inCatch = false;
    let catchDepth = 0;

    for (const line of lines) {
      if (/\bcatch\b/.test(line)) {
        inCatch = true;
        catchDepth = 0;
      }
      if (inCatch) {
        catchDepth += (line.match(/{/g) || []).length;
        catchDepth -= (line.match(/}/g) || []).length;
        // If we find success: true in a catch block, skipped must also be present nearby
        if (/success:\s*true/.test(line)) {
          // This is the anti-pattern we fixed — should not exist
          expect(line).toMatch(/skipped/);
        }
        if (catchDepth <= 0) inCatch = false;
      }
    }
  });
});
