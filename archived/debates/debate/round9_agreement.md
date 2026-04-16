# Round 9 Agreement Check

## 問題#9: INSTALL.md Linux対応欠如

| 論点 | Status | 確定内容 |
|------|--------|---------|
| 問題の存在 | AGREE ✅ | Linux記載が完全に欠如。cd.ymlリリースノートとも矛盾 |
| INSTALL.md Linuxセクション追加 | AGREE ✅ | Ubuntu 22.04/Debian 12推奨と明記、distro差異もトラブルシューティングに追記 |
| 対応OS行更新 | AGREE ✅ | `macOS (Air / Pro) \| Windows 10/11 \| Linux (Ubuntu 22.04 / Debian 12)` |
| install.sh Linux分岐 | AGREE ✅ | Codex修正版（SHELL_RC検出）を採用 |
| メモリ最適化のSHELL_RC対応 | AGREE ✅ | `~/.bashrc` ハードコードではなく `${SHELL_RC:-$HOME/.bashrc}` を使用 |

### INSTALL.md 確定追加内容（Windowsセクション後）

```markdown
---

## Linux (Ubuntu 22.04 / Debian 12 推奨)

> **注意**: Linux サポートはコミュニティベースです。動作確認は Ubuntu 22.04 LTS で行っています。
> Arch Linux / Fedora / CentOS は依存パッケージが異なる場合があります。

### クイックインストール

```bash
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent
bash scripts/install.sh
```

### Node.js のインストール（未インストールの場合）

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # または新しいターミナルを開く
nvm install 20
nvm use 20
```

### .env を設定

```bash
nano .env   # または vim .env
ANTHROPIC_API_KEY=sk-ant-...
```

### メモリ最適化（推奨）

```bash
# 使用中のシェルに応じて ~/.bashrc または ~/.zshrc に追記
echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.bashrc
source ~/.bashrc
```

### トラブルシューティング（Linux）

| エラー | 対処 |
|--------|------|
| `command not found: node` | nvm 経由でインストール（上記参照） |
| `permission denied` | `chmod +x scripts/install.sh` を実行 |
| `EACCES: permission denied, mkdir` | `sudo chown -R $USER ~/.npm` を実行 |
| `nvm: command not found` | `source ~/.bashrc` を実行または新ターミナルを開く |
| シンボリックリンク作成失敗 | `ls -la ~/.claude/skills/` で確認後、手動で `ln -s` |
| Arch Linux / Fedora | 依存パッケージが異なる場合あり。Issue報告歓迎 |
```

### scripts/install.sh 追加（行37の `fi` 直後）

```bash
elif [[ "$OSTYPE" == "linux"* ]]; then
    # Linux: シェル設定ファイルの特定
    if [[ -f "$HOME/.bashrc" ]]; then
        SHELL_RC="$HOME/.bashrc"
    elif [[ -f "$HOME/.zshrc" ]]; then
        SHELL_RC="$HOME/.zshrc"
    else
        SHELL_RC="$HOME/.profile"
    fi
    info "シェル設定ファイル: ${SHELL_RC}"
fi
```

---

## 問題#10: ドキュメント「5ツール」vs 実態「13ツール」

| 論点 | Status | 確定内容 |
|------|--------|---------|
| 問題の存在 | AGREE ✅ | 8ツールの乖離を確認（validation系8本が未記載） |
| Option A（ドキュメント更新） | AGREE ✅ | 20_PROXY_MCP_MVP.md を13ツール表記に更新 |
| テストで同期保証 | AGREE ✅ | `TOOLS.length === 13` のユニットテスト追加 |

### docs/third-agent/20_PROXY_MCP_MVP.md 確定変更

行15を更新:
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

### テスト追加

`tests/unit/proxy-mcp/server.test.ts` に追加:
```typescript
import { TOOLS } from '../../../src/proxy-mcp/server';
describe('Proxy MCP tool registry', () => {
  it('TOOLS count matches documentation (20_PROXY_MCP_MVP.md)', () => {
    expect(TOOLS.length).toBe(13);
  });
});
```
