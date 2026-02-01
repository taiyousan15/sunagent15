# TAISUN v2

**Unified Development & Marketing Platform** - AIエージェント、MCPツール、マーケティングスキルを統合した次世代開発プラットフォーム

[![CI](https://github.com/san15/taisun_agent/actions/workflows/ci.yml/badge.svg)](https://github.com/san15/taisun_agent/actions/workflows/ci.yml)
[![Security Scan](https://github.com/san15/taisun_agent/actions/workflows/security.yml/badge.svg)](https://github.com/san15/taisun_agent/actions/workflows/security.yml)
[![Node.js](https://img.shields.io/badge/Node.js-18.x%20%7C%2020.x-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-775%20passing-brightgreen)](https://github.com/san15/taisun_agent/actions)

---

> **2026-02-01: v2.9.2 企業向けプレゼン資料 & インストールガイド改善 📊**
>
> Deep Researchを活用した企業向けプレゼン資料の自動生成機能と、正しいインストール方法のガイドを追加しました。
>
> ### 新機能
> | 機能 | 説明 |
> |------|------|
> | 📊 **プレゼン資料自動生成** | 業界別活用事例・専門用語解説付きのPDFスライド生成 |
> | 🔍 **Deep Research統合** | 競合調査・市場分析を自動化してプレゼンに反映 |
> | 📖 **できること/できないこと明確化** | システムの限界を正直に文書化 |
>
> ### 重要：正しいインストール方法
>
> **taisun_agentは1つだけ**クローンしてください。プロジェクトごとにコピーする必要はありません。
>
> ```bash
> # 推奨：ホームディレクトリにクローン
> cd ~
> git clone https://github.com/san15/taisun_agent.git
> cd taisun_agent && npm install && npm run build:all
>
> # 他のプロジェクトで使う場合もコピー不要
> cd ~/your-project
> claude  # そのまま使える
> ```
>
> ### TAISUNでできないこと（限界）
> - 単独では動作しない（Claude Code必須）
> - 24時間自律稼働（人間の監視が必要）
> - 100%正確な情報（ハルシネーションの可能性あり）
> - 専門資格が必要な判断（医療診断、法的助言等）
> - 物理的な作業、電話対応、契約締結
>
> 詳細は[プレゼン資料](docs/TAISUN_PRESENTATION.md)を参照

---

> **2026-02-01: v2.9.1 ドキュメント整合性修正 🔧**
>
> 第三者配布時の信頼性向上のため、ドキュメントと実際のスキル構成を完全に同期しました。
>
> ### 修正内容
> | 項目 | 説明 |
> |------|------|
> | 📝 **削除済みスキル参照修正** | sales-letter, step-mail, vsl等の参照を正しいスキル名に更新 |
> | 🎬 **Video Agent統合反映** | 12個の個別スキル → `video-agent` 統合をドキュメントに反映 |
> | 📊 **スキル数修正** | 83 → 66（実際のアクティブスキル数） |
> | 🌐 **フォルダ名英語化** | `テロップ` → `telop`（クロスプラットフォーム対応） |
>
> ### アップグレード（既存ユーザー）
> ```bash
> cd taisun_agent
> git pull origin main
> npm install && npm run build:all
> npm run taisun:diagnose        # 98/100点以上で成功
> ```
>
> ### 新規インストール（5分）
> ```bash
> git clone https://github.com/san15/taisun_agent.git
> cd taisun_agent && npm install && npm run build:all
> npm run perf:fast              # 推奨: 高速モード
> npm run taisun:diagnose        # 98/100点以上で成功
> ```

---

> **2026-02-01: v2.9.0 Kindle Content Empire & Video Agent統合 📚🎬**
>
> Kindle本→note記事→YouTube動画のマルチプラットフォーム自動展開を支援する要件定義システムを追加しました。
>
> ### 新機能
> | 機能 | 説明 |
> |------|------|
> | 📚 **Kindle Content Empire** | Kindle本取得→オリジナル本生成→KDP出品→note記事→YouTube動画の自動化要件定義 |
> | 🎬 **Video Agent統合** | video-download, video-transcribe等12スキルを1つの`video-agent`に統合 |
> | 🔍 **VLM画像OCR** | 画像9割のKindle本もQwen-VLで正確に読み取り（要約なし転写） |
> | 🔐 **Amazon認証自動化** | Cookie-based認証（1年有効）+ TOTP自動化 |
>
> ### Kindle Content Empire 100点要件定義
> `.kiro/specs/kindle-content-empire/requirements.md` に25の機能要件を定義:
> - REQ-001〜016: Kindle抽出・オリジナル本生成・ePub変換・note記事・YouTube動画
> - REQ-900〜903: 処理速度30分以内・可用性99%・90日データ保持
> - REQ-950〜951: APIキー管理・ログマスキング
> - REQ-960〜962: 構造化ログ・進捗監視・エラーアラート
>
> ### 使い方
> ```bash
> # 要件定義100点を達成
> /sdd-req100 kindle-content-empire
> /score-req100 .kiro/specs/kindle-content-empire/requirements.md
>
> # Video Agent統合スキル
> /video-agent                   # 動画パイプライン全体
> ```
>
> ### アップグレード（既存ユーザー）
> ```bash
> cd taisun_agent
> git pull origin main
> npm install && npm run build:all
> npm run perf:fast
> npm run taisun:diagnose
> ```
>
> ### 新規インストール
> ```bash
> git clone https://github.com/san15/taisun_agent.git
> cd taisun_agent && npm install && npm run build:all
> npm run perf:fast              # 推奨: 高速モード
> npm run taisun:diagnose        # 100/100点で成功
> ```

---

> **2026-01-31: v2.8.0 Deep Research & 要件定義スキル追加 🔬📋**
>
> 「〇〇をリサーチして」で深層調査、「要件定義を作って」でEARS準拠の要件定義が作れるようになりました。
>
> ### 新スキル（7個）
> | スキル | 説明 |
> |--------|------|
> | 🔬 **research** | ワンコマンド深層調査（`/research AIエージェントの最新動向`） |
> | 🔍 **dr-explore** | 探索・収集フェーズ（evidence.jsonl生成） |
> | 📊 **dr-synthesize** | 検証・統合→レポート生成 |
> | 🛠️ **dr-build** | 実装計画をPoC/MVP/Productionに落とし込む |
> | ⚙️ **dr-mcp-setup** | MCPサーバーのセットアップ支援 |
> | 📋 **sdd-req100** | EARS準拠の要件定義生成＋C.U.T.E.自動採点（目標98点） |
>
> ### 新コマンド（2個）
> | コマンド | 説明 |
> |----------|------|
> | `/req100` | spec-slugを自動推論してコマンドを提示 |
> | `/score-req100` | 既存requirements.mdを再採点 |
>
> ### 使い方
> ```bash
> # 深層調査
> /research AIエージェントの最新動向
>
> # 要件定義（EARS準拠 + 自動採点）
> /sdd-req100 my-feature
> /req100                    # spec-slug推論ヘルパー
> /score-req100 .kiro/specs/my-feature/requirements.md
> ```
>
> ### アップグレード（既存ユーザー）
> ```bash
> cd taisun_agent
> git pull origin main
> npm install && npm run build:all
> npm run taisun:diagnose
> ```
>
> ### 新規インストール
> ```bash
> git clone https://github.com/san15/taisun_agent.git
> cd taisun_agent && npm install && npm run build:all
> npm run perf:fast              # 推奨: 高速モード
> npm run taisun:diagnose        # 100/100点で成功
> ```
>
> 詳細: [research/README.md](research/README.md) | [.kiro/specs/README.md](.kiro/specs/README.md)

---

> **2026-01-30: v2.7.2 メモリ最適化・安定性向上 🚀**
>
> 長時間セッションでのメモリ不足クラッシュ（heap out of memory）を解決しました。
>
> ### 新機能
> | 機能 | 説明 |
> |------|------|
> | 🧠 **メモリ最適化** | Node.jsヒープサイズ8GB対応 |
> | ⚡ **高速モード** | `npm run perf:fast` でフック81%削減 |
> | 🔧 **安定起動** | `claude-stable` エイリアス追加 |
>
> ### アップグレード（既存ユーザー）
> ```bash
> cd taisun_agent
> git pull origin main
> npm install && npm run build:all
> npm run perf:fast              # 高速モード有効化
> echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.zshrc
> source ~/.zshrc
> npm run taisun:diagnose        # 100/100点で成功
> ```
>
> ### 新規インストール（5分）
> ```bash
> git clone https://github.com/san15/taisun_agent.git
> cd taisun_agent && npm install && npm run build:all
> npm run perf:fast              # 推奨: 高速モード
> npm run taisun:diagnose        # 100/100点で成功
> ```
>
> 詳細: [docs/PERFORMANCE_MODE.md](docs/PERFORMANCE_MODE.md) | [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

> **2026-01-30: v2.7.1 テスト安定化・配布品質向上 🔧**
>
> 他の環境でもテストが確実に通過するよう**権限問題を修正**しました。
>
> ### 修正内容
> - ワークフローテストをOS一時ディレクトリで実行（権限問題を回避）
> - 並列テスト実行時の分離を強化
> - 全775テストが新規インストール環境で通過

---

> **2026-01-29: v2.7.0 GitHub配布対応・診断システム追加 🚀**
>
> 世界中の誰でも5分でインストールできる**GitHub配布対応**を完了しました。
>
> ### 新機能
> | 機能 | 説明 |
> |------|------|
> | 🔧 **自動診断** | `npm run taisun:diagnose` で13層防御・82エージェント・77スキルを一括検証 |
> | 📖 **5分インストール** | [INSTALL.md](INSTALL.md) でクイックスタート |
> | 🏗️ **アーキテクチャ文書** | [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) で.mdファイル参照順序を解説 |
> | 🎯 **セットアッププロンプト** | [TAISUN_SETUP_PROMPTS.md](TAISUN_SETUP_PROMPTS.md) で初期設定を支援 |
>
> 詳細: [INSTALL.md](INSTALL.md) | [DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md)

---

> **2026-01-21: v2.6.0 13層防御システム完成・新スキル追加 🛡️**
>
> AIの暴走を完全に防止する**13層防御システム**を完成させ、新しいスキルとMCP統合を追加しました。
>
> ### 13層防御システム
> | Layer | Guard | 機能 |
> |-------|-------|------|
> | 0 | CLAUDE.md | 絶対遵守ルール |
> | 1-7 | Core Guards | 状態注入・権限・編集・スキル制御 |
> | 8-9 | Safety Guards | 文字化け防止・インジェクション検出 |
> | 10-12 | Quality Guards | スキル自動選択・定義検証・品質ガイド |
>
> ### 新スキル・MCP統合
> - **diagram-illustration**: 図解・インフォグラフィック作成
> - **taiyo-analyzer**: 176パターンコピーライティング品質分析
> - **context7-docs**: 最新ドキュメント取得（ハルシネーション防止）
> - **gpt-researcher**: 自律型深層リサーチ
> - **hierarchical-memory**: Mem0ベース3層メモリアーキテクチャ

---


> **2026-01-18: v2.5.1 システム総合検証・安定化リリース 🎯**
>
> システム全体の動作検証と安定化を行い、**本番環境対応**の品質を達成しました。
>
> ### 検証済みコンポーネント
> - **82 Agents**: 全エージェント動作確認済み
> - **70 Skills**: 全スキル定義検証済み
> - **13 Hooks**: 構文・実行テスト通過
> - **227 MCP Tools**: 統合テスト完了
>
> ### 修正内容
> - **Auto-save閾値最適化**: 50KB→15KB（より積極的なコンテキスト節約）
> - **MCP Proxy cold start対応**: 初期状態での誤検知を修正
> - **Agent Enforcement Guard**: 複雑タスク検出・Task tool強制機能
>
> ### インストール・アップデート
> ```bash
> git clone https://github.com/san15/taisun_agent.git
> cd taisun_agent && npm install && npm run build:all
> ./scripts/test-agents.sh  # 動作確認
> ```
>
> 詳細: [DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md)

---

> **2026-01-15: v2.4.0 Workflow Guardian Phase 3 - 並列実行・条件分岐 🚀**
>
> ワークフローシステムに**Phase 3機能**を追加し、より複雑なワークフローをサポートします。
>
> ### 新機能
> - **並列実行**: 複数フェーズの同時実行をサポート
> - **条件分岐**: 動的なワークフロー制御
> - **高度なロールバック**: フェーズ単位での安全な巻き戻し
>
> ### ドキュメント
> - [docs/WORKFLOW_PHASE3_QUICKSTART.md](docs/WORKFLOW_PHASE3_QUICKSTART.md) - クイックスタート
> - [CHANGELOG.md](CHANGELOG.md) - 詳細な変更履歴

---

> **2026-01-12: Workflow Guardian Phase 2 - AIの暴走を防ぐ厳格モード 🛡️**
>
> AIが勝手にワークフローのフェーズをスキップしたり、危険な操作を実行するのを**完全に防止**する
> Workflow Guardian Phase 2を実装しました。
>
> ### 主要機能
> - **Strict Mode**: `--strict`フラグで厳格な強制モードを有効化
> - **Skill Guard**: 許可されていないスキルの実行を自動ブロック
> - **Hooks System**: 危険なBashコマンド・ファイル操作を事前防止
> - **状態管理**: セッション跨ぎでワークフロー進捗を永続化
>
> ### セキュリティ保護
> **ブロック対象**:
> - `rm -rf`, `git push --force`, `DROP TABLE`等の危険コマンド
> - `.env`, `secrets/`, `.git/`等の重要ファイル編集
> - 現在フェーズで許可されていないスキル実行
>
> ### 2つのモード
> ```bash
> # Phase 1 (デフォルト): Advisory - 警告のみ
> npm run workflow:start -- video_generation_v1
>
> # Phase 2: Strict - 完全強制
> npm run workflow:start -- video_generation_v1 --strict
> ```
>
> ### ドキュメント
> - [docs/WORKFLOW_STATE_MANAGEMENT.md](docs/WORKFLOW_STATE_MANAGEMENT.md) - 完全ガイド
> - [docs/WORKFLOW_PHASE2_DESIGN.md](docs/WORKFLOW_PHASE2_DESIGN.md) - 設計書
>
> **推奨**: 本番環境・重要なワークフローではstrict modeを使用してください。

---

> **2026-01-11: OpenCode/OMO統合 - 任意で使えるセカンドエンジン 🤖**
>
> 難しいバグ修正やTDD自動化を支援する**OpenCode/OMO統合**を追加しました。
> 完全opt-in設計で、使いたい時だけ明示的に有効化できます。
>
> ### 新機能
> - **memory_add(content_path)**: 大量ログをファイルから直接保存（コンテキスト節約99%）
> - **/opencode-setup**: セットアップ確認と導入ガイド
> - **/opencode-fix**: バグ修正支援（mistakes.md統合 + セッション回収）
> - **/opencode-ralph-loop**: TDD自動反復開発（デフォルト無効）
> - **環境診断拡張**: `npm run doctor`でOpenCode状態を確認
>
> ### セキュリティ
> - **Path Traversal防止**: プロジェクト外ファイル読み込み不可
> - **Size Limit**: 10MB制限でDoS防止
> - **UTF-8 Validation**: 文字化けファイル自動検出
>
> ### ドキュメント
> - [docs/opencode/README-ja.md](docs/opencode/README-ja.md) - OpenCode/OMO導入ガイド
> - [docs/opencode/USAGE-ja.md](docs/opencode/USAGE-ja.md) - 使用例・ベストプラクティス
>
> ### 使用例
> ```bash
> # 環境確認
> npm run doctor
>
> # バグ修正相談
> /opencode-fix "DBコネクションプールが枯渇するバグ"
>
> # ログは自動的にmemory_addに保存（会話に含めない）
> # → コンテキスト消費: 100KB → 50トークン（99.8%削減）
> ```
>
> **重要**: OpenCodeは完全オプショナルです。インストールしなくてもTAISUNは100%動作します。

---

> **2026-01-09: コンテキスト最適化システム強化 🚀**
>
> 書き込み操作の最適化により、コンテキスト使用量を**70%削減**できるようになりました。
>
> ### 新機能
> - **自動監視**: ファイルサイズ・コンテキスト使用率の自動チェック
> - **Agent委託ガイド**: 5KB/20KB/50KB閾値による最適化提案
> - **バッチ処理**: 3-5ファイルごとに/compact推奨
> - **警告システム**: 60%/75%/85%で段階的警告
>
> ### ドキュメント
> - [CONTEXT_MANAGEMENT.md](docs/CONTEXT_MANAGEMENT.md) - 読み取り最適化（99%削減）
> - [CONTEXT_WRITE_OPTIMIZATION.md](docs/CONTEXT_WRITE_OPTIMIZATION.md) - 書き込み最適化（70%削減）
> - [context-monitor.js](.claude/hooks/context-monitor.js) - 自動監視フック
>
> ### 効果
> ```
> Before: 113KB生成 → 83k tokens (41%)
> After:  113KB生成 → 15-25k tokens (8-12%)
> 削減:   約60k tokens (70%削減)
> ```

---

> **2026-01-08: Windows完全対応リリース 🎉**
>
> Windows環境で100%動作することを保証するアップデートをリリースしました。
>
> ### アップデート方法
> ```powershell
> cd taisun_agent
> git pull origin main
> npm install
> ```
>
> ### 新機能
> - **自動環境診断**: `npm run setup:windows` で環境をチェック
> - **改行コード統一**: .gitattributes による自動統一（CRLF/LF問題を解決）
> - **Node.js版スクリプト**: シェルスクリプト不要
> - **詳細ガイド**: 475行の [Windows専用セットアップガイド](docs/WINDOWS_SETUP.md)
>
> ### Windows環境での使い方
> ```powershell
> npm run setup:windows  # 環境診断
> npm install
> npm test               # 775テスト全通過を確認
> npm run mcp:health     # MCP設定チェック
> ```
>
> 詳細: [docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md)

---

> **2026-01-07: セキュリティ強化アップデート**
>
> MCPツールの入力検証とインジェクション防止機能を追加しました。
>
> ### アップデート方法
> ```bash
> cd taisun_agent
> git pull origin main
> npm install
> ```
>
> ### セキュリティ修正内容
> - **Chrome パス検証**: コマンドインジェクション防止（ホワイトリスト検証）
> - **JSON プロトタイプ汚染対策**: `__proto__`等の危険キー自動除去
> - **スキル名検証**: パストラバーサル攻撃防止（CWE-22）
> - **メモリ入力検証**: DoS防止（サイズ制限・サニタイズ）
>
> ### 新規ユーティリティ
> - `src/utils/safe-json.ts` - 安全なJSONパーサー

---

> **2026-01-07: UTF-8安全対策をリリースしました**
>
> 日本語/マルチバイト文字を含むファイルの編集時にクラッシュ・文字化けが発生する問題への対策を追加しました。
>
> ### 新機能
> - **safe-replace**: Unicode安全な置換ツール
> - **utf8-guard**: 文字化け自動検知
> - **品質ゲート強化**: CIでエンコーディングチェック
>
> 詳細: [docs/operations/text-safety-ja.md](docs/operations/text-safety-ja.md)

---

## はじめての方へ

> **重要**: TAISUN v2は **Claude Code の拡張機能** です。
> インストール後、このディレクトリで Claude Code を起動すると、82のエージェントと66のスキルが自動的に使えるようになります。

---

### ⚠️ インストール時の重要な注意

```
┌─────────────────────────────────────────────────────────────────┐
│  taisun_agent は「1回だけ」クローンしてください                  │
│  プロジェクトごとにコピーする必要はありません                    │
└─────────────────────────────────────────────────────────────────┘
```

**❌ やってはいけない例:**
```bash
cd ~/project-A && git clone https://github.com/san15/taisun_agent.git
cd ~/project-B && git clone https://github.com/san15/taisun_agent.git  # ← 不要！
cd ~/project-C && git clone https://github.com/san15/taisun_agent.git  # ← 不要！
```

**✅ 正しいインストール:**
```bash
# ホームディレクトリに1回だけクローン
cd ~
git clone https://github.com/san15/taisun_agent.git

# 他のプロジェクトで作業するときもコピー不要
cd ~/project-A && claude  # そのままClaude Codeを使える
cd ~/project-B && claude  # taisun_agentは不要
```

---

### 🆕 新規インストール（初めての方）

#### Mac / Linux（5分）

```bash
# 1. ホームディレクトリに移動してクローン（重要：1回だけ！）
cd ~
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent

# 2. 依存関係インストール＆ビルド
npm install
npm run build:all

# 3. 高速モード有効化（推奨）
npm run perf:fast

# 4. メモリ対策（長時間セッション向け・1回だけ実行）
echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.zshrc
source ~/.zshrc

# 5. 診断実行（98/100点以上で成功）
npm run taisun:diagnose

# 6. 使い方：taisun_agentディレクトリでClaude Codeを起動
cd ~/taisun_agent
claude
```

#### Windows（10分）

```powershell
# 1. ホームディレクトリに移動してクローン（重要：1回だけ！）
cd $HOME
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent

# 2. Windows セットアップ
npm run setup:windows

# 3. 依存関係インストール＆ビルド
npm install
npm run build:all

# 4. 高速モード有効化
npm run perf:fast

# 5. 診断実行
npm run taisun:diagnose
```

> **⚠️ Windows ユーザー向け注意事項**:
> - `npm test` で大量のエラーが出る場合 → `npm run build:all` を先に実行
> - 詳細: [docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md)

---

### 🔄 アップグレード（既存ユーザー）

```bash
# 1. taisun_agent ディレクトリに移動
cd taisun_agent

# 2. 最新版を取得
git pull origin main

# 3. 依存関係を更新＆再ビルド
npm install
npm run build:all

# 4. 高速モード有効化（推奨）
npm run perf:fast

# 5. 診断実行（100/100点で成功）
npm run taisun:diagnose
```

> **💡 ヒント**: メモリ対策（NODE_OPTIONS）は一度設定すれば、アップグレード時に再設定は不要です。

---

### ❓ トラブルシューティング

| エラー | 解決方法 |
|-------|---------|
| `スクリプトが存在しません` | `cd ~/taisun_agent` で正しいディレクトリに移動 |
| `heap out of memory` | `echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.zshrc && source ~/.zshrc` |
| ビルドエラー | `rm -rf node_modules dist && npm install && npm run build:all` |
| 複数のtaisun_agentがある | 1つだけ残して他は削除（下記参照） |

#### 複数コピーの整理方法

```bash
# 1. 全てのtaisun_agentを検索
find ~ -maxdepth 5 -type d -name "taisun_agent" 2>/dev/null

# 2. メイン以外を削除（例）
rm -rf ~/project-A/taisun_agent
rm -rf ~/project-B/taisun_agent

# 3. ホームディレクトリに1つだけ残す
# ~/taisun_agent だけが存在する状態にする
```

詳細: [INSTALL.md](INSTALL.md) | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

### 📁 他のプロジェクトで使う方法

taisun_agentをコピーする必要は**ありません**。

```bash
# 方法1: taisun_agentディレクトリで作業（推奨）
cd ~/taisun_agent
claude
# → 会話の中で他のプロジェクトのファイルを指定して作業

# 方法2: 任意のプロジェクトで直接Claude Code起動
cd ~/your-project
claude
# → taisun_agentがなくてもClaude Codeは使える
# → ただしtaisun_agentのスキルを使うには方法1を推奨
```

---

### 2. 使い方（超簡単）

```bash
cd ~/taisun_agent
claude  # Claude Code を起動
```

**あとは普通に会話するだけ:**

```
あなた: 「セールスレターを書いて」
Claude: /taiyo-style-sales-letter スキルで作成します...

あなた: 「このコードをレビューして」
Claude: code-reviewer エージェントで分析します...
```

### 3. 詳細ガイド

| ドキュメント | 内容 |
|-------------|------|
| [INSTALL.md](INSTALL.md) | **5分クイックインストール** ⭐ |
| [TAISUN_SETUP_PROMPTS.md](TAISUN_SETUP_PROMPTS.md) | 初期設定・検証プロンプト集 |
| [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | システムアーキテクチャ・.md参照順序 |
| [QUICK_START.md](docs/QUICK_START.md) | 詳細セットアップ手順 |
| [WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md) | **Windows 専用**セットアップガイド（100%動作保証） |
| [CONTEXT_MANAGEMENT.md](docs/CONTEXT_MANAGEMENT.md) | コンテキスト管理システム完全ガイド（99%削減の仕組み） |
| [opencode/README-ja.md](docs/opencode/README-ja.md) | OpenCode/OMO 任意導入ガイド（opt-in セカンドエンジン） |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | エラー解決 |
| [CONFIG.md](docs/CONFIG.md) | 設定カスタマイズ |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | 開発参加方法 |

---

## Overview

TAISUN v2は、Claude Codeと連携し、設計から実装、テスト、デプロイ、マーケティングまでを一貫して支援する**統合開発・マーケティングプラットフォーム**です。

```
┌─────────────────────────────────────────────────────────────┐
│                    TAISUN v2 Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │   Claude    │◄──│  Proxy MCP  │──►│  36 External │       │
│  │    Code     │   │   Server    │   │  MCP Servers │       │
│  └─────────────┘   └──────┬──────┘   └─────────────┘       │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐              │
│         ▼                 ▼                 ▼              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ 82 Agents   │   │  82 Skills  │   │ 82 Commands │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### System Statistics

| Component | Count | Description |
|-----------|-------|-------------|
| **AI Agents** | 82 | 専門家エージェント (AIT42 +  + Diagnostics) |
| **Skills** | 66 | マーケティング・インフラ自動化スキル |
| **Hooks** | 21 | 13層防御システム（21ファイル） |
| **Commands** | 84 | ショートカットコマンド（OpenCode統合含む） |
| **MCP Servers** | 36 | 外部サービス連携 |
| **MCP Tools** | 227 | 統合ツール群 |
| **Source Lines** | 11,167 | TypeScript (proxy-mcp) |
| **Tests** | 775 | ユニット・統合テスト（全Pass） |

## Key Features

### 1. Single MCP Entrypoint (Proxy MCP)

5つのツールで32+の外部MCPサーバーを統合管理:

```typescript
// 5 Public Tools
system_health   // ヘルスチェック
skill_search    // スキル検索
skill_run       // スキル実行
memory_add      // コンテンツ保存
memory_search   // コンテンツ検索
```

### 2. Hybrid Router

- **ルールベース安全性**: 危険操作の自動検出・ブロック
- **セマンティック検索**: 類似度ベースのMCP選択
- **人間承認フロー**: 高リスク操作のエスカレーション

### 3. Multi-Agent System (82 Agents)

| Category | Count | Examples |
|----------|-------|----------|
| **Coordinators** | 5 | ait42-coordinator, omega-aware-coordinator, initialization-orchestrator |
| **Diagnostics & Recovery** | 5 | system-diagnostician, error-recovery-planner, environment-doctor 🆕 |
| **Architecture** | 6 | system-architect, api-designer, security-architect |
| **Development** | 6 | backend-developer, frontend-developer, api-developer |
| **Quality Assurance** | 8 | code-reviewer, test-generator, security-tester |
| **Operations** | 8 | devops-engineer, incident-responder, cicd-manager |
| **Documentation** | 3 | tech-writer, doc-reviewer, knowledge-manager |
| **Analysis** | 4 | complexity-analyzer, feedback-analyzer |
| **Specialized** | 5 | bug-fixer, refactor-specialist, feature-builder |
| **Multi-Agent** | 4 | competition, debate, ensemble, reflection |
| **Process** | 5 | workflow-coordinator, requirements-elicitation |
| **** | 6 | -codegen-agent, -pr-agent |

### 4. Skill Library (82 Skills)

#### Marketing & Sales (12)
- `copywriting-helper` - コピーライティング支援
- `taiyo-style-sales-letter` - セールスレター作成（太陽スタイル）
- `taiyo-style-step-mail` - ステップメール作成（太陽スタイル）
- `taiyo-style-vsl` - ビデオセールスレター（太陽スタイル）
- `launch-video` - ローンチ動画スクリプト
- `lp-analysis` / `mendan-lp` - LP分析・面談LP
- `funnel-builder` - ファネル構築
- `customer-support-120` - カスタマーサポート（120%対応）
- `taiyo-style` - 太陽スタイル適用

#### Content Creation (10)
- `kindle-publishing` - Kindle本出版
- `youtube-content` / `youtube-thumbnail` - YouTube企画・サムネイル
- `ai-manga-generator` / `anime-production` - AI漫画・アニメ制作
- `diagram-illustration` - 図解作成
- `sns-marketing` - SNSマーケティング

#### AI Image & Video (4)
- `nanobanana-pro` / `nanobanana-prompts` - NanoBanana統合
- `omnihuman1-video` - AIアバター動画
- `japanese-tts-reading` - 日本語TTS

#### Infrastructure (11)
- `workflow-automation-n8n` - n8nワークフロー
- `docker-mcp-ops` - Docker操作
- `security-scan-trivy` - セキュリティスキャン
- `pdf-automation-gotenberg` - PDF自動化
- `doc-convert-pandoc` - ドキュメント変換
- `postgres-mcp-analyst` - PostgreSQL分析
- `notion-knowledge-mcp` - Notionナレッジ
- `unified-notifications-apprise` - 通知統合

### 5. Production-Grade Operations

- **Circuit Breaker**: 障害耐性・自動復旧
- **Incident Lifecycle (P17)**: インシデント相関・ノイズ削減・週次ダイジェスト
- **Scheduled Jobs (P18)**: 日次/週次レポート自動生成
- **Observability**: Prometheus/Grafana/Loki統合

---

## MCPツール完全リファレンス

TAISUN v2では、**3つのMCPサーバー**と**11のMCPツール**を提供しています。

### MCPアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code CLI                          │
├─────────────────────────────────────────────────────────────┤
│  MCPサーバー                                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  taisun-proxy (メイン統合エントリーポイント)              ││
│  │  ├── Router (ルール/セマンティックルーティング)          ││
│  │  ├── Memory (短期/長期記憶)                              ││
│  │  ├── Skillize (66スキル実行)                             ││
│  │  ├── Supervisor (ワークフロー制御)                       ││
│  │  └── 内部MCP (github/notion/postgres/filesystem)        ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ claude-mem-search│  │     ide          │                 │
│  │ (履歴/学習検索)   │  │ (VS Code連携)    │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### MCPサーバー詳細

#### 1. TAISUN Proxy MCP（メインサーバー）

統合エントリーポイント。すべての機能を5つのツールで提供。

| ツール | 説明 | 使用例 |
|-------|------|-------|
| `system_health` | システム稼働状況確認、ヘルスチェック | `mcp__taisun-proxy__system_health()` |
| `skill_search` | 66スキルの検索（キーワードまたは全件） | `skill_search(query="taiyo")` |
| `skill_run` | スキルのロード・実行 | `skill_run(name="youtube-thumbnail")` |
| `memory_add` | 大規模コンテンツの保存、参照ID発行<br>- `content`: 直接テキスト保存<br>- `content_path`: ファイルを読み込んで保存（巨大ログ向け） | `memory_add(content="データ", type="long-term")`<br>`memory_add(content_path="logs/output.log", type="short-term")` |
| `memory_search` | 参照IDまたはキーワードでメモリ検索 | `memory_search(query="LP作成")` |

**内部MCP（Rollout管理）:**
- `github` - GitHub Issue/PR連携
- `notion` - Notionナレッジベース
- `postgres` - PostgreSQLデータ分析
- `filesystem` - ファイルシステム操作

#### 2. Claude Memory Search MCP

過去のセッション記録・学習履歴を効率的に検索。**3層ワークフロー**で10倍のトークン節約。

| ツール | 説明 | パラメータ |
|-------|------|-----------|
| `search` | メモリ検索（インデックス取得） | query, limit, project, type, dateStart, dateEnd |
| `timeline` | 結果周辺のコンテキスト取得 | anchor, depth_before, depth_after |
| `get_observations` | フィルタ済みIDの詳細取得 | ids (配列), orderBy, limit |

**推奨ワークフロー:**
```javascript
// 1. 検索でIDを取得（〜50-100トークン/件）
search(query="LP作成") → IDs

// 2. 興味のあるIDの周辺コンテキスト取得
timeline(anchor=123)

// 3. 必要なIDのみ詳細取得
get_observations(ids=[123, 124])
```

#### 3. IDE MCP

VS Code連携による開発支援。

| ツール | 説明 |
|-------|------|
| `getDiagnostics` | 言語診断情報取得（型エラー、警告等） |
| `executeCode` | Jupyterカーネルでコード実行 |

---

## スキル完全リファレンス（66スキル）

### マーケティング・セールス（12スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `copywriting-helper` | コピーライティング支援、訴求力のある文章作成 | `/copywriting-helper` |
| `launch-video` | ローンチ動画スクリプト（3話/4話構成） | `/launch-video` |
| `lp-design` | LP設計・ワイヤーフレーム | `/lp-design` |
| `lp-analysis` | LP分析・改善提案（成約率4.3倍達成） | `/lp-analysis` |
| `mendan-lp` | 面談LP作成（申込率50%目標、4つの型対応） | `/mendan-lp` |
| `funnel-builder` | セールスファネル構築 | `/funnel-builder` |
| `customer-support-120` | 顧客期待120%超え対応 | `/customer-support-120` |
| `education-framework` | 6つの教育要素フレームワーク | `/education-framework` |
| `line-marketing` | LINEマーケティング戦略 | `/line-marketing` |
| `sales-systems` | セールスシステム構築 | `/sales-systems` |
| `lp-json-generator` | LP画像のテキスト差し替え生成 | `/lp-json-generator` |
| `taiyo-analyzer` | 太陽スタイル176パターン品質分析 | `/taiyo-analyzer` |

### 太陽スタイル（10スキル）

日給5000万円を生み出した太陽スタイルのコピーライティング技術。

| スキル | 説明 | コマンド |
|-------|------|---------|
| `taiyo-style` | 太陽スタイル基本（176パターン適用） | `/taiyo-style` |
| `taiyo-rewriter` | 既存コンテンツを太陽スタイルに変換 | `/taiyo-rewriter` |
| `taiyo-style-headline` | 衝撃的なヘッドライン・キャッチコピー生成 | `/taiyo-style-headline` |
| `taiyo-style-bullet` | ブレット・ベネフィットリスト生成 | `/taiyo-style-bullet` |
| `taiyo-style-ps` | 追伸（P.S.）パターン生成 | `/taiyo-style-ps` |
| `taiyo-style-lp` | 太陽スタイルLP作成・最適化 | `/taiyo-style-lp` |
| `taiyo-style-sales-letter` | 太陽スタイルセールスレター | `/taiyo-style-sales-letter` |
| `taiyo-style-step-mail` | 太陽スタイルステップメール | `/taiyo-style-step-mail` |
| `taiyo-style-vsl` | 太陽スタイルVSL台本（15章構成） | `/taiyo-style-vsl` |

### コンテンツ制作（10スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `kindle-publishing` | Kindle本出版（企画〜出版） | `/kindle-publishing` |
| `note-marketing` | note記事戦略 | `/note-marketing` |
| `youtube-content` | YouTube動画企画 | `/youtube-content` |
| `youtube-thumbnail` | サムネイル作成（CTR最適化） | `/youtube-thumbnail` |
| `youtube_channel_summary` | YouTubeチャンネル分析・まとめ | `/youtube_channel_summary` |
| `ai-manga-generator` | AI漫画制作（マーケティング漫画） | `/ai-manga-generator` |
| `anime-production` | アニメ制作 | `/anime-production` |
| `diagram-illustration` | 図解・解説画像作成 | `/diagram-illustration` |
| `custom-character` | キャラクター設定 | `/custom-character` |
| `sns-marketing` | SNSマーケティング（マルチプラットフォーム） | `/sns-marketing` |

### AI画像・動画（5スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `nanobanana-pro` | NanoBanana Pro画像生成（参照画像対応） | `/nanobanana-pro` |
| `nanobanana-prompts` | NanoBanana向けプロンプト最適化 | `/nanobanana-prompts` |
| `omnihuman1-video` | OmniHuman1 AIアバター動画作成 | `/omnihuman1-video` |
| `japanese-tts-reading` | 日本語TTS（Whisper対応） | `/japanese-tts-reading` |
| `gpt-sovits-tts` | GPT-SoVITS音声合成 | `/gpt-sovits-tts` |

### Video Agent統合スキル（1スキル）

動画制作・管理の自動化システム。12個の個別スキルを1つに統合。

| スキル | 説明 | コマンド |
|-------|------|---------|
| `video-agent` | 動画パイプライン統合（ダウンロード、文字起こし、制作、品質管理、CI/CD、通知） | `/video-agent` |

**統合された機能**: video-download, video-transcribe, video-production, video-policy, video-eval, video-ci-scheduling, video-metrics, video-notify, video-anomaly, video-dispatch, video-validate, video-guard

### Deep Research & 要件定義（6スキル）🆕

AIによる深層調査・レポート生成・要件定義システム。

| スキル | 説明 | コマンド |
|-------|------|---------|
| `research` | ワンコマンド深層調査（探索→検証→レポート自動生成） | `/research [トピック]` |
| `dr-explore` | 探索・収集フェーズ（evidence.jsonl生成） | `/dr-explore [topic]` |
| `dr-synthesize` | 検証・統合→レポート・実装計画生成 | `/dr-synthesize [run_path]` |
| `dr-build` | 実装計画をPoC/MVP/Productionに落とし込む | `/dr-build [plan_path]` |
| `dr-mcp-setup` | MCPサーバーのセットアップ支援 | `/dr-mcp-setup` |
| `sdd-req100` | EARS準拠の要件定義生成＋C.U.T.E.自動採点（目標98点） | `/sdd-req100 [spec-slug]` |

**使用例:**
```bash
/research AIエージェントの最新動向
/research 2026年のSaaS市場トレンド
/dr-explore Claude MCP | depth=deep | lang=ja,en
```

### インフラ・自動化（11スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `workflow-automation-n8n` | n8nワークフロー設計・実装 | `/workflow-automation-n8n` |
| `docker-mcp-ops` | Docker操作（コンテナ起動/停止/ログ） | `/docker-mcp-ops` |
| `security-scan-trivy` | Trivyセキュリティスキャン | `/security-scan-trivy` |
| `pdf-automation-gotenberg` | PDF変換・帳票出力自動化 | `/pdf-automation-gotenberg` |
| `doc-convert-pandoc` | ドキュメント変換（md→docx/pptx等） | `/doc-convert-pandoc` |
| `unified-notifications-apprise` | 通知チャネル統合（Slack/Discord/Email等） | `/unified-notifications-apprise` |
| `postgres-mcp-analyst` | PostgreSQL分析（read-only） | `/postgres-mcp-analyst` |
| `notion-knowledge-mcp` | Notionナレッジ検索・整理 | `/notion-knowledge-mcp` |
| `nlq-bi-wrenai` | 自然言語BI/可視化（WrenAI） | `/nlq-bi-wrenai` |
| `research-cited-report` | 出典付きリサーチレポート | `/research-cited-report` |
| `sns-patterns` | SNS投稿パターン | `/sns-patterns` |

### 開発フェーズ（2スキル）

| スキル | 説明 | コマンド |
|-------|------|---------|
| `phase1-tools` | Phase 1ツール群 | - |
| `phase2-monitoring` | Phase 2モニタリング | - |

---

## MCPツール使用例

### スキル検索・実行

```javascript
// 全スキル一覧
mcp__taisun-proxy__skill_search()

// キーワード検索
mcp__taisun-proxy__skill_search(query="taiyo")

// スキル実行
mcp__taisun-proxy__skill_run(name="youtube-thumbnail")
```

### メモリ操作

```javascript
// 長期メモリに保存（直接テキスト）
mcp__taisun-proxy__memory_add(
  content="重要な調査結果...",
  type="long-term",
  metadata={ project: "LP改善" }
)
// → refId: "mem_abc123" を返す

// ファイルから保存（大量ログ向け）
mcp__taisun-proxy__memory_add(
  content_path="logs/test-failure.log",
  type="short-term",
  metadata={ type: "test-log", issue: "DB接続エラー" }
)
// → コンテキスト節約: 100KB → 50トークン（99.8%削減）

// 検索
mcp__taisun-proxy__memory_search(query="mem_abc123")
```

### 履歴検索（3層ワークフロー）

```javascript
// Step 1: インデックス検索
mcp__claude-mem-search__search(
  query="LP作成",
  limit=10,
  dateStart="2026-01-01"
)

// Step 2: コンテキスト取得
mcp__claude-mem-search__timeline(
  anchor=123,
  depth_before=2,
  depth_after=2
)

// Step 3: 詳細取得（必要なIDのみ）
mcp__claude-mem-search__get_observations(
  ids=[123, 124, 125]
)
```

### システムヘルスチェック

```javascript
mcp__taisun-proxy__system_health()
// → { status, uptime, mcps, circuits, metrics }
```

## Quick Start

> **日本語ユーザー向け**: 詳細なセットアップガイドは [docs/getting-started-ja.md](docs/getting-started-ja.md) をご覧ください。

### Prerequisites

- Node.js 18.x+
- npm 9.x+
- Claude Code CLI
- Docker (optional, for monitoring stack)

### Installation

```bash
# Clone repository
git clone https://github.com/san15/taisun_agent.git
cd taisun_agent

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys
```

### Verification

```bash
# Run tests (775 tests)
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build:all
```

## Usage

### Using Agents

```javascript
// Architecture design
Task(subagent_type="system-architect", prompt="ECサイトのアーキテクチャを設計して")

// Backend implementation
Task(subagent_type="backend-developer", prompt="ユーザー認証APIを実装して")

// Code review (0-100 scoring)
Task(subagent_type="code-reviewer", prompt="このPRをレビューして")

// Auto-select optimal agent
Task(subagent_type="ait42-coordinator", prompt="ユーザー認証機能を設計・実装して")
```

### Using Skills

```bash
# Sales letter
/sales-letter --product "オンライン講座"

# LP analysis
/lp-analysis https://example.com

# Security scan
/security-scan-trivy

# Daily observability report
npm run obs:report:daily
```

### Monitoring Stack

```bash
# Start monitoring (Prometheus, Grafana, Loki)
make monitoring-up

# Start ops tools (Gotenberg, PDF)
make tools-up

# Start scheduled jobs daemon
docker compose -f docker-compose.ops.yml --profile ops-scheduler up -d
```

## Project Structure

```
taisun_agent/
├── src/
│   └── proxy-mcp/              # Proxy MCP Server (11.2K LOC)
│       ├── server.ts           # MCP server entry
│       ├── tools/              # Public tools (system, skill, memory)
│       ├── memory/             # Memory service & storage
│       ├── router/             # Hybrid router engine
│       ├── internal/           # Circuit breaker, resilience
│       ├── browser/            # Chrome/CDP integration
│       ├── skillize/           # URL→Skill generation
│       ├── supervisor/         # GitHub workflow integration
│       ├── ops/                # Schedule, incidents, digest
│       └── observability/      # Event tracking & metrics
│
├── .claude/                    # Agent system
│   ├── agents/                 # 82 agent definitions
│   ├── skills/                 # 77 skill definitions
│   ├── commands/               # 82 command shortcuts
│   ├── mcp-servers/            # 4 custom MCP servers
│   ├── mcp-tools/              # 227 MCP tools
│   └── memory/                 # Learning & statistics
│
├── config/
│   └── proxy-mcp/              # MCP configuration
│       ├── internal-mcps.json  # MCP registry
│       ├── ops-schedule.json   # Scheduled jobs
│       └── incidents.json      # Incident tracking
│
├── docs/                       # Documentation (30+ files)
│   ├── ARCHITECTURE.md
│   ├── DEVELOPER_GUIDE.md
│   ├── API_REFERENCE.md
│   ├── OPERATIONS.md
│   └── third-agent/            # Advanced docs
│
├── tests/
│   ├── unit/                   # 22 unit test files
│   └── integration/            # 5 integration suites
│
├── docker-compose.monitoring.yml  # Prometheus/Grafana/Loki
├── docker-compose.tools.yml       # Document processing
└── docker-compose.ops.yml         # Operations environment
```

## Quality Gates

| Metric | Requirement | Current |
|--------|-------------|---------|
| Test Coverage | 80%+ | 80%+ |
| Code Review Score | 80+ | 80+ |
| Security Scan | Zero Critical/High | Zero |
| P0/P1 Bugs | Zero | Zero |

## NPM Scripts

```bash
# TAISUN Diagnostics (推奨)
npm run taisun:diagnose       # 13層防御・全コンポーネント診断
npm run taisun:diagnose:full  # 詳細診断
npm run taisun:setup          # セットアップガイド表示

# Development
npm run dev                    # Watch mode
npm test                       # Run all tests
npm run lint                   # ESLint
npm run typecheck              # TypeScript check

# Building
npm run proxy:build           # Build proxy MCP
npm run scripts:build         # Build scripts
npm run build:all             # Full build

# Operations
npm run obs:report:daily      # Daily observability report
npm run obs:report:weekly     # Weekly report
npm run ops:schedule:status   # Check scheduled jobs

# Utilities
npm run agents:list           # List available agents
npm run skills:list           # List available skills
npm run proxy:smoke           # MCP smoke test
```

## Documentation

### Getting Started

| Document | Description |
|----------|-------------|
| [QUICK_START.md](docs/QUICK_START.md) | 5分クイックスタート |
| [BEGINNERS_PROMPT_GUIDE.md](docs/BEGINNERS_PROMPT_GUIDE.md) | 初心者向けフレーズ集 ⭐ |
| [CONFIG.md](docs/CONFIG.md) | 設定ガイド |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | トラブルシューティング |
| [getting-started-ja.md](docs/getting-started-ja.md) | 日本語セットアップガイド |

### Development

| Document | Description |
|----------|-------------|
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | コントリビューションガイド |
| [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | 開発者ガイド |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | システムアーキテクチャ |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | API リファレンス |

### Operations

| Document | Description |
|----------|-------------|
| [OPERATIONS.md](docs/OPERATIONS.md) | 運用ガイド |
| [RUNBOOK.md](docs/RUNBOOK.md) | ランブック |
| [SECURITY.md](docs/SECURITY.md) | セキュリティポリシー |
| [CHANGELOG.md](docs/CHANGELOG.md) | 変更履歴 |

## Technology Stack

| Category | Technologies |
|----------|--------------|
| **Runtime** | Node.js 18+, TypeScript 5.3+ |
| **Testing** | Jest 29.7 |
| **MCP** | @modelcontextprotocol/sdk 1.0 |
| **AI** | Anthropic SDK, LangChain |
| **Browser** | Playwright Core 1.57 |
| **Monitoring** | Prometheus, Grafana, Loki |
| **Infrastructure** | Docker, n8n |

## Contributing

詳細は [CONTRIBUTING.md](docs/CONTRIBUTING.md) を参照してください。

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Support

- Issues: [GitHub Issues](https://github.com/san15/taisun_agent/issues)
- Documentation: [docs/](docs/)

---

Built with [Claude Code](https://claude.ai/code)
