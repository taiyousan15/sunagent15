# SESSION HANDOFF DOCUMENT

> **CRITICAL**: 次のセッションは必ずこのファイルを読んでから作業を開始すること

**最終更新**: 2026-01-20T15:48:14.953Z
**作業ディレクトリ**: /Users/matsumototoshihiko/Desktop/テスト開発/taisun_agent

## 既存スクリプト（MUST READ）

```
┌─────────────────────────────────────────────────────────┐
│  「同じワークフロー」指示がある場合、以下を必ず使用    │
└─────────────────────────────────────────────────────────┘
```

- `agent_os/runner.py` (7.0KB, 2026/1/10 12:53:40)
- `dist/scripts/run-benchmarks.js` (9.5KB, 2026/1/18 12:13:30)
- `scripts/ollama-process-transcript.sh` (6.2KB, 2026/1/10 12:38:55)
- `tests/test_runner_retry_stop.py` (1.9KB, 2026/1/10 13:01:05)

## ワークフロー定義

- `config/workflows/content_creation_v1.json`
- `config/workflows/priority_based_v1.json`
- `config/workflows/software_development_v1.json`
- `config/workflows/video_generation_v1.json`
- `config/workflows/wf_coding_change_v1.json`

## 生成された出力

- `output/ai_agent_2026_lp.png`
- `output/lp_header_bg.png`
- `output/lp_header_final.png`
- `output/lp_header_json_v1.png`
- `output/test_simple.png`

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