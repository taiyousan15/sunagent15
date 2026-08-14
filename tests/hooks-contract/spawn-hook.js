'use strict';
/**
 * hooks-contract runner — hook プロセスの契約実行器
 *
 * subprocess 契約（Codex Pivot 条件7）:
 *   - process.execPath / shell:false
 *   - stdin byte 完全送信後に必ず close
 *   - stdout/stderr サイズ上限（超過は kill + outputTruncated）
 *   - timeout 時 kill + timedOut 明示
 *   - exitCode / signal / stdout / stderr を区別
 *   - error/close 全経路で Promise を一度だけ settle
 *   - cleanup は sandbox 側（sandbox.js）の責務
 *
 * path 検証（Codex 計画ゲート条件3）:
 *   - hookId は allowlist（hook-allowlist.json）からのみ解決
 *   - 解決後 realpath が hookTreeDir 内に包含されること
 *   - lstat による symlink 拒否
 *
 * env（Codex Pivot 条件3 / Final B2 のenv節）:
 *   - prefix 継承なしの完全固定オブジェクト。NODE_OPTIONS/NODE_PATH/proxy/credential は構築しない
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ALLOWLIST_PATH = path.join(__dirname, 'hook-allowlist.json');
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_OUTPUT_BYTES = 1024 * 1024; // 1MB

function loadAllowlist() {
  return JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
}

/**
 * 完全固定 env の構築（親環境からの継承は一切しない）
 * case 追加 env は positive allowlist 方式（Codex R-code #1）:
 *   TAISUN_EVAL_ESCAPE_TARGET のみ、かつ値が sb.escapeTarget と完全一致する場合に限り許可。
 *   それ以外のキーは名称に関わらず全て throw（denylist ではない）。
 */
function buildEnv(sb, caseEnv) {
  const env = {
    PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
    HOME: sb.homeDir,
    TMPDIR: sb.tmpDir,
    TMP: sb.tmpDir,
    TEMP: sb.tmpDir,
    CLAUDE_PROJECT_DIR: sb.projectDir,
    CLAUDE_PROJECTS_DIR: sb.projectsRoot,
    CLAUDE_PLUGIN_ROOT: sb.pluginRoot,
    CLAUDE_PLUGIN_DATA: sb.stateDir,
    CLAUDE_SESSION_ID: 'hooks-contract-fixed-session',
  };
  for (const [k, v] of Object.entries(caseEnv || {})) {
    if (k === 'TAISUN_EVAL_ESCAPE_TARGET' && v === sb.escapeTarget) {
      env[k] = v;
      continue;
    }
    throw new Error(`env var not in positive allowlist (or wrong value): ${k}`);
  }
  return env;
}

/** hookId → 検証済み絶対パス（sandbox内コピー） */
function resolveHookPath(sb, hookId) {
  const allowlist = loadAllowlist();
  const rel = allowlist[hookId];
  if (!rel) {
    throw new Error(`hookId not in allowlist: ${hookId}`);
  }
  const abs = path.join(sb.hookTreeDir, rel);
  const lst = fs.lstatSync(abs); // 存在しなければ throw
  if (lst.isSymbolicLink()) {
    throw new Error(`hook path is a symlink (rejected): ${abs}`);
  }
  const real = fs.realpathSync(abs);
  const treeReal = fs.realpathSync(sb.hookTreeDir);
  if (!(real === treeReal || real.startsWith(treeReal + path.sep))) {
    throw new Error(`hook path escapes hookTreeDir: ${real}`);
  }
  return real;
}

/**
 * spawnHookInSandbox(sb, hookId, envelope, opts)
 *  - sb: sandbox.js の createSandbox() 産物（所有権は呼び出し側）
 *  - envelope: object（JSON化して stdin へ）または string（そのまま byte 送信 — malformed 試験用）
 *  - opts: { timeoutMs, maxOutputBytes, env, argv, rawScriptPath }
 *    rawScriptPath は canary fixture 用（allowlist 外・ただし __dirname/fixtures 配下限定）
 * 戻り値: { exitCode, signal, stdout, stderr, timedOut, outputTruncated, durationMs }
 */
async function spawnHookInSandbox(sb, hookId, envelope, opts = {}) {
  const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxOut = opts.maxOutputBytes || DEFAULT_MAX_OUTPUT_BYTES;

  let scriptPath;
  if (opts.rawScriptPath) {
    const fixturesReal = fs.realpathSync(path.join(__dirname, 'fixtures'));
    const real = fs.realpathSync(opts.rawScriptPath);
    if (!real.startsWith(fixturesReal + path.sep)) {
      throw new Error(`rawScriptPath must be inside fixtures/: ${real}`);
    }
    scriptPath = real;
  } else {
    scriptPath = resolveHookPath(sb, hookId);
  }

  const stdinBuf = Buffer.isBuffer(envelope)
    ? envelope
    : Buffer.from(typeof envelope === 'string' ? envelope : JSON.stringify(envelope), 'utf8');

  const env = buildEnv(sb, opts.env);
  const start = Date.now();

  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    let child;
    try {
      child = spawn(process.execPath, [scriptPath, ...(opts.argv || [])], {
        shell: false,
        cwd: sb.projectDir,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e) {
      reject(e);
      return;
    }

    const out = [];
    const err = [];
    let outBytes = 0;
    let errBytes = 0;
    let timedOut = false;
    let outputTruncated = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    // 保存バッファは常に上限以下に切り詰める（メモリ上限として機能させる — Codex R-code #2）
    const onChunk = (arr, chunk, kind) => {
      const used = kind === 'out' ? outBytes : errBytes;
      const room = maxOut - used;
      if (room > 0) {
        arr.push(room >= chunk.length ? chunk : chunk.subarray(0, room));
      }
      if (kind === 'out') outBytes += chunk.length; else errBytes += chunk.length;
      if (outBytes > maxOut || errBytes > maxOut) {
        outputTruncated = true;
        child.kill('SIGKILL');
      }
    };
    child.stdout.on('data', (c) => onChunk(out, c, 'out'));
    child.stderr.on('data', (c) => onChunk(err, c, 'err'));

    child.on('error', (e) => settle(reject, e));
    child.on('close', (code, signal) => {
      settle(resolve, {
        exitCode: code,
        signal,
        stdout: Buffer.concat(out).toString('utf8'),
        stderr: Buffer.concat(err).toString('utf8'),
        stdoutBytes: Buffer.concat(out),
        timedOut,
        outputTruncated,
        durationMs: Date.now() - start,
      });
    });

    // stdin: byte 完全送信 → 必ず close
    child.stdin.on('error', () => { /* EPIPE 等は close 側で確定させる */ });
    child.stdin.end(stdinBuf);
  });
}

module.exports = {
  spawnHookInSandbox,
  buildEnv,
  resolveHookPath,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_OUTPUT_BYTES,
};
