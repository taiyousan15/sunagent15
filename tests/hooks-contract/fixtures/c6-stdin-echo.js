// C-6a/C-6b canary: stdin を byte 完全一致で stdout へエコー
// （通常 JSON と shell メタ文字入り入力が、shell 展開されず一字一句届くことを検証）
const chunks = [];
process.stdin.on('data', (c) => chunks.push(c));
process.stdin.on('end', () => {
  process.stdout.write(Buffer.concat(chunks));
  process.exit(0);
});
