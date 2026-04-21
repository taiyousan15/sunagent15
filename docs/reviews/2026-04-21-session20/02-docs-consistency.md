# Sub-Agent B: Documentation Consistency Review
# TAISUN v2 — Session 20 Parallel Review

**Reviewer**: Sub-Agent B (Documentation Consistency)
**Date**: 2026-04-21
**Deliverable path**: `.claude/temp-context/session20-review/02-docs-consistency.md`
**Pattern 10 self-check**: Every numeric claim and quote in this report was verified by opening the actual file with Read or Bash before being recorded. No values were transcribed from memory alone.

---

## Section 1: Numeric Drift and Contradictions Between Documents

### 1.1 Hook Layer Count: 13 vs 14 (same README.md)

- **File**: `README.md`
- **Line 432**: "13層防御Hookシステム | 30点"
- **Line 461**: "Hookシステム | 14層"
- **Contradiction**: The same document uses both "13層" and "14層" within 29 lines of each other.
- **Source of 13**: `.claude/references/CLAUDE-L2.md` lines 2–21 explicitly enumerate Layers 0–12 (13 total).
- **Verdict**: Line 461 "14層" is incorrect. Should be 13層 to match CLAUDE-L2.md and README line 432.

### 1.2 MCP Count: 21 vs 15+

- **File**: `README.md`
- **Line 281**: "MCP 21個"
- **Line 462**: "MCPサーバー | 15+"
- **Contradiction**: 21 (specific count) versus 15+ (vague lower bound) in the same file.
- **Verdict**: The specific count of 21 on line 281 contradicts the "15+" summary on line 462. One or both values need updating; the precise count should be verified against the actual MCP configuration and a single authoritative number used.

### 1.3 Test Count: 1092 vs 1107 vs 1149 vs 524

| Document | Location | Test Count Claimed |
|---|---|---|
| `README.md` | Line 10 (badge) | 1092 |
| `README.md` | Line 24 (v2.53.3 changelog) | 1107 |
| `docs/PROJECT_MAP.md` | Line 98 | 1,149 |
| `docs/QUICK_START.md` | Line 63 | 524 |
| `.claude/memory/MEMORY.md` | Line 4 | 1092 |

Four different values appear across the documentation suite. The most recently updated value appears to be 1107 (v2.53.3 changelog entry), but PROJECT_MAP.md at 1,149 is even higher, suggesting PROJECT_MAP.md was updated after the changelog. QUICK_START.md at 524 is so far behind as to be actively misleading.

**Verdict**: A single test count must be determined from `npx jest --no-coverage` output and propagated to all five locations. QUICK_START.md is the most urgent fix.

### 1.4 Skills Count: Various Locations

| Document | Claimed Count |
|---|---|
| `README.md` line 14 | 67スキル |
| `docs/PROJECT_MAP.md` line 14 | 67 スキル |
| `docs/QUICK_START.md` line 23 | 59スキル |
| `docs/ARCHITECTURE.md` line 26 | 24 Skills |
| `docs/ARCHITECTURE.md` line 92 | 24種類のスキル |

Verified actual count: 67 SKILL.md files in active skill directories (excluding `_archived` and `_guides`). QUICK_START.md and ARCHITECTURE.md are both wrong.

### 1.5 Agent Count: Various Locations

| Document | Claimed Count |
|---|---|
| `README.md` line 14 | 95エージェント |
| `docs/PROJECT_MAP.md` line 95 | 0 (`.claude/agents/*.md` 未使用) |
| `docs/QUICK_START.md` line 23 | 77エージェント |
| `docs/ARCHITECTURE.md` line 18 | 69 Agents |
| `docs/ARCHITECTURE.md` line 64 | 69種類の専門エージェント |

Verified actual count: 95 files in `.claude/agent-source/` (confirmed). `.claude/agents/` has 0 files (correct per PROJECT_MAP.md line 95). QUICK_START.md (77) and ARCHITECTURE.md (69) are both stale.

### 1.6 Pattern Count in Mistakes Ledger: 10 vs 11

- **File**: `docs/PROJECT_MAP.md`
- **Line 125**: "`mistakes.md`: 過去の失敗と再発防止策（Pattern 1〜11）"
- **Verified**: `.claude/rules/mistakes.md` contains Pattern 1 through Pattern 10 only. Grep for "### Pattern" yields exactly 10 matches. Pattern 11 does not exist.
- **Verdict**: PROJECT_MAP.md line 125 must be corrected to "Pattern 1〜10".

### 1.7 Install Profile Skill Counts vs Baseline

- **File**: `README.md`
- **Line 229**: `--profile minimal` → "92個"
- **Line 231**: `--profile full` → "121個"
- These profile counts are larger than the total active skill count of 67. This implies the profiles include hooks and/or agents in the count, or the profile definitions are stale and include skills that no longer exist.
- **Verdict**: Either (a) clarify what the 92/121 counts include (skills + hooks + agents?), or (b) verify and update the install script profile definitions.

---

## Section 2: Stale File and Path References

### 2.1 ARCHITECTURE.md — Severely Stale (Most Critical)

**File**: `docs/ARCHITECTURE.md` (356 lines)

This document reflects an early version of the project (~24 skills, ~69 agents) and has never been updated to reflect current reality. Specific stale elements:

| Location | Stale Claim | Actual |
|---|---|---|
| Line 18 | "Agent Pool (69 Agents)" | 95 agents in agent-source/ |
| Line 26 | "Skill Library (24 Skills)" | 67 skills |
| Line 64 | "69種類の専門エージェントが格納されている" | 95 agents |
| Line 92 | "24種類のスキルが格納されている" | 67 skills |
| Lines 94–123 | Skill Library: Marketing(11)/Creative(3)/Infrastructure(9)/Research(1) = 24 skills total with specific skill names listed | Completely wrong skill taxonomy; actual skills include session-start, debate-review, sdd-full, research-system, nanobanana-pro, etc. |
| Lines 228–252 | Directory structure shows `.claude/agents/` with subdirectories: coordinators/, architecture/, specialists/, analytics/, etc. | `.claude/agents/` is **empty**. All 95 agents are in `.claude/agent-source/` as flat files with no subdirectory structure. |

The `.claude/agents/` directory structure shown in ARCHITECTURE.md (with coordinator subdirectories) does not exist. This is the single most misleading section in all documentation because it actively contradicts the real file system layout.

### 2.2 CONTRIBUTING.md — Stale Agent Directory Instructions

**File**: `docs/CONTRIBUTING.md`

- **Lines 42–44**: Shows `.claude/agents/` with files like `00-ait42-coordinator.md` — this path does not exist. All agents are in `.claude/agent-source/`.
- **Line 113**: Naming convention "ait42-{agent-name}.md" — may not reflect current naming (actual files in agent-source use patterns like `researcher.md`, `implementer.md`, etc.).
- **Line 119**: `npm run agents:list | grep your-agent-name` — this npm script may not exist. Not verified in package.json scripts section.
- **Impact**: A developer following CONTRIBUTING.md to add a new agent would look in the wrong directory.

### 2.3 CLAUDE-L2.md — Skill Auto-Mapping References Nonexistent Skills

**File**: `.claude/references/CLAUDE-L2.md`
**Lines 27–38**: Skill Auto-Mapping table lists the following skills as if they exist:

| Referenced Skill | Exists in .claude/skills/? |
|---|---|
| `video-course` | NO |
| `interactive-video-platform` | NO |
| `voice-ai` | NO |
| `ai-sdr` | NO |
| `lead-scoring` | NO |
| `outreach-composer` | NO |

None of the six skills in this table exist. The table is a dead reference — if Claude uses this table to route tool calls, it will attempt to invoke skills that cannot be found. This is a functional bug, not just a documentation issue.

### 2.4 nanobanana-pro/SKILL.md — References Nonexistent Sibling Skills

**File**: `.claude/skills/nanobanana-pro/SKILL.md`

- **Lines 22–23**: References `gemini-lp-generator` and `gemini-slide-generator` as "specialized skills" that can be called.
- **Lines 147–148**: Again references both for shared browser profile setup.
- **Verified**: Neither `gemini-lp-generator` nor `gemini-slide-generator` exists in `.claude/skills/`. No directory with either name was found.
- **Impact**: If the user follows the nanobanana-pro workflow and triggers these sub-skills, they will fail silently or produce an error.

### 2.5 research-system/SKILL.md — Multiple Nonexistent Skill References

**File**: `.claude/skills/research-system/SKILL.md`

The following skills are referenced as pipeline steps but do not exist:

| Referenced in SKILL.md | Exists? |
|---|---|
| `/exa-search` | NO |
| `/gem-research` | NO (may have been renamed) |
| `/youtube-summarizer` | NO |
| `/opencli-research` | NO |
| `/deep-research` | NO (only `deep-research-grok` exists) |
| `/tavily-web` | NO |
| `/gather-requirements` | NO |

Additionally, research-system references "ChatGPT 5.4 thinking" as a model accessible via OpenRouter. This model name does not correspond to any known OpenRouter model ID format as of the knowledge cutoff.

**Impact**: research-system is the flagship research skill referenced in CLAUDE.md's auto-trigger table. If it invokes nonexistent sub-skills, the user experience will be broken for the most commonly promoted workflow.

### 2.6 QUICK_START.md — Stale Diagram and Claims

**File**: `docs/QUICK_START.md`

- **Line 23**: System architecture diagram shows "77エージェント + 59スキル" — both numbers are stale (actual: 95 agents, 67 skills)
- **Line 63**: "All 524 tests passed" — as of PROJECT_MAP.md the count is 1,149. This is a 2.2x discrepancy.
- **Line 3**: "5分で動かす最短手順" — the procedure requires `git clone` + `npm install` + `npm test`, none of which complete in 5 minutes on a typical connection/machine. Unrealistic for 30-60代 non-technical users.

---

## Section 3: Vision Misalignment with "太陽のようにみんなを輝かせる"

The canonical vision document (`taisun_agentの目的と目標.md`) defines 5 improvement themes:
1. 費用を抑える (cost reduction)
2. メモリを強化する (memory enhancement)
3. エラーを減らし発生時もスムーズに解決 (error reduction / smooth recovery)
4. コンテキスト消費を抑える (context consumption reduction)
5. 目的・目標・ルールを忘れない (purpose retention)

The following documentation elements contradict or undermine these themes:

### 3.1 video-agent Requires OPENAI_API_KEY (Contradicts Cost/Simplicity Vision)

- **File**: `.claude/skills/video-agent/SKILL.md`
- **Frontmatter**: `requires: env: ["OPENAI_API_KEY"]`
- **README.md line 242** states: "ANTHROPIC_API_KEY だけあれば基本機能は全て使えます"
- **Contradiction**: A listed skill has an undisclosed additional API key requirement. This directly undermines the "basic features all work with just ANTHROPIC_API_KEY" promise and adds cost the user was not told about.

### 3.2 taiyo-style-lp Claims "4.3倍 成約率" Without Evidence

- **File**: `.claude/skills/taiyo-style-lp/SKILL.md` (and echoed in README.md)
- **Claim**: "成約率4.3倍" (4.3x conversion rate improvement)
- **Evidence**: None cited. No methodology, no sample size, no comparison baseline.
- **Vision alignment issue**: The vision centers on honest empowerment of non-technical users. An unsourced performance claim (conversion rate is highly context-dependent) may mislead users about expected results.

### 3.3 ARCHITECTURE.md Written in English — Excludes Target Audience

- **File**: `docs/ARCHITECTURE.md`
- The document headers and technical terms are primarily English, with dense jargon (e.g., "Orchestration Layer", "Capability Matrix", "Adaptive Routing Engine").
- Target audience: パソコン初心者, 主婦, 会社員 aged 30-60.
- **Vision alignment issue**: Even if ARCHITECTURE.md is intended for developers, the system promises to be a hub that "どんな方でも受け入れて使えるように". Technical depth docs should at minimum have a Japanese summary section.

### 3.4 mega-research Has Contradictory Model Directives

- **File**: `.claude/skills/mega-research/SKILL.md`
- **Frontmatter**: `disable-model-invocation: true` and simultaneously `model: opus`
- **Logic conflict**: If model invocation is disabled, the `model: opus` directive is ignored or contradictory.
- **Context theme**: This directly contradicts theme 4 (コンテキスト消費を抑える). If the intent of `disable-model-invocation` is to prevent expensive model calls for cost/context reasons, specifying `opus` as the model defeats that purpose.

---

## Section 4: Audience Fit Gaps (30–60代 Non-Technical Users)

### 4.1 CONTRIBUTING.md — Developer-Only Document Without Audience Warning

**File**: `docs/CONTRIBUTING.md` (417 lines)

The document assumes:
- Knowledge of TypeScript compilation (`npm run build`)
- Git workflow (PR → squash merge, branch naming)
- npm scripts (`npm run test:watch`, `npm run lint:fix`)
- Understanding of Jest test suite architecture
- Agent definition syntax in YAML/Markdown frontmatter

There is no header stating "this document is for developers only". A 50-year-old housewife following the `docs/` folder to understand the system would encounter this document and find it incomprehensible without any guidance to redirect them.

**Fix**: Add a prominent header: "開発者向けドキュメント（上級者用）。一般ユーザーの方は README.md をお読みください。"

### 4.2 QUICK_START.md Step 2 Requires Command Line Knowledge

**File**: `docs/QUICK_START.md`

Step 2 requires: `git clone https://github.com/...`

This is inaccessible to the stated target audience (パソコン初心者). The document title says "5分で動かす最短手順" which implies ease, but the actual procedure is developer-level.

**Fix**: Add a "前提条件" section listing required knowledge, or create a separate `QUICK_START_BEGINNER.md` with step-by-step GUI instructions.

### 4.3 session-end/SKILL.md Hardcodes Desktop Path

**File**: `.claude/skills/session-end/SKILL.md`
**Phase 3**: Saves the handoff document to `$HOME/Desktop/指示書.md`

- This assumes the OS uses a "Desktop" folder at the home directory (macOS/Windows convention).
- Linux environments (where Claude Code can run) may not have `~/Desktop`.
- More importantly, this hardcoded path means all projects share the same single `指示書.md` file — running session-end for project A will overwrite the handoff from project B.
- **Audience fit**: Non-technical users managing multiple projects would lose previous session handoffs without understanding why.

### 4.4 ARCHITECTURE.md Has No Non-Technical Summary

**File**: `docs/ARCHITECTURE.md`

The document is 356 lines of technical architecture with no executive summary or plain-language explanation of what the system does. A non-technical user who opens this file seeking to understand the system would be immediately lost.

**Vision**: "やりたいことを伝えるだけ" — yet the architecture documentation assumes the reader understands agent orchestration patterns, hook event models, and TypeScript module architecture.

---

## Section 5: SKILL.md Description vs Actual Behavior Mismatches

### 5.1 nanobanana-pro References Nonexistent Dependencies (Functional Break)

- **SKILL.md claims**: Can invoke `gemini-lp-generator` and `gemini-slide-generator` as sub-processes.
- **Reality**: Neither skill exists.
- **Behavior mismatch**: Any user following the nanobanana-pro workflow path that triggers these sub-skills will encounter a failure. The SKILL.md does not warn that these are optional or unavailable.

### 5.2 research-system Is the Most Broken Skill Description

- **SKILL.md claims**: A multi-stage pipeline invoking `/exa-search`, `/gem-research`, `/youtube-summarizer`, `/opencli-research`, `/deep-research`, `/tavily-web`, and `/gather-requirements`.
- **Reality**: None of these 7 skills exist in `.claude/skills/`.
- **Behavior mismatch**: research-system is the single most prominent skill in the system — it appears in CLAUDE.md's auto-trigger table for the most common research-related keywords (リサーチ/調査/調べて/深掘り/市場/競合/トレンド). If the pipeline attempts to call these missing sub-skills, the entire research workflow fails.
- **Severity**: Critical. This is the flagship skill and its sub-skill references are all dead.

### 5.3 mega-research Contradictory Frontmatter

- **SKILL.md frontmatter**: `disable-model-invocation: true` combined with `model: opus`
- **Expected behavior of `disable-model-invocation: true`**: Prevents direct model API calls from within the skill (intended to save tokens or enforce agent-only execution).
- **Contradiction**: Simultaneously declaring `model: opus` suggests either (a) the `disable-model-invocation` flag is not implemented and the `model` field is ignored, or (b) both fields are contradictory and only one will take effect depending on execution order.
- **Behavior mismatch**: SKILL.md presents this as a functioning configuration, but the semantics are undefined.

### 5.4 session-start Log Scan Cap vs Description Accuracy

- **SKILL.md Phase 2**: "更新日時順の最新 2 件のみ を Read する"
- **Actual behavior** (per commit #fa4881f "cap Phase 2 log scan to 2 newest logs"): The behavior matches the SKILL.md description.
- **Status**: This is CORRECT — no mismatch here. Noted as a verified-accurate item.

### 5.5 video-agent API Key Requirement Not Disclosed in README

- **SKILL.md**: `requires: env: ["OPENAI_API_KEY"]`
- **README.md line 242**: "ANTHROPIC_API_KEY だけあれば基本機能は全て使えます" (claims only Anthropic key needed for all basic features)
- **Mismatch**: video-agent is listed in the skill library without disclosure that it requires a second API key. A user who only has ANTHROPIC_API_KEY will encounter an error when using video-agent, contradicting the README promise.

---

## Section 6: Missing Documentation

### 6.1 No Document Explains agent-source vs agents Directory Split

The distinction between `.claude/agents/` (empty, unused) and `.claude/agent-source/` (95 active agent definitions) is documented only in PROJECT_MAP.md line 95 as a one-line note. No document explains:
- Why this split exists
- When was it introduced
- How to add a new agent (CONTRIBUTING.md points to the wrong directory)
- What the `subagent_type` routing mechanism is and how it works

**Impact**: Any contributor following current documentation will attempt to add agents to `.claude/agents/` (as CONTRIBUTING.md instructs) and find their agent is never invoked.

### 6.2 No Migration Guide from ARCHITECTURE.md Era to Current

ARCHITECTURE.md describes a ~24-skill, 69-agent system with a specific directory structure that no longer exists. There is no changelog or migration guide explaining:
- When the skill count grew from 24 to 67
- When the agent count grew from 69 to 95
- When the directory structure changed from `.claude/agents/{subdirs}` to `.claude/agent-source/{flat files}`

Users and contributors who read ARCHITECTURE.md have no way to reconcile it with the actual file system.

### 6.3 No Documentation for CLAUDE-L2.md Skill Auto-Mapping Update Process

`.claude/references/CLAUDE-L2.md` contains a Skill Auto-Mapping table that references 6 nonexistent skills. There is no documented process for:
- Who is responsible for updating this table
- How to add a new skill to the routing table
- What happens when a referenced skill is removed or renamed

The table is a critical routing mechanism (it determines which skill is invoked for which user request), yet it has no maintenance documentation.

### 6.4 No User-Facing "What Does Each Skill Do" Reference

There are 67 active skills. The only user-facing skill reference is:
- CLAUDE.md's "リサーチ自動発動ルール" table (covers ~10 skills via trigger words)
- PROJECT_MAP.md's brief skill categories list (lines 112–118)

There is no comprehensive user-facing guide listing all 67 skills with plain-language descriptions of what each does, when to use it, and what it requires. For a system targeting non-technical 30-60代 users, this is a critical gap.

### 6.5 No Document Describes API Key Requirements Per Skill

At least one skill (video-agent) requires OPENAI_API_KEY in addition to ANTHROPIC_API_KEY. There may be others. No central document lists:
- Which skills require additional API keys
- Which providers (OpenAI, Anthropic, Google, etc.)
- How to obtain and configure each key

README.md line 242's claim that "ANTHROPIC_API_KEY だけで基本機能は全て使えます" is not substantiated with a definition of "basic features" vs "advanced features requiring additional keys".

---

## Pattern 10 Self-Check: Verification Log

Per the Pattern 10 requirement in mistakes.md: "報告前に各数値を実ファイルで1件ずつ数えて照合する"

| Claim in Report | Verified By | Result |
|---|---|---|
| README.md line 432: "13層" | Read README.md lines 425-440 | Confirmed |
| README.md line 461: "14層" | Read README.md lines 455-470 | Confirmed |
| README.md line 281: "MCP 21個" | Read README.md lines 275-290 | Confirmed |
| README.md line 462: "MCPサーバー 15+" | Read README.md lines 455-470 | Confirmed |
| README.md line 10 badge: 1092 | Read README.md lines 1-20 | Confirmed |
| README.md line 24: 1107 | Read README.md lines 20-30 | Confirmed |
| PROJECT_MAP.md line 98: 1,149 | Read PROJECT_MAP.md lines 93-102 | Confirmed |
| QUICK_START.md line 63: 524 | Read QUICK_START.md lines 58-70 | Confirmed |
| PROJECT_MAP.md line 125: "Pattern 1〜11" | Read PROJECT_MAP.md lines 120-130 | Confirmed |
| mistakes.md has 10 patterns not 11 | Grep "### Pattern" in mistakes.md → 10 matches | Confirmed |
| ARCHITECTURE.md line 18: 69 Agents | Read ARCHITECTURE.md lines 15-30 | Confirmed |
| ARCHITECTURE.md line 26: 24 Skills | Read ARCHITECTURE.md lines 22-32 | Confirmed |
| ARCHITECTURE.md lines 228-252: agents/ subdirs | Read ARCHITECTURE.md lines 225-260 | Confirmed |
| .claude/agents/ is empty | Bash ls .claude/agents/ → 0 files | Confirmed |
| .claude/agent-source/ has 95 files | Bash ls .claude/agent-source/ \| wc -l → 95 | Confirmed |
| .claude/hooks/*.js has 62 files | Bash ls .claude/hooks/*.js \| wc -l → 62 | Confirmed |
| QUICK_START.md line 23: 77 agents + 59 skills | Read QUICK_START.md lines 18-30 | Confirmed |
| CONTRIBUTING.md lines 42-44: agents/ subdirs | Read CONTRIBUTING.md lines 38-50 | Confirmed |
| CLAUDE-L2.md 6 nonexistent skills | Read CLAUDE-L2.md lines 27-38 + ls .claude/skills/ | Confirmed |
| nanobanana-pro: gemini-lp-generator missing | Read nanobanana-pro/SKILL.md lines 20-25; ls .claude/skills/ | Confirmed |
| research-system: 7 nonexistent sub-skills | Read research-system/SKILL.md pipeline section; ls .claude/skills/ | Confirmed |
| video-agent requires OPENAI_API_KEY | Read video-agent/SKILL.md frontmatter | Confirmed |
| README.md line 242: ANTHROPIC_API_KEY only | Read README.md lines 238-248 | Confirmed |
| mega-research: disable-model-invocation + model:opus | Read mega-research/SKILL.md frontmatter | Confirmed |
| session-end hardcodes $HOME/Desktop/指示書.md | Read session-end/SKILL.md Phase 3 | Confirmed |
| taiyo-style-lp "4.3倍" unsourced | Read taiyo-style-lp/SKILL.md; no source found | Confirmed |
| README.md line 229: minimal=92, full=121 | Read README.md lines 225-235 | Confirmed |
| Active skill count = 67 | ls .claude/skills/ excluding _archived/_guides \| wc -l | Confirmed |

---

## Priority Summary for Fixing Agents

| Priority | Issue | Effort |
|---|---|---|
| P0-Critical | research-system/SKILL.md references 7 nonexistent sub-skills (flagship skill broken) | High |
| P0-Critical | ARCHITECTURE.md agents directory structure is wrong (misleads contributors) | Medium |
| P1-High | ARCHITECTURE.md skill/agent counts wrong (24→67, 69→95) | Low |
| P1-High | QUICK_START.md test count (524→current) and agent/skill counts | Low |
| P1-High | nanobanana-pro references 2 nonexistent skills | Low |
| P1-High | CLAUDE-L2.md skill auto-mapping table: 6 dead skill references | Medium |
| P2-Medium | README.md: 13層 vs 14層 contradiction | Low |
| P2-Medium | README.md: MCP 21 vs 15+ contradiction | Low |
| P2-Medium | PROJECT_MAP.md: "Pattern 1〜11" should be "Pattern 1〜10" | Trivial |
| P2-Medium | Test count inconsistency across 5 documents | Low |
| P2-Medium | video-agent OPENAI_API_KEY not disclosed vs README "Anthropic only" promise | Low |
| P3-Low | CONTRIBUTING.md audience warning missing | Trivial |
| P3-Low | No agent-source vs agents explanation for contributors | Medium |
| P3-Low | session-end hardcoded Desktop path (multi-project conflict) | Low |
| P3-Low | No per-skill API key requirements document | Medium |
| P3-Low | mega-research contradictory frontmatter | Low |
