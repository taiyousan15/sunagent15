# Round 8 — Codex Challenge

## Finding 1
**Verdict**: AGREE
**Reason**: Windows CI不在は実際のリスク。PowerShellのパス処理・文字コード（UTF-8 BOM問題）・改行コードはLinux CIでは検出不可能なバグを多数含む。update.ps1追加時にWindows統合テストがなければ、リリース後に初めて問題が発覚するリスクが高い。
**Alternative/Supplement**: GitHub Actions windows-latest追加に加え、`Set-StrictMode -Version Latest`をps1スクリプト先頭に追加することで未定義変数参照をCIで検出できる。テスト前の最低コスト防御として即時実施すべき。

## Finding 2
**Verdict**: PARTIAL
**Reason**: 関数分離の提案は正しいが、`src/utils/settings-merge.ts`として切り出す際に既存のインラインNode.jsスクリプトとの二重管理リスクが生まれる。分離後に旧インラインを確実に削除しなければデグレの温床になる。
**Alternative/Supplement**: 分離と同時にinstall.sh内のインラインNode.jsブロックを`node src/utils/settings-merge.js`の単一行呼び出しに置き換えることを必須条件とすべき。テスト追加だけで旧コードを残すのは禁止。

## Finding 3
**Verdict**: AGREE
**Reason**: verificationスクリプト自体がテストされていない問題はFinding 1と連鎖する。Windows CIのないままverificationを追加しても、「verification自体がWindows環境で誤検知する」バグが表面化しない。両者はセットで対処が必要。
**Alternative/Supplement**: verificationのモックテストはPester（PowerShell向けテストフレームワーク）で実装することで、GitHub Actions windows-latestジョブとの統合が容易になる。docker/windows-containerより導入コストが低い。
