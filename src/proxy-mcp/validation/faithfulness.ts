/**
 * Faithfulness Check
 *
 * RAG出力とソース文書の忠実度チェック。
 * 数値・固有名詞・日付を含む文をクレームとして抽出し、
 * ソーステキストとの整合性を確認する。
 */

import { recordEvent } from '../observability';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface FaithfulnessResult {
  passed: boolean;
  faithfulnessScore: number;
  unsupportedClaims: string[];
  contradictedClaims: string[];
  correctionPrompt?: string;
}

export interface FaithfulnessOptions {
  threshold?: number;
  contextId?: string;
}

// ──────────────────────────────────────────────
// Claim Extraction
// ──────────────────────────────────────────────

/** 数値・固有名詞・日付を含む文をクレームとして抽出 */
function extractVerifiableClaims(text: string): string[] {
  const sentences = text
    .split(/[。．\n]|(?<=[^A-Z])\. /)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  return sentences.filter(sentence => {
    const hasNumbers = /\d+/.test(sentence);
    const hasDate = /20\d{2}年?|[0-9]{1,2}月[0-9]{1,2}日/.test(sentence);
    const hasProperNoun = /[A-Z][a-z]{2,}|Claude|GPT|Google|Microsoft|Anthropic|OpenAI/.test(sentence);
    return hasNumbers || hasDate || hasProperNoun;
  });
}

// ──────────────────────────────────────────────
// Support Check
// ──────────────────────────────────────────────

/** クレームがソーステキストのいずれかに根拠があるか確認 */
function isClaimSupported(claim: string, sourceTexts: string[]): boolean {
  const claimWords = claim
    .toLowerCase()
    .split(/\s+|[、。！？]/)
    .filter(w => w.length > 2);

  const claimNumbers = [...claim.matchAll(/\d+(?:\.\d+)?/g)].map(m => m[0]);

  for (const source of sourceTexts) {
    const sourceLower = source.toLowerCase();

    // 数値の一致確認
    if (claimNumbers.length > 0) {
      const allNumbersFound = claimNumbers.every(n => source.includes(n));
      if (allNumbersFound) return true;
    }

    // キーワードの重複確認
    const matchedWords = claimWords.filter(w => sourceLower.includes(w));
    const overlapRatio = matchedWords.length / Math.max(claimWords.length, 1);
    if (overlapRatio >= 0.5) return true;
  }

  return false;
}

/** クレームがソーステキストと矛盾するか確認 */
function isClaimContradicted(claim: string, sourceTexts: string[]): boolean {
  const claimNumbers = [...claim.matchAll(/\d+(?:\.\d+)?/g)].map(m => parseFloat(m[0]));
  if (claimNumbers.length === 0) return false;

  const claimWords = claim
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3);

  for (const source of sourceTexts) {
    const sourceSentences = source.split(/[。．\n]/).filter(s => s.length > 10);

    for (const sentence of sourceSentences) {
      const sentenceWords = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const shared = claimWords.filter(w => sentenceWords.includes(w));

      if (shared.length >= 2) {
        const sourceNumbers = [...sentence.matchAll(/\d+(?:\.\d+)?/g)].map(m => parseFloat(m[0]));
        if (sourceNumbers.length > 0 && claimNumbers.length > 0) {
          const hasConflict = claimNumbers.some(cn =>
            sourceNumbers.some(
              sn => sn !== cn && Math.abs(sn - cn) / Math.max(cn, 1) > 0.1
            )
          );
          if (hasConflict) return true;
        }
      }
    }
  }

  return false;
}

// ──────────────────────────────────────────────
// Correction Prompt
// ──────────────────────────────────────────────

function buildCorrectionPrompt(
  unsupported: string[],
  contradicted: string[]
): string {
  const lines: string[] = ['以下の忠実度の問題が検出されました。\n'];

  if (unsupported.length > 0) {
    lines.push('【根拠なし】以下の主張はソースに根拠がありません:');
    unsupported.forEach((c, i) => lines.push(`  ${i + 1}. "${c.substring(0, 80)}..."`));
    lines.push('');
  }

  if (contradicted.length > 0) {
    lines.push('【矛盾】以下の主張はソースと矛盾しています:');
    contradicted.forEach((c, i) => lines.push(`  ${i + 1}. "${c.substring(0, 80)}..."`));
    lines.push('');
  }

  lines.push('ソーステキストに基づいて上記の主張を修正してください。');
  return lines.join('\n');
}

// ──────────────────────────────────────────────
// Main API
// ──────────────────────────────────────────────

/**
 * RAG出力の忠実度チェックを実行する
 */
export function checkFaithfulness(
  generatedText: string,
  sourceTexts: string[],
  options: FaithfulnessOptions = {}
): FaithfulnessResult {
  const { threshold = 0.5, contextId = 'faithfulness' } = options;

  // ソースなし: 検証不要
  if (sourceTexts.length === 0) {
    return {
      passed: true,
      faithfulnessScore: 1.0,
      unsupportedClaims: [],
      contradictedClaims: [],
    };
  }

  const claims = extractVerifiableClaims(generatedText);

  if (claims.length === 0) {
    return {
      passed: true,
      faithfulnessScore: 1.0,
      unsupportedClaims: [],
      contradictedClaims: [],
    };
  }

  const unsupportedClaims: string[] = [];
  const contradictedClaims: string[] = [];

  for (const claim of claims) {
    if (isClaimContradicted(claim, sourceTexts)) {
      contradictedClaims.push(claim);
    } else if (!isClaimSupported(claim, sourceTexts)) {
      unsupportedClaims.push(claim);
    }
  }

  const unfaithfulCount = unsupportedClaims.length + contradictedClaims.length;
  const unfaithfulnessRate = unfaithfulCount / claims.length;
  const faithfulnessScore = Math.max(0, 1 - unfaithfulnessRate);
  const passed = faithfulnessScore >= threshold;

  recordEvent('memory_search', contextId, passed ? 'ok' : 'fail', {
    metadata: {
      faithfulnessScore,
      totalClaims: claims.length,
      unsupportedCount: unsupportedClaims.length,
      contradictedCount: contradictedClaims.length,
    },
  });

  return {
    passed,
    faithfulnessScore,
    unsupportedClaims,
    contradictedClaims,
    correctionPrompt: unfaithfulCount > 0
      ? buildCorrectionPrompt(unsupportedClaims, contradictedClaims)
      : undefined,
  };
}
