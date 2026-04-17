# Round 9: 運用性 — Opus Analysis

## Finding 1
**Issue**: 問題1でupdate.ps1（オプションB）追加後、Windows/Mac/Linuxでupdate失敗した場合のログが統一されていない
**Evidence**: install.sh:98-101で ok/warn/info/fail 関数を定義 — install.ps1でも同等のWrite-Host関数があるが形式が異なる
**Category**: architecture
**Severity**: medium
**推奨**: エラーログの出力フォーマットを統一（タイムスタンプ・OS種別・エラーコード）してサポート対応を容易にする

## Finding 2
**Issue**: 問題2でadditive-only（オプションB）実装後、「どのMCPが今回のupdateで追加されたか」のサマリーがユーザーに届かない
**Evidence**: install.sh:509-511の完了バナーにMCPの変更差分表示なし
**Category**: architecture
**Severity**: medium
**推奨**: update完了時に「新規追加MCP: N件、更新MCP: M件、既存保持: K件」を表示。ユーザーが何が変わったか把握できる

## Finding 3
**Issue**: 問題3でSessionStart hook に dangling symlink チェック（オプションC）を追加した場合、毎セッション起動時にfsスキャンが走り遅延する可能性
**Evidence**: ~/.claude/skills/配下のスキル数は100+。毎回全スキャンはI/Oコストが高い
**Category**: architecture
**Severity**: medium
**推奨**: dangling checklastrun timestamp をキャッシュし、24時間に1回だけチェック。または`npm run taisun:diagnose`を手動実行に委ねる
