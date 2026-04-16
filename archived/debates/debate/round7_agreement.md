# Round 7 Agreement Check

## 問題#8: .env.example 優先度ラベル欠如

| 論点 | Status | 合意内容 |
|------|--------|---------|
| 問題の存在 | AGREE ✅ | ANTHROPIC_API_KEY のみ真の REQUIRED。残り20+変数は分類なし |
| ラベル方式 | AGREE ✅ | セクション分離方式（インラインコメント方式より安全・可読） |
| REQUIRED変数 | AGREE ✅ | ANTHROPIC_API_KEY のみ |
| RECOMMENDED変数 | AGREE ✅ | TAVILY_API_KEY, BRAVE_SEARCH_API_KEY, GITHUB_TOKEN |
| Feature Flagsへのラベル | AGREE ✅ | 不要（APIキーではなく設定値） |
| 保守コスト対策 | AGREE ✅ | scripts/validate-env.ts で起動時チェック追加 |

## 確定修正案

### .env.example の構造を3セクションに再編

```
# [REQUIRED] 必須 — これなしでは動きません (1項目)
ANTHROPIC_API_KEY=...

# [RECOMMENDED] 推奨 — 主要スキルで使用 (3項目)
TAVILY_API_KEY=...
BRAVE_SEARCH_API_KEY=...
GITHUB_TOKEN=...

# [OPTIONAL] 任意 — 必要になったら設定 (残り全て)
OPENAI_API_KEY=...
...
```

### scripts/validate-env.ts (新規作成)
- 起動時に ANTHROPIC_API_KEY の存在チェック
- 未設定の場合: `ERROR: ANTHROPIC_API_KEY is required. See .env.example [REQUIRED] section.`

## 優先度
**High** — 新規ユーザーの初回セットアップ時間を2〜5時間 → 15〜30分に短縮できる即効策
