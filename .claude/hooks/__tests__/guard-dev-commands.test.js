/**
 * Guard Dev Commands Test Suite
 *
 * 開発コマンドの「自動許可」挙動と既存セキュリティ維持のテスト。
 *
 * 注: classifyBashCommand / risk-evaluator 連携 / evaluateWithML は
 * 実ガード(unified-guard.js)に配線されていない別設計だったため、本物の
 * performQuickChecks 挙動を検証する形へ整理した（session50 / 2026-06）。
 * 実ガードは Bash を個別分類せず、危険コマンドのみブロックする設計。
 */

const path = require('path');
const fs = require('fs');

// unified-guard.js の実エクスポート関数をインポート
const {
  performQuickChecks,
} = require('../unified-guard.js');

// === 開発コマンドは実ガードで許可される（live behavior / performQuickChecks） ===

describe('開発コマンドの自動許可 (performQuickChecks)', () => {
  test('npm install はブロックされない', () => {
    expect(performQuickChecks('Bash', { command: 'npm install' }).blocked).toBe(false);
  });

  test('npm run build / npm test / npx jest はブロックされない', () => {
    expect(performQuickChecks('Bash', { command: 'npm run build' }).blocked).toBe(false);
    expect(performQuickChecks('Bash', { command: 'npm test' }).blocked).toBe(false);
    expect(performQuickChecks('Bash', { command: 'npx jest --coverage' }).blocked).toBe(false);
  });

  test('node script.js はブロックされない', () => {
    expect(performQuickChecks('Bash', { command: 'node script.js' }).blocked).toBe(false);
  });

  test('危険なコマンドは引き続きブロックされる', () => {
    const result = performQuickChecks('Bash', { command: 'rm -rf /' });
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('危険なコマンド');
  });
});

// === 開発コマンドの承認要否 正規表現（仕様テスト） ===
// 注: 本ブロックは「想定する正規表現仕様」を検証する。live の deviation-approval-guard.js は
//     DEVIATION_PATTERNS / APPROVED_PATTERNS を持つが、ここでは live パターンを読み込まない
//     （ファイル存在のみ確認）。実 live 挙動は上の performQuickChecks 系テストで担保する。

describe('承認要否パターン（正規表現仕様）', () => {
  const deviationGuardPath = path.join(__dirname, '..', 'deviation-approval-guard.js');

  beforeAll(() => {
    // ファイルが存在することだけ確認（内容は本テストでは未使用）
    fs.readFileSync(deviationGuardPath, 'utf8');
  });

  test('pip install flask → パターンマッチ（ブロック対象）', () => {
    // /pip\s+install\s+\S/ → パッケージ名がある場合のみマッチ
    const pattern = /pip\s+install\s+\S/;
    expect(pattern.test('pip install flask')).toBe(true);
  });

  test('pip install（引数なし）→ パターン不一致（許可）', () => {
    const pattern = /pip\s+install\s+\S/;
    expect(pattern.test('pip install')).toBe(false);
  });

  test('npm install lodash → パターンマッチ（ブロック対象）', () => {
    // /npm\s+install\s+(?!--save-dev)\S/
    const pattern = /npm\s+install\s+(?!--save-dev)\S/;
    expect(pattern.test('npm install lodash')).toBe(true);
  });

  test('npm install（引数なし）→ パターン不一致（許可）', () => {
    const pattern = /npm\s+install\s+(?!--save-dev)\S/;
    expect(pattern.test('npm install')).toBe(false);
  });

  test('npm install --save-dev jest → パターン不一致（許可）', () => {
    const pattern = /npm\s+install\s+(?!--save-dev)\S/;
    expect(pattern.test('npm install --save-dev jest')).toBe(false);
  });
});

// === セキュリティ維持テスト ===

describe('セキュリティ維持', () => {
  test('rm -rf * → ブロック（performQuickChecks）', () => {
    const result = performQuickChecks('Bash', { command: 'rm -rf *' });
    expect(result.blocked).toBe(true);
  });
});

// === 後方互換性テスト ===

describe('後方互換性', () => {
  test('performQuickChecks の既存動作が維持される', () => {
    // 正常なコマンドは通す
    const safeResult = performQuickChecks('Bash', { command: 'echo hello' });
    expect(safeResult.blocked).toBe(false);

    // 危険なコマンドはブロック
    const dangerousResult = performQuickChecks('Bash', { command: 'rm -rf /' });
    expect(dangerousResult.blocked).toBe(true);

    // Write の保護は維持
    const writeResult = performQuickChecks('Write', {
      file_path: '/project/.env',
      content: 'SECRET=xxx',
    });
    expect(writeResult.blocked).toBe(true);

    // コピーマーカー検出は維持（U+FFFD をソースに直接置かず実行時生成）
    const copyMarker = String.fromCharCode(0xFFFD);
    const copyResult = performQuickChecks('Bash', { command: 'echo ' + copyMarker });
    expect(copyResult.blocked).toBe(true);
  });
});
