# Mistakes Ledger（ミス台帳）

過去のミスと再発防止策の台帳（要点版）。関連タスク開始時に参照し、失敗が起きたら必ず追記する。
各パターンの詳細（状況・❌間違い・Why・How to apply）は **必ず [.claude/references/mistakes-extended.md](../references/mistakes-extended.md) を Read すること**（明示リンクがないと読まれない: Pattern 13）。

---

## CRITICAL PATTERNS TO AVOID

### Pattern 1: スキル指示の無視
✅ 正解: Skillツールで /〇〇 を呼び出す

### Pattern 2: 既存ファイルの無視
✅ 正解: まず動画1のスクリプトをReadで読み、それを使用する

### Pattern 3: 要約比率の無視
✅ 正解: 80%の内容を維持して要約する

### Pattern 4: セッション継続時の状態無視
✅ 正解: SESSION_HANDOFF.mdを読み、既存ファイルを確認してから作業

### Pattern 5: マルチメディアパイプラインの省略
✅ 正解: スキル定義のフルパイプライン実行（NanoBanana→agentic-vision→Fish Audio→Remotion）

### Pattern 6: 低品質ツールでの代替
✅ 正解: スキル定義の mandatory_tools を確認し、指定されたツールを使用

### Pattern 7: エージェント報告の未検証転記
✅ 正解: 各件を自分でファイルを開いて目視確認し、重大度を独立判定する

### Pattern 8: 修正が新たなバグを導入
✅ 正解: git reset --hardのみをFORCE_UPDATEで保護し、非破壊なZIPフォールバックは常に到達可能にする

### Pattern 9: compact処理のデータ安全性未考慮
✅ 正解: compact中のappendをバッファリングし、rename後にflushする

### Pattern 10: 未検証の数値を「全件一致」と偽る
✅ 正解: 報告前に各数値を実ファイルで1件ずつ数えて照合する。不一致があれば正直に「不一致あり」と報告する

### Pattern 11: archive / local-only commit を残したまま他 branch 作業
✅ 正解: local-only commit が存在する状態で他 branch を切る前に、archive を PR 化 + merge して origin/main に反映してから派生 branch を作る

### Pattern 12: Claude Code skill の「先頭 N 行しか読まない」誤解で本文を雑に大きく書く
✅ 正解: 毎セッションのコンテキスト削減は description と when_to_use の短縮で達成。本文削減は skill 呼び出し時の on-demand コンテキストに限定して効く別効果として扱う

### Pattern 13: サブファイル（reference.md 等）を置くだけで自動ロードされると誤解
✅ 正解: SKILL.md 本文で `[reference.md](reference.md)` のように明示参照リンクを必ず書く。書かないと Claude は reference.md を読まない

### Pattern 14: SESSION_HANDOFF.md を自動生成テンプレートのまま放置して「引き継ぎ済み」と思う
✅ 正解: /session-end 後に SESSION_HANDOFF.md の中身を Read し、本セッション固有の (1) 最新 HEAD / branch、(2) open PR 一覧、(3) 次セッション最優先アクション 1-3 件 を追記する

### Pattern 15: 数値修正時にSSoT（CIが参照する生成元）を特定せず表示文を根拠にする
✅ 正解: 数値を「正す」前に、CI ジョブ・生成スクリプトを grep して正本（SSoT）を特定し、そこから導出された値で全箇所を同期する

---

## 修正済みミス履歴

→ `.claude/archive/mistakes-history.md` に移動（16件、監査証跡として保持）

---

*このファイルは違反検出時に自動更新されます*
