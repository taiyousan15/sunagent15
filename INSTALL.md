# TAISUN Agent 2026 インストールガイド

## クイックインストール（5分）

```bash
# 1. リポジトリをクローン
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent

# 2. 依存関係をインストール
npm install

# 3. ビルド
npm run build:all

# 4. Hooksの実行権限を付与
chmod +x .claude/hooks/*.js 2>/dev/null || true

# 5. 動作確認
npm run taisun:diagnose
```

---

## 前提条件

| 要件 | バージョン | 確認コマンド |
|------|-----------|-------------|
| Node.js | 18.x 以上 | `node -v` |
| npm | 9.x 以上 | `npm -v` |
| Git | 2.x 以上 | `git --version` |
| Python | 3.10 以上（オプション） | `python3 --version` |

---

## 詳細インストール手順

### Step 1: リポジトリのクローン

```bash
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent
```

または SSH:
```bash
git clone git@github.com:san15/taisun_agent.git
```

### Step 2: 依存関係のインストール

```bash
npm install
```

Python依存（オプション）:
```bash
pip install -r requirements.txt 2>/dev/null || true
```

### Step 3: ビルド

```bash
npm run build:all
```

これにより以下がビルドされます:
- `dist/proxy-mcp/` - MCP Proxy サーバー
- `dist/scripts/` - CLIスクリプト

### Step 4: 実行権限の付与（Unix/Mac）

```bash
chmod +x .claude/hooks/*.js
chmod +x scripts/*.sh 2>/dev/null || true
```

Windowsの場合は不要です。

### Step 5: 診断の実行

```bash
npm run taisun:diagnose
```

以下が表示されれば成功:
```
総合スコア: 100/100点
すべてのシステムが正常に動作しています！
```

---

## Claude Code / Claude Desktopでの使用

### .mcp.json の確認

プロジェクトルートの `.mcp.json` が Claude Code に自動認識されます。

```json
{
  "mcpServers": {
    "taisun-proxy": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/proxy-mcp/server.js"]
    }
  }
}
```

### Claude Desktopの設定

`~/Library/Application Support/Claude/claude_desktop_config.json` に追加:

```json
{
  "mcpServers": {
    "taisun-proxy": {
      "command": "node",
      "args": ["/path/to/taisun_agent/dist/proxy-mcp/server.js"]
    }
  }
}
```

---

## アップデート

```bash
# 1. 最新を取得
git pull origin main

# 2. 依存関係を更新
npm install

# 3. 再ビルド
npm run build:all

# 4. 診断
npm run taisun:diagnose
```

---

## 環境変数（オプション）

`.env` ファイルを作成:

```bash
# MCP統合（オプション）
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
FIGMA_API_KEY=your_figma_key
PEXELS_API_KEY=your_pexels_key

# Supabase（オプション）
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# Qdrant（オプション）
QDRANT_URL=http://localhost:6333
```

---

## トラブルシューティング

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf node_modules dist
npm install
npm run build:all
```

### 権限エラー（Mac/Linux）

```bash
chmod +x .claude/hooks/*.js
```

### Node.jsバージョンエラー

```bash
# nvmを使用している場合
nvm install 20
nvm use 20
```

### 診断が失敗する

```bash
# 完全リセット
rm -f .workflow_state.json
rm -rf dist/
npm install
npm run build:all
npm run taisun:diagnose
```

---

## 次のステップ

1. [TAISUN_SETUP_PROMPTS.md](TAISUN_SETUP_PROMPTS.md) - 初期設定プロンプト
2. [README.md](README.md) - 詳細なドキュメント
3. [DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md) - 配布ガイド

---

## サポート

- Issues: https://github.com/san15/taisun_agent/issues
- Discussions: https://github.com/san15/taisun_agent/discussions
