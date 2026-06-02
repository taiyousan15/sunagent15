export function sanitizeUntrusted(s: string): string {
  return s
    .replace(/[\r\n]+/g, ' ')
    .replace(/([*_`#[\]<>])/g, '\\$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function sanitizeUrl(u: string): string {
  try {
    const parsed = new URL(u)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.toString()
      : ''
  } catch {
    return ''
  }
}
