/**
 * Shared CAPTCHA detection patterns
 *
 * Union of captcha.ts (13 string patterns) and cdp/types.ts (12 regex patterns).
 * Both modules should import from here to avoid pattern divergence.
 */

/** Unified CAPTCHA / anti-bot detection patterns (case-insensitive regex) */
export const CAPTCHA_PATTERNS: RegExp[] = [
  // From captcha.ts (string patterns → regex)
  /captcha/i,
  /recaptcha/i,
  /hcaptcha/i,
  /cloudflare.*challenge/i,
  /verify.*(?:you.*(?:are|'re).*)?human/i,
  /i'?m not a robot/i,
  /please.*verify/i,
  /security.*check/i,
  /bot.*detection/i,
  /challenge-platform/i,
  /cf-turnstile/i,
  /cf-challenge/i,
  /challenge-running/i,

  // From cdp/types.ts (additional patterns)
  /are.*you.*robot/i,
  /prove.*not.*bot/i,
  /cloudflare.*challenge/i,
  /access.*denied/i,
  /please.*sign.*in/i,
  /login.*required/i,
  /authentication.*required/i,
];

/**
 * Check if content matches any CAPTCHA / anti-bot pattern
 */
export function detectCaptchaPattern(content: string): { detected: boolean; pattern?: string } {
  for (const pattern of CAPTCHA_PATTERNS) {
    if (pattern.test(content)) {
      return { detected: true, pattern: pattern.source };
    }
  }
  return { detected: false };
}
