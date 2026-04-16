# Round 6: 日本語UX — Opus Analysis

## Finding 1
**Issue**: 問題1修正後、Windowsユーザーが`npm run update`を実行した際のエラーメッセージ「bash: command not found」は英語で初心者が詰まる
**Evidence**: package.json:8 `"update": "bash scripts/update.sh"` — Windows環境ではbashが使えない場合にのみエラー
**Category**: architecture
**Severity**: medium
**推奨**: package.jsonのupdateスクリプトをOS判定付きに変更。または`npm run update`実行時に「Windowsは`.\scripts\install.ps1 -Update`を使用してください」を事前表示

## Finding 2
**Issue**: 問題2でadditive-only（オプションB）実装後、ユーザーが「新しいMCPが追加されたのになぜ動かないか」を理解できない（disabled:trueで追加するため）
**Evidence**: .mcp.json.exampleの初心者向けコメントがほぼない — disabled状態の意味を説明する文書なし
**Category**: architecture
**Severity**: medium
**推奨**: 新MCP追加時に「新しいツールが追加されました。有効にするには.mcp.jsonのdisabledをfalseに変更してください」を表示

## Finding 3
**Issue**: 問題3でsymlink dangling警告（オプションC）をSessionStart hookが出す場合、Claude Codeのシステムリマインダーと混在して見落とされやすい
**Evidence**: 現在のhookの警告はsystem-reminderに埋もれている（セッション9で実際に起きた「dead CWD」も気付くのが遅かった）
**Category**: architecture
**Severity**: medium
**推奨**: dangling symlink警告は冒頭に「⚠️ TAISUN スキル: X件のリンクが壊れています」として目立つフォーマットで出力
