/**
 * Performance System Types for TAISUN v2
 *
 * Type definitions for performance optimization, caching, and benchmarking.
 */

/**
 * Model type for task execution
 */
export type ModelType = 'opus' | 'sonnet' | 'haiku';

/**
 * Task complexity level
 */
export type TaskComplexity = 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
  lastAccessed: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize: number;
  defaultTTLMs: number;
  cleanupIntervalMs: number;
  enabled: boolean;
}

/**
 * Agent selection cache entry
 */
export interface AgentSelectionCache {
  keywords: string[];
  selectedAgents: string[];
  score: number;
  timestamp: number;
}

/**
 * Model selection criteria
 */
export interface ModelSelectionCriteria {
  taskComplexity: TaskComplexity;
  estimatedTokens: number;
  requiresReasoning: boolean;
  isCodeGeneration: boolean;
  timeConstraint?: 'urgent' | 'normal' | 'relaxed';
}

/**
 * Model recommendation result
 */
export interface ModelRecommendation {
  model: ModelType;
  confidence: number;
  rationale: string;
  estimatedCost: number;
  estimatedLatencyMs: number;
}

/**
 * Performance metrics snapshot
 */
export interface PerformanceMetrics {
  timestamp: string;
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
  };
  tokens: {
    inputTotal: number;
    outputTotal: number;
    avgPerRequest: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    evictions: number;
  };
  agents: {
    totalExecutions: number;
    parallelExecutions: number;
    avgExecutionTimeMs: number;
    queueDepth: number;
  };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
    rssMemoryMB: number;
  };
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  concurrentRequests: number;
  burstAllowance: number;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  requestsRemaining: number;
  tokensRemaining: number;
  resetAtMs: number;
  isLimited: boolean;
  waitTimeMs: number;
}

/**
 * Benchmark scenario
 */
export interface BenchmarkScenario {
  id: string;
  name: string;
  description: string;
  category: 'agent-selection' | 'task-execution' | 'cache' | 'api' | 'memory';
  iterations: number;
  warmupIterations: number;
  timeout: number;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  run: () => Promise<unknown>;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  scenarioId: string;
  timestamp: string;
  iterations: number;
  timing: {
    totalMs: number;
    avgMs: number;
    minMs: number;
    maxMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    stdDev: number;
  };
  throughput: {
    operationsPerSecond: number;
    mbPerSecond?: number;
  };
  memory: {
    peakHeapMB: number;
    avgHeapMB: number;
  };
  errors: number;
  success: boolean;
}

/**
 * Benchmark suite configuration
 */
export interface BenchmarkSuiteConfig {
  name: string;
  description: string;
  scenarios: BenchmarkScenario[];
  outputFormat: 'json' | 'markdown' | 'console';
  outputPath?: string;
  baseline?: BenchmarkSuiteResult;
}

/**
 * Benchmark suite result
 */
export interface BenchmarkSuiteResult {
  name: string;
  timestamp: string;
  environment: {
    nodeVersion: string;
    platform: string;
    cpuCount: number;
    totalMemoryMB: number;
  };
  results: BenchmarkResult[];
  summary: {
    totalScenarios: number;
    passed: number;
    failed: number;
    avgThroughput: number;
  };
  comparison?: {
    baselineTimestamp: string;
    improvements: Array<{
      scenarioId: string;
      metric: string;
      baseline: number;
      current: number;
      changePercent: number;
    }>;
    regressions: Array<{
      scenarioId: string;
      metric: string;
      baseline: number;
      current: number;
      changePercent: number;
    }>;
  };
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'cache' | 'model' | 'parallel' | 'api' | 'memory';
  title: string;
  description: string;
  estimatedImpact: string;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  cache: CacheConfig;
  rateLimit: RateLimitConfig;
  parallelExecution: {
    maxParallelAgents: number;
    maxParallelTasks: number;
    queueTimeout: number;
  };
  modelSelection: {
    defaultModel: ModelType;
    preferHaikuFor: string[];
    preferOpusFor: string[];
    complexityThresholds: {
      trivial: number;
      simple: number;
      moderate: number;
      complex: number;
    };
  };
  monitoring: {
    enabled: boolean;
    sampleRatePercent: number;
    metricsRetentionDays: number;
  };
}
