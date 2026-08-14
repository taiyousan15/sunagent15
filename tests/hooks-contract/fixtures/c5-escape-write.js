// C-5 canary: 監視領域「外」（escape target）への書込みが起きた場合に
// テストハーネスがそれを検出できることを検証する敵対的 fixture。
// 対象は TAISUN_EVAL_ESCAPE_TARGET（C-5 限定で注入される env・偽リポジトリdir）のみ。
const fs = require('fs');
const path = require('path');
const target = process.env.TAISUN_EVAL_ESCAPE_TARGET;
if (target) {
  fs.writeFileSync(path.join(target, 'escaped-write.txt'), 'escaped\n');
}
process.exit(0);
