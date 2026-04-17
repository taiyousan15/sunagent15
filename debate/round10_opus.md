# Round 10: エッジケース — Opus Analysis

## Finding 1
**Issue**: 問題1でupdate.ps1（オプションB）追加後、ユーザーが`install.ps1 -Update`フラグで呼ぶ設計と、別ファイル`update.ps1`で呼ぶ設計で、package.jsonのnpmスクリプトとの整合が取れない
**Evidence**: package.json:8 `"update": "bash scripts/update.sh"` — Windows対応後は `"update": "node scripts/platform-runner.js update"` 等への変更が必要でさらに連鎖する
**Category**: code
**Severity**: medium
**推奨**: install.ps1に`-Update`スイッチを追加（別ファイル不要）。npm run updateは`bash ... || powershell ...`の条件分岐で対応

## Finding 2
**Issue**: 問題2でadditive-only（オプションB）実装時、MCPのキーが変更（リネーム）された場合、旧キーが残留し新キーが追加される二重登録が発生する
**Evidence**: install.sh:440での`settings.mcpServers[key] = server` — キー変更の場合、旧キーを削除しない
**Category**: code
**Severity**: medium
**推奨**: MCPのキー変更があった場合はmigrationガイドを別途提供。自動マイグレーションは複雑なため手動誘導が安全

## Finding 3
**Issue**: 問題3でsymlink dangling検知（オプションC）実装時、Windowsでは`ln -sf`を使わず`Junction`またはコピーのため、danglingの概念が適用されない
**Evidence**: install.ps1:362-365でJunction→copyフォールバック実装済み — Windowsはsymlink非使用
**Category**: code
**Severity**: medium
**推奨**: dangling検知はMac/Linuxのみ有効。Windows向けは「skills/フォルダのファイル存在チェック」に置き換え
