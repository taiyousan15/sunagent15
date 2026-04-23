const fs = require('fs');
const path = require('path');

const guardPath = path.join(__dirname, '..', 'deviation-approval-guard.js');

function loadApprovedPatternsFromSource() {
  const src = fs.readFileSync(guardPath, 'utf8');
  const block = src.match(/const APPROVED_PATTERNS = \[([\s\S]*?)\];/);
  expect(block).not.toBeNull();

  return [...block[1].matchAll(/\/(.*?)\/([gimsuy]*)/g)].map(
    ([, body, flags]) => new RegExp(body, flags)
  );
}

function isApproved(patterns, content, description) {
  return patterns.some((pattern) => pattern.test(content) || pattern.test(description));
}

describe('deviation-approval-guard approved patterns', () => {
  test('approved detection is deterministic across repeated checks', () => {
    const patterns = loadApprovedPatternsFromSource();

    const first = isApproved(patterns, 'approved', '');
    const second = isApproved(patterns, 'approved', '');

    expect(first).toBe(true);
    expect(second).toBe(true);
  });

  test('APPROVED_PATTERNS must not use /g flag (lastIndex bug prevention)', () => {
    // Regression guard for session 20 Codex C3 patch:
    // APPROVED_PATTERNS are consumed via RegExp.prototype.test(), which
    // retains lastIndex state when /g is present and causes false negatives
    // on the second invocation with the same input. /i (or other non-g flags)
    // is safe because lastIndex is only used with /g or /y.
    const patterns = loadApprovedPatternsFromSource();

    expect(patterns.length).toBeGreaterThan(0);
    for (const p of patterns) {
      expect(p.flags).not.toContain('g');
    }
  });
});
