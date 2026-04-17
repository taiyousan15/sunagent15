#!/usr/bin/env node
/**
 * Claude-Mem Projection Benchmark
 *
 * claude-mem (thedotmack/claude-mem) を実インストールせず、
 * 公開された設計仕様から TAISUN への導入効果を推計する。
 *
 * 比較対象:
 *   A. 現状の TAISUN: Praetorian 3-layer + hooks-based auto-capture
 *   B. claude-mem 導入後（予測値）: SQLite FTS5 + Chroma Vector DB
 *
 * 出力: 両設計のトークン推計、重複機能、真の追加価値、推奨判定
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_DIR = path.resolve(__dirname, '../..');

// ===================================================================
// A. TAISUN 現状の測定
// ===================================================================

function measureTaisunBaseline() {
  const result = {
    system: 'TAISUN Praetorian 3-Layer',
    components: {},
  };

  // Praetorian index サイズ
  const praetorianDir = path.join(REPO_DIR, '.claude/praetorian');
  if (fs.existsSync(praetorianDir)) {
    let fileCount = 0, totalBytes = 0;
    function walk(d) {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile()) {
          fileCount++;
          totalBytes += fs.statSync(full).size;
        }
      }
    }
    walk(praetorianDir);
    result.components.praetorian = {
      fileCount,
      totalBytes,
      estimatedTokens: Math.ceil(totalBytes / 2.8),
    };
  }

  // Context snapshot hooks (pre-compact-save, context-snapshot-manager)
  const hookFiles = [
    '.claude/hooks/pre-compact-save.js',
    '.claude/hooks/context-snapshot-manager.js',
    '.claude/hooks/compact-optimizer.js',
  ];
  result.components.hooks = [];
  for (const rel of hookFiles) {
    const abs = path.join(REPO_DIR, rel);
    if (fs.existsSync(abs)) {
      const bytes = fs.statSync(abs).size;
      result.components.hooks.push({
        path: rel,
        bytes,
        tokens: Math.ceil(bytes / 2.8),
      });
    }
  }

  // Session temp-context directory sampling
  const tempDir = path.join(REPO_DIR, '.claude/temp-context');
  if (fs.existsSync(tempDir)) {
    const entries = fs.readdirSync(tempDir);
    result.components.tempContext = {
      sessionCount: entries.filter(e => fs.statSync(path.join(tempDir, e)).isDirectory()).length,
    };
  }

  // Estimated context injection at session start (CLAUDE.md chain)
  const injection = ['.claude/CLAUDE.md', '.claude/references/CLAUDE-L2.md'];
  let injectedTokens = 0;
  for (const rel of injection) {
    const abs = path.join(REPO_DIR, rel);
    if (fs.existsSync(abs)) {
      const bytes = fs.statSync(abs).size;
      injectedTokens += Math.ceil(bytes / 2.8);
    }
  }
  result.sessionInjection = { tokens: injectedTokens, method: 'static CLAUDE.md chain' };

  return result;
}

// ===================================================================
// B. claude-mem 導入後の予測
// ===================================================================

function projectClaudeMem() {
  // claude-mem 公開仕様（thedotmack/claude-mem README）:
  // - 6 hook scripts (SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd + pre-hook)
  // - SQLite FTS5 storage
  // - Chroma vector DB for semantic search
  // - Layer 1 search: ~50-100 tokens/result
  // - Layer 3 get_observations: ~500-1000 tokens/result
  // - Claim: ~10x token savings via filter-before-fetch

  return {
    system: 'claude-mem (projected)',
    components: {
      hooks: 6, // スクリプト数
      storage: { type: 'SQLite+FTS5+Chroma', location: '~/.claude-mem/' },
    },
    sessionInjection: {
      // 搭載時に1セッションで投入されると推測されるトークン:
      // - 過去N件の検索結果（Layer 1）: 50 x 5 = 250 tokens
      // - 関連性高いもの詳細展開（Layer 3）: 500 x 2 = 1,000 tokens
      tokens: 1250,
      method: 'dynamic semantic-search injection',
    },
    tokenSavingsClaim: '10x (per call, Layer 1 vs Layer 3)',
    uninstallable: false, // no documented procedure
    configLocation: '~/.claude-mem/settings.json (not ~/.claude/settings.json)',
  };
}

// ===================================================================
// 比較分析
// ===================================================================

function analyze(taisun, claudeMem) {
  const analysis = {
    overlap: [
      'Both: Stop + SessionEnd hooks for memory persistence',
      'Both: PostToolUse hook for context tracking',
      'Both: Session-level context injection',
    ],
    uniqueToTaisun: [
      'Workflow Fidelity Contract enforcement (hook-based)',
      'Praetorian full-text index of 245+ past compactions (currently)',
      'mistakes.md ledger integration',
      'agent-checkpoint-guard (Agent-specific contract)',
      'Deep hook ecosystem (62 hooks)',
    ],
    uniqueToClaudeMem: [
      'Chroma vector semantic search (TAISUN has full-text only)',
      '3-layer filter-before-fetch protocol',
      'Standalone settings file (no conflict with main Claude Code)',
      'npx one-liner install',
    ],
    risks: {
      installation: 'no documented uninstall command',
      overlap_risk: 'double memory capture (TAISUN hooks + claude-mem hooks) could double-log',
      storage_duplication: 'past 245 compactions already in Praetorian, re-indexing into Chroma adds disk+tokens',
    },
  };

  // トークン効率の projected 比較
  const taisunBaseline = taisun.sessionInjection.tokens;
  const claudeMemBaseline = claudeMem.sessionInjection.tokens;

  analysis.projectedEffect = {
    taisun_session_start_tokens: taisunBaseline,
    claude_mem_session_start_tokens: claudeMemBaseline,
    delta: claudeMemBaseline - taisunBaseline,
    // 10x savings claim applies to per-call retrieval,
    // not session-start injection. For large sessions with many memory queries:
    perQuery_layer1_tokens: 50,
    perQuery_layer3_tokens: 500,
    savings_per_query_vs_fulltext: '~90% for Layer 1 preview, 0% for Layer 3 detail',
    verdict: (() => {
      // TAISUN's Praetorian already has search-based retrieval in most hooks.
      // claude-mem adds semantic search (relevance ranking) which TAISUN lacks.
      // The 10x claim is measured against no-filtering baseline, not against
      // TAISUN's existing full-text Praetorian.
      return 'Real additive value = semantic search + Chroma embeddings. Not the "10x" headline.';
    })(),
  };

  return analysis;
}

// ===================================================================
// Recommendation
// ===================================================================

function recommend(taisun, claudeMem, analysis) {
  return {
    priority: 'P2 (not P1)',
    reasoning: [
      '1. TAISUN already has 3-layer context backup (pre-compact + temp-context + Praetorian)',
      '2. The "10x" claim compares Layer 1 (preview) vs Layer 3 (detail), not total savings',
      '3. TAISUN has no semantic search — that is the real gap worth filling',
      '4. claude-mem has no documented uninstall — installing it is a partial one-way commitment',
      '5. Double-hook risk: both systems hooking Stop/PostToolUse could corrupt state',
    ],
    alternative: [
      'A. Add semantic search layer to Praetorian (uses TAISUN existing infra, full control)',
      'B. Implement claude-mem patterns in TAISUN hooks (inspired by, not installed)',
      'C. Install claude-mem in isolation (separate Claude Code profile) for benchmark only',
    ],
    recommended_path: 'Alternative A: add semantic search to Praetorian as opt-in feature. Avoid installing claude-mem until reversibility is documented.',
    measurement_plan: [
      'Phase 1 (this script): design comparison — DONE',
      'Phase 2: implement semantic search prototype on Praetorian',
      'Phase 3: re-run token-baseline.js + query-accuracy benchmark',
      'Phase 4: if 20%+ improvement measured, merge prototype',
    ],
  };
}

// ===================================================================
// Main
// ===================================================================

function main() {
  const taisun = measureTaisunBaseline();
  const claudeMem = projectClaudeMem();
  const analysis = analyze(taisun, claudeMem);
  const recommendation = recommend(taisun, claudeMem, analysis);

  const report = {
    generatedAt: new Date().toISOString(),
    method: 'design-level projection (no installation)',
    source: 'https://github.com/thedotmack/claude-mem (verified 2026-04-17)',
    taisun,
    claude_mem_projection: claudeMem,
    analysis,
    recommendation,
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
