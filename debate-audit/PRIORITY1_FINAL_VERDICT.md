# PRIORITY 1 FINAL VERDICT — Opus 4.7 × Codex Pro 統合判定

**Date**: 2026-04-17
**Subject**: TAISUN agent Priority 1（Praetorian semantic search 導入）の進め方
**Method**: debate-review v4 — 15 ラウンド × 3 findings = 45 findings、両モデル全件 verdict
**Inputs**:
- 入力ドキュメント: 指示書, mistakes.md, MEMORY_FINAL_VERDICT.md, PHASE3_FINAL_CONSENSUS.md, セッション11ログ
- 対象コード: scripts/praetorian/semantic-search.js, package.json, scripts/benchmark/token-baseline.js, .claude/praetorian/index.json, .claude/hooks/reasoning-capture.js
- 実測値: npm audit 0 vuln（@xenova アンインストール後）、test 1107/1107、PR #307/#309 OPEN MERGEABLE、243 .toon ファイル

## 1. 議論対象（5 つの選択肢）

| ID | 内容 | Opus 評価 | Codex 評価 | 統合判定 |
|----|------|----------|-----------|----------|
| A | スタブ放置、Priority 1 廃止 | NG（決定記録なし） | NG（同上） | **不採用** |
| B | Ollama nomic-embed-text 経由 | 条件付き支持 | 条件付き支持 | **段階導入** |
| C | fastembed-js 監査 | 監査前提 | 監査前提 | **後段検討** |
| D | 純 JS TF-IDF 拡張 | 要件不充足 | 要件不充足 | **不採用** |
| E | PR #307→#309 マージ優先 | 主軸支持 | 主軸支持 | **採用** |

## 2. 統合勧告: 選択肢 F'

**F' = E + 決定記録追加 + ベンチ拡張 + 定量ゲート**

### Phase 1: 本セッション内（破壊的操作はユーザー承認待ち）

#### Task 1.1 — semantic-search.js に決定記録追加（非破壊）
- **対象**: `scripts/praetorian/semantic-search.js:1-22` のヘッダーコメント
- **追記内容**:
  ```
  ## DECISION LOG
  - 2026-04-17: @xenova/transformers 検証 → npm audit 4 critical (protobufjs)
    → 配布性優先で却下（claude-mem 却下と同基準）
  - 2026-04-17: 15 ラウンド debate-review (Opus × Codex Pro) で F'案合意
    → Phase 1: 決定記録 + PR マージ
    → Phase 2-3: ベンチ拡張 → Ollama opt-in 段階導入
  - 詳細: debate-audit/PRIORITY1_FINAL_VERDICT.md
  ```
- **工数**: 5-10 分
- **リスク**: 低（コメント追加のみ）
- **ロールバック**: `git checkout scripts/praetorian/semantic-search.js`
- **検証**: `node scripts/praetorian/semantic-search.js` でステータス JSON 出力が壊れていないこと

#### Task 1.2 — PR #307（portability-fixes）マージ（**ユーザー承認必須**）
- **対象**: PR #307
- **手順**:
  1. `gh pr checks 307` で CI 状態確認
  2. `gh pr view 307 --json reviewDecision,headRefName,baseRefName` でブランチ確認
  3. ユーザー承認取得
  4. `gh pr merge 307 --squash` または `--merge`（squash 推奨、確認）
  5. 結果検証: `gh pr view 307 --json mergedAt`
- **工数**: 10-30 分（CI 待ち含む）
- **リスク**: 中（main ブランチへの統合、後戻り困難）
- **ロールバック**: `git revert <merge-commit>` または `gh pr reopen`（GitHub 側で merge revert）
- **検証**: マージ後 `git pull origin main && npm run test:release` で 1107 件全パス維持

#### Task 1.3 — PR #309（v5-cleanup）を main にリベース → マージ（**ユーザー承認必須**）
- **依存**: Task 1.2 完了後
- **手順**:
  1. `git fetch origin main`
  2. `git checkout feature/v5-cleanup`
  3. `git rebase origin/main`
  4. コンフリクト解消（あれば手動、未読ファイル禁止 Pattern 11 遵守）
  5. `git push --force-with-lease origin feature/v5-cleanup`（要承認）
  6. `gh pr checks 309` 再走確認
  7. `gh pr merge 309 --squash`（要承認）
- **工数**: 30-90 分（コンフリクト次第）
- **リスク**: 高（force-push、PR mergeable 状態が崩れる可能性）
- **ロールバック**: `git reflog` から rebase 前 HEAD に戻す、or `git push --force-with-lease` 取り消し
- **検証**: マージ後 `git pull origin main && npm run test:release && npm run typecheck && npm audit` 全パス

#### Task 1.4 — mistakes.md Pattern 12 追加（**ユーザー承認推奨**、現未コミット状態の影響あり）
- **対象**: `.claude/rules/mistakes.md`（既に Pattern 11 まで未コミット）
- **追記内容（案）**:
  ```
  ### Pattern 12: 指示書手順の前提崩壊検出失敗
  ❌ 間違い: 指示書の手順 (npm install @xenova/transformers) を疑わず実行
  ✅ 正解: install/setup 手順は必ず npm audit / 依存ツリー監査を事前に行う
  Why: 指示書作成時点では未知だった脆弱性が新規発生する場合があり、配布性ゲートを破る
  How to apply: install.sh / 新規依存追加時、必ず audit + 0 vuln 確認後に commit
  ```
- **判断**: ユーザー指示「.claude/rules/mistakes.md uncommitted は commit 禁止」がある。Pattern 12 追加は次セッション or ユーザー明示承認時のみ
- **工数**: 5 分
- **リスク**: 低（追記のみ）
- **ロールバック**: `git checkout .claude/rules/mistakes.md`

### Phase 2: 次セッション以降

#### Task 2.1 — PHASE3 #21 ベンチ基盤に search 精度評価を追加
- **対象**: `scripts/benchmark/` 配下に `search-accuracy-baseline.js` 新規
- **設計**:
  - 既存 Praetorian 単語索引で baseline recall@5 を測定
  - 評価データセット: 既存 cpt_*.toon から 20-30 件のクエリ → 期待 hit を人手定義（Pattern 7 遵守）
  - メトリクス: Recall@5, Recall@10, MRR, p50/p95 latency
  - 出力: `docs/benchmarks/search-accuracy-{date}.json`
- **工数**: 1-2 日
- **リスク**: 低（測定のみ、既存挙動変更なし）
- **検証**: ベンチが決定的に走る（同入力で同出力）

#### Task 2.2 — KPI ゲート定義（Codex 追加観点 R8 反映）
- **対象**: `docs/benchmarks/search-kpi-gate.md` 新規
- **内容**:
  - 採用ゲート: Recall@5 が baseline +15% pp 以上
  - レイテンシゲート: p95 < 200ms（Ollama 経由想定）
  - セキュリティゲート: `npm audit` critical=0, high=0
  - 配布性ゲート: install.sh / setup-project.sh の CLI 引数変更ゼロ
- **工数**: 30 分
- **リスク**: 低（文書のみ）

### Phase 3: Phase 2 完了後

#### Task 3.1 — B（Ollama opt-in）実装
- **対象**: `scripts/praetorian/semantic-search.js` のスタブ実装
- **設計**:
  - `embed(text)`: `fetch('http://localhost:11434/api/embeddings', {model:'nomic-embed-text', prompt:text})` で取得
  - `cosineSimilarity(a, b)`: pure function（テスト容易）
  - `search(query, topK=5)`: embedding 索引 + 単語索引の **lexical fallback**（Codex R13 追加観点）
  - `isAvailable()`: `fetch('http://localhost:11434/api/tags')` を 500ms タイムアウトで実行 → エラー or 200 で判定
  - `topK` 上限ガード（Codex R10 追加観点）: max(1, min(topK, 20))
  - 入力ガード: 空文字 → 即 `[]` 返却
  - エラー処理: タイムアウト/接続失敗 → `[]` + warn ログ（throw しない）
- **工数**: 1-2 日
- **リスク**: 中（新機能、既存検索に影響なしを保証）
- **検証**: Task 2.1 ベンチで KPI ゲート全通過

#### Task 3.2 — build-embeddings.js 新規作成（Phase 3 内）
- **対象**: `scripts/praetorian/build-embeddings.js` 新規
- **設計**:
  - 243 cpt_*.toon を読み、512 token chunk
  - バッチ20で並列、進捗表示、resume 機能（既存 .vec はスキップ）
  - 出力: `.claude/praetorian/embeddings/{compactionId}.vec`（Float32 binary）
  - `.gitignore` に `.claude/praetorian/embeddings/` 追加（Codex R13 追加観点）
- **工数**: 1 日
- **リスク**: 中（長時間バッチ、中断時のデータ整合性）
- **検証**: 全 243 件処理後の vec ファイル数 == 243

### Phase 4: Phase 3 効果実測後

#### Task 4.1 — C（fastembed-js）依存監査の再判定 or B 本採用
- **判断材料**: Phase 3 で Recall@5 が KPI を満たすなら B 本採用、満たさないなら C を改めて検討
- **C 採用前提**: `npm view fastembed dependencies --json | grep -E '(protobufjs|onnxruntime)'` で 0 件確認
- **工数**: 0.5-1 日

## 3. ユーザー承認待ち事項（破壊的操作）

| # | 操作 | リスク | 承認要否 |
|---|-----|--------|----------|
| 1 | semantic-search.js コメント追加 | 低（非破壊） | 推奨 |
| 2 | PR #307 マージ | 中（main 統合） | **必須** |
| 3 | PR #309 rebase + 再 push + マージ | 高（force-push） | **必須** |
| 4 | mistakes.md Pattern 12 追加 + コミット | 低（追記） | **必須**（既存禁止指示あり） |

## 4. 不採用となった選択肢の根拠

### A（何もしない）
- 決定記録なし → 次セッションで同じ議論再発（Round 6.2, 11.3 AGREE）
- semantic-search.js スタブが事実と乖離（Round 6.2 AGREE, 15.2 AGREE）

### D（純 JS TF-IDF）
- 「semantic」要件を満たさない（Round 1.1 AGREE）
- 中長期的に再投資が発生（Round 12.3 AGREE）
- ROI 低（Round 7.2 AGREE）

### C 即時採用
- 依存監査未完で protobufjs critical 4 件の再発リスク（Round 5.1 PARTIAL — 断定取り下げ後も方針維持、Round 12.2 PARTIAL）
- B より優先度が低い（Codex 全体勧告）

## 5. 残された不一致（DISAGREE 2 件）の取り扱い

### F4.2 (cosine 全件走査の <1ms 主張)
- **判断**: Opus 自己評価で Pattern 10 違反気味と認め、**取り下げ**
- **影響**: Phase 2 のベンチで実測すれば自然に解消

### F5.1 (fastembed-js も protobufjs を内包する可能性)
- **判断**: 断定→監査義務に格下げ。**部分撤回**
- **影響**: Phase 4 の C 検討時に依存監査必須は維持

## 6. 配布性ゲートの再確認

本判定書全体を通じて、以下の配布性原則が維持されている:

- ✅ Docker 依存追加なし
- ✅ install.sh / setup-project.sh の CLI 引数変更なし
- ✅ npm audit 0 vuln 維持（@xenova アンインストール済み）
- ✅ Ollama は opt-in（必須化しない、未インストール環境では既存単語索引で動作）
- ✅ ETH Zurich 原則「過剰外部メモリ回避」と整合（段階導入で計測しながら判断）

## 7. 次の即時アクション（ユーザー判断要）

以下の **3 つの選択肢** からユーザーが進行方針を決定:

```
A) Phase 1.1 のみ実行（決定記録追加）→ コミット → セッション終了
B) Phase 1.1 + 1.2（PR #307 マージ）まで実行 → ユーザー承認要
C) Phase 1.1〜1.4 全実行（PR #307/#309 マージ + Pattern 12 追加）→ 承認要
```

## 8. 監査証跡

- Opus 分析全文: `debate-priority1/opus_15rounds.md`
- Codex 査読全文: `debate-priority1/codex_15rounds.md`
- 全会一致サマリ: `debate-priority1/agreement_summary.md`
- 本判定書: `debate-audit/PRIORITY1_FINAL_VERDICT.md`

## 9. 集計（実数）

- 総 findings: 45
- AGREE（完全合意）: 27 (60.0%)
- PARTIAL（部分合意）: 16 (35.6%)
- DISAGREE（不一致）: 2 (4.4%)
- 致命的反対: 0
- F'案への両モデル合意度: AGREE+PARTIAL=43/45 = 95.6%

**判定**: 合意度 95.6% で F'案を最終勧告。残る 2 件 DISAGREE は技術的細部で Opus 側で取り下げ・撤回済み、最終勧告に影響なし。
