/**
 * cost-hard-stop-guard.js off-by-one regression test
 *
 * @issue cost-hard-stop off-by-one (debate Round 5)
 *
 * Verifies the threshold comparison uses `>` (strict greater than),
 * meaning cost === LIMIT does NOT trigger the hard stop.
 */

const fs = require('fs');
const path = require('path');

const GUARD_FILE = path.resolve(__dirname, '../cost-hard-stop-guard.js');

describe('cost-hard-stop off-by-one', () => {
  let content;

  beforeAll(() => {
    content = fs.readFileSync(GUARD_FILE, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('should use strict greater-than (>) for daily limit, not >=', () => {
    // The threshold check should be `daily > DAILY_LIMIT`, not `daily >= DAILY_LIMIT`
    // This means exactly hitting the limit does NOT trigger hard stop
    const match = content.match(/daily\s*>\s*DAILY_LIMIT/);
    expect(match).not.toBeNull();

    // Ensure >= is NOT used (off-by-one)
    const geMatch = content.match(/daily\s*>=\s*DAILY_LIMIT/);
    expect(geMatch).toBeNull();
  });

  it('should use strict greater-than (>) for monthly limit, not >=', () => {
    const match = content.match(/monthly\s*>\s*MONTHLY_LIMIT/);
    expect(match).not.toBeNull();

    const geMatch = content.match(/monthly\s*>=\s*MONTHLY_LIMIT/);
    expect(geMatch).toBeNull();
  });
});
