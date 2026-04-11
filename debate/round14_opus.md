# Round 14: 安全性 (install.sh の set +e / update.sh の git reset --hard) — Opus Analysis

## Finding 14-1
**Issue**: `scripts/install.sh:13-14` の `set +e` はスクリプト全体のエラー終了を無効化する。重大なセットアップ失敗（npm install 失敗、ビルド失敗、設定ファイル書き込み失敗）がサイレントに通過し、壊れた状態でインストールが「成功」したように見える。
**Evidence**:
- `install.sh:13` コメント: 「set -e を使わない（1つの失敗で全体が止まるのを防ぐ）」— 意図的な設計だが、致命的操作でも継続する
- `install.sh:14` `set +e` — 以降のすべてのコマンドでエラーが無視される
- Xcode CLI チェック (`install.sh:35`) は `exit 1` しているが、その後の npm/git 操作は失敗しても継続
- ユーザーはスクリプト完了後に成功したと思い込むが、npmパッケージが未インストールの状態になりうる
**Category**: safety / reliability
**Severity**: medium

### 修正案
重要操作のみ明示的にエラーチェックし、致命的失敗では終了させる:
```bash
# set +e は維持しつつ、致命的操作には explicit チェックを追加
npm install || { echo "  ❌ npm install に失敗しました。中断します。"; exit 1; }

# または関数化
require_success() {
    "$@" || { echo "  ❌ 必須操作に失敗しました: $*"; exit 1; }
}
require_success npm install
require_success npm run build
```
`set +e` 自体を削除するのではなく、「失敗してよい操作」と「致命的操作」を明示的に区別する設計にする。

---

## Finding 14-2
**Issue**: `scripts/update.sh:70` の `git reset --hard origin/main` はユーザーのローカル変更を破壊する可能性がある。`git stash` でローカル変更を退避した後でも、stash できなかった untracked ファイルや stash 失敗時のデータが消える。
**Evidence**:
- `update.sh:63-66`: `git stash push` でローカル変更を退避するが、`&&` で結果を確認しているので stash 失敗時は `STASHED=false` のまま続行する
- `update.sh:68-70`: `git pull --ff-only` が失敗すると `git reset --hard origin/main` を実行
- `git reset --hard` は untracked ファイルには作用しないが、tracked ファイルの全変更が消える
- stash 失敗シナリオ（マージ競合、権限問題等）では退避されていないローカル変更が `reset --hard` で永久消去される
- コメント「強制同期」は破壊的操作であることをユーザーに明示していない
**Category**: safety / data-loss
**Severity**: high

### 修正案
`git reset --hard` 前に必ずユーザーに警告し、確認を求める:
```bash
git pull origin main --ff-only 2>/dev/null || {
    info "通常の更新ができませんでした。"
    warn "ローカル変更を破棄して最新版に同期します。"
    warn "この操作は元に戻せません。続行しますか？ [y/N]"
    read -r -t 30 confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        git reset --hard origin/main 2>/dev/null || {
            warn "git同期に失敗しました..."
            # ZIPダウンロードへ
        }
    else
        warn "ユーザーがキャンセルしました。更新を中断します。"
        exit 0
    fi
}
```
非インタラクティブ環境（CI/CD等）での実行は `--force` フラグで明示的に許可する設計にする。

---

## Finding 14-3
**Issue**: `update.sh:64` の `git stash push` 失敗後の `git stash pop` (`update.sh:108`) で、stash されていないのに pop しようとする可能性がある。`STASHED` フラグは `&&` 演算子で設定されているが、コマンド置換の評価順序によってはフラグ設定が不確実になりうる。
**Evidence**:
- `update.sh:64` `git stash push -m "..." 2>/dev/null && STASHED=true`
- `update.sh:107-110` `if [ "$STASHED" = true ]; then git stash pop ...`
- `set +e` 環境下では `&&` の左辺失敗が完全にサイレント。`STASHED=true` が設定されない場合、pop はスキップされ実害なし
- ただし stash 成功後に `reset --hard` で stash 内容との競合が発生した場合、`stash pop` が失敗してユーザー変更がスタックに残留する
**Category**: safety / reliability
**Severity**: low

### 修正案
stash pop 失敗時のメッセージを改善し、スタック確認コマンドを案内する:
```bash
if [ "$STASHED" = true ]; then
    if git stash pop 2>/dev/null; then
        ok "退避した設定変更を元に戻しました"
    else
        warn "設定変更の復元に失敗しました。以下のコマンドで確認してください:"
        warn "  git stash list    # スタックの確認"
        warn "  git stash show -p # 変更内容の確認"
        warn "  git stash pop     # 手動で復元"
    fi
fi
```
