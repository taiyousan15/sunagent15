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

---

## 修正済みミス（圧縮版）

| 日付 | ID | 要約 | 修正状態 |
|------|-----|------|---------|
| 2026-01-17 | skill-instruction-ignored | スキル指示を無視して手動実装 | 修正済（Pattern 1で防止） |
| 2026-01-17 | workflow-instruction-ignored | 「同じワークフロー」指示を無視 | 修正済（Pattern 2で防止） |
| 2026-01-17 | existing-file-not-read | 既存スクリプトを読まず新規作成 | 修正済（Pattern 2で防止） |
| 2026-01-17 | summary-ratio-ignored | 80%指示を30%に圧縮 | 修正済（Pattern 3で防止） |
| 2026-01-07 | success-true-on-error | エラー時に success:true 返却 | 修正済（skippedフラグ導入） |
| 2026-01-07 | command-injection | execSyncで文字列補間 | 修正済（spawnSync+配列に変更） |
| 2026-01-07 | silent-error-catch | 空catchブロック | 修正済（debug log追加） |
| 2026-01-07 | chrome-origin-wildcard | --remote-allow-origins=* | 修正済（localhost制限） |
| 2026-01-07 | utf8-boundary-crash | マルチバイト文字の一括置換クラッシュ | 修正済（safe-replace.ts） |
| 2026-02-09 | tts-number-reading | 「1000万」→「せんまん」誤読 | 修正済（text_preprocessor.py） |
| 2026-02-08 | pipeline-shortcut | パイプラインを静的HTMLで代替 | 修正済（Pattern 5で防止） |
| 2026-02-08 | wrong-tts-engine | Fish Audio→macOS say代替 | 修正済（Pattern 6で防止） |
| 2026-02-08 | text-heavy-images | AI画像テキスト文字化け | 修正済（品質検証必須化） |
| 2026-02-27 | skill-ignored-gem-prompt | Gemプロンプト作成でスキル無視 | 修正済（Pattern 1で防止） |
| 2026-04-07 | checkpoint-self-skip | BOOT CHECKPOINTを自己判断でスキップして作業開始 | 対策実装中（hookによるブロッキング強制化） |

---

*このファイルは違反検出時に自動更新されます*
