---
round: 2
type: agreement
topic: 問題#6 server.ts God Object + 問題#7 CAPTCHA二重実装
---

# Round 2 — 合意結果

## 問題#6: server.ts リファクタリング

### 判定: 部分合意

**合意点**
- `server.ts` が564行・13ケースを抱えるのはテスト不可能な構造であり修正必要（両者一致）
- `memory_add` 内の constitutional check（行310-322）は server.ts に置く理由がなく移動すべき（両者一致）
- 修正の第1ステップは「dispatch関数の抽出によるプロトコル層の分離」で合意

**不合意点**
- Opus: 7ファイルへの即時分割
- Codex: まず1つの `handlers/index.ts` に集約し、後で段階分割

**採用する方針**
Codexの段階的アプローチを採用。理由: リファクタリング途中でMCP接続が壊れるリスクを最小化するため、まずプロトコル層とハンドラ層の境界確立を優先する。

**具体的なアクション**
1. `src/proxy-mcp/handlers/index.ts` を作成し、全13ハンドラ関数を移動（`dispatch(name, args): Promise<ToolResult>` を公開）
2. `server.ts` の `setRequestHandler` を `dispatch` 1行呼び出しに置き換え（server.ts は ~80行になる）
3. `memory_add` 内 constitutional check を `handlers/index.ts` のハンドラ関数内に閉じ込める
4. ファイル分割（validation.handler.ts 等）はステップ1・2完了後に段階実施
5. 各ハンドラ関数のユニットテストを `__tests__/handlers.test.ts` に追加

---

## 問題#7: CAPTCHA二重実装

### 判定: 部分合意

**合意点**
- 同名定数 `CAPTCHA_PATTERNS` が2ファイルで独立進化しているのは明確なバグリスク（両者一致）
- `cf-turnstile` の有無など具体的なパターン差異が存在し、即時修正が必要（両者一致）
- `types.ts` にロジックを置くのは責務違反（両者一致）

**不合意点**
- Opus: `captcha.ts` を正規表現ベースに統一し `cdp/types.ts` は re-export のみ
- Codex: `captcha-patterns.ts` として第三の共有層を作成し独立性を保つ

**採用する方針**
Codexの「第三の共有層」アプローチを採用。理由: CDPモジュールが `WebSkillResult`（browser固有型）に依存することを避けられる。

**具体的なアクション**
1. `src/proxy-mcp/browser/captcha-patterns.ts` を新規作成（RegExp配列 + 純粋な検出関数のみ、playwright-core依存なし）
2. 統合パターンリスト（captcha.ts 13件 + cdp/types.ts 12件の和集合、重複除去）を確定
3. `captcha.ts` は `captcha-patterns.ts` をインポートし `WebSkillResult` を返すガード関数を維持
4. `cdp/types.ts` は型定義のみに戻し、`CAPTCHA_PATTERNS` と `detectCaptchaOrLogin` を削除、必要なら `captcha-patterns.ts` から定数のみインポート
5. 統合後のパターンリストに対してユニットテストを追加（現状テストなし）

**リスク**
`cdp/types.ts` を変更すると `cdp/` 配下のファイルがインポートに失敗する可能性。修正前に `grep -r "detectCaptchaOrLogin\|CAPTCHA_PATTERNS" src/proxy-mcp/browser/cdp/` で依存箇所を全確認すること。
