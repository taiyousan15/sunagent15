# Round 14: 安全性 — Codex Challenge

## Finding 14-1: install.sh の set +e — AGREE（問題）、PARTIAL（修正案）

**問題の存在**: YES。`set +e` によりすべてのコマンドエラーが黙過される設計は、インストール結果の信頼性を損なう。

**Opus修正案への反論（2点）**:
1. **`require_success` 関数アプローチの問題**: 関数を使っても `set +e` 環境下では関数内部の失敗が伝播しない場合がある。`set -e` + 特定コマンドへの `|| true` の組み合わせが標準的で安全:
   ```bash
   set -e  # デフォルトはエラーで停止
   # 「失敗してよい」操作は明示的に || true を付ける
   chmod +x "$0" 2>/dev/null || true
   # 致命的操作はそのまま（失敗で停止）
   npm install
   npm run build
   ```
   これによりデフォルト安全（fail-fast）、例外を明示する設計になる。
2. **コメントの誤誘導**: 「1つの失敗で全体が止まるのを防ぐ」は `set -e` の正確な説明ではなく、「重大な失敗なら止まるべき」を隠す文化的問題。コメント自体も修正すべき。

**判定**: PARTIAL — `set +e` の問題は AGREE。Opus の `require_success` より `set -e` + `|| true` のパターンを推奨。

---

## Finding 14-2: update.sh の git reset --hard — AGREE（問題）、PARTIAL（修正案）

**問題の存在**: YES かつ **Severity: high 相当**。stash 失敗時のデータロスト経路が実在する。

**Opus修正案への反論（3点）**:
1. **インタラクティブ確認の問題**: `read -r -t 30 confirm` は CI/CD 環境や Claude Code 内から呼ばれた場合にタイムアウトして意図しない動作をする。`--force` フラグ設計の言及はOpusも触れているが、デフォルトは**拒否（exit 0）ではなく exit 1**にすべき — サイレント成功はデータロスト以上に危険。
2. **より安全な代替**: `git reset --hard` の前に `git diff HEAD` を確認し、変更がある場合は強制モードでも警告を出す:
   ```bash
   if ! git diff --quiet HEAD 2>/dev/null; then
       warn "警告: ローカルの変更が存在します。--force フラグなしでは reset --hard を実行しません"
       [ "${FORCE_UPDATE:-false}" = "true" ] || { exit 1; }
   fi
   git reset --hard origin/main
   ```
3. **stash との二重確認**: stash 済みの場合でも `reset --hard` で stash reflog が消えるわけではないが、ユーザーが知らない可能性がある。stash が存在する場合は `git stash list` の出力をアップデートログに記録する。

**判定**: PARTIAL — データロストリスクは AGREE (Critical 相当に格上げ提案)。確認プロンプトの設計はOpus案より `FORCE_UPDATE` 環境変数方式を推奨。

---

## Finding 14-3: stash pop 競合時のユーザー案内不足 — AGREE

**問題の存在**: YES。stash pop 失敗時のエラーメッセージが不十分。Opus 修正案は適切。

**Opus修正案への反論**: 追加なし。ただし `git stash show -p` は長大出力になるので `git stash list` + `git stash show --stat` を先に提示するのがより親切。

**判定**: AGREE（Opusの改善案を小修正して採用）

---

## Codex 追加指摘

### Finding 14-4 (新規)
**Issue**: `update.sh:8` も `set +e` で始まる。install.sh と同じ問題が update.sh にも存在する。特に `npm install` 失敗後に古いバイナリのままサービスが再起動されるシナリオは更新よりも危険（新旧コードの混在）。
**Evidence**: `update.sh:7` — `set +e`
**Category**: safety / reliability
**Severity**: high
**修正案**: install.sh と同様に `set -e` + `|| true` に変更。

### Finding 14-5 (新規)
**Issue**: `update.sh:82-86` の `rsync` フォールバックで `cp -R` を使用する際、`cd "$SOURCE_DIR"` で作業ディレクトリを変更しているが、この後 `cd` に失敗した場合（シンボリックリンク等）、`for item in *` が意図しないディレクトリを走査する。
**Evidence**: `update.sh:89-94` — `cd "$SOURCE_DIR"` + `for item in *; do cp -R "$item" "$REPO_DIR/"` 
**Category**: safety
**Severity**: medium
**修正案**: `cd` を `|| exit 1` で保護するか、`find "$SOURCE_DIR" -maxdepth 1 -mindepth 1` で明示的にパスを指定する。
