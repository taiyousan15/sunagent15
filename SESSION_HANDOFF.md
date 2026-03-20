# SESSION HANDOFF DOCUMENT

> **CRITICAL**: 次のセッションは必ずこのファイルを読んでから作業を開始すること

**最終更新**: 2026-03-20T23:41:22.323Z
**作業ディレクトリ**: /Users/matsumototoshihiko/Desktop/01_開発プロジェクト/テストコンサル開発/セミナー用テスト

## 既存スクリプト（MUST READ）

```
┌─────────────────────────────────────────────────────────┐
│  「同じワークフロー」指示がある場合、以下を必ず使用    │
└─────────────────────────────────────────────────────────┘
```

- `agent_os/runner.py` (7.0KB, 2026/3/19 15:34:08)
- `generate_10_slides.py` (2.3KB, 2026/3/19 15:34:08)
- `generate_full_guide.py` (5.0KB, 2026/3/19 15:34:08)
- `generate_install_slides.py` (2.7KB, 2026/3/19 15:34:08)
- `scripts/generate-release-approval.sh` (11.4KB, 2026/3/19 15:34:08)
- `scripts/ollama-process-transcript.sh` (6.2KB, 2026/3/19 15:34:08)
- `scripts/text_preprocessor.py` (11.2KB, 2026/3/19 15:34:08)
- `tests/test_runner_retry_stop.py` (1.9KB, 2026/3/19 15:34:08)

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