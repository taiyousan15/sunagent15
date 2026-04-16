---
type: summary
rounds: 2-6
generated: 2026-04-11
---

# debate/round 2-6 サマリー

## Round 2: アーキテクチャ（server.ts God Object + CAPTCHA二重実装）

### 問題#6: server.ts God Object（564行、13ハンドラ）
- **合意**: 部分合意
- **採用方針**: `src/proxy-mcp/handlers/index.ts` を作成し `dispatch(name, args)` を公開。`server.ts` は ~80行のプロトコル層のみに縮小。`memory_add` 内の constitutional check を handlers 内に移動。ファイル分割は段階的に実施。

### 問題#7: CAPTCHA二重実装（browser/captcha.ts vs browser/cdp/types.ts）
- **合意**: 部分合意
- **採用方針**: `browser/captcha-patterns.ts`（共有層）を新規作成し、playwright-core 非依存の RegExp 配列と純粋関数を置く。`captcha.ts` はそこからインポート、`cdp/types.ts` は型定義のみに戻す。`cf-turnstile` 等のパターン不一致を解消。

---

## Round 3: エラー処理（スタブ/プレースホルダーの障害時挙動）

### grounding.ts スタブ
- **合意**: 部分合意
- **採用方針**: `rag_ground` ツールの description に「stub mode: ベクターDB未設定時は元プロンプトをそのまま返す」を明記。`retrieveSnippets` コメントに設定方法を追記。（※Round 6でこの方針は「即時実装」に覆る）

### graph.ts executeSafeStep プレースホルダー
- **合意**: 部分合意
- **採用方針**: `success: true` 維持 + `[PLACEHOLDER]` summary prefix + `recordEvent` で監視可能に + `SupervisorResult.isPlaceholder?: boolean` 追加。

### server.ts try/catch 不在
- **合意**: 完全合意
- **採用方針**: `setRequestHandler` コールバック全体を try/catch で包み、catch で `ToolResult { success: false, error: ... }` を返す。`console.error` でサーバーログも残す。**優先度: 高（即時修正）**

---

## Round 4: パフォーマンス（hookテスト不在のCI影響）

### 問題#4: 62個の hookJS ファイル、CIに接続されたテストがゼロ
- **合意**: 部分合意
- **核心事実**: `jest.config.js:4` の `roots: ['<rootDir>/src', '<rootDir>/tests']` に `.claude/hooks/__tests__/` が含まれておらず、既存の6テストファイル（65ケース相当）もCIで実行されていない
- **採用方針（2段階）**:
  - Phase 1（即時）: `jest.config.js` に hooks プロジェクト設定追加 + CI ジョブ追加。既存テストをまずローカルで pass 確認してから接続。
  - Phase 2（中期）: `cost-hard-stop-guard`・`unified-guard`・`checkpoint-guard` のスモークテスト追加（実プロセス起動、モックなし）。

---

## Round 5: セキュリティ（3重要ガードのテスト不在リスク）

### cost-hard-stop-guard.js オフバイワン
- **合意**: 部分合意
- **採用方針**: テストで `daily === DAILY_LIMIT` の実挙動を先に確認。コメント更新でブロック方針を明文化してから `>` vs `>=` を判断。

### checkpoint-guard.js パストラバーサル
- **合意**: 部分合意
- **採用方針（Codex案採用）**: `hasDangerousChars` の正規表現に `|\.\.` を追加（行144）。シンプル・副作用最小。
  ```javascript
  const hasDangerousChars = /[;&|`$()<>]|\.\./.test(cmd);
  ```

### unified-guard.js Intent スキップと危険パターンの優先関係
- **合意**: 部分合意
- **採用方針**: スモークテストで実測してから判断（`Edit` + 危険パターン → exit 2 か 0 かを確認）。

### 追加合意: フェイルオープン設計の明文化
- **合意**: 完全合意
- 3ガード全ての `catch (e) { return null; }` に「フェイルオープン: 意図的設計」コメントを追加。

---

## Round 6: スタブ処理方針（削除/実装/文書化の3択）

### 最重要発見
`src/rag/retriever.ts`（98行）と `src/rag/indexer.ts`（142行）が実装済みであることを Round 6 中に発見。`grounding.ts:retrieveSnippets` は Qdrant 等の外部ベクターDBを必要とせず、`retrieveTexts()` を呼ぶ5行の変更で機能する。これは「スタブ」ではなく「接続漏れ」。

### grounding.ts:retrieveSnippets
- **合意**: 完全合意（Opus初期方針「文書化」を Codex の発見により「即時実装」に修正）
- **採用方針**: `retrieveTexts` を `retrieveSnippets` 内で呼ぶ5行の修正で即時実装。**優先度: 最高**

### graph.ts:executeSafeStep
- **合意**: 完全合意
- **採用方針**: 文書化（C）。`recordEvent` 追加 + `[PLACEHOLDER]` prefix + `isPlaceholder` フラグ + JSDoc 更新 + GitHub Issue 起票。

---

## アクション優先マトリクス（全5ラウンド統合）

| 優先度 | アクション | ファイル | 工数 |
|--------|-----------|---------|------|
| 最高 | grounding.ts を retriever.ts に接続（5行） | src/rag/grounding.ts | S |
| 最高 | server.ts setRequestHandler を try/catch で包む | src/proxy-mcp/server.ts | S |
| 高 | checkpoint-guard に `\|\.\.` 追加（1行） | .claude/hooks/checkpoint-guard.js | S |
| 高 | 既存6テストをCIに接続（jest.config.js + ci.yml） | jest.config.js, .github/workflows/ci.yml | S |
| 高 | handlers/index.ts 作成 + server.ts をプロトコル層のみに | src/proxy-mcp/handlers/index.ts | M |
| 中 | captcha-patterns.ts 共有層作成 + cdp/types.ts からロジック削除 | src/proxy-mcp/browser/ | M |
| 中 | cost-hard-stop のテスト追加 + オフバイワン判断 | .claude/hooks/__tests__/ | M |
| 中 | executeSafeStep の文書化（recordEvent + isPlaceholder） | src/proxy-mcp/supervisor/graph.ts | S |
| 中 | unified-guard スモークテスト（Edit + 危険パターン） | .claude/hooks/__tests__/ | M |
| 低 | フェイルオープン設計コメントの明文化（3ガード） | .claude/hooks/ 3ファイル | S |

※ S=30分以内, M=数時間

---

## 診断の誤りと学習

Round 6 で確認: Opus が `grounding.ts` を「外部ベクターDB必要・工数大」と誤診した原因は `retriever.ts` と `indexer.ts` を事前に確認していなかったため。コードレビューでは関連ファイルをすべて確認してから工数見積もりを行うべきことを再確認。
