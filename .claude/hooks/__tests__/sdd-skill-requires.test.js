const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('SDD skills requires frontmatter', () => {
  test.each(['sdd-design', 'sdd-tasks', 'sdd-threat'])(
    '%s declares python3 + ollama tools',
    (skill) => {
      const file = path.join(repoRoot, '.claude', 'skills', skill, 'SKILL.md');
      const src = fs.readFileSync(file, 'utf8');
      expect(src).toMatch(/requires:\s*\n\s*tools:\s*\["python3",\s*"ollama"\]/);
    }
  );

  test('skill requirements validator remains green', () => {
    const result = spawnSync(process.execPath, ['scripts/check-skill-requirements.js'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Scanned \d+ skills/);
    expect(result.stdout).toContain('OK — all skills pass schema validation.');
  });
});
