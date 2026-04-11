---
round: 3
type: agreement
topic: 問題#5 スタブ/プレースホルダーが障害時にどうなるか
---

# Round 3 — 合意結果

## grounding.ts スタブ

### 判定: 部分合意

**合意点**
- `retrieveSnippets` が常に `[]` を返す現状はサイレント劣化であり、呼び出し元への通知が必要（両者一致）
- 呼び出し元に情報を渡す手段が必要（両者一致）

**不合意点**
- Opus: `GroundingResult` に `warning?: string` フィールドを追加（型変更）
- Codex: `TOOLS` 配列の `description` テキストを修正（型変更なし）

**採用する方針**
両案を組み合わせる。型変更は最小に留め、description 修正を先行させる。

**具体的なアクション**
1. `server.ts` 行155-170 の `rag_ground` の `description` を修正し「ベクターDB未設定時は元プロンプトをそのまま返す（stub mode）」と明記
2. `grounding.ts:retrieveSnippets` のコメントを `// Stub: returns empty. Configure RAG_VECTOR_DB_URL to enable.` に更新し、接続設定方法を示す
3. （任意・後回し可）`GroundingResult` への `stubMode?: boolean` フィールド追加で機械的な検出を可能にする

---

## executeSafeStep プレースホルダー

### 判定: 部分合意

**合意点**
- `success: true` を返すのは虚偽報告であり、何らかの識別手段が必要（両者一致）
- `recordEvent` へのプレースホルダー記録（監視への露出）は有効（両者一致）

**不合意点**
- Opus: `success: false` に変更
- Codex: `success: true` 維持 + `[PLACEHOLDER]` prefix か `isPlaceholder` フラグ追加

**採用する方針**
Codexの方針を採用。開発中のプレースホルダーで連鎖的な失敗扱いを引き起こすべきでない。

**具体的なアクション**
1. `graph.ts:293` に `recordEvent` 呼び出し追加（`mode: 'placeholder'`, `warning: 'no_dispatch_performed'`）
2. `summary` を `'[PLACEHOLDER] Executed plan for: ...'` に変更（ログ・メモリ記録に明示的マーカー）
3. `SupervisorResult` 型に `isPlaceholder?: boolean` を追加し `executeSafeStep` から返す（型変更は小さい）
4. `TODO` コメントに GitHub Issue 番号または担当者を記載し放置防止

---

## server.ts try/catch 不在

### 判定: 完全合意

**合意点（両者一致）**
- `setRequestHandler` コールバックに try/catch がゼロは明確な欠陥
- MCP SDKへの例外委譲はSDKバージョン依存で脆弱

**採用する方針**
Opusの修正案をそのまま採用。

**具体的なアクション**
1. `server.ts:289` の `setRequestHandler` コールバック全体を try/catch で包む
2. catch ブロックで `ToolResult { success: false, error: "Internal error in tool '${name}': ..." }` を返す
3. catch ブロック内で `console.error('[proxy-mcp]', name, err)` によりサーバーサイドのエラーログも残す
4. この修正に対するユニットテストを追加（ハンドラが例外をスローした場合に `isError: true` が返ることを確認）

**優先度: 高（リグレッションリスクなし、即時修正推奨）**
