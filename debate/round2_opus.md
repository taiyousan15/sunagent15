---
round: 2
perspective: Opus（アーキテクチャ批評）
topic: 問題#6 server.ts God Object + 問題#7 CAPTCHA二重実装
---

# Round 2 — Opus: アーキテクチャ

## 問題#6: server.ts の God Object化（564行、13ツールハンドラ）

### 確認した事実
- `/src/proxy-mcp/server.ts` は564行
- 1つの `switch` ブロック（行289-537）に13ケースが並ぶ
- ビジネスロジック（constitutional check、RAGグラウンディング、バリデーションパイプライン等）がすべて呼び出し元に露出
- 各ケースは平均20-30行のインライン処理を含む（例: `memory_add` ケースは行310-332でconstitutional checkを自前実行）

### なぜ問題か
1. **単一責任原則の違反**: `server.ts` がMCPプロトコル処理・ルーティング・バリデーション前処理・エラーシリアライズを兼任。変更理由が13以上存在する。
2. **テストの困難**: 13ハンドラを単体テストするには `server.ts` 全体をインポートする必要があり、MCPサーバー起動まで発生する。現状ハンドラのユニットテストは存在しない。
3. **拡張コスト**: 新ツール追加 = switch ケース追加 + TOOLS 配列追加 + import 追加の3箇所修正が必須。Open/Closed原則に反する。

### 具体的な修正案
`/src/proxy-mcp/handlers/` ディレクトリを作成し、機能ドメインごとに分割:

```
handlers/
  memory.handler.ts     ← memory_add, memory_search (現行行310-335)
  validation.handler.ts ← output_verify, cove_verify, constitutional_check, validation_pipeline (行338-438)
  rag.handler.ts        ← rag_ground (行358-371)
  reflexion.handler.ts  ← reflexion_analyze, reflexion_round (行475-530)
  prospective.handler.ts← prospective_check (行440-456)
  skill.handler.ts      ← skill_search, skill_run (行299-307)
  system.handler.ts     ← system_health (行295-297)
```

`server.ts` の switch は各ハンドラを `import` して委譲するだけにする:

```typescript
// server.ts (修正後 ~80行)
import { handleMemory } from './handlers/memory.handler';
// ...
case 'memory_add':
case 'memory_search':
  result = await handleMemory(name, args);
  break;
```

---

## 問題#7: CAPTCHA検出の二重実装

### 確認した事実
**実装A** `/src/proxy-mcp/browser/captcha.ts`:
- 文字列パターン配列 `CAPTCHA_PATTERNS`（13エントリ、行12-27）
- `detectCaptcha(content)`: `string.includes()` による比較
- `guardCaptcha(content, url)`: WebSkillResult を返す
- `checkBlockedPatterns(url)`: 認証URLを検出

**実装B** `/src/proxy-mcp/browser/cdp/types.ts`:
- 正規表現配列 `CAPTCHA_PATTERNS`（12エントリ、行90-103）
- `detectCaptchaOrLogin(title, content, url)`: RegExp.test() による比較
- 同名定数 `CAPTCHA_PATTERNS` が別ファイルに存在

### 差異の具体例
| 比較軸 | captcha.ts | cdp/types.ts |
|--------|-----------|--------------|
| マッチ方式 | `string.includes()` | `RegExp.test()` |
| 対象 | content のみ | title + content + url を結合 |
| パターン数 | 13 | 12 |
| `cf-turnstile` | あり | なし |
| `please.*sign.*in` | なし | あり |
| ログイン検出 | `checkBlockedPatterns()` 別関数 | `detectCaptchaOrLogin()` に統合 |

### なぜ問題か
1. **検出精度の乖離**: 同じページを `captcha.ts` ではCAPTCHA検出、`cdp/types.ts` では未検出になりうる（`cf-turnstile` の有無）
2. **パターンの独立進化**: 一方のパターンを追加しても他方に反映されない（過去実績として `cf-turnstile` が片方のみに存在）
3. **型定義ファイルへのロジック混在**: `types.ts` にロジックを置くのは責務違反

### 具体的な修正案
`/src/proxy-mcp/browser/captcha.ts` を正規表現ベースに統一し、`cdp/types.ts` からロジックを削除:

```typescript
// captcha.ts (統合後)
export const CAPTCHA_PATTERNS: RegExp[] = [
  /captcha/i,
  /recaptcha/i,
  /hcaptcha/i,
  /cloudflare.*challenge/i,
  /cf-turnstile/i,
  /verify.*human/i,
  /i.m not a robot/i,
  /security.*check/i,
  /bot.*detection/i,
  /please.*sign.*in/i,
  /login.*required/i,
  /authentication.*required/i,
  /access.*denied/i,
];

export function detectCaptchaOrBlocked(
  title: string,
  content: string,
  url: string
): { detected: boolean; reason?: string } {
  const combined = `${title} ${content} ${url}`;
  for (const pattern of CAPTCHA_PATTERNS) {
    if (pattern.test(combined)) {
      return { detected: true, reason: pattern.source };
    }
  }
  return { detected: false };
}
```

`cdp/types.ts` では:
```typescript
// cdp/types.ts (修正後 — ロジック削除)
export { detectCaptchaOrBlocked, CAPTCHA_PATTERNS } from '../captcha';
```
