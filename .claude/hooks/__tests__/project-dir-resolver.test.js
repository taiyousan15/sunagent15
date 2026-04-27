const path = require('path');
const { resolveProjectsRoot } = require('../lib/project-dir-resolver');

describe('resolveProjectsRoot', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('returns CLAUDE_PROJECTS_DIR when set', () => {
    process.env.CLAUDE_PROJECTS_DIR = '/custom/projects';
    process.env.HOME = '/home/user';
    expect(resolveProjectsRoot()).toBe('/custom/projects');
  });

  test('falls back to HOME/Desktop when CLAUDE_PROJECTS_DIR unset', () => {
    delete process.env.CLAUDE_PROJECTS_DIR;
    process.env.HOME = '/home/user';
    expect(resolveProjectsRoot()).toBe(path.join('/home/user', 'Desktop'));
  });

  test('falls back to HOME/Desktop when CLAUDE_PROJECTS_DIR is empty string', () => {
    process.env.CLAUDE_PROJECTS_DIR = '';
    process.env.HOME = '/home/user';
    expect(resolveProjectsRoot()).toBe(path.join('/home/user', 'Desktop'));
  });

  test('falls back to HOME/Desktop when CLAUDE_PROJECTS_DIR is whitespace', () => {
    process.env.CLAUDE_PROJECTS_DIR = '   ';
    process.env.HOME = '/home/user';
    expect(resolveProjectsRoot()).toBe(path.join('/home/user', 'Desktop'));
  });

  test('returns null when both CLAUDE_PROJECTS_DIR and HOME are unset', () => {
    delete process.env.CLAUDE_PROJECTS_DIR;
    delete process.env.HOME;
    expect(resolveProjectsRoot()).toBeNull();
  });

  test('returns null when CLAUDE_PROJECTS_DIR unset and HOME is empty', () => {
    delete process.env.CLAUDE_PROJECTS_DIR;
    process.env.HOME = '';
    expect(resolveProjectsRoot()).toBeNull();
  });

  test('CLAUDE_PROJECTS_DIR wins even when HOME is also set', () => {
    process.env.CLAUDE_PROJECTS_DIR = '/explicit/path';
    process.env.HOME = '/home/user';
    expect(resolveProjectsRoot()).toBe('/explicit/path');
  });
});
