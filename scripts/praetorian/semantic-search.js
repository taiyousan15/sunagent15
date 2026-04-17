#!/usr/bin/env node
/**
 * Praetorian Semantic Search — Priority 1 Prototype
 *
 * 目的: TAISUN の Praetorian 全文索引に意味検索層を追加。
 *       外部依存ゼロ（transformers.js をオプションで追加可能）、完全可逆。
 *
 * 実装ステータス: **インターフェース定義のみ（スタブ）**
 *
 * 本格実装時のタスク:
 *   1. transformers.js を devDependencies に追加（optional）
 *   2. all-MiniLM-L6-v2 等の軽量モデル（22MB）で埋め込み生成
 *   3. .claude/praetorian/embeddings/ に cpt_*.vec（binary float32）を保存
 *   4. search(query, topK) で cosine similarity Top-K 返却
 *   5. フォールバック: transformers.js 未インストール時は既存の単語索引のみ使用
 *
 * 設計原則:
 *   - 既存の .toon + index.json は一切触らない
 *   - embedding は並列インデックスとして共存
 *   - 検索時は semantic + full-text の union or rerank
 *   - 完全にローカル（外部 API 呼び出しなし）
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const PRAETORIAN_DIR = path.join(PROJECT_ROOT, '.claude/praetorian');
const EMBED_DIR = path.join(PRAETORIAN_DIR, 'embeddings');

/**
 * Stub: 埋め込み生成（transformers.js 実装時に置換）
 * @param {string} text - 埋め込み対象テキスト
 * @returns {Promise<Float32Array>} 384 次元埋め込み（MiniLM-L6-v2）
 */
async function embed(_text) {
  throw new Error('semantic-search: embed() is a stub. Install transformers.js and implement.');
}

/**
 * Stub: cosine similarity
 */
function cosineSimilarity(_a, _b) {
  throw new Error('semantic-search: cosineSimilarity() is a stub.');
}

/**
 * Stub: Top-K 検索
 * @param {string} query
 * @param {number} topK - デフォルト 5
 * @returns {Promise<Array<{compactionId: string, score: number}>>}
 */
async function search(_query, _topK = 5) {
  // 現状: 未実装。既存の Praetorian 単語索引で検索を続けること。
  return [];
}

/**
 * Stub: コンパクション追加時に embedding を生成・保存
 */
async function indexCompaction(_compactionId, _content) {
  // Future: await embed(content) -> save to EMBED_DIR/${compactionId}.vec
  return null;
}

/**
 * ヘルスチェック: semantic search が利用可能か
 */
function isAvailable() {
  try {
    require.resolve('@xenova/transformers');
    return fs.existsSync(EMBED_DIR);
  } catch {
    return false;
  }
}

/**
 * 既存 .toon 一覧を取得（semantic index 対象）
 */
function listCompactions() {
  const dir = path.join(PRAETORIAN_DIR, 'compactions');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.startsWith('cpt_') && f.endsWith('.toon'));
}

module.exports = {
  embed,
  cosineSimilarity,
  search,
  indexCompaction,
  isAvailable,
  listCompactions,
  // meta
  PRAETORIAN_DIR,
  EMBED_DIR,
};

// CLI: status check
if (require.main === module) {
  const status = {
    stub: true,
    available: isAvailable(),
    praetorianDir: PRAETORIAN_DIR,
    embedDir: EMBED_DIR,
    compactionCount: listCompactions().length,
    instructions: [
      '1. npm install @xenova/transformers --save-dev',
      '2. Implement embed() using pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")',
      '3. Implement cosineSimilarity() and search()',
      '4. Run: node scripts/praetorian/build-embeddings.js (TODO)',
      '5. Integrate into hooks via semantic-search.js require',
    ],
  };
  console.log(JSON.stringify(status, null, 2));
}
