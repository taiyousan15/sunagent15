# 設計レビュー: sunagent15 ワンコマンド install / update（Windows-bash 対応）

**Date**: 2026-05-15 10:35:00 JST
**Author**: Claude Opus 4.7
**Target**: sunagent15 (taiyousan15/sunagent15)
**Review Type**: Pre-implementation design review
**Reviewer**: Codex GPT-5.x

---

## 問題（Problem Statement）

Windows ユーザー（Claude Code 同梱の bash 経由）が `! .\scripts\install.ps1` を貼ると **bash がバックスラッシュを消去** して `.scriptsinstall.ps1: command not found` で失敗する。

実環境のログ:
```
! .\scripts\install.ps1
└ /usr/bin/bash: line 1: .scriptsinstall.ps1: command not found
```

並行する副次問題:
1. install スクリプト内の URL が古い `san15/taisun_agent`（リポは `taiyousan15/sunagent15`）
2. `bash install.sh` を Windows で叩いても Linux モードで動こうとして失敗する
3. update も同様で 1 コマンドで完結する経路がない

---

## ゴール

| ゴール | 受け入れ基準 |
|-------|------------|
| G1: どんなシェルでも 1 コマンドで install | macOS bash / Linux bash / Windows PowerShell / Windows cmd / **Windows Git Bash + Claude Code bash** すべてで成功 |
| G2: どんなシェルでも 1 コマンドで update | 同上、`-Update` 相当の動作 |
| G3: 既存 macOS/Linux ユーザーへの後方互換 | `bash install.sh` の従来挙動は壊さない |
| G4: 既存 Windows PowerShell ユーザーへの後方互換 | `.\install.ps1` / `.\scripts\install.ps1` の従来挙動は壊さない |

---

## 設計（Design）

### A. 共通: URL 修正（必須前提）

`san15/taisun_agent` → `taiyousan15/sunagent15` を以下で置換:
- `install.sh` 5,6,16 行目
- `install.ps1` 4,8,22 行目
- `scripts/install.ps1` 内部 ZIP フォールバック URL
- `scripts/quick-install.ps1` 内部 URL
- `INSTALL.md` 全 git clone 例
- Issues リンク

### B. install.sh（ルート）への Windows-bash 検出を追加

```bash
# Line 14 (set -euo pipefail) の直後、L16 REPO_URL より前に追加:
case "$(uname -s 2>/dev/null || echo unknown)" in
    MINGW*|MSYS*|CYGWIN*)
        # Windows + bash 環境を検出 → PowerShell へ委譲
        echo "▶ Windows-bash 検出。PowerShell に委譲します ..."
        if ! command -v powershell.exe >/dev/null 2>&1; then
            echo "❌ powershell.exe が見つかりません。Windows PowerShell から実行してください。" >&2
            exit 1
        fi
        SCRIPT_DIR_W="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo "")"
        if [[ -n "$SCRIPT_DIR_W" && -f "$SCRIPT_DIR_W/install.ps1" ]]; then
            # ローカルチェックアウトの場合は同階層 install.ps1 を呼ぶ
            PS_PATH="$(cygpath -w "$SCRIPT_DIR_W/install.ps1" 2>/dev/null || echo "$SCRIPT_DIR_W/install.ps1")"
            exec powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "$PS_PATH" "$@"
        else
            # curl|bash 経由（リモート実行）の場合は irm|iex に切替案内
            cat >&2 <<EOF
❌ Windows + bash のリモート実行は未対応です。PowerShell でこれを実行してください:

  irm https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install.ps1 | iex

EOF
            exit 1
        fi
        ;;
esac
```

**重要**: `exec` で置き換えるので戻ってこない（無限ループ回避）。

### C. scripts/install.sh への同等処理（ローカル checkout 時の保険）

scripts/install.sh の冒頭にも同じ Windows-bash 検出を入れ、`scripts/install.ps1` へ委譲。

### D. install.cmd（ルート・新規作成）

`cmd.exe` および `bash`（コマンド自体に `\` を含まない）でも単一トークンで叩ける wrapper:

```cmd
@echo off
REM sunagent15 - Windows entry point (works from cmd.exe and Git Bash)
setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install.ps1" %*
exit /b %ERRORLEVEL%
```

ユーザー側のコマンド:
- cmd: `install.cmd`
- bash: `./install.cmd` または `cmd //c install.cmd`
- Claude Code bash: `! ./install.cmd`

### E. update.cmd（ルート・新規作成）

```cmd
@echo off
REM sunagent15 - 1-command update (Windows)
setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install.ps1" -Update %*
exit /b %ERRORLEVEL%
```

### F. scripts/update.cmd（ローカル checkout 用）

同様の wrapper を scripts/ にも配置（既存の scripts/install.ps1 直叩き需要に応える）。

### G. update.sh（ルート・新規 / B と同じ Windows 検出を持つ）

既存に `scripts/update.sh` はあるがルートになかった。ルートに置いて、Windows-bash なら PowerShell へ委譲、それ以外は `scripts/update.sh` を exec する。

---

## ユーザーに渡す最終コマンド（実装後）

### Windows（誰でも・どのシェルでも・1 コマンド）

**完全リモート install**（PowerShell ウィンドウ）:
```powershell
irm https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install.ps1 | iex
```

**Claude Code bash 内（Windows）**:
```
! cmd //c install.cmd
```
または既に clone 済みなら:
```
! cd ~/sunagent15 && cmd //c install.cmd
```

**Update**:
```
! cmd //c update.cmd
```

### macOS / Linux

従来通り:
```bash
bash install.sh
```

---

## テストマトリクス（実装後検証）

| Env | OS | Shell | Command | Expected |
|-----|----|----|---------|----------|
| T1 | macOS | bash | `bash install.sh` | ✅ 従来通り |
| T2 | macOS | zsh | `bash install.sh` | ✅ 従来通り |
| T3 | Linux | bash | `bash install.sh` | ✅ 従来通り |
| T4 | Win | PowerShell | `.\install.ps1` | ✅ 従来通り |
| T5 | Win | PowerShell | `.\scripts\install.ps1` | ✅ 従来通り |
| T6 | Win | cmd | `install.cmd` | ✅ NEW |
| T7 | Win | Git Bash | `bash install.sh` | ✅ NEW（PSへ委譲） |
| T8 | Win | Git Bash | `cmd //c install.cmd` | ✅ NEW |
| T9 | Win | Claude Code bash | `! cmd //c install.cmd` | ✅ NEW |
| T10 | Win | Claude Code bash | `! bash install.sh` | ✅ NEW |

---

## リスク分析

| Risk | Severity | Mitigation |
|------|----------|------------|
| R1: Windows-bash 検出ロジックが macOS/Linux に誤動作 | Medium | `uname -s` の MINGW/MSYS/CYGWIN にしかマッチしないので安全 |
| R2: PowerShell.exe が PATH にない Windows | Low | エラーメッセージで PowerShell ウィンドウからの実行を案内 |
| R3: `exec` 失敗時に親 bash が暴走 | Low | `exec` 直前に `command -v powershell.exe` を確認済み |
| R4: `cygpath` がない Git Bash（極稀） | Low | フォールバックで cygpath 出力なしの場合は元パスをそのまま渡す |
| R5: install.cmd の `%*` 経由で PowerShell 引数が壊れる | Medium | `-File` 経由は `-Profile foo` のような単純引数は OK。複雑な quoted 引数は要テスト |
| R6: cmd //c install.cmd で UTF-8 が壊れる | Medium | install.ps1 側で `[Console]::OutputEncoding = UTF8` 済み（既存） |
| R7: 既存 install.ps1 内部の `$Profile` 自動変数衝突 | High（**既存バグ**） | scripts/install.ps1 は `[Alias("Profile")][string]$SkillProfile` で回避済み。ルート install.ps1 は `$Profile = ...` を使っており PowerShell 組み込み `$Profile`（プロファイルファイルパス）と衝突する可能性あり。今回の修正で `$SkillProfile` にリネーム推奨 |

---

## 質問 / 確認ポイント（Codex への問い）

Q1. **R7 の `$Profile` 衝突は本当に致命的か？** PowerShell 5.1 / PowerShell 7 で再現性を確認してほしい。
Q2. **install.cmd の `%*` 渡しで `-Profile minimal` が正しく PowerShell に届くか？** 引用符のエスケープに穴がないか。
Q3. **Windows-bash で `exec powershell.exe` を呼ぶ際、stdin/stdout の handle が継承されて対話プロンプトが正常動作するか？** scripts/install.ps1 が Read-Host を使っていれば検証が必要。
Q4. **`cmd //c` のスラッシュエスケープは Git Bash 特有か？** MSYS2 / Cygwin でも同じ書式か。
Q5. **`-NoProfile` を付けることで PowerShell の `$PROFILE` 読込をスキップしているが、副作用はないか？** `$env:PSModulePath` などの初期化漏れリスク。
Q6. **設計の代替案**: install.cmd ではなく `setup-windows.js` を Node で書く方が堅牢か？（Node は既に必須要件）

---

## 判定基準（GO/NO-GO）

- **GO**: テストマトリクス T1〜T10 すべてが理論上 PASS と Codex が判定し、Q1〜Q6 の致命的問題なし
- **NO-GO**: いずれかの Q で致命的問題が指摘される、または T7/T9 の Windows-bash 経路に欠陥が発見される

---

## 参考

- Microsoft Docs: `powershell.exe` CLI parameters (`-File`, `-ExecutionPolicy`)
- Git for Windows: MSYS_NO_PATHCONV, MSYS2_ARG_CONV_EXCL
- StackOverflow: bash on Windows path translation (cygpath)

---

## Codex 実装前レビュー結果（2026-05-15 10:50 JST）

**判定**: NO-GO

**指摘事項と対応**:

| # | Codex 指摘 | 重大度 | Claude 判定 | 対応 |
|---|----------|--------|------------|------|
| 1 | `$Profile` は PowerShell 自動変数。`irm\|iex` でユーザーセッションを汚染 | HIGH | ACCEPT | ルート `install.ps1` の `$Profile` を **`$SkillProfile`** にリネーム |
| 2 | `cmd //c install.cmd` は Microsoft / MSYS2 公式書式ではない | MEDIUM | ACCEPT | ドキュメントから `cmd //c` を削除。Git Bash でも **`./install.cmd`** を主推奨に統一 |
| 3 | `-File %*` 経由の引数渡しは単純引数のみ安全 | MEDIUM | ACCEPT | INSTALL.md に「対応引数: `-Profile <name>` / `-Update` / `-Fresh` / `-Force` のみ」と明記 |
| 4 | Windows-bash 検出に `$MSYSTEM` 環境変数も併用推奨 | LOW | ACCEPT | `uname -s` に加え `MSYSTEM` でも判定 |
| 5 | R7 ($Profile 衝突) は HIGH | HIGH | ACCEPT | #1 と同じ対応 |

**公式根拠（Codex 提示・採用）**:
- about_automatic_variables: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_automatic_variables
- about_powershell_exe: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe
- about_profiles: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_profiles
- about_PSModulePath: https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_PSModulePath
- gitforwindows.org/git-wrapper: https://gitforwindows.org/git-wrapper.html

**更新後 GO 基準**: 上記 #1〜#5 すべてを実装に反映する。post-implementation Codex レビューで再検証。
