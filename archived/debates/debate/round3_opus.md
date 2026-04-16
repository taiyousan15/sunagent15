# Round 3: エラー処理 — Opus Analysis

## Finding 1
**Issue**: 問題1でupdate.ps1を追加した場合、PowerShellのErrorActionPreference="Continue"(install.ps1:31)がエラーを飲み込む
**Evidence**: scripts/install.ps1:31 `$ErrorActionPreference = "Continue"` — Windows updateでも同じ設定継承なら失敗が見えない
**Category**: code
**Severity**: high
**推奨**: update処理部分はErrorActionPreference="Stop"に切り替え、try/catchで明示的にエラーをユーザーに表示する

## Finding 2
**Issue**: 問題2でbackup（オプションC）実装時、backup失敗した場合にアップデートを継続するか停止するかの設計が未定義
**Evidence**: install.sh全体の `set -e` + `|| true` パターン — backupコマンドが失敗してもinstallが続行される可能性
**Category**: code
**Severity**: medium
**推奨**: backup失敗 = アップデート中断（fail-safe）が正しい設計。backup成功確認後にMCP更新を実行

## Finding 3
**Issue**: 問題3でpost-install verification（オプションA）が失敗した場合のロールバック手順が存在しない
**Evidence**: scripts/restore.sh, scripts/rollback-manager.sh が存在するが、installスクリプトから参照されていない
**Category**: code
**Severity**: medium
**推奨**: verificationが失敗したらrollback-manager.shを自動呼び出し。または「失敗した場合は再インストールしてください」を明示
