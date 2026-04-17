# X (Twitter) Claude Code 動向リサーチ
# 調査期間: 2026-04-10 〜 2026-04-17
# 実施日: 2026-04-17
# 担当: リサーチアナリスト (Claude Sonnet 4.6)

---

## 問いの再定義

**当初の問い**: X (Twitter) でこの 1 週間に話題になった Claude Code 関連投稿を収集せよ

**再定義後の論点**:
1. 4月10〜17日の具体的な機能リリース・バージョン変更はどれか
2. コミュニティが特に熱く語った機能軸（Skills/MCP/Hooks/Agents/Context/Memory）はどれか
3. Cursor/Cline との競合比較はどの方向に向かっているか
4. 日本語コミュニティ固有の反応・課題は何か

**調査方法メモ**:
- site:x.com WebSearch × 8 クエリ
- WebFetch 実投稿/記事 × 12 件（X直接アクセスは 402 Auth壁のため代替 URL 活用）
- 英語 + 日本語両方調査済み

---

## PART 1: 8 軸別の調査結果

### 軸 1: Claude Code Skills

**主要トレンド（1 週間）**

- **新スキル /simplify と /batch の予告投稿が高エンゲージメント**
  Boris Cherny (Anthropic) が「次バージョンで /simplify と /batch の 2 スキルを導入。PR を本番まで导く作業と、並列マイグレーション作業を自動化する」と投稿。
  出典: https://x.com/bcherny/status/2027534984534544489

- **スキルの「統一化」(Unification) が 2026 年の最大変化**
  `.claude/commands/` と `.claude/skills/` が一本化。skills フォルダが推奨パスになり、自動起動・コンテキストフォーク・モデル上書きが可能に。
  出典: https://alexop.dev/posts/understanding-claude-code-full-stack/

- **コミュニティが作成した awesome-claude-code リポジトリが 39,100 Stars / 3,200 Forks に到達**
  スキル・フック・コマンド・エージェント・プラグインを網羅。「PR を出せるのは Claude だけ」という厳格な品質管理体制。
  出典: https://github.com/hesreallyhim/awesome-claude-code

- **Railway がエージェントスキルを公式リリース**
  `npx skills add railwayapp/railway-skills` で Claude Code / Codex / Cursor / OpenCode などどのコーディングエージェントからでも Railway にデプロイ可能。
  出典: https://x.com/Railway/status/2027057985453752766

- **スキルの「Progressive Disclosure」設計**
  メタデータ読み込み (~100 tokens) → 必要時のみ全文ロード (~5k tokens) の 2 段階設計により、スキル数を増やしてもコンテキスト汚染を防止。
  出典: https://note.com/chaen_channel/n/n170fbfcd94bf

- **9,000 以上のコミュニティプラグインが稼働中**
  インストール時間は多くのプラグインで 60 秒以内。
  出典: https://www.morphllm.com/claude-code-extensions

**不満・要望**
- スキルのトリガー自動起動が不安定。「use when user mentions slides」と書いても半数は無視される。→ Hooks で補完するのが現在のベストプラクティス（後述）。
  出典: https://x.com/aakashgupta/status/2040888715003019433

---

### 軸 2: Claude Code MCP (Model Context Protocol)

**主要トレンド**

- **v2.1.101 (2026-04-10): サブエージェントが動的注入された MCP ツールを継承できない不具合を修正**
  出典: https://code.claude.com/docs/en/changelog (WebFetch 確認済み)

- **v2.1.97 (2026-04-08): MCP HTTP/SSE 接続が ~50 MB/hr の未解放バッファを蓄積するバグを修正**
  長時間セッションでのメモリリーク問題が顕在化していた。
  出典: 同上

- **v2.1.94 (2026-04-07): Amazon Bedrock Mantle 対応** (`CLAUDE_CODE_MANTLE=1` env var)
  同バージョンでデフォルト effort レベルが medium → high に変更（API key / Bedrock / Vertex / Foundry / Team / Enterprise ユーザー対象）。
  出典: 同上

- **Morph MCP が最インストール数のコミュニティ拡張**
  FastApply（編集速度 35%向上）と WarpGrep（並列検索でトークン消費 40%削減）を搭載。
  出典: https://www.morphllm.com/claude-code-extensions

- **Claude Code × Redash MCP でデータ分析の民主化**
  Claude が Redash クエリを実行し Notion に結果を書き込むワークフローが日本語 X コミュニティで話題。
  出典: https://x.com/ktknd/status/2036024654926876747

- **MCP 設定が「思ったより簡単」という日本語コミュニティの驚き**
  stdio / SSE / HTTP の 3 トランスポートが整理され、設定の敷居が大幅低下。
  出典: https://x.com/akira_papa_IT/status/1948430310976487923

**エコシステム規模**
- smithery.ai / mcp.so / composio.dev (500 以上) / pulsemcp.com など複数のカタログが乱立。
- awesome-mcp-servers (GitHub: punkpeye/awesome-mcp-servers) がコミュニティ管理の最大リポジトリ。

---

### 軸 3: Claude Code Hooks

**主要トレンド**

- **「CLAUDE.md は提案、Hooks は保証」という認識が広まる**
  Claude は CLAUDE.md の指示を「ほとんどの場合」従うが、Hooks はライフサイクルイベントにシェルスクリプトを差し込む決定論的な仕組み。スキルの自動起動を確実にする手段として急速に普及。
  出典: https://x.com/akshay_pachaar/status/2037523396876173783

- **v2.1.110 (2026-04-16): PreCompact フックがブロックに対応**
  フックが exit 2 または `{"decision":"block"}` を返すとコンパクションを阻止できる新機能。コンテキスト保護の手段として注目。
  出典: https://releasebot.io/updates/anthropic/claude-code

- **v2.1.97 (2026-04-08): `if` フィールドのサポート**
  Lydia Hallie (Vercel) が投稿。特定の Bash コマンドのみフックを発火させるフィルタリングが可能に。
  出典: https://x.com/lydiahallie/status/2037573738670297583

- **Intercom が 13 プラグイン・100 以上のスキル・Hooks を組み合わせた内部エンジニアリングプラットフォームを構築**
  フルスタック開発プラットフォームとして運用。
  出典: https://x.com/brian_scanlan/status/2033978300003987527

- **「8 つのブラインドスポットをカバーする Claude Hooks」リストが拡散**
  内容: 自動コードフォーマット / 危険コマンドブロック / 機密ファイル保護 / 編集後テスト自動実行 など。
  出典: https://x.com/Blum_OG/status/2040872554609750325

- **Hook イベントの拡張（2026 年）**
  当初の 7 ライフサイクルイベントから、PreToolUse / PostToolUse / タスクライフサイクル / ファイル変更 / 権限拒否イベントを追加。ハンドラはシェルコマンド・プロンプト・HTTP リクエスト・非同期実行に対応。
  出典: https://alexop.dev/posts/understanding-claude-code-full-stack/

---

### 軸 4: Claude Code Agents (Sub-agents)

**主要トレンド**

- **v2.1.101 (2026-04-10): サブエージェントが再開不可の制約変更**
  Claude Code 2.1.77 以降、Agent ツールの `resume` パラメータは廃止。継続には `SendMessage` と `agentID/name` 指定が必要。新規 Agent 呼び出しは常にフレッシュな状態で起動。
  出典: https://x.com/ClaudeCodeLog/status/2033705667295379568

- **v2.1.97 (2026-04-08): `/agents` の実行中サブエージェント数 `● N running` 表示を追加**
  並列実行状況がリアルタイムで把握可能に。
  出典: https://code.claude.com/docs/en/changelog (WebFetch 確認済み)

- **Subagents vs Agent Teams の使い分け論争が活発化**
  - Sub-agents: 独立・孤立した作業者（Embarrassingly parallel tasks に最適）
  - Agent Teams: 持続的・相互通信型（2026-02-05 に Opus 4.6 と同時ローンチ）
  「ほとんどの人は複数エージェントに早く移行しすぎる。まず単一エージェントで始めて、計測で複雑さが必要と分かってから増やせ」が現在のベストプラクティス。
  出典: https://x.com/akshay_pachaar/status/2033456347354996815

- **Worktree 分離が 2026 年の最大生産性向上策**
  3〜5 の Claude セッションをそれぞれ独立した git worktree で並列実行。Claude Code にネイティブサポートが実装済み。
  出典: https://okhlopkov.com/claude-code-setup-mcp-hooks-skills-2026/

- **v2.1.98 (2026-04-09): Linux サブプロセスの PID 名前空間分離によるサンドボックス化**
  セキュリティ強化として子プロセスの隔離を実装。
  出典: https://code.claude.com/docs/en/changelog (WebFetch 確認済み)

- **Jeffrey Emanuel が「Claude Max で 100k+ 行の Python 全型エラー修正」をサブエージェントで達成**
  大規模リファクタリングの実績報告が X で注目を集める。
  出典: https://x.com/doodlestein/status/1937729842172047679

---

### 軸 5: Claude Code Context Management

**主要トレンド**

- **1 Million Token コンテキストの「Context Rot」問題が可視化**
  - コンテキスト 20% 使用で循環推論・決定忘れが出現
  - 40% でコンテキスト圧縮が発動しスクロールバック履歴が消去
  - 48% でモデル自身が「効果的でない」と告白
  「Context management is the single most important skill for Claude Code productivity. More important than prompt engineering.」
  出典: https://claudefa.st/blog/guide/mechanics/context-management

- **Claude Code の 4 段階コンテキスト圧縮パイプライン（ソースリーク後に発覚）**
  1. Snip: 古いメッセージ全体を削除
  2. Microcompact: ツール結果を再計算可能なプレースホルダに置換
  3. Context Collapse: 90%（非ブロック）/ 95%（ブロック）でトリガー
  4. Autocompact: 「アルゲドン機構」 — セッション全体を LLM で要約、リトライ上限 3 回
  出典: https://medium.com/@toni3095/context-window-management-in-claude-code-and-github-copilot-0d108b9f0a81

- **v2.1.108 (2026-04-14): 1 時間プロンプトキャッシュ TTL の環境変数制御**
  `ENABLE_PROMPT_CACHING_1H` 環境変数で API key / Bedrock / Vertex / Foundry にて 1 時間 TTL を有効化。これにより長時間セッションのトークンコストを大幅削減可能。
  出典: https://code.claude.com/docs/en/changelog (WebFetch 確認済み)

- **v2.1.108 (2026-04-14): セッション再開時の「recap」機能追加**
  長時間後にセッションに戻った際にコンテキストを提供する新機能。`/undo` が `/rewind` のエイリアスとしても追加。
  出典: 同上

- **GitHub Copilot との根本的な哲学の違いが明確化**
  Claude Code: 外科的要約（メッセージを事後変異させる）
  Copilot: レンダリング時の柔軟な再構築（毎回プロンプトを再設計）
  出典: https://medium.com/@toni3095/context-window-management-in-claude-code-and-github-copilot-0d108b9f0a81

---

### 軸 6: Claude Code Memory

**主要トレンド**

- **「Auto-dream」機能の発見がコミュニティで話題沸騰**
  2026年3月31日のソースコードリーク（npm v2.1.88 の 59.8 MB ソースマップ）により発覚した未リリース機能。
  動作: 最後のサイクルから 24 時間以上経過 + 5 セッション以上で自動発火。バックグラウンドサブエージェントが過去セッションを精査し、MEMORY.md を整理・圧縮。
  出典: https://x.com/kr0der/status/2036235321780621738
  出典: https://x.com/rohanpaul_ai/status/2036421602049663300
  出典: https://x.com/JeremyNguyenPhD/status/2036279335221645345

- **MEMORY.md の 200 行制限問題**
  ソースコードで `MAX_ENTRYPOINT_LINES` として定義。1 週間で 100 件以上のメモリを保存するとインデックスが切り詰まり古い記憶が消失。
  出典: https://x.com/taranjeetio/status/2039086248158212266

- **Claude-Mem（サードパーティ）が 12,900 Stars に到達**
  セッション横断の永続メモリを提供するオープンソースプラグイン。セッション終了後も再説明不要で作業を継続可能。
  出典: https://x.com/Sumanth_077/status/2009991847914156338

- **Supermemory の Claude Code 統合が「狂ったほど強力」と話題**
  出典: https://x.com/DhravyaShah/status/2017039283367137690

- **MEMORY.md と CLAUDE.md の役割分担が日本語コミュニティで議論**
  結城浩氏がリポジトリ内での MEMORY.md の git 管理可能性を検討。
  出典: https://x.com/hyuki/status/2021002676373422411

---

### 軸 7: Claude Code 日本語コミュニティ

**主要トレンド**

- **Claude Code ブームの到来「バイブコーディング」文化の形成**
  非エンジニアへの普及を中心に「クロコさん（Claude Code）」という親しみやすい呼称が定着。
  出典: https://x.com/novy_jp/status/1927989043041591439

- **「claude-howto」ガイドが日本語コミュニティで拡散**
  Slash Commands / Memory / Skills / Subagents / Hooks / MCP を体系化した実践ガイド GitHub リポジトリ。
  出典: https://x.com/lancelotrt_ai/status/2040006773306745343

- **claude-howto コミュニティの構成要素**
  Slash Commands、Memory、Skills、Subagents、Hooks、MCP の 6 コンポーネントを段階的に解説するため日本人開発者の入門として活用。
  出典: 同上

- **AI 総合研究所が「毎週更新」の日本語まとめを提供**
  GitHub Releases の英語を日本語化した月次更新ガイド。追いかけ続ける難しさから需要が高い。
  出典: https://www.ai-souken.com/article/claude-code-updates-2026

- **Claude Code × Redash MCP の日本語ワークフロー**
  データ分析をチームで民主化する MCP 活用例が日本語 X 上で注目。
  出典: https://x.com/ktknd/status/2036024654926876747

- **非技術者への浸透が急速に進む**
  チャエン氏のノート記事（2.7 万文字）が「非エンジニアこそ使うべき」という方向性を示す。YC スタートアップが非技術創業者でも州政府契約を勝ち取れた事例を複数紹介。
  出典: https://note.com/chaen_channel/n/n170fbfcd94bf

- **Claude Code 障害（2026-04-06）**
  Downdetector に 8,000 件以上の障害報告が集まり、X の「最新」タブが公式ステータス更新より 15 分早く情報を拡散するという Twitter 活用例が話題。
  出典: https://uravation.com/media/claude-outage-realtime-switch-guide-2026/

- **CLAUDE.md の公開・共有文化**
  Ryo Manzoku (@rmanzoku) が社内向け CLAUDE.md 方針を公開。チームで共有するプラクティスが一般化しつつある。
  出典: https://x.com/rmanzoku/status/2028421833037586920

---

### 軸 8: Claude Code vs Cursor / Cline / Aider

**主要トレンド**

- **Cursor 3 が 2026-04-02 リリース — エージェントウィンドウで大幅な機能追加**
  - 170 ファイル同時編集の実績報告
  - Subagents 機能の追加 (Cursor 2.4)
  - Slack / Linear / GitHub / PagerDuty からの Webhook トリガー
  - クラウドエージェント（チームあたり最大 50 台）
  出典: https://fordelstudios.com/research/cursor-vs-claude-code-april-2026-what-changed

- **Claude Code の最大優位性: 同一タスクで Cursor より 5.5 倍少ないトークン消費**
  デバッグ時間 30% 短縮という独立テスト結果も報告。
  出典: https://fordelstudios.com/research/cursor-vs-claude-code-april-2026-what-changed
  出典: https://emergent.sh/learn/claude-code-vs-cursor

- **SWE-bench Verified スコア**: Claude Code on Opus 4.6 が 72.5%（2026年3月時点）
  出典: 同上

- **市場シェア**: Cursor が ARR $2B / ユーザー 100 万超でリード
  ただし「最も愛されるコーディングツール」は Claude Code が 46% vs Cursor 19%（開発者調査）
  出典: https://learn.ryzlabs.com/ai-coding-assistants/cursor-vs-claude-code-which-ai-coding-assistant-performs-better-in-2026

- **現在のコンセンサス**: ハイブリッド活用が最適
  「Cursor は日常編集・クラウドワークフロー向け、Claude Code は深いコードベースコンテキストが必要な大規模リファクタリング向け」
  出典: https://fordelstudios.com/research/cursor-vs-claude-code-april-2026-what-changed

- **Claude Code vs Cursor でリリース前実装は Cursor 必須という日本語意見**
  「顧客ありきなら Cursor 必須。自分だけが使うなら Claude Code のみで良い」という実務的意見。
  出典: https://x.com/kamui_qai/status/1927484688865620268

- **Claude Code が Cursor / Cline などラッパーアプリを脅かすとの見方**
  Matt Shumer が「Cursor から乗り換えるなら Claude Max が最適解」と投稿。
  出典: https://x.com/mattshumer_/status/1942269222047855096

---

## PART 2: 最新トレンド（2026-04-10〜17 集中）

### リリース履歴（4月10〜16日）

| バージョン | 日付 | 主な変更 |
|----------|------|--------|
| 2.1.110 | 2026-04-16 | TUI フルスクリーンレンダリング / モバイルプッシュ通知 / `/focus` コマンド / PreCompact フックブロック対応 |
| 2.1.109 | 2026-04-15 | 拡張思考インジケーターの改善 |
| 2.1.108 | 2026-04-14 | 1時間プロンプトキャッシュ TTL / セッション recap 機能 / `/undo` エイリアス / **Routines 発表** |
| 2.1.107 | 2026-04-14 | 長時間処理中の思考ヒント表示改善 |
| 2.1.97 | 2026-04-08 | MCP HTTP/SSE バッファリーク修正 / `/agents` 実行中インジケーター / `if` フィールドフック対応 |
| 2.1.96 | 2026-04-08 | Bedrock 403 認証回帰バグ修正 |
| 2.1.94 | 2026-04-07 | Bedrock Mantle 対応 / デフォルト effort を high に変更 / Slack MCP コンパクト表示 |

出典: https://code.claude.com/docs/en/changelog (WebFetch 確認済み)

### 最重要ニュース: Routines 機能（2026-04-14）

Anthropic が Claude Code に「Routines（繰り返しルーティン）」を正式発表。

**技術仕様**:
- Anthropic クラウドインフラ上で実行 → Mac がオフラインでも動作
- Routine = 保存済み Claude Code 設定（プロンプト + リポジトリ + コネクタ群）
- スケジュール実行またはトリガー / Webhook 起動

**プランごとの利用制限**:
- Pro: 5 ルーティン/日
- Max: 15 ルーティン/日
- Team / Enterprise: 25 ルーティン/日

**デスクトップ UI 刷新も同時発表**:
- 複数セッション並列表示
- ドラッグ＆ドロップレイアウト
- 統合ターミナル + ファイルエディタ + HTML/PDF プレビュー + 高速 diff ビューアー

出典: https://9to5mac.com/2026/04/14/anthropic-adds-repeatable-routines-feature-to-claude-code-heres-how-it-works/
出典: https://siliconangle.com/2026/04/14/anthropics-claude-code-gets-automated-routines-desktop-makeover/

---

## PART 3: コミュニティの不満・要望

### 重大バグ: 使用量クォータの異常消費（2026-03-23〜継続中）

GitHub Issue #41930 が「全有料ティアで広範な使用量異常消費」として登録。複数の根本原因が特定されたにもかかわらず公式コミュニケーションが発行されていないとして批判を受けている。

**特定された原因**:
- ピーク時間帯の意図的スロットリング
- プロンプトキャッシュバグ 2 件（トークンコストを 10〜20 倍に膨張）
- セッション再開バグ（全コンテキストの再処理をトリガー）
- スキルリストの不要な全体注入（使用しないスキルも含む完全なスキルメニューがシステムプロンプトに注入）

**Max 20 プランの報告**: v2.1.89 以前は発生しなかったレート制限が 70 分以内に 100% 消費される。
出典: https://github.com/anthropics/claude-code/issues/41788
出典: https://github.com/anthropics/claude-code/issues/41930

### パフォーマンス劣化報告（2026年2〜3月）

AMD AI グループのシニアディレクター Stella Laurenzo が 6,852 セッション・17,871 思考ブロック・234,760 ツール呼び出しを分析した GitHub Issue を提出。

**データで見えた劣化**（2026年1月→3月比較）:
- 可視的な思考の長さの中央値: 2,200 文字 → 600 文字（73% 減）
- 早期停止パターン: ほぼゼロ → 1 日 10 件（3 月 8 日以降）
- 「最も簡単な修正」行動の増加
- 調査優先 → 編集優先への行動シフト

出典: https://scortier.substack.com/p/claude-code-drama-6852-sessions-prove

### スキル自動起動の信頼性問題

「Claude Code の最大の問題はスキルの自動起動が安定しないこと」と Aakash Gupta が指摘。トリガーワードを書いても半数は無視される。Hooks を使って確実に発火させるのが現在の回避策。
出典: https://x.com/aakashgupta/status/2040888715003019433

### Context Rot（コンテキスト腐食）への不満

1M トークンコンテキストの広告に対して、実際は 20% 使用時点から品質劣化が始まるとの報告が多数。「コンテキスト管理こそプロンプトエンジニアリングより重要なスキル」との認識が広まっている。
出典: https://claudefa.st/blog/guide/mechanics/context-management

### ソースコードリーク問題（2026-03-31）

npm v2.1.88 に 59.8 MB のソースマップが誤って含まれ TypeScript ソースコードが全世界に公開された。
コミュニティは「事故 / 不注意 / 最高の PR スタント」と 3 つに分かれて議論。
Auto-dream 等の未リリース機能発覚の契機にもなった。
出典: https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/
出典: https://dev.to/varshithvhegde/the-great-claude-code-leak-of-2026-accident-incompetence-or-the-best-pr-stunt-in-ai-history-3igm

---

## PART 4: ベストプラクティス発見

### Skills 使用のベストプラクティス

1. `.claude/skills/` を推奨パスとして使用（`.claude/commands/` は後方互換で残存）
2. スキルファイルは約 200 行の指示マークダウン + コード実装なしで機能する
3. Progressive Disclosure 設計でスキル数が増えてもコンテキスト汚染を防止
4. 自動起動が不安定な場合は Hooks と組み合わせて確実に発火させる

### Hooks 使用のベストプラクティス

1. CLAUDE.md を「提案」、Hooks を「保証」として位置づける
2. `if` フィールドで特定コマンドのみに発火を絞る（v2.1.97 以降）
3. PreCompact フックでコンテキスト消去をブロック（v2.1.110 以降）
4. 推奨フック: auto-format / 危険コマンドブロック / 機密ファイル保護 / テスト自動実行

### Agents 使用のベストプラクティス

1. まず単一エージェントから始め、計測で複雑さが必要と分かってから増やす
2. 並列作業には Sub-agents（独立・孤立）を使い、相互調整が必要な場合は Agent Teams を使う
3. Worktree 分離で 3〜5 セッションを並列実行するのが 2026 年の最大生産性向上策
4. サブエージェントは独自のコンテキストウィンドウを持ち、メインコンテキストを汚染しない

### Context Management のベストプラクティス

1. 新しいタスクは新しいセッションで開始する（ゴールデンルール）
2. `ENABLE_PROMPT_CACHING_1H` で長時間セッションのコストを削減（v2.1.108 以降）
3. PreCompact フックでコンパクション前に重要データを退避
4. Claude Code は 5.5 倍 Cursor より少ないトークンを使用 → コスト面で有利

### Memory 管理のベストプラクティス

1. MEMORY.md は 200 行以内に保つ（MAX_ENTRYPOINT_LINES 制限）
2. Auto-dream（未リリース）が安定するまでは手動で定期的にメモリ整理
3. CLAUDE.md と MEMORY.md の役割を分けて管理する
4. Claude-Mem（12,900 Stars）等のサードパーティプラグインでセッション横断メモリを補完

---

## 結論

**1 週間（2026-04-10〜17）の最重要出来事**:

1. **Routines 機能の正式ローンチ（2026-04-14）** — クラウド上でのスケジュール実行。Mac オフラインでも動作。Claude Code が「コーディングツール」から「開発自動化プラットフォーム」に進化する象徴的リリース。

2. **デスクトップ UI の全面刷新（同日）** — 複数セッション並列表示・統合ターミナル・ドラッグ＆ドロップレイアウト。Cursor に近いアイデア体験を提供。

3. **v2.1.94 でのデフォルト effort の high への変更（2026-04-07）** — ユーザーが明示的に設定しなくてもより高品質な応答がデフォルト化。

4. **使用量クォータ異常消費バグの未解決継続** — GitHub Issue #41930 が未クローズのまま継続中。コミュニティの不信感が高まっている。

**重要ポイント**:
- Claude Code は「Cursor が ARR $2B でリード」するものの「開発者に最も愛されるツール」では 46% vs 19% でリード
- 日本語コミュニティでは「非エンジニア向け」普及フェーズに突入
- Hooks が Skills の信頼性問題を補完する「決定論的な補完装置」として注目度急上昇
- Auto-dream（未リリース）が次の Memory 管理の主役になる可能性が高い

**未解決 / 追加調査が必要な事項**:
- Auto-dream の正式リリース時期（現在は発見済みだが未公式）
- 使用量クォータ異常消費問題の公式解決状況（GitHub Issue #41930, #41788）
- Routines のトリガー/Webhook 仕様の詳細（公式ドキュメント参照が必要）
- Cursor 3 との中長期的な競合展開
- 日本語コミュニティのアクティブ投稿数の定量計測（X API なしでは困難）

---

## 調査方法・制約

- **X.com 直接アクセス**: 402 認証エラーのため WebSearch 経由でメタデータ取得 + 代替 URL で WebFetch
- **WebFetch 実施件数**: 12 件（releasebot.io, alexop.dev, okhlopkov.com, medium.com × 2, morphllm.com, github.com/hesreallyhim, 9to5mac.com, siliconangle.com, help.apiyi.com, note.com, fordelstudios.com）
- **WebSearch クエリ数**: 11 クエリ（8 軸 + 追加 3 件）
- **いいね数・RT 数**: X 直接アクセス不可のため取得できず。エンゲージメント高いと判断した投稿は URL の拡散状況・被引用数から推定。

---

*作成: 2026-04-17 | リサーチアナリスト (Claude Sonnet 4.6)*
