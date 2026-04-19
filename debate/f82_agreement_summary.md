# F8.2 Agreement Summary (5 Rounds, Opus × Codex Pro)

## AGREE / AGREE-MODIFY (実装確定: 9 items)

| # | Round | Finding | Category | Verdict | 実装内容 |
|---|-------|---------|----------|---------|---------|
| 1 | R1 | F1-1 tools に node 系禁止 | architecture | AGREE-MODIFY | validator で node/npm/npx を warn、docs 明示 |
| 2 | R1 | F1-2 目視検証プロセス厳格化 | content | AGREE | Group A 27件は SKILL.md 本文 Read で裏取 |
| 3 | R1 | F1-3 L-full 後 --strict 化 | config | AGREE | 本 PR で docs roadmap 追記、--strict は次 PR |
| 4 | R2 | F2-3 EXCLUDED_DIRS 明示化 | code | AGREE | `EXCLUDED_DIRS = ['_archived']` 定数化 |
| 5 | R3 | F3-2 env optional 拡張 | architecture | AGREE | env に `string \| {name, required}` 許容 |
| 6 | R4 | F4-1 paths-filter skills 絞込 | config | AGREE | changes job に skills output 追加 |
| 7 | R4 | F4-2 actionable hint 付加 | code | AGREE | エラーメッセージに例示 (ffmpeg, yt-dlp) |
| 8 | R4 | F4-3 GITHUB_STEP_SUMMARY 出力 | config | AGREE | `--github-summary` flag 追加 |
| 9 | R5 | F5-3 frontmatter fix 同 PR | code | AGREE | 前提 commit として区別 |

## PARTIAL (部分採用)

| # | Round | Finding | Status | 判断 |
|---|-------|---------|--------|------|
| A | R2 | F2-1 dependencies vs requires 差分 | PARTIAL | docs 既に記述、**微調整で対応** |
| B | R2 | F2-2 空マッピング vs 省略 | PARTIAL | L-full 後 `--strict` 化時に区別化（次 PR） |
| C | R3 | F3-1 env trust model | PARTIAL | docs に "宣言≠権限" 明記 + 機密名 warn 追加 |

## DISAGREE (不採用)

| # | Round | Finding | Codex 判定 | 理由 |
|---|-------|---------|------------|------|
| D | R3 | F3-3 regex ReDoS | DISAGREE | lazy match だが入れ子量指定なしで安全。行走査は nice-to-have |
| E | R5 | F5-2 Phase 分割 | DISAGREE | 指示書§3「単独 PR 必須」に反する。L-full 単独 PR 強行 |

## 採用方針

- **F5-1 Codex 代替案**: 編集は **直列**、Read のみ並列可 ← 採用（Pattern 8/10 回避）
- **F5-2 Codex DISAGREE**: L-full 単独 PR 強行 ← 採用
- **F5-3 Codex AGREE**: frontmatter fix 3件は「前提 commit」として同 PR に含める、他修正は別 PR

## 実装順序（合意後のロードマップ）

### Phase A: schema + validator + CI 整備（合意事項反映）
1. docs/SKILL_REQUIRES_SCHEMA.md 更新（F1-1, F1-3, F2-3, F3-1, F3-2 反映）
2. scripts/check-skill-requirements.js 更新（F1-1, F2-3, F3-2, F4-2, F4-3 反映）
3. .github/workflows/ci.yml に CI job 追加（F4-1, F4-3 反映）

### Phase B: 67 スキル棚卸し（直列編集）
4. Group B 40件に `requires: {}` 一括追加
5. Group A 27件に SKILL.md Read + 個別記入

### Phase C: 検証 + PR
6. validator 実行 → clean pass
7. main 回帰確認（jest 1107/1107 + eslint clean）
8. commit (5 commits: frontmatter fix / schema / validator / CI / skills 棚卸し) → push → PR 作成
