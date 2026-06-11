#!/usr/bin/env node
/**
 * Violation Recorder - ルール違反の記録
 *
 * 他のガードフックが検出した違反を.claude/rules/mistakes.mdに記録します。
 * これにより、同じミスの再発を防止できます。
 *
 * 使用方法:
 * node violation-recorder.js "違反内容" "発生場所" "対策"
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    process.exit(0);
    return;
  }

  const violation = args[0] || 'Unknown violation';
  const location = args[1] || 'Unknown';
  const remedy = args[2] || 'Follow the mandatory pre-flight checks';

  // テスト時は VIOLATION_RECORDER_TARGET で書込先を差し替え可能
  const mistakesPath = process.env.VIOLATION_RECORDER_TARGET ||
    path.join(__dirname, '..', 'rules', 'mistakes.md');

  // 新しい違反エントリ
  const timestamp = new Date().toISOString();
  const entry = `
## ${timestamp}

**違反**: ${violation}
**場所**: ${location}
**対策**: ${remedy}

---
`;

  const header = `# Mistakes Ledger（ミス台帳）

このファイルは自動的に記録された違反・ミスのログです。
同じミスを繰り返さないために、作業開始前に確認してください。

---
`;

  // 書き込みは追記（O_APPEND）のみで行い、既存ファイルへの全文書き戻しは一切しない:
  //   - read-modify-write は並行呼出で lost-update になる
  //   - 読み取り不能なファイルへのテンプレート書き戻しは台帳消失になる
  // ヘッダーは 'wx'（新規作成時のみ成功・既存なら EEXIST）で一度だけ作成し、
  // 既存の空ファイルには append で補う。並行初回作成時に稀にヘッダーが重複し得るが、
  // エントリの欠落・既存内容の消失は起きない。
  try {
    const fd = fs.openSync(mistakesPath, 'wx');
    fs.writeSync(fd, header);
    fs.closeSync(fd);
  } catch (e) { /* EEXIST = 既存ファイル。それ以外も fail-open */ }

  try {
    if (fs.statSync(mistakesPath).size === 0) {
      fs.appendFileSync(mistakesPath, header, 'utf8');
    }
  } catch (e) { /* fail-open */ }

  try {
    fs.appendFileSync(mistakesPath, entry, 'utf8');
  } catch (e) { /* fail-open */ }

  process.exit(0);
}

main().catch(() => process.exit(0));
