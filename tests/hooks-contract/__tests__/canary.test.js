'use strict';
/**
 * canary — runner の検出力を敵対的 fixture で検証する固定7ケース
 * （Codex 計画ゲート条件2: この集合は置換禁止。追加は runner-unit.test.js 側へ）
 */

const path = require('path');
const fs = require('fs');
const { withSandbox, snapshotSandbox, diffSnapshots } = require('../sandbox');
const { spawnHookInSandbox } = require('../spawn-hook');

const FIX = (name) => path.join(__dirname, '..', 'fixtures', name);

describe('canary', () => {
  test('C-1 timeout: 終了しないプロセスを kill し timedOut を明示する', async () => {
    await withSandbox(async (sb) => {
      const r = await spawnHookInSandbox(sb, null, {}, {
        rawScriptPath: FIX('c1-timeout.js'),
        timeoutMs: 1500,
      });
      expect(r.timedOut).toBe(true);
      expect(r.signal).toBe('SIGKILL');
      expect(r.exitCode).toBe(null);
    });
  }, 15000);

  test('C-2 nonzero-exit: exitCode と stderr を区別して取得する', async () => {
    await withSandbox(async (sb) => {
      const r = await spawnHookInSandbox(sb, null, {}, { rawScriptPath: FIX('c2-nonzero-exit.js') });
      expect(r.exitCode).toBe(3);
      expect(r.timedOut).toBe(false);
      expect(r.stderr).toContain('c2-canary-stderr');
      expect(r.stdout).toBe('');
    });
  }, 15000);

  test('C-3 malformed-stdout: 非JSON stdout を「正常終了でも」契約違反として検出できる', async () => {
    await withSandbox(async (sb) => {
      const r = await spawnHookInSandbox(sb, null, {}, { rawScriptPath: FIX('c3-malformed-stdout.js') });
      expect(r.exitCode).toBe(0);
      // 「stdout は空 or JSON」契約の判定関数が false を返すこと（fail-open 誤合格の防止）
      const stdoutIsEmptyOrJson = (() => {
        if (r.stdout.trim() === '') return true;
        try { JSON.parse(r.stdout); return true; } catch { return false; }
      })();
      expect(stdoutIsEmptyOrJson).toBe(false);
    });
  }, 15000);

  test('C-4 known-side-effect: projectDir への既知の書込みを差分増分で検出する', async () => {
    await withSandbox(async (sb) => {
      const before = snapshotSandbox(sb);
      const r = await spawnHookInSandbox(sb, null, {}, { rawScriptPath: FIX('c4-side-effect.js') });
      const diff = diffSnapshots(before, snapshotSandbox(sb));
      expect(r.exitCode).toBe(0);
      expect(diff.created).toEqual(['projectDir:c4-known-side-effect.txt']);
      expect(diff.modified).toEqual([]);
      expect(diff.deleted).toEqual([]);
    });
  }, 15000);

  test('C-5 escape-write: 監視領域外（escape target）への書込みを検出し finally で復旧する', async () => {
    await withSandbox(async (sb) => {
      const escapedFile = path.join(sb.escapeTarget, 'escaped-write.txt');
      try {
        const before = snapshotSandbox(sb); // escapeTarget は監視5領域に含まれない
        const r = await spawnHookInSandbox(sb, null, {}, {
          rawScriptPath: FIX('c5-escape-write.js'),
          env: { TAISUN_EVAL_ESCAPE_TARGET: sb.escapeTarget }, // C-5 限定の明示的 env 例外
        });
        const diff = diffSnapshots(before, snapshotSandbox(sb));
        expect(r.exitCode).toBe(0);
        // 監視5領域には変化なし = snapshot だけでは見えない書込みが「外」で起きている
        expect(diff.created).toEqual([]);
        // escape target 側の明示チェックで捕捉できること
        expect(fs.existsSync(escapedFile)).toBe(true);
      } finally {
        fs.rmSync(escapedFile, { force: true });
      }
    });
  }, 15000);

  test('C-6a stdin-fidelity(normal): 通常 JSON が byte 完全一致で届く', async () => {
    await withSandbox(async (sb) => {
      const envelope = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'echo hello' }, cwd: sb.projectDir });
      const r = await spawnHookInSandbox(sb, null, envelope, { rawScriptPath: FIX('c6-stdin-echo.js') });
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toBe(envelope);
    });
  }, 15000);

  test('C-6b stdin-fidelity(shell-meta): 引用符・改行・;・$()・パイプが展開されず届く', async () => {
    await withSandbox(async (sb) => {
      const raw = '{"cmd":"echo \\"hi\\"; rm -rf $(pwd) | sh\\n`date`","jp":"改行\\nとメタ文字"}';
      const r = await spawnHookInSandbox(sb, null, raw, { rawScriptPath: FIX('c6-stdin-echo.js') });
      expect(r.exitCode).toBe(0);
      expect(r.stdoutBytes.equals(Buffer.from(raw, 'utf8'))).toBe(true);
    });
  }, 15000);
});
