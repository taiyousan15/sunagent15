#!/usr/bin/env node
/**
 * TAISUN Agent - Installation verification (post-install health check).
 *
 * Runs only LOCAL checks (no API calls, no network). Designed to catch
 * the "install succeeded visually but something is actually broken" failure
 * mode. Returns non-zero exit code when problems are detected, so that
 * install.sh and update.sh can signal failure correctly instead of printing
 * a success banner over a broken install.
 *
 * Usage:
 *   node scripts/verify-installation.js [REPO_DIR]
 *
 * Checks performed:
 *   1. CLAUDE.md present in .claude/
 *   2. .claude/hooks/*.js files exist and are counted dynamically
 *   3. All hook commands in .claude/settings.json reference existing files
 *      (guards against the 'hook typo' silent-skip failure mode)
 *   4. ~/.claude/skills/* symlinks (Mac/Linux) are not dangling
 *   5. ~/.claude/agents/*.md files exist (Windows or Mac post-setup)
 *   6. package.json version matches README.md first version row
 *   7. JSON files (.mcp.json, .claude/settings.json) are parseable
 *
 * Exit codes:
 *   0: all checks passed
 *   1: one or more Critical issues (blocks further automation)
 *   2: Warnings only (user attention recommended)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const repoDir = process.argv[2] || process.cwd();
const home = os.homedir();

const results = { critical: [], warning: [], ok: [] };

function crit(msg) { results.critical.push(msg); }
function warn(msg) { results.warning.push(msg); }
function ok(msg) { results.ok.push(msg); }

function jsonParseable(p) {
  try {
    JSON.parse(fs.readFileSync(p, 'utf8'));
    return true;
  } catch (e) {
    return false;
  }
}

// Check 1: CLAUDE.md
const claudeMd = path.join(repoDir, '.claude', 'CLAUDE.md');
if (fs.existsSync(claudeMd)) {
  ok('設定ファイル (.claude/CLAUDE.md)');
} else {
  crit(`必須ファイル不在: ${claudeMd}`);
}

// Check 2: hooks dynamic count
const hooksDir = path.join(repoDir, '.claude', 'hooks');
let hookFiles = [];
if (fs.existsSync(hooksDir)) {
  try {
    hookFiles = fs
      .readdirSync(hooksDir)
      .filter((f) => f.endsWith('.js'));
    ok(`フック: ${hookFiles.length} 個`);
  } catch (e) {
    crit(`フックディレクトリ読み込み失敗: ${e.message}`);
  }
} else {
  crit(`フックディレクトリ不在: ${hooksDir}`);
}

// Check 3: hook commands in settings.json point to existing files
const projSettings = path.join(repoDir, '.claude', 'settings.json');
if (fs.existsSync(projSettings)) {
  if (!jsonParseable(projSettings)) {
    crit(`.claude/settings.json が壊れています（JSON 不正）`);
  } else {
    const s = JSON.parse(fs.readFileSync(projSettings, 'utf8'));
    let bad = 0;
    let total = 0;
    for (const eventName of Object.keys(s.hooks || {})) {
      for (const entry of s.hooks[eventName]) {
        for (const hk of entry.hooks || []) {
          total++;
          const cmd = String(hk.command || '');
          const m = cmd.match(/node\s+([^\s]+\.js)/);
          if (m) {
            const abs = path.isAbsolute(m[1]) ? m[1] : path.join(repoDir, m[1]);
            if (!fs.existsSync(abs)) {
              bad++;
              warn(`hook 参照先が存在しません: ${m[1]} (${eventName})`);
            }
          }
        }
      }
    }
    if (bad === 0 && total > 0) ok(`hook 参照検証: ${total}/${total} OK`);
  }
} else {
  warn(`.claude/settings.json が未設定（これは初回インストール前なら正常）`);
}

// Check 4: ~/.claude/skills dangling symlink detection (non-blocking, async spirit)
const userSkills = path.join(home, '.claude', 'skills');
if (fs.existsSync(userSkills)) {
  try {
    let dangling = 0;
    let linkCount = 0;
    for (const entry of fs.readdirSync(userSkills)) {
      const p = path.join(userSkills, entry);
      let stat;
      try { stat = fs.lstatSync(p); } catch (_) { continue; }
      if (!stat.isSymbolicLink()) continue;
      linkCount++;
      // -L && -e: link points to something that actually exists
      try {
        fs.statSync(p); // follows the link; throws if dangling
      } catch (_) {
        dangling++;
      }
    }
    if (dangling > 0) {
      warn(
        `壊れたスキルリンク: ${dangling}/${linkCount} 件（taisun_agent フォルダを移動した場合に発生）。\n` +
        `    → 修復: bash scripts/install.sh`
      );
    } else if (linkCount > 0) {
      ok(`スキルリンク: ${linkCount}/${linkCount} 健全`);
    }
  } catch (e) {
    warn(`スキルリンクチェック失敗: ${e.message}`);
  }
}

// Check 5: ~/.claude/agents existence + count
const userAgents = path.join(home, '.claude', 'agents');
if (fs.existsSync(userAgents)) {
  try {
    const count = fs
      .readdirSync(userAgents)
      .filter((f) => f.endsWith('.md')).length;
    ok(`エージェント: ${count} 個`);
  } catch (_) {
    warn(`~/.claude/agents/ 読み込み失敗`);
  }
}

// Check 6: version match (package.json vs README.md first version row)
const pkgPath = path.join(repoDir, 'package.json');
const readmePath = path.join(repoDir, 'README.md');
if (fs.existsSync(pkgPath) && fs.existsSync(readmePath)) {
  try {
    const pkgVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
    const readme = fs.readFileSync(readmePath, 'utf8');
    const m = readme.match(/v(\d+\.\d+\.\d+)/);
    if (m) {
      const readmeVersion = m[1];
      if (readmeVersion === pkgVersion) {
        ok(`バージョン整合: v${pkgVersion}`);
      } else {
        warn(
          `バージョン不整合: package.json=${pkgVersion} vs README=${readmeVersion}`
        );
      }
    }
  } catch (_) {
    /* best-effort */
  }
}

// Check 7: .mcp.json parseability
const mcpJson = path.join(repoDir, '.mcp.json');
if (fs.existsSync(mcpJson)) {
  if (!jsonParseable(mcpJson)) crit(`.mcp.json が壊れています（JSON 不正）`);
  else ok('.mcp.json 構文');
}

// Report
const line = '─'.repeat(56);
console.log('');
console.log(line);
console.log('  TAISUN Agent インストール検証');
console.log(line);
for (const m of results.ok) console.log(`  ✅ ${m}`);
for (const m of results.warning) console.log(`  ⚠️  ${m}`);
for (const m of results.critical) console.log(`  ❌ ${m}`);
console.log(line);
console.log(
  `  結果: OK ${results.ok.length} / 警告 ${results.warning.length} / 重大 ${results.critical.length}`
);
console.log(line);
console.log('');

if (results.critical.length > 0) process.exit(1);
if (results.warning.length > 0) process.exit(2);
process.exit(0);
