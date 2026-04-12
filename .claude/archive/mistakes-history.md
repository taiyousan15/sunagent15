# 修正済みミス履歴（監査証跡）

> mistakes.md から分離。毎セッション読み込み不要だが監査証跡として保持。

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
| 2026-04-12 | unverified-number-claim | 「全数値一致」と未検証で言い切った（High 23 vs 25不一致等） | 修正済（Pattern 10で防止） |
