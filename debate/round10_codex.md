# Round 10 — Codex Challenge

## Finding 1
**Verdict**: PARTIAL
**Reason**: install.ps1への`-Update`スイッチ追加の推奨は合理的だが、`npm run update`を`bash ... || powershell ...`の条件分岐で対応する案は、npmスクリプト内でのPowerShell起動は`&&`/`||`ではなく`node -e`経由が安定しており、実装コストが「別ファイル不要」より高くなる場合がある。問題の本質はcross-platformなエントリーポイントの欠如であり、連鎖問題の指摘は正確。
**Alternative/Supplement**: `npm run update`はNode.js製の薄いdispatcher（`scripts/update.js`）を1ファイル追加し、OS判定後に`child_process.execFileSync`で各スクリプトを呼ぶ設計が最小コストで整合性を保てる。install.ps1への`-Update`スイッチは引き続き有効で両立可能。

## Finding 2
**Verdict**: AGREE
**Reason**: additive-only設計でMCPキーがリネームされた場合の旧キー残留は実際に発生する。旧名のMCPサーバーが起動試行し続けてエラーログが増殖する点でmediumより深刻になる場合もある。手動マイグレーション誘導の推奨は保守的かつ現実的な判断として妥当。
**Alternative/Supplement**: `.mcp.json.example`に変更があった際、旧キーを`deprecated_keys`配列として明示しておき、install時に「このキーが残っています」と警告するだけのチェックを追加すると手動誘導の漏れを防げる。削除は行わず警告のみで安全性を保つ設計。

## Finding 3
**Verdict**: AGREE
**Reason**: WindowsではJunctionまたはコピーフォールバックが実装済みであり、symlinkのdangling概念がそのまま適用されないのは正確な観察。ただし「ファイル存在チェックに置き換え」の推奨は、コピー実装ではコピー元との乖離（更新漏れ）を検知できないという別問題を抱える点が補足不足。
**Alternative/Supplement**: Windows向けは「コピー先ファイルのハッシュとコピー元ハッシュの比較」で整合性チェックを実装する方が単純な存在チェックより実態に即している。Mac/Linux向けのdangling検知と目的を揃えつつ、実装を環境分岐できる。
