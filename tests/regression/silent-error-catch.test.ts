/**
 * Regression Test: Silent Error Catch
 *
 * Date: 2026-01-07
 * @issue silent-error-catch (mistakes.md)
 * Location: `src/proxy-mcp/browser/cdp/session.ts`
 * Root Cause: Empty catch blocks silently swallowed errors
 * Fix: Added console.debug for error logging in catch blocks
 *
 * Verification method: fs.readFileSync + regex static analysis (debate Round 8 AGREE)
 *
 * Note: Hooks use intentional fail-open empty catch (ESLint no-empty exemption).
 * This test targets src/proxy-mcp specifically, not hooks.
 */

import * as fs from 'fs';
import * as path from 'path';

const TARGET_FILE = path.resolve(__dirname, '../../src/proxy-mcp/browser/cdp/session.ts');

describe('Regression: Silent Error Catch', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(TARGET_FILE, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('should not have empty catch blocks', () => {
    // Empty catch: catch (e) {} or catch { } with only whitespace
    const emptyCatch = /catch\s*(\([^)]*\))?\s*\{\s*\}/g;
    const matches = content.match(emptyCatch);
    expect(matches).toBeNull();
  });

  it('should have error logging in the file (console.debug/error/warn)', () => {
    const hasLogging = /console\.(debug|error|warn)\s*\(/;
    expect(content).toMatch(hasLogging);
  });
});
