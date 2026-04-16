# Round 3: エラー処理 — 削除による連鎖障害 — Opus 4.6 Analysis

### Finding 1
**Issue**: debate/ の write_rounds.py と write_summary.py は再生成できる Python スクリプトのため削除安全
**Evidence**: `debate/write_rounds.py`, `debate/write_summary.py` は一回限りの生成用
**Category**: content
**Severity**: low
**判定**: debate/ 全体を archived/debates/v1/ 移動可

### Finding 2
**Issue**: dist/ を git rm --cached した後、他人が git pull した時に postinstall が失敗すると MCP 起動できない
**Evidence**: package.json:52 postinstall = `npm run build:all`
**Category**: code
**Severity**: high
**判定**: postinstall 失敗時のフォールバック手順を README に明記すべき

### Finding 3
**Issue**: .taisun/memory/memory.jsonl を削除するとユーザーの AI 記憶が失われる
**Evidence**: ファイルサイズ 13M = セッション履歴の蓄積
**Category**: data
**Severity**: high
**判定**: ユーザー既存環境では絶対削除しない、配布リポから `git rm --cached` のみ

---
