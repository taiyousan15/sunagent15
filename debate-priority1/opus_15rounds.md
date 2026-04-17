# Opus 4.7 — 15 Round Analysis: TAISUN Priority 1 (Semantic Search)

**Date**: 2026-04-17
**Subject**: Priority 1 進め方の決定（選択肢 A〜E）
**Reviewer**: Claude Opus 4.7 (1M context)
**Verified inputs**: 全 Read 済み（指示書、mistakes.md、MEMORY_FINAL_VERDICT.md、PHASE3_FINAL_CONSENSUS.md、セッション11ログ、semantic-search.js、package.json、token-baseline.js、index.json、reasoning-capture.js）

選択肢:
- A. 何もしない（スタブ放置、Priority 1 廃止）
- B. Ollama 経由（nomic-embed-text、graceful degradation）
- C. fastembed-js 監査（依存OKなら採用、NGならBへ）
- D. 純 JS TF-IDF/n-gram 拡張
- E. 延期して PR #307→#309 マージ優先

---

## Round 1: 機能正確性 — 要件通りに動くか

### Finding 1.1
**Issue**: 選択肢 D（純 JS TF-IDF）は「semantic search」の要件を満たさない。TF-IDF は語彙的一致のみで「意味的近さ」を測れない（同義語・言い換えで recall が落ちる）。
**Evidence**: `MEMORY_FINAL_VERDICT.md:42-44` に「sentence-transformers or transformers.js ローカル埋め込み」「効果予測: 意味検索精度 2→5」と明記。TF-IDF は既存 Praetorian 単語バケット索引と原理的に同一クラス。
**Category**: architecture
**Severity**: high
**Position**: D に反対

### Finding 1.2
**Issue**: 選択肢 B（Ollama 経由）は要件を満たすが、`isAvailable()` で graceful degradation するなら「Ollama 未インストール環境では結局スタブと同じ」になる。実効受益者が限定される。
**Evidence**: `scripts/praetorian/semantic-search.js:71-78` の `isAvailable()` は require.resolve + 既存 EMBED_DIR の存在確認のみ。Ollama 化する場合は HTTP /api/tags プローブが必要だが、未配布環境では false 確定。
**Category**: architecture
**Severity**: medium
**Position**: B に条件付き支持（配布対象のセグメンテーションが前提）

### Finding 1.3
**Issue**: 選択肢 E（延期）は Priority 1 という命名から「優先度1」と読めるため、ユーザー意図と整合的でない可能性。ただし指示書 L42-46 の「Remaining tasks」では Priority 1 ≠ 順位1ではなく単なるラベル。
**Evidence**: 指示書:42-46 には Priority 1, Phase D-3, PR merge, Optional の順で列挙されているが、PR merge を優先すべきという明示なし。MEMORY_FINAL_VERDICT.md:65-68 では「何もしない（当面保留）」も選択肢として明記されている。
**Category**: content
**Severity**: low
**Position**: E は意味論的に許容

---

## Round 2: アーキテクチャ — 構造・依存関係は適切か

### Finding 2.1
**Issue**: 選択肢 B（Ollama）採用時、Praetorian は「単語索引」+「埋め込み索引」の二層になる。merge ロジック（union or rerank）の設計が semantic-search.js スタブにない。
**Evidence**: `scripts/praetorian/semantic-search.js:55-58` の `search()` は `[]` を返すスタブ。既存 Praetorian 検索エントリポイント（単語索引側）との統合点が未定義。`MEMORY_FINAL_VERDICT.md:43` の「embedding index を並列追加」の具体的アルゴリズム不在。
**Category**: architecture
**Severity**: high
**Position**: B/C/D 共通の設計課題

### Finding 2.2
**Issue**: TAISUN は他人配布を目標とするが、Ollama は別プロセス・別ライフサイクル。インストーラ（install.sh）に Ollama セットアップを組み込むか、optional とするかの方針が未定。
**Evidence**: 指示書:75-76 に「Change install.sh/setup-project.sh paths or CLI args」禁止。Ollama 統合の文書化のみで実装非依存にする必要あり。`PHASE3_FINAL_CONSENSUS.md:41-42` の airis-mcp-gateway DISPUTED で Codex は Docker 依存を「他人インストール容易性と矛盾」と否定。Ollama も同論で要警戒。
**Category**: config
**Severity**: high
**Position**: B 採用なら opt-in に強制すべき

### Finding 2.3
**Issue**: semantic-search.js のスタブ interface は `embed()` が単一テキスト→Float32Array を返す前提だが、cpt_*.toon は数百〜数千 tokens あり、512 token chunk のチャンク戦略が未設計。チャンク間の集約戦略（mean pool / max pool / first chunk のみ）も未定。
**Evidence**: `scripts/praetorian/semantic-search.js:38-40` の `embed(_text)` が単一引数。指示書:96 で「Chunk by 512 tokens」とあるが、検索時に chunk → compaction の集約方法が未明示。
**Category**: architecture
**Severity**: medium
**Position**: B/C/D で要設計

---

## Round 3: エラー処理 — 障害時にどうなるか

### Finding 3.1
**Issue**: Ollama HTTP 呼び出し（B）は接続失敗・タイムアウト・モデル未ダウンロード等の失敗モードが多い。スタブには再試行・タイムアウト・サーキットブレーカーの設計なし。
**Evidence**: `scripts/praetorian/semantic-search.js` 全体に try/catch なし、HTTP fetch 経路がそもそも未実装。`reasoning-capture.js:95-98` のフェイルオープン設計（catch → null return）が参考になる。
**Category**: code
**Severity**: high
**Position**: B 採用時に必須対応

### Finding 3.2
**Issue**: build-embeddings.js（未作成）が中断された場合の resume 戦略が未定。243 ファイルの途中で OOM/SIGTERM すると「半端な embeddings/ 状態」になり、検索結果の網羅性が壊れる。
**Evidence**: 指示書:96-98 で「Expected: 243 files x 2-5s each = 10-20 min」とあるが、進捗保存・再開ロジックの記載なし。Pattern 9（compact処理のデータ安全性）が示すように「並行/中断書き込み時の整合性」は過去のミスパターン。
**Category**: code
**Severity**: medium
**Position**: B/C/D いずれでも要設計

### Finding 3.3
**Issue**: スタブ `embed()` は `throw` するため、本番経路に偶発的に呼ばれた場合、上位スタックで unhandled rejection になる可能性。少なくとも「stub のため利用不可」の明示的エラー型が必要。
**Evidence**: `scripts/praetorian/semantic-search.js:38-40` `throw new Error('semantic-search: embed() is a stub. ...')` は文字列エラーのみ。Error subclass や errno 相当のコードがない。
**Category**: code
**Severity**: low
**Position**: A（放置）でも改善推奨

---

## Round 4: パフォーマンス — ボトルネック・スケーラビリティ

### Finding 4.1
**Issue**: Ollama nomic-embed-text の埋め込みは典型的に 1 リクエスト 50-200ms（推測、未実測）。243 ファイル × 平均 5 chunk = 1215 リクエスト × 100ms = **約 2 分**（推測）。バッチ並列化なしでは線形時間。
**Evidence**: `MEMORY_FINAL_VERDICT.md:43` で transformers.js の場合「243 files x 2-5s each = 10-20 min」（指示書:98、推測）。Ollama は GPU 使用なら高速、CPU のみだと遅い。本機は Mac の可能性が高く、Apple Silicon Metal 加速の有無未確認。
**Category**: performance
**Severity**: medium
**Position**: 実測必須

### Finding 4.2
**Issue**: 243 ファイル × 384 dim float32 = 243 × 384 × 4 = **373,248 bytes**（実測前推定、計算値）。embedding 索引としては小さく、メモリロード可能。検索時の cosine 計算は O(N × D) で全件走査でも 1ms 未満（実測前推定）。
**Evidence**: 計算: 243 × 384 × 4 = 373,248。MiniLM-L6-v2 は 384 dim、nomic-embed-text は 768 dim（公開仕様、未実測）。768 dim でも 746,496 bytes で軽量。
**Category**: performance
**Severity**: low
**Position**: スケーラビリティ問題なし、効率的

### Finding 4.3
**Issue**: token-baseline.js のような実測ベンチが Priority 1 に未整備。「効果予測: 意味検索 2→5」（MEMORY_FINAL_VERDICT.md:44）は数値根拠なし。実測なしに採否判断はリスク。
**Evidence**: `scripts/benchmark/token-baseline.js` は context tokens を測定するのみで、検索精度・recall@K のベンチは別途必要。`PHASE3_FINAL_CONSENSUS.md:30` の「#21 実測ベンチ基盤」が前提タスク化されている。
**Category**: test
**Severity**: high
**Position**: B/C/D 採用前に #21 実装が前提

---

## Round 5: セキュリティ — 脆弱性・認証・入力検証

### Finding 5.1
**Issue**: 選択肢 C（fastembed-js）は依存チェーン未監査。@xenova/transformers が onnxruntime-web → protobufjs で 4 critical だったため、fastembed-js も同様の onnxruntime 依存の可能性が高い。
**Evidence**: 本セッション 2026-04-17 実測: `npm audit --json` で `protobufjs -> critical Arbitrary code execution`、`onnxruntime-web` 経路。fastembed は ONNX runtime base のため同経路に陥る可能性大（推測、未検証）。
**Category**: security
**Severity**: critical
**Position**: C 採用前に `npm view fastembed dependencies` 等で事前監査必須

### Finding 5.2
**Issue**: Ollama HTTP API（B）はデフォルト localhost:11434 で無認証。同一マシン上の他プロセスから埋め込み問い合わせ可能。本機個人開発用途では許容だが、配布対象が共有環境（VPS等）なら問題。
**Evidence**: Ollama 公式仕様（推測、ユーザー実測未取得）: localhost bind デフォルト無認証。`MEMORY_FINAL_VERDICT.md:7-12` で claude-mem の「無認証バインド」を Critical 扱いした基準と一貫すべき。
**Category**: security
**Severity**: medium
**Position**: B 採用時、配布対象セグメンテーションで判断

### Finding 5.3
**Issue**: build-embeddings.js（未作成）が cpt_*.toon の内容を Ollama 等に送る場合、過去ログ（PII 含む可能性）が外部プロセスに渡る。Ollama はローカルだが、別プロセス境界を越える設計上のデータフロー記録が必要。
**Evidence**: `MEMORY_FINAL_VERDICT.md:8-12` で claude-mem の「観測データを Anthropic/Gemini API に送信」を Critical 扱い。Ollama はローカルだが「同一原則: PII フローを文書化」が一貫性ある対応。
**Category**: security
**Severity**: medium
**Position**: B/C/D 採用時、PII データガバナンス文書化必須（PHASE3 #23 と連携）

---

## Round 6: ドキュメント品質 — 明示性・誤解防止

### Finding 6.1
**Issue**: 指示書:82-99 の Priority 1 実装手順は @xenova/transformers 前提のまま破棄されていない。次セッションで再び誤って npm install されるリスク。
**Evidence**: 指示書:86 `npm install @xenova/transformers --save-dev` を明示。本セッションで critical 4 件を実測したが、指示書側は無更新。
**Category**: content
**Severity**: high
**Position**: A/B/C/D/E いずれでも指示書アップデート（または mistakes.md Pattern 12 追加）必須

### Finding 6.2
**Issue**: semantic-search.js のスタブコメント (L1-22) は実装意図を記すが、「2026-04-17 に @xenova/transformers が critical 4 件で却下された」旨の決定記録がない。次の作業者が再び同じ罠にハマる。
**Evidence**: `scripts/praetorian/semantic-search.js:1-22` のヘッダーコメントは「タスク」「設計原則」のみ。決定経緯（DECISION LOG）の記録がない。
**Category**: content
**Severity**: medium
**Position**: A 採用時もコメント追記必要

### Finding 6.3
**Issue**: MEMORY_FINAL_VERDICT.md は「Priority 1: 2-3日」と工数見積（実測前推定）を出しているが、@xenova/transformers 却下後の見積もり（B/C/D 別）が更新されていない。
**Evidence**: `MEMORY_FINAL_VERDICT.md:39` 「Priority 1: In-house Semantic Search (2-3日)」は transformers.js 想定の見積。Ollama 経由・fastembed-js・純 JS の工数は別途見積必要。
**Category**: content
**Severity**: low
**Position**: 全選択肢で見積もり更新必要

---

## Round 7: コスト効率 — リソース・時間・複雑性

### Finding 7.1
**Issue**: 選択肢 B（Ollama）はユーザーが既に Ollama インストール済みなら追加コストゼロ。未インストールなら数 GB のモデルダウンロード + プロセス常駐。配布対象により ROI が大きく変動。
**Evidence**: nomic-embed-text モデルサイズ（公開情報、推測）約 274MB。Ollama 本体（推測）約 200MB。合計 ~500MB。一方 transformers.js 案は 22MB（指示書:88）だったため軽量だが脆弱性で不可。
**Category**: cost
**Severity**: medium
**Position**: B は既ユーザーには低コスト、新規には高コスト

### Finding 7.2
**Issue**: 選択肢 D（純 JS）は依存ゼロ・即実装可能だが、Round 1.1 で示した通り「semantic」要件不充足。実装コスト低 × 効果低 = ROI 不明確。
**Evidence**: TF-IDF + n-gram は 100 行程度で実装可能（推測）。ただし MEMORY_FINAL_VERDICT.md:35 の「8 ブラインドスポット」のうち意味検索ギャップを埋められない。
**Category**: cost
**Severity**: low
**Position**: D は実装容易だが受益小

### Finding 7.3
**Issue**: 選択肢 E（PR マージ優先）は Priority 1 の機会損失ゼロ（後続セッションで再開可能）かつ既存成果（Wave 1-4 + Memory）を本流（main）に統合できる即時価値あり。
**Evidence**: PR #307/#309 は本セッション開始時実測で OPEN, MERGEABLE。Wave 1-4 の 9 コミットは feature/v5-cleanup に閉じている。マージで他開発者・配布対象に成果が届く。
**Category**: process
**Severity**: high
**Position**: E は ROI 最高（即時価値、低リスク、Priority 1 の機会保持）

---

## Round 8: テスタビリティ — テスト可能か・カバレッジ

### Finding 8.1
**Issue**: 既存 `tests/` に semantic-search.js のテストが存在するか不明。スタブ throw のため、現状は「呼ばれたら落ちる」テストしか書けない。
**Evidence**: 未確認（要 Glob `tests/**/semantic*`）。test:release 1107 件全パス（実測）だが、semantic-search 関連の数を未測定。Pattern 11 に従い計画前に確認必要。
**Category**: test
**Severity**: medium
**Position**: B/C/D 採用前に既存テスト構造確認

### Finding 8.2
**Issue**: cosineSimilarity() のような pure function は decision-free にテスト可能。embed() は外部プロセス/モデル依存のためモック化が必要。両者を分離した設計が望ましい。
**Evidence**: `scripts/praetorian/semantic-search.js:45-47` の cosineSimilarity は throw のみ。実装すれば単体テスト容易。embed() はモック injection で testability 確保可能。
**Category**: test
**Severity**: low
**Position**: 設計原則として支持

### Finding 8.3
**Issue**: ベンチマーク基盤（PHASE3 #21）が「未着手」。Priority 1 の効果を recall@K 等で測る手段が現状ない。実装→効果不明→撤退判断不能のリスク。
**Evidence**: `PHASE3_FINAL_CONSENSUS.md:30` 「#21 実測ベンチ基盤（新規）AGREE」。本セッション Wave 4 で `scripts/benchmark/` ディレクトリは作成済み (`token-baseline.js`, `claude-mem-projection.js`) だが、search 精度ベンチは未作成（実測）。
**Category**: test
**Severity**: high
**Position**: B/C/D 採用前に #21 拡張で search bench 必須

---

## Round 9: 運用性 — ログ・監視・デバッグ

### Finding 9.1
**Issue**: build-embeddings.js（未作成）が長時間バッチ（10-20分推測）になる場合、進捗ログ・ETA 表示が UX 必須。スタブには記載なし。
**Evidence**: `scripts/praetorian/semantic-search.js:60-66` の indexCompaction はログ出力なし。`reasoning-capture.js:48` のような `.claude/hooks/data/` ログ統合パターンが参考。
**Category**: code
**Severity**: low
**Position**: B/C/D で要実装

### Finding 9.2
**Issue**: semantic-search が利用される時、cosine score を含む検索ログが reasoning-log.jsonl 等に統合されないと、「なぜ this compaction が選ばれたか」が後で分からない。Priority 2（reasoning capture）との連携設計が未定。
**Evidence**: `.claude/hooks/reasoning-capture.js:51` `CAPTURE_TOOLS = ['Task', 'Skill', 'Write', 'Edit', 'MultiEdit', 'Bash']`。semantic-search 呼び出しは Bash 経由で記録されるが、検索結果の記録は別途必要。
**Category**: architecture
**Severity**: low
**Position**: B/C/D 採用時に統合設計推奨

### Finding 9.3
**Issue**: Ollama プロセスのヘルスチェック・自動起動チェック・モデル取得確認の運用フローが未定。HTTP 失敗時の診断メッセージが不親切だと配布時のサポート負荷が高い。
**Evidence**: `scripts/taisun-diagnose.js`（package.json L96 で参照）に semantic-search 診断項目なし（推測、未検証）。`taisun:verify`（L93）も同様。
**Category**: code
**Severity**: medium
**Position**: B 採用時に diagnose 統合必要

---

## Round 10: エッジケース — 想定外の入力・境界値

### Finding 10.1
**Issue**: 空文字列・極短テキスト（1 token）・極長テキスト（10K token）の embed() 挙動が未定。chunk 戦略によっては 0 chunk → embedding なし、または OOM の可能性。
**Evidence**: 指示書:96 「Chunk by 512 tokens」だが境界処理未明示。Pattern 8（修正が新たなバグを導入）の典型パターン。
**Category**: code
**Severity**: medium
**Position**: B/C/D 共通の境界処理要件

### Finding 10.2
**Issue**: cpt_*.toon の文字エンコーディングが UTF-8 BOM 付き／改行コードまちまち の場合、tokenizer が誤動作する可能性。`scripts/check-hidden-unicode.js` （package.json L29）が示す通り、TAISUN は Unicode に過去注意を払っている。
**Evidence**: `package.json:29` `check:unicode` script の存在は過去のミス対策。embed() 入力前に正規化が必要。
**Category**: code
**Severity**: low
**Position**: B/C/D で要正規化処理

### Finding 10.3
**Issue**: 検索クエリが空文字列・1 文字の場合、embed が無意味なベクトルを返し、全 compaction とランダムに似て見える可能性。ガード必須。
**Evidence**: `scripts/praetorian/semantic-search.js:55` `search(_query, _topK = 5)` に query 検証なし。
**Category**: code
**Severity**: low
**Position**: B/C/D で要 input validation

---

## Round 11: ユーザー体験（開発者UX）— 使いやすさ

### Finding 11.1
**Issue**: 選択肢 B（Ollama）採用時、初回起動で「Ollama がない」エラーが出ると配布対象（特に非エンジニア・初心者）は困る。インストール案内 or 自動 fallback の UX 設計が必要。
**Evidence**: `MEMORY_FINAL_VERDICT.md:46` 「完全可逆、外部依存ゼロ」原則と矛盾の可能性。`scripts/environment-doctor.js`（agent定義あり）相当の自動診断・ガイドが必要。
**Category**: code
**Severity**: high
**Position**: B 採用なら UX 設計が前提

### Finding 11.2
**Issue**: 選択肢 E（PR マージ優先）は本セッションを「明確な成果コミット」で締めくくれる。9 コミットが main に届くことで配布対象がアップデート可能になる ROI 高い。
**Evidence**: `git log --oneline -12`（実測）で 9 コミット確認済み。PR #307/#309 OPEN, MERGEABLE（実測）。マージ後に他環境で `git pull` 可能。
**Category**: process
**Severity**: high
**Position**: E 強く支持

### Finding 11.3
**Issue**: 選択肢 A（何もしない）はスタブが永続化する。次の作業者が「これは何？」と再調査する非効率を生む。最低限のドキュメント整備（決定記録）が必要。
**Evidence**: `scripts/praetorian/semantic-search.js:1-22` のヘッダーは設計意図のみ。「2026-04-17 に B/C/D を検討した結果」を記録しないと、次のセッションで同じ議論が再発。
**Category**: content
**Severity**: medium
**Position**: A は決定記録の追記とセット

---

## Round 12: 保守性 — 将来の変更しやすさ

### Finding 12.1
**Issue**: Praetorian 単語索引（既存）と embedding 索引（新規）の二層化は、後者を後で別実装に差し替える際のメンテ負荷が高い。「索引層 abstraction」を設計しないと固定化リスク。
**Evidence**: `MEMORY_FINAL_VERDICT.md:43` の「embedding index を並列追加」は2層共存設計。abstraction の設計指針が `semantic-search.js:30-31` の dir 定数のみで不足。
**Category**: architecture
**Severity**: medium
**Position**: B/C/D 採用時、interface 整理推奨

### Finding 12.2
**Issue**: 選択肢 C（fastembed-js）採用時、もし依存に protobufjs/onnxruntime が含まれれば、毎月の `npm audit` で再び critical が出る可能性。長期保守コストが高い。
**Evidence**: 本セッション実測（2026-04-17）で @xenova/transformers が同経路で 4 critical。fastembed-js が同経路ならば同じ脆弱性管理負荷。
**Category**: security
**Severity**: high
**Position**: C は事前依存監査が必須条件

### Finding 12.3
**Issue**: 選択肢 D（純 JS）は依存ゼロで保守容易だが、TF-IDF は SOTA から大きく劣るため、後で「やっぱり semantic 入れる」と再投資が発生。技術的負債を生む可能性。
**Evidence**: 一般的に、semantic 検索を導入してから TF-IDF に戻すケースは稀。逆方向（TF-IDF→semantic）は頻繁。Round 1.1 で示した語彙的限界が根本原因。
**Category**: architecture
**Severity**: medium
**Position**: D は中長期的に再投資コスト

---

## Round 13: データ整合性 — ファイル・状態管理

### Finding 13.1
**Issue**: `.claude/praetorian/embeddings/` ディレクトリは現状未作成（実測: `ls` で No such file）。新設すると .gitignore 設定の検討必要（バイナリ vec ファイルを git 管理するか否か）。
**Evidence**: 本セッション実測で `ls .claude/praetorian/embeddings` → 存在しない。243 × ~1.5KB = 365KB なら git 管理可能だが、再生成可能なら ignore 推奨。
**Category**: config
**Severity**: medium
**Position**: B/C/D 採用時、.gitignore 戦略明示必要

### Finding 13.2
**Issue**: 新規 cpt_*.toon が追加されたとき、embedding 自動生成の hook が必要。手動 build 前提だと「索引が古い」状態が頻発し、Pattern 9（compact処理のデータ安全性）に類する不整合リスク。
**Evidence**: `.claude/hooks/reasoning-capture.js` のような PreToolUse / PostToolUse hook 経路が既にある。compact 完了 → embedding 生成 のフローを統合する必要。
**Category**: architecture
**Severity**: medium
**Position**: B/C/D で要 hook 統合設計

### Finding 13.3
**Issue**: `.claude/praetorian/index.json` の単語バケット索引と並列に embedding 索引を持つ場合、両者の compaction id 集合の差分（embedding がないが単語索引にあるレコード）が検索結果に与える影響が未定義。
**Evidence**: 本セッション Read で `index.json:3-50` の "100" バケットに 47+ compaction id を確認。embedding 側で追従が遅れた場合の挙動が未仕様。
**Category**: architecture
**Severity**: medium
**Position**: B/C/D で要整合性ポリシー

---

## Round 14: ライセンス・コンプライアンス — OSS規約

### Finding 14.1
**Issue**: Ollama は MIT、nomic-embed-text は Apache 2.0（公開情報、要再確認）。配布物に同梱する場合は LICENSE notice 必要だが、Ollama を「外部プロセス前提」で扱えば本体配布から切り離せる。
**Evidence**: package.json:114 `license: MIT`。Ollama 同梱しない設計（B のデフォルト）なら追加 license 義務なし。
**Category**: legal
**Severity**: low
**Position**: B 採用時 README で notice 記載推奨

### Finding 14.2
**Issue**: cpt_*.toon の内容が外部に送信される場合（B/C で外部API / Ollama共有プロセス使用時）、ユーザーがコンセントしたデータか否かの確認フローが必要。プロジェクトに PII 含む可能性。
**Evidence**: Round 5.3 で指摘した PII フロー問題と重複。法務観点では特に「ユーザー同意の事前取得」が必要。`PHASE3_FINAL_CONSENSUS.md:30` #23 データガバナンスと連携。
**Category**: legal
**Severity**: medium
**Position**: B/C 採用時、データガバナンス文書必須

### Finding 14.3
**Issue**: @xenova/transformers の onnxruntime-web 経由で含まれる protobufjs は、CVE 由来の Critical 脆弱性を持つ ECDH 実装等を含む。配布物に含めれば法的責任（特に EU NIS2 等）の論点になる可能性。本セッションで除去済みのため OK。
**Evidence**: 本セッション実測で `npm audit` 4 critical → アンインストールで 0 vulnerabilities 復旧。配布リスクは現状ゼロ。
**Category**: legal
**Severity**: critical (回避済み)
**Position**: 現状維持で問題なし

---

## Round 15: 統合レビュー — Round 1-14 の未解決を総括

### Finding 15.1
**Issue**: Round 1-14 を通じて、選択肢 E（PR マージ優先）が以下 5 軸で最高評価:
- (Round 7.3) 機会損失ゼロ + 即時価値
- (Round 11.2) 9 コミットを main に届ける ROI
- (Round 4.3, 8.3) #21 ベンチ基盤未整備で B/C/D の効果検証不能
- (Round 5.1, 12.2) C は依存監査未完で待機推奨
- (Round 1.1, 12.3) D は要件不充足
**Evidence**: 各 Round の Finding を統合。
**Category**: process
**Severity**: critical
**Position**: **選択肢 E を主軸に据え、Priority 1 は B+ベンチ整備済み後に再開** を提案

### Finding 15.2
**Issue**: Round 6.1, 6.2 の指示書・スタブコメントの陳腐化問題は、選択肢 E でも解決必要。決定記録（DECISION LOG）として mistakes.md または別途 DECISION_LOG.md に追記する作業が必須。
**Evidence**: 指示書:86 と semantic-search.js:1-22 が事実と乖離。
**Category**: content
**Severity**: high
**Position**: E に「決定記録追加」を組み込む

### Finding 15.3
**Issue**: 最終的な「選択肢 F（複合案）」として以下を提案:
1. 即時: 決定記録を semantic-search.js コメントに追加（Round 6.2, 11.3）
2. 即時: PR #307→#309 マージ（Round 7.3, 11.2、要事前承認）
3. 短期: PHASE3 #21 ベンチ基盤に search 精度評価を追加（Round 4.3, 8.3）
4. 中期: ベンチ整備後に B（Ollama opt-in）を検討、C は依存監査前提（Round 5.1, 12.2）
5. 長期: D 単独採用は回避（Round 1.1, 12.3）
**Evidence**: 各 Round の Finding を実行可能タスクに分解。
**Category**: process
**Severity**: critical
**Position**: **選択肢 F（E+決定記録+ベンチ拡張）を最終勧告**

---

## Opus 最終勧告（Codex challenge 前）

**選択肢 F（複合案）を採用**:
- 本セッション: 決定記録追加 + PR マージ準備（要事前承認）
- 次セッション: PHASE3 #21 ベンチ拡張 → 効果検証 → B/C 再判定
- 完全 reject: D 単独採用、@xenova/transformers 再導入

**主要根拠**:
1. 配布性 > 機能性（claude-mem 却下原則）
2. ベンチ未整備で B/C/D 効果不明（PHASE3 #21 前提）
3. PR マージは即時 ROI（9 コミットの本流統合）
4. 機会損失ゼロ（Priority 1 は再開可能）
