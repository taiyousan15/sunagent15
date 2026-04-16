# Opus 4.6 Initial Positions — 5 Concrete Refactoring Proposals

本セッションの Opus 4.6（`claude-opus-4-6[1m]`、メインセッション）が提案する具体的実装。
Real Codex Pro の反論を受けるため、各提案に明確な根拠と範囲を記載。

---

## Proposal 1: CHANGELOG.md を v2.53.3 まで更新

### 現状
- `README.md:20,24` に v2.53.3 (2026-04-15) 記載あり（2件）
- `CHANGELOG.md` に v2.53.3 エントリ **0 件**（最新は v2.53.0 止まり）
- v3 REAL debate Round 6-F3 で実測確認済

### 提案
`CHANGELOG.md` に以下を追加:
```markdown
## [2.53.3] - 2026-04-15

### Added
- Non-destructive settings.json merge (src/utils/settings-merge.ts)
- scripts/update-settings.js with FIFO 3-gen backup
- scripts/verify-installation.js (7 local health checks)
- npm run setup:fresh command
- npm run taisun:verify command
- Windows CI regression guards

### Fixed
- scripts/setup-project.ps1 agent source path (.claude\agent-source)
- scripts/install.ps1 $Profile → $SkillProfile (PowerShell auto-var collision)
- Fresh-install regression (smartMerge auto-detection)
- npm audit fix: 8 vulnerabilities → 0

### Changed
- install.sh Step 5 hook check: hardcoded 3 → dynamic ls count
- Destructive update advice: "npm run setup" → "npm run update"
```

### 期待効果
- ドキュメント整合性回復
- 他人 repo 閲覧時の version 不整合警告解消（verify-installation 警告ゼロ化）

### リスク
- ゼロ（新規ドキュメント追加のみ、既存動作に影響なし）

---

## Proposal 2: README v2.53.3 長大エントリ（2295文字1行）を CHANGELOG に移動

### 現状
- `README.md:24` が 2295 文字 1 行（v3 REAL Round 11 実測）
- README の「最新版」セクションが見辛い

### 提案
README.md:24 の長大エントリを以下 1 行に短縮:
```
| v2.53.3 | 2026-04-15 | **ポータビリティ + 非破壊update + サイレント失敗検知** — [詳細は CHANGELOG.md](CHANGELOG.md#2533---2026-04-15) 参照 |
```
詳細は Proposal 1 で追加した CHANGELOG エントリに移動。

### 期待効果
- README 短縮、他人の初見理解向上
- CHANGELOG が Single Source of Truth に

### リスク
- 低（README の情報は失わない、参照先が CHANGELOG に移るだけ）
- 既存リンク（例: GitHub 検索）が壊れる懸念 → 移行期間として README に 1 行サマリーを残す

---

## Proposal 3: browser_profile/ を .gitignore に明示追加

### 現状
- `.claude/skills/nanobanana-pro/data/browser_profile/` ディレクトリ存在
- `git ls-files browser_profile/` = 0 件（v3 REAL Round 14 実測、既に untracked）
- `.gitignore:96` 既登録だが**明示的でなくパターンマッチ**の可能性

### 提案
`.gitignore` に以下を明示追加（既存 line 96 の下）:
```gitignore
# Browser profile (Chrome user data, personal)
.claude/skills/nanobanana-pro/data/browser_profile/
```

### 期待効果
- 誤 add 予防の強化
- 将来他スキルが browser_profile 作成時にも包括的

### リスク
- ゼロ（既に untracked、明示化のみ）

---

## Proposal 4: Hook log rotation 機構

### 現状
- `.claude/hooks/data/unified-metrics.jsonl` **3.9M**（v3 REAL Round 9 実測）
- `.claude/hooks/data/checkpoint-skip.log` **804K**
- `research/runs/` **58M**（Opus の 5.7M 誤認を Codex が修正）
- 肥大化を防ぐ機構が未実装

### 提案
新規 hook `.claude/hooks/log-rotator.js` を SessionStart で実行:
```javascript
// 日次 rotation: unified-metrics.jsonl が 5MB 超えたら
//   .claude/hooks/data/archive/unified-metrics-YYYY-MM-DD.jsonl にアーカイブ
// 月次 cleanup: research/runs/ の 30日超過 JSON を自動削除
// FIFO 上限: archive は 12 月分まで
```

### 期待効果
- 肥大化抑制（5.7M〜58M → 500K 以下維持）
- コンテキスト早消費対策（Explore 指摘 E1-E3 の根本対処）

### リスク
- 中: rotation バグでログ喪失の可能性 → dry-run モード先行 + テスト 3 ケース追加必須

---

## Proposal 5: install.sh/setup-project.sh 共通部分の抽出

### 現状
- `install.sh` と `setup-project.sh` で **共通 110 行**（v3 REAL Round 12 実測、`comm -12`）
- skill/agent 登録ロジックが両方に重複
- 将来の install ロジック変更時に同期コスト発生

### 提案
新規 `scripts/lib/setup-common.sh` を作成:
```bash
# 共通関数化するもの:
# - install_skills()    — ~/.claude/skills への symlink 作成
# - install_agents()    — ~/.claude/agents へのコピー
# - mkdir_claude_dirs() — .claude/temp, agent-memory, .taisun/memory
# - ui helpers: ok(), warn(), info(), step(), fail()
```
install.sh と setup-project.sh から `source scripts/lib/setup-common.sh` で呼び出し。

同様に `scripts/lib/setup-common.ps1` を作成（install.ps1 と setup-project.ps1 の共通 145 行部分）。

### 期待効果
- 保守コスト半減
- バグ修正時の同期ミス防止（P0 で修正した agent-source/agents 問題と同種のバグ予防）

### リスク
- 中: sourced script のパスズレで install 全破壊リスク
- 緩和策: 各フェーズで install.sh/ps1 smoke test、Windows CI 回帰ガード追加

---

# Real Codex Pro に期待する反論観点

1. 実装範囲が小さすぎる / 過大 か
2. リスク評価が甘い箇所はないか
3. 実装順序（P6/P7/P8）の妥当性
4. 他人ユーザーへの影響評価の抜け
5. 測定値（3.9M, 58M, 110行, 145行等）の再検証
