import crypto from 'crypto'

export function makeId(src: string, id: string): string {
  return crypto.createHash('md5').update(`${src}:${id}`).digest('hex').slice(0, 16)
}
