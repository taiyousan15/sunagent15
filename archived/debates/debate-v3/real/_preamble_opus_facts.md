# v3 Debate: 15-Round Opus 4.6 Analysis (Refactoring Proposals Verification)

## Pre-Debate Fact Check (Opus 実測検証、推測ゼロ)

### Q1: dist/ 削除の是非 → **削除不可**
- `package.json:60-69` で `node dist/proxy-mcp/...` を **10 箇所直接参照**
- 例: `internal-mcp:rollout`, `obs:report:daily`, `obs:post:daily`, `chrome:debug:start`, `chrome:cdp:smoke`, `ops:schedule:run` 等
- dist/ 削除 → `npm run internal-mcp:rollout` 等が即 ENOENT で死ぬ
- 正解: `git rm -r --cached dist/` で **tracking だけ外す**、postinstall が build で再生成する

### Q2: .taisun/ 自動生成
- `install.sh:371` と `install.ps1:420` で **install 時に自動作成**
- 内容（memory.jsonl 13M + events.jsonl 3.8M）は **ランタイム生成**
- 削除判定: 中身は安全、ディレクトリ自体は install.sh 側で作成されるので touch しなくて OK

### Q3: debate/ 参照なし（外部スクリプトから）
- `README.md:24` の v2.53.3 entry で言及されるのみ（履歴）
- 外部呼び出しゼロ → archived/ 移動可能

### Q4: settings-merge 二重実装 → **本当に二重**
- `scripts/update-settings.js` は **本番コード**（install.sh:434, 437 から呼ばれる）
- `src/utils/settings-merge.ts` は **テスト専用**（test.ts のみが import）
- 同じロジック（additiveMerge/freshMerge/smartMerge）を JS と TS の両方に実装
- ロジック分岐時の乖離リスクあり

### Q5: @prisma/client の実態
- `package.json` + `package-lock.json` に依存宣言あり
- `prisma/schema.prisma` **存在する** → Prisma システム自体は使用中
- コード上の import は 0 件（md 例のみ）→ schema 管理専用の可能性
- 削除すると `npx prisma generate` 等が動かなくなる

---
