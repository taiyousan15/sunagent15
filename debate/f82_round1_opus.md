# F8.2 Round 1: 機能正確性 — Opus Analysis

観点: validator & schema が F8.2 の目的（「外部バイナリと env の統一 requires schema + CI enforcement」@ debate/codex_15rounds_response.md:38）を実際に満たすか

## Finding 1-1
**Issue**: `requires.tools` に `node` を書くのは不適切。Node.js は TAISUN 全体の前提ランタイム（package.json engines で >=18 強制済）であり、ツールではない。Node 固有バージョン要求は `requires.node` に寄せるべき。`requires.tools: [node]` と書かれたスキルが混入すると、`node.version` チェックと `tools.node` チェックの二重実装を招く。
**Evidence**: scripts/check-skill-requirements.js validateRequires() で node は tools 配列の一要素として素通しされる / 外部スキャン結果で 30+ スキルに `node` が登場
**Category**: architecture
**Severity**: high
**Proposed fix**: validator で `requires.tools` が `node` `npx` `npm` を含む場合 reject、または警告。docs/SKILL_REQUIRES_SCHEMA.md に "tools には node/npm を書かない" を明記。

## Finding 1-2
**Issue**: `requires:` の記入は本文内の実行時依存に基づくべきだが、grep-based scan は description 文中の単なる言及も拾う。例えば `x-bijinesu/SKILL.md` に "xAI Grok-3（クラウドLLM）" と書かれていても、実行には ANTHROPIC_API_KEY 経由の Claude API のみ使うかもしれない。Pattern 7（エージェント報告の未検証転記）/ Pattern 10 のリスク。
**Evidence**: mistakes.md Pattern 7 & 10 / 一括スキャン時 xtaiou の `ENCRYPTION_KEY` が誤検出された
**Category**: content
**Severity**: critical
**Proposed fix**: 各スキルに記入する前に、SKILL.md 本文の「## 実行」「## パイプライン」「## 使い方」セクションの具体コマンド例を Read して裏を取る。description 文の単独言及だけでは記入しない。

## Finding 1-3
**Issue**: CI の skill-requirements-check は non-strict default（requires: 欠損で pass）だが、Phase 1 で 67 件全部記入する L-full 合意下では、次に「新スキルが requires なしで入った」ことを検知できない。Phase 2 の --strict 化まで抜け穴が残る。
**Evidence**: scripts/check-skill-requirements.js の strict flag / docs/SKILL_REQUIRES_SCHEMA.md Phase 1 定義
**Category**: config
**Severity**: medium
**Proposed fix**: L-full 完遂後の PR で CI default を `--strict` に切り替える。Phase 1 PR 内で変更するか、別 PR で分けるかは Codex 判断。
