# TAISUN v2

**Unified Development & Marketing Platform** - AIエージェント、MCPツール、マーケティングスキルを統合した次世代開発プラットフォーム

[![CI](https://github.com/san15/taisun_agent/actions/workflows/ci.yml/badge.svg)](https://github.com/san15/taisun_agent/actions/workflows/ci.yml)
[![Security Scan](https://github.com/san15/taisun_agent/actions/workflows/security.yml/badge.svg)](https://github.com/san15/taisun_agent/actions/workflows/security.yml)
[![Node.js](https://img.shields.io/badge/Node.js-18.x%20%7C%2020.x-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-775%20passing-brightgreen)](https://github.com/san15/taisun_agent/actions)
[![Research Sources](https://img.shields.io/badge/Research%20Sources-133-blueviolet)](https://github.com/san15/taisun_agent/blob/main/.claude/skills/world-research/SKILL.md)

> **TAISUN v2 は Claude Code の拡張パックです。**
> インストールするだけで 101スキル・96エージェント・190+コマンド が使えるようになります。

---

## 📋 最新バージョン

**v2.28.0** (2026-03-02) — インストール・アップデート大幅改善

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v2.28.0 | 2026-03-02 | install/update 全面改善 — 全スキルsymlink化・MCP自動ビルド・絶対パス除去・agent-memory/praetorian をgitignore |
| v2.27.0 | 2026-02-28 | スラッシュコマンド 110→190+に拡充 / サブエージェント永続メモリ実装 / task-overflow-guard追加 |
| v2.26.0 | 2026-02-27 | プランモード自動起動防止ルール追加 (`no-plan-mode.md`) |
| v2.25.0 | 2026-02-22 | Hook Advisory-only化 + AGENTS.md 自己改善ループ |

→ 全バージョン履歴: [CHANGELOG.md](CHANGELOG.md)

---

## 🚀 インストール（5分）

> **全ての操作は Claude Code のチャットにコピペするだけ！ターミナル操作は不要です。**

### 🍎 Mac

**1. インストール（初回のみ）**

```
以下のコマンドを順番に実行して：
cd ~
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent
./scripts/install.sh
```

**完了の目安**: `Skills available: 100+` と `Agents available: 90+` が表示されれば成功

**2. プロジェクトで使えるようにする**

使いたいプロジェクトフォルダで Claude Code を開き：

```
以下のコマンドを実行して：
ln -s ~/taisun_agent/.claude .claude && ln -s ~/taisun_agent/.mcp.json .mcp.json && echo "✅ 完了"
```

> スキル・エージェントは `~/.claude/skills/` と `~/.claude/agents/` にシンボリックリンクで追加されます。
> `git pull` 後にスキルが自動反映されるため、再インストール不要です。

**3. アップデート**

```
以下のコマンドを実行して：
cd ~/taisun_agent && git pull origin main && ./scripts/update.sh
```

---

### 🪟 Windows

**1. インストール（初回のみ）**

```
以下のコマンドを順番に実行して：
cd ~
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent
npm run taisun:setup
```

**2. プロジェクトで使えるようにする**

**方法A（推奨）: 開発者モードON後**
- 設定 → 更新とセキュリティ → 開発者向け → **開発者モード ON**

```
export MSYS=winsymlinks:nativestrict && ln -s ~/taisun_agent/.claude .claude && ln -s ~/taisun_agent/.mcp.json .mcp.json && echo "✅ 完了"
```

**方法B: 管理者コマンドプロンプトで実行**

```cmd
mklink /D .claude C:\Users\YourName\taisun_agent\.claude
mklink .mcp.json C:\Users\YourName\taisun_agent\.mcp.json
```

**方法C: フォルダをコピー（最も確実）**

```
cp -r ~/taisun_agent/.claude .claude && cp ~/taisun_agent/.mcp.json .mcp.json && echo "✅ 完了"
```

> 注意: 方法Cはアップデート時に再コピーが必要です

**3. アップデート**

```powershell
cd $HOME\taisun_agent; git pull origin main; bash scripts/update.sh
```

---

## ✅ 動作確認

```
npm run taisun:diagnose
```

**98点以上で全機能正常動作**

| 項目 | 配点 |
|------|------|
| 13層防御Hookシステム | 30点 |
| MCPサーバー接続 | 25点 |
| スキル定義検証（101個） | 20点 |
| エージェント定義（96個） | 15点 |
| ビルド状態 | 10点 |

---

## 🎯 使い方

インストール後は **日本語で話しかけるだけ** で全機能が使えます：

```
セールスレターを書いて
LP分析して
YouTubeサムネイルを作って
要件定義を作って
市場リサーチして
```

---

## 📦 含まれる機能

| カテゴリ | 数 | 例 |
|---------|----|----|
| スキル | 101個 | mega-research, taiyo-style-lp, sdd-full, world-research |
| エージェント | 96個 | planner, code-reviewer, security-reviewer, tdd-guide |
| コマンド | 190+個 | /learn, /research, /sdd-full, /summarize, /-*, /-* |
| Hookシステム | 14層 | 危険コマンド防止・セッション継続・自動バックアップ・タスク結果オーバーフロー防止 |
| MCPサーバー | 15+ | playwright, pexels, claude-historian, praetorian |
| 永続メモリ | 6エージェント | ait42-coordinator, code-reviewer, planner, security-auditor 等 |

### 主要スキル一覧

| スキル | コマンド | 説明 |
|--------|---------|------|
| **mega-research** | `/mega-research` | 6API統合の最強リサーチ |
| **world-research** | `/world-research` | 6層133ソース総合リサーチ（論文/SNS/コミュニティ） |
| **taiyo-style-lp** | `/taiyo-style-lp` | 太陽スタイルのLP自動生成（成約率4.3倍実績） |
| **sdd-full** | `/sdd-full` | 要件定義→設計→タスク分解を一括生成 |
| **video-agent** | `/video-agent` | 動画制作パイプライン全体 |
| **nanobanana-pro** | `/nanobanana-pro` | AI画像生成（無料・Gemini） |
| **shorts-create** | `/shorts-create` | Shorts/Reels動画自動生成 |
| **url-all** | `/url-all` | URL完全分析（構造・コンテンツ・SEO） |

---

## 🌐 グローバルスキル（どのプロジェクトでも使用可能）

`npm run taisun:setup` 実行時に、以下のスキルが `~/.claude/skills/` に自動インストールされます。
**taisun_agentをリンクしていないプロジェクトでも**使用可能です。

| スキル | コマンド | 説明 |
|--------|---------|------|
| **sdd-req100** | `/sdd-req100` | 100点満点の要件定義（EARS準拠） |
| **sdd-full** | `/sdd-full` | SDD全成果物を一括生成 |
| **research** | `/research` | ワンコマンド調査 |
| **world-research** | `/world-research` | 6層133ソース総合リサーチ |
| **nanobanana-pro** | `/nanobanana-pro` | AI画像生成（無料） |
| **agentic-vision** | `/agentic-vision` | 画像・動画分析（Gemini） |

---

## ❓ よくある質問

| 状況 | 解決方法 |
|------|---------|
| `「already exists」エラー` | 正常です！アップデートコマンドを実行してください |
| `「command not found: claude」` | まずClaude Code CLIをインストール: https://claude.ai/code |
| スキルが使えない | `このフォルダでtaisun_agentを使えるようにして` とClaude Codeに伝える |
| `「heap out of memory」` | `メモリ設定を最適化して` とClaude Codeに伝える |
| ビルドエラー | `npm run taisun:setup` を再実行 |
| Windowsでシンボリックリンク失敗 | 開発者モードを有効化するか、方法B（管理者）または方法C（コピー）を試す |
| `Invalid API key` エラー | [docs/API_KEY_TROUBLESHOOTING.md](docs/API_KEY_TROUBLESHOOTING.md) を参照 |

詳細: [INSTALL.md](INSTALL.md) | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 🔌 上級者向け: Plugin形式

Claude Code v2.1.0以降（Mac / Windows 共通）：

```bash
/plugin marketplace add san15/taisun_agent
/plugin install taisun-agent@taisun-agent
```

アップデート: `/plugin update taisun-agent`

---

## TAISUNでできないこと（限界）

- 単独では動作しない（Claude Code必須）
- 24時間自律稼働（人間の監視が必要）
- 100%正確な情報（ハルシネーションの可能性あり）
- 専門資格が必要な判断（医療診断、法的助言等）

---

## 📚 ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [CHANGELOG.md](CHANGELOG.md) | 全バージョン更新履歴 |
| [INSTALL.md](INSTALL.md) | 詳細インストールガイド |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | システムアーキテクチャ |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | トラブルシューティング |
| [docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md) | Windows専用セットアップ |
| [TAISUN_GUIDE.md](TAISUN_GUIDE.md) | システム解説・プレゼン資料 |
