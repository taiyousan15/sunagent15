# OWASP 4-2 FIX-9（検証付き更新）実装計画 v5 — Codex 実装前ゲート round5 対象

- **作成**: 2026-06-04 15:25 / session 49 / Opus 4.8 (ultracode)
- **対象**: sunagent15 / FIX-9 専用 PR（①②③ は PR #30 で先行＝option B）
- **位置づけ**: plan v4 の Codex round4 NO-GO（`doc/CODEXレビュー/2026-06-04_150142_4-2-fix9-codex-pre-gate-v4-NOGO.md`）の **3 MUST-fix + gate配置 + SHOULD を全反映**。修正ワークフロー（revise→3レンズ敵対検証→統合・5 agents）＋ Opus 実ファイル裏取りで確定。
- **ロールアウト**: **C-MODE-1（OPT-IN・既定 OFF）**。`TAISUN_UPDATE_VERIFIED=true` のみ verified_update 実行。既定挙動は legacy 逐語温存（非回帰・release 0件ゆえ当面 inert）。C-MODE-2（既定flip・GPG/sigstore署名・release CI）は別commitスコープ外。
- **round-5 修正（F6・反映済み）**: Codex round5（`doc/CODEXレビュー/2026-06-04_153613_4-2-fix9-codex-pre-gate-v5-NOGO.md`）の唯一の MUST-fix＝検証 `npm ci` に **`--include=dev` を追加**（EDIT 5）。`NODE_ENV=production` や npm config `omit=dev` 環境でも devDeps(ts-node/tsx/typescript)を強制導入し、prod-only 書換え後に build:all が失敗して実行時ツールが消える事故を防止。Opus が npm 仕様（`--include=dev` が omit/production を上書き）を確認の上 ACCEPT。round5 の他 9 項目は RESOLVED。

## 0. v4→v5 修正サマリ（全て Codex round4 ACCEPT・Opus 実測）

| 修正 | 内容 | 検証 |
|---|---|---|
| **F1** stash 取り残し | stash を early git保護 → **apply 直前**（sha検証+展開 成功後）へ移設。早期失敗/return90 では stash 未取得＝取り残し不能 | コードトレース＋sandbox実行 |
| **F2** prune ブリック | `npm prune --omit=dev`/build-then-prune を**廃止**。verified root = `npm ci --ignore-scripts`(lockfile必須・fail-closed)+`npm run build:all`(fail-closed)。devDeps 残存で実行時 ts-node/tsx 生存 | P1-P3 実測（下記） |
| **F3** 空origin バイパス | `.git` 有時、`""` origin を `return 1`（公式 origin 必須）。非git は本ブロック非通過 | case 確認 |
| **F4** 非git 到達性 | verified gate を **.git ゲート(L41)より前**に置き、`.git`ゲート+cd+CURRENT_VERSION+legacy(L41-125) を wrapper で包む。CUR_VER は `$VERSION`(L10)由来 | bash -n・if/fi 均衡 |
| **F4派生** version表示 regression | L48 が wrapper 内に入り verified時 L129 が `v → v...` 表示 → EDIT4 で `CURRENT_VERSION="${CURRENT_VERSION:-$VERSION}"` 補完（3レビュー全員指摘） | 実測 |
| **F5** | (a)VERIFIED_SKIP時 MCPループ skip (b)stable-only tag（`*-*` prerelease 拒否）(c)find\|head/sha-parse は直後 `[ -n/-d/-f ]` ガード明記（Pattern10） | 実測 |
| LOW | tar-pipe は `( set -o pipefail; … )` で送信側失敗 masking 解消（subshell 内に閉じ他pipeline不変）／dead 外側 GIT_UPDATED 除去 | 実測 |

## 1. Opus 実測前提（read-only・ground truth）
- **P1**: root に `build` script 無し（`npm run build --if-present` は no-op）。実ビルド=`build:all`=`proxy:build && scripts:build`（tsc×2）。`postinstall: build:all`。
- **P2**: `ts-node`(^10.9.2)/`tsx`(^4.21.0)/`typescript`(^5.3.2) は**全 devDep**。多数のユーザー向け script が実行時に `npx ts-node`/`npx tsx` で .ts 直接実行（proxy:start/doctor/memory:report/perf:*/workflow:*/briefing 他）＋ `.claude/mcp-servers/ide-integration.js:209` も `npx tsx`。`dist/` gitignore。→ **prune/--omit=dev は実行時ブリック**。
- **P3**: GitHub release **0件**（verified は当面 return 1→legacy・既定 OFF ゆえ無害）。
- **P4 アンカー（実測）**: update.sh=290行・`.git`ゲート L41-45・`cd` L47・`CURRENT_VERSION=$VERSION` L48・`git fetch` L59・stash pop close `fi` L125・`NEW_VERSION` L127・`v${CURRENT_VERSION}→` L129・root npm L138-144・build L146-152・MCP for L154 / done L166。`scripts/install.sh` L65=`export TAISUN_AGENT_DIR="$REPO_DIR"`（root `install.sh` とは別ファイル＝EDIT8 は scripts/ を対象）。

## 2. verified_update() 本体（最終形・EDIT 1 で helper 群直後に挿入）

```bash
# FIX-9: verified_update — tarball + SHA-256 検証アップデート（C-MODE-1 OPT-IN）
# 呼び出し: if verified_update; then vu_rc=0; else vu_rc=$?; fi
#   ⚠️ `if 関数; then` は関数内で errexit(set -e) を無効化する → 全 fallible cmd に明示 || return 1。
#   戻り値: 0=適用成功 / 90=既に最新(スキップ) / 1=失敗(legacy へフォールバック)
#   ⚠️ CUR_VER は $VERSION 由来（L10 で gate より前に設定済）。$CURRENT_VERSION(元L48) は
#      v5 では wrapper 内＝この gate より後なので参照不可。必ず $VERSION を使う。
verified_update() {
    local OWNER="taiyousan15" NAME="sunagent15"
    local REPO="$REPO_DIR" CUR_VER="$VERSION"
    local TMP SHA_CMD BRANCH ORIGIN_URL NORM FINAL_URL TAG DL_VER LOWER
    local ASSET BASE EXPECTED ACTUAL SRC VU_STASHED=false

    info "検証付きアップデートを試行します（tarball + SHA-256）..."

    command -v curl >/dev/null 2>&1 || { warn "curl が見つかりません"; return 1; }
    command -v tar  >/dev/null 2>&1 || { warn "tar が見つかりません"; return 1; }
    if command -v sha256sum >/dev/null 2>&1; then SHA_CMD="sha256sum"
    elif command -v shasum >/dev/null 2>&1; then SHA_CMD="shasum -a 256"
    else warn "sha256sum / shasum が見つかりません（検証不可）"; return 1; fi

    TMP="$(mktemp -d)" || { warn "一時ディレクトリ作成に失敗しました"; return 1; }
    # cleanup: rm -rf "$TMP" は冪等（存在しなくても無害）。RETURN trap で常時掃除。
    trap 'rm -rf "$TMP"' RETURN

    # git ツリー保護（fork / non-main / detached / origin 検証）
    # ※ F4: 非 git(ZIP) install はこのブロックに入らない＝公式URL固定+sha256 で安全。
    # ※ F1: 未コミット変更の stash は「ここでは取らない」。apply 直前まで遅延し、
    #        tag/DL/sha/extract 失敗や return 90 経路で stash 取り残しが起きないようにする。
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
            # F3: .git があるのに origin 未設定の fork はバイパス禁止。公式 origin を必須。
            "") warn "origin 未設定の git リポジトリは検証モード対象外"; return 1 ;;
            https://github.com/"$OWNER"/"$NAME"|git@github.com:"$OWNER"/"$NAME"|ssh://git@github.com/"$OWNER"/"$NAME") : ;;
            *) warn "origin が公式repoではありません（$ORIGIN_URL）。中止"; return 1 ;;
        esac
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
    # F5(b): stable-only。prerelease（'-' を含む 例 v1.2.3-rc1）は受理しない。
    case "$TAG" in *-*) warn "プレリリースタグ（$TAG）は検証モード対象外"; return 1 ;; esac
    DL_VER="${TAG#v}"; [ -n "$DL_VER" ] || { warn "版判定不可"; return 1; }

    # 同版スキップ(return 90) + ダウングレードガード
    # ※ F1: ここに到達しても stash は未取得なので取り残しは発生しない。
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

    # ─── F1: ここで初めて未コミット変更を stash（apply 直前・sha検証+展開 成功後） ───
    # これより前の return（curl/sha/extract 失敗・return 90）では stash 自体が存在しない＝取り残し不能。
    if [ -d "$REPO/.git" ]; then
        if ! git -C "$REPO" diff --quiet HEAD 2>/dev/null; then
            if git -C "$REPO" stash push -m "taisun-verified-update-auto-stash" >/dev/null 2>&1; then
                VU_STASHED=true; info "設定変更を一時退避しました（適用後に戻します）"
            else warn "未コミット変更の退避に失敗。中止"; return 1; fi
        fi
    fi

    # 適用（自己上書き安全: 実行中 scripts/update.sh を除外）
    if command -v rsync >/dev/null 2>&1; then
        rsync -a --exclude='.git' --exclude='node_modules' --exclude='scripts/update.sh' \
            "$SRC/" "$REPO/" 2>/dev/null \
            || { warn "rsync 適用失敗"
                 if [ "$VU_STASHED" = true ]; then
                     git -C "$REPO" stash pop >/dev/null 2>&1 \
                         || warn "設定変更の復元に失敗（git stash list で確認）"; fi
                 return 1; }
    else
        # tar-pipe は subshell 内のみ pipefail 化し、送信側 tar -cf 失敗を半適用ツリーに
        #   stash pop してしまう masking を防ぐ。pipefail は ( ) 内に閉じ親シェル不変。
        ( set -o pipefail
          cd "$SRC" && tar --exclude='./.git' --exclude='./node_modules' --exclude='./scripts/update.sh' -cf - . \
          | ( cd "$REPO" && tar -xf - ) ) 2>/dev/null \
            || { warn "tar 適用失敗"
                 if [ "$VU_STASHED" = true ]; then
                     git -C "$REPO" stash pop >/dev/null 2>&1 \
                         || warn "設定変更の復元に失敗（git stash list で確認）"; fi
                 return 1; }
    fi
    info "実行中の scripts/update.sh は安全のため次回起動時に反映されます"

    # 退避復元（失敗は非致命）
    if [ "$VU_STASHED" = true ]; then
        if git -C "$REPO" stash pop >/dev/null 2>&1; then ok "退避した設定変更を元に戻しました"
        else warn "設定変更の復元に失敗（git stash list で確認）"; fi
    fi

    ok "検証済みファイルを適用しました（v${CUR_VER} → v${DL_VER}）"
    trap - RETURN; rm -rf "$TMP"; return 0
}
```

## 3. 統合編集（実アンカー確定済み）

- **EDIT 1（関数定義）**: `step()`（L18）直後・ヘッダー echo（L24 付近）より前に §2 全文を挿入。$REPO_DIR(L9)/$VERSION(L10) は設定済。
- **EDIT 2（検証ゲート＝.git ゲートより前・F4 核心）**: `.git` ゲート（L41 `if [ ! -d "$REPO_DIR/.git" ]; then`）の**直前**に挿入:
  ```bash
  # ── FIX-9 検証付き更新ゲート（C-MODE-1 OPT-IN・既定 OFF）──
  VERIFIED_UPDATE_DONE=false
  VERIFIED_SKIP=false
  if [ "${TAISUN_UPDATE_VERIFIED:-false}" = "true" ]; then
      if verified_update; then vu_rc=0; else vu_rc=$?; fi
      case "$vu_rc" in
          0)  VERIFIED_UPDATE_DONE=true ;;
          90) VERIFIED_SKIP=true ;;
          *)  warn "検証付き更新に失敗したため、通常方式（git/ZIP）に切替えます" ;;
      esac
  fi
  ```
  ※ 外側 GIT_UPDATED は定義しない（legacy 内 L68 が自前再初期化＝dead state 回避）。
- **EDIT 3（.git ゲート+cd+legacy を wrapper・F4 核心）**: EDIT2 直後（=L41 直前）に開き、stash pop close `fi`（L125）直後に閉じる。L41-125（.gitゲート/cd/CURRENT_VERSION/git/ZIP/FORCE_UPDATE/stash）を**byte-identical**で包む（再インデント禁止）:
  ```bash
  if [ "${VERIFIED_UPDATE_DONE:-false}" != true ] && [ "${VERIFIED_SKIP:-false}" != true ]; then
  ```
  …(L41-125 逐語)…
  ```bash
  fi  # end legacy update path（.git ゲート + cd + git/ZIP/stash 一式）
  ```
- **EDIT 4（無条件 cd + CURRENT_VERSION 復旧）**: `NEW_VERSION=...`（L127）直後に挿入:
  ```bash
  cd "$REPO_DIR" || exit 1
  CURRENT_VERSION="${CURRENT_VERSION:-$VERSION}"
  ```
  ※ verified-skip 経路で wrapper の cd(L47) が skip されるため `cd` 必須。`CURRENT_VERSION` は L48 が wrapper 内に入ったための regression 補完（L129 の `v → v...` 解消）。メイン本体ゆえ `exit`（return 不可）。
- **EDIT 5（root npm・F2＝prune 廃止 full fail-closed）**: L138-144 を置換:
  ```bash
  # Prefer npm ci for reproducible install when lockfile present.
  if [ "${VERIFIED_SKIP:-false}" = true ]; then
      info "すでに最新のため依存の再導入をスキップします"
  elif [ "${VERIFIED_UPDATE_DONE:-false}" = true ]; then
      if [ ! -f "$REPO_DIR/package-lock.json" ]; then
          echo "  ❌ package-lock.json がありません（検証モードでは必須）"; exit 1; fi
      npm ci --ignore-scripts --include=dev --prefer-offline --no-audit 2>&1 || { echo "  ❌ npm ci 失敗（検証モード）"; exit 1; }
      npm run build:all 2>&1 || { echo "  ❌ ビルド失敗（検証モード）"; exit 1; }
      ok "ファイルの更新が完了しました（検証モード: full install + build:all / 非 prune）"
  else
      if [ -f "$REPO_DIR/package-lock.json" ]; then
          npm ci --silent --prefer-offline --no-audit 2>/dev/null || npm install
      else
          npm install --silent 2>/dev/null || npm install
      fi
      ok "ファイルの更新が完了しました"
  fi
  ```
  ※ legacy（else）は L139-144 逐語温存。**prune/--omit=dev なし**（P2：実行時 ts-node/tsx 必須）。
- **EDIT 6（root build・build:all 整合）**: L146-152 を置換:
  ```bash
  echo ""
  echo "  🔨 システムを再構築しています..."
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
  ※ legacy は `--if-present`(no-op) 逐語温存。
- **EDIT 7（MCP ループ skip-gate・F5a）**: MCP for（L154）の直前に開き、`done`（L166）直後に閉じ:
  ```bash
  if [ "${VERIFIED_SKIP:-false}" = true ]; then
      info "すでに最新のため MCP サーバーの再導入をスキップします"
  else
  ```
  …(L154-166 逐語)…
  ```bash
  fi
  ```
  ※ VERIFIED_UPDATE_DONE / legacy では従来どおり走る。MCP は無 prune（root と整合・omit化は C-MODE-2 別判断）。
- **EDIT 8（scripts/install.sh 注記・実行変更なし）**: **`scripts/install.sh`**（root `install.sh` ではない）L65 `export TAISUN_AGENT_DIR="$REPO_DIR"` 直後にコメントのみ:
  ```bash
  # 検証付きアップデート（C-MODE-1 オプトイン / 既定 OFF）
  #   有効化: TAISUN_UPDATE_VERIFIED=true ./scripts/update.sh
  #   リリース未公開の間は自動でレガシー git フローにフォールバックします。
  #   検証モードは devDeps を prune しません（ts-node/tsx 等が実行時に必要なため）。
  #   既定 ON 化（C-MODE-2）は実リリース公開・検証・署名検証追加後の別コミットで実施。
  ```

## 4. 検証ゲート（実装後）
- `bash -n scripts/update.sh` / `bash -n scripts/install.sh` = 0
- `node scripts/check-installer-parity.js` green
- `git diff`：L41-125 / L154-166 が wrapper 追加行以外 **byte-identical**（再インデント無し）
- DRY matrix（throwaway・実コマンド）: (a)既定OFF=legacy 完全同値 (b)opt-in+release未公開→return1→legacy到達 (c)tampered sha→return1未適用 (d)同版→return90→npm/build/MCP skip (e)cp/tar fallback で実行中 update.sh OLD 保護 (f)空origin/非main→return1
- 目視: gate≺.gitゲート、wrapper 均衡、exit(本体)/return(関数)、CURRENT_VERSION 表示

## 5. 残リスク（C-MODE-2 前に必須）
1. **真正性なし（integrity のみ）**: 署名（GPG/sigstore/`gh attestation verify`）未実装。C-MODE-2 既定flip 前に必須。
2. **release アセット未公開**: 現状 0件→verified は `case */releases/tag/*` ガードで return1→legacy（inert・無害）。別途 **release CI**（tag push で `sunagent15-<tag>.tar.gz`+`.sha256` upload）が必要。GitHub 自動 source tarball は別URL・.sha256 無しで不可。
3. **dist/ 非同梱→ユーザー機ビルド**: 毎回 `npm ci --ignore-scripts`+`build:all`(tsc×2)。低スペックで時間/失敗リスク。将来 CI で prebuilt dist 同梱→`npm ci --omit=dev`+ビルドskip 可。
4. **rsync --delete 無し / 非原子的適用**: 上流削除ファイル残存・中断で half-old/half-new。緩和: 適用直前 stash。原子化は C-MODE-2 改善候補。
5. **MCP ループは検証実適用時も無 prune**（root と整合）。fail-closed/omit 化は C-MODE-2 別判断。
6. **stash 復元コンフリクト**: 上書き後 pop はコンフリクトしうる（warn のみ・非致命・内容は保持）。
7. **sort -V ポータビリティ**: 旧 BSD sort で LOWER 空→直後 `[ -n ]` で fail-safe（legacy へ）。

## 6. 非実施（本PR）
C-MODE-2 既定flip / 署名検証 / release CI / MCP fail-closed化 / 適用の原子化 — release 公開後の別 commit/別件。

---
出典: Bash Reference Manual（errexit/pipeline/関数/`set -o pipefail` の subshell scope）/ npm ci・--ignore-scripts docs / GitHub releases `/latest` redirect / OWASP Software Supply Chain Cheat Sheet。設計: 修正ワークフロー（5 agents・3レンズ敵対検証）＋ Opus 実ファイル裏取り。
