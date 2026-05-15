# Codex 実装後レビュー: sunagent15 ワンコマンド install/update

**Date**: 2026-05-15 10:45 JST
**Reviewer**: Codex GPT-5.x
**Target Branch**: fix/windows-one-command-install-2026-05-15
**Files Reviewed**: install.sh, install.ps1, install.cmd, update.cmd, scripts/install.ps1, install-release.ps1, INSTALL.md

---

## 総合判定: GO

主経路の `install.cmd` / `update.cmd` / `install.ps1` / `install.sh` はリリース可。
Junction 削除、PowerShell 引数転送、MSYS2/Git Bash 検出は公式仕様と矛盾なし。

---

## A〜E 各項目評価

| 項目 | 評価 |
|-----|------|
| A. Repair-McpServerPaths | 概ね健全。`Test-Path` 安全寄りだが対象名 whitelist 推奨 ← 適用済み |
| B. Repair-JsonFile / BOM | BOM 処理は OK。不正 UTF-8 は置換 fallback 後 JSON 検証される |
| C. Junction 安全削除 | 公式根拠あり。正規化も大小文字・末尾 `\` を吸収 |
| D. 後方互換 | macOS/Linux 本体は維持。Windows 直叩きも維持 |
| E. `%*` 引数転送 | 通常引数は OK。複雑引用は文書どおり保証外 |

---

## 新規発見の致命的バグ

**なし。**

---

## 重要だが非致命的な改善提案（3 件・全て適用済み）

| # | 指摘 | 対応 |
|---|-----|------|
| 1 | `INSTALL.md:25, :86` - clone 先が `sunagent15` なのに `cd taisun_agent` のまま | `cd sunagent15` に修正 |
| 2 | `install-release.ps1:28` - `$Profile` 残存。`$PROFILE` 衝突 | `$SkillProfile` にリネーム |
| 3 | `scripts/install.ps1` - `Repair-McpServerPaths` に既知 MCP 名 whitelist | `taisun-proxy / line-bot / voice-ai / ai-sdr / codebase-memory` に限定 |

---

## 公式根拠 URL

- Directory.Delete reparse point: https://learn.microsoft.com/en-us/dotnet/api/system.io.directory.delete
- PowerShell `-File` 引数: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe
- `$PROFILE` 自動変数: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_automatic_variables
- MSYS2 `MSYSTEM`: https://www.msys2.org/docs/environments/
- Git for Windows/MSYS2: https://gitforwindows.org/requirements.html
- `%*` batch 引数: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/call

---

## Claude の独立判定（codex-review.md ルール準拠）

| Codex 指摘 | Claude 再分析 | 採用 |
|----------|-------------|-----|
| #1 INSTALL.md typo | 実害あり（Mac/Linux 手順実行失敗） | ✅ ACCEPT |
| #2 install-release.ps1 $Profile | 自動変数衝突は実害あり（前回 NO-GO と同根） | ✅ ACCEPT |
| #3 MCP whitelist | 防御として妥当。誤爆リスク低減 | ✅ ACCEPT |

**Claude の最終判定: GO（指摘 3 点を反映済み）**

---

## PR チェックリスト

- [x] 実装前 Codex review (NO-GO → 5 点反映)
- [x] 実装後 Codex review (GO + 3 点改善)
- [x] 改善 3 点適用済み
- [x] doc/CODEXレビュー/ にレポート保存
- [ ] git commit + push
- [ ] PR 作成（sunagent15）
