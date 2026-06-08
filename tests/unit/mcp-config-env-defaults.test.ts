/**
 * Guard: every shipped *.mcp.json must be parse-safe.
 *
 * Claude Code fails to parse the ENTIRE .mcp.json file when an env/args value
 * contains a bare `${VAR}` (no `:-` default) whose variable is unset — taking
 * down even key-free core MCP servers. Source: code.claude.com/docs/en/mcp.
 *
 * This test enforces that `.mcp.json.example` (verbatim-copied to `.mcp.json`
 * by scripts/install.sh) and every preset use the supported `${VAR:-default}`
 * (or `${VAR:-}`) form, so the file always loads for new users.
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Returns the placeholders in `value` that are parse-unsafe — i.e. `${...}`
 * whose inner token has no `:-` default. Matches per-placeholder so a value
 * mixing safe and unsafe placeholders (e.g. `"${A:-}${B}"`) is handled
 * correctly (string-level `includes(':-')` would miss `${B}`).
 */
function findUnsafePlaceholders(value: string): string[] {
  const out: string[] = [];
  const re = /\$\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    if (!m[1].includes(':-')) {
      out.push(m[0]);
    }
  }
  return out;
}

/**
 * All string values that Claude Code performs `${VAR}` expansion on for a
 * server: `command`, `args`, `env` values, `url`, and `headers` values.
 * Free-text fields (`description`, `search_keywords`, `category`, ...) are NOT
 * env-expanded and are deliberately excluded to avoid false positives.
 */
function collectExpandableStrings(server: unknown): string[] {
  const out: string[] = [];
  if (!server || typeof server !== 'object') {
    return out; // `_comment_*` keys hold plain strings, not server objects
  }
  const s = server as Record<string, unknown>;
  const pushString = (v: unknown): void => {
    if (typeof v === 'string') out.push(v);
  };
  const pushObjectValues = (obj: unknown): void => {
    if (obj && typeof obj === 'object') {
      for (const v of Object.values(obj)) pushString(v);
    }
  };
  pushString(s.command);
  if (Array.isArray(s.args)) {
    for (const a of s.args) pushString(a);
  }
  pushObjectValues(s.env);
  pushString(s.url);
  pushObjectValues(s.headers);
  return out;
}

function discoverMcpFiles(): string[] {
  const files = [path.join(REPO_ROOT, '.mcp.json.example')];
  const presetDir = path.join(REPO_ROOT, 'mcp-presets');
  if (fs.existsSync(presetDir)) {
    for (const f of fs.readdirSync(presetDir).sort()) {
      if (f.endsWith('.mcp.json')) files.push(path.join(presetDir, f));
    }
  }
  return files;
}

describe('MCP config env/args placeholders are parse-safe', () => {
  const files = discoverMcpFiles();

  it('discovers .mcp.json.example and the presets', () => {
    expect(fs.existsSync(path.join(REPO_ROOT, '.mcp.json.example'))).toBe(true);
    expect(files.length).toBeGreaterThan(1);
  });

  describe('detector self-test (guards the guard)', () => {
    it('flags a bare ${VAR} without default', () => {
      expect(findUnsafePlaceholders('"${FOO}"')).toEqual(['${FOO}']);
    });
    it('accepts ${VAR:-} and ${VAR:-default}', () => {
      expect(findUnsafePlaceholders('${FOO:-}')).toEqual([]);
      expect(findUnsafePlaceholders('--key=${FOO:-http://localhost:6333}')).toEqual([]);
    });
    it('handles multiple placeholders and literals in one string', () => {
      expect(findUnsafePlaceholders('a=${A:-};b=${B}')).toEqual(['${B}']);
      expect(findUnsafePlaceholders('no placeholders at all')).toEqual([]);
    });
  });

  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file);
    describe(rel, () => {
      it('is valid JSON', () => {
        expect(() => JSON.parse(fs.readFileSync(file, 'utf-8'))).not.toThrow();
      });

      it('has no bare ${VAR} lacking a :- default', () => {
        const cfg = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
          mcpServers?: Record<string, unknown>;
        };
        const servers = cfg.mcpServers || {};
        const violations: string[] = [];
        for (const [name, server] of Object.entries(servers)) {
          for (const value of collectExpandableStrings(server)) {
            for (const ph of findUnsafePlaceholders(value)) {
              violations.push(`${name}: ${ph}`);
            }
          }
        }
        expect(violations).toEqual([]);
      });
    });
  }
});
