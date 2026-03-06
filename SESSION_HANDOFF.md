# SESSION HANDOFF DOCUMENT

> **CRITICAL**: 次のセッションは必ずこのファイルを読んでから作業を開始すること

**最終更新**: 2026-03-06T04:00:00.000Z
**作業ディレクトリ**: /Users/matsumototoshihiko/taisun_agent

## 直近の完了作業（v2.34.0）— intelligence-research スキルを taisun_agent に移植

### 内容
- `src/intelligence/` を taisun_agent に追加（マーケティングツール革命から **intelligence コードのみ** を移植）
  - `src/intelligence/index.ts` — エントリポイント
  - `src/intelligence/aggregator.ts` — 集計・スコアリング
  - `src/intelligence/report.ts` — Markdownレポート生成
  - `src/intelligence/scheduler.ts` — スケジューラ
  - `src/intelligence/types/index.ts` — X_WATCH_ACCOUNTS 等の定数定義
  - `src/intelligence/collectors/` — apify / economics / news / rss 各コレクター
- `~/.claude/skills/intelligence-research/SKILL.md` をポータブル化
  - ハードコードされたパス（`/マーケティングツール革命`）を除去
  - シンボリックリンク自動検出ロジック（python3 で dirname × 4段遡り）に変更
  - 他ユーザーへの配布・他プロジェクトへの転用が可能な形に

### 注意
- `src/intelligence/` コードのみ移植。マーケティングツール革命プロジェクト全体は **別プロジェクト**（影響なし）
- `.env` の API キー（FRED_API_KEY, NEWSAPI_KEY, APIFY_TOKEN）は各ユーザーが個別設定（共有しない）

### GitHub
- Commit: c3d4cd6 (feat: intelligence-research スキル移植 + SKILL.md ポータブル化)
- Push 完了: `san15/taisun_agent` main ブランチ

## 前回完了作業（v2.33.0）— /research-system スキル追加

### 内容
- `/research-system` スキルを追加（`~/.claude/skills/research-system/` → シンボリックリンク済み）
- BUILD_TARGETを引数で渡すと、`リサーチ提案v2_SUPER_PROMPT.yaml` を読み込み PRE-FLIGHT → STEP1〜4 を自動実行
- YAML定義でコンテキスト消費52%削減（MD 691行 → YAML 333行）

### GitHub
- Commit: v2.33.0 (feat: /research-system スキル追加)
- Push 完了: `san15/taisun_agent` main ブランチ

## 既存スクリプト（MUST READ）

```
┌─────────────────────────────────────────────────────────┐
│  「同じワークフロー」指示がある場合、以下を必ず使用    │
└─────────────────────────────────────────────────────────┘
```

- `agent_os/runner.py` (7.0KB, 2026/2/16 7:20:42)
- `dist/scripts/run-benchmarks.js` (9.5KB, 2026/2/17 4:17:33)
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