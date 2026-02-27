# learning-agent 永続メモリ (project scope)

## 蓄積された教訓

### 技術的教訓
<!-- [日付] 教訓内容 → 対処法 -->
- [2026-02-22] Prisma generate 前に build 実行 → schema.prisma 変更後は必ず prisma generate → build の順
- [2026-02-22] Anthropic SDK v0.39.0 に APIStatusError は存在しない → APIError を使う
- [2026-02-22] Docker PostgreSQL port 5432 はmacOSと競合 → Docker は 5433 を使う

### プロセス教訓
- MCP 5本同時起動でコンテキスト ~55k消費 → 2-3本以下に制限
- 並列3エージェント以上: run_in_background: true 必須

### 有効パターン
- Task プロンプト末尾に「結果は500文字以内で要約して返してください」を必須追加
- 大きなAgent結果: 即座に praetorian_compact で圧縮
- Typesense 接続失敗時: Prisma fallback を実装して起動を止めない設計

## 改善サイクル
次の `/learn` 実行時に新しい教訓を追記する

*最終更新: 2026-02-22*
