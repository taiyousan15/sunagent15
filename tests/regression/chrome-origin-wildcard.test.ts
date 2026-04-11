/**
 * Regression Test: Chrome Origin Wildcard
 *
 * Date: 2026-01-07
 * @issue chrome-origin-wildcard (mistakes.md)
 * Location: `src/proxy-mcp/browser/cdp/chrome-debug-cli.ts`
 * Root Cause: --remote-allow-origins=* permitted all origins
 * Fix: Restricted to localhost (127.0.0.1) only
 *
 * Verification method: fs.readFileSync + regex static analysis (debate Round 8 AGREE)
 */

import * as fs from 'fs';
import * as path from 'path';

const TARGET_FILE = path.resolve(__dirname, '../../src/proxy-mcp/browser/cdp/chrome-debug-cli.ts');

describe('Regression: Chrome Origin Wildcard', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(TARGET_FILE, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('should not allow all origins with wildcard', () => {
    // The vulnerable pattern: --remote-allow-origins=*
    const wildcardOrigin = /--remote-allow-origins=\*/;
    expect(content).not.toMatch(wildcardOrigin);
  });

  it('should restrict to localhost (127.0.0.1)', () => {
    expect(content).toMatch(/127\.0\.0\.1/);
  });
});
