/**
 * CAPTCHA Detection - Guardrails for browser automation
 *
 * Detects CAPTCHA/anti-bot patterns and returns require_human action
 */

import { WebSkillResult } from './types';
import { CAPTCHA_PATTERNS } from './captcha-patterns';

/**
 * Human-readable pattern names for backward compatibility
 * Maps regex source → user-facing string
 */
const PATTERN_LABELS: Record<string, string> = {
  'captcha': 'captcha',
  'recaptcha': 'recaptcha',
  'hcaptcha': 'hcaptcha',
  'cloudflare.*challenge': 'cloudflare challenge',
  "verify.*(?:you.*(?:are|'re).*)?human": 'verify you are human',
  "i'?m not a robot": "i'm not a robot",
  'please.*verify': 'please verify',
  'security.*check': 'security check',
  'bot.*detection': 'bot detection',
  'challenge-platform': 'challenge-platform',
  'cf-turnstile': 'cf-turnstile',
  'cf-challenge': 'cf-challenge',
  'challenge-running': 'challenge-running',
  'are.*you.*robot': 'are you robot',
  'prove.*not.*bot': 'prove not bot',
  'access.*denied': 'access denied',
  'please.*sign.*in': 'please sign in',
  'login.*required': 'login required',
  'authentication.*required': 'authentication required',
};

/**
 * Check if content contains CAPTCHA patterns
 * Uses shared CAPTCHA_PATTERNS with human-readable labels
 */
export function detectCaptcha(content: string): { detected: boolean; pattern?: string } {
  for (const pattern of CAPTCHA_PATTERNS) {
    if (pattern.test(content)) {
      return {
        detected: true,
        pattern: PATTERN_LABELS[pattern.source] || pattern.source,
      };
    }
  }
  return { detected: false };
}

/**
 * Check page content and return require_human if CAPTCHA detected
 */
export function guardCaptcha(
  content: string,
  url: string
): WebSkillResult | null {
  const check = detectCaptcha(content);

  if (check.detected) {
    return {
      success: false,
      action: 'require_human',
      reason: `CAPTCHA detected: "${check.pattern}"`,
      error: `CAPTCHA detected on ${url}. Manual intervention required.`,
      data: {
        url,
        detectedPattern: check.pattern,
        instructions: [
          '1. Open the URL in a browser manually',
          '2. Complete the CAPTCHA/verification',
          '3. If you have access, provide the page content directly',
          '4. Alternatively, try a different approach or URL',
        ],
      },
    };
  }

  return null;
}

/**
 * Check if URL is potentially blocked or requires authentication
 */
export function checkBlockedPatterns(url: string): WebSkillResult | null {
  const blocked = [
    'accounts.google.com',
    'login.',
    '/signin',
    '/login',
    'auth.',
    '/oauth',
  ];

  const lowerUrl = url.toLowerCase();
  for (const pattern of blocked) {
    if (lowerUrl.includes(pattern)) {
      return {
        success: false,
        action: 'require_human',
        reason: `Authentication required: URL contains "${pattern}"`,
        error: `This URL appears to require authentication. Manual login required.`,
        data: {
          url,
          detectedPattern: pattern,
        },
      };
    }
  }

  return null;
}
