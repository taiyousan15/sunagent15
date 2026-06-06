# TAISUN Agent インストールガイド

> **対応OS**: macOS (Air / Pro) | Windows 10/11 | Linux (Ubuntu 22.04+ / Debian 12+)

---

## 必要なもの（共通）

| 要件 | バージョン | 入手先 |
|------|-----------|--------|
| Node.js | 20 以上（推奨） | https://nodejs.org/ |
| Git | 2.x 以上 | https://git-scm.com/ |
| Claude Code | 最新 | https://claude.ai/download |
| Python | 3.x 以上（推奨） | https://www.python.org/ |

---

## Mac（Air / Pro）

### クイックインストール（推奨: SHA256検証付き）

```bash
curl -fsSL https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install-release.sh | bash
```

> `install-release.sh` を通常導入の既定手順にしてください。`install.sh` の curl|bash は未検証の開発向け経路です。

### 手動インストール / 開発向け

```bash
# 1. リポジトリをクローン
git clone https://github.com/taiyousan15/sunagent15.git
cd sunagent15

# 2. インストール実行（全自動）
bash scripts/install.sh
```

### .env を設定

```bash
# .env をテキストエディタで開く
open -a TextEdit .env

# ANTHROPIC_API_KEY を設定（必須）
ANTHROPIC_API_KEY=sk-ant-...

# intelligence-research スキル用（任意）
FRED_API_KEY=your_key
NEWSAPI_KEY=your_key
APIFY_TOKEN=your_key
```

### アップデート

```bash
git pull origin main
bash scripts/install.sh
```

### メモリ最適化（推奨）

```bash
# Node.js ヒープサイズ増加（長時間セッション向け）
echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.zshrc
source ~/.zshrc
```

### トラブルシューティング（Mac）

| エラー | 対処 |
|--------|------|
| `command not found: node` | https://nodejs.org/ からインストール |
| `permission denied` | `chmod +x scripts/install.sh` を実行 |
| `node: bad option` | Node.js 18 以上にアップグレード |
| ビルドエラー | `rm -rf node_modules dist && npm install` |

---

## Linux (Ubuntu 22.04+ / Debian 12+)

### クイックインストール（推奨: SHA256検証付き）

```bash
curl -fsSL https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install-release.sh | bash
```

> `install-release.sh` を通常導入の既定手順にしてください。`install.sh` の curl|bash は未検証の開発向け経路です。

### 手動インストール / 開発向け

```bash
# 1. 必要パッケージの確認
sudo apt update && sudo apt install -y git curl build-essential

# 2. Node.js 20 以上（nvm 推奨）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20

# 3. リポジトリをクローン
git clone https://github.com/taiyousan15/sunagent15.git
cd sunagent15

# 4. インストール実行
bash scripts/install.sh
```

### トラブルシューティング

| 症状 | 対処 |
|------|------|
| `EACCES` 権限エラー | `nvm` 経由でNode.jsをインストール（`sudo npm` は使わない） |
| Playwright ブラウザ不足 | `npx playwright install --with-deps chromium` |
| `build-essential` 未インストール | `sudo apt install build-essential` |

### 環境変数の設定

```bash
# .env ファイルを作成
cp .env.example .env

# エディタで編集（nano, vim, etc.）
nano .env

# 最低限 ANTHROPIC_API_KEY を設定
# ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx
```

---

## Windows 10/11

### 事前準備

PowerShell でスクリプトの実行を許可する（初回のみ）:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### クイックインストール（1 コマンド・どのシェルでも動作）

PowerShell / cmd.exe / Git Bash / Claude Code 内 bash のすべてで動きます:

```
# 1. リポジトリをクローン
git clone https://github.com/taiyousan15/sunagent15.git
cd sunagent15

# 2. インストール実行（install.cmd は内部で PowerShell を起動します）
.\install.cmd
```

**Claude Code 内 bash から実行する場合**:

```bash
git clone https://github.com/taiyousan15/sunagent15.git
cd sunagent15
./install.cmd
```

**完全リモート 1 行（PowerShell ウィンドウから）**:

```powershell
irm https://raw.githubusercontent.com/taiyousan15/sunagent15/main/install.ps1 | iex
```

**プロファイル指定（オプション）**:

```
.\install.cmd -Profile minimal      # コアスキルのみ（約92個）
.\install.cmd -Profile standard     # 標準構成（約113個）[デフォルト]
.\install.cmd -Profile full         # 全スキル（約120個）
.\install.cmd -ListProfiles         # プロファイル一覧
```

> **対応引数**: `-Profile <name>`, `-Update`, `-Fresh`, `-Force`, `-ListProfiles`, `-AllowPartial`, `-SkipVerify`
> 複雑な引用符付き引数は cmd ラッパー経由では保証外です。その場合は `.\scripts\install.ps1` を直接呼んでください。

### .env を設定

```powershell
# メモ帳で .env を開く
notepad .env
```

`.env` に以下を設定:

```
# 必須
ANTHROPIC_API_KEY=sk-ant-...

# intelligence-research スキル用（任意）
FRED_API_KEY=your_key
NEWSAPI_KEY=your_key
APIFY_TOKEN=your_key
```

### アップデート（1 コマンド）

`update.cmd` は `git pull` → 失敗時 `git reset --hard` → 失敗時 ZIP フォールバックを自動で試します:

```
.\update.cmd                # 通常更新
.\update.cmd -Force         # ローカル変更を破棄して強制更新
```

Git Bash や Claude Code bash からも同じ:

```bash
./update.cmd
```

### Windows の注意点

| 項目 | Mac | Windows |
|------|-----|---------|
| スキル | シンボリックリンク（git pull で自動更新） | Junction（git pull で自動更新） |
| エージェント | シンボリックリンク（自動更新） | コピー（再インストールで更新） |
| chmod | 必要 | 不要 |

> **エージェントの更新について**: Windows では `git pull` 後に `.\update.cmd` を再実行することでエージェントが最新化されます。

> **古い別フォルダにインストール済みの場合**: install.cmd は古い Junction を自動検出して新フォルダに張り替えます（v2.53.4+）。

> **settings.json が壊れている場合**: install.cmd は BOM を自動除去し、JSON が壊れていればバックアップを作成して `{}` で初期化します（バックアップから手動復元可能）。

### トラブルシューティング（Windows）

| エラー | 対処 |
|--------|------|
| `スクリプトの実行が無効` | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` を実行 |
| `node が見つからない` | https://nodejs.org/ からインストール後、PowerShell を再起動 |
| `git が見つからない` | https://git-scm.com/ からインストール |
| Junction 作成失敗 | PowerShell を管理者として実行 |
| Claude Code 内 bash で `.scriptsinstall.ps1: command not found` | `./install.cmd` を使う（バックスラッシュ問題を回避） |
| 旧 `taisun_agent` フォルダのスキルが残る | `.\install.cmd` を再実行（Junction が自動で張り替わります） |
| `settings.json` パースエラー | `.\install.cmd` を再実行（BOM 除去・壊れた JSON は自動バックアップ）|

---

## インストール後の確認（共通）

Claude Code でこのディレクトリを開き、以下を試してください:

```
/intelligence-research   → AIニュース・経済指標収集
/research "テーマ"       → ディープリサーチ
/batch                   → 並列エージェント実行
```

---

## 環境変数一覧

### 自動設定される変数

| 変数名 | 設定タイミング | 用途 |
|--------|--------------|------|
| `TAISUN_AGENT_DIR` | install.sh / install.ps1 が自動設定 | sunagent15 をインストールしたフォルダの絶対パス。スキル・スクリプトが内部で参照（手動 export 不要）|
| `TAISUN_INSTALL_DIR` | one-liner installer で任意指定可 | clone 先パス（デフォルト: `~/.taisun-agent`）。`curl ... \| TAISUN_INSTALL_DIR=~/my-path bash` |

### ユーザーが設定する API キー

| 変数名 | 必須 | 用途 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | **必須** | Claude API（全機能の基本） |
| `FRED_API_KEY` | 推奨 | 経済指標（FRED 無料登録）|
| `NEWSAPI_KEY` | 推奨 | ニュース収集（newsapi.org 無料枠）|
| `APIFY_TOKEN` | 任意 | X/Twitter 収集 |
| `TAVILY_API_KEY` | 任意 | Web 検索 MCP |
| `OPENAI_API_KEY` | 任意 | gpt-researcher MCP |
| `GITHUB_TOKEN` | 任意 | GitHub MCP |

---

## サポート

- Issues: https://github.com/taiyousan15/sunagent15/issues
