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

---

## 2026-01-17 Mistake: skill-instruction-ignored
- **Symptom**: 「youtubeschool-creatorのスキルを使って」という指示を無視し、手動実装を行った
- **Where it happened**: 動画2-10の生成時
- **Fix**: スキル指示がある場合は必ずSkillツールを使用する
- **Prevention**:
  - [ ] スキル指示を検出したら必ずSkillツールで呼び出す
  - [ ] 手動実装は絶対禁止

---

## 2026-01-17 Mistake: workflow-instruction-ignored
- **Symptom**: 「同じワークフローで」という指示を無視し、異なるワークフローで実行した
- **Where it happened**: 動画2-10の生成時
- **Fix**: 既存スクリプト（create_video.py等）をReadツールで読んでから作業する
- **Prevention**:
  - [ ] 「同じワークフロー」指示がある場合は既存ファイルをReadする
  - [ ] 確認せずに新規作成は絶対禁止

---

## 2026-01-17 Mistake: existing-file-not-read
- **Symptom**: 動画1のcreate_video.pyを読まずに、新しいスクリプトを作成した
- **Where it happened**: 動画2-10の生成時
- **Fix**: 既存スクリプトをReadツールで確認してから作業する
- **Prevention**:
  - [ ] 既存スクリプトが存在する場合は必ずReadで確認
  - [ ] 確認せずに新規作成は絶対禁止

---

## 2026-01-17 Mistake: summary-ratio-ignored
- **Symptom**: 「80%要約」という指示を「30%に圧縮」と解釈した
- **Where it happened**: コンテンツ生成時
- **Fix**: 要約比率を厳守する
- **Prevention**:
  - [ ] 指定された要約比率を変更しない
  - [ ] 勝手な圧縮率変更は絶対禁止

---

## 2026-01-07 Mistake: success-true-on-error
- **Symptom**: オプショナル依存エラー時に `success: true` を返していた
- **Root cause**: エラーハンドリングの設計ミス。失敗を成功として報告
- **Where it happened**: `src/proxy-mcp/ops/schedule/runner.ts`
- **Fix**: `success: false, skipped: true` に変更
- **Prevention**:
  - [ ] catch ブロックで success: true を返す前に、本当に成功なのか確認する
  - [ ] オプショナル依存のエラーは skipped フラグで区別する
- **Related constraints**: エラー状態を正確に報告する

---

## 2026-01-07 Mistake: command-injection-vulnerability
- **Symptom**: execSync で文字列補間を使用、コマンドインジェクション脆弱性
- **Root cause**: シェルコマンド構築時のセキュリティ考慮不足
- **Where it happened**: `src/proxy-mcp/supervisor/github.ts` (5箇所)
- **Fix**: execSync → spawnSync + 配列引数に変更
- **Prevention**:
  - [ ] ユーザー入力をシェルコマンドに渡す際は必ず spawnSync + 配列引数を使う
  - [ ] execSync の文字列補間は禁止
- **Related constraints**: OWASP Top 10 準拠

---

## 2026-01-07 Mistake: silent-error-catch
- **Symptom**: catch ブロックでエラーを握りつぶし、デバッグ困難
- **Root cause**: エラーログの欠如
- **Where it happened**: `src/proxy-mcp/browser/cdp/session.ts`
- **Fix**: console.debug でエラーメッセージをログ出力
- **Prevention**:
  - [ ] 空の catch ブロックは禁止
  - [ ] 最低でも debug レベルでエラーをログする
- **Related constraints**: 可観測性の確保

---

## 2026-01-07 Mistake: chrome-origin-wildcard
- **Symptom**: Chrome CDP の --remote-allow-origins=* で全オリジン許可
- **Root cause**: セキュリティ設定の見落とし
- **Where it happened**: `src/proxy-mcp/browser/cdp/chrome-debug-cli.ts`
- **Fix**: localhost のみに制限
- **Prevention**:
  - [ ] ワイルドカード許可は本番環境で使わない
  - [ ] ネットワークアクセス設定はデフォルト deny
- **Related constraints**: 最小権限の原則

---

## 2026-01-07 Mistake: utf8-boundary-crash
- **Symptom**: 日本語/マルチバイト文字を含むファイルの一括置換でクラッシュ
- **Root cause**: UTF-8文字列をバイト位置でスライス/置換する処理が文字境界を考慮していない
- **Where it happened**: Claude Code内蔵の一括置換機能（外部要因のため修正不可）
- **Fix**: safe-replace.ts を使用した安全な置換に移行
- **Prevention**:
  - [ ] Claude Code内蔵の一括置換は日本語ファイルに使用禁止
  - [ ] 置換は `npm run text:safe-replace` 経由で実行
  - [ ] 完了前に `npm run text:utf8-guard` で文字化けをチェック
- **Related constraints**: 運用手順の遵守、品質ゲートの通過
- **Documentation**: `docs/operations/text-safety-ja.md`

---

## 2026-02-09 Mistake: tts-number-reading-1000man
- **Symptom**: 「1000万円」が「せんまんえん」と読まれた（正しくは「いっせんまんえん」）
- **Root cause 1**: `text_preprocessor.py` の正規表現 `(\d)?千(万|億|兆)` が漢字「千」しかマッチせず、アラビア数字「1000万」を処理できなかった
- **Root cause 2**: `text_preprocessor.py` がTTS送信時に呼び出されていなかった（前処理パイプラインが未接続）
- **Where it happened**: interactive-vsl-v2 の TTS音声生成（Fish Audio API送信前）
- **Fix**:
  - `text_preprocessor.py` を修正: `([\d,]+)(万|億|兆)` パターンで1000万/3000万/8000億等を正しく変換
  - `_number_to_reading()` メソッドを追加: 千(いっせん/さんぜん/はっせん)・百(さんびゃく/ろっぴゃく/はっぴゃく)・十の位を完全対応
- **Prevention**:
  - [ ] TTS音声生成前に **必ず** `text_preprocessor.py` で前処理を実行する
  - [ ] 「1000万」「3000億」等の数字+大単位パターンは前処理結果を目視確認する
  - [ ] Fish Audio APIにテキストを送信する前に、数字→ひらがな変換が完了していることを検証する
- **Related constraints**: SKILL.md / CLAUDE.md にTTS前処理の必須ルールを追加済み

---

*このファイルは違反検出時に自動更新されます*
