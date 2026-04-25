# TAISUN Agent Plugin

Claude Code Plugin marketplace形式での配布設定。

## インストール方法

### 方法1: Pluginコマンド（推奨）

Claude Codeで以下を実行：

```bash
/plugin marketplace add san15/taisun_agent
/plugin install taisun-agent@taisun-agent
```

### 方法2: settings.jsonに追加

`~/.claude/settings.json`に以下を追加：

```json
{
  "extraKnownMarketplaces": {
    "taisun-agent": {
      "source": {
        "source": "github",
        "repo": "san15/taisun_agent"
      }
    }
  },
  "enabledPlugins": {
    "taisun-agent@taisun-agent": true
  }
}
```

## アップデート

```bash
/plugin update taisun-agent
```

## 含まれるコンポーネント

- **67 Skills**: マーケティング・コピーライティング・動画制作
- **Claude Code subagents 活用**: 開発・品質管理・運用（`.claude/agent-source/` に 95 個のテンプレート定義を同梱）
- **26 MCP servers**: 外部サービス連携
- **14 層防御システム**: AIの暴走防止（概念カテゴリ数。実 hook ファイルは `.claude/hooks/` に 62 個）

## 要件

- Claude Code v2.1.0以降

## 注意事項

- Rulesはプラグイン配布の制限により、手動インストールが必要な場合があります
- MCPサーバーのAPIキーは別途設定が必要です
