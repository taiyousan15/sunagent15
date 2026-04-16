# Round 12: 保守性 — 将来の変更しやすさ — Opus 4.6 Analysis

### Finding 1
**Issue**: install.sh と setup-project.sh の重複（C2）は将来の install ロジック変更時の同期コスト大
**Evidence**: install.sh:280-357 と setup-project.sh:147-214 が ~80 行重複
**Category**: architecture
**Severity**: high
**判定**: 共通関数を `scripts/lib/setup-common.sh` に抽出、両方から source

### Finding 2
**Issue**: install.ps1 と setup-project.ps1 の同様重複（C3）
**Evidence**: 同上のパターン
**Category**: architecture
**Severity**: high
**判定**: `scripts/lib/setup-common.ps1` に抽出

### Finding 3
**Issue**: hook readStdin 14 ファイル重複（C1）は将来の stdin 処理変更時に全 14 ファイル修正必要
**Evidence**: Codex 監査で 14/22 hook が自前定義
**Category**: architecture
**Severity**: medium
**判定**: 段階移行（1 週間 5 hook ずつ）

---
