# Round 9: 運用性 — Codex Challenge

---

## 問題#9: Linux対応欠如 — AGREE（問題）、PARTIAL（修正案）

### 問題の確認: YES
- INSTALL.md 行3: `macOS (Air / Pro) | Windows 10/11` のみ
- scripts/install.sh に `linux*` の OSTYPE 分岐なし（darwin のみ）
- cd.yml 行143 のリリースノートには `macOS / Linux` 向けとして `curl | bash` を提示
  — ドキュメントが「Linux非対応」なのにリリースノートは「Linux対応」と示す矛盾

### Opus修正案への異議

**異議1: install.sh の Linux 対応追加が最小限すぎる**

Opusの案:
```bash
elif [[ "$OSTYPE" == "linux"* ]]; then
    if ! command -v node &>/dev/null; then
        warn "Node.js が見つかりません"
        ...
    fi
fi
```

問題: Node.js チェックは install.sh の Step 1（行141-152）で既に実施されている。
Linux 分岐でやるべきは Node.js チェックではなく、Linux 固有の問題への対処:
- `apt` / `dnf` / `pacman` の存在チェック（パッケージマネージャ特定）
- `~/.bashrc` vs `~/.zshrc` の選択（Linux は bash がデフォルトの場合が多い）
- シンボリックリンク権限の確認（`/home/user/.claude/` への書き込み権限）

修正した Linux 分岐:
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

**異議2: INSTALL.md の Linux セクションに distro 限定を明示すべき**

Opusは「Ubuntu 22.04 / Debian 12 推奨」と書いているが、
CentOS / RHEL / Arch の場合は nvm のコマンドは同じでも
パッケージ名や systemd の設定が異なる可能性がある。

修正案: トラブルシューティング表に distro 差異を追記:
```markdown
| `nvm: command not found` 再ログイン後 | `source ~/.bashrc` を実行または新ターミナルを開く |
| Arch Linux / Fedora | `nvm` コマンドは同じだが、依存パッケージが異なる場合あり |
```

**異議3: メモリ最適化の `~/.bashrc` 追記が Linux 限定でない**

Opus は Linux セクションに `~/.bashrc` を使用しているが、
Mac セクションでは `~/.zshrc` を使用（行57: `echo ... >> ~/.zshrc`）。
Linux ユーザーが zsh を使っている場合、`~/.bashrc` は読み込まれない。

→ 上記の `SHELL_RC` 変数を利用する形にすべき:
```bash
echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.bashrc
# ↓ より正確
echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> "${SHELL_RC:-$HOME/.bashrc}"
```

---

## 問題#10: ドキュメント「5ツール」vs 実態「13ツール」— AGREE（問題）、AGREE（修正案）

### 問題の確認: YES
- 20_PROXY_MCP_MVP.md: `Public Tools (5 tools)` と明記
- server.ts の TOOLS 配列: 13エントリ確認済み（行48-281）
- 追加8ツールは全て validation 系（output_verify, rag_ground, cove_verify, reflexion_analyze,
  reflexion_round, validation_pipeline, prospective_check, constitutional_check）

### Opus Option A（ドキュメント更新）に合意するが、1点追加

ドキュメント更新に加えて、**server.ts にツール数アサーションを追加すること**を提案:

```typescript
// server.ts 末尾付近に追加
// ドキュメントとの整合性チェック（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  console.error(`[proxy-mcp] Registered tools: ${TOOLS.length}`);
  // docs/third-agent/20_PROXY_MCP_MVP.md のツール数と一致させること
}
```

または、より堅牢にするなら Jest テストで:
```typescript
// tests/unit/proxy-mcp/server.test.ts
import { TOOLS } from '../../../src/proxy-mcp/server';

describe('Proxy MCP tool registry', () => {
  it('should export TOOLS array', () => {
    expect(TOOLS.length).toBe(13); // ドキュメントと同期
  });
});
```

このテストが存在すると、ツールを追加/削除した際に必ず気づける。
テスト失敗 = ドキュメント更新の reminder として機能する。

---

## 合意サマリー

| 問題 | Status | 確定修正 |
|------|--------|---------|
| #9 Linux欠如（INSTALL.md） | AGREE ✅（問題）、PARTIAL（修正） | Opus案 + Codex SHELL_RC修正 + distro差異追記 |
| #9 Linux欠如（install.sh） | AGREE ✅ | SHELL_RC 検出分岐追加 |
| #10 ツール数不整合 | AGREE ✅ | ドキュメント更新（13ツール）+ テストで同期保証 |
