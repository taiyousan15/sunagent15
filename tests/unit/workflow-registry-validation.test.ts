/**
 * Workflow Registry - Reference Validation Tests (改善計画 Phase 2-1)
 *
 * validateWorkflowDefinition が conditionalNext.branches / conditionalNext.defaultNext /
 * parallelNext.phases / allowRollbackTo の参照先フェーズ存在を検証することを確認する。
 * （従来は nextPhase のみ検証され、不正参照は実行時に初めて失敗していた）
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadAllWorkflows,
  clearCache,
  setWorkflowsDir,
  resetWorkflowsDir,
} from '../../src/proxy-mcp/workflow/registry';

const TEMP_BASE = path.join(os.tmpdir(), 'taisun-registry-test-' + process.pid);
const WORKFLOW_DIR = path.join(TEMP_BASE, 'config', 'workflows');

function writeWorkflow(filename: string, def: unknown): void {
  fs.writeFileSync(path.join(WORKFLOW_DIR, filename), JSON.stringify(def, null, 2), 'utf-8');
}

function baseDefinition(): Record<string, unknown> {
  return {
    id: 'test_refs_v1',
    name: 'Reference Validation Test',
    version: '1.0.0',
    phases: [
      { id: 'phase_a', name: 'A', nextPhase: 'phase_b' },
      { id: 'phase_b', name: 'B', nextPhase: null },
    ],
  };
}

describe('Workflow Registry - phase reference validation', () => {
  beforeAll(() => {
    fs.mkdirSync(WORKFLOW_DIR, { recursive: true });
    setWorkflowsDir(WORKFLOW_DIR);
  });

  afterAll(() => {
    resetWorkflowsDir();
    clearCache();
    try {
      fs.rmSync(TEMP_BASE, { recursive: true, force: true });
    } catch {
      // クリーンアップエラーは無視
    }
  });

  beforeEach(() => {
    clearCache();
    for (const f of fs.readdirSync(WORKFLOW_DIR)) {
      fs.unlinkSync(path.join(WORKFLOW_DIR, f));
    }
  });

  it('valid definition with all reference kinds loads successfully', () => {
    const def = baseDefinition();
    def.phases = [
      {
        id: 'phase_a',
        name: 'A',
        conditionalNext: {
          condition: { type: 'metadata_value', source: 'k', pattern: '.*' },
          branches: { x: 'phase_b', y: 'phase_c' },
          defaultNext: 'phase_b',
        },
        allowRollbackTo: [],
      },
      {
        id: 'phase_b',
        name: 'B',
        parallelNext: { phases: ['phase_c', 'phase_d'], waitStrategy: 'all' },
      },
      { id: 'phase_c', name: 'C', allowRollbackTo: ['phase_a'], nextPhase: null },
      { id: 'phase_d', name: 'D', nextPhase: null },
    ];
    writeWorkflow('valid.json', def);

    const workflows = loadAllWorkflows();
    expect(workflows.has('test_refs_v1')).toBe(true);
  });

  it('rejects conditionalNext.branches pointing to non-existent phase', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      conditionalNext: {
        condition: { type: 'metadata_value', source: 'k', pattern: '.*' },
        branches: { high: 'phase_ghost' },
      },
    };
    writeWorkflow('bad_branch.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /conditionalNext\.branches\['high'\] references non-existent phase: phase_ghost/
    );
  });

  it('rejects conditionalNext.defaultNext pointing to non-existent phase', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      conditionalNext: {
        condition: { type: 'metadata_value', source: 'k', pattern: '.*' },
        branches: { ok: 'phase_b' },
        defaultNext: 'phase_ghost',
      },
    };
    writeWorkflow('bad_default.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /conditionalNext\.defaultNext references non-existent phase: phase_ghost/
    );
  });

  it('rejects parallelNext.phases pointing to non-existent phase', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      parallelNext: { phases: ['phase_b', 'phase_ghost'], waitStrategy: 'all' },
    };
    writeWorkflow('bad_parallel.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /parallelNext\.phases references non-existent phase: phase_ghost/
    );
  });

  it('rejects allowRollbackTo pointing to non-existent phase', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[1] = {
      id: 'phase_b',
      name: 'B',
      nextPhase: null,
      allowRollbackTo: ['phase_ghost'],
    };
    writeWorkflow('bad_rollback.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /allowRollbackTo references non-existent phase: phase_ghost/
    );
  });

  it('rejects parallelNext with empty phases array (Codex R1 指摘2)', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      parallelNext: { phases: [], waitStrategy: 'all' },
    };
    writeWorkflow('empty_parallel.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /parallelNext\.phases must be a non-empty array/
    );
  });

  it('rejects parallelNext with duplicate phase entries (Codex R1 指摘2)', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      parallelNext: { phases: ['phase_b', 'phase_b'], waitStrategy: 'all' },
    };
    writeWorkflow('dup_parallel.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /parallelNext\.phases contains duplicate entry: phase_b/
    );
  });

  it('rejects parallelNext with invalid waitStrategy (Codex R1 指摘2)', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      parallelNext: { phases: ['phase_b'], waitStrategy: 'most' },
    };
    writeWorkflow('bad_strategy.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /parallelNext\.waitStrategy must be one of: all, any \(got: most\)/
    );
  });

  it('rejects conditionalNext without branches (Codex R1 指摘3)', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      conditionalNext: {
        condition: { type: 'metadata_value', source: 'k' },
        defaultNext: 'phase_b',
      },
    };
    writeWorkflow('no_branches.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /conditionalNext\.branches is missing or not an object/
    );
  });

  it('rejects conditionalNext without condition (Codex R1 指摘3)', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      conditionalNext: {
        branches: { ok: 'phase_b' },
      },
    };
    writeWorkflow('no_condition.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /conditionalNext\.condition is missing or not an object/
    );
  });

  it('rejects conditionalNext with invalid condition.type (Codex R1 指摘3)', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      conditionalNext: {
        condition: { type: 'crystal_ball', source: 'k' },
        branches: { ok: 'phase_b' },
      },
    };
    writeWorkflow('bad_cond_type.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /conditionalNext\.condition\.type must be one of: .*\(got: crystal_ball\)/
    );
  });

  it('rejects conditionalNext with empty condition.source (Codex R1 指摘3)', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      conditionalNext: {
        condition: { type: 'metadata_value', source: '' },
        branches: { ok: 'phase_b' },
      },
    };
    writeWorkflow('empty_source.json', def);

    expect(() => loadAllWorkflows()).toThrow(
      /conditionalNext\.condition\.source must be a non-empty string/
    );
  });

  it('error message includes the offending file name', () => {
    const def = baseDefinition();
    (def.phases as Record<string, unknown>[])[0] = {
      id: 'phase_a',
      name: 'A',
      nextPhase: 'phase_ghost',
    };
    writeWorkflow('named_file.json', def);

    expect(() => loadAllWorkflows()).toThrow(/named_file\.json/);
  });
});
