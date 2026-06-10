# TAISUN v2 改善実行計画 v2（2026-06-11 全体俯瞰監査ベース・Codexレビュー反映済み）

> 元データ: `.claude/temp-context/audit-findings-2026-06-11.md`（5並列監査の統合所見）
> レビュー履歴: v1 → Codex adversarial review（PARTIAL・指摘8件）→ 全指摘を実ファイルで検証し反映 → v2
> ビジョン適合軸: ①コスト削減 ②メモリ強化 ③エラー削減 ④コンテキスト消費削減 ⑤目的・ルール保持
> 目的: 初心者〜中級者が「楽しく」様々なシステムを構築できる配布基盤にする

---

## 全体俯瞰サマリー

| 領域 | 健全度 | 最重要課題 |
|------|--------|-----------|
| テスト/型 | ✅ 良好（1358 passed, typecheck 0err） | intelligence/・rag/ がカバレッジ0% |
| ワークフローエンジン | ⚠️ 機能は豊富だが検証穴 | 参照完全性未検証・rollback状態乖離・lintが対象を見ていない |
| Hooks | ❌ 構造的問題 | 62本中34本がsettings.json未登録（ただし別プロファイル参照あり）、exit(1)セッション破壊 |
| コンテキスト | ⚠️ 削減余地大 | 毎セッション約8,182tok注入 → 約3,000tokまで削減可 |
| 配布/オンボーディング | ⚠️ 初心者が躓く | APIキー導線矛盾、install-release.sh死亡、Makefile壊れ |

---

## Phase 0: 即日クイックウィン（リスク極小・30分）

| # | 作業 | 対象 | 受入条件 |
|---|------|------|---------|
| 0-1 | `.gitignore` に `__pycache__/` `*.pyc` 追加 | .gitignore | git status から __pycache__ が消える |
| 0-2 | output-verifier.js の `process.exit(1)` を fail-open 化（stderr警告のみ）。boot/04 の「Project-level hooks never block」原則と整合 | .claude/hooks/output-verifier.js:69-70 | exit(0) 固定+ユニットテスト |
| 0-3 | README の固定スキル数表記を「プロファイル可変（92〜120）」に統一（**行番号指定ではなく `grep -n` で全出現箇所を洗い出して一括修正**。:14,129,174,228,486 等に散在）。install-release.sh の「推奨」表記（:106付近）も撤回 | README.md 全体 | `grep -nE '[0-9]+スキル|スキル[: ]*[0-9]+' README.md` で固定数の残存ゼロ |

## Phase 1: コンテキスト削減モデル — 計測基盤（Week 1 前半）★ユーザー最優先

**「削減モデル」の本体。先に物差しを作り、以降の全削減を数値で検証可能にする。**

| # | 作業 | 受入条件 |
|---|------|---------|
| 1-1 | `scripts/context-footprint.js` 新規作成: CLAUDE.md + rules/*.md + boot/ + SessionStart/UserPromptSubmit hook出力（**固定フィクスチャ**: handoffあり/なし等の代表3シナリオ）の合計バイト/トークンを決定的トークナイザ（文字数ベース換算式を明記）で算出。`npm run context:report` | 同一入力で同一数値（再現性）。レポートにソース別内訳表 |
| 1-2 | CI ゲート追加: 固定フィクスチャでの footprint が **3,000 tok 超で fail**（製品目標値とゲート値を一致させる） | ci.yml で実行・現状値ではfail（削減完了後にgreen化） |

## Phase 2: ワークフローエンジン Critical 修正（Week 1 後半）※Codex指摘により前倒し

**状態破壊・実行時失敗はhook整理より深刻。コンテキスト削減の本格作業前に潰す。**

| # | 作業 | severity | 受入条件 |
|---|------|----------|---------|
| 2-1 | registry.ts `validateWorkflowDefinition()`（:143-150）に conditionalNext.branches / parallelNext.phases / allowRollbackTo の参照先フェーズ存在チェック追加 | Critical | 不正参照を含む定義fixtureがロード時にエラーになるテスト |
| 2-2 | engine.ts `rollbackToPhase()`（:793-870）: 成果物の存在/権限を**検証してから** state 更新する順序に変更。削除失敗時は state 不変+手動手順を日本語で案内 | Critical | 削除失敗シミュレーションで state が変化しないテスト |
| 2-3 | definition-lint-gate.js `lintAllDefinitions()`（:319-337）を**再帰スキャン化**（CLI `lint-all` は :430 に実装済み。現状 `config/workflows/*.json` を見ていないのが真因）。検査したworkflowファイル数をアサート | High | `npm run workflow:lint` が config/workflows/ 配下の全ワークフローJSON（top-level 9件、examples/ 含め12件）を検査し、検査件数を**ハードコードでなく実スキャン結果から**出力・アサート |
| 2-4 | engine.ts（:554-564）並列実行後 nextPhase=null → 正常完了扱いに修正 | High | wf_ops_runbook_v1 の最終並列フェーズ完了テスト |
| 2-5 | priority_based_v1.json:95-106 / sdr_pipeline_v1.json:33-48 に defaultNext 追加。video_generation_v1 の `japanese-tts-reading` 実在確認・修正。allowedSkills 実在検証を lint に追加 | High | lint-all green |

## Phase 3: コンテキスト削減 — 実施（Week 2）

**互換性原則（Codex指摘反映）: 注入ファイルのパスは変えない。中身を薄くし、詳細は明示リンクで lazy 化（Pattern 13: リンクを書かないと読まれない）。**

| # | 作業 | 削減見込み | 互換性ガード |
|---|------|-----------|-------------|
| 3-1 | mistakes.md: **パス `.claude/rules/mistakes.md` を維持したまま**「パターン見出し+1行要点」に薄型化。詳細を `mistakes-extended.md` へ移し本文から明示リンク。violation-recorder.js の書込先・mistake-pattern-matcher.js のパーサ互換を確認 | -1,894tok | 8hook（rules-enforce-guard 等）がパス参照のため改名禁止。パーサのテスト追加 |
| 3-2 | url-learning-pipeline.md → スキル化（`.claude/skills/url-learning/`）し rules/ から削除 | -1,325tok | URL分析時のみロード |
| 3-3 | context-management.md → 5行要約版に薄型化、詳細は `.claude/references/CLAUDE-L2.md` へ明示リンク付きで移行 | -744tok | |
| 3-4 | auto-model-switch.md → 5行要約に圧縮（**削除しない**: hookはjsonを書くだけで、参照行動はruleが規定） | -600tok | Task起動時のモデル切替がスモークで動作 |
| 3-5 | boot/04-agent-rules.md: メインセッション規範（ECC/CodeGraph/Hook Safety/MCP）は**圧縮要約として残し**、エージェント専用部分のみ agent-checkpoint-guard.js の Task 時注入へ | -400tok | メインセッション挙動を失わない |
| 3-6 | CLAUDE.md 再編: **リサーチ自動発動トリガー表は CLAUDE.md に残す**（lazy化するとスキル自動発動が死ぬ）。表を圧縮し、L2/L3 への明示リンクを整理 | -400tok | トリガーワード→スキル発動の回帰テスト（代表5語） |
| 3-7 | SessionStart hook 出力1行化 + mid-session-reminder 30行→5行化 | -300tok/回 | |

**Phase 3 受入条件**: `npm run context:report` ≤ 3,000tok（CIゲートgreen化）。回帰スモーク: ①トリガーワードでスキル発動 ②モデル自動切替 ③mistake-pattern-matcher 動作 ④BOOT CHECKPOINT 動作。

## Phase 4: Hooks 統廃合（Week 3）

| # | 作業 | 受入条件 |
|---|------|---------|
| 4-1 | **逆依存スキャンを先に実施**: settings.json / settings.normal.json / settings.performance.json / presets / scripts/validate-*.sh / テストから全hookへの参照を洗い出し、判定表（登録/アーカイブ/削除）を doc/ に作成。※settings.jsonのみでの孤児判定は誤り（auto-memory-saver 等は normal プロファイルが参照） | 全62hookに参照元リスト付き判定 |
| 4-2 | 真の孤児を `.claude/hooks/archive/` へ移動。圧縮系5本→2本（最適化1+監視1）に統合 | test:guards 通過、13.8k行→約9k行 |
| 4-3 | codegraph-auto-index timeout 12s→3s、codegraph-oss-monitor の SessionStart ネットワークI/Oをキャッシュ化 | SessionStart体感遅延の解消 |
| 4-4 | hookメッセージ標準テンプレート（日本語・「何が起きた→次にやること」、専門用語に1行説明） | 主要10hookのメッセージ改訂 |
| 4-5 | CI に「hook参照整合性検査」（全プロファイル vs 実ファイルの双方向照合）追加 | ci.yml green |

## Phase 5: 配布・オンボーディング改善（Week 4）— 「楽しく使ってもらう」

| # | 作業 |
|---|------|
| 5-1 | APIキー導線一本化: install.sh 完了メッセージを「/login が最も簡単」中心に書換、.env の「作るのに読まれない」矛盾解消、実パス（~/.taisun-agent/.env 等）明示 |
| 5-2 | `QUICK_START_JA.md` 新設 + インストール直後「まず試す3コマンド」提示（成功体験の演出） |
| 5-3 | install-release.sh: cd.yml で Release 自動生成 or 当面 README から削除し git clone 方式を推奨に昇格 |
| 5-4 | Makefile 修復: 存在しない docker-compose.tools.yml / monitoring.yml 参照を実在ファイルに修正 or 該当ターゲット削除（初心者が `make tools-up` で即死しないように） |
| 5-5 | README のスキル数・テスト数バッジを自動生成化 |
| 5-6 | git config user.name/email を noreply 形式へ（今後の実名/機械名漏洩防止）。doc/CODEXレビュー の実パス含有ファイルの配布除外検討 |
| 5-7 | npm エラー診断にプロキシ/企業ネットワークのヒント追加 |

**受入条件**: 新規環境（クリーンVM/別ユーザー）で install.sh → /login → 最初のスキル実行まで、ドキュメントだけで到達できること。

## Phase 6: 品質負債返済（Week 5以降・継続）

| # | 作業 | 受入条件 |
|---|------|---------|
| 6-1 | rag/（314行）+ intelligence/（~1,000行）のユニットテスト追加 | カバレッジ floor 66→70% へ引上げ |
| 6-2 | scripts/ 92本を core/mcp/validation/archive に再編（validate-*.sh 8本→1本、使い捨てpy・phase1/phase2→archive） | package.json の全scriptsが動作 |
| 6-3 | lint warnings 46件解消 → CI `--max-warnings 0` | ci.yml green |
| 6-4 | saga.ts / tracing.ts / verification-layer.ts のテスト追加 or 廃止判定 | 判定記録を doc/ に残す |

---

## 実行順序の根拠（v2）

1. **Phase 0**: 無リスクで即効
2. **Phase 1**: 計測基盤が先（物差しなしの削減は検証不能）
3. **Phase 2**: ワークフローの Critical 2件（状態破壊・参照未検証）は hook 整理より深刻のため前倒し（Codex指摘）
4. **Phase 3**: コンテキスト削減本体。互換性原則（パス不変・明示リンク・回帰スモーク）で進める
5. **Phase 4-6**: hooks → 配布 → 負債の順

## リスクと緩和

- ルール薄型化は AI 挙動に影響 → 1ファイルずつ変更し、各変更後に回帰スモーク4点（スキル発動/モデル切替/mistakeマッチャ/BOOT CHECKPOINT）
- hooks 統廃合は**逆依存スキャン完了後のみ**着手。settings系3ファイル+presets+scriptsを参照元に含める
- 全フェーズ「変更→テスト→Codexクロスレビュー→小刻みPR」（codex.md 準拠）

## Codexレビュー反映ログ

| Codex指摘 | 検証結果 | 反映 |
|-----------|---------|------|
| 1. ワークフローCritical修正が遅い | 妥当 | Phase 2 に前倒し |
| 2. mistakes.md 分割でhook配線が壊れる | ✅実証（8hookがパスをハードコード） | パス不変の薄型化方式に変更（3-1） |
| 3. トリガー表のL2移動でスキル自動発動が死ぬ | 妥当 | CLAUDE.md に残し圧縮（3-6） |
| 4. boot/04 はメインセッション規範を含む | 妥当 | 要約を残す方式に変更（3-5） |
| 5. lint-all は実装済み、真因は非再帰スキャン | ✅実証（:430にCLI、:337が非再帰） | 2-3 を再帰化+件数アサートに修正 |
| 6. settings.jsonのみの孤児判定は誤り | ✅実証（settings.normal.jsonが多数参照） | 逆依存スキャンを前提条件化（4-1） |
| 7. 目標3,000とゲート4,500の不一致・非決定的計測 | 妥当 | ゲート=3,000に統一、固定フィクスチャ+決定的トークナイザ（1-1,1-2） |
| 8. Makefile修復が計画に不在 | 妥当 | 5-4 追加 |
