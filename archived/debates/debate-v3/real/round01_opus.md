# Round 1: 機能正確性 — dist/ 削除の影響範囲 — Opus 4.6 Analysis

### Finding 1
**Issue**: 提案 A5 (dist/ 削除) は package.json:60-69 の 10 個の npm script を破壊する
**Evidence**: `grep "dist/" package.json` で 10 件検出、各行が `node dist/proxy-mcp/...` のパターン
**Category**: code
**Severity**: critical
**判定**: **dist/ 完全削除は禁止**、代わりに `git rm -r --cached dist/` で tracking のみ外す
**他人影響**: postinstall で build が走るので他人は影響なし

### Finding 2
**Issue**: 提案 D1 (@prisma/client 削除) は schema.prisma が存在する限り危険
**Evidence**: `prisma/schema.prisma` 存在確認。Prisma CLI 経由の型生成等で必要
**Category**: code
**Severity**: high
**判定**: **@prisma/client 削除禁止**、ただし dependencies → devDependencies 降格は検討可

### Finding 3
**Issue**: 提案 C4 (settings-merge 統合) は本番コード/テストコードの役割分離を壊す可能性
**Evidence**: update-settings.js は install.sh:434, 437 の唯一の呼び出し先。settings-merge.ts はテスト専用
**Category**: architecture
**Severity**: medium
**判定**: 統合する場合、update-settings.js 側の standalone 性を保ちつつ **ロジックのみ共通化**（ts-node 依存を避ける必要）

---
