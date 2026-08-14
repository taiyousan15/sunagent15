// C-4 canary: 既知の副作用（cwd = sandbox projectDir へのファイル作成）を
// スナップショット差分が正しく検出できることを検証
const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join(process.cwd(), 'c4-known-side-effect.txt'), 'c4\n');
process.exit(0);
