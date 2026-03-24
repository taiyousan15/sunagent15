# TAISUN v2 - Ultimate Unified System

## WORKFLOW FIDELITY CONTRACT

### 1. Faithful Execution
When user says "same workflow" or "use XX skill", it is a **contract**.
- No shortcuts, simplifications, or substitutions
- Deviations require **explicit pre-approval**

### 2. Respect Existing Artifacts
- **Never create new scripts without Reading existing ones first**
- **Always Read before modifying any file**
- **Baseline-registered files are immutable**

### 3. No Unauthorized Actions
- Deviations MUST be confirmed: "This action is not in the instructions. May I proceed?"
- **Never deviate without explicit user approval**

### 4. Session Continuity
- Check `.workflow_state.json` (auto-injected)
- Read `SESSION_HANDOFF.md` if present
- Never contradict current phase

### 5. Skill Compliance
When "use XX skill" is specified: **MUST use Skill tool**. Manual implementation is PROHIBITED.

## System Overview

| Component | Count | Reference |
|-----------|-------|-----------|
| Agents | 96 | `/agent-catalog` |
| Skills | 110+ | `/skill-catalog` |
| Commands | 110 | Shortcut commands |
| MCP Servers | 15+ | Core servers |

## Pre-Flight Checks

Before starting work:
- [ ] Skill instruction? -> Use Skill tool
- [ ] "Same workflow"? -> Read existing files first
- [ ] SESSION_HANDOFF.md exists? -> Read it
- [ ] Summary ratio specified? -> Follow exactly

**VIOLATION = CRITICAL ERROR** -> Stop -> Apologize -> Record in `.claude/hooks/mistakes.md` -> Re-execute correctly

## Language
- Japanese priority
- Technical terms in English OK
- Use marketing terminology appropriately

## Sub-Agent Context Protection (MANDATORY)

### Result Size Control (MUST)
- **通常タスク**: `結果は500文字以内で要約して返してください`
- **リサーチ・列挙タスク**: `事実・URL・数値を省略せず返してください。不要な修飾語のみ削減`
- **ALL** research/analysis agents MUST use `run_in_background: true`
- Read background agent output files selectively (use `offset`/`limit`)

### Web Research Quality (MUST)
- WebSearchで検索したら、**結果URLのうち最低3件はWebFetchで実際にページを開くこと**
- 検索結果のスニペットだけでレポートを書くことは**禁止**
- サブエージェントが「十分な情報が集まった」と自己判断して停止することは**禁止**。指示された件数・サイト数を全て完了すること
- 列挙タスク（「N件調査」「全サイト巡回」）では、完了数を明示報告すること（例: 「14サイト中14サイト巡回完了」）

### Delegation Pattern (MUST)
- 3+ parallel agents: `run_in_background: true` **REQUIRED** (violation = context exhaustion)
- After background agent completes: Read output file, extract key findings only
- Task result >2000chars → run `mcp__praetorian__praetorian_compact` if available, otherwise use `/compact`

### Strategic /compact Timing
- **Before** launching 3+ parallel agents
- **Immediately after** receiving large agent results (hook: task-overflow-guard)
- Hook auto-suggests at dynamic intervals (compact-optimizer)

## ECC（Everything Claude Code）スキル活用ルール

### 自動適用するECCスキル
| 場面 | 使用スキル |
|------|-----------|
| コードレビュー時 | coding-standards の基準を適用 |
| 新機能実装時 | tdd-workflow に従いテストファースト |
| 実装完了の判断時 | verification-loop で自動検証 |
| セキュリティに関わるコード変更時 | cc-skill-security-review を適用 |
| コンテキスト圧迫を検知した時 | strategic-compact の基準で判断 |

### OpenCode（セカンドエンジン）
- 通常時: 使わない（Claude Code + TAISUNで十分）
- テストが通らないバグ: `/opencode-fix` で別視点の修正案を取得
- TDDサイクル自動化: `/opencode-ralph-loop` を一時的に有効化（仕様が明確なタスクのみ）
- Ralph Loopは既定OFF。使う時だけONにし、完了後は必ずOFFに戻す

## CodeGraph（コードベース知識グラフ）

### 概要
codebase-memory-mcp がMCPサーバーとして登録済み。コード構造（関数/クラス/依存関係）を知識グラフ化し、query/search/impact分析が可能。

### メモリ責務分離（MUST）
| 保存データ | 保存先 | 理由 |
|-----------|--------|------|
| ユーザー情報・フィードバック | MEMORY.md（SSoT） | 人間が確認・編集可能 |
| プロジェクトルール | MEMORY.md | バージョン管理でチーム共有 |
| コード構造（関数/クラス/依存） | codebase-memory-mcp | 構造化データはDBが最適 |
| コード検索インデックス | codebase-memory-mcp | ファイル変更時に自動更新 |

### 矛盾時のルール
- SSoT = MEMORY.md（最高優先度）
- 矛盾はSESSION_HANDOFF.mdに記録してユーザーに確認

### 活用方法
- コード探索時: Grep/Readの前にcodebase-memoryのsearch_code/query_graphを優先使用
- 変更影響分析: trace_call_path/detect_changesで事前確認
- アーキテクチャ把握: get_architectureで全体像を即取得

## Self-Improvement Loop

- **Cross-session lessons**: See `AGENTS.md` (project root) — auto-loaded every session
- **Record new lessons**: Run `/learn` after resolving non-obvious problems

## Hook Safety (Advisory-only)

Project-level hooks **never block** (shared system):
- `deviation-approval-guard` / `agent-enforcement-guard` / `definition-lint-gate` → exit 0, warning only
- Only `unified-guard` blocks: `rm -rf /`, `mkfs`, `dd if=/dev`, fork bombs

## MCP Caution

- Each MCP server consumes 1,000–26,000 tokens on load
- Keep active MCP ≤ 10 (GitHub MCP alone = 26k tokens)
- Disable unnecessary servers in `.claude/settings.json` → `disabledMcpServers`

## Detailed References

For detailed rules, mappings, and expert workflows:
- **L2** (defense layers, skill mapping, guidelines): `.claude/references/CLAUDE-L2.md`
- **L3** (specialized workflows, audio preprocessing): `.claude/references/CLAUDE-L3.md`
