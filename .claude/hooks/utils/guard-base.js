'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

function logSkip(logPath, entry) {
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch (e) { /* fail-open */ }
}

async function runGuard(hookName, checkFn) {
  const timer = setTimeout(() => process.exit(0), 3000);
  timer.unref();

  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const input = Buffer.concat(chunks).toString('utf8');
    if (!input) {
      process.exit(0);
      return;
    }

    const data = JSON.parse(input);
    const result = checkFn(data.tool_name, data.tool_input || {});
    if (result) {
      console.log(JSON.stringify(result));
    }
    process.exit(0);
  } catch (e) {
    console.error(`${hookName} main error:`, e.message);
    process.exit(0);
  }
}

module.exports = { logSkip, runGuard, PROJECT_ROOT };
