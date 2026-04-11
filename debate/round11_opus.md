# Round 11: ユーザー体験 — Opus Analysis
## 観点: 新規ユーザーがインストール→初回使用で躓くポイント

---

## 確認した事実

### インストールフロー（実ファイルから再構成）

**README.md（Mac向け、行67-88）:**
1. `cd ~`
2. `git clone https://github.com/san15/taisun_agent.git`
3. `cd taisun_agent`
4. `bash scripts/install.sh`
5. 完了の目安: `スキル: 63 個が利用可能です` が表示されれば成功

**INSTALL.md（詳細版）:**
- 行31-44: `.env` を `open -a TextEdit .env` で開いて `ANTHROPIC_API_KEY` を設定
- 行142-149: インストール後確認コマンド（`/intelligence-research` 等）

**README.md（行14）:**
> インストールするだけで 63スキル・95エージェント・110+コマンド が使えます

---

## 躓きポイント一覧（観察ベース）

### 躓き1: .env の設定タイミングと場所が不明確

**問題:**
- README.md のインストール手順（行67-88）には `.env` 設定の手順がない
- INSTALL.md には `.env` 設定が記載されているが、README.md を見てインストールしたユーザーはこれを見ない
- `install.sh` 実行後に `.env` がないとどうなるかの説明もない

**実際の流れ:**
1. ユーザーが README.md の手順で `bash scripts/install.sh` を実行
2. `スキル: 63 個が利用可能です` と表示される
3. Claude Code で `/intelligence-research` を試みる
4. `ANTHROPIC_API_KEY` が未設定でエラー（ただし Claude Code 自体は Anthropic API を使っているので混乱する）

**修正案:**
README.md の Mac インストール手順に `.env` 設定ステップを追加:
```
**インストール（初回のみ）**

1. 以下のコマンドを順番に実行して：
   cd ~
   git clone https://github.com/san15/taisun_agent.git
   cd taisun_agent
   bash scripts/install.sh

2. .env を設定（必須）：
   open -a TextEdit .env
   → ANTHROPIC_API_KEY=sk-ant-... を設定して保存
```

---

### 躓き2: 「63スキル」という完了の目安と実際の数の乖離

**問題:**
- README.md 行80: `スキル: 63 個が利用可能です`
- README.md 行14: `63スキル・95エージェント・110+コマンド`
- 実際の `.claude/skills/` ディレクトリには 65 エントリ（ls で確認、`_archived`, `_guides`, `data` 除く）
- CHANGELOG.md v2.53.0 行にも「スキル数」の記述が散在

インストール完了メッセージが 63 個と表示されるが、実際の期待値と異なると
「インストールが正しく完了したか」の判断ができない。

**修正案:**
install.sh 最終ステップに動的カウントを表示（ハードコードの 63 ではなく実数を表示）:
```bash
SKILL_COUNT=$(ls -d "$TARGET_SKILLS"/*/ 2>/dev/null | wc -l | tr -d ' ')
echo "スキル: ${SKILL_COUNT} 個が利用可能です"
```

---

### 躓き3: 初回使用コマンドが高難易度

**問題:**
INSTALL.md 行142-149 の「インストール後の確認」:
```
/intelligence-research   → AIニュース・経済指標収集
/research "テーマ"       → ディープリサーチ
/batch                   → 並列エージェント実行
```

これらは全て「動作確認」として紹介されているが:
- `intelligence-research` は複数のAPIキー（NEWS_API_KEY 等）がないと一部機能しない
- `/research` は heavy なスキル（effort: high）
- `/batch` は並列エージェントで初回実行には重い

**初回ユーザーに向けた「最小確認コマンド」がない。**

**修正案:**
INSTALL.md に「最初の1コマンド」セクションを追加:
```markdown
## 動作確認（最初の1コマンド）

Claude Code でこのフォルダを開いたら、まずこれを試してください:

```
/mega-research "Claude Code とは"
```

数秒でリサーチ結果が返れば成功です。APIキー追加後は より多くのスキルが使えます。
```

---

### 躓き4: Claude Code を「このディレクトリ」で開く手順の欠如

**問題:**
INSTALL.md 行142: `Claude Code でこのディレクトリを開き、以下を試してください`

しかし「このディレクトリを Claude Code で開く」方法の説明がない。
新規ユーザーにとって:
- Mac: `claude` コマンドで開くのか、GUI で開くのか不明
- Windows: 同様

**修正案:**
INSTALL.md に追記:
```markdown
### Claude Code でフォルダを開く方法

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
```

---

### 躓き5: .mcp.json が自動設定されるかどうか不明

**問題:**
README.md 行128: 「別のプロジェクトフォルダで使う」セクションで `setup-project.sh` を紹介。
しかし `taisun_agent` 自体のディレクトリで動かす場合、`.mcp.json` は既に存在するのかが不明。

install.sh を見ても `.mcp.json` の生成ステップが見当たらない（実態未確認）。

**修正案:**
INSTALL.md の「インストール後の確認」セクションに追記:
```markdown
> `.mcp.json` は install.sh 実行時に自動作成されます。
> 手動確認: `cat ~/taisun_agent/.mcp.json | head -5`
```

---

## 優先度マトリクス

| 躓きポイント | 発生頻度 | 影響度 | 修正コスト | 優先度 |
|------------|---------|--------|-----------|--------|
| 1. .env設定タイミング不明 | 高（ほぼ全員） | 高（機能しない） | 低（README.md追記） | Critical |
| 2. スキル数カウントの乖離 | 中 | 低（混乱のみ） | 低（install.sh動的化） | Low |
| 3. 初回コマンドが高難易度 | 高 | 中（失敗体験） | 低（INSTALL.md追記） | High |
| 4. Claude Code の開き方不明 | 中 | 高（詰まる） | 低（INSTALL.md追記） | High |
| 5. .mcp.json の自動設定可否 | 低（中級者の疑問） | 中 | 低（追記のみ） | Low |
