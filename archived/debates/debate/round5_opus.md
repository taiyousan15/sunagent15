# Round 5: セキュリティ — Opus Analysis

## Finding 1
**Issue**: 問題2でbackup（オプションC）が`~/.claude/settings.json.bak.{date}`に保存される場合、バックアップに過去のAPIキーが平文保存される
**Evidence**: install.sh:427-455 — SETTINGS_FILEに内容を書き込む。settings.jsonにAPIキーが入っている可能性（.mcp.json経由でenvが展開される場合）
**Category**: security
**Severity**: high
**推奨**: backupファイルのパーミッションを600（所有者のみ読み書き）に設定。または.bakをgitignoreに追加確認

## Finding 2
**Issue**: 問題1でupdate.ps1が追加された場合、install.ps1の`-Profile`予約変数衝突は修正が必要だが、修正後も`[string]$SkillProfile`をユーザーがprofile.ps1で上書きできる
**Evidence**: install.ps1:17の変数スコープ — PowerShellパラメータはスコープがスクリプト局所のため実害は限定的
**Category**: security
**Severity**: low
**推奨**: 変数名改名（-SkillProfile）で十分。スコープ問題の実害は低い

## Finding 3
**Issue**: 問題3のpost-install verification（オプションA）で`npm run taisun:diagnose`がAPIキーをログに出力する可能性
**Evidence**: scripts/validate-env.shが`.env`を読む → diagnose経由で同様の処理が走る場合、ログにキーが残る
**Category**: security
**Severity**: medium
**推奨**: diagnoseスクリプトがAPIキーをログに出力しないことを確認。出力は`sk-ant-***`形式でマスク
