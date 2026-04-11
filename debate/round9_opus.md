# Round 9: 運用性 — Opus Analysis
## 観点: 問題#9 Linux対応欠如、問題#10 ドキュメント不整合

---

## 問題#9: INSTALL.md Linux対応欠如

### 確認した事実

**INSTALL.md (171行)**
- 行3: `> **対応OS**: macOS (Air / Pro) | Windows 10/11` — Linux の記載なし
- 行18〜69: Mac セクション（bash + zsh 前提）
- 行72〜138: Windows セクション（PowerShell 前提）
- Linux セクション: 完全に存在しない

**scripts/install.sh (300行以上)**
- 行21: `if [[ "$OSTYPE" == "darwin"* ]]; then` — macOS チェック
- `linux*` または `ubuntu*` の OSTYPE チェック: 0件（Bash grep 確認済み）
- `xcode-select` チェックが macOS 専用ブロック内にのみ存在
- install.sh 自体は bash スクリプトであり、Linux でも構文的には実行可能

**cd.yml 行143**
```yaml
curl -fsSL https://raw.githubusercontent.com/${{ github.repository }}/main/install.sh | bash
```
リリースノートの macOS/Linux インストール手順に `curl | bash` が記載されているが、
INSTALL.md には Linux の記載がない矛盾。

### なぜ問題か

1. cd.yml のリリースノートが Linux 向けコマンドを提示しているのに、
   INSTALL.md に Linux 手順がない — 新規 Linux ユーザーが詰まる
2. install.sh は Linux 上でも動く可能性が高いが、未テスト・未保証
3. Ubuntu/Debian 環境でよくある問題（Node.js パッケージマネージャ差異、
   シンボリックリンク権限、`apt` vs `brew`）が未対応

### 修正案

**INSTALL.md への Linux セクション追加**

追加位置: Windows セクション（行72〜138）の直後

```markdown
---

## Linux (Ubuntu 22.04 / Debian 12 推奨)

> **注意**: Linux サポートはコミュニティベースです。動作確認は Ubuntu 22.04 LTS で行っています。

### クイックインストール

```bash
# 1. リポジトリをクローン
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent

# 2. インストール実行（全自動）
bash scripts/install.sh
```

### Node.js のインストール（未インストールの場合）

```bash
# nvm 経由（推奨）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### .env を設定

```bash
# テキストエディタで .env を開く
nano .env   # または vim .env

# ANTHROPIC_API_KEY を設定（必須）
ANTHROPIC_API_KEY=sk-ant-...
```

### メモリ最適化（推奨）

```bash
echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.bashrc
source ~/.bashrc
```

### トラブルシューティング（Linux）

| エラー | 対処 |
|--------|------|
| `command not found: node` | nvm 経由でインストール（上記参照） |
| `permission denied` | `chmod +x scripts/install.sh` を実行 |
| `EACCES: permission denied, mkdir` | `sudo chown -R $USER ~/.npm` を実行 |
| シンボリックリンク作成失敗 | `ls -la ~/.claude/skills/` で確認後、手動で `ln -s` |
```

**INSTALL.md 行3の対応OS行を更新**
```markdown
> **対応OS**: macOS (Air / Pro) | Windows 10/11 | Linux (Ubuntu 22.04 / Debian 12)
```

**scripts/install.sh への Linux 対応追加**

行37（`fi` の直後）に追加:
```bash
elif [[ "$OSTYPE" == "linux"* ]]; then
    # Linux: sudo権限チェック（シンボリックリンク作成に必要な場合）
    if ! command -v node &>/dev/null; then
        warn "Node.js が見つかりません"
        info "nvm 経由でインストール: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    fi
fi
```

---

## 問題#10: docs/third-agent/20_PROXY_MCP_MVP.md「5ツール」記載 vs server.ts の13ツール

### 確認した事実

**20_PROXY_MCP_MVP.md 行15-20:**
```
│  │   Public Tools (5 tools)       │ │
│  │   - system_health              │ │
│  │   - skill_search               │ │
│  │   - skill_run                  │ │
│  │   - memory_add                 │ │
│  │   - memory_search              │ │
```

**src/proxy-mcp/server.ts — TOOLS 配列の実際のツール数:**
1. system_health
2. skill_search
3. skill_run
4. memory_add
5. memory_search
6. output_verify
7. rag_ground
8. cove_verify
9. reflexion_analyze
10. validation_pipeline
11. prospective_check
12. constitutional_check
13. reflexion_round

ドキュメントが言う「5ツール」に対して実際は**13ツール**が実装されている。
差分: +8ツール（validation系 8本が追加）

### なぜ問題か

1. 新規開発者がドキュメントを読むと、proxy-mcp のツール数を 5 と誤解する
2. 実際には validation pipeline（7層バリデーション）が存在するが、
   ドキュメントには「future」として内部 MCP が列挙されているだけ
3. このドキュメントが設計書として参照されると、現実との乖離が混乱を招く

### 修正案

**Option A: ドキュメントを現実に合わせて更新**

20_PROXY_MCP_MVP.md の Architecture 図を更新:
```
│  │   Public Tools (13 tools)      │ │
│  │   Core (5):                    │ │
│  │   - system_health              │ │
│  │   - skill_search               │ │
│  │   - skill_run                  │ │
│  │   - memory_add                 │ │
│  │   - memory_search              │ │
│  │   Validation (8):              │ │
│  │   - output_verify              │ │
│  │   - rag_ground                 │ │
│  │   - cove_verify                │ │
│  │   - reflexion_analyze          │ │
│  │   - reflexion_round            │ │
│  │   - validation_pipeline        │ │
│  │   - prospective_check          │ │
│  │   - constitutional_check       │ │
```

**Option B: ドキュメントを MVP（初期設計）として保存し、現状を別ファイルで記述**

`docs/third-agent/21_PROXY_MCP_CURRENT.md` を新規作成し、現状の13ツールを記述。
20_PROXY_MCP_MVP.md はアーカイブとして残す。

**推奨: Option A** — 単一ドキュメントを最新状態に保つ方が保守しやすい。
MVP フェーズは git 履歴で追跡可能。

## 優先度評価

| 問題 | 影響 | 修正コスト | 優先度 |
|------|------|-----------|--------|
| #9 Linux欠如 | 高（Linuxユーザーが詰まる） | 低（MD追記のみ） | High |
| #10 ツール数不整合 | 中（開発者の混乱） | 低（MD更新のみ） | Medium |
