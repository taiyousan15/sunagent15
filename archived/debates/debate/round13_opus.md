# Round 13: データ整合性 — Opus Analysis

## Finding 1
**Issue**: 問題2でadditive-only（オプションB）実装後、settings.jsonとmcp.jsonの間の整合性チェックがない（settings.jsonに存在するMCPがmcp.jsonに存在しないケース）
**Evidence**: install.sh:427-458でsettings.json更新 vs install.sh:374-379で.mcp.json確認 — 両ファイルの同期チェックなし
**Category**: config
**Severity**: medium
**推奨**: update完了後にsettings.mcpServersとmcp.json.mcpServersのキー差分チェックを実施。孤立エントリをwarnで表示

## Finding 2
**Issue**: 問題3でダングリングsymlink検知（オプションC）実装時、~/.claude/skills/内の全シンボリックリンクとリポのsource間の整合性も同時に検証すべき
**Evidence**: install.sh:297-311でln -sf作成 — sourceパスが正しいかの検証は作成時のみ
**Category**: config
**Severity**: medium
**推奨**: verificationはsymlink先が実際に存在するかどうかを`-L and -e`コマンドで二段階確認

## Finding 3
**Issue**: 問題1でsetup-project.ps1:181のagent-source/agentsズレはデータ整合性の根本問題 — インストール後の~/.claude/agents/の内容がinstall.ps1とsetup-project.ps1で異なる状態になりうる
**Evidence**: install.ps1:385 `$SOURCE_AGENTS = ...\.claudegent-source` vs setup-project.ps1:181 `$SOURCE_AGENTS = ...\.claudegents`
**Category**: config
**Severity**: critical
**推奨**: setup-project.ps1:181を即座に `.claudegent-source` に修正（1行変更、breaking changeなし、最も確実な修正）
