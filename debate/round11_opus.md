# Round 11: ユーザー体験 — Opus Analysis

## Finding 1
**Issue**: 問題1の修正後でも、初心者Windowsユーザーは`npm run update`と`.\scripts\install.ps1 -Update`のどちらを使うべきか判断できない
**Evidence**: README.md:537 `git pull origin main && npm run setup` の案内 — npmとpowershellの二重案内は混乱を招く
**Category**: architecture
**Severity**: medium
**推奨**: README.mdのアップデート手順をOS別に分岐して記載。Mac/Linux: `git pull && npm run update`、Windows: `git pull && .\scripts\install.ps1 -Update`

## Finding 2
**Issue**: 問題2でbackup+additive-only（オプションB+C）の組み合わせは、ユーザーがMCPを完全に入れ替えたい場合（全リセット）の手段がなくなる
**Evidence**: additive-onlyはユーザー値優先のため、壊れた設定を正しいデフォルトで上書きできない
**Category**: architecture
**Severity**: medium
**推奨**: `npm run setup:reset`コマンドで「バックアップ後に全リセット」オプションを別途提供。通常updateはadditive-only

## Finding 3
**Issue**: 問題3での「動いて見えて壊れている」体験は、実は最大の問題がREADMEの`git pull && npm run setup`案内にある — ユーザーが破壊的updateを「公式の使い方」と信じている
**Evidence**: install.sh:537 完了メッセージで堂々と案内 — ユーザーの期待値形成の段階で問題が埋め込まれている
**Category**: architecture
**Severity**: high
**推奨**: README.mdのアップデート案内を問題2修正と同時に更新。修正なしにREADME更新だけでも一定の被害を防げる
