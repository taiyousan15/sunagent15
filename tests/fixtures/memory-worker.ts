/**
 * Memory worker for multi-process concurrency tests (MED-1, Codex 1st round
 * 2026-05-15). Spawned via child_process.spawn from
 * tests/integration/memory-separation.integration.test.ts to drive a real
 * second process that contends for the same per-agent lock as the test
 * process.
 *
 * CLI:
 *   ts-node tests/fixtures/memory-worker.ts <basePath> <runtimeBasePath> <agentName> <action> <count> [<idPrefix>]
 *
 * Actions:
 *   record  : recordTask(agentName) `count` times. Each task uses a unique id
 *             derived from `idPrefix` (or the worker pid if omitted).
 *   cleanup : cleanupOldTasks() once. `count` and `idPrefix` are ignored.
 *
 * Exits 0 on success, 1 on argv error, 2 on runtime error (with the error
 * payload printed to stderr as a single JSON line so the parent test can
 * surface it on failure).
 */

import { MemoryService } from '../../src/memory/MemoryService';
import type { TaskRecord, TaskCategory } from '../../src/memory/types';

function bail(msg: string, code: number): never {
  process.stderr.write(JSON.stringify({ worker: process.pid, error: msg }) + '\n');
  process.exit(code);
}

function makeTask(agentName: string, id: string): TaskRecord {
  const now = new Date().toISOString();
  return {
    id,
    agentName,
    description: 'multi-process worker task',
    category: 'testing' as TaskCategory,
    complexity: 1,
    status: 'completed',
    qualityScore: 100,
    durationMs: 10,
    startedAt: now,
    completedAt: now,
    error: null,
    metadata: { source: 'memory-worker', workerPid: process.pid },
  };
}

function main(): void {
  const [, , basePath, runtimeBasePath, agentName, action, countStr, idPrefix] = process.argv;
  if (!basePath || !runtimeBasePath || !agentName || !action) {
    bail('usage: memory-worker <basePath> <runtimeBasePath> <agentName> <action> <count> [idPrefix]', 1);
  }
  const svc = new MemoryService(basePath, { runtimeBasePath });

  if (action === 'record') {
    const count = Number(countStr);
    if (!Number.isFinite(count) || count <= 0) {
      bail(`invalid count: ${JSON.stringify(countStr)}`, 1);
    }
    const prefix = idPrefix || `pid${process.pid}`;
    for (let i = 0; i < count; i++) {
      svc.recordTask(agentName, makeTask(agentName, `${prefix}-t${i}`));
    }
    process.exit(0);
  }

  if (action === 'cleanup') {
    svc.cleanupOldTasks();
    process.exit(0);
  }

  bail(`unknown action: ${JSON.stringify(action)}`, 1);
}

try {
  main();
} catch (err) {
  bail((err as Error).message, 2);
}
