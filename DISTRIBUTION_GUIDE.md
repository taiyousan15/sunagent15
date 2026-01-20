# TAISUN Agent v2.5.1 - 配布ガイド

このドキュメントは、TAISUN Agent v2.5.1 を他の人に渡す時の手順書です。

---

## 📦 システム概要

| コンポーネント | 数 | 説明 |
|---------------|-----|------|
| **Agents** | 82 | AI専門エージェント |
| **Skills** | 70 | マーケティング・開発スキル |
| **Hooks** | 13 | 8層防御システム |
| **MCP Tools** | 227 | 自動化ツール |

---

## 🚀 インストール手順

### 新規インストール（5分）

```bash
# 1. リポジトリをクローン
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent

# 2. Node.js依存パッケージをインストール
npm install

# 3. Python依存パッケージをインストール（オプション）
pip install -r requirements.txt

# 4. フックスクリプトに実行権限を付与
chmod +x .claude/hooks/*.sh .claude/hooks/*.js
chmod +x scripts/*.sh

# 5. TypeScriptをビルド
npm run build:all

# 6. 動作確認
./scripts/test-agents.sh
```

### 既存環境のアップデート（2分）

```bash
# 1. 最新版を取得
cd taisun_agent
git pull origin main

# 2. 依存パッケージを更新
npm install
pip install -r requirements.txt 2>/dev/null || true

# 3. ビルド
npm run build:all

# 4. 動作確認
./scripts/test-agents.sh
```

---

## ✅ 動作確認

### 基本チェック（1分）

```bash
# バージョン確認
cat package.json | grep '"version"'
# → "version": "2.5.0" 以上ならOK

# Hook構文チェック
for f in .claude/hooks/*.js; do node --check "$f" && echo "OK: $(basename $f)"; done

# エージェント数確認
ls -1 .claude/agents/*.md | wc -l
# → 82 と表示されればOK
```

### 詳細テスト（3分）

```bash
# 全体テスト
./scripts/test-agents.sh

# 期待される結果:
# ✓ PASS: 13/13 hooks
# ✓ PASS: 82 agents
# ✓ PASS: 70 skills
# ✓ All tests passed!
```

---

## 🔧 環境変数設定（オプション）

外部MCPを使用する場合のみ設定してください。

```bash
# ~/.zshrc または ~/.bashrc に追加

# GitHub MCP（Issue/PR操作）
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
# 取得: https://github.com/settings/tokens

# Notion MCP（ドキュメント連携）
export NOTION_API_KEY="secret_xxxxxxxxxxxx"
# 取得: https://www.notion.so/my-integrations

# PostgreSQL MCP（データベース分析）
export POSTGRES_DSN="postgresql://user:pass@localhost:5432/db"
```

---

## 📂 重要ファイル一覧

### 設定ファイル

| ファイル | 説明 |
|----------|------|
| `.claude/settings.json` | Hook設定・8層防御 |
| `.claude/CLAUDE.md` | システム契約・ルール |
| `config/proxy-mcp/*.json` | MCP設定 |

### 実行ファイル

| ファイル | 説明 |
|----------|------|
| `.claude/hooks/*.js` | JavaScriptフック（13個） |
| `.claude/hooks/*.sh` | Bashフック（2個） |
| `scripts/test-agents.sh` | システムテスト |
| `scripts/audit-unused-resources.sh` | リソース監査 |

### ドキュメント

| ファイル | 説明 |
|----------|------|
| `CHANGELOG.md` | 変更履歴 |
| `DISTRIBUTION_GUIDE.md` | このファイル |
| `docs/WORKFLOW_PHASE3_QUICKSTART.md` | ワークフロー入門 |

---

## 🎯 使い方

### Claude Codeで使用

```bash
# プロジェクトディレクトリで起動
cd taisun_agent
claude

# 以下のコマンドが使えます:
# /agent-run      - エージェント実行
# /-status  - 状態確認
# /verify         - システム検証
```

### スキル呼び出し

```bash
# Claude Code内で
/copywriting-helper
/youtube-thumbnail
/security-scan
/taiyo-style-headline
```

### ワークフロー実行

```bash
npm run workflow:start <workflow_name>
npm run workflow:status
npm run workflow:next
```

---

## ❓ トラブルシューティング

### Q1: テストが失敗する

```bash
# 実行権限を付与
chmod +x .claude/hooks/*.sh .claude/hooks/*.js

# 再テスト
./scripts/test-agents.sh
```

### Q2: npm install でエラー

```bash
# キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q3: ビルドエラー

```bash
# TypeScript再インストール
npm install typescript --save-dev
npm run build:all
```

### Q4: MCP Proxyが "unhealthy"

```bash
# これは正常です（イベントがない状態）
# 何か操作すると "healthy" になります
```

---

## 📊 チェックリスト

### 配布前（送る側）

- [x] git push 完了
- [x] テスト通過（./scripts/test-agents.sh）
- [x] ドキュメント更新
- [x] バージョン番号正しい

### 受け取り後（受ける側）

- [ ] git clone / git pull 成功
- [ ] npm install 成功
- [ ] pip install 成功（オプション）
- [ ] chmod +x 実行
- [ ] npm run build:all 成功
- [ ] ./scripts/test-agents.sh 通過

---

## 📅 リリース情報

- **バージョン**: 2.5.1
- **リリース日**: 2026年1月18日
- **リポジトリ**: https://github.com/san15/taisun_agent

### 主な機能

- 82エージェント統合システム
- 8層防御システム
- 70スキル（マーケティング・開発）
- MCP統合（227ツール）
- Agent OS（Python版）

---

## 🆘 サポート

- **GitHub Issues**: バグ報告・機能要望
- **CLAUDE.md**: システムルール・契約

---

**配布準備完了！**
