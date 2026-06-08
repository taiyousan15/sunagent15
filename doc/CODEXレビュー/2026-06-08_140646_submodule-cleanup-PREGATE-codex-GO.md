# Codex 実装前ゲート: broken submodule 2件掃除 — round2 GO

- **日時**: 2026-06-08 / session 53 / Opus 4.8 (ultracode)
- **対象 repo/branch**: `taiyousan15/sunagent15`（base origin/main `6027de8`・PUBLIC）
- **計画書(SSoT)**: `doc/2026-06-08_134620_submodule-cleanup-PLAN.md`
- **round1 記録**: `doc/CODEXレビュー/2026-06-08_135755_submodule-cleanup-PREGATE-codex-NOGO.md`
- **Codex**: `Agent subagent_type: codex:codex-rescue`（foreground WAIT）/ agentId `a9834a86905cebafd` / 5 tool_uses / 386s
- **判定**: Codex round2 = **GO**（blocker ゼロ）

## 1. Codex round2 所見（要点）
- F1（前回 High）合格: `.gitmodules` entry は google-auth-system のみ（1-3行）／index gitlink 160000 が2件のみ・`.git/index.lock` 無し／PLAN §5 Q4 に書込環境 dry-run EXIT=0・index 不変の記録あり → 状態証拠で裏取り。
- F2（前回 Low）合格: `.mcp.json.example` は配布テンプレと訂正済（Unix `install.sh:522-524` / Win `install.ps1:685-688` でコピー）。テンプレ内 line-bot は disabled。インストール検証 `verify-installation.js:177-182` は **.mcp.json のパース可否のみ**検査 → clone/submodule fatal でも install blocker でもない。decommission は §6 follow-up に分離明記。
- 6変更の安全性: 両 gitlink + .gitmodules 削除で submodule fatal 解消。line-bot を build ループから外しても残2 MCP dir に有効なループ構文が保たれる（`install.sh:375-386` / `update.sh:154-166` / `install.ps1:497-510`）。新たな dangling 破壊なし。
- 補足: Codex 単独判定ゆえ Opus 独立 blind review + 一致確認ゲートを要する旨を Codex 自身が明記。

## 2. Opus 独立最終判定（実ファイル・実コマンド／Pattern 7・10）= **GO 同意 / AGREE**
全主張を自分で裏取り済み:
1. `git rm --cached -n` 実測 EXIT=0・index 不変・lock 残存なし（書込環境）。
2. `.gitmodules` は google-auth-system 1件のみ → file ごと `git rm` が正規。
3. install.sh:368-390 / update.sh:146-170 / install.ps1:490-510 の各ループは3要素（voice-ai/ai-sdr/line-bot）。line-bot 1要素除去で残2要素の有効構文が維持。
4. `check-installer-parity.js:42-71` + `installer-capability-matrix.json` は CLI フラグのみ照合 → build ループ編集は parity 無影響。
5. `verify-installation.js:177-182` は .mcp.json JSON parseability のみ検査（dist 非検査）。install-smoke CI は main/#33 green。→ disabled line-bot テンプレ残は**非ブロッキング**を実証。
6. line-bot **server 名**参照（approval-gate.js / mcp-profiles / presets / install.ps1:192 / mcp-health-check.sh:99）は submodule 掃除と無関係＝§6 decommission の範囲。本PRで壊れない。
7. Pattern 11: `git add -A/-u` 不使用・明示パス・commit 前 `git diff --cached --name-status` で settings.json.backup 非混入を確認。

## 3. 収束（cosine 類似度ゲート）
- 問題認識 AGREE（両者同一2点）／修正方向 AGREE（dry-run 検証＋PLAN 訂正＋decommission 分離）。
- round1 NO-GO → 新証拠（検証済 dry-run・訂正 PLAN）→ round2 GO の**正当収束**（Sycophancy ではない）。
- → 実装許可。実装後ゲート（codex:codex-rescue foreground）→ Opus 再検証 → 明示パス commit → push/PR はユーザー承認後。

出典: 実コマンド（git rm --cached -n / ls-files -s / diff --stat d764963 6027de8 / 各 script・verify-installation.js 実読 / install-smoke CI 実績）/ Codex codex-rescue agentId a9834a86905cebafd。
