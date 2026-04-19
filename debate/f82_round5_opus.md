# F8.2 Round 5: 統合レビュー — Opus Analysis

観点: Round 1-4 の未解決を総括 + 実行計画の妥当性、PR 戦略、回帰リスク

## Finding 5-1
**Issue**: L-full 実装計画で 67 件を Opus 4.7 単独 or Opus + Codex 分担で編集する際、*同時編集による merge conflict リスク* が残る。各スキル独立と言っても、YAML frontmatter 修正中に scan 再実行など共有 state がある。
**Evidence**: mistakes.md Pattern 8 (修正が新たなバグを導入) / 指示書§3 タスク2「単独 PR 必須（他項目と混在禁止）」
**Category**: architecture
**Severity**: medium
**Proposed fix**: 編集を **シリアル** に進める（並列 agent 不使用）。Opus が Group A 42件 + Group B 25件 を順次 Edit。各 Edit 後に validator を回して incrementally 確認。Pattern 10 を最優先し速度を犠牲にする。

## Finding 5-2
**Issue**: 指示書§3 タスク2 工数「3-4時間」は debate にない推定値。実測で 7-8 時間かかる可能性が高い。セッション時間残と Opus 4.7 context window の余裕を勘案し、**Phase 分割** が現実的。Phase 1 = Schema + Validator + CI + Group A 42件、Phase 2 = Group B 25件 + --strict 化。
**Evidence**: 実測 2-3 時間経過で schema/validator まで完了 / 指示書§3 タスク2 備考 "根拠は debate にない推定値"
**Category**: architecture
**Severity**: high
**Proposed fix**: **L-full** を 2 PR に分割: (A) Phase 1 PR = schema+validator+CI+Group A、(B) Phase 2 PR = Group B + --strict。ただしユーザーが「L-full 単独 PR」に明示執着する場合は執行し、失敗時の rollback plan を明記。

## Finding 5-3
**Issue**: F8.2 単独 PR 合意下で frontmatter fix 3件 (research-system-free/stagehand/world-research) が scope に入っているが、これは「F8.2 のための前準備」であり、本来別 fix(frontmatter) PR にすべき。現状ブランチ上で既に commit 予定だが scope creep。
**Evidence**: 作業済の3件 Edit / 指示書§3「単独 PR 必須」
**Category**: code
**Severity**: medium
**Proposed fix**: Option A: 3件を *本 F8.2 PR 内で「前提となる frontmatter fix」として commit* し PR 説明で区別。Option B: 切り出して `fix(skills): YAML frontmatter hygiene` 単独 PR にして先にマージ → F8.2 rebase。後者が綺麗だが PR 数が増える。Codex の意見で決める。
