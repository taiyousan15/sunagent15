# Mistakes Ledger（ミス台帳）

このファイルは過去のミスと再発防止策を記録する台帳です。
失敗が起きたら必ず追記し、関連タスク開始時に参照します。

---

## CRITICAL PATTERNS TO AVOID

### Pattern 1: スキル指示の無視
```
ユーザー: 「〇〇スキルを使って作成してください」
❌ 間違い: 手動でコードを書く
✅ 正解: Skillツールで /〇〇 を呼び出す
```

### Pattern 2: 既存ファイルの無視
```
ユーザー: 「同じワークフローで動画2を作成してください」
❌ 間違い: 新しいスクリプトを作成する
✅ 正解: まず動画1のスクリプトをReadで読み、それを使用する
```

### Pattern 3: 要約比率の無視
```
ユーザー: 「80%要約で作成してください」
❌ 間違い: 「シンプルにするため30%に圧縮しました」
✅ 正解: 80%の内容を維持して要約する
```

### Pattern 4: セッション継続時の状態無視
```
状況: セッションを継続した
❌ 間違い: 前のセッションの状態を確認せずに作業開始
✅ 正解: SESSION_HANDOFF.mdを読み、既存ファイルを確認してから作業
```

### Pattern 5: マルチメディアパイプラインの省略
```
ユーザー: 「インタラクティブVSL動画を生成して」
❌ 間違い: 静的HTMLサイトで代替、macOS sayでTTS、品質検証なし
✅ 正解: スキル定義のフルパイプライン実行（NanoBanana→agentic-vision→Fish Audio→Remotion）
```

### Pattern 6: 低品質ツールでの代替
```
状況: スキル定義で Fish Audio が指定されている
❌ 間違い: macOS say -v Kyoko で代替（「手軽だから」）
✅ 正解: スキル定義の mandatory_tools を確認し、指定されたツールを使用
```

### Pattern 7: エージェント報告の未検証転記
```
状況: 15ラウンドdebate-reviewの結果を集計
❌ 間違い: エージェント報告の35件を自分で検証せず「4 Critical + 12 High」と転記
✅ 正解: 各件を自分でファイルを開いて目視確認し、重大度を独立判定する
Why: エージェントはseverityを過大申告する傾向がある。自分で検証した結果、Critical 4→1、High 12→6に修正された
How to apply: エージェント報告は必ず目視で突合してから報告する
```

### Pattern 8: 修正が新たなバグを導入
```
状況: C2 update.shのFORCE_UPDATEガード追加
❌ 間違い: FORCE_UNDEF時にexit 1 → ZIPフォールバックに到達不能。元の「pullダメ→reset→ZIP」フローが壊れた
✅ 正解: git reset --hardのみをFORCE_UPDATEで保護し、非破壊なZIPフォールバックは常に到達可能にする
Why: セキュリティ修正に集中し、既存のフォールバックフローへの影響を検証しなかった
How to apply: 分岐変更時は全パスのフロー図を書いて検証する
```

### Pattern 9: compact処理のデータ安全性未考慮
```
状況: H6 JsonlStoreに自動コンパクション追加
❌ 間違い: appendLogがcompact中もブロックされない → rename時にデータ欠落
✅ 正解: compact中のappendをバッファリングし、rename後にflushする
Why: isCompactingフラグを「compact起動防止」にしか使わず、「append保護」に使わなかった
How to apply: 並行書き込みがある追記専用ストアの変更時は、必ずwrite-write競合を検証する
```

### Pattern 10: 未検証の数値を「全件一致」と偽る
```
状況: Phase 0統合分析結果(unified-findings.md)の数値をユーザーに報告
❌ 間違い: 「全数値が実ファイルと一致」と言い切ったが、Highヘッダー23 vs 列挙25の不一致、M/L件数、QAスコアは未検証の転記だった
✅ 正解: 報告前に各数値を実ファイルで1件ずつ数えて照合する。不一致があれば正直に「不一致あり」と報告する
Why: 早く完了報告したい心理が「検証済み」の虚偽申告を誘発した
How to apply: 「一致」「全件確認」「問題なし」と言い切る前に、必ず実ファイルを開いて自分の目で数える
```

### Pattern 11: archive / local-only commit を残したまま他 branch 作業
```
状況: セッション20 で作成した local commit 58792ec (docs/reviews/2026-04-21-session20/ archive) を push せず、fix/nanobanana-gemini-2026-ui を origin/main から切った
❌ 間違い: branch 切替で worktree から archive 11 files が消え、PR1 作業に必要な 06-codex-findings.md が消失。復旧のため追加の PR 化 + merge 作業が発生
✅ 正解: local-only commit が存在する状態で他 branch を切る前に、archive を PR 化 + merge して origin/main に反映してから派生 branch を作る
Why: local main HEAD と origin/main HEAD が乖離した状態では、新 branch を origin/main から切ると local 限定 tracked ファイルが消えるのが git の正常動作
How to apply: 新 branch 作成前に `git log origin/main..HEAD` で乖離 commit の有無を確認。あれば先に PR 化 or push してから派生作業を開始
```

### Pattern 12: Claude Code skill の「先頭 N 行しか読まない」誤解で本文を雑に大きく書く
```
状況: SKILL.md の改善設計時、「本文を 30 行に圧縮すれば 16 倍のコンテキスト効率」と私が主張した
❌ 間違い: 公式仕様は「本文（frontmatter 以降）は auto-select 判定に影響しない」「system-reminder 注入は description + when_to_use（max 1,536 字）、/skills 一覧は 250 字切詰め」。本文削減は毎セッション注入量に効かない
✅ 正解: 毎セッションのコンテキスト削減は description と when_to_use の短縮で達成。本文削減は skill 呼び出し時の on-demand コンテキストに限定して効く別効果として扱う
Why: 「短ければ効く」という直感を公式仕様で裏取りしなかった
How to apply: skill 設計時は (a) description 250 字以内、(b) description+when_to_use 合計 1,536 字以内、(c) 本文は skill 呼び出し時のみ読まれる前提で設計
Sources: docs.claude.com/skills, GitHub Issue #40121, #13099, claude-code-guide エージェント確定結果（セッション 21 追補 C 参照）
```

### Pattern 13: サブファイル（reference.md 等）を置くだけで自動ロードされると誤解
```
状況: skill を育てる設計として `.claude/skills/{name}/reference.md` を想定
❌ 間違い: 「ディレクトリに置けば Lazy Load される」と述べたが、公式仕様では自動ロード保証なし
✅ 正解: SKILL.md 本文で `[reference.md](reference.md)` のように明示参照リンクを必ず書く。書かないと Claude は reference.md を読まない
Why: "Convention over configuration" の思い込みで、公式仕様の明示要件を見落とした
How to apply: supporting file を置く skill は必ず SKILL.md 内に参照リンクを書く。レビュー時に「置かれただけで参照されていないファイル」を検出するチェックを追加
```

### Pattern 14: SESSION_HANDOFF.md を自動生成テンプレートのまま放置して「引き継ぎ済み」と思う
```
状況: セッション終了時、session-end hook が SESSION_HANDOFF.md を自動生成（汎用テンプレート）。本セッション固有の PR/作業/判断が入らない
❌ 間違い: /session-end 実行 = 引き継ぎ完了と思い、SESSION_HANDOFF.md の中身を確認せずセッションを閉じる → 次セッションは汎用テンプレートしか読めず、本セッションの具体的な context が失われる
✅ 正解: /session-end 後に SESSION_HANDOFF.md の中身を Read し、本セッション固有の (1) 最新 HEAD / branch、(2) open PR 一覧、(3) 次セッション最優先アクション 1-3 件 を追記する
Why: 自動生成ファイルを「完成品」と過信した。汎用テンプレートは骨組みで、具体情報はセッション Claude が補う必要がある
How to apply: /session-end の Phase 4 完了前に、必ず SESSION_HANDOFF.md を Read → 本セッション固有情報の追記が入っているか確認 → なければ追記してから「保存完了」報告
```

### Pattern 15: セッション中の hook / skill 起動による意図しないファイル変更を baseline 比較で検知しない
```
状況: Phase 2 セッション 34 で .claude/skills/taiyo-analyzer/SKILL.md が dirty 化、.claude/hooks/utils/guard-base.js と .claude/hooks/__tests__/guard-base.test.js が untracked で増加。Edit ツールでは一切触っていないのに /session-end 直前に発覚
❌ 間違い: session-start 時の status を baseline 保存せず、commit 直前 / push 直前 / session-end 直前に baseline 比較しない → 「Phase 2 が他を壊した」とユーザーに誤解される
✅ 正解:
1. session-start 直後に `git status --short > /tmp/session-baseline-status.txt` で baseline 保存
2. 重要 milestone (各 commit 直前 / push 直前 / session-end Phase 1) で `diff /tmp/session-baseline-status.txt <(git status --short)` 実行
3. 想定外 M / ?? の追加があれば即座にユーザー報告し、原因調査
4. 自分が触っていないファイルが dirty 化していたら、commit 範囲から除外（explicit pathspec で守る）
Why: hook chain (PreToolUse / PostToolUse / UserPromptSubmit) や skill 起動時に裏で Write されることがあり、Edit していないファイルが M 化したり untracked が増えたりする。気付かないと「自分の作業が他を壊した」と誤認識を招く
How to apply: 全 session で baseline 保存 → milestone diff チェック → 異常検知 → 報告 → 防御。Phase 2 commit が `.claude/skills/` 配下のみだったように、explicit pathspec を使えば dirty が混入しない
Sources: セッション 34 で実観測（taiyo-analyzer/SKILL.md が `requires: {}` 削除で M、guard-base.js/test.js が新規 untracked）
```

---

## 修正済みミス履歴

→ `.claude/archive/mistakes-history.md` に移動（16件、監査証跡として保持）

---

*このファイルは違反検出時に自動更新されます*
