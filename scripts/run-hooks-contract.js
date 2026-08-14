#!/usr/bin/env node
'use strict';
/**
 * run-hooks-contract — hook 契約テストの原子的単一入口（Codex Final B2/B5 解決）
 *
 * `npm run eval:hooks` はこのスクリプトのみを指す。実施内容（不可分）:
 *   1. stage を tests/hooks-contract/stage.json のみから決定（env 上書き機構なし）
 *   2. expected-cases.json[stage] を検証（空・重複 FAIL）
 *   3. 実 worktree の git status を before/after で比較（増分差分 = 逸脱書込み検出）
 *   4. Jest（独立config・--runInBand・--json）を実行
 *   5. 実行された assertionResults の fullName 集合を期待集合と双方向比較
 *      （欠落 / 余剰 / 重複 / passed 以外の status（skip・todo・pending・failed）は FAIL）
 *   6. 全て成功した場合のみ exit 0
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const HC_DIR = path.join(REPO_ROOT, 'tests', 'hooks-contract');
const STAGE_FILE = path.join(HC_DIR, 'stage.json');
const EXPECTED_FILE = path.join(HC_DIR, 'expected-cases.json');
const JEST_CONFIG = path.join(HC_DIR, 'jest.config.js');

function fail(msg) {
  console.error(`[hooks-contract] FAIL: ${msg}`);
  process.exit(1);
}

/**
 * 実 worktree のフィンガープリント（Codex R-code #3）:
 *  - git 失敗は FAIL（fail-open 禁止）
 *  - porcelain -uall で untracked を個別ファイル列挙し、変更系/未追跡の各ファイル内容 sha256 を含める
 *    → 既に dirty なファイルの「内容の再変更」も検出できる
 */
function worktreeFingerprint() {
  const crypto = require('crypto');
  // -z: NUL 区切り・パス無クオート（日本語パスの octal クオート問題を回避）
  const r = spawnSync('git', ['status', '--porcelain', '-uall', '-z'], { cwd: REPO_ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    fail(`git status が失敗しました（worktree 検査は必須ゲート）: ${r.stderr || r.status}`);
  }
  const tokens = r.stdout.split('\0').filter(Boolean);
  const entries = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const status = tok.slice(0, 2);
    const p = tok.slice(3);
    entries.push({ status, path: p });
    if (status[0] === 'R' || status[0] === 'C') i++; // rename/copy は次トークンが旧パス
  }
  entries.sort((x, y) => (x.path < y.path ? -1 : 1));
  const parts = [];
  for (const { status, path: p } of entries) {
    const line = `${status} ${p}`;
    const abs = path.join(REPO_ROOT, p);
    let hash = 'MISSING';
    try {
      const st = fs.statSync(abs);
      if (st.isFile()) {
        hash = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').slice(0, 16);
      } else {
        hash = 'DIR';
      }
    } catch {
      hash = 'MISSING';
    }
    parts.push(`${line}#${hash}`);
  }
  return parts.join('\n');
}

/** canonical JSON（キー再帰ソート）の SHA-256（Codex R-code #4 / 計画 B5） */
function canonicalDigest(files) {
  const crypto = require('crypto');
  const canon = (v) => {
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v).sort()) o[k] = canon(v[k]);
      return o;
    }
    return v;
  };
  const h = crypto.createHash('sha256');
  for (const f of files.sort()) {
    h.update(path.relative(HC_DIR, f)); // 場所非依存（相対パス）で拘束
    h.update('\0');
    h.update(JSON.stringify(canon(JSON.parse(fs.readFileSync(f, 'utf8')))));
    h.update('\0');
  }
  return h.digest('hex');
}

function main() {
  // 1. stage（stage.json のみ・env 不参照）
  let stage;
  try {
    const parsed = JSON.parse(fs.readFileSync(STAGE_FILE, 'utf8'));
    stage = parsed.stage;
  } catch (e) {
    fail(`stage.json を読めません: ${e.message}`);
  }
  if (stage !== 'G-PR4' && stage !== 'G-PR1c') {
    fail(`未知の stage: ${stage}`);
  }

  // 2. 期待集合
  let expectedAll;
  try {
    expectedAll = JSON.parse(fs.readFileSync(EXPECTED_FILE, 'utf8'));
  } catch (e) {
    fail(`expected-cases.json を読めません: ${e.message}`);
  }
  const expected = expectedAll[stage];
  if (!Array.isArray(expected) || expected.length === 0) {
    fail(`stage ${stage} の期待ケース集合が空/不在です`);
  }
  if (new Set(expected).size !== expected.length) {
    fail(`expected-cases.json[${stage}] に重複があります`);
  }

  // 2.5 契約 digest 照合（契約・期待集合・allowlist の意味論をレビュー済み固定値へ拘束）
  const contractsDir = path.join(HC_DIR, 'contracts');
  const digestInputs = [
    STAGE_FILE,
    EXPECTED_FILE,
    path.join(HC_DIR, 'hook-allowlist.json'),
    ...fs.readdirSync(contractsDir).filter((f) => f.endsWith('.json')).map((f) => path.join(contractsDir, f)),
  ];
  const digest = canonicalDigest(digestInputs);
  const digestFile = path.join(HC_DIR, 'contracts.digest');
  if (process.argv.includes('--write-digest')) {
    fs.writeFileSync(digestFile, digest + '\n');
    console.log(`[hooks-contract] contracts.digest 更新: ${digest}`);
    process.exit(0);
  }
  let pinned;
  try {
    pinned = fs.readFileSync(digestFile, 'utf8').trim();
  } catch (e) {
    fail(`contracts.digest を読めません（--write-digest で生成し、レビューを経てコミットしてください）: ${e.message}`);
  }
  if (pinned !== digest) {
    fail(`契約 digest 不一致: 契約/期待集合/allowlist が contracts.digest とズレています。意図的な変更なら --write-digest で更新し、digest 差分込みでレビューへ。\n  pinned : ${pinned}\n  current: ${digest}`);
  }

  // 3. worktree before
  const worktreeBefore = worktreeFingerprint();

  // 4. Jest 実行（独立config）
  const jestBin = path.join(REPO_ROOT, 'node_modules', 'jest', 'bin', 'jest.js');
  if (!fs.existsSync(jestBin)) fail(`jest が見つかりません: ${jestBin}（npm ci を実行してください）`);
  const jsonOut = path.join(HC_DIR, '.last-run.json');
  const r = spawnSync(process.execPath, [
    jestBin,
    '--config', JEST_CONFIG,
    '--runInBand',
    '--json',
    `--outputFile=${jsonOut}`,
  ], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });

  // 5. worktree after（.last-run.json 自体は比較前に削除して除外）
  let results;
  try {
    results = JSON.parse(fs.readFileSync(jsonOut, 'utf8'));
  } catch (e) {
    fail(`Jest JSON 結果を読めません: ${e.message}`);
  } finally {
    fs.rmSync(jsonOut, { force: true });
  }

  const worktreeAfter = worktreeFingerprint();
  if (worktreeBefore !== worktreeAfter) {
    const b = new Set(worktreeBefore.split('\n'));
    const a = new Set(worktreeAfter.split('\n'));
    const changed = [...a].filter((x) => !b.has(x)).concat([...b].filter((x) => !a.has(x)));
    fail(`テスト実行が実 worktree を変更しました（sandbox 逸脱）:\n  ${changed.join('\n  ')}`);
  }

  // 6. fullName 集合の双方向照合
  const actual = [];
  const badStatus = [];
  for (const tr of results.testResults || []) {
    for (const ar of tr.assertionResults || []) {
      const fullName = [...(ar.ancestorTitles || []), ar.title].join(' ');
      actual.push(fullName);
      if (ar.status !== 'passed') {
        badStatus.push(`${fullName} [${ar.status}]`);
      }
    }
  }
  if (new Set(actual).size !== actual.length) {
    const seen = new Set();
    const dups = actual.filter((n) => (seen.has(n) ? true : (seen.add(n), false)));
    fail(`実行された fullName に重複があります: ${JSON.stringify(dups)}`);
  }
  if (badStatus.length > 0) {
    fail(`passed 以外の status を検出（skip/todo/pending/failed は許可されません）:\n  ${badStatus.join('\n  ')}`);
  }
  const actualSet = new Set(actual);
  const missing = expected.filter((n) => !actualSet.has(n));
  const expectedSet = new Set(expected);
  const extra = actual.filter((n) => !expectedSet.has(n));
  if (missing.length > 0) {
    fail(`期待ケースが実行されていません（欠落 ${missing.length}件）:\n  ${missing.join('\n  ')}`);
  }
  if (extra.length > 0) {
    fail(`期待集合に無いテストが実行されました（余剰 ${extra.length}件・expected-cases.json の更新が必要）:\n  ${extra.join('\n  ')}`);
  }
  if (r.status !== 0) {
    fail(`Jest が非ゼロ終了しました (exit ${r.status})`);
  }

  console.log(`[hooks-contract] PASS: stage=${stage} cases=${actual.length}/${expected.length}（双方向一致・全passed・worktree無変化）`);
  process.exit(0);
}

main();
