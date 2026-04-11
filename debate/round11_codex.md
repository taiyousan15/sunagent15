# Round 11: ユーザー体験 — Codex Challenge

---

## 躓き1: .env 設定タイミング — AGREE（問題）、PARTIAL（修正案）

### 問題の確認: YES
README.md Mac 手順（行67-88）に `.env` 設定ステップなし。
INSTALL.md には記載あり（行31-44）だが、README だけ見るユーザーが存在する。

### Opus 修正案への異議

**Claude Code ユーザーは ANTHROPIC_API_KEY を既に持っている**

これが重要な前提。Claude Code 自体を使うためには Anthropic アカウントが必要であり、
Claude Code の設定に API キーが既に存在する。

しかし `.env` の `ANTHROPIC_API_KEY` が必要なのは `src/intelligence/index.ts` など
一部のスキルが **直接 Anthropic API を呼ぶ** ケースのみ。
Claude Code 経由でスキルを使う場合、Claude Code 自身が API 認証を行うため
`.env` の `ANTHROPIC_API_KEY` は不要な場合が多い。

**修正案の修正:**
README.md の追記文言を変更:

```markdown
2. .env を設定（intelligence-research スキル等で必要）：
   open -a TextEdit .env
   → 使いたいスキルに応じて必要なキーのみ設定（詳細は INSTALL.md 参照）
   → ANTHROPIC_API_KEY は Claude Code が既に管理しているため通常不要
```

---

## 躓き2: スキル数カウント — AGREE（問題）、AGREE（修正案に補足）

install.sh の動的カウント化に同意。
**追加指摘:** README.md 行14 の `63スキル・95エージェント` はハードコードされた数字。
これも install.sh の動的出力と連動させることはできないため、
リリースごとに更新が必要な技術的負債になっている。

**追加修正案:**
```markdown
> インストールするだけで多数のスキル・エージェント・コマンドが使えるようになります。
> （スキル数・エージェント数は `npm run taisun:version` で確認できます）
```
ハードコード数字をバージョンコマンドへの誘導に置き換える。

---

## 躓き3: 初回コマンドが高難易度 — AGREE（問題）、DISAGREE（修正案）

### Opus 修正案への異議

Opusが提案した初回コマンド: `/mega-research "Claude Code とは"`

問題:
- `mega-research` は `effort: high` スキルであり、初回確認には重すぎる
- `TAVILY_API_KEY` など検索系 API キーがないと一部機能が制限される
- 「数秒で結果が返る」は不正確（mega-research は数十秒〜数分かかる）

**代替案: APIキー不要で確実に動く確認コマンド**

`system_health` ツール（proxy-mcp の最初のツール、外部依存なし）か、
または最もシンプルなスキルを初回確認に使うべき。

```markdown
## 動作確認（最初の1コマンド）

Claude Code でこのフォルダを開いたら、まずこれを試してください:

```
/skill-validator
```

スキルの一覧と状態が表示されれば成功です。
APIキーを設定すると `/mega-research` や `/intelligence-research` も使えるようになります。
```

ただし `skill-validator` スキルが実際に存在するか要確認（ls で確認済み: 存在する）。

---

## 躓き4: Claude Code の開き方 — AGREE（問題）、AGREE（修正案）

Opus 案に完全同意。`claude .` コマンドを INSTALL.md に追記するのは必須。

**補足:** README.md 行62 にも以下の記述があるが曖昧:
> 「Claude Code のチャットにコピペするだけ！」

これは既に Claude Code が開いていることを前提としている。
新規ユーザーが「Claude Code を開く」ステップ自体を知らない場合がある。

---

## 躓き5（Codex 追加）: インストール後のディレクトリ構造が不透明

README.md・INSTALL.md ともに、インストール後に何がどこに作られるかの説明がない。

実際に作られる主要なもの:
- `~/.claude/skills/` — スキルのシンボリックリンク（または Junction）
- `~/.claude/agents/` — エージェントのシンボリックリンク
- `~/taisun_agent/.env` — 環境変数ファイル（.env.example からコピー）
- `~/taisun_agent/dist/` — ビルド成果物

ユーザーは「インストール後に自分の `~/.claude/` が変更される」ことを知らないと、
後から「なぜグローバルに影響があるのか」と混乱する。

**修正案:**
INSTALL.md に「インストールで変更されるもの」セクションを追加:
```markdown
## インストールで変更されるもの

| 場所 | 内容 |
|------|------|
| `~/.claude/skills/` | スキルへのシンボリックリンク（約63個） |
| `~/.claude/agents/` | エージェントへのシンボリックリンク（約95個） |
| `~/taisun_agent/` | リポジトリ本体（変更なし） |
| `~/taisun_agent/.env` | APIキー設定ファイル（手動設定が必要） |

> アンインストールは `rm -rf ~/.claude/skills ~/.claude/agents` で元に戻せます。
```

---

## 合意サマリー

| 躓きポイント | Opus | Codex | 最終判定 |
|------------|------|-------|---------|
| 1. .env設定タイミング | README.md に追記 | 追記内容の文言修正（APIキー不要の場合を明示） | PARTIAL → Codex修正版 |
| 2. スキル数カウント | 動的化 | 同意 + README.mdのハードコード削除も提案 | AGREE + 補足 |
| 3. 初回コマンド | /mega-research | /skill-validator（重すぎる問題） | Codex案を採用 |
| 4. claude . 手順 | INSTALL.md追記 | 完全同意 | AGREE ✅ |
| 5. ディレクトリ構造（Codex新規） | 未検討 | INSTALL.mdに「変更されるもの」セクション追加 | AGREE ✅ |
