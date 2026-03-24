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
> インストールするだけで 120+スキル・114エージェント・190+コマンド が使えるようになります。

---

## 📋 最新バージョン

**v2.44.0** (2026-03-25) — プロファイルインストール・Windows強化・CodeGraph統合・配布互換性修正

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v2.44.0 | 2026-03-25 | **プロファイルインストール**（minimal/standard/full）— install.sh + install.ps1 両対応 / **CodeGraph統合**（codebase-memory-mcp・自動インデックス・ROI計測）/ **配布互換性修正**（ハードコードパス5箇所→環境変数化）/ StopFailure自動記録Hook / effortフロントマター（コスト制御）/ MCP最適化（twitter-client・obsidian有効化、9個無効化）/ video-downloadスキル復活 / スキル114エージェント数更新 |
| v2.43.0 | 2026-03-18 | BUG-001/004/005/006/007 全解消 / スキル早見表4枚（リサーチTier・taiyo-style・LP・SDD）追加 / `taisun:version` `taisun:support` コマンド新設 / 承認モデル実装（投稿系=警告・課金系=ブロック）/ Ollamaランタイムガード / プロファイル整合性チェック / gem-research・unified-research 命名修正 / research-system v2.4（QA Gate・61件URL・外部ファイル不要） |
| v2.42.0 | 2026-03-17 | install.sh / update.sh / install.ps1 を全面日本語化（70歳でも使える初心者UX）/ フォルダ説明・エラー案内・完了後3ステップガイドを追加 / MCPプロファイル切替スキル（`/mcp-profile`）追加 / `npm run mcp:dev\|secure\|marketing\|status` コマンド追加 |
| v2.41.0 | 2026-03-17 | README に everything-claude-code インストール・アップデート手順セクション追加 / MCP 29→21個に整理（不要5サーバー削除）/ proxy-mcp resilience 強化（リトライ5回・エラークラス分類）|
| v2.40.0 | 2026-03-14 | バリデーション8層化 — kuromoji日本語形態素解析・LLM Judge（Claude Haiku審判）追加 / BUG-001〜008全修正（ゼロ除算・数値正規化・ラウンド表記・completeness検出強化）/ MAX_SENTENCES=50でO(N²)爆発防止 |
| v2.39.0 | 2026-03-14 | 7層バリデーションパイプライン実装（Constitutional AI + Self-Contrast + CoVe + Faithfulness + DeepEval + Reflexion）/ エンタープライズ規模テスト81件追加 |
| v2.38.0 | 2026-03-13 | Stagehand/Skyvern MCP追加でAIブラウザ自動操作を強化 |
| v2.37.0 | 2026-03-12 | Firecrawl MCP統合 — スクレイピング・クロール・サイト構造分析 |
| v2.36.1 | 2026-03-08 | `tsconfig.json` バグ修正（`src/lib`除外を削除・`noImplicitAny: true`）/ CI カバレッジ閾値70→80%（※`src/`ビルド対象のみ。フック46個・スキル130個・エージェント96個は対象外）・Trivy@0.29.0固定・gitleaksシークレットスキャン追加 / `cd.yml`をGitHub Releases配布ワークフローに全面書き換え（tar.gz+zip+SHA256チェックサム自動生成） |
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

> **Claude Code のチャットにコピペするだけ！** スキル・エージェント・MCPは全て自動でグローバル登録されます。
> インストール後はどのフォルダで Claude Code を開いても使えます。

### 🍎 Mac

**インストール（初回のみ）**

```
以下のコマンドを順番に実行して：
cd ~
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent
./scripts/install.sh
```

**完了の目安**: `スキル: 100+ 個が利用可能です` と `エージェント: 100+ 個が利用可能です` が表示されれば成功

**アップデート**

```
cd ~/taisun_agent && git pull origin main && ./scripts/update.sh
```

---

### 🪟 Windows

> PowerShell を開いて実行してください。

**事前準備（初回のみ）**

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**インストール（初回のみ）**

```powershell
cd $HOME
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent
.\scripts\install.ps1
```

**完了の目安**: `スキル: 100+ 個が利用可能です` と `エージェント: 100+ 個が利用可能です` が表示されれば成功

**アップデート**

```powershell
cd $HOME\taisun_agent
git pull origin main
.\scripts\install.ps1
```

> スキルは Junction リンク（git pull で自動更新）、エージェントはコピー（再インストールで更新）。

---

### 📂 別のプロジェクトフォルダで使う

taisun_agentの機能を他のプロジェクトでも使いたい場合、セットアップスクリプトを1行実行するだけです。
`.claude/` と `.mcp.json` がリンクされ、そのフォルダでClaude Codeを開くと全機能が使えます。

**Mac:**
```bash
cd /path/to/your/project
~/taisun_agent/scripts/setup-project.sh
```

**Windows:**
```powershell
cd C:\Users\you\Projects\MyProject
~\taisun_agent\scripts\setup-project.ps1
```

実行後の結果:
```
  ┌──────────────┬──────────────────────────────────────────┐
  │     項目     │                   状態                    │
  ├──────────────┼──────────────────────────────────────────┤
  │ .git         │ 初期化済み                                │
  │ .claude/     │ → ~/taisun_agent/.claude/                │
  │ .mcp.json    │ → ~/taisun_agent/.mcp.json               │
  │ スキル       │ 120個                                     │
  │ エージェント │ 114個                                     │
  └──────────────┴──────────────────────────────────────────┘
```

> `.gitignore` に `.claude/` `.mcp.json` `.env` が自動追加されるので、リンク先がgitに入ることはありません。

---

## 🛠 インストール後に使えるコマンド

### バージョン確認

```bash
npm run taisun:version
```

バージョン・OS・Node・Ollama・プロファイル・スキル数・サポートIDを一覧表示します。

### 困ったとき（サポート用診断）

```bash
npm run taisun:support
```

診断情報をファイルに保存します。サポートに送るだけで問題を特定できます。

### システム診断

```bash
npm run taisun:diagnose
```

スキル・エージェント・MCP・フックの状態を自動チェックします。

### MCPプロファイル切替

```bash
npm run mcp:dev          # 開発モード（Playwright・Context7・n8n等）
npm run mcp:secure       # セキュアモード（最小権限）
npm run mcp:marketing    # マーケティングモード（Meta Ads・Twitter・Firecrawl等）
npm run mcp:status       # 現在の状態を確認
```

### スキルプロファイル変更

インストール後でもスキル構成を変更できます。

**Mac:**
```bash
./scripts/install.sh --list-profiles          # 一覧表示
./scripts/install.sh --profile minimal        # 最小構成（92個）
./scripts/install.sh --profile full           # 全スキル（120個）
./scripts/install.sh --with-docker --with-figma  # 個別追加
```

**Windows:**
```powershell
.\scripts\install.ps1 -ListProfiles           # 一覧表示
.\scripts\install.ps1 -Profile minimal        # 最小構成（92個）
.\scripts\install.ps1 -Profile full           # 全スキル（120個）
.\scripts\install.ps1 -WithDocker -WithFigma  # 個別追加
```

### APIキー設定

`.env` ファイルに設定します。**ANTHROPIC_API_KEY だけあれば基本機能は全て使えます。**

```bash
# 必須（これがないとClaude Codeが動きません）
ANTHROPIC_API_KEY=sk-ant-...

# 推奨（リサーチ機能が大幅に強化されます・全て無料枠あり）
TAVILY_API_KEY=tvly-...          # Web検索（1,000 req/月 無料）
FRED_API_KEY=...                 # 経済指標（無制限・要登録）
NEWSAPI_KEY=...                  # ニュース収集（100 req/日 無料）
```

> 他のAPIキーは `.env.example` に一覧があります。必要になった時に追加すればOKです。

### スキル早見表

インストール後、以下のガイドが `.claude/skills/_guides/` に配置されます：

| ガイド | 内容 |
|-------|------|
| `research-tier-guide.md` | リサーチスキルの選び方（Tier 0〜4 / 8スキル比較） |
| `taiyo-style-guide.md` | コピーライティング8種の用途別早見表 |
| `lp-flow-guide.md` | LP作成フロー（Ollama不要/必要ルート別） |
| `sdd-flow-guide.md` | SDD設計フロー（Ollama不要/必要ルート別） |

---

## 🔄 everything-claude-code (ECC) のインストール・アップデート

TAISUN は **[everything-claude-code](https://github.com/affaan-m/everything-claude-code)** をベースレイヤーとして使用しています。
ECC は Claude Code 向けの汎用スキル・エージェント・コマンド集（Anthropic Hackathon 受賞）です。

### システム構造

```
ECC (基盤層)              → ~/.claude/ にグローバルインストール
  └─ rules / agents / commands / skills (300+)

TAISUN (プロジェクト層)   → ./claude/ にプロジェクトローカル設定
  └─ WORKFLOW CONTRACT / hooks / MCP 21個 / 独自スキル
```

### 初回インストール

```bash
# 1. リポジトリをクローン
cd ~/Desktop/01_開発プロジェクト   # ← 任意のフォルダでOK
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code

# 2. 依存関係をインストール
npm install

# 3. ECC を ~/.claude/ に適用（TypeScript プロジェクト向け）
bash install.sh typescript
```

**完了の目安**: `~/.claude/commands/`, `~/.claude/agents/`, `~/.claude/skills/` に大量のファイルが展開されれば成功。

> インストール記録は `~/.claude/ecc/install-state.json` に保存されます（バージョン・コミットハッシュ確認可能）。

### アップデート

```bash
cd ~/Desktop/01_開発プロジェクト/everything-claude-code

# 競合する可能性があるローカルファイルを退避（初回のみ）
# ls .claude 2>/dev/null && mv .claude .claude.backup

# 最新版を取得
git pull origin main

# 再インストール（差分のみ適用）
bash install.sh typescript
```

**現在の ECC バージョン確認**:
```bash
cat ~/.claude/ecc/install-state.json | python3 -m json.tool | grep repoVersion
```

### ECC が提供する主な機能

| カテゴリ | 内容 | TAISUN での使われ方 |
|---------|------|-------------------|
| `rules/` | coding-style, testing, security 等11ファイル | 全コードのコーディング規約強制 |
| `agents/` | ait42-* 汎用エージェント群 | `/omega-research` 等から自動呼び出し |
| `commands/` | /tdd, /code-review, /checkpoint 等 | スラッシュコマンドとして使用可能 |
| `skills/` | 300+ スキル | `Skill tool` で呼び出す全スキルのベース |

### 注意事項

- ECC は `~/.claude/` (グローバル) に適用、TAISUN 独自設定 `.claude/` (プロジェクト) には影響なし
- `git pull` 前にローカルに `.claude/` があると競合エラーが出る → `mv .claude .claude.backup` で退避
- ECC v1.8.0 では357ファイルが展開される（インストール時間: 約30秒）

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
