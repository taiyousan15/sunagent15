module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
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
  // Transform TypeScript files
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  // Custom projects for different test types
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
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
    },
    {
      displayName: 'workflow-phase3',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/tests/unit/workflow-phase3-*.test.ts'],
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
