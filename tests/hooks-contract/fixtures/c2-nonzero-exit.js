// C-2 canary: 非ゼロ終了 + stderr（exitCode/stderr の区別を検証）
process.stderr.write('c2-canary-stderr\n');
process.exit(3);
