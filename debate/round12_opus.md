# Round 12: 保守性 — Opus Analysis

## Finding 1
**Issue**: 問題1でinstall.sh/install.ps1の二重メンテナンス構造は、新機能追加のたびに両ファイルを同期する負担がある（既にsetup-project.ps1:181のズレが証明）
**Evidence**: setup-project.ps1:181 vs install.ps1:385のagent-source/agentsズレ — 片方だけ更新された結果
**Category**: architecture
**Severity**: high
**推奨**: 機能の単一定義場所を設ける。例: scripts/features.json に機能リストを定義し、sh/ps1スクリプトがそれを読む設計

## Finding 2
**Issue**: 問題2でadditive-only（オプションB）の実装は将来のMCP削除（deprecated MCP除去）に対応できない
**Evidence**: additive-onlyは追加のみで削除しない設計 — 古いMCPが永遠に残留する可能性
**Category**: architecture
**Severity**: medium
**推奨**: .mcp.json.exampleにdeprecation markを付けるルールを設け、deprecatedキーは明示的リスト管理で削除可能にする

## Finding 3
**Issue**: 問題3でpost-install verification（オプションA）は将来のhook追加時に検証リストを手動更新する必要がある
**Evidence**: install.sh:484-488でhookを3件ハードコード確認 — 新hook追加時に忘れると検証もれ
**Category**: architecture
**Severity**: medium
**推奨**: verificationスクリプトが.claude/hooks/ディレクトリを動的スキャンして全hookの存在確認を自動化
