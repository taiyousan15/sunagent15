# Round 12: 保守性 — Codex Challenge

## Finding 12-1: server.ts の責務分離 — AGREE（問題）、PARTIAL（修正案）

**問題の存在**: YES。564行のファイルに14ツールのスキーマと14ハンドラーが混在。ツール追加コストが線形増大する構造は正しい指摘。

**Opus修正案への反論（2点）**:
1. `tool-registry.ts` + `dispatcher.ts` の2層分割は理にかなっているが、さらに各ツールをディレクトリで分離する「ツール単位プラグイン構造」の方が長期保守性が高い。例: `src/proxy-mcp/server/tools/validation_pipeline.ts` に schema + handler を共置。
2. ただしプラグイン構造は現状の tools/ ディレクトリ (skill.ts, memory.ts) との二重管理になる危険がある。Opusの2ファイル分割案は現行構造を壊さず、かつ800行制限を維持できる現実的な妥協点として妥当。

**判定**: PARTIAL — Opus案を基本採用、ただし各ツールのschema定義を tools/ 配下の各実装ファイルへ移動する形（スキーマと実装の共置）を推奨する点を付記。

---

## Finding 12-2: enhanced-descriptions.ts のデッドコード — AGREE

**問題の存在**: YES。server.ts の import リストに存在せず、418行のファイルが宙に浮いている。

**Opus修正案への反論**: 削除または _archive/ 移動は妥当。ただし削除前に CI でも参照チェックを行うべき。`tsconfig.json` の `noUnusedLocals` では module間の参照は検出されないため、tree-shaking ツール (madge 等) でのデッドコード検出をCIに追加すると再発防止になる。

**判定**: AGREE

---

## Finding 12-3: テストと修正のトレーサビリティ欠如 — AGREE（問題）、PARTIAL（修正案）

**問題の存在**: YES。10問題の修正とテストが非対称で追跡不能。

**Opus修正案への反論**: `docs/regression-map.md` は手動更新が必要なため腐敗リスクがある。より保守性の高いアプローチ:
- JSDoc `@issue` タグはOpus案通り採用
- ドキュメントではなく `package.json` の `scripts` で `test:regression:issue-XXX` という名前付きスクリプトを定義する方が機械的に検索可能

**判定**: PARTIAL — @issue タグは AGREE、regression-map.md の代わりに自動生成スクリプトを推奨

---

## Codex追加指摘 (Round 12)

### Finding 12-4 (新規)
**Issue**: `src/proxy-mcp/tools/skill.ts` が674行、`tools/memory.ts` が576行。両ファイルとも800行制限に近い。次のツール追加で容易に違反する。
**Category**: maintainability
**Severity**: medium
**修正案**: `skill.ts` を `skill-search.ts` + `skill-run.ts` に分割。`memory.ts` を `memory-write.ts` + `memory-read.ts` + `memory-admin.ts` に分割。
