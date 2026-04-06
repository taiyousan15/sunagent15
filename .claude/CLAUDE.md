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

**VIOLATION = CRITICAL ERROR** -> Stop -> Apologize -> Record in `.claude/hooks/mistakes.md` -> Re-execute correctly

## Pre-Flight Checks

Before starting work:
- [ ] Skill instruction? -> Use Skill tool
- [ ] "Same workflow"? -> Read existing files first
- [ ] SESSION_HANDOFF.md exists? -> Read it
- [ ] Summary ratio specified? -> Follow exactly

## Sub-Agent Context Protection (MANDATORY)

### Result Size Control
- **通常タスク**: `結果は500文字以内で要約して返してください`
- **リサーチ・列挙タスク**: `事実・URL・数値を省略せず返してください。不要な修飾語のみ削減`
- **ALL** research/analysis agents MUST use `run_in_background: true`

### Web Research Quality
- WebSearchで検索したら、**結果URLのうち最低3件はWebFetchで実際にページを開くこと**
- 検索結果のスニペットだけでレポートを書くことは**禁止**
- サブエージェントが「十分な情報が集まった」と自己判断して停止することは**禁止**
- 列挙タスク（「N件調査」）では、完了数を明示報告すること

### Delegation Pattern
- 3+ parallel agents: `run_in_background: true` **REQUIRED** (violation = context exhaustion)
- After background agent completes: Read output file, extract key findings only
- Task result >2000chars → `/compact`

### Agent Checkpoint（重要Agent起動時の品質ゲート）

以下のAgent/スキル起動時、プロンプト末尾に **checkpoint 3問** を必ず追加:

**対象:** researcher, Explore(very thorough), implementer, feature-builder, bug-fixer, backend-developer, frontend-developer, architect, system-architect, api-designer, database-designer, requirements-elicitation, ReviewAgent, security-architect

**対象外:** Explore(quick/medium), code-searcher, debate, competition, haiku

**追加するcheckpoint:**
```
--- AGENT CHECKPOINT ---
Q1. あなたの役割を1行で述べよ
Q2. 成果物の形式と制約は？（文字数・WebFetch件数）
Q3. 完了条件は何か？
```

## リサーチ自動発動ルール（MUST）

| トリガーワード | 使うスキル |
|--------------|-----------|
| 「リサーチして」「調査して」「調べて」「深掘りして」 | `/research-system`（全STEP実行） |
| 「リサーチスキル」「リサーチのスキル」「リサーチを使って」 | `/research-system`（全STEP実行） |
| 「ディープリサーチ」「徹底調査」「全力リサーチ」 | `/research-system`（全STEP実行） |
| 「市場調査」「競合調査」「トレンド調査」 | `/research-system`（全STEP実行） |
| 「情報を探して」「詳しく調べて」「全部調べて」 | `/research-system`（全STEP実行） |
| 「無料リサーチ」「フリーリサーチ」 | `/research-system-free` |
| 「動画ダウンロード」「動画を保存」「YouTubeダウンロード」 | `/video-download` |
| 「Instagramダウンロード」「TikTokダウンロード」 | `/video-download` |
| 「Udemyダウンロード」「コースダウンロード」 | `/udemy-download` |
| 「文字起こし」「トランスクリプト」 | `/video-download` + 字幕 |

## Language
- Japanese priority / Technical terms in English OK

## Detailed References
- **ECC・自動適用スキル・OpenCode・CodeGraph・MCP・Hook Safety**: `.claude/references/CLAUDE-L2.md`
- **Specialized workflows**: `.claude/references/CLAUDE-L3.md`
