# Baseline Metrics (main `a55c749`, 2026-04-21)

## 品質ゲート

| 項目 | 値 |
|---|---|
| HEAD | a55c749 docs: add project map and vision guide (3-stage rewrite) (#332) |
| Branch | main |
| origin sync | 完全一致 |
| Jest Test Suites | 58 passed / 58 total |
| Jest Tests | 1149 passed / 1149 total |
| Jest time | 5.6s |
| ESLint .claude/hooks/*.js | clean (no output) |
| Skill validator (strict default) | 67/67 pass, 0 warnings |
| Installer parity | Matrix 11 / Verified 20 / Errors 0 |
| Codex CLI | 0.98.0, ChatGPT login active |
| Node | v24.11.1 |
| npm | 11.6.2 |

## 未コミット状態（M 3 件、いずれも review 対象外で touch しない）

- `.claude/hooks/data/agent-guard-detail.json`（hook 自動更新）
- `.claude/hooks/data/compact-metrics.jsonl`（hook 自動更新）
- `.claude/skills/nanobanana-pro/scripts/image_generator.py`（優先1 で別処理）

## Untracked: 約 127 件（個別指定方針）

## プロジェクト規模（セッション19 終了時点、指示書 §7 準拠）

| 指標 | 値 |
|---|---:|
| Git tracked files | ~1,243 |
| 総コード行数 (tracked) | ~299,942 |
| Markdown 総行数 | ~164,365 |
| Skills (SKILL.md) | 67 |
| Agents (subagent_type) | 0（全て Task tool 経由） |
| Tests | 56 files / 58 suites / 1,149 tests |
| Open PRs | 25 |
| CI ジョブ | 22 |

## 5 改善項目の初期状態（定量化の土台）

- **費用抑制**: モデル自動切替（hook）+ sonnet/haiku フォールバック設計 + 予算超過時 haiku 強制の Rule 定義済
- **メモリ強化**: Praetorian MCP optional、claudeMem context 最大 ~465 行/日、session-handoff ファイル機構
- **エラー削減**: mistakes.md Pattern 1-11、Jest 1149 pass、ESLint clean、Portability Guard CI
- **コンテキスト抑制**: PR #330 で session-start Phase 2 を最新 2 ログに制限、Context Safe Compact ルール
- **目的忘却防止**: PROJECT_MAP.md (165行)、目的原文 + 3段階版 tracked、CLAUDE.md で自動ロード
