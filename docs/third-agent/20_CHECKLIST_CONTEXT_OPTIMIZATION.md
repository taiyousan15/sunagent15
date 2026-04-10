# コンテキスト最適化チェックリスト

Claude Codeのコンテキスト消費を定期的に監査し、不要な読み込みを削減するためのチェックリスト。

## A. CLAUDE.mdの増殖チェック（月次推奨）

`claude-mem` や他のツールが `CLAUDE.md` を自動生成することがある。
Claude Codeはプロジェクト内の**全ての** `CLAUDE.md` を毎セッション読み込むため、空テンプレートでもコンテキストを消費する。

### 検出

```bash
# プロジェクト内のCLAUDE.mdを列挙（メイン以外）
find . -name "CLAUDE.md" -not -path "./.claude/CLAUDE.md" -not -path "*/.ait42/*" -not -path "*/node_modules/*"
```

### 判定基準

| 内容 | 判定 |
|------|------|
| `claude-mem-context` + "No recent activity" | **削除** — 空テンプレ |
| `claude-mem-context` + 古いエントリのみ | **削除** — 陳腐化 |
| 実際の指示・ルール・ガイドラインを含む | **残す** |

### 削除

```bash
# 空テンプレのみ削除（実指示を含むものは除外）
find . -name "CLAUDE.md" -not -path "./.claude/CLAUDE.md" -not -path "*/node_modules/*" \
  -exec grep -L "WORKFLOW\|FIDELITY\|## Rules\|## Instructions" {} \; \
  | xargs rm -f
```

- [ ] 検出を実行した
- [ ] 空テンプレのみ削除した
- [ ] `.claude/CLAUDE.md`（メイン指示書）は残っている

## B. エージェント二重読み込みチェック

### 確認

```bash
# プロジェクトの.claude/agents/にファイルがないこと
ls .claude/agents/*.md 2>/dev/null | wc -l
# → 0 であること

# グローバルにエージェントが存在すること
ls ~/.claude/agents/*.md | wc -l
# → 95 であること

# グローバルがシンボリックリンクでないこと
file ~/.claude/agents/00-ait42-coordinator.md
# → "Unicode text" であること（"symbolic link" でないこと）
```

- [ ] `.claude/agents/` にmdファイルがない
- [ ] `~/.claude/agents/` に95ファイルがある
- [ ] グローバルファイルがシンボリックリンクでない

## C. Worktree残骸チェック

マルチエージェント実行（debate, competition等）の後にworktreeが残ることがある。

```bash
# 残骸の検出
du -sh .ait42/worktrees/ 2>/dev/null
ls .ait42/worktrees/ 2>/dev/null
```

- [ ] 不要なworktreeが残っていない（または削除した）

## D. MCP読み込み数チェック

```bash
# 有効なMCPサーバーの数（settings.jsonで disabled: false のもの）
node -e "
const s = require('./.claude/settings.json');
const mcps = s.mcpServers || {};
const enabled = Object.entries(mcps).filter(([k,v]) => !v.disabled && !k.startsWith('_'));
console.log('Enabled MCPs:', enabled.length);
enabled.forEach(([k]) => console.log('  -', k));
"
```

推奨: 有効MCP **10個以下**（20+で大幅なコンテキスト消費）

- [ ] 有効MCPが10個以下

## E. hooks/dataのサイズチェック

```bash
du -sh .claude/hooks/data/
```

推奨: **10MB以下**。超えている場合は古いログを削除。

- [ ] hooks/dataが10MB以下

## 実施タイミング

| 頻度 | チェック項目 |
|------|-------------|
| セッション開始時 | B（エージェント二重読み込み）を目視確認 |
| 月次 | A（CLAUDE.md増殖）を実行 |
| マルチエージェント実行後 | C（worktree残骸）を確認 |
| MCP追加/変更時 | D（MCP数）を確認 |
| ストレージ警告時 | E（hooks/data）を確認 |
