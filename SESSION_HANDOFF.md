# SESSION HANDOFF DOCUMENT

> **CRITICAL**: 次のセッションは必ずこのファイルを読んでから作業を開始すること

**最終更新**: 2026-03-14T04:56:10.552Z
**作業ディレクトリ**: /Users/matsumototoshihiko/taisun_agent

## 既存スクリプト（MUST READ）

```
┌─────────────────────────────────────────────────────────┐
│  「同じワークフロー」指示がある場合、以下を必ず使用    │
└─────────────────────────────────────────────────────────┘
```

- `agent_os/runner.py` (7.0KB, 2026/2/16 7:20:42)
- `dist/scripts/run-benchmarks.js` (9.5KB, 2026/3/9 21:10:34)
- `generate_10_slides.py` (2.3KB, 2026/2/16 7:20:42)
- `generate_full_guide.py` (5.0KB, 2026/2/16 7:20:42)
- `generate_install_slides.py` (2.7KB, 2026/2/16 7:20:42)
- `scripts/generate-release-approval.sh` (11.4KB, 2026/2/16 7:20:42)
- `scripts/ollama-process-transcript.sh` (6.2KB, 2026/2/16 7:20:42)
- `scripts/text_preprocessor.py` (11.2KB, 2026/2/16 7:20:42)
- `tests/test_runner_retry_stop.py` (1.9KB, 2026/2/16 7:20:42)

## ワークフロー定義

- `config/workflows/content_creation_v1.json`
- `config/workflows/priority_based_v1.json`
- `config/workflows/sdr_pipeline_v1.json`
- `config/workflows/software_development_v1.json`
- `config/workflows/video_generation_v1.json`

## 次のセッションへの指示

### MUST DO（必須）

1. **このファイルを読む** - 作業開始前に必ず
2. **既存スクリプトを確認** - 新規作成前にReadツールで読む
3. **ユーザー指示を優先** - 推測で作業しない
4. **スキル指定を遵守** - 「〇〇スキルを使って」は必ずSkillツールで

### MUST NOT DO（禁止）

1. **既存ファイルを無視して新規作成** - 絶対禁止
2. **「シンプルにする」と称して異なる実装** - 絶対禁止
3. **指定比率を無視した要約** - 絶対禁止
4. **スキル指示を無視した手動実装** - 絶対禁止

---

*このファイルはセッション終了時に自動生成されます*

---

## 🗂️ TCPS Ledger（/compact 前バックアップ履歴）

| 日時 | バックアップファイル | 保存件数 |
|------|-------------------|---------|
| 2026-03-16T15:54 | pre-compact-2026-03-16T15-54-24-635Z.json | 1件 |
| 2026-03-16T15:54 | pre-compact-2026-03-16T15-54-24-598Z.json | 1件 |
## 🔑 台本・コンテンツ整合性状態

| 項目 | 状態 | 最終確認 |
|------|------|---------|
| 監視ファイル設定 | ✅ `.claude/hooks/config/tcps-watch-files.json` | 2026-03-17 |
| バックアップ先 | ✅ `scripts/originals/backups/` | 2026-03-17 |
| PreToolUse hook | ✅ `pre-compact-save.js` 登録済み | 2026-03-17 |
| seed スクリプト | ✅ `marketing-hub/scripts/seed-kindle-ai-seminar-lp.ts` (652行) | 2026-03-17 |
| watchFiles 更新 | ✅ seed + script-master.md を監視対象に追加済み | 2026-03-17 |
| script-master.md | ✅ `scripts/originals/script-master.md` (28セクション) | 2026-03-17 |
| Stop hook | ✅ `session-end-ledger.js` 登録済み（Ledger 自動更新） | 2026-03-17 |
