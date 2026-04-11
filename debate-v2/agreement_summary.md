# Debate-Review v2 合意サマリー（15ラウンド）

## 統計
- Opus R1-5: 0 Critical / 3 High / 5 Medium / 7 Low = 15件
- Opus R6-10: 3 Critical / 6 High / 3 Medium / 0 Low = 12件
- Codex R11-15: 1 Critical / 3 High / 3 Medium / 1 Low = 8件
- **合計: 4 Critical / 12 High / 11 Medium / 8 Low = 35件**

## クロス検証で一致した問題（AGREE）

| # | 問題 | Opus | Codex | 合意severity | 修正案 |
|---|------|------|-------|-------------|--------|
| 1 | JsonlStore compact中のappendLog競合→データ欠落 | R3 High | R13 Critical | **Critical** | appendをバッファリング、compact後にflush |
| 2 | update.sh FORCE_UPDATE exit時にstash未復帰 | R5 High | R14 High | **High** | exit前にstash pop、または FORCE_UPDATE時stashスキップ |
| 3 | captcha-patterns `/cloudflare/i` が通常ページで誤検知 | R2 Medium | R11 High | **High** | `/cloudflare.*challenge/i` に限定 |
| 4 | ci.yml npm audit continue-on-error でセキュリティゲート無効 | R5 High | R15 Medium | **High** | continue-on-error削除 or CRITICAL-onlyで失敗 |
| 5 | .env.example ANTHROPIC以外がREQUIREDに誤分類 | R7 Critical | — | **Critical** | ANTHROPIC_API_KEYのみREQUIRED |
| 6 | logrotate.conf *.log未対象(19+ファイル無制限肥大化) | R9 Critical | — | **Critical** | *.log追加 |
| 7 | newsyslog.conf 4件のみ/23+件中 | R9 High | — | **High** | 全ファイル列挙 |
| 8 | logrotate/newsyslog パスがプレースホルダーのまま | R9 High | — | **High** | install.shにsed置換追加 |
| 9 | checkpoint-guard \.\.がURL内で誤検知 | R5 Medium+R10 | R11(類似) | **Medium** | `\/\.\.\/ `に変更 |
| 10 | dispatch.ts/TOOLS二重管理 | R2 Low | R12 Medium | **Medium** | ツールレジストリ統合(将来) |
| 11 | PATTERN_LABELS手動同期 | R2 Medium | R12 Low | **Medium** | {regex,label}統合構造 |
| 12 | grounding minScore未伝達 | R1 Medium | — | **Medium** | options.minScore渡し |
| 13 | dispatch memory_statsケース欠如 | R1 Medium | — | **Medium** | case追加 |
| 14 | INSTALL.md Node.js 18 vs 20 矛盾 | R6 High | — | **High** | 20以上に統一 |
| 15 | INSTALL.md Linux .env手順欠如 | R6 High | — | **High** | 手順追加 |
| 16 | update.sh FORCE_UNDEFでZIPフォールバック到達不能 | — | R11 Medium | **Medium** | reset --hardのみ保護、ZIP維持 |
| 17 | 新規3ファイルがuntracked(コミット漏れリスク) | — | R15 High | **High** | git add必須 |
| 18 | jest hooks projectコメントアウトで--selectProjects不能 | R8 Critical | — | **Critical** | コメント解除or実行方法修正 |

## 修正不要と判断したもの（Low severity）
- graph.ts ellipsis heuristic (R1): try/catchで十分、低リスク
- dispatch RAG import boundary (R2): 単一ファイルの越境のみ、将来整理
- dispatch JSON pretty-print (R4): パフォーマンス影響は微小
- grounding async宣言 (R4): 将来のvector store接続用に維持OK
