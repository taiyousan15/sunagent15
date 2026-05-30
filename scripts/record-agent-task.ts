#!/usr/bin/env npx ts-node
/**
 * record-agent-task.ts — Record one completed agent task into the runtime memory layer.
 *
 * Replaces the never-existing `.claude/memory/scripts/update-agent-stats.ts` that the
 * ait42 coordinator / reflection-agent prompts referenced. Routes through
 * `MemoryService.recordTask`, so per-agent locking, atomic tmp→rename writes, and
 * baseline-manifest seeding all apply — eliminating the legacy-path split-brain and the
 * seed-bypass that a raw bash write to `.claude/agent-memory/agents/` would have caused.
 *
 * Usage:
 *   npx ts-node scripts/record-agent-task.ts --agent <name> --quality-score <0-100> \
 *     --success <true|false> [--task-id <id>] \
 *     [--task-type <design|implementation|qa|operations|meta>] \
 *     [--duration-ms <n>] [--description <text>]
 *
 * Exit codes: 0 = recorded, 1 = error. Callers (agent prompts) treat a non-zero exit as a
 * non-blocking warning, mirroring the previous bash-fallback behaviour.
 */

import { MemoryService } from '../src/memory/MemoryService';
import { TaskRecord, TaskCategory } from '../src/memory/types';

type ParsedArgs = Record<string, string | boolean>;

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

/** Map the ait42 coordinator task-type vocabulary to a MemoryService TaskCategory. */
function toTaskCategory(taskType: string): TaskCategory {
  switch (taskType.toLowerCase()) {
    case 'design':
      return 'design';
    case 'implementation':
      return 'implementation';
    case 'qa':
      return 'testing';
    case 'operations':
      return 'deployment';
    case 'meta':
      return 'analysis';
    default:
      return 'implementation';
  }
}

function getString(args: ParsedArgs, key: string): string {
  const value = args[key];
  return typeof value === 'string' ? value : '';
}

function fail(message: string): never {
  console.error(`record-agent-task: ${message}`);
  process.exit(1);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  const agent = getString(args, 'agent');
  if (!agent) {
    fail('missing required --agent <name>');
  }

  const successRaw = getString(args, 'success').toLowerCase();
  const successTruthy = ['true', '1', 'yes'].includes(successRaw);
  const successFalsy = ['false', '0', 'no'].includes(successRaw);
  if (!successTruthy && !successFalsy) {
    fail(`invalid or missing --success "${successRaw}" (must be true|false|1|0|yes|no)`);
  }
  const success = successTruthy;

  const qualityRaw = getString(args, 'quality-score');
  const qualityScore = qualityRaw === '' ? null : Number(qualityRaw);
  if (qualityScore !== null && (!Number.isFinite(qualityScore) || qualityScore < 0 || qualityScore > 100)) {
    fail(`invalid --quality-score "${qualityRaw}" (must be a finite number in 0..100)`);
  }

  const durationRaw = getString(args, 'duration-ms');
  const durationMs = durationRaw === '' ? null : Number(durationRaw);
  if (durationMs !== null && (!Number.isFinite(durationMs) || durationMs < 0)) {
    fail(`invalid --duration-ms "${durationRaw}" (must be a finite number >= 0)`);
  }

  const taskType = getString(args, 'task-type');

  const completedAt = new Date();
  const taskIdArg = getString(args, 'task-id');
  const taskId =
    taskIdArg && taskIdArg !== 'unknown'
      ? taskIdArg
      : `task-${completedAt.toISOString()}-${agent}`;

  const startedAt =
    durationMs !== null ? new Date(completedAt.getTime() - durationMs) : completedAt;
  // Guard against out-of-range dates (e.g. a huge but finite --duration-ms): a
  // JS Date is valid only within ±8.64e15 ms of the epoch; toISOString() on an
  // invalid date throws RangeError. Fail gracefully instead of crashing.
  if (Number.isNaN(startedAt.getTime())) {
    fail(`invalid --duration-ms "${durationRaw}" (produces an out-of-range start date)`);
  }

  const description = getString(args, 'description') || `ait42 task for ${agent}`;

  const task: TaskRecord = {
    id: taskId,
    agentName: agent,
    description,
    category: toTaskCategory(taskType),
    complexity: 5,
    status: success ? 'completed' : 'failed',
    qualityScore,
    durationMs,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    error: null,
    metadata: { source: 'ait42-agent', taskType },
  };

  try {
    const memoryService = new MemoryService();
    memoryService.recordTask(agent, task);
  } catch (err) {
    fail(`recordTask failed for "${agent}": ${(err as Error).message}`);
  }

  // Machine-readable line so agent prompts can parse the recorded id.
  console.log(`TASK_ID: ${task.id}`);
  console.log(`✅ recorded task for ${agent} (status=${task.status}) → runtime memory layer`);
}

main();
