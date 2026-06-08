# Codex 実装前ゲート: broken submodule 2件掃除 — round1 NO-GO（→修正→round2 へ）

- **日時**: 2026-06-08 / session 53 / Opus 4.8 (ultracode)
- **対象 repo/branch**: `taiyousan15/sunagent15`（base origin/main `6027de8`・PUBLIC）
- **計画書(SSoT)**: `doc/2026-06-08_134620_submodule-cleanup-PLAN.md`
- **Codex**: `Agent subagent_type: codex:codex-rescue`（foreground WAIT）/ agentId `af24d5916d9dad86d` / 3 tool_uses / 385s
- **判定**: Codex round1 = **NO-GO**（High 1 + Low 1）

## 1. Codex 所見（要点）
- **F1 (High)**: Q4 の dry-run 証跡が無い。Codex 環境で `git rm --cached -n …` が `fatal: Unable to create .git/index.lock: Operation not permitted`（`GIT_OPTIONAL_LOCKS=0` でも）で実行できず、`git rm --cached` の挙動を**証明できない**。→ 書込可能なゲートで dry-run を実行し期待出力を記録せよ。
- **F2 (Low)**: scoped-out の line-bot は example-only でない。`scripts/install.sh:522-524` が `.mcp.json.example` を `.mcp.json` に**コピー出荷**するため `.mcp.json.example:37` の dist パスは配布テンプレート。`scripts/mcp-health-check.sh:57-60,99-105` は disabled サーバーでも dist チェックし MISSING 報告。clone/submodule fatal ではないが stale 配布参照。→ decommission を別タスクに分離 or エントリ除去＋health-check の disabled-skip。
- **Q1-Q5**: Q1 split は acceptable（ただし .mcp.json.example:37 は doc でなくコピーされるテンプレと明記せよ）。Q2 .gitmodules 削除=正（1 entry のみ）。Q3 install.ps1 同時編集 sound（parity は CLI フラグのみ照合）。Q4 read-only ゲートでは証明不可。Q5 明示パスで十分。
- **見落とし参照監査**: line-bot-mcp-server の具体パス残は `.mcp.json.example:37` のみ（他は historical doc）。line-bot **server 名**残（approval-gate.js:17 / mcp-profiles.json / presets / install.ps1:192 / mcp-health-check.sh:99）は submodule/gitlink 参照ではない。google-auth-system の tracked hit は `.gitignore:115`/README/CHANGELOG/PROJECT_MAP=cosmetic。

## 2. Opus 独立再検証（実ファイル・実コマンド／Pattern 7・10）
- **F1 → ACCEPT(動作確認義務) だが実severityは Low/解消済**: 書込可能環境で dry-run 実測 → `rm 'google-auth-system'` / `rm 'mcp-servers/line-bot-mcp-server'` / **EXIT=0**、dry-run 後 index は 160000 gitlink 不変、`.git/index.lock` 残存なし。**`git rm --cached` は正しく削除を stage できると証明**。NO-GO の駆動は Codex 側 sandbox の lock 権限制約であり PLAN 欠陥でない。→ PLAN §5 Q4 に実測を記録。
- **F2 → ACCEPT（観察として正当・非ブロッキング）**: mcp-health-check.sh:99-106 は line-bot の args[0] dist を disabled 無関係に検査し `SERVER_OK=false`。ただし dist は**従来から不在**（orphan gitlink）で install-smoke CI は main/#33 green＝**本PRで悪化しない／非ブロッキング**を実証。Codex の本質指摘（.mcp.json.example が「コピー出荷テンプレ」）は正当 → PLAN §2 を訂正し、line-bot decommission を §6 follow-up に分離（Codex の "split acceptable" と一致）。

## 3. 収束
- 問題認識 AGREE（両者同一の2点を指摘）／修正方向 AGREE（dry-run 検証＋PLAN 訂正＋decommission 分離）。
- 対応: (a) dry-run 実測を PLAN に記録（F1 解消）、(b) PLAN §2 で .mcp.json.example を「配布テンプレ」と訂正＋§6 follow-up 新設（F2）。実装する 6 変更（git rm×3 + script×3）自体は不変。
- → 修正版 PLAN で **round2 再ゲート**（新証拠＝検証済 dry-run + 訂正 PLAN に基づく正当な再判定。Sycophancy ではない）。

出典: 実コマンド（git rm --cached -n / ls-files -s / mcp-health-check.sh 実読 / install-smoke CI 実績）/ Codex codex-rescue agentId af24d5916d9dad86d。
