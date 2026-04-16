# Round 13: Codex Ground-Truth Review (データ整合性)

## 検証結果（各 finding <=600 chars）

### Finding C1 (Opus F1-1: "3件 commit済")
判定: **不一致（現HEAD）**。3ファイルは存在するが、現HEADでは tracked 0。過去には追加→削除の履歴のみ。実測: `git ls-files .workflow_state_backups` は空、`git show cbe126c -- .workflow_state_backups` は3件A、`git show b38a17c -- .workflow_state_backups` は3件D。Evidence: `.workflow_state_backups/git-state-1770918150.json:1`, `.workflow_state_backups/git-state-1770918684.json:1`, `.workflow_state_backups/git-state-1770919095.json:1`, `.gitignore:92,142`.

### Finding C2 (Opus F1-2: "参照/世代管理不明")
判定: **不一致**。`.workflow_state_backups` は実参照あり。手動系は `STATE_DIR` に設定し (`scripts/auto-session-backup.sh:8`)、30日保持で削除 (`:11,:102-105`)。setup/status でも件数参照 (`scripts/setup-auto-backup.sh:30,:93`)。launchd側も別ディレクトリだが同じ30日削除 (`scripts/launchd/launchd-backup-wrapper.sh:9,:11,:51-53`)。実測grepでも参照検出。

### Finding C3 (Opus F2: debate-v2 1ファイル)
判定: **一致**。`debate-v2/` の実ファイルは `agreement_summary.md` の1件のみ。実測: `find debate-v2 -type f | wc -l => 1`。Evidence: `debate-v2/agreement_summary.md:1`。

### Finding C4 (Opus F3: checkpoints 94 files)
判定: **不一致**。`checkpoints/` 直下は存在せず、実体は `.claude/checkpoints`。実測は **95 files / 380K**。実測: `find checkpoints -type f` はNo such file、`find .claude/checkpoints -type f | wc -l => 95`、`du -sh .claude/checkpoints => 380K`。Evidence: `.gitignore:154`, `.claude/hooks/rules-read-tracker.js:27`, `.claude/hooks/mid-session-reminder.js:25`, `.claude/hooks/checkpoint-guard.js:31`。

### Finding C5 (重大見落とし1: required_skills汚染)
判定: **重大**。skill抽出に `/([a-zA-Z0-9_-]+)/` を使うため、パス断片まで skill として誤登録される。抽出値はそのまま `evidence.required_skills` に書込 (`.claude/hooks/skill-usage-guard.js:46,:120-123,:139-145`)。実データでも `Desktop`,`dev04`,`task-id`,`tool-use-id`,`tmp` 等が混入 (`.workflow_state.json:68-76,93-101,108-121`)。データ整合性を直接破壊。

### Finding C6 (重大見落とし2: checkpoints世代管理欠落)
判定: **重大**。`.claude/checkpoints` には `read_*.jsonl` と `prompt_count_*.json` を継続生成 (`.claude/hooks/rules-read-tracker.js:47,:58`, `.claude/hooks/mid-session-reminder.js:36,:49`) するが、cleanup対象は `done_*.flag` のみ (`.claude/hooks/checkpoint-guard.js:91-96`)。実測95件に増加済。Opusは件数だけで、型別の無制限増殖リスクを見落とし。

## 実施コマンド（抜粋）
- `rg -n --hidden --no-ignore "\.workflow_state_backups" .`
- `find debate-v2 -type f | wc -l`
- `find . -type d -name checkpoints`
- `find .claude/checkpoints -type f | wc -l`
- `du -sh .claude/checkpoints`
- `git ls-files .workflow_state_backups .claude/checkpoints .workflow_state.json .agent_usage_state.json`
