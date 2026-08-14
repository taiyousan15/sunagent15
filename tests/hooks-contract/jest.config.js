'use strict';
/**
 * hooks-contract 専用 Jest 設定（独立config — Codex Final B1解決）
 *
 * - main jest.config.js には登録しない（npm test 非包含・coverage対象外・transform非継承が構成上自明）
 * - 起動は scripts/run-hooks-contract.js（原子的単一入口）経由のみが正
 */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  transform: {},
  testTimeout: 20000,
  maxWorkers: 1,
  verbose: true,
};
