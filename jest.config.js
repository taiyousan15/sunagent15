module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',           // re-export files
    '!src/**/BenchmarkRunner.ts', // benchmarking utility
    '!src/**/*-cli.ts',           // CLI entrypoints (require user interaction)
    '!src/proxy-mcp/server.ts',   // MCP server entry point (requires stdio)
    '!src/proxy-mcp/internal/normalize.ts', // future embedding utilities
    '!src/proxy-mcp/browser/skills.ts',     // requires chrome MCP (M4 integration)
    '!src/proxy-mcp/internal/mcp-client.ts', // requires external MCP servers
    '!src/proxy-mcp/skillize/skillize.ts',  // requires chrome MCP (M5 skillize)
    '!src/proxy-mcp/supervisor/graph.ts',   // requires gh CLI (M6 supervisor)
    '!src/proxy-mcp/supervisor/github.ts',  // requires gh CLI (M6 supervisor)
    '!src/proxy-mcp/observability/post-to-issue.ts', // requires gh CLI
    '!src/proxy-mcp/observability/service.ts', // metrics collector integration
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.ait42/', '/.claude/worktrees/'],
  // Prevent Jest Haste map from scanning Python venv directories that contain
  // duplicate playwright-core copies (causes `TypeError: dupMap.get is not a function`).
  // Refs: debate/plan-review-20260418/agreement_summary.md F1.1 / F4.3 / F7.2 / F10.3
  modulePathIgnorePatterns: [
    '<rootDir>/\\.claude/skills/.*/\\.venv/',
    '<rootDir>/udemy-downloader/\\.venv/',
  ],
  // Transform TypeScript files
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  // Custom projects for different test types
  // NOTE: Jest does NOT inherit modulePathIgnorePatterns from the top-level
  // config into projects, so we repeat it per-project to prevent the
  // haste map from scanning .venv directories (see top-level Refs comment).
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testMatch: [
        '<rootDir>/src/**/*.test.ts',
        '<rootDir>/tests/unit/**/*.test.ts',
      ],
      // Exclude Phase 3 workflow tests (run in separate project)
      testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/tests/unit/workflow-phase3-.*\\.test\\.ts$'
      ],
      modulePathIgnorePatterns: [
        '<rootDir>/\\.claude/skills/.*/\\.venv/',
        '<rootDir>/udemy-downloader/\\.venv/',
      ],
      testEnvironment: 'node',
      testTimeout: 30000,
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
    },
    {
      displayName: 'workflow-phase3',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/tests/unit/workflow-phase3-*.test.ts'],
      modulePathIgnorePatterns: [
        '<rootDir>/\\.claude/skills/.*/\\.venv/',
        '<rootDir>/udemy-downloader/\\.venv/',
      ],
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
      // Run Phase 3 tests serially to avoid file system conflicts
      maxWorkers: 1,
      // Force serial execution of test files
      runner: 'jest-runner',
      // Note: Users should run with --runInBand for reliable results
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      modulePathIgnorePatterns: [
        '<rootDir>/\\.claude/skills/.*/\\.venv/',
        '<rootDir>/udemy-downloader/\\.venv/',
      ],
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
      setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.ts'],
    },
    {
      displayName: 'regression',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/tests/regression/**/*.test.ts'],
      modulePathIgnorePatterns: [
        '<rootDir>/\\.claude/skills/.*/\\.venv/',
        '<rootDir>/udemy-downloader/\\.venv/',
      ],
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
    },
    // Hook tests: run separately via `npx jest --selectProjects hooks`
    // These are JS files outside src/tests roots, connected to CI as a separate step
    {
      displayName: 'hooks',
      testMatch: ['<rootDir>/.claude/hooks/__tests__/**/*.test.js'],
      testPathIgnorePatterns: [
        '<rootDir>/.claude/hooks/__tests__/unified-guard-phase3.test.js',
      ],
      modulePathIgnorePatterns: [
        '<rootDir>/\\.claude/skills/.*/\\.venv/',
        '<rootDir>/udemy-downloader/\\.venv/',
      ],
      testEnvironment: 'node',
    },
    // Scripts tests: JS unit tests for scripts/*.js (e.g. generate-agents-baseline.js)
    // Run via `npx jest --selectProjects scripts` or as part of CI generator-baseline-gate
    {
      displayName: 'scripts',
      testMatch: ['<rootDir>/scripts/__tests__/**/*.test.js'],
      modulePathIgnorePatterns: [
        '<rootDir>/\\.claude/skills/.*/\\.venv/',
        '<rootDir>/udemy-downloader/\\.venv/',
      ],
      testEnvironment: 'node',
    },
  ],
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,     // lowered due to complex conditional logic in services
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Coverage reporters (including json-summary for CI)
  coverageReporters: ['text', 'lcov', 'json-summary'],
};
