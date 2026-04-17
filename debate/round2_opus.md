# Round 2: アーキテクチャ — Opus Analysis

## Finding 1
**Issue**: 問題1オプションBはinstall.ps1とupdate.sh間で二重メンテナンスが固定化する
**Evidence**: scripts/install.ps1(614行) vs scripts/install.sh(547行)。既にsetup-project.ps1:181 vs install.ps1:385のずれが発生した根本原因が「二重実装」
**Category**: architecture
**Severity**: high
**推奨**: 長期的にはオプションC（Node.js化）が正解だが、即効性と breaking change回避のトレードオフを考慮しオプションBを短期対処とすべき

## Finding 2
**Issue**: 問題2でオプションD（dry-run）は「アップデート前に差分確認」という良い設計だが、非技術ユーザーには diff表示が難解
**Evidence**: install.sh完了メッセージ(line 509-511)がすでに初心者向け日本語。dry-run結果のJSON diff は読めない
**Category**: architecture
**Severity**: medium
**推奨**: dry-runはオプション扱い（--dry-run flag）とし、デフォルトはオプションC（backup自動生成）+オプションB（additive-only）の組み合わせ

## Finding 3
**Issue**: 問題3オプションD（別プロジェクト通知）はhookのアーキテクチャとして「hook自身が自己の非アクティブ状態を通知できない」矛盾
**Evidence**: .claude/settings.json hook pattern `[ ! -f .claude/hooks/XXX.js ] && exit 0` — ファイル不在 = hook自体が実行されない
**Category**: architecture
**Severity**: critical
**推奨**: SessionStart hookは絶対パスで参照するものと相対パスのものを分離し、ガード系hookのみ絶対パス参照に変更
