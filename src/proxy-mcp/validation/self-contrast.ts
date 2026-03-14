/**
 * Self-Contrast — 複数視点の差分検出
 *
 * 同一テキスト内で矛盾を検出する強化版。
 * numerical / logical / temporal / factual の4タイプを検出。
 */

import { recordEvent } from '../observability';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Contradiction {
  claimA: string;
  claimB: string;
  contradictionType: 'numerical' | 'logical' | 'temporal' | 'factual';
  confidence: number;
}

export interface SelfContrastResult {
  passed: boolean;
  contrastScore: number;
  contradictions: Contradiction[];
  correctionPrompt?: string;
}

// ──────────────────────────────────────────────
// Sentence Extraction
// ──────────────────────────────────────────────

function extractSentences(text: string): string[] {
  return text
    .split(/[。．\n]|(?<=[^A-Z])\. /)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

function getSharedKeywords(a: string, b: string): string[] {
  const aWords = a.toLowerCase().split(/\s+|[、。！？]/).filter(w => w.length > 2);
  const bLower = b.toLowerCase();
  return aWords.filter(w => bLower.includes(w));
}

// ──────────────────────────────────────────────
// Contradiction Detectors
// ──────────────────────────────────────────────

function detectNumerical(sentences: string[]): Contradiction[] {
  const results: Contradiction[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const a = sentences[i];
    const aNumbers = [...a.matchAll(/\d+(?:\.\d+)?/g)].map(m => parseFloat(m[0]));
    if (aNumbers.length === 0) continue;

    for (let j = i + 1; j < sentences.length; j++) {
      const b = sentences[j];
      const bNumbers = [...b.matchAll(/\d+(?:\.\d+)?/g)].map(m => parseFloat(m[0]));
      if (bNumbers.length === 0) continue;

      const shared = getSharedKeywords(a, b);
      if (shared.length < 2) continue;

      const hasConflict = aNumbers.some(an =>
        bNumbers.some(
          bn => bn !== an && Math.abs(bn - an) / Math.max(an, 1) > 0.1
        )
      );

      if (hasConflict) {
        results.push({
          claimA: a.substring(0, 120),
          claimB: b.substring(0, 120),
          contradictionType: 'numerical',
          confidence: Math.min(0.9, 0.5 + shared.length * 0.1),
        });
      }
    }
  }

  return results;
}

function detectLogical(sentences: string[]): Contradiction[] {
  const results: Contradiction[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const a = sentences[i];

    for (let j = i + 1; j < sentences.length; j++) {
      const b = sentences[j];
      const shared = getSharedKeywords(a, b);
      if (shared.length < 2) continue;

      const aAffirm = /はBだ|できる|である|です|あります|存在する/.test(a);
      const bNegate = /はBではない|できない|ではない|ありません|存在しない/.test(b);
      const aNegate = /はBではない|できない|ではない|ありません|存在しない/.test(a);
      const bAffirm = /はBだ|できる|である|です|あります|存在する/.test(b);

      if ((aAffirm && bNegate) || (aNegate && bAffirm)) {
        results.push({
          claimA: a.substring(0, 120),
          claimB: b.substring(0, 120),
          contradictionType: 'logical',
          confidence: 0.7,
        });
      }
    }
  }

  return results;
}

function detectTemporal(sentences: string[]): Contradiction[] {
  const results: Contradiction[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const a = sentences[i];
    const aPast = /昨年|去年|以前|過去/.test(a);
    const aFuture = /来年|将来|今後|未来/.test(a);

    if (!aPast && !aFuture) continue;

    for (let j = i + 1; j < sentences.length; j++) {
      const b = sentences[j];
      const bPast = /昨年|去年|以前|過去/.test(b);
      const bFuture = /来年|将来|今後|未来/.test(b);

      const shared = getSharedKeywords(a, b);
      if (shared.length < 2) continue;

      if ((aPast && bFuture) || (aFuture && bPast)) {
        results.push({
          claimA: a.substring(0, 120),
          claimB: b.substring(0, 120),
          contradictionType: 'temporal',
          confidence: 0.75,
        });
      }
    }
  }

  return results;
}

function detectFactual(sentences: string[]): Contradiction[] {
  const results: Contradiction[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const a = sentences[i];

    for (let j = i + 1; j < sentences.length; j++) {
      const b = sentences[j];
      const shared = getSharedKeywords(a, b);
      if (shared.length < 2) continue;

      const aPositive = /できる|可能|サポート|対応/.test(a);
      const bNegative = /できない|不可能|未対応|非対応/.test(b);
      const aNegative = /できない|不可能|未対応|非対応/.test(a);
      const bPositive = /できる|可能|サポート|対応/.test(b);

      if ((aPositive && bNegative) || (aNegative && bPositive)) {
        results.push({
          claimA: a.substring(0, 120),
          claimB: b.substring(0, 120),
          contradictionType: 'factual',
          confidence: 0.65,
        });
      }
    }
  }

  return results;
}

// ──────────────────────────────────────────────
// Correction Prompt
// ──────────────────────────────────────────────

function buildCorrectionPrompt(contradictions: Contradiction[]): string {
  const items = contradictions.map((c, i) =>
    `${i + 1}. [${c.contradictionType}] 信頼度: ${(c.confidence * 100).toFixed(0)}%\n` +
    `   A: "${c.claimA}"\n` +
    `   B: "${c.claimB}"`
  ).join('\n\n');

  return (
    `以下の自己矛盾が検出されました。\n\n${items}\n\n` +
    `各矛盾を解消し、テキスト全体で一貫した主張になるよう修正してください。`
  );
}

// ──────────────────────────────────────────────
// Main API
// ──────────────────────────────────────────────

/**
 * 自己矛盾チェックを実行する
 */
export function runSelfContrast(
  text: string,
  options: { threshold?: number; contextId?: string } = {}
): SelfContrastResult {
  const { threshold = 0.5, contextId = 'self-contrast' } = options;

  const sentences = extractSentences(text);

  const contradictions: Contradiction[] = [
    ...detectNumerical(sentences),
    ...detectLogical(sentences),
    ...detectTemporal(sentences),
    ...detectFactual(sentences),
  ];

  const totalPairs = Math.max(1, (sentences.length * (sentences.length - 1)) / 2);
  const contradictionRatio = contradictions.length / totalPairs;
  const contrastScore = Math.max(0, 1 - contradictionRatio * 5);
  const passed = contrastScore >= threshold;

  recordEvent('memory_search', contextId, passed ? 'ok' : 'fail', {
    metadata: {
      contrastScore,
      contradictionCount: contradictions.length,
      sentenceCount: sentences.length,
    },
  });

  return {
    passed,
    contrastScore,
    contradictions,
    correctionPrompt: contradictions.length > 0
      ? buildCorrectionPrompt(contradictions)
      : undefined,
  };
}
