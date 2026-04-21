# 01 - Code Quality (Sub-Agent A, archived)

> **Note**: Sub-A was launched with `Explore (very thorough)` which has no Write tool access. Report was returned as text and archived here by Opus 4.7 for Phase 2-4 consumption. Pattern 10 verification is performed separately below.

---

## Executive Summary (Sub-A 原文)

3 Critical, 5 High, 7 Medium, 4 Low. The baseline is green only because the most dangerous hooks are not exercised (unregistered, broken requires, or silent Jest discovery failures).

---

## Findings by Severity (Sub-A 原文、Pattern 10 検証は別セクション)

### Critical

- **C1** `.claude/hooks/cost-warning.js:49` — ESM `export default` in CJS hook file. Currently dead (not registered) but will crash on load if re-registered.
- **C2** `.claude/hooks/__tests__/unified-guard-phase2.test.js:17` — `require('../../hooks.disabled.local/unified-guard.js')` — target directory does not exist. Same broken path at `run-phase2-tests.js:12`. Module-not-found crash if the `hooks` Jest project is run in isolation.
- **C3** `.claude/hooks/deviation-approval-guard.js:19-39, 72-75, 83-88` — 8 DEVIATION_PATTERNS and 2 APPROVED_PATTERNS declared at module scope with `/gi` flag, used with `.test()`. `lastIndex` advances across calls causing non-deterministic matches. Sub-A confirmed via Node REPL.

### High

- **H1** `.claude/hooks/__tests__/unified-guard-phase3.test.js` — custom `TestSuite` class with no `describe/test/it`. Jest imports but registers zero tests.
- **H2** `.claude/hooks/approval-gate.js:98` — uses `process.exit(1)` on billing-classification branch (claims to block). Correct hook-protocol block is `exit(2)`. `copy-safety-guard.js:140` and `workflow-fidelity-guard.js:163` correctly use `exit(2)`.
- **H3** `.claude/hooks/output-verifier.js:70` — `exit(1)` used as "advisory warning" per comment, but hook runner treats exit(1) as error. Breaks PostToolUse chain.
- **H4** `sdd-design`, `sdd-tasks`, `sdd-threat` SKILL.md declare `model: ollama-*` but `requires: {}` (no `tools: ["ollama"]`). `ollama-guard.js` hardcodes a list missing `sdd-tasks` and `sdd-threat`. `check-skill-requirements.js` doesn't cross-check `model:` vs `requires.tools`.
- **H5** `jest.config.js` workflow-phase3 project — `maxWorkers: 1` + comment "run with --runInBand" but neither npm script nor CI enforces `--runInBand`. Race risk on shared `.workflow_state.json` files.

### Medium

- **M1** `readStdin` inline duplicated in 5+ hooks (auto-memory-saver, auto-compact-manager, file-creation-guard, compact-optimizer, task-overflow-guard) with inconsistent 500ms vs 1000ms timeouts. Shared utility exists at `.claude/hooks/utils/read-stdin.js`.
- **M2** `.claude/hooks/auto-memory-saver.js:105` — `const tokens = bytes;` over-counts Japanese 3× (UTF-8 chars = 3 bytes but ≈1-2 tokens).
- **M3** `.claude/hooks/hook-profiler.js:61` — `hook.command.replace('node ', '')` fails for env-guard prefix format (`[ ! -f ... ] && exit 0; node ...`). All registered hooks use this prefix.
- **M4** `.claude/hooks/deviation-approval-guard.js:21-33` — patterns like `/(?:改善|improve)/gi` match legitimate content in comments/READMEs. High false-positive on `Write` tool input.
- **M5** `.claude/hooks/workflow-sessionstart-injector.js:195-196` — `Math.random()` for Pattern question selection. Non-deterministic coverage.
- **M6** `.claude/hooks/definition-lint-gate.js:293-312` — `parseSimpleYaml()` cannot parse lists/nested. Returns `phases: true` for `phases: [...]`. Required-field check falsely passes.
- **M7** 8 unit tests use `jest.mock()` — Pattern 6 violation candidates: overlay, ops-schedule-runner, pipeline-tabs-skillize, rollout, url-bundle, url-bundle-skillize, playwright-cdp, codex-cli-helper.

### Low

- **L1** `$HOME/Desktop` hardcoded path in 3 hooks: file-creation-guard.js:164, session-handoff-generator.js:170, workflow-sessionstart-injector.js:157. macOS-only, not portable.
- **L2** `.claude/hooks/cost-hard-stop-guard.js:155-156` — recordCost before threshold check, off-by-one on boundary.
- **L3** `.claude/skills/note-research/SKILL.md` — `allowed-tools:` with empty value. Schema anomaly.
- **L4** `.claude/hooks/unified-guard.js:28-34` — CACHE.stateLoadedAt / stateFile / regexPatterns declared but TTL mechanism never exercised.

---

## Coverage Gaps (Sub-A 原文)

1. `approval-gate.js` exit-code behavior — no test.
2. `deviation-approval-guard.js` regex statefulness — no test.
3. `ollama-guard.js` advisory behavior — no test.
4. `definition-lint-gate.js` YAML list handling — no test.
5. `compact-optimizer.js` dynamic threshold doubling — no test.
6. `output-verifier.js` structured tool_result — string only.

---

## Cross-Agent Handoffs (Sub-A 原文)

- To B (Docs): `hooks.disabled.local` absence should be documented; `OLLAMA_REQUIRED_SKILLS` list needs sync with frontmatter.
- To C (Security): `deviation-approval-guard.js` stateful regex may be exploitable via two-part prompts; `approval-gate.js` exit(1) billing gap is a security regression.
- To D (Architecture): `hook-profiler.js` cannot measure any registered hook due to env-guard prefix — architecturally disconnected.
- To E (CI): C2 + H1 affect hooks Jest project; verify CI matrix runs hooks project in isolation.

---

## Pattern 10 Self-Check (Sub-A 原文)

Sub-A claims all findings verified by reading actual source files, C3 confirmed via Node REPL, H2 via cross-check of 3 hook files.

---

## Opus 4.7 独立検証状況（Pattern 7 遵守）

Phase 4 統合時に実ファイルを開いて C1-C3 / H1-H5 を目視再検証する。
Sub-A 報告を鵜呑みしない方針（mistakes.md Pattern 7）。
