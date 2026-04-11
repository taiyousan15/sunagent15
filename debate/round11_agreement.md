# Round 11 Agreement Check

## ユーザー体験：確定修正一覧

| 躓きポイント | Status | 優先度 | 確定アクション |
|------------|--------|--------|--------------|
| 1. .env設定タイミング不明 | AGREE ✅ | Critical | README.mdに.env設定ステップ追加（Codex修正文言採用） |
| 2. スキル数カウント乖離 | AGREE ✅ | Low | install.sh動的化 + README.mdのハードコード削除 |
| 3. 初回コマンドが高難易度 | AGREE ✅ | High | /skill-validatorを初回確認コマンドとして追記 |
| 4. claude .の開き方不明 | AGREE ✅ | High | INSTALL.mdに`claude .`コマンド手順追加 |
| 5. ディレクトリ構造不透明（Codex新規） | AGREE ✅ | Medium | INSTALL.mdに「インストールで変更されるもの」セクション追加 |

---

## 修正1: README.md Mac手順への.env追記

**確定文言（Codex修正版）:**

```markdown
**インストール（初回のみ）**

1. 以下のコマンドを順番に実行して：
   cd ~
   git clone https://github.com/san15/taisun_agent.git
   cd taisun_agent
   bash scripts/install.sh

2. .env を設定（一部スキルで必要）：
   open -a TextEdit .env
   → 使いたいスキルに応じて必要なキーのみ設定（詳細は INSTALL.md 参照）
   → ANTHROPIC_API_KEY は Claude Code が既に管理しているため通常不要
```

---

## 修正2: README.md のスキル数ハードコード削除

**変更前（行14）:**
```markdown
> インストールするだけで 63スキル・95エージェント・110+コマンド が使えるようになります。
```

**変更後:**
```markdown
> インストールするだけで多数のスキル・エージェント・コマンドが使えるようになります。
> （正確なスキル数・エージェント数は `npm run taisun:version` で確認できます）
```

**install.sh 完了メッセージの動的化（対応行を特定後に修正）:**
```bash
SKILL_COUNT=$(ls -d "$TARGET_SKILLS"/*/ 2>/dev/null | wc -l | tr -d ' ')
echo "スキル: ${SKILL_COUNT} 個が利用可能です"
```

---

## 修正3: INSTALL.md への初回確認コマンド追加

**「インストール後の確認（共通）」セクション（行142）に差し替え:**

```markdown
## インストール後の確認（共通）

### Step 1: Claude Code を開く

**Mac/Linux:**
```bash
cd ~/taisun_agent
claude .
```

**Windows:**
```powershell
cd $HOME\taisun_agent
claude .
```

### Step 2: 動作確認（最初の1コマンド・APIキー不要）

Claude Code のチャットに入力:
```
/skill-validator
```
スキルの一覧と状態が表示されれば成功です。

### Step 3: APIキー設定後に使えるコマンド例

```
/intelligence-research   → AIニュース・経済指標収集（NEWS_API_KEY 等が必要）
/research "テーマ"       → ディープリサーチ（TAVILY_API_KEY 推奨）
/batch                   → 並列エージェント実行
```
```

---

## 修正4: INSTALL.md への「変更されるもの」セクション追加

**Windowsセクションの前（または「サポート」セクションの前）に追加:**

```markdown
## インストールで変更されるもの

| 場所 | 内容 |
|------|------|
| `~/.claude/skills/` | スキルへのシンボリックリンク（Windowsはjunction） |
| `~/.claude/agents/` | エージェントへのシンボリックリンク |
| `~/taisun_agent/` | リポジトリ本体（変更なし） |
| `~/taisun_agent/.env` | APIキー設定ファイル（手動設定が必要） |

> アンインストール: `rm -rf ~/.claude/skills ~/.claude/agents` で元に戻せます（Mac/Linux）
> Windows: `Remove-Item -Recurse $HOME\.claude\skills, $HOME\.claude\agents`
```

---

## ラウンド横断の気づき

Codexが正しくOpusを訂正した重要な点:
- ANTHROPIC_API_KEY はClaude Code自体が管理しており `.env` の設定は多くのスキルで不要
- `/mega-research` は初回確認コマンドとして重すぎる（`/skill-validator` が適切）
- スキル数のハードコードはリリースごとの更新漏れが生じる技術的負債
