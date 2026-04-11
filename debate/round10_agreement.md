# Round 10 Agreement Check

## エッジケース総括

| エッジケース | Status | 優先度 | 確定アクション |
|------------|--------|--------|--------------|
| 1. llm-judge 診断性改善 | AGREE ✅ | Low | shouldSkip前に明示的APIキーチェック追加 |
| 2. intelligence undefined伝播 | AGREE ✅ | Medium | aggregate()内部フェッチャーの個別確認が必要 |
| 3. ModelRouter null フォールバック | AGREE ✅ | Medium | tsconfig strict設定の確認が必要 |
| 4. CHROME_PATH未設定 | AGREE ✅ | Low | Chrome非使用時は無影響、文書化のみ |
| 5. QDRANT_URL未設定（Codex新規） | AGREE ✅ | High | memory_addへの影響確認 + .env.exampleに[RECOMMENDED]追加 |
| 6. VALIDATION_MODE=strict + 無APIキー | AGREE ✅ | Low | .env.exampleに組み合わせ注記追加 |

---

## 確定修正案

### 修正1: src/proxy-mcp/validation/llm-judge.ts (診断性改善)

**変更箇所:** `runLLMJudge` 関数内、`shouldSkip` 呼び出しの直前

```typescript
// enabled チェック後、shouldSkip の前に追加
if (!process.env.ANTHROPIC_API_KEY) {
  return {
    passed: true, score: 1.0, reasoning: '', issues: [],
    skipped: true, skipReason: 'ANTHROPIC_API_KEY_not_set'
  };
}
```

**理由:** 現状は APIキー未設定でも 401 を一度発生させてから catch する。
明示的チェックにより無駄なネットワーク往復を排除し、skipReason が明確になる。

---

### 修正2: .env.example の QDRANT 変数に[RECOMMENDED]追加

Round 7 の構造変更と合わせて、QDRANT を `[RECOMMENDED]` セクションへ移動:

```bash
# [RECOMMENDED] - 推奨: 主要スキルで使用
TAVILY_API_KEY=...
BRAVE_SEARCH_API_KEY=...
GITHUB_TOKEN=...
# Qdrant (memory_add / memory_search ツールで使用)
# 未設定の場合: memory_addがローカルファイルにフォールバックするか要確認
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=taisun_memory
```

**注記追加（コメント内）:**
```
# VALIDATION_MODE=strict を設定する場合は ANTHROPIC_API_KEY も必須
# (LLM Judge が strict モードで動作するため)
```

---

### 要調査項目（修正前に確認必要）

| 項目 | 確認方法 | 担当 |
|------|---------|------|
| aggregate() 内各フェッチャーの null ガード | `src/intelligence/` 配下を Read | 次ラウンドまたは別issueで対応 |
| tsconfig.json の strict 設定 | `tsconfig.json` の strict フィールド確認 | 次ラウンドまたは別issueで対応 |
| memory_add の Qdrant 未起動時挙動 | `src/proxy-mcp/tools/memory.ts` の接続エラー処理確認 | 次ラウンドまたは別issueで対応 |

---

## 今ラウンドの重要な発見

**Codexが正しくOpusを訂正した点:**
- llm-judge.ts の catch ブロック（行200-206）は実際に 401 を `skipped: true` で安全処理している
- intelligence/index.ts 行38 で既にキーの truthy チェックが行われている

**Codexが新たに発見した問題:**
- QDRANT_URL が[RECOMMENDED]に含まれていない（memory系ツールへの影響）
- VALIDATION_MODE=strict + APIキー無しの組み合わせが文書化されていない
