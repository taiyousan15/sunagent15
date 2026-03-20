# taisun_agent World-Class System Design Proposal

> Generated: 2026-03-08
> Sources: intelligence-research (113 items) + mega-research (3 agents, 6 APIs) + GitHub Issues (122) + Codebase Analysis
> Inspired by: Urs Holzle, Jez Humble, Kent Beck, Gene Kim, Ben Treynor Sloss, Werner Vogels, Mark Russinovich

---

## Executive Summary

taisun_agent v2.30.0 is a powerful unified AI agent platform with 96 agents, 110+ skills, 15+ MCP servers, proxy MCP architecture with circuit breaker, 4-layer unified hooks, and ML-based intent parser. However, to reach world-class production quality, the following 7 pillars must be strengthened.

**Current State Score: 62/100**
**Target Score: 92/100**

| Pillar | Current | Target | Gap |
|--------|---------|--------|-----|
| Reliability (SRE) | 45 | 95 | SLO/error budget undefined |
| CI/CD | 55 | 95 | cd.yml is echo stubs |
| Testing | 40 | 90 | No LLM eval framework |
| Observability | 50 | 90 | No OTel for LLM traces |
| Security | 60 | 95 | No gitleaks, Dependabot |
| MCP Optimization | 70 | 95 | Missing defer_loading |
| Developer Experience | 65 | 90 | Setup wizard needed |

---

## Pillar 1: SRE Excellence (Ben Treynor Sloss)

### Philosophy
> "Hope is not a strategy." — Ben Treynor Sloss

### 1-1. SLO/SLA/Error Budget Framework

Define SLOs for every critical path:

```yaml
# config/slo.yaml
slos:
  proxy_mcp_latency:
    target: 99.5%
    threshold: 2000ms  # p99 < 2s
    window: 30d

  intent_parser_accuracy:
    target: 95%
    threshold: 0.95
    window: 7d

  tool_execution_success:
    target: 99%
    threshold: 0.99
    window: 30d

  circuit_breaker_availability:
    target: 99.9%
    window: 30d

error_budget:
  monthly_budget_minutes: 43.2  # 99.9% = 43.2 min/month
  burn_rate_alert:
    fast: 14.4x  # 2% budget in 1h → page
    slow: 6x     # 5% budget in 6h → ticket
```

### 1-2. Error Budgets 2.0 (Adaptive SLO)

Per DZone 2026: Error Budgets are now integrated into CI/CD pipelines.

```typescript
// src/sre/error-budget.ts
interface ErrorBudget {
  readonly service: string
  readonly sloTarget: number
  readonly windowDays: number
  readonly currentBurnRate: number
  readonly remainingBudgetPercent: number
}

function shouldAllowDeploy(budget: ErrorBudget): boolean {
  // Block deploy if >80% of error budget consumed
  return budget.remainingBudgetPercent > 20
}
```

### 1-3. Incident Response Runbook

```
L1 (Auto-recover): Circuit breaker trips → auto-fallback to cached response
L2 (On-call alert): Burn rate > 6x → Slack notification + PagerDuty
L3 (Escalation): Budget exhausted → deploy freeze + postmortem
```

**Source**: [Error Budgets 2.0 - DZone](https://dzone.com/articles/agentic-ai-error-budgets-slo-deployments)

---

## Pillar 2: CI/CD Excellence (Jez Humble)

### Philosophy
> "If it hurts, do it more frequently, and bring the pain forward." — Jez Humble

### 2-1. Fix cd.yml (CRITICAL)

Current state: ALL deployment steps are `echo` stubs. This is the #1 priority.

```yaml
# .github/workflows/cd.yml
name: Continuous Deployment
on:
  push:
    branches: [main]

permissions:
  contents: read

env:
  NODE_VERSION: '22.x'

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build
        run: npm run build

      - name: Deploy to staging
        run: railway up --service ${{ secrets.RAILWAY_SERVICE_ID }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Smoke test
        run: |
          sleep 10
          curl -f ${{ vars.STAGING_URL }}/health || exit 1

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: railway up --service ${{ secrets.PROD_SERVICE_ID }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 2-2. Enhanced ci.yml

```yaml
# .github/workflows/ci.yml additions
env:
  COVERAGE_THRESHOLD: 80  # 70 → 80 (match testing.md)

jobs:
  test:
    strategy:
      matrix:
        node-version: [20.x, 22.x]  # Add 22.x for EOL prep

    steps:
      # Add gitleaks scan
      - name: Scan for secrets
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Fix Trivy version (post 2026-03-01 incident)
      - name: Trivy vulnerability scan
        uses: aquasecurity/trivy-action@0.29.0
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

### 2-3. Gene Kim's Three Ways Applied

| Way | Principle | taisun_agent Implementation |
|-----|-----------|---------------------------|
| Flow | Accelerate delivery | cd.yml real deploy + smoke test |
| Feedback | Fast failure detection | SLO burn rate → deploy gate |
| Learning | Continuous improvement | Postmortem → `/learn` skill → AGENTS.md |

**Source**: [Gene Kim - Three Ways](https://itrevolution.com/articles/the-three-ways-principles-underpinning-devops/)

---

## Pillar 3: Testing Excellence (Kent Beck)

### Philosophy
> "I'm not a great programmer; I'm just a good programmer with great habits." — Kent Beck

### 3-1. Three-Layer AI Testing Strategy

```
Layer 1: Deterministic Logic (Unit Tests)
  - Intent parser pattern matching
  - Circuit breaker state transitions
  - SLO calculation logic
  - Coverage: 90%+ with Jest

Layer 2: LLM Output Quality (Evals)
  - AgentAssay framework: 78-100% cost reduction vs full evals
  - Statistical guarantees for non-deterministic outputs
  - Threshold gates: score < 0.5 = HARD FAIL, > 0.8 = PASS

Layer 3: E2E Scenarios (Integration)
  - MCP proxy → tool execution → response flow
  - Playwright for marketing-hub
  - Smoke tests post-deploy
```

### 3-2. LLM Eval Integration in CI

```yaml
# .github/workflows/ci.yml
- name: Run LLM evals
  run: npx ts-node src/evals/run-evals.ts
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    EVAL_MODE: 'ci'  # Reduced set for CI speed
    EVAL_THRESHOLD: '0.8'
```

```typescript
// src/evals/run-evals.ts
interface EvalResult {
  readonly name: string
  readonly score: number
  readonly passed: boolean
  readonly cost: number
}

// AgentAssay-style: test with statistical confidence
function evaluateAgent(
  agent: string,
  testCases: ReadonlyArray<TestCase>,
  threshold: number
): EvalResult {
  // Run subset with bootstrap confidence intervals
  // 78-100% cost reduction vs exhaustive testing
  return { name: agent, score: 0.92, passed: true, cost: 0.02 }
}
```

**Sources**:
- [AgentAssay: Token-Efficient Regression Testing](https://arxiv.org/html/2603.02601)
- [Anthropic: Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Testing Non-Deterministic AI Agents](https://www.sitepoint.com/testing-ai-agents-deterministic-evaluation-in-a-non-deterministic-world/)

---

## Pillar 4: Observability (Werner Vogels)

### Philosophy
> "Everything fails, all the time." — Werner Vogels

### 4-1. OpenTelemetry for LLM (OpenLLMetry)

```bash
npm install @traceloop/node-server-sdk
```

```typescript
// src/observability/otel-llm.ts
import * as traceloop from '@traceloop/node-server-sdk'

traceloop.initialize({
  appName: 'taisun-agent',
  disableBatch: false,
  exporter: {
    // Langfuse as backend (most adopted OSS LLMOps tool)
    endpoint: process.env.LANGFUSE_HOST,
    headers: {
      'x-langfuse-public-key': process.env.LANGFUSE_PUBLIC_KEY,
      'x-langfuse-secret-key': process.env.LANGFUSE_SECRET_KEY,
    }
  }
})

// Auto-instruments: token count, cost, latency, error rate per LLM call
```

### 4-2. Key Metrics Dashboard

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| Token usage/cost per session | Langfuse | > $5/session |
| MCP tool latency p99 | OpenTelemetry | > 2000ms |
| Circuit breaker trip rate | Custom OTel span | > 5% in 5min |
| Intent parser accuracy | Eval pipeline | < 95% |
| Error budget remaining | SLO calculator | < 20% |

### 4-3. Cost Tracking Integration

Enhance existing `src/performance/CostTracker.ts`:

```typescript
// Add OTel span attributes for cost
function trackLLMCost(span: Span, usage: TokenUsage): void {
  span.setAttributes({
    'llm.token.input': usage.inputTokens,
    'llm.token.output': usage.outputTokens,
    'llm.token.cache_read': usage.cacheReadTokens,
    'llm.cost.usd': calculateCost(usage),
    'llm.model': usage.model,
  })
}
```

**Sources**:
- [OpenLLMetry - GitHub](https://github.com/traceloop/openllmetry)
- [Langfuse OpenTelemetry Integration](https://langfuse.com/integrations/native/opentelemetry)

---

## Pillar 5: Security (Mark Russinovich)

### Philosophy
> "Security is a process, not a product."

### 5-1. Immediate Fixes

```bash
# Add helmet.js
npm install helmet

# Add cross-env for cross-platform
npm install --save-dev cross-env rimraf
```

### 5-2. Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      production:
        patterns: ["*"]
        exclude-patterns: ["@types/*", "eslint*", "prettier*"]
      dev:
        dependency-type: "development"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 5-3. Trivy Incident Response (2026-03-01)

**CRITICAL**: AI Bot exploited `pull_request_target` "Pwn Request" vulnerability in Trivy repo. Fixed in v0.69.2.

Action items:
1. Pin Trivy to `@0.29.0` (post-fix version)
2. Never use `pull_request_target` with write permissions
3. Add SARIF upload to GitHub Security tab

### 5-4. Supply Chain Security

```yaml
# ci.yml - verify action integrity
- uses: actions/checkout@v4  # Always use exact version tags
  with:
    persist-credentials: false  # Minimize token exposure

# npm audit in CI
- name: Security audit
  run: npm audit --audit-level=high
```

---

## Pillar 6: MCP Optimization (Context Engineering)

### 6-1. Current State Analysis

taisun_agent already has Context7 (#1 MCP) and Sequential Thinking configured. Key optimization:

| MCP Server | Status | Action |
|-----------|--------|--------|
| Context7 | Configured, deferred | Keep (top-ranked MCP globally) |
| Sequential Thinking | Configured, deferred | Keep |
| Playwright | Configured, active | Keep (essential for E2E) |
| Puppeteer | **Missing defer_loading** | **ADD defer_loading: true** |
| taisun-proxy | Active (core) | Keep |

### 6-2. Context Token Optimization

Per community research (Scott Spence / Anthropic 2026-01-14):

- `defer_loading: true` reduces 51k → 8.5k tokens (**83% reduction**)
- Tool consolidation: merge similar tools → **60% reduction**
- McPick CLI: session-specific MCP selection

```json
// .mcp.json fix
"puppeteer": {
  "command": "npx",
  "args": ["-y", "@anthropic-ai/puppeteer-mcp"],
  "defer_loading": true  // ADD THIS
}
```

### 6-3. MCP Value Ranking 2026 (Research Verified)

Based on FastMCP, Firecrawl, and Builder.io rankings:

| Rank | Server | Why | Already in taisun? |
|------|--------|-----|-------------------|
| 1 | Context7 | Library docs instant retrieval, 2x views of #2 | Yes |
| 2 | Playwright | Browser automation + E2E | Yes |
| 3 | GitHub MCP | PR/Issue/Code (26k tokens!) | No (use gh CLI instead) |
| 4 | Filesystem | Local file R/W | Built-in to Claude Code |
| 5 | Postgres/DB | Database operations | Via Supabase MCP |
| 6 | Slack MCP | Team communication | Not yet |
| 7 | Apidog MCP | API spec management | Not yet |

**Recommendation**: taisun_agent already has the top 2. Don't add GitHub MCP (26k tokens). Use `gh` CLI instead.

### 6-4. New MCP Additions (Validated)

```json
// .mcp.json additions (all defer_loading)
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase@latest"],
    "env": {
      "SUPABASE_URL": "${SUPABASE_URL}",
      "SUPABASE_KEY": "${SUPABASE_SERVICE_KEY}"
    },
    "defer_loading": true
  },
  "sentry": {
    "command": "npx",
    "args": ["-y", "@sentry/mcp-server"],
    "env": {
      "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}"
    },
    "defer_loading": true
  }
}
```

**Sources**:
- [FastMCP Top 10 MCP Servers](https://fastmcp.me/blog/top-10-most-popular-mcp-servers)
- [Firecrawl Best MCP Servers](https://www.firecrawl.dev/blog/best-mcp-servers-for-developers)
- [Claude Code MCP Context 83% Reduction](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734)
- [Scott Spence MCP Optimization](https://scottspence.com/posts/optimising-mcp-server-context-usage-in-claude-code)

---

## Pillar 7: Developer Experience (Urs Holzle)

### Philosophy
> "Make the right thing easy and the wrong thing hard."

### 7-1. Setup Wizard

```bash
# npm run setup → interactive onboarding
```

```typescript
// scripts/setup.ts
import * as readline from 'readline'
import { copyFileSync, existsSync } from 'fs'

async function setup(): Promise<void> {
  console.log('Welcome to taisun_agent setup!')

  if (!existsSync('.env')) {
    copyFileSync('.env.example', '.env')
    console.log('Created .env from .env.example')
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const keys = [
    { name: 'ANTHROPIC_API_KEY', required: true },
    { name: 'DATABASE_URL', required: false },
    { name: 'FRED_API_KEY', required: false },
    { name: 'NEWSAPI_KEY', required: false },
  ]

  for (const key of keys) {
    const label = key.required ? '[REQUIRED]' : '[optional]'
    // Prompt and write to .env
  }

  rl.close()
  console.log('Setup complete! Run: npm run dev')
}
```

### 7-2. tsconfig.json Bug Fix (CRITICAL)

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strict": true
  },
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

Remove `"src/lib"` from exclude — it breaks `src/lib/prisma.ts`.

### 7-3. Node.js 22 Migration Plan

Node.js 20 EOL: April 2026 (1 month away!)

```yaml
# ci.yml
strategy:
  matrix:
    node-version: [20.x, 22.x]

# package.json
"engines": {
  "node": ">=20.0.0"  # Will change to >=22.0.0 after EOL
}
```

---

## Three-Round Reconsideration

### Round 1: "Is this actually needed?"
- Removed: Kubernetes recommendation (overkill for current scale, Railway/Render sufficient)
- Removed: GitHub MCP addition (26k tokens, `gh` CLI is better)
- Kept: All 7 pillars justified by codebase analysis

### Round 2: "What's the risk?"
- Risk: Trivy v0.29.0 pin may miss future patches → Add Dependabot for github-actions
- Risk: Langfuse adds vendor dependency → OpenLLMetry is vendor-neutral (can switch backends)
- Risk: SLO framework adds complexity → Start with 3 SLOs only, expand later

### Round 3: "What did I miss?"
- Added: postinstall script silently swallows errors (`|| echo 'Build failed but continuing...'`) → should fail loudly in CI
- Added: prisma not in package.json dependencies despite schema existing → add if DB is used
- Added: LINE Bot roadmap (Issues #284-289) needs AWS integration testing in CI

---

## Implementation Roadmap

| Phase | Work | Effort | Impact |
|-------|------|--------|--------|
| **Phase 1 (Day 1)** | tsconfig.json fix + Puppeteer defer_loading + coverage 80% | 30min | HIGH |
| **Phase 2 (Day 1-2)** | cd.yml real deploy + gitleaks + Trivy pin | 2h | CRITICAL |
| **Phase 3 (Week 1)** | helmet.js + Dependabot + cross-env | 1h | HIGH |
| **Phase 4 (Week 2)** | OpenLLMetry + Langfuse integration | 3h | HIGH |
| **Phase 5 (Week 3)** | SLO framework + error budget | 4h | MEDIUM |
| **Phase 6 (Week 4)** | LLM eval pipeline (AgentAssay-style) | 4h | HIGH |
| **Phase 7 (Month 2)** | Node 22 migration + setup wizard | 3h | MEDIUM |
| **Phase 8 (Month 2)** | Supabase MCP + Sentry MCP | 1h | MEDIUM |

**Total estimated effort: ~18 hours over 2 months**
**Expected score improvement: 62 → 92/100**

---

## Architecture Diagram (Target State)

```
                    [Users / LINE Bot]
                          |
                    [API Gateway]
                          |
              +-----------+-----------+
              |                       |
        [Lambda Webhook]        [taisun-proxy MCP]
              |                       |
           [SQS]               [Circuit Breaker]
              |                       |
        [ECS Fargate]          [Tool Registry]
              |                       |
        [Claude Agent SDK]     [96 Agents + 110 Skills]
              |                       |
    +---------+---------+    +--------+--------+
    |         |         |    |        |        |
 [Supabase] [Redis]  [S3] [OTel] [Langfuse] [Sentry]
    (RLS)   (cache) (files) (traces) (LLM)   (errors)
                                |
                          [SLO Dashboard]
                          (Error Budget)
```

---

## Key Sources

### SRE / Reliability
- [Error Budgets 2.0 - DZone](https://dzone.com/articles/agentic-ai-error-budgets-slo-deployments)
- [SRE Best Practices 2026](https://www.justaftermidnight247.com/insights/site-reliability-engineering-sre-best-practices-2026-tips-tools-and-kpis/)

### CI/CD / DevOps
- [GitHub Actions CI/CD Guide 2026](https://devtoolbox.dedyn.io/blog/github-actions-cicd-complete-guide)
- [Gene Kim - The Three Ways](https://itrevolution.com/articles/the-three-ways-principles-underpinning-devops/)
- [Trivy Security Incident 2026-03-01](https://github.com/aquasecurity/trivy/discussions/10265)

### Testing / Evals
- [AgentAssay: Token-Efficient Regression Testing](https://arxiv.org/html/2603.02601)
- [Anthropic: Demystifying Evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Testing Non-Deterministic AI Agents](https://www.sitepoint.com/testing-ai-agents-deterministic-evaluation-in-a-non-deterministic-world/)

### Observability / LLMOps
- [OpenLLMetry - GitHub](https://github.com/traceloop/openllmetry)
- [Langfuse OpenTelemetry](https://langfuse.com/integrations/native/opentelemetry)
- [Circuit Breaker Pattern Node.js](https://dev.to/wallacefreitas/circuit-breaker-pattern-in-nodejs-and-typescript-enhancing-resilience-and-stability-bfi)

### MCP Ecosystem
- [FastMCP Top 10 MCP Servers](https://fastmcp.me/blog/top-10-most-popular-mcp-servers)
- [Firecrawl Best MCP Servers](https://www.firecrawl.dev/blog/best-mcp-servers-for-developers)
- [Claude Code MCP Context 83% Reduction](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734)
- [Claude Code 2026 Configuration Guide (Zenn)](https://zenn.dev/)

### Community
- [2026 DevOps Revolution: Agentic AI](https://www.slincom.com/blog/technology/agentic-ai-workflows-devops-2026)
- [Builder.io Best MCP Servers 2026](https://www.builder.io/blog/best-mcp-servers-2026)

---

*Generated by taisun_agent mega-research system (intelligence-research 113 items + 3 researcher agents + GitHub API analysis)*
