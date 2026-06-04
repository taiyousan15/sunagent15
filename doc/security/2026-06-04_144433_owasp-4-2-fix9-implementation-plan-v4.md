# OWASP 4-2 FIX-9（検証付き更新）実装計画 v4 — Codex 実装前ゲート round4 対象

- **作成**: 2026-06-04 14:44 / session 49 / Opus 4.8 (ultracode)
- **対象**: sunagent15 / FIX-9 専用 PR（①②③ は PR #30 で先行・本PRは別PR＝option B）
- **位置づけ**: plan v3 §TASK-C の置換版。設計ワークフロー（map→3 lens draft→敵対的検証→統合・8 agents）＋ **Opus 実ファイル裏取り**で確定。plan v3 の FIX-9 設計に**ブリック級バグ3件**が見つかったため v4 で修正。
- **ロールアウト**: **C-MODE-1（OPT-IN・既定 OFF）**。`TAISUN_UPDATE_VERIFIED=true` の時のみ verified_update を実行。既定挙動は現行 git フロー逐語温存（非回帰）。**C-MODE-2（既定 flip）は実 release 公開＋手動 verified 成功＋署名検証追加の後の別 commit**。
- **依存版確定**: Codex はオフライン＝シェル/ロジック/フロー安全性をレビュー。npm 事実は Opus 実測（下記）を ground truth とする。

## 0. Opus 実測検証済みの前提（session 49・read-only）

| # | 事実 | 確認 |
|---|---|---|
| P1 | root に `build` script は**存在しない**（`npm run build --if-present` は no-op／plan v3 の verified build fail-closed は空振りだった） | `node -e scripts.build` = undefined |
| P2 | 実ビルドは `build:all`=`proxy:build && scripts:build`（`tsc --project tsconfig.{proxy,scripts}.json`×2）。`postinstall: npm run build:all` | package.json |
| P3 | `typescript` は **devDependency のみ**（`^5.3.2`）。`dist/` は **gitignore（L28）**＝tarball 非同梱 | package.json / `git check-ignore dist` |
| P4 | → 単純 `npm ci --omit=dev` は postinstall(build:all=tsc)が typescript 不在で**必ず失敗＝ユーザー機ブリック**。正しい解＝**build-then-prune** | 導出（P1-P3） |
| P5 | GitHub release **0件**（latest 404）＝アセット未公開→verified 経路は当面毎回 return 1→legacy fallback（既定 OFF ゆえ無害） | `gh release list` |
| P6 | update.sh = **290行**。anchors: `set -e`(L7)・`$REPO_DIR`(L9)・helper/step(L15-18)・`.git`ゲート(L41-45)・`cd "$REPO_DIR"`(L47)・`CURRENT_VERSION=$VERSION`(L48)・`git fetch origin`(L59)・legacy stash(L62-66)・git pull/ZIP/FORCE(L69-113)・stash pop(L116-125)・`NEW_VERSION`(L127)・root npm(L138-144)・root build `--if-present`(L146-152)・MCP loop(L154-166) | Read + grep |
| P7 | install.sh: `export TAISUN_AGENT_DIR="$REPO_DIR"`(L65)。FIX-9 は**注記コメントのみ**（実行変更なし） | Read |

## 1. plan v3 から修正した 3 つのブリック級バグ（ワークフロー検出・Opus 実測確認）

1. **`npm ci --omit=dev` がブリック**（P4）→ **build-then-prune**（`npm ci --ignore-scripts` → `npm run build:all` → `npm prune --omit=dev`）に変更。devDeps を最終的に出荷しない目標は満たしつつビルド成立。
2. **`npm run build --if-present` が no-op**（P1）→ verified モードは実在する **`build:all`** を呼ぶ。
3. **ゲートとレガシーラッパーの順序矛盾**（gate が wrapper 内だと legacy が常に走る）→ **ゲートを wrapper より前**（EDIT 2 → EDIT 3）に配置。

その他修正: cp 自己上書きの inode 非安全（→ rsync 新inode or tar-pipe＋実行中 `scripts/update.sh` を exclude）／fork 検出の substring スプーフ（→ 正規化＋完全一致 case）／pipeline 後の死んだ `|| return 1`（→ 直後の `[ -n ]/[ -d ]/[ -f ]` 明示ガードに変更・design note に正直記載）。

## 2. verified_update() 本体（最終形・helper 群直後＝EDIT 1 で挿入）

```bash
# FIX-9: verified_update — tarball + SHA-256 検証アップデート（C-MODE-1 OPT-IN）
# 呼び出し: if verified_update; then vu_rc=0; else vu_rc=$?; fi
#   ⚠️ `if 関数; then` は関数内で errexit(set -e) を無効化する → 全 fallible cmd に明示 || return 1。
#   戻り値: 0=適用成功 / 90=既に最新(スキップ) / 1=失敗(legacy へフォールバック)
verified_update() {
    local OWNER="taiyousan15" NAME="sunagent15"
    local REPO="$REPO_DIR" CUR_VER="$CURRENT_VERSION"
    local TMP SHA_CMD BRANCH ORIGIN_URL NORM FINAL_URL TAG DL_VER LOWER
    local ASSET BASE EXPECTED ACTUAL SRC VU_STASHED=false

    info "検証付きアップデートを試行します（tarball + SHA-256）..."

    command -v curl >/dev/null 2>&1 || { warn "curl が見つかりません"; return 1; }
    command -v tar  >/dev/null 2>&1 || { warn "tar が見つかりません"; return 1; }
    if command -v sha256sum >/dev/null 2>&1; then SHA_CMD="sha256sum";
    elif command -v shasum >/dev/null 2>&1; then SHA_CMD="shasum -a 256";
    else warn "sha256sum / shasum が見つかりません（検証不可）"; return 1; fi

    TMP="$(mktemp -d)" || { warn "一時ディレクトリ作成に失敗しました"; return 1; }
    trap 'rm -rf "$TMP"' RETURN

    # git ツリー保護（fork / non-main / detached / 未コミット）
    if [ -d "$REPO/.git" ]; then
        BRANCH="$(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null)" || BRANCH=""
        if [ -z "$BRANCH" ] || [ "$BRANCH" = "HEAD" ]; then
            info "ブランチ特定不可/detached。レガシー方式に切替えます"; return 1; fi
        if [ "$BRANCH" != "main" ]; then
            info "main 以外（$BRANCH）。レガシー方式に切替えます"; return 1; fi
        ORIGIN_URL="$(git -C "$REPO" config --get remote.origin.url 2>/dev/null)" || ORIGIN_URL=""
        case "$ORIGIN_URL" in
            *..*|*"?"*|*"#"*) warn "origin URL 不正（$ORIGIN_URL）。中止"; return 1 ;;
        esac
        NORM="${ORIGIN_URL%.git}"; NORM="${NORM%/}"
        case "$NORM" in
            "") : ;;
            https://github.com/"$OWNER"/"$NAME"|git@github.com:"$OWNER"/"$NAME"|ssh://git@github.com/"$OWNER"/"$NAME") : ;;
            *) warn "origin が公式repoではありません（$ORIGIN_URL）。中止"; return 1 ;;
        esac
        if ! git -C "$REPO" diff --quiet HEAD 2>/dev/null; then
            if git -C "$REPO" stash push -m "taisun-verified-update-auto-stash" >/dev/null 2>&1; then
                VU_STASHED=true; info "設定変更を一時退避しました（適用後に戻します）"
            else warn "未コミット変更の退避に失敗。中止"; return 1; fi
        fi
    fi

    # 最新 tag を解決（認証不要・jq 不要・redirect の最終URLから抽出）
    FINAL_URL="$(curl -fsSL -o /dev/null -w '%{url_effective}' \
        "https://github.com/${OWNER}/${NAME}/releases/latest" 2>/dev/null)" \
        || { warn "最新リリース取得に失敗（ネットワーク/未公開）"; return 1; }
    case "$FINAL_URL" in
        */releases/tag/*) TAG="${FINAL_URL##*/releases/tag/}" ;;
        *) warn "リリース tag を解決できません（${FINAL_URL}）"; return 1 ;;
    esac
    TAG="${TAG%%[/?#]*}"
    [ -n "$TAG" ] || { warn "リリース tag が空"; return 1; }
    case "$TAG" in v[0-9]*|[0-9]*) : ;; *) warn "想定外タグ形式（$TAG）。中止"; return 1 ;; esac
    DL_VER="${TAG#v}"; [ -n "$DL_VER" ] || { warn "版判定不可"; return 1; }

    # 同版スキップ(return 90) + ダウングレードガード
    if [ "$DL_VER" = "$CUR_VER" ]; then
        info "すでに最新（v${CUR_VER}）。検証モードの再適用をスキップ"
        trap - RETURN; rm -rf "$TMP"; return 90; fi
    LOWER="$(printf '%s\n%s\n' "$DL_VER" "$CUR_VER" | sort -V 2>/dev/null | head -1)"
    [ -n "$LOWER" ] || { warn "版比較に失敗"; return 1; }
    if [ "$LOWER" = "$DL_VER" ]; then
        warn "ダウングレード検出（現在 v${CUR_VER} > 配布 v${DL_VER}）。中止"; return 1; fi

    # アセット + SHA256 を DL（公開・認証なし）
    ASSET="${NAME}-${TAG}.tar.gz"
    BASE="https://github.com/${OWNER}/${NAME}/releases/download/${TAG}"
    curl -fsSL "${BASE}/${ASSET}" -o "$TMP/${ASSET}" 2>/dev/null \
        || { warn "アセット DL 失敗（${ASSET}）"; return 1; }
    curl -fsSL "${BASE}/${ASSET}.sha256" -o "$TMP/${ASSET}.sha256" 2>/dev/null \
        || { warn "SHA256 DL 失敗（${ASSET}.sha256）"; return 1; }

    # SHA256 検証（不一致なら絶対に適用しない）
    EXPECTED="$(awk '{print $1; exit}' "$TMP/${ASSET}.sha256" 2>/dev/null)"
    [ -n "$EXPECTED" ] || { warn "期待ハッシュ読取り失敗"; return 1; }
    ACTUAL="$($SHA_CMD "$TMP/${ASSET}" 2>/dev/null | awk '{print $1; exit}')"
    [ -n "$ACTUAL" ] || { warn "ハッシュ計算失敗"; return 1; }
    if [ "$EXPECTED" != "$ACTUAL" ]; then
        warn "SHA256 不一致。改ざんの可能性があるため適用しません"
        warn "  期待: $EXPECTED"; warn "  実際: $ACTUAL"; return 1; fi
    ok "ダウンロードを検証しました（SHA256 一致 / ${TAG}）"

    # 展開
    mkdir -p "$TMP/x" || { warn "展開dir作成失敗"; return 1; }
    tar -xzf "$TMP/${ASSET}" -C "$TMP/x" 2>/dev/null || { warn "展開失敗"; return 1; }
    # find|head は pipeline 終了コードが head のため || return 1 を付けない（cosmetic 回避）。
    # 実ガードは直後の [ -n ] && [ -d ] && [ -f package.json ]。
    SRC="$(find "$TMP/x" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | head -1)"
    [ -n "$SRC" ] && [ -d "$SRC" ] || { warn "展開後の中身が見つかりません"; return 1; }
    [ -f "$SRC/package.json" ] || { warn "展開結果が不正（package.json なし）"; return 1; }

    # 適用（自己上書き安全: 実行中 scripts/update.sh を除外）
    if command -v rsync >/dev/null 2>&1; then
        rsync -a --exclude='.git' --exclude='node_modules' --exclude='scripts/update.sh' \
            "$SRC/" "$REPO/" 2>/dev/null \
            || { warn "rsync 適用失敗"; [ "$VU_STASHED" = true ] && git -C "$REPO" stash pop >/dev/null 2>&1 || true; return 1; }
    else
        ( cd "$SRC" && tar --exclude='./.git' --exclude='./node_modules' --exclude='./scripts/update.sh' -cf - . \
          | ( cd "$REPO" && tar -xf - ) ) 2>/dev/null \
            || { warn "tar 適用失敗"; [ "$VU_STASHED" = true ] && git -C "$REPO" stash pop >/dev/null 2>&1 || true; return 1; }
    fi
    info "実行中の scripts/update.sh は安全のため次回起動時に反映されます"

    # 退避復元（失敗は非致命）
    if [ "$VU_STASHED" = true ]; then
        if git -C "$REPO" stash pop >/dev/null 2>&1; then ok "退避した設定変更を元に戻しました";
        else warn "設定変更の復元に失敗（git stash list で確認）"; fi
    fi

    ok "検証済みファイルを適用しました（v${CUR_VER} → v${DL_VER}）"
    trap - RETURN; rm -rf "$TMP"; return 0
}
```

## 3. 統合編集（実アンカー・再確認済み）

- **EDIT 1（関数定義）**: helper 群（`step()` L17）の直後・コメント枠より前に §2 全文を挿入。
- **EDIT 2（ゲート＝wrapper より前）**: `CURRENT_VERSION=$VERSION`（L48）直後・`git fetch origin`（L59）より前に挿入:
  ```bash
  VERIFIED_UPDATE_DONE=false
  VERIFIED_SKIP=false
  GIT_UPDATED=false
  if [ "${TAISUN_UPDATE_VERIFIED:-false}" = "true" ]; then
      if verified_update; then vu_rc=0; else vu_rc=$?; fi
      case "$vu_rc" in
          0)  VERIFIED_UPDATE_DONE=true; GIT_UPDATED=true ;;
          90) VERIFIED_SKIP=true;        GIT_UPDATED=true ;;
          *)  warn "検証付き更新に失敗したため、通常方式（git/ZIP）に切替えます" ;;
      esac
  fi
  ```
  ※ 既定 `:-false`（OPT-IN）。`GIT_UPDATED=false` をここへ前倒し（legacy 側 L68 の再代入は wrapper 内に残し二重定義無害）。
- **EDIT 3（legacy ラッパー・非回帰 Pattern 8）**: EDIT2 直後・`git fetch origin`（L59）直前で `if [ "${VERIFIED_UPDATE_DONE:-false}" != true ] && [ "${VERIFIED_SKIP:-false}" != true ]; then` を開き、stash pop ブロックの閉じ `fi`（L125）直後で `fi  # end legacy update path` を閉じる。**L59-L125 を byte-identical で包む（再インデント禁止）**。`.git` チェック(L41-45)と `cd "$REPO_DIR"`(L47) は wrapper の外（前）に残す。検証失敗時は両フラグ false→ZIP/FORCE_UPDATE 全到達。
- **EDIT 4（無条件 cd・Codex MUST-2）**: `NEW_VERSION=...`（L127）直後に `cd "$REPO_DIR" || exit 1`（メイン本体＝set -e 有効ゆえ exit）。
- **EDIT 5（root npm・MUST-4＋omit-dev collision 修正＝build-then-prune）**: L138-L144 を置換:
  ```bash
  if [ "${VERIFIED_SKIP:-false}" = true ]; then
      info "すでに最新のため依存の再導入をスキップします"
  elif [ "${VERIFIED_UPDATE_DONE:-false}" = true ]; then
      if [ ! -f "$REPO_DIR/package-lock.json" ]; then
          echo "  ❌ package-lock.json がありません（検証モードでは必須）"; exit 1; fi
      npm ci --ignore-scripts --prefer-offline --no-audit 2>&1 || { echo "  ❌ npm ci 失敗（検証モード）"; exit 1; }
      npm run build:all 2>&1 || { echo "  ❌ ビルド失敗（検証モード）"; exit 1; }
      npm prune --omit=dev 2>&1 || { echo "  ❌ devDeps 剪定失敗（検証モード）"; exit 1; }
      ok "ファイルの更新が完了しました（検証モード: build-then-prune）"
  else
      if [ -f "$REPO_DIR/package-lock.json" ]; then
          npm ci --silent --prefer-offline --no-audit 2>/dev/null || npm install
      else
          npm install --silent 2>/dev/null || npm install; fi
      ok "ファイルの更新が完了しました"
  fi
  ```
- **EDIT 6（root build・MUST-3＋build:all 修正）**: L146-L152 を置換:
  ```bash
  echo ""; echo "  🔨 システムを再構築しています..."
  if [ "${VERIFIED_SKIP:-false}" = true ]; then
      ok "再構築は不要です（すでに最新）"
  elif [ "${VERIFIED_UPDATE_DONE:-false}" = true ]; then
      ok "システムの再構築が完了しました（検証モードで build:all 実行済み）"
  elif npm run build --if-present 2>/dev/null; then
      ok "システムの再構築が完了しました"
  else
      warn "一部の再構築に問題がありましたが、続行します"
  fi
  ```
  ※ legacy は `--if-present`(no-op) のまま温存＝既存挙動不変。MCP ループ(L154-166)は両モード不変。
- **EDIT 7（install.sh 注記・実行変更なし）**: install.sh L65 直後にコメントのみ:
  ```bash
  # 検証付きアップデート（C-MODE-1 オプトイン / 既定 OFF）
  #   有効化: TAISUN_UPDATE_VERIFIED=true ./scripts/update.sh
  #   リリース未公開の間は自動でレガシー git フローにフォールバックします。
  #   既定 ON 化（C-MODE-2）は実リリース公開・検証・署名検証追加後の別コミットで実施。
  ```

## 4. 検証ゲート（実装後・段1）

- `bash -n scripts/update.sh` / `bash -n scripts/install.sh` = 0
- `node scripts/check-installer-parity.js` green（変わらないはず）
- DRY matrix（throwaway dir・実コマンド）:
  (a) 既定（TAISUN_UPDATE_VERIFIED 未設定）= 現行 git フロー**完全同値**（非回帰）
  (b) opt-in + release 未公開 → verified_update return 1 → legacy fallback（warn 後 git/ZIP 到達）
  (c) opt-in + tampered sha（モック）→ return 1・未適用
  (d) opt-in + 同版 → return 90 → npm/build スキップ
  (e) cp fallback（rsync 不在）+ 実行中 update.sh が OLD のまま保護
  (f) fork/非main origin → return 1 → legacy
- `npm ci --ignore-scripts --dry-run` / `npm prune --omit=dev --dry-run`（可能なら）exit 確認
- 目視: 全分岐・legacy 到達性・gate≺wrapper 順序・exit(本体) vs return(関数) の使い分け

## 5. 残リスク（C-MODE-2 既定 flip 前に必須対応）

1. **真正性なし（integrity のみ）**: tarball と .sha256 は同一 release 由来＝改ざん検出のみ。署名（GPG/sigstore/`gh attestation verify`）は未実装。**C-MODE-2 前に署名検証を必須**。緩和: origin 完全一致＋GitHub TLS＋固定ホスト依存。
2. **リリースアセット未公開**: 現状 release 0 件＝verified は毎回 return 1→legacy（既定 OFF ゆえ無害）。**別途リリース CI**（tag push で `sunagent15-<tag>.tar.gz`+`.sha256` を upload）が必要。GitHub 自動生成 source tarball は別 URL・別名・.sha256 無しで使えない。
3. **dist/ 非同梱＝ユーザー機ビルド**: 毎回 `npm ci --ignore-scripts`+`build:all`(tsc×2)。低スペック端末で時間/失敗リスク。将来は CI で prebuilt dist 同梱→`npm ci --omit=dev`+ビルドスキップに切替え可。
4. **rsync --delete 無し**: 上流削除ファイルが stale 残存。適用は非原子的（中断で half-old/half-new・ロールバック無し）。緩和: 適用前の自前 stash。原子化(staging→swap)＋in-progress marker は C-MODE-2 前の改善候補。
5. **MCP ループは検証モードでも従来どおり**（L154-166・`npm ci/install` 無 prune・失敗 info-skip）。trust posture は root 限定。MCP も fail-closed/omit に揃えるかは C-MODE-2 前に判断。
6. **stash 復元コンフリクト**: 上書き後ツリーへの pop はコンフリクトしうる（warn のみ）。非致命（内容は stash に保持）。
7. **find|head / sha-parse の pipeline 終了コード**: 意図的に `|| return 1` を付けず、直後の `[ -n ]/[ -d ]/[ -f ]` を実ガードとする（design note に正直記載・Pattern 10）。

## 6. 非実施（本PR）

C-MODE-2 既定 flip / 署名検証 / リリース CI / MCP ループの fail-closed 化 / 適用の原子化 — すべて release 公開後の別 commit/別件。

---
出典: Bash Reference Manual（errexit と if/関数・pipeline 終了コード）/ npm ci・prune・--ignore-scripts・--omit docs / GitHub releases `/latest` redirect 挙動 / OWASP Software Supply Chain Cheat Sheet。設計ワークフロー（8 agents・3 lens draft + 敵対的検証 + 統合）＋ Opus 実ファイル裏取り。
