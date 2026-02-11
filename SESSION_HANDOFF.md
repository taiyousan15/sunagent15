# SESSION HANDOFF DOCUMENT

> **CRITICAL**: 次のセッションは必ずこのファイルを読んでから作業を開始すること

**最終更新**: 2026-02-11
**作業ディレクトリ**: /Users/matsumototoshihiko/taisun_agent

## 直近の完了作業: sns-research2026 リポジトリ作成

### 完了済み (2026-02-11) - sns-research2026 GitHub リポジトリ作成
- **リポジトリ**: https://github.com/san15/sns-research2026
- **内容**: taisun_agentのSNSリサーチ関連13スキルを独立リポジトリ化
- **ファイル数**: 40ファイル（11,209行）
- **対応SNS**: X/IG/YT/TikTok/note/Reddit/LinkedIn/Medium/Bilibili/知乎/小红書（11プラットフォーム）
- **GitHub Issues**: 5件作成（スクレイピング基盤/トレンド検知/競合分析/レポート生成/センチメント分析）
- **ログ**: `docs/logs/2026-02-11_sns-research2026-setup.md`（sns-research2026リポ内）

### 完了済み (2026-02-11) - LINE AI Agent 統合リサーチ + GitHub Issues
- **目的**: LINEから「アプリ作って」等のメッセージでAIがコード実行・ツール使用・成果物をLINEで返すシステム
- **リサーチ規模**: 6エージェント × 2ラウンド（OpenClaw+MCP、AWS Security、ビジネスモデル、日本市場、技術検証、50ユースケース）
- **推奨アーキテクチャ**: Hybrid Option 3 (Claude Agent SDK + OpenClaw)
  - LINE → API Gateway → Lambda (200ms応答) → SQS → ECS Fargate (Claude Agent SDK) → Push Message
- **CRITICAL制約**: LINE Webhook 2秒タイムアウト → 非同期パターン必須
- **AWS構成**: VPC + Public/Private Subnets、Lambda + SQS + ECS Fargate
- **コスト**: $190-340/月(50ユーザー) ～ $1,145-2,695/月(500ユーザー)
- **50ユースケース**: 7カテゴリ（収益High 23件/Medium 22件/Low 5件）
- **Praetorian保存先**: `cpt_1770725168008_kuha4` (統合レポート)
- **GitHub Issues**: #284-#289（Phase 1-6、6件作成済み）
- **次のアクション**: Phase 1 MVP実装開始（Issue #284）
- **ユーザー指示**: 全作業でgit push + ログ + Issue作成を毎回実施

### 完了済み (2026-02-11) - ローカルI2V vs fal.ai比較テスト
- ローカルCogVideoX-5B I2V テスト: M4 Max MPSで実行不可（5-7.5h/clip推定）
- fal.ai MiniMax Hailuo I2V テスト: 4.2分、$0.28/clip、3.5MB
- 比較テストログ: `docs/logs/2026-02-11_local-i2v-vs-falai-test.md`
- 決定: fal.ai MiniMax を全6動画シーンで使用（$1.68 ≈ 250 JPY）

### 完了済み (2026-02-09)
- Voice AI MCP Server: 20ファイル、ビルド済み (`mcp-servers/voice-ai-mcp-server/`)
- AI SDR MCP Server: 25ファイル、ビルド済み (`mcp-servers/ai-sdr-mcp-server/`)
- スキル4つ: voice-ai, ai-sdr, lead-scoring, outreach-composer
- エージェント4つ: voice-ai-agent, sdr-coordinator-agent, lead-qualifier-agent, outreach-agent
- ワークフロー2つ: voice_ai_v1.json, sdr_pipeline_v1.json

## 既存スクリプト（MUST READ）

```
┌─────────────────────────────────────────────────────────┐
│  「同じワークフロー」指示がある場合、以下を必ず使用    │
└─────────────────────────────────────────────────────────┘
```

- `agent_os/runner.py` (7.0KB, 2026/1/24 16:22:42)
- `dist/scripts/run-benchmarks.js` (9.5KB, 2026/2/8 15:32:38)
- `scripts/ollama-process-transcript.sh` (6.2KB, 2026/1/24 16:22:42)
- `tests/test_runner_retry_stop 2.py` (1.9KB, 2026/1/24 16:22:42)
- `tests/test_runner_retry_stop.py` (1.9KB, 2026/2/1 23:23:45)

## ワークフロー定義

- `config/workflows/content_creation_v1.json`
- `config/workflows/priority_based_v1.json`
- `config/workflows/software_development_v1.json`
- `config/workflows/video_generation_v1.json`
- `config/workflows/wf_coding_change_v1.json`
- `config/workflows/voice_ai_v1.json` (NEW)
- `config/workflows/sdr_pipeline_v1.json` (NEW)

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