#!/bin/bash
# TAISUN Agent - アップデートスクリプト
#
# 使い方: ./scripts/update.sh

# set -e: 致命的失敗で即停止（失敗許容操作には || true を付与）
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(cat "$REPO_DIR/package.json" | grep '"version"' | head -1 | cut -d'"' -f4)

# ─────────────────────────────────────────
# 表示ヘルパー
# ─────────────────────────────────────────
ok()   { echo "  ✅ $1"; }
warn() { echo "  ⚠️  $1"; }
info() { echo "  ℹ️  $1"; }
step() { echo ""; echo "━━━ $1 ━━━"; }

# FIX-9: verified_update — tarball + SHA-256 検証アップデート（C-MODE-1 OPT-IN）
# 呼び出し: if verified_update; then vu_rc=0; else vu_rc=$?; fi
#   ⚠️ `if 関数; then` は関数内で errexit(set -e) を無効化する → 全 fallible cmd に明示 || return 1。
#   戻り値: 0=適用成功 / 90=既に最新(スキップ) / 1=失敗(legacy へフォールバック)
#   ⚠️ CUR_VER は $VERSION 由来（gate より前に設定済）。$CURRENT_VERSION は v5 では wrapper 内＝
#      この gate より後なので参照不可。必ず $VERSION を使う。
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

# ─────────────────────────────────────────
# ヘッダー
# ─────────────────────────────────────────
# clear は使わない（Claude Code内でログが消えるのを防ぐ）
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     TAISUN Agent アップデート                      ║"
echo "║     現在のバージョン：v${VERSION}                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  このスクリプトが行うこと："
echo "  1. 最新版のダウンロード"
echo "  2. ファイルの更新"
echo "  3. スキル・エージェントの更新"
echo "  4. 動作確認"
echo ""
echo "  ⚠️  途中で画面に文字が流れますが正常な動作です。"
echo "      最後まで待ってください。"
echo ""

# ── FIX-9 検証付き更新ゲート（C-MODE-1 OPT-IN・既定 OFF）──
# F4: .git ゲートより前に置く。非git(ZIP)install でも verified へ到達可能にするため。
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

# レガシー更新経路（.git ゲート + cd + git/ZIP/FORCE_UPDATE/stash）を wrapper で包む。
# 検証成功(DONE)/同版(SKIP) のときは丸ごとスキップ。それ以外は従来どおり全到達（非回帰）。
if [ "${VERIFIED_UPDATE_DONE:-false}" != true ] && [ "${VERIFIED_SKIP:-false}" != true ]; then
# git リポジトリ確認
if [ ! -d "$REPO_DIR/.git" ]; then
    echo "  ❌ エラー：このフォルダは TAISUN Agent のフォルダではありません"
    echo "     → sunagent15 フォルダの中で実行してください"
    exit 1
fi

cd "$REPO_DIR"
CURRENT_VERSION=$VERSION

# ─────────────────────────────────────────
# Step 1: 最新版をダウンロード
# ─────────────────────────────────────────
step "ステップ 1/4：最新版をダウンロードしています"

echo ""
echo "  インターネットから最新のファイルをダウンロードしています..."
echo ""

git fetch origin

# ローカルの変更を一時退避
STASHED=false
if ! git diff --quiet HEAD 2>/dev/null; then
    git stash push -m "taisun-update-auto-stash" 2>/dev/null && STASHED=true
    info "あなたの設定変更を一時的に退避しました（後で自動的に戻します）"
fi

GIT_UPDATED=false
git pull origin main --ff-only 2>/dev/null && GIT_UPDATED=true || {
    info "通常の更新ができませんでした。別の方法で更新します..."

    # git reset --hard はデータ破壊リスクがあるため FORCE_UPDATE 必須
    if [ "$FORCE_UPDATE" = "true" ]; then
        if git reset --hard origin/main 2>/dev/null; then
            ok "最新版に強制同期しました（FORCE_UPDATE=true）"
            # reset後はstashとコンフリクトするため復帰をスキップ
            STASHED=false
            GIT_UPDATED=true
        fi
    fi

    # git更新が成功しなかった場合のみZIPフォールバック（非破壊）
    if [ "$GIT_UPDATED" = false ]; then
        info "ZIPダウンロードで更新します..."

        ZIP_URL="https://github.com/taiyousan15/sunagent15/archive/refs/heads/main.zip"
        ZIP_PATH="/tmp/sunagent15_update.zip"
        EXTRACT_PATH="/tmp/sunagent15_extract"

        if curl -fsSL "$ZIP_URL" -o "$ZIP_PATH" 2>/dev/null; then
            rm -rf "$EXTRACT_PATH"
            unzip -q "$ZIP_PATH" -d "$EXTRACT_PATH"
            SOURCE_DIR=$(ls -d "$EXTRACT_PATH"/*/ | head -1)

            if command -v rsync &> /dev/null; then
                rsync -a --exclude='node_modules' --exclude='.git' "$SOURCE_DIR" "$REPO_DIR/"
            else
                cd "$SOURCE_DIR" || exit 1
                for item in *; do
                    [ "$item" = "node_modules" ] && continue
                    [ "$item" = ".git" ] && continue
                    cp -R "$item" "$REPO_DIR/" 2>/dev/null || true
                done
            fi
            ok "ZIPダウンロードで更新しました"
            rm -f "$ZIP_PATH"
            rm -rf "$EXTRACT_PATH"
        else
            warn "ZIPダウンロードにも失敗しました"
            warn "手動でダウンロード: $ZIP_URL"
        fi
    fi
}

# 退避した変更を戻す
if [ "$STASHED" = true ]; then
    git stash pop 2>/dev/null && \
        ok "退避した設定変更を元に戻しました" || {
        warn "設定変更の復元に失敗しました（コンフリクトの可能性）"
        info "以下のコマンドで確認・手動復元してください:"
        info "  git stash list           # 退避した変更一覧"
        info "  git stash show --stat    # 退避内容の確認"
        info "  git stash pop            # 再適用を試みる"
    }
fi
fi  # end legacy update path（.git ゲート + cd + git/ZIP/stash 一式）

NEW_VERSION=$(cat "$REPO_DIR/package.json" | grep '"version"' | head -1 | cut -d'"' -f4)
# F4: verified-skip 経路では wrapper 内の cd(元L47) が skip されるため無条件 cd を確保。
cd "$REPO_DIR" || exit 1
# F4 派生: 元 CURRENT_VERSION=$VERSION が wrapper 内に入ったため verified DONE/SKIP 経路で
#   未設定となり下の版表示が 'v → v...' になる regression を防ぐ（legacy では既設定ゆえ :- 不発火）。
CURRENT_VERSION="${CURRENT_VERSION:-$VERSION}"
echo ""
ok "バージョン更新: v${CURRENT_VERSION} → v${NEW_VERSION}"

# ─────────────────────────────────────────
# Step 2: ファイルの更新・ビルド
# ─────────────────────────────────────────
step "ステップ 2/4：システムを更新しています（少し時間がかかります）"

echo ""
echo "  📦 必要なファイルを更新しています..."
# Prefer npm ci for reproducible install when lockfile present.
if [ "${VERIFIED_SKIP:-false}" = true ]; then
    info "すでに最新のため依存の再導入をスキップします"
elif [ "${VERIFIED_UPDATE_DONE:-false}" = true ]; then
    # F2: prune/--omit=dev しない。ts-node/tsx/typescript は devDep だが多数のコマンドが
    #     実行時に npx ts-node/tsx で .ts を直接実行するため omit すると runtime ブリック。
    #     --include=dev で NODE_ENV=production / config omit=dev でも devDeps を強制導入。
    if [ ! -f "$REPO_DIR/package-lock.json" ]; then
        echo "  ❌ package-lock.json がありません（検証モードでは必須）"; exit 1
    fi
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

# F5(a): 検証モードで同版スキップ(VERIFIED_SKIP)のときは MCP 再導入も不要。
if [ "${VERIFIED_SKIP:-false}" = true ]; then
    info "すでに最新のため MCP サーバーの再導入をスキップします"
else
for mcp_dir in "mcp-servers/voice-ai-mcp-server" "mcp-servers/ai-sdr-mcp-server" "mcp-servers/line-bot-mcp-server"; do
    if [ -f "$REPO_DIR/$mcp_dir/package.json" ]; then
        mcp_name=$(basename "$mcp_dir")
        if [ -f "$REPO_DIR/$mcp_dir/package-lock.json" ]; then
            mcp_install="npm ci --silent --prefer-offline --no-audit"
        else
            mcp_install="npm install --silent --prefer-offline --no-audit"
        fi
        (cd "$REPO_DIR/$mcp_dir" && $mcp_install && npm run build --if-present 2>/dev/null) && \
            ok "${mcp_name} を更新しました" || \
            info "${mcp_name} の更新をスキップしました"
    fi
done
fi

# ─────────────────────────────────────────
# Step 3: スキル・エージェントの更新
# ─────────────────────────────────────────
step "ステップ 3/4：スキル・エージェントを更新しています"

echo ""
TARGET_SKILLS="$HOME/.claude/skills"
SOURCE_SKILLS="$REPO_DIR/.claude/skills"
mkdir -p "$TARGET_SKILLS"

INSTALLED=0; UPDATED=0; SKIPPED=0

if [ -d "$SOURCE_SKILLS" ]; then
    for skill_dir in "$SOURCE_SKILLS"/*/; do
        skill_name=$(basename "$skill_dir")
        [[ "$skill_name" == "_archived" ]] && continue
        [[ "$skill_name" == "data" ]] && continue
        [[ ! -f "$skill_dir/SKILL.md" ]] && [[ ! -f "$skill_dir/CLAUDE.md" ]] && continue

        target="$TARGET_SKILLS/$skill_name"
        if [ -d "$target" ] && [ ! -L "$target" ]; then rm -rf "$target"; fi

        if [ ! -L "$target" ]; then
            ln -sf "$skill_dir" "$target"
            ((INSTALLED++)) || true
        else
            current_target=$(readlink "$target")
            if [ "$current_target" != "$skill_dir" ]; then
                ln -sf "$skill_dir" "$target"
                ((UPDATED++)) || true
            else
                ((SKIPPED++)) || true
            fi
        fi
    done
fi

TOTAL_SKILLS=$(ls -d "$TARGET_SKILLS"/*/ 2>/dev/null | wc -l | tr -d ' ')
ok "スキルを更新しました（新規: ${INSTALLED}件 / 更新: ${UPDATED}件 / 合計: ${TOTAL_SKILLS}件）"

TARGET_AGENTS="$HOME/.claude/agents"
SOURCE_AGENTS="$REPO_DIR/.claude/agent-source"
mkdir -p "$TARGET_AGENTS"

AGENT_NEW=0; AGENT_UPDATED=0; AGENT_SKIPPED=0

if [ -d "$SOURCE_AGENTS" ]; then
    for agent_file in "$SOURCE_AGENTS"/*.md; do
        agent_name=$(basename "$agent_file")
        [[ "$agent_name" == "CLAUDE.md" ]] && continue
        target="$TARGET_AGENTS/$agent_name"
        # Replace symlinks with real copies to avoid broken links when repo moves
        if [ -L "$target" ]; then rm -f "$target"; fi
        if [ ! -f "$target" ]; then
            cp "$agent_file" "$target"
            ((AGENT_NEW++)) || true
        elif ! diff -q "$agent_file" "$target" > /dev/null 2>&1; then
            cp "$agent_file" "$target"
            ((AGENT_UPDATED++)) || true
        else
            ((AGENT_SKIPPED++)) || true
        fi
    done
fi

TOTAL_AGENTS=$(ls "$TARGET_AGENTS"/*.md 2>/dev/null | wc -l | tr -d ' ')
ok "エージェントを更新しました（新規: ${AGENT_NEW}件 / 更新: ${AGENT_UPDATED}件 / 合計: ${TOTAL_AGENTS}件）"

# ─────────────────────────────────────────
# Step 4: 動作確認
# ─────────────────────────────────────────
step "ステップ 4/4：動作を確認しています"

echo ""
SKILL_COUNT=$(ls -d "$TARGET_SKILLS"/*/ 2>/dev/null | wc -l | tr -d ' ')
EXPECTED_SKILLS=$(ls -d "$SOURCE_SKILLS"/*/ 2>/dev/null | grep -v '_archived' | grep -v 'data' | wc -l | tr -d ' ')
if [ "$SKILL_COUNT" -ge "$EXPECTED_SKILLS" ] 2>/dev/null; then
    ok "スキル: ${SKILL_COUNT} 個が利用可能です ✅（期待値: ${EXPECTED_SKILLS}個）"
elif [ "$SKILL_COUNT" -ge 50 ] 2>/dev/null; then
    warn "スキル: ${SKILL_COUNT} 個（期待値: ${EXPECTED_SKILLS}個 — 一部欠落の可能性）"
    info "全スキルを入れるには: ./scripts/install.sh --profile full"
else
    warn "スキル: ${SKILL_COUNT} 個（期待値: ${EXPECTED_SKILLS}個 — 大幅に不足しています）"
    warn "install.sh を再実行してください: ./scripts/install.sh"
fi

AGENT_COUNT=$(ls "$TARGET_AGENTS"/*.md 2>/dev/null | wc -l | tr -d ' ')
ok "エージェント: ${AGENT_COUNT} 個が利用可能です"

if echo '{"source":"test","cwd":"'"$(pwd)"'"}' | node .claude/hooks/workflow-sessionstart-injector.js 2>/dev/null; then
    ok "システム動作確認 … OK"
else
    warn "一部の確認に問題がありましたが、通常は動作します"
fi

# 深部検証（symlink dangling、hook 参照、version 整合）
if [ -f "$REPO_DIR/scripts/verify-installation.js" ]; then
    echo ""
    node "$REPO_DIR/scripts/verify-installation.js" "$REPO_DIR" 2>&1 || true
    # 警告は表示するが update.sh 自体は成功扱いで継続
fi

# ─────────────────────────────────────────
# 完了メッセージ
# ─────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   🎉  アップデートが完了しました！  v${NEW_VERSION}             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  ┌──────────────────────────────────────────────────────────┐"
echo "  │  アップデート後にやること                                 │"
echo "  ├──────────────────────────────────────────────────────────┤"
echo "  │                                                          │"
echo "  │  Claude Code を再起動してください                         │"
echo "  │  → 一度閉じて、再度開くだけで完了です                     │"
echo "  │                                                          │"
echo "  └──────────────────────────────────────────────────────────┘"
echo ""
echo "  ❓ 困ったときは："
echo "     npm run taisun:diagnose  → 問題の診断"
echo "     チャットで「使い方を教えて」と話しかける"
echo ""
