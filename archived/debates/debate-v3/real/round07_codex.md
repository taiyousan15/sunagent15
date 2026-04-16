# Round 7: コスト効率 — Codex empirical verification

### Finding 1
`round07_opus.md` は A1-A4/A6-A10 のパスを列挙していないため、Opus の他ラウンドで明示された untrack 対象を検証対象とした: `dist/`, `.taisun/`, `research/runs/`, `udemy-downloader/.venv/`, `tools/codebase-memory-mcp/`, `.claude/skills/nanobanana-pro/data/browser_profile/`, `scripts/originals/backups/`, `.workflow_state_backups/`。

### Finding 2
追跡状態の実測: `git ls-files -- dist/ .taisun/ research/runs/ udemy-downloader/.venv/ tools/codebase-memory-mcp/ .claude/skills/nanobanana-pro/data/browser_profile/ scripts/originals/backups/ .workflow_state_backups/` は無出力、`[tracked_total] 0`。各ディレクトリ単位でも `git ls-files -- <target> | wc -l` は全て 0。結論: tracked 0/8、already untracked 8/8。

### Finding 3
分類の実測: `git ls-files --others --exclude-standard -- <target>` は全対象 0（非ignoreの untracked 0）。一方 `git check-ignore -v <sample>` は全対象ヒット: `.gitignore:22 dist/`, `.gitignore:141 .taisun/`, `.gitignore:144 research/`, `udemy-downloader/.gitignore:91 .venv`, `.gitignore:150 tools/...`, `.gitignore:164 backups`, `.gitignore:142 .workflow_state_backups/`, `.claude/skills/nanobanana-pro/.gitignore:14 data/`。

### Finding 4
主張「untrack 対象が実はほとんど既に untracked」は、検証した Opus 明示対象では部分一致ではなく 100% 一致（8/8 が既に untracked かつ gitignored）。したがって `git rm -r --cached` の即時効果は tracked 削減 0 ファイル。Round 7 の「10分で効果大」は現状リポでは過大評価。
