# TAISUN v2

**Unified Development & Marketing Platform** - AIエージェント、MCPツール、マーケティングスキルを統合した次世代開発プラットフォーム

[![CI](https://github.com/san15/taisun_agent/actions/workflows/ci.yml/badge.svg)](https://github.com/san15/taisun_agent/actions/workflows/ci.yml)
[![Security Scan](https://github.com/san15/taisun_agent/actions/workflows/security.yml/badge.svg)](https://github.com/san15/taisun_agent/actions/workflows/security.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20.x%20%7C%2022.x-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-81%20passing-brightgreen)](https://github.com/san15/taisun_agent/actions)
[![Research Sources](https://img.shields.io/badge/Research%20Sources-133-blueviolet)](https://github.com/san15/taisun_agent/blob/main/.claude/skills/world-research/SKILL.md)

> **TAISUN v2 は Claude Code の拡張パックです。**
> インストールするだけで 101スキル・96エージェント・190+コマンド が使えるようになります。

---

## 📋 最新バージョン

**v2.40.0** (2026-03-14) — バリデーション8層化・BUG-001〜008全修正・kuromoji日本語解析・LLM Judge追加

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v2.40.0 | 2026-03-14 | バリデーション8層化 — kuromoji日本語形態素解析・LLM Judge（Claude Haiku審判）追加 / BUG-001〜008全修正（ゼロ除算・数値正規化・ラウンド表記・completeness検出強化）/ MAX_SENTENCES=50でO(N²)爆発防止 |
| v2.39.0 | 2026-03-14 | 7層バリデーションパイプライン実装（Constitutional AI + Self-Contrast + CoVe + Faithfulness + DeepEval + Reflexion）/ エンタープライズ規模テスト81件追加 |
| v2.38.0 | 2026-03-13 | Stagehand/Skyvern MCP追加でAIブラウザ自動操作を強化 |
| v2.37.0 | 2026-03-12 | Firecrawl MCP統合 — スクレイピング・クロール・サイト構造分析 |
| v2.36.1 | 2026-03-08 | `tsconfig.json` バグ修正（`src/lib`除外を削除・`noImplicitAny: true`）/ CI カバレッジ閾値70→80%・Trivy@0.29.0固定・gitleaksシークレットスキャン追加 / `cd.yml`をGitHub Releases配布ワークフローに全面書き換え（tar.gz+zip+SHA256チェックサム自動生成） |
| v2.35.0 | 2026-03-06 | Windows 10/11 用 PowerShell インストールスクリプト (`scripts/install.ps1`) 新規追加・INSTALL.md を Mac/Windows 分離の手順に全面書き直し |
| v2.34.0 | 2026-03-06 | `intelligence-research` スキルを taisun_agent に移植（31ソース並列収集）+ SKILL.md をシンボリックリンク自動検出でポータブル化 |
| v2.33.0 | 2026-03-06 | `/research-system` スキル追加 — BUILD_TARGETを引数で渡すとキーワード展開→ディープリサーチ2回→アーキテクチャ設計→12セクションレポートまで自動実行（YAML定義でコンテキスト52%削減） |
| v2.32.1 | 2026-03-06 | スキル・MCP設定の絶対パスをポータブルパスに修正 |
| v2.32.0 | 2026-03-06 | グローバルスキル3件をリポジトリに追加 — スタンドアロン化完了（deep-research-grok / intelligence-research / omega-research） |
| v2.31.0 | 2026-03-04 | SDD 13スキルをOllamaローカルモデルに最適化（deepseek-r1:70b + qwen2.5:72b）+ setup-sdd.sh追加（3プラン選択式セットアップ） |
| v2.30.0 | 2026-03-02 | install/update のagentリンクバグ修正 — git pull後も全96エージェントが~/.claude/agents/に確実に反映されるよう修正 |
| v2.29.0 | 2026-03-02 | OpenRouter/Groq経由 LiteLLMセットアップ追加 — claude-lite コマンドでClaude料金を1/3〜1/10に削減 |
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

> **別フォルダにインストールしたい場合**（例: `/opt/taisun_agent` や `~/dev/taisun_agent`）
>
> ```
> 以下のコマンドを順番に実行して（パスは好みの場所に変更してOK）：
> git clone https://github.com/san15/taisun_agent.git ~/dev/taisun_agent
> cd ~/dev/taisun_agent
> TAISUN_HOME=~/dev/taisun_agent ./scripts/install.sh
> ```
>
> スキル・エージェントは `~/.claude/` にシンボリックリンクされるので、
> インストール先フォルダが変わっても Claude Code からは同じように使えます。

**2. プロジェクトで使えるようにする（自動）**

`install.sh` 実行時に **MCPはグローバル登録済み** のため、どのプロジェクトでもそのまま使えます。

> スキル・エージェントは `~/.claude/skills/` と `~/.claude/agents/` に登録済み。
> MCPは `~/.claude/settings.json` にグローバル登録済み。
> 追加のコマンド入力は不要です。

**（オプション）プロジェクトに .mcp.json を追加したい場合**

```
以下のコマンドを実行して（~/taisun_agent は自分のインストール先に変更）：
ln -sf ~/taisun_agent/.mcp.json .mcp.json && echo "✅ 完了"
```

**3. アップデート**

以下のコマンドを実行して（新しいエージェント・スキルも自動反映）：

```
cd ~/taisun_agent && git pull origin main && ./scripts/update.sh
```

---

### 🪟 Windows

> PowerShell を開いて実行してください。

**0. 事前準備（初回のみ）**

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**1. インストール（初回のみ）**

```powershell
cd $HOME
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent
.\scripts\install.ps1
```

**完了の目安**: `Skills available: 100+` と `Agents available: 90+` が表示されれば成功

**2. .env を設定**

```powershell
notepad .env
```

`ANTHROPIC_API_KEY=sk-ant-...` を設定して保存

**3. プロジェクトで使えるようにする（自動）**

`install.ps1` 実行時に **MCPはグローバル登録済み** のため、どのプロジェクトでもそのまま使えます。

> スキル・エージェントは `~\.claude\skills\` と `~\.claude\agents\` に登録済み。
> MCPは `~\.claude\settings.json` にグローバル登録済み。
> 追加のコマンド入力は不要です。

**（オプション）プロジェクトに .mcp.json を追加したい場合**

```powershell
Copy-Item "$HOME\taisun_agent\.mcp.json" .mcp.json
```

**4. アップデート**

```powershell
cd $HOME\taisun_agent
git pull origin main
.\scripts\install.ps1
```

> スキルは Junction リンク（git pull で自動更新）、エージェントはコピー（再インストールで更新）。

---

## 🤖 SDD スキル最適化セットアップ（NEW v2.31.0）

SDD（Software Design Document）スキル13本を環境に合わせた最適なモデルで動作させるセットアップです。

### 3パターンから選べます

| # | プラン | モデル | 対象 |
|---|--------|--------|------|
| 1 | Claude MAX/Pro | claude-opus / claude-sonnet | MAX $200プラン加入済みの方 |
| 2 | **Ollama ローカル（推奨）** | deepseek-r1:70b / qwen2.5:72b | M1/M2/M3/M4 Mac（32GB以上） |
| 3 | OpenRouter 格安API | deepseek-chat | どのマシンでも |

### セットアップ（Claude Code のチャットに貼り付けて実行）

```
以下を実行して（対話式でプランを選べます）：
bash ~/taisun_agent/scripts/setup-sdd.sh
```

完了したら：

```
以下を実行して：
source ~/.zshrc
```

### SDD スキル（13本）の使い方

```
/sdd-full <spec-slug>        ← 要件定義〜設計まで一括実行（最もよく使う）
/sdd-req100 <spec-slug>      ← EARS準拠 要件定義書作成
/sdd-design <spec-slug>      ← アーキテクチャ設計書作成
/sdd-adr <title> <spec-slug> ← 技術決定記録（ADR）作成
/sdd-context <spec-slug>     ← ビジネスコンテキスト整合（Amazon PR-FAQ）
/sdd-tasks <spec-slug>       ← 実装タスク分解
/sdd-slo <spec-slug>         ← SLO/SLA定義
/sdd-threat <spec-slug>      ← STRIDE脅威分析
/sdd-guardrails <spec-slug>  ← セキュリティガードレール
/sdd-runbook <spec-slug>     ← 運用Runbook作成
```

> **Ollamaモデルを使う場合**: 事前に `ollama pull deepseek-r1:70b` と `ollama pull qwen2.5:72b-instruct-q8_0` が必要です（setup-sdd.sh が自動的に案内します）

---

## 💰 オプション：格安モデルで使う（OpenRouter / Groq）

通常の Claude Code は Anthropic に直接課金されますが、**OpenRouter経由にすると料金が1/3〜1/10**になります。

### APIキーを取得する（2つ）

| サービス | 料金 | 取得先 |
|---------|------|--------|
| OpenRouter | 有料（安い） | https://openrouter.ai/keys |
| Groq | **無料枠あり** | https://console.groq.com/keys |

### セットアップ（Claude Code のチャットに貼り付けて実行）

```
以下を実行して（キーを自分のものに置き換えて）：
OPENROUTER_API_KEY="sk-or-ここにキー" GROQ_API_KEY="gsk_ここにキー" bash ~/taisun_agent/scripts/setup-litellm.sh
```

完了したら：

```
以下を実行して：
source ~/.zshrc
```

### 使い方

```
claude-lite      ← 安いモデル経由でClaude Codeを起動（これだけでOK）
litellm-stop     ← 止める
litellm-health   ← 起動状態を確認
```

> **Groqだけ使いたい場合**（完全無料）: `GROQ_API_KEY="gsk_ここにキー" bash ~/taisun_agent/scripts/setup-litellm.sh`

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
