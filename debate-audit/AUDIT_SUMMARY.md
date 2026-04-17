# TAISUN Agent Audit Summary (Phase 1 + 2)

## Phase 1: Repository Audit

### 1-A: Functionality — FAIL (95% functional)
- line-bot-mcp-server/ empty directory (dist/index.js missing) - .mcp.json:36 references it (disabled: true so no immediate break)
- tests/integration/metrics-integration.test.ts — jest worker crash → 45 tests fail
- 68 skills OK, 95 agents OK, 62 hooks OK, all package.json scripts valid
- Verdict: production-usable but not 100%

### 1-B: Code Purity — 19 deletion recommendations (693MB impact)
- udemy-downloader/ nested repo (262MB m3u8 + 100MB .venv + logs + nested .git)
- .claude/skills/nanobanana-pro/data/browser_profile/ 313MB browser cache
- .claude/commands/kindle-*.md (unrelated Kindle commands)
- docs/research-knowledge-scaling/ 9 orphan files
- .claude/settings.json.bak.*, .backup, CLAUDE.md.backup-20260407
- .DS_Store x6, .playwright-mcp/*.log
- src/i18n/index.js duplicate with index.ts
- .agent_usage_state.json (local absolute paths)

### 1-C: Security — CLEAN (all 5 items)
- No secrets/API keys leaked
- No eval/Function usage
- No command injection vectors
- npm audit: 0 vulnerabilities
- No credentials committed

### 1-D: Context/Memory — 8/7/9/6 (NOT world #1)
- Strength: 3-layer (pre-compact + temp-context + Praetorian) UNIQUE
- 245 past compactions full-text indexed — UNIQUE
- Hook automation for SESSION_HANDOFF — UNIQUE
- Weakness: No semantic search (Cline MCP Memory wins)
- Weakness: Session ID collision risk (PID-based)
- Weakness: temp-context 24hr TTL — long-term relies on Praetorian search quality
- Scores: Context 8/10, Persistence 7/10, Automation 9/10, World-class 6/10

## Phase 2: Research (2026-04-10 to 2026-04-17)

### 2-A: X (Twitter) Trends
- Routines launched 2026-04-14 (Anthropic cloud scheduled execution)
- v2.1.94 default effort = high (2026-04-07)
- v2.1.97: hook `if` field support
- v2.1.110: PreCompact block support
- MEMORY.md 200-line hard limit discovered
- Context Rot from 20% usage even at 1M tokens
- ENABLE_PROMPT_CACHING_1H env var (v2.1.108+)
- Claude Code: 5.5x fewer tokens, SWE-bench 72.5%
- Cursor 3 launched 2026-04-02 (gap narrowing)
- Cursor ARR $2B (market leader)

### 2-B: note.com Trends (Japan)
- Routines "working AI" paradigm shift
- Slack MCP: OAuth-only, Bot-less
- PreToolUse (code 0=allow, 2=block) + PostToolUse 4 events standard
- 1M token 5-branch control (Continue/Rewind/Clear/Compact/Subagent)
- CLAUDE.md 200-line limit: @import syntax for 5-level nesting
- malna Inc: 70% business AI, recruitment basis shift
- npm version DEPRECATED → native installer recommended

### 2-C: GitHub Trends
- claw-code: 185K stars (Rust reimpl after 2026-03-31 npm leak)
- everything-claude-code (ECC): 183 skills (vs TAISUN 68)
- awesome-claude-code-toolkit: 135 agents + SkillKit 400K skills
- claude-mem: 59.5K stars — Vector DB + 5 hooks, 10x token savings
- hermes-agent: 93.4K stars (weekly #1)
- airis-mcp-gateway: 97% context token reduction via MCP aggregation
- claude-memory-compiler: Karpathy-arch, no Vector DB
- Anthropic Routines preview (2026-04-14)

## Consolidated Position

**TAISUN Unique Strengths:**
- Workflow Fidelity Contract (nowhere else)
- mistakes.md ledger with 11 patterns
- 62 hooks tight integration
- 3-layer context backup
- Praetorian full-text search of 245 past compactions
- /research-system multi-stage pipeline

**TAISUN Gaps vs State-of-Art:**
- Skills: 68 vs ECC 183 (TAISUN 2.7x behind)
- No semantic memory search (Cline wins)
- No automatic session memory (claude-mem wins)
- No MCP aggregation (airis-mcp-gateway wins — 97% token save)
- No Routines/scheduled execution (Anthropic official feature)
- No native Windows testing (PS1 duplication)
- CLAUDE.md @import nesting not utilized

**Deprecated/Outdated:**
- npm version Deprecated (users may need migration)

**Quality Gates (current):**
- Tests: 57/1107 pass (or 1137/1182 depending on scope)
- ESLint: 0
- tsc: 0
- npm audit: 0
- verify-installation: OK 7/警告 0/重大 0
