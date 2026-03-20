---
name: dual-ai-review
description: "Dual-AI Review: Implementation AI + Verification AI for regression prevention (30-60% bug reduction)"
version: "1.0.0"
---

# Dual-AI Review Skill

Based on Anthropic's "Evaluator-Optimizer" pattern for quality assurance.

## Overview

Two independent AI agents review code changes:
1. **Implementation AI**: Writes/modifies code
2. **Verification AI**: Reviews for vulnerabilities and issues

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  User Request                                                │
│  └──> Implementation AI (backend-developer, api-developer)   │
│       └──> Code Written                                      │
│            └──> Verification AI (code-reviewer, security-*) │
│                 └──> Issues Found?                           │
│                      ├── Yes: Generate Fix Instructions      │
│                      │   └──> Implementation AI Fixes        │
│                      │       └──> Re-verify (max 3 iterations)│
│                      └── No: ACCEPT                          │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

```yaml
dual_ai_review:
  enabled: true
  max_iterations: 3

  # Implementation AI selection based on task
  implementation_ai:
    api_tasks: "api-developer"
    backend_tasks: "backend-developer"
    frontend_tasks: "frontend-developer"
    database_tasks: "database-developer"
    default: "feature-builder"

  # Verification AI selection based on keywords
  verification_ai:
    security_keywords: ["auth", "security", "permission", "token", "password"]
    security_agent: "security-scanner"

    performance_keywords: ["optimize", "performance", "cache", "speed"]
    performance_agent: "performance-tester"

    default_agent: "code-reviewer"

  # Quality thresholds
  thresholds:
    accept_score: 90
    improve_score: 70
    reject_below: 70
```

## Execution Steps

### Step 1: Select Implementation AI

Based on task keywords, select the appropriate implementation agent:

```bash
# Analyze task keywords
TASK_KEYWORDS="${USER_REQUEST}"

# Select implementation AI
if echo "$TASK_KEYWORDS" | grep -qiE "api|endpoint|rest|graphql"; then
  IMPLEMENTATION_AI="api-developer"
elif echo "$TASK_KEYWORDS" | grep -qiE "frontend|ui|react|component"; then
  IMPLEMENTATION_AI="frontend-developer"
elif echo "$TASK_KEYWORDS" | grep -qiE "database|schema|migration|query"; then
  IMPLEMENTATION_AI="database-developer"
else
  IMPLEMENTATION_AI="backend-developer"
fi

echo "Selected Implementation AI: $IMPLEMENTATION_AI"
```

### Step 2: Select Verification AI

Based on security/performance keywords:

```bash
# Select verification AI
if echo "$TASK_KEYWORDS" | grep -qiE "auth|security|permission|token|password|credential"; then
  VERIFICATION_AI="security-scanner"
  echo "🔐 Security-focused review enabled"
elif echo "$TASK_KEYWORDS" | grep -qiE "performance|optimize|cache|speed|latency"; then
  VERIFICATION_AI="performance-tester"
  echo "⚡ Performance-focused review enabled"
else
  VERIFICATION_AI="code-reviewer"
  echo "📝 General code review enabled"
fi

echo "Selected Verification AI: $VERIFICATION_AI"
```

### Step 3: Execute Implementation

Launch the implementation AI via Task tool:

```yaml
# Task tool invocation
task:
  agent: "${IMPLEMENTATION_AI}"
  prompt: |
    ${USER_REQUEST}

    Requirements:
    - Follow project coding standards
    - Include error handling
    - Add appropriate tests
    - Use absolute paths for all file operations

    After implementation, list all files modified.
```

### Step 4: Execute Verification

After implementation completes, run verification:

```yaml
# Task tool invocation
task:
  agent: "${VERIFICATION_AI}"
  prompt: |
    Review the following changes for issues:

    Modified files: ${MODIFIED_FILES}

    Check for:
    1. Security vulnerabilities (OWASP Top 10)
    2. Logic errors and edge cases
    3. Missing input validation
    4. Improper error handling
    5. Test coverage gaps
    6. Performance issues (N+1 queries, memory leaks)

    Output format:
    - CRITICAL: [issue description] at [file:line]
    - HIGH: [issue description] at [file:line]
    - MEDIUM: [issue description] at [file:line]
    - LOW: [issue description] at [file:line]

    If no issues found, output: "✅ No issues found"
```

### Step 5: Iterate if Needed

If verification finds issues:

```yaml
iteration_loop:
  max_iterations: 3

  on_issues_found:
    # Generate fix instruction (diff-only)
    fix_instruction: |
      Fix ONLY the following issues, do not modify other code:

      ${VERIFICATION_ISSUES}

      IMPORTANT:
      1. Make minimal changes (diff-only)
      2. Do not refactor unrelated code
      3. Preserve existing functionality
      4. Add tests for fixed issues

    # Re-run implementation AI with fix instruction
    action: "re-invoke ${IMPLEMENTATION_AI} with fix_instruction"

    # After fix, re-run verification
    next: "re-invoke ${VERIFICATION_AI}"

  on_no_issues:
    action: "ACCEPT"
    output: |
      ✅ Dual-AI Review Complete

      Implementation AI: ${IMPLEMENTATION_AI}
      Verification AI: ${VERIFICATION_AI}
      Iterations: ${ITERATION_COUNT}

      All quality checks passed.
```

## Expected Results

| Metric | Without Dual-AI | With Dual-AI |
|--------|-----------------|--------------|
| Bug escape rate | 15-20% | 5-8% |
| Security issues | 8-12% | 2-4% |
| Regression rate | 10-15% | 3-5% |
| Review time | N/A | +20-30% |

## Integration Points

### With Reflection Agent

The verification AI's output feeds into reflection-agent scoring:

```yaml
reflection_integration:
  verification_passed:
    quality_bonus: +10
    message: "Dual-AI review passed"

  verification_failed_once:
    quality_penalty: -5
    message: "Required 1 fix iteration"

  verification_failed_max:
    action: "REJECT"
    escalate_to: "human intervention"
```

### With Self-Healing Coordinator

If implementation AI fails, self-healing can:
1. Try alternative implementation AI
2. Simplify the task
3. Escalate to user

## Usage

```bash
# Invoke via command
/dual-ai-review

# Or specify in task request
"Implement user authentication API with dual-AI review"
```

## Best Practices

1. **Always use for security-sensitive code** (auth, payments, data handling)
2. **Use for complex business logic** (multi-step workflows, calculations)
3. **Skip for trivial changes** (typos, comments, simple config)
4. **Monitor iteration counts** - high counts may indicate unclear requirements
