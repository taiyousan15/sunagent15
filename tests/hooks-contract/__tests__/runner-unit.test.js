'use strict';
/**
 * runner-unit — runner 自体の単体テスト（canary 7 ケースへの追加であり置換ではない）
 */

const path = require('path');
const { withSandbox } = require('../sandbox');
const { spawnHookInSandbox, buildEnv, resolveHookPath } = require('../spawn-hook');

const FIX = (name) => path.join(__dirname, '..', 'fixtures', name);

describe('runner-unit', () => {
  test('U-1 output-cap: 上限超過で kill・outputTruncated 明示・保存バッファは常に上限以下', async () => {
    await withSandbox(async (sb) => {
      // c6-stdin-echo に巨大 stdin を与えて上限超過を誘発
      const cap = 16 * 1024;
      const big = 'x'.repeat(64 * 1024);
      const r = await spawnHookInSandbox(sb, null, big, {
        rawScriptPath: FIX('c6-stdin-echo.js'),
        maxOutputBytes: cap,
      });
      expect(r.outputTruncated).toBe(true);
      // メモリ上限として機能すること（保存長 ≤ cap — Codex R-code #2）
      expect(r.stdoutBytes.length).toBeLessThanOrEqual(cap);
      expect(Buffer.byteLength(r.stderr, 'utf8')).toBeLessThanOrEqual(cap);
    });
  }, 15000);

  test('U-2 env-positive-allowlist: 固定env以外は escape-target 完全一致のみ許可・他は全て throw', async () => {
    await withSandbox(async (sb) => {
      const env = buildEnv(sb, {});
      expect(env.HOME).toBe(sb.homeDir);
      expect(env.CLAUDE_PLUGIN_ROOT).toBe(sb.pluginRoot);
      expect(env.CLAUDE_PLUGIN_DATA).toBe(sb.stateDir);
      expect(env.CLAUDE_PROJECTS_DIR).toBe(sb.projectsRoot);
      expect('NODE_OPTIONS' in env).toBe(false);
      expect('NODE_PATH' in env).toBe(false);
      // 親環境からの継承が無いこと（代表: この jest プロセスに必ずある PWD/SHELL 系が env に無い）
      expect('PWD' in env).toBe(false);
      expect('SHELL' in env).toBe(false);
      // positive allowlist（Codex R-code #1）: 禁止名も任意名も credential 名も全て拒否
      expect(() => buildEnv(sb, { NODE_OPTIONS: '--require evil' })).toThrow(/allowlist/);
      expect(() => buildEnv(sb, { GITHUB_TOKEN: 'x' })).toThrow(/allowlist/);
      expect(() => buildEnv(sb, { http_proxy: 'x' })).toThrow(/allowlist/);
      expect(() => buildEnv(sb, { TAISUN_ANYTHING: 'x' })).toThrow(/allowlist/);
      // escape-target は値が sb.escapeTarget と完全一致する場合のみ許可
      expect(() => buildEnv(sb, { TAISUN_EVAL_ESCAPE_TARGET: '/tmp/other' })).toThrow(/allowlist/);
      const ok = buildEnv(sb, { TAISUN_EVAL_ESCAPE_TARGET: sb.escapeTarget });
      expect(ok.TAISUN_EVAL_ESCAPE_TARGET).toBe(sb.escapeTarget);
    });
  }, 15000);

  test('U-4 destroy-guard: sandbox 外パスの再帰削除を拒否する', async () => {
    const { createSandbox, destroySandbox } = require('../sandbox');
    const sb = createSandbox();
    try {
      // root を偽装した場合は削除を拒否（realpath 親 + basename 検証 — Codex R-code #5）
      expect(() => destroySandbox({ root: sb.projectDir })).toThrow(/refusing/);
      const fakeName = require('path').join(sb.projectDir, 'hooks-contract-fake');
      require('fs').mkdirSync(fakeName);
      expect(() => destroySandbox({ root: fakeName })).toThrow(/refusing/);
    } finally {
      destroySandbox(sb); // 正規 root は削除できる
    }
  }, 15000);

  test('U-3 path-guard: allowlist 外 hookId・fixtures 外 rawScriptPath を拒否する', async () => {
    await withSandbox(async (sb) => {
      expect(() => resolveHookPath(sb, 'not-a-real-hook')).toThrow(/allowlist/);
      await expect(
        spawnHookInSandbox(sb, null, {}, { rawScriptPath: path.join(sb.projectDir, 'package.json') })
      ).rejects.toThrow(/fixtures/);
    });
  }, 15000);
});
