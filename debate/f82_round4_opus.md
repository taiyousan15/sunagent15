# F8.2 Round 4: 運用性 — Opus Analysis

観点: CI 設計、エラーメッセージ、debug 可能性、paths-filter の境界

## Finding 4-1
**Issue**: PR #324 で paths-filter を `.claude/**` 全体にすると、skill-requirements-check CI が symlinks 自動生成や hook data 更新でも毎回走る（TAISUN v2 は `.claude/skills/*/` に自動 symlink を作る運用）。false positive trigger が多く CI コスト増。
**Evidence**: PR #324 ci.yml paths-filter `code` ブロックに `.claude/**`（docs filter) / git status に symlink 約30件が常に untracked
**Category**: config
**Severity**: medium
**Proposed fix**: skill-requirements-check は独自 paths-filter を持つ：
```yaml
if: |
  needs.changes.outputs.skills == 'true' ||
  contains(fromJson(needs.changes.outputs.all_changed_files), 'scripts/check-skill-requirements.js') ||
  contains(fromJson(needs.changes.outputs.all_changed_files), 'docs/SKILL_REQUIRES_SCHEMA.md')
```
changes job に新 output `skills` を追加し、`.claude/skills/*/SKILL.md` のみ trigger。

## Finding 4-2
**Issue**: validator エラーメッセージは `[rel] requires.tools[0] "foo" must match /regex/` の形式だが、スキル作者は正規表現の読解を求められる。具体例を示すべき。
**Evidence**: scripts/check-skill-requirements.js validateRequires() line 82-83
**Category**: code
**Severity**: low
**Proposed fix**: エラーメッセージに `例: ffmpeg, yt-dlp, python3 (kebab-case)` などの actionable hint を付ける。F11.3 (install.sh) の diagnose_npm_log と同じ方向性。

## Finding 4-3
**Issue**: `skill-requirements-check` が fail した場合、*どのスキルの何が問題か* を PR summary に出さないと開発者が GitHub Actions log を掘る必要がある。GITHUB_STEP_SUMMARY への書き込みが欠落。
**Evidence**: scripts/check-skill-requirements.js 出力は console のみ / ci.yml install-smoke 等は GITHUB_STEP_SUMMARY を使用
**Category**: config
**Severity**: medium
**Proposed fix**: validator に `--github-summary` フラグを追加し、$GITHUB_STEP_SUMMARY に Markdown テーブル出力。
