'use strict';
/**
 * hooks-contract sandbox — 4+2 領域分離サンドボックス
 *
 * 領域 (Codex Pivot 条件2 / Final B3):
 *   sb.pluginRoot   : CLAUDE_PLUGIN_ROOT。hookTreeDir = <pluginRoot>/.claude/hooks（実hookのコピー）
 *   sb.projectDir   : hookへ渡す cwd / envelope.cwd（package.json マーカーでroot検出を固定）
 *   sb.stateDir     : CLAUDE_PLUGIN_DATA 代替
 *   sb.homeDir      : HOME 隔離（session-handoff-generator の Desktop スキャン封じ込め）
 *   sb.tmpDir       : TMPDIR/TMP/TEMP 隔離
 *   sb.projectsRoot : CLAUDE_PROJECTS_DIR（空dir。sibling スキャンの封じ込め）
 *   sb.escapeTarget : C-5 escape canary 専用（監視5領域の「外」として契約定義）
 *
 * 所有権 (Codex Final B2): createSandbox()/destroySandbox() は呼び出し側が所有。
 * 通常ケースはヘルパ withSandbox() が生成/破棄、冪等テストは自身で保持して2回spawnする。
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HOOKS_SRC = path.join(REPO_ROOT, '.claude', 'hooks');

// コピー除外（実行時生成物・巨大物のみ。utils/ lib/ config/ は挙動に必要なため含める）
const COPY_EXCLUDE = new Set(['data', 'node_modules', 'DEFERRED.md']);

/** symlink を拒否しつつ再帰コピー（Codex 計画ゲート条件3: symlink拒否） */
function copyTreeRejectingSymlinks(src, dst) {
  const st = fs.lstatSync(src);
  if (st.isSymbolicLink()) {
    throw new Error(`symlink is not allowed in hook tree copy: ${src}`);
  }
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (COPY_EXCLUDE.has(name)) continue;
      copyTreeRejectingSymlinks(path.join(src, name), path.join(dst, name));
    }
    return;
  }
  if (st.isFile()) {
    fs.copyFileSync(src, dst);
  }
  // FIFO/socket 等はコピーしない（存在しない想定）
}

function createSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-contract-'));
  const sb = {
    root,
    pluginRoot: path.join(root, 'plugin'),
    projectDir: path.join(root, 'project'),
    stateDir: path.join(root, 'state'),
    homeDir: path.join(root, 'home'),
    tmpDir: path.join(root, 'tmp'),
    projectsRoot: path.join(root, 'projects-root'),
    escapeTarget: path.join(root, 'escape-target'),
  };
  for (const key of ['pluginRoot', 'projectDir', 'stateDir', 'homeDir', 'tmpDir', 'projectsRoot', 'escapeTarget']) {
    fs.mkdirSync(sb[key], { recursive: true });
  }
  sb.hookTreeDir = path.join(sb.pluginRoot, '.claude', 'hooks');
  copyTreeRejectingSymlinks(HOOKS_SRC, sb.hookTreeDir);
  // agent-trace-capture の findProjectRoot() を projectDir に固定するマーカー
  fs.writeFileSync(
    path.join(sb.projectDir, 'package.json'),
    JSON.stringify({ name: 'hooks-contract-sandbox-project', private: true }, null, 2) + '\n'
  );
  return sb;
}

function destroySandbox(sb) {
  // 再帰削除の厳密ガード（Codex R-code #5）: realpath の親が os.tmpdir() 実体で、
  // basename が mkdtemp 由来の 'hooks-contract-' 接頭辞である場合のみ削除する
  if (!sb || !sb.root) return;
  let real;
  try {
    real = fs.realpathSync(sb.root);
  } catch {
    return; // 既に消えている
  }
  const tmpReal = fs.realpathSync(os.tmpdir());
  const parentOk = path.dirname(real) === tmpReal;
  const baseOk = path.basename(real).startsWith('hooks-contract-');
  if (!parentOk || !baseOk) {
    throw new Error(`refusing to delete non-sandbox path: ${real}`);
  }
  fs.rmSync(real, { recursive: true, force: true });
}

/** 通常ケース用: sandbox の生成→fn→破棄（所有権はこのヘルパ） */
async function withSandbox(fn) {
  const sb = createSandbox();
  try {
    return await fn(sb);
  } finally {
    destroySandbox(sb);
  }
}

// ===== 副作用スナップショット（差分増分比較・Codex Pivot 条件6） =====

/** 監視対象5領域（escapeTarget は契約上「外」なので含めない） */
function monitoredDirs(sb) {
  return [sb.projectDir, sb.stateDir, sb.homeDir, sb.tmpDir, sb.pluginRoot];
}

function walkFiles(dir, base, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkFiles(full, base, out);
    } else if (ent.isFile()) {
      const st = fs.statSync(full);
      const buf = st.size <= 1024 * 1024 ? fs.readFileSync(full) : null;
      out[path.relative(base, full)] = {
        size: st.size,
        hash: buf ? crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16) : `size:${st.size}`,
      };
    }
  }
}

/** sandbox 内の全ファイル状態を {領域名: {relpath: {size,hash}}} で取得 */
function snapshotSandbox(sb) {
  const snap = {};
  const names = ['projectDir', 'stateDir', 'homeDir', 'tmpDir', 'pluginRoot'];
  for (const name of names) {
    snap[name] = {};
    walkFiles(sb[name], sb[name], snap[name]);
  }
  return snap;
}

/** before/after の差分（created/modified/deleted を領域別 relpath で返す） */
function diffSnapshots(before, after) {
  const diff = { created: [], modified: [], deleted: [] };
  for (const area of Object.keys(after)) {
    const b = before[area] || {};
    const a = after[area] || {};
    for (const rel of Object.keys(a)) {
      if (!(rel in b)) diff.created.push(`${area}:${rel}`);
      else if (b[rel].hash !== a[rel].hash) diff.modified.push(`${area}:${rel}`);
    }
    for (const rel of Object.keys(b)) {
      if (!(rel in a)) diff.deleted.push(`${area}:${rel}`);
    }
  }
  diff.created.sort();
  diff.modified.sort();
  diff.deleted.sort();
  return diff;
}

module.exports = {
  REPO_ROOT,
  createSandbox,
  destroySandbox,
  withSandbox,
  monitoredDirs,
  snapshotSandbox,
  diffSnapshots,
};
