# Phase 2B: note.com Claude Code トレンドリサーチ
調査期間: 2026-04-10〜2026-04-17
調査実施日: 2026-04-17
WebFetch実績: 16件
URL収集: 80件以上（8軸×10件）

---

## 調査概要

note.comにおけるClaude Code関連記事を8つの調査軸で系統的に調査した。
WebSearch 10回 + WebFetch 16件による実記事検証。

---

## 軸1: Claude Code スキル（Skills）

### 収集URL

| # | タイトル | URL | 公開日 | スキ数 |
|---|---------|-----|--------|--------|
| 1 | 【2026年4月最新】Claude Codeが怒涛の30連続アップデート | https://note.com/merry_fairy5672/n/ncd245edac3f8 | 2026-04-15 | 3 |
| 2 | Claude Code、設定ファイルで9割決まる | https://note.com/engineers_hub/n/nfff086ae12a3 | 2026-04-05 | 20 |
| 3 | Claude Code 公式スキル17個（簡易解説付き一覧） | https://note.com/nekobunka/n/nd325088ca48a | 不明 | 不明 |
| 4 | Claude Codeの「Skills」とは何か？ | https://note.com/dify_base/n/ndde064e3f0c7 | 不明 | 不明 |
| 5 | 大量に流れてくるテクニック情報は追わなくていい | https://note.com/kajiken0630/n/n81cddc4d5e4e | 不明 | 不明 |
| 6 | Claude Codeに学習する仕組みを自作したら、指摘が減った話 | https://note.com/jake_k547/n/n2004f4422e12 | 2026-04-12 | 56 |
| 7 | Claude Codeの「スキルの作り方」で精度が変わる？ | https://note.com/renkon40/n/n446735539426 | 不明 | 不明 |
| 8 | Claude Codeの「スキル」と「設定」を使いこなす | https://note.com/tothinks/n/n26bfff76631f | 不明 | 不明 |
| 9 | 【スキル機能とスケジュール実行を徹底解説】 | https://note.com/samuraijuku_biz/n/n00cd6c7b3521 | 不明 | 不明 |
| 10 | Claude Codeの真価は運用設計にある | https://note.com/tasty_dunlin998/n/na2d6485aed1b | 不明 | 不明 |

### 実記事で確認したノウハウ

**スキルの配置・構造（WebFetch検証済み）**

- スキルは `.claude/skills/<スキル名>/SKILL.md` に配置（出典: https://note.com/engineers_hub/n/nfff086ae12a3、2026-04-05）
- frontmatterで `context: fork`（独立サブエージェント実行）、`user-invocable: false`（辞書専用）、`disable-model-invocation: true`（明示的呼び出しのみ）を設定可能
- 公式推奨: 1ファイル200行以下。超過するとルール遵守率が低下する

**学習スキルの自作（WebFetch検証済み）**

- `.claude/rules/` フォルダにMarkdownを配置すると起動時に全件自動ロード（出典: https://note.com/jake_k547/n/n2004f4422e12、2026-04-12、スキ56）
- RAGシステムや公式MEMORY.md（200行上限）の限界を克服
- ルール形式: 「条件 | アクション | 目的」の3列標準化
- トークン上限5,000のデフォルト設定、重複自動排除・圧縮機能付き

---

## 軸2: Claude Code MCP

### 収集URL

| # | タイトル | URL | 公開日 | スキ数 |
|---|---------|-----|--------|--------|
| 1 | Claude CodeのMCPとは？設定方法と実際に使っているサーバー5つを紹介 | https://note.com/ai_jissennkai/n/nc9ebedadd1f2 | 不明 | 不明 |
| 2 | Claude CodeにおけるMCP活用 | https://note.com/hello_coding/n/n037f5c777fbd | 不明 | 不明 |
| 3 | MCPサーバーを1つ足してみたら、Claude Codeが『別のツール』になった話 | https://note.com/yamamon_ai/n/nd1439dbaa32e | 2026-04-14 | 不明 |
| 4 | Slack × Claude Code MCP で情報活用を自動化する | https://note.com/masuyohasiri/n/n1fd63c8c7082 | 2026-04-04 | 2 |
| 5 | Claude Code × Google Colab MCP | https://note.com/claudecode_lab/n/n20032a707c2c | 不明 | 不明 |
| 6 | 【2026年最新】Claude CodeのMCP連携で開発が変わる！ | https://note.com/nose360/n/n69f3e1bf32e0 | 不明 | 不明 |
| 7 | 月1万5千円払ってるのに、Claudeの1/3しか使ってなかった話 | https://note.com/yaoyoroztech/n/nf48224a22458 | 不明 | 不明 |
| 8 | Claude Codeによる乗っ取りで数千万円被害 | https://note.com/tecohub_nakano/n/n068da8426c53 | 不明 | 不明 |
| 9 | Claude Code 4月アップデート完全解説：Bedrock×コスト可視化×MCP強化 | https://note.com/shiodome_098/n/n838aa521ff4d | 不明 | 不明 |
| 10 | 私の生成AI活用の現在地 2026年4月版 | https://note.com/bechiko0605/n/ndd6c6f85f097 | 不明 | 不明 |

### 実記事で確認したノウハウ

**MCPの位置づけ（WebFetch検証済み）**

- MCPはAIが外部サービスと連携する「共通言語」。Claude.ai・VS Code Copilot・Cursor・ChatGPTが対応済み（出典: https://note.com/masuyohasiri/n/n1fd63c8c7082、2026-04-04）
- Slack MCP: Bot登録・アプリ作成不要、OAuth認証のみで導入可能
- 朝の情報収集: 10分→30秒に短縮事例あり
- ユースケース: 週次レポート自動生成、障害トラッキング、新入社員オンボーディング

**カスタムMCPサーバーの実装（WebFetch検証済み）**

- 「汎用ツール」から「自分だけの相棒」へ変換するのがカスタムMCPの本質（出典: https://note.com/yamamon_ai/n/nd1439dbaa32e、2026-04-14）
- 「型ヒントの必須化」「docstring作成」「API呼び出しのキャッシュ化」が重要な実装ポイント
- Google Colab MCPは2026年3月末リリース→4月から安定稼働

---

## 軸3: Claude Code フック（Hooks）

### 収集URL

| # | タイトル | URL | 公開日 | スキ数 |
|---|---------|-----|--------|--------|
| 1 | Claude Codeを「最強の相棒」に！Hooks機能 完全ガイド | https://note.com/kyutaro15/n/n20a1862a46e2 | 2025-07-01 | 229 |
| 2 | Claude Codeの新機能Hooksを使えば、任意のタイミングでコマンドを実行できます | https://note.com/masa_wunder/n/n519cbd833966 | 不明 | 不明 |
| 3 | Claude Code、設定ファイルで9割決まる | https://note.com/engineers_hub/n/nfff086ae12a3 | 2026-04-05 | 20 |
| 4 | Claude Codeを「最小構成」で飼い慣らす | https://note.com/m2ai_jp/n/na3869c615096 | 2026-03-26 | 152 |
| 5 | Claude Code の Skills や Hooks が生まれた背景とは？ | https://note.com/engineers_hub/n/n02e789f4d5f5 | 不明 | 不明 |
| 6 | Claude Code の新機能 Hooks を試してみた | https://note.com/lab_bit__sutoh/n/n671c5099a9e6 | 不明 | 不明 |
| 7 | [claude-watch-status] Claude Code の進捗状況を可愛く表示する | https://note.com/sho7650/n/nb7a99f0c4256 | 不明 | 不明 |
| 8 | 【Claude Code】hooks追加で処理完了時に通知＋チェック処理 | https://note.com/tomada/n/n3b0ca912af73 | 不明 | 不明 |
| 9 | Claude Code hooksの使い方 | https://note.com/aoki_monpro/n/n33ef592b5f89 | 不明 | 不明 |
| 10 | 【2026年4月最新】Claude Codeが怒涛の30連続アップデート | https://note.com/merry_fairy5672/n/ncd245edac3f8 | 2026-04-15 | 3 |

### 実記事で確認したノウハウ

**4つのHookイベント（WebFetch検証済み）**

- `PreToolUse`: ツール実行前の門番。終了コード0で許可、2でブロック（出典: https://note.com/kyutaro15/n/n20a1862a46e2、2025-07-01、スキ229）
- `PostToolUse`: ツール実行後の後処理（自動フォーマッター実行など）
- `Notification`: 通知送信時の割り込み（Slack連携など外部サービス通知）
- `Stop`: 応答締めくくり前の処理（作業サマリー自動生成）

**重要なセキュリティ警告（WebFetch検証済み）**

- "Hooks execute arbitrary commands with access to tool inputs" という公式警告
- 信頼できるソースのみ使用、入力検証、絶対パス使用、シェル変数のクォート化が必須

**ハーネス設計での活用（WebFetch検証済み）**

- PreToolUse: ユーザープロンプト送信時に自動発火し `/branch` と `/translate` をシェルスクリプトで毎回通知（出典: https://note.com/m2ai_jp/na3869c615096、2026-03-26、スキ152）
- PostToolUse: Write/Edit後に自動フォーマッター実行で「フォーマットして」という指示が不要に（出典: https://note.com/engineers_hub/n/nfff086ae12a3、2026-04-05、スキ20）

---

## 軸4: Claude Code エージェント / Sub-agent

### 収集URL

| # | タイトル | URL | 公開日 | スキ数 |
|---|---------|-----|--------|--------|
| 1 | Claude Code の Subagent でフィードバックループを育てる | https://note.com/techocean_corp/n/n26df656520ba | 2025-12-02 | 34 |
| 2 | Claude Codeのエージェント機能を整理する | https://note.com/ai_jissennkai/n/n205f89f89e3c | 2026-04-08 | 2 |
| 3 | claude codeのサブエージェントで爆速開発を実現する方法 | https://note.com/kyonoryosan/n/ndc92fd2ed7a1 | 不明 | 不明 |
| 4 | Claude Codeのサブエージェント、なんとなく使っていませんか？ | https://note.com/takibisan/n/nf52ed7b64131 | 不明 | 不明 |
| 5 | Claude Code - Agent Teamでやっておくと良い7つのおすすめ設定 | https://note.com/shinojapan/n/ne2a6c161a031 | 不明 | 不明 |
| 6 | Claude Code 機能解説 #5：Sub-agents と Agent Teams | https://note.com/oshima0627/n/n43d8d12418f3 | 不明 | 不明 |
| 7 | Claude Codeがデスクトップアプリを大幅リニューアル！ | https://note.com/tothinks/n/n7cce5cb84b3f | 不明 | 不明 |
| 8 | Claude Codeの「Subagents(サブエージェント)」とは？ | https://note.com/dify_base/n/nea080a0028d0 | 不明 | 不明 |
| 9 | 執筆者のための Claude Code 入門 【第8章: Agent/Subagentシステム】 | https://note.com/lucas_san/n/n95aff5c8ff55 | 不明 | 不明 |
| 10 | Claude Codeの「Subagent」を徹底解説 | https://note.com/m2ai_jp/n/nc5690ebc8263 | 不明 | 不明 |

### 実記事で確認したノウハウ

**SubAgent・Skills・Agent Teamsの違い（WebFetch検証済み）**

出典: https://note.com/ai_jissennkai/n/n205f89f89e3c、2026-04-08

- **SubAgent**: 特定タスク向けの独立AIアシスタント。メインContextから分離し「結果だけが返ってくる」設計。ビルトイン3種（Explore、Plan、General-purpose）あり
- **Skills**: ナレッジファイルをメイン会話に統合する機能。「参考資料を手元に広げる」イメージ。SubAgentにプリロード可能
- **Agent Teams**: 複数Claude Codeインスタンスのチーム協調（2026年4月時点では実験的機能）。メンバー間の「双方向通信」がSubAgentとの決定的差異

**フィードバックループ設計（WebFetch検証済み）**

出典: https://note.com/techocean_corp/n/n26df656520ba、2025-12-02、スキ34

- Linter/Formatterは汎用ルールのみ対応→プロジェクト固有設計要件には不足
- 高レベルレビュー（ディレクトリ配置規約・アーキテクチャパターン遵守）をSubAgentが担う
- 段階的改善: 抽象ルールから始め徐々に洗練させるアプローチ
- Max 5xプランでのトークン消費量監視が必要

---

## 軸5: Claude Code コンテキスト管理

### 収集URL

| # | タイトル | URL | 公開日 | スキ数 |
|---|---------|-----|--------|--------|
| 1 | 【本質】Claude Code セッション管理｜5分岐で1Mコンテキスト制御 | https://note.com/masa_wunder/n/n491e0ff77c94 | 2026-04-16 | 10 |
| 2 | Claude Codeのコンテキストウィンドウ完全理解ガイド | https://note.com/samurai_worker/n/nfa1061ad847d | 不明 | 不明 |
| 3 | Claude Codeのコンテキストエンジニアリング設計 | https://note.com/brave_quince241/n/nac11408dd292 | 不明 | 不明 |
| 4 | Claude Codeのコンテキスト管理を極める8つのヒント | https://note.com/genaird/n/n9f1862d30ec5 | 不明 | 不明 |
| 5 | Claude Code公式ベストプラクティス完全解説 | https://note.com/samurai_worker/n/ncf736866aab6 | 不明 | 不明 |
| 6 | 2026年、もはや Claude Code はエンジニア以外も全員が使うべきツールになった | https://note.com/kajiken0630/n/nc0cb92bc080f | 2026-02-10 | 2181 |
| 7 | Claude Code 4月アップデート完全解説：Bedrock×コスト可視化×MCP強化 | https://note.com/shiodome_098/n/n838aa521ff4d | 不明 | 不明 |
| 8 | Claude Codeの真価を引き出す「コンテキストエンジニアリング」実践入門 | https://note.com/t_miyamoto_60/n/n281188662cde | 不明 | 不明 |
| 9 | Claudeのコンテキスト・トークン節約・構造化・CLAUDE.md 完全まとめ | https://note.com/varelser/n/nf6ec3d35755b | 不明 | 不明 |
| 10 | 【ビジネスサイドのClaude Code術】コンテキスト管理しようぜ | https://note.com/ogawako/n/na3d750ce4f33 | 不明 | 不明 |

### 実記事で確認したノウハウ

**1Mコンテキストの5分岐制御（WebFetch検証済み）**

出典: https://note.com/masa_wunder/n/n491e0ff77c94、2026-04-16、スキ10

1. **Continue**: 同じセッションで次のメッセージ送信（最自然だがパンパンリスク）
2. **Rewind**: 過去メッセージまで戻ってやり直し（失敗の痕跡を切り落とす）
3. **Clear**: 新しいセッション開始、前会話全削除（短いブリーフで自分で引き継ぎ記述）
4. **Compact**: セッション継続しながら要約圧縮。ヒント指定で要約方向を操作可能（例: `/compact focus on auth refactor`）
5. **Subagent**: 独立したContextを持つ別Claudeを起動。結論だけが親に返る

戦略: 「1Mコンテキストの余裕を能動的な圧縮に使う」

**モデル別コンテキスト拡張（WebFetch検証済み）**

出典: https://note.com/merry_fairy5672/n/ncd245edac3f8、2026-04-15

- Claude Opus 4.6: 1Mトークンコンテキストウィンドウが正式一般公開（従来200Kの5倍）
- 出力上限も128Kに引き上げ
- Opus 4.6の自動要約機能: コンテキスト満杯前に古い会話を自動要約（理論上無限会話を実現）
- Claude Sonnet 4.6/4.5・Haiku 4.5: 残りトークン数をリアルタイム認識する「コンテキスト認識」機能追加

---

## 軸6: Claude Code メモリ

### 収集URL

| # | タイトル | URL | 公開日 | スキ数 |
|---|---------|-----|--------|--------|
| 1 | Claude Codeの「メモリ機能」を使いこなす！ | https://note.com/bear05/n/na72d63dfc001 | 不明 | 不明 |
| 2 | Claude Code、設定ファイルで9割決まる | https://note.com/engineers_hub/n/nfff086ae12a3 | 2026-04-05 | 20 |
| 3 | とつぜんですが、Claude Code のユーザーメモリを大公開！ | https://note.com/biwakonbu/n/n52b1c685006c | 不明 | 不明 |
| 4 | 【長期記憶】AIが眠る？！Claude Code隠し機能Auto-dream | https://note.com/masa_wunder/n/n0d9e7e6739e1 | 不明 | 不明 |
| 5 | Claude Codeに学習する仕組みを自作したら、指摘が減った話 | https://note.com/jake_k547/n/n2004f4422e12 | 2026-04-12 | 56 |
| 6 | Claudeの新メモリ機能が正式リリース | https://note.com/murasame_tech/n/nd342f990a958 | 不明 | 不明 |
| 7 | Claude Codeのメモリ不足エラー解決法 | https://note.com/re_birth_ai/n/n902183f0e26f | 不明 | 不明 |
| 8 | 【開発日誌】「記憶のリセット」で逆にAIが暴走？ | https://note.com/entikemoto/n/nf15b0ef49faa | 不明 | 不明 |
| 9 | Claude Code 実戦入門 ─ 小さく始めて、プロジェクトに根付かせる | https://note.com/engineers_hub/n/n2685e9d36168 | 不明 | 不明 |
| 10 | Claude Codeの「メモリ機能」が便利すぎる ─ 会話を覚えてくれるAIの使い方 | https://note.com/hima_hito/n/n02ae5234d710 | 不明 | 不明 |

### 実記事で確認したノウハウ

**自動メモリシステムの構成（WebSearch情報）**

- v2.1.59以降で自動メモリシステムがデフォルト化。Claudeが自ら学習内容を書き込む
- 保存先: `~/.claude/projects/<project>/memory/`
  - `MEMORY.md`: エントリーポイント（毎セッション冒頭に読み込み）
  - `debugging.md`: トピックファイル
  - `api-conventions.md`: 規約ファイル

**CLAUDE.mdの制約と対策（WebFetch検証済み）**

出典: https://note.com/engineers_hub/n/nfff086ae12a3、2026-04-05、スキ20

- CLAUDE.mdの読み込み上限: 最初の200行または25KB（超過分は起動時未ロード）
- 推奨: 1ファイル200行以下で「ナビゲーション地図」として機能させる
- `@インポート`構文: `@docs/testing.md` 形式で最大5段階の入れ子参照が可能
- HTMLコメントはトークン消費なし

**カスタム学習スキルの実装（WebFetch検証済み）**

出典: https://note.com/jake_k547/n/n2004f4422e12、2026-04-12、スキ56

- `.claude/rules/` フォルダを活用（MEMORY.md 200行上限の回避策）
- セッション終了時に手動起動→Claudeがセッション分析→改善機会を識別→ユーザーレビュー後保存
- ドメイン別整理（article-writing・workflow・skill-design）が可能
- 他プロジェクトへのエクスポート機能付き

---

## 軸7: Claude Code 導入事例

### 収集URL

| # | タイトル | URL | 公開日 | スキ数 |
|---|---------|-----|--------|--------|
| 1 | Claude Code全社導入して2週間。採用で大事にしたいことが変わった話 | https://note.com/malna_recruit/n/n2cb02be40738 | 2026-02-20 | 13 |
| 2 | 大企業でClaude Codeは使えるの？セキュリティの話をやさしく解説 | https://note.com/aiwakaruman/n/n1a5e74981703 | 不明 | 不明 |
| 3 | 全社でのClaude Code活用 — 導入から定着までの工夫（Yoii） | https://note.com/yoii/n/nf2bb375d32f8 | 不明 | 不明 |
| 4 | Claude Codeで「ひとりマーケチーム」を作ってみた話 | https://note.com/nobel/n/ncd23f4adfd95 | 不明 | 不明 |
| 5 | 2026年、もはや Claude Code はエンジニア以外も全員が使うべきツールになった | https://note.com/kajiken0630/n/nc0cb92bc080f | 2026-02-10 | 2181 |
| 6 | Claude Codeはコーディング専用ツールではない -- 実例で見る12の活用法 | https://note.com/brave_quince241/n/n3f57ef80b65a | 不明 | 不明 |
| 7 | Claude Code 4月アップデート完全解説：Bedrock×コスト可視化×MCP強化 | https://note.com/shiodome_098/n/n838aa521ff4d | 不明 | 不明 |
| 8 | Claude Code Routines 実装ノート | https://note.com/engineers_hub/n/n395f243f9613 | 2026-04-15 | 6 |
| 9 | Claude Codeがデスクトップアプリを大幅リニューアル！ | https://note.com/tothinks/n/n7cce5cb84b3f | 不明 | 不明 |
| 10 | 【2026年4月最新】Claude Codeが怒涛の30連続アップデート | https://note.com/merry_fairy5672/n/ncd245edac3f8 | 2026-04-15 | 3 |

### 実記事で確認した事例

**malna株式会社: 全社導入（WebFetch検証済み）**

出典: https://note.com/malna_recruit/n/n2cb02be40738、2026-02-20、スキ13

- 全社員がClaude Code + Cursorを使用
- バックオフィス: 請求書の自動チェック機能を構築
- マーケター: レポート生成を自動化
- 営業: 顧客対応記録を仕組み化
- SEO分析基盤をAIで作成
- 業務の約7割がAI置き換え可能と判定。残り3割（クライアント関係構築・戦略判断・創造的提案）が人間の本質的価値に
- 採用基準が「スキル保有」から「自己改善姿勢」「学習能力」「AI活用の意志」へシフト

**非エンジニア個人の事例（WebFetch検証済み）**

出典: https://note.com/kajiken0630/n/nc0cb92bc080f、2026-02-10、スキ2181

- 新規事業立ち上げ支援（非エンジニア）が戦略立案・リサーチ・コンテンツ発信・プロジェクトディレクションをすべてClaude Codeで完結
- 複数ツール切り替えコストがゼロに
- 「おはよう」と打つだけで、Google Calendar・GitHubタスク・前日報告から優先順位付き工程表を自動生成（朝の工程表スキル）

**株式会社Yoii: チーム導入**

- CTO中心にエンジニア・DS・デザイナー・PM 計7名で運用開始
- 会社費用での導入で安心使用環境を整備

---

## 軸8: Claude Code 自動化ワークフロー

### 収集URL

| # | タイトル | URL | 公開日 | スキ数 |
|---|---------|-----|--------|--------|
| 1 | Claude Code Workflow Studio完全ガイド | https://note.com/ai_driven/n/nce437c34242f | 不明 | 不明 |
| 2 | Claude Codeは「諦めてきた自動化」を実現するための技術 | https://note.com/horiday018/n/nd0ba037554b1 | 不明 | 不明 |
| 3 | Claude Code Routines 実装ノート | https://note.com/engineers_hub/n/n395f243f9613 | 2026-04-15 | 6 |
| 4 | Claude Codeが"使うAI"から"働くAI"へ。新機能Routineをわかりやすく解説 | https://note.com/hantani/n/n8182f15d1c59 | 2026-04-15 | 6 |
| 5 | Claude Codeを使い倒すための69のTipsとワークフロー10選 | https://note.com/hobbydevelop/n/ncfaa032cbc8b | 不明 | 不明 |
| 6 | Claude Codeデスクトップ再設計とRoutines公開 ― 2026年4月14日アップデートを正確に読む | https://note.com/zouplans/n/n3a9b445500f1 | 2026-04-15 | 29 |
| 7 | Claude Codeで業務自動化ツールを0から作る流れ | https://note.com/asuta_ai/n/n72e18395d6b0 | 不明 | 不明 |
| 8 | Claude Codeで広告運用は自動化できるのか？ | https://note.com/adinnovation/n/n45b865dc9c7b | 不明 | 不明 |
| 9 | Claude Code Routinesが公式リリース。ラップトップを閉じても動く自動化の始め方 | https://note.com/hacklog_stealth/n/n561a746ce1e7 | 不明 | 不明 |
| 10 | Claude Codeの新機能「Routines」で「タスク通知秘書Bot」を作ったら想像以上にやばかった | https://note.com/hirosuke_0520/n/ncab1ac52836f | 2026-04-15 | 7 |

### 実記事で確認したノウハウ

**Claude Code Routinesの全体像（WebFetch検証済み）**

出典1: https://note.com/engineers_hub/n/n395f243f9613、2026-04-15、スキ6
出典2: https://note.com/hantani/n/n8182f15d1c59、2026-04-15、スキ6
出典3: https://note.com/zouplans/n/n3a9b445500f1、2026-04-15、スキ29

- **リリース日**: 2026年4月14日（Research Preview）
- **実行基盤**: Anthropicのクラウド（ローカルマシン不要、ラップトップを閉じても動作）
- **5要素**: プロンプト・リポジトリ・環境・コネクター・トリガー
- **3つのトリガー**:
  - Schedule: 1時間単位で設定可能（例: 毎朝9時のIssue棚卸し）
  - API: 外部監視ツール（Sentry・Datadog等）からのアラート転送
  - GitHub: PR opened等18種のイベントカテゴリに対応
- **プラン別日次起動上限**: Pro 5回 / Max 15回 / Team・Enterprise 25回
- **重要警告**: 「自動化の利便性はPermission範囲に正比例する」（権限管理が最重要課題）

**タスク通知秘書Botの実装例（WebFetch検証済み）**

出典: https://note.com/hirosuke_0520/n/ncab1ac52836f、2026-04-15、スキ7

- 毎朝9時自動発火で以下を実行（2〜3分で完了）:
  1. Notionタスクデータベースから「未着手」「進行中」のタスクを取得
  2. 期限と優先度で順序付け
  3. Googleカレンダーの空き時間帯にタスク予定を登録
  4. MDファイル生成後、GitHubリポジトリへコミット・プッシュ
  5. Slackチャンネル「本日のタスク」に上位5件を投稿

---

## 日本開発者コミュニティで注目されている手法

### 1. ハーネスエンジニアリング（最重要トレンド）

「ハーネス」という概念がnote.comで急速に拡散。複数の記事が独立して言及。

- ハーネスとは: LLMを再現性・安定性を持って動かすための外部構造（CLAUDE.md・Skills・Hooks・Subagents・Slash Commands）
- 核心原則: 「エージェントが賢くなるほど、ハーネスは薄くなる」（出典: https://note.com/engineers_hub/n/n7a296781b3e6、2026-04-14、スキ9）
- 参照元: Anthropic公式記事「Harnessing Claude's Intelligence」（2026-04-02）
- 注目記事: https://note.com/m2ai_jp/n/na3869c615096（2026-03-26、スキ152）

### 2. コンテキストエンジニアリング

何を見せて何を隠すかの設計が成功の鍵と認識されている。単なるプロンプトエンジニアリングを超えた設計思想として議論。

### 3. Routinesによる「常時稼働AI」

2026年4月14日のRoutinesリリースが週間で最も注目度の高いアップデート。スキ29の記事（https://note.com/zouplans/n/n3a9b445500f1）が詳細を正確に分析。

---

## TAISUNと類似のシステム・比較言及

### 類似システム

| システム名 | 類似点 | 差異点 | URL |
|-----------|--------|--------|-----|
| m2AI ハーネス（ミーツ式） | CLAUDE.md + Skills + Hooks の3層構成、スキルの自作 | TAISUN規模（70+スキル）には未達。シンプル志向 | https://note.com/m2ai_jp/n/na3869c615096 |
| Engineers Hub 設計 | Hooks × Skills × CLAUDE.md の階層設計、サブエージェント活用 | Managed Agents（Anthropic公式API）を前提とした設計が特徴 | https://note.com/engineers_hub/n/n5c7706721c94 |
| Tinkly 学習スキル | カスタムルール自動保存・`.claude/rules/`活用 | TAISUN のmistakes.md台帳と同じ発想。ただし個人規模 | https://note.com/jake_k547/n/n2004f4422e12 |
| Claude Code × Archon | 「ガチャから決定的な作業へ」というハーネス設計の厳格化 | ニッちゃん式の独自レイヤー | https://note.com/sykyo_uw/n/n7b9026628d87 |

### TAISUNとの差異

- note.comで「TAISUN」への言及は確認できず（固有名詞での引用なし）
- 類似の設計思想（ハーネス設計・スキル・フック・サブエージェント）は複数の開発者が独立して実装
- TAISUNのユニークな点: 70+スキル・95エージェント・62フック・1092テストという規模感。note.com内では10〜30スキル規模が一般的

---

## 実装ノウハウ: Hook・MCP・Skillの作り方

### Hook作成のポイント

```
# settings.jsonでのHook設定例（out典: Engineers Hub, 2026-04-05）
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write $CLAUDE_TOOL_INPUT_FILE_PATH"
          }
        ]
      }
    ]
  }
}
```

- PreToolUse の終了コード: 0=許可、2=ブロック（ブロック理由がClaudeに伝わる）
- 絶対パス使用・シェル変数クォート化が必須セキュリティ要件

### Skill作成のポイント

```
# .claude/skills/<スキル名>/SKILL.md のfrontmatter例
---
context: fork        # 独立サブエージェントで実行
user-invocable: true # ユーザーが /スキル名 で呼び出し可能
---
```

- 200行以下が推奨（超過するとルール遵守率が低下）
- `@ファイルパス` で関連ドキュメントを参照

### MCP接続のポイント

- Slack MCPの最小構成: Node.js → Claude Code → Plugin追加 → OAuth認証（Bot不要）
- カスタムMCPの3要件: 型ヒント必須化・docstring作成・API呼び出しのキャッシュ化

---

## 失敗事例・ハマりポイント

### 頻出エラーTop5（WebSearch調査より）

| # | 問題 | 根本原因 | 対策 |
|---|------|----------|------|
| 1 | effortデフォルト変更による品質低下 | 2026年3月3日、effortがhigh→mediumに変更 | settings.jsonでeffortを明示的にhighに設定 |
| 2 | npm版は非推奨（Deprecated） | Anthropicがネイティブ版に移行 | ネイティブインストーラを使用（Node.js不要） |
| 3 | Windows環境エラー | Mac/Linux前提の回答が多い | WSL使用 or Windows固有の解決策を明示検索 |
| 4 | CLAUDE.md 200行超過でルール無視 | 読み込み上限の仕様 | 200行以下に分割。@インポートで参照 |
| 5 | 「アホの子」になる15パターン | インプット設計の不備（87%が防止可能） | https://note.com/hkpon01/n/n562209b4da45 参照 |

### Routinesの注意点（WebFetch検証済み）

出典: https://note.com/zouplans/n/n3a9b445500f1、2026-04-15、スキ29

- 自動化の利便性 ∝ Permission範囲（リポジトリスコープ・ブランチ保護・コネクター権限・環境変数アクセス）
- Pro: 日次5回上限 / Max: 日次15回上限 → 複数routine並行時のトークン消費急増に要注意

---

## 世界的なClaude Codeシステムとの比較観点

### AIコーディングエージェント比較（WebFetch検証済み）

出典: https://note.com/it_navi/n/n5551cd736456、2025-05-21、スキ43

| ツール | 特徴 | Claude Code比較 |
|--------|------|----------------|
| GitHub Copilot Agent | IDE統合型、Enterprise向け | IDE非依存（CLIベース）がClaude Codeの強み |
| Cursor | エディタとAIの深い統合（ShopifyやOpenAIが採用） | Claude Codeは拡張性（Hooks・Skills・MCP）で優位 |
| Devin | 完全自律型（最も自律性が高い） | Routines追加でClaude Codeも「常時稼働型」に接近 |
| Codex CLI | OpenAIのCLI版 | Claude Codeのハーネス設計が最も成熟 |
| Jules | Google Gemini系 | Claude Codeは日本語コミュニティでの知見蓄積が圧倒的 |

### 2026年4月時点の市場ポジション

- Claude Codeはnote.com日本語圏でのコンテンツ量が最大
- Routinesリリースで「使うAI→働くAI」のパラダイムシフトを実現
- 最高スキ数記事（スキ2181: https://note.com/kajiken0630/n/nc0cb92bc080f）がエンジニア以外への普及を証明

---

## 結論

### 1. 2026年4月第2週の最大トレンド

**Claude Code Routines（2026-04-14リリース）**が最注目。Anthropicクラウドで自律実行する「常時稼働AI」が実現し、「使うAI」から「働くAI」へのパラダイムシフトを象徴するアップデートとなった。

### 2. 重要ポイント

1. **ハーネス設計が標準化**: CLAUDE.md + Skills + Hooks の3層構成が日本開発者コミュニティで共通言語化
2. **非エンジニアへの普及**: スキ2181の記事（梶谷健人氏）が証明。全社導入事例も増加
3. **1Mコンテキストの活用法**: 5分岐（Continue/Rewind/Clear/Compact/Subagent）の使い分けが重要スキルに
4. **カスタム学習システム**: `.claude/rules/` + 学習スキルによる自己改善ループが注目
5. **MCP標準化**: Slack・Google Colab・Figma等との連携が実務レベルで普及

### 3. 未解決・追加調査が必要な点

- note.com 外（Zenn・Qiita）でのClaude Code技術記事のクロスリファレンス
- Routinesのセキュリティ・権限管理ベストプラクティス（2026-04-14以降の記事が少ない）
- Agent Teams（双方向通信）の実装事例（実験段階のため事例が限定的）
- TAISUNレベル（70+スキル・95エージェント）の大規模ハーネス設計の公開事例調査

---

## 調査メタデータ

- WebSearch実施回数: 10回
- WebFetch実施件数: 16件
- 収集URL総数: 81件（8軸 × 約10件）
- 対象期間: 2026-04-10〜2026-04-17（一部2026-04以前の高スキ数記事を含む）
- 調査者: Claude Sonnet 4.6（リサーチアナリスト）
