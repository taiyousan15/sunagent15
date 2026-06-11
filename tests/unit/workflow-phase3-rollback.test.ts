/**
 * Workflow Phase 3 - Rollback Tests
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  startWorkflow,
  transitionToNextPhase,
  rollbackToPhase,
  getStatus,
} from '../../src/proxy-mcp/workflow/engine';
import { clearState, setStateDir, resetStateDir } from '../../src/proxy-mcp/workflow/store';
import { clearCache, setWorkflowsDir, resetWorkflowsDir } from '../../src/proxy-mcp/workflow/registry';
import type { WorkflowDefinition } from '../../src/proxy-mcp/workflow/types';

// テスト用のディレクトリ（OSの一時ディレクトリを使用して権限問題を回避）
const TEMP_BASE = path.join(os.tmpdir(), 'taisun-test-rollback-' + process.pid);
const WORKFLOW_DIR = path.join(TEMP_BASE, 'config', 'workflows');
const TEST_WORKFLOW_PATH = path.join(WORKFLOW_DIR, 'test_rollback_v1.json');
const TEST_FILES_DIR = path.join(TEMP_BASE, 'test-rollback-temp');

// テストがスキップされるべきかどうかをチェック
let canRunTests = true;
let skipReason = '';

describe('Workflow Phase 3 - Rollback', () => {
  // 一時ディレクトリのセットアップ（全テスト開始前）
  beforeAll(() => {
    try {
      // ベースディレクトリ作成
      fs.mkdirSync(TEMP_BASE, { recursive: true });
      fs.mkdirSync(WORKFLOW_DIR, { recursive: true });
      fs.mkdirSync(TEST_FILES_DIR, { recursive: true });

      // 書き込みテスト
      const testFile = path.join(TEMP_BASE, '.write-test');
      fs.writeFileSync(testFile, 'test', 'utf-8');
      fs.unlinkSync(testFile);

      // ワークフローディレクトリをテスト用に設定
      setWorkflowsDir(WORKFLOW_DIR);
      // 状態ファイルディレクトリをテスト用に設定
      setStateDir(TEMP_BASE);
    } catch (error) {
      canRunTests = false;
      skipReason = `Cannot create temp directories: ${(error as Error).message}`;
      console.warn(`Skipping tests: ${skipReason}`);
    }
  });

  // 一時ディレクトリのクリーンアップ（全テスト終了後）
  afterAll(() => {
    // ワークフローディレクトリをリセット
    resetWorkflowsDir();
    // 状態ファイルディレクトリをリセット
    resetStateDir();

    try {
      if (fs.existsSync(TEMP_BASE)) {
        fs.rmSync(TEMP_BASE, { recursive: true, force: true });
      }
    } catch (error) {
      // クリーンアップエラーは無視
      console.warn(`Cleanup warning: ${(error as Error).message}`);
    }
  });

  beforeEach(() => {
    // 権限問題でテストをスキップ
    if (!canRunTests) {
      return;
    }

    clearCache();

    try {
      if (!fs.existsSync(TEST_FILES_DIR)) {
        fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
      }

      if (!fs.existsSync(WORKFLOW_DIR)) {
        fs.mkdirSync(WORKFLOW_DIR, { recursive: true });
      }
    } catch (error) {
      console.warn(`Setup warning: ${(error as Error).message}`);
    }
  });

  afterEach(() => {
    // 権限問題でテストをスキップ
    if (!canRunTests) {
      return;
    }

    try {
      if (fs.existsSync(TEST_FILES_DIR)) {
        fs.rmSync(TEST_FILES_DIR, { recursive: true, force: true });
      }

      // テスト用ディレクトリを再作成（次のテスト用）
      fs.mkdirSync(TEST_FILES_DIR, { recursive: true });

      if (fs.existsSync(TEST_WORKFLOW_PATH)) {
        fs.unlinkSync(TEST_WORKFLOW_PATH);
      }
    } catch (error) {
      // クリーンアップエラーは無視
      console.warn(`Cleanup warning: ${(error as Error).message}`);
    }

    // ワークフロー状態のクリーンアップ
    clearState();
    clearCache();
  });

  describe('basic rollback functionality', () => {
    beforeEach(() => {
      if (!canRunTests) {
        return;
      }

      clearCache();

      const workflow: WorkflowDefinition = {
        id: 'test_rollback_v1',
        name: 'Rollback Test Workflow',
        version: '1.0.0',
        phases: [
          {
            id: 'phase_0',
            name: 'Planning',
            nextPhase: 'phase_1',
          },
          {
            id: 'phase_1',
            name: 'Design',
            requiredArtifacts: [path.join(TEST_FILES_DIR, 'design.txt')],
            nextPhase: 'phase_2',
          },
          {
            id: 'phase_2',
            name: 'Implementation',
            requiredArtifacts: [path.join(TEST_FILES_DIR, 'code.txt')],
            nextPhase: 'phase_3',
          },
          {
            id: 'phase_3',
            name: 'Testing',
            requiredArtifacts: [path.join(TEST_FILES_DIR, 'tests.txt')],
            nextPhase: null,
          },
        ],
      };

      fs.writeFileSync(
        TEST_WORKFLOW_PATH,
        JSON.stringify(workflow, null, 2),
        'utf-8'
      );
    });

    it('should rollback from phase_2 to phase_1 and delete artifacts', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      // Advance to phase_2
      transitionToNextPhase(); // phase_0 → phase_1
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design content');
      transitionToNextPhase(); // phase_1 → phase_2

      // Create phase_2 artifact
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'code.txt'), 'code content');

      let status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_2');
      expect(fs.existsSync(path.join(TEST_FILES_DIR, 'code.txt'))).toBe(true);

      // Rollback to phase_1
      const result = rollbackToPhase('phase_1', 'Need to revise design');

      expect(result.fromPhase).toBe('phase_2');
      expect(result.toPhase).toBe('phase_1');
      expect(result.reason).toBe('Need to revise design');
      expect(result.deletedArtifacts).toContain(
        path.join(TEST_FILES_DIR, 'code.txt')
      );
      expect(result.rollbackId).toMatch(/^rollback_\d+$/);

      // Verify current phase
      status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_1');
      expect(status.state?.completedPhases).toContain('phase_0');
      expect(status.state?.completedPhases).not.toContain('phase_1');
      expect(status.state?.completedPhases).not.toContain('phase_2');

      // Verify artifact deletion
      expect(fs.existsSync(path.join(TEST_FILES_DIR, 'code.txt'))).toBe(false);
      expect(fs.existsSync(path.join(TEST_FILES_DIR, 'design.txt'))).toBe(true);

      // Verify rollback history
      expect(status.state?.rollbackHistory).toHaveLength(1);
      expect(status.state?.rollbackHistory![0].fromPhase).toBe('phase_2');
      expect(status.state?.rollbackHistory![0].toPhase).toBe('phase_1');
    });

    it('should rollback multiple phases and delete all intermediate artifacts', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      // Advance to phase_3
      transitionToNextPhase(); // phase_0 → phase_1
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design');
      transitionToNextPhase(); // phase_1 → phase_2
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'code.txt'), 'code');
      transitionToNextPhase(); // phase_2 → phase_3
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'tests.txt'), 'tests');

      let status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_3');

      // Rollback to phase_1
      const result = rollbackToPhase('phase_1');

      expect(result.deletedArtifacts).toHaveLength(2);
      expect(result.deletedArtifacts).toContain(
        path.join(TEST_FILES_DIR, 'code.txt')
      );
      expect(result.deletedArtifacts).toContain(
        path.join(TEST_FILES_DIR, 'tests.txt')
      );

      // Verify current phase
      status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_1');

      // Verify artifact deletions
      expect(fs.existsSync(path.join(TEST_FILES_DIR, 'design.txt'))).toBe(true);
      expect(fs.existsSync(path.join(TEST_FILES_DIR, 'code.txt'))).toBe(false);
      expect(fs.existsSync(path.join(TEST_FILES_DIR, 'tests.txt'))).toBe(false);
    });

    it('should record multiple rollbacks in history', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      // Advance to phase_2
      transitionToNextPhase();
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design');
      transitionToNextPhase();
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'code.txt'), 'code');

      // First rollback
      rollbackToPhase('phase_1', 'First revision');

      // Re-advance
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design v2');
      transitionToNextPhase();
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'code.txt'), 'code v2');

      // Second rollback
      rollbackToPhase('phase_1', 'Second revision');

      const status = getStatus();
      expect(status.state?.rollbackHistory).toHaveLength(2);
      expect(status.state?.rollbackHistory![0].reason).toBe('First revision');
      expect(status.state?.rollbackHistory![1].reason).toBe('Second revision');
    });
  });

  describe('rollback restrictions', () => {
    beforeEach(() => {
      if (!canRunTests) {
        return;
      }

      clearCache();

      const workflow: WorkflowDefinition = {
        id: 'test_rollback_v1',
        name: 'Rollback Restrictions Test',
        version: '1.0.0',
        phases: [
          {
            id: 'phase_0',
            name: 'Planning',
            nextPhase: 'phase_1',
          },
          {
            id: 'phase_1',
            name: 'Design',
            requiredArtifacts: [path.join(TEST_FILES_DIR, 'design.txt')],
            nextPhase: 'phase_2',
          },
          {
            id: 'phase_2',
            name: 'Implementation',
            requiredArtifacts: [path.join(TEST_FILES_DIR, 'code.txt')],
            allowRollbackTo: ['phase_1'], // Only allow rollback to phase_1
            nextPhase: 'phase_3',
          },
          {
            id: 'phase_3',
            name: 'Testing',
            nextPhase: null,
          },
        ],
      };

      fs.writeFileSync(
        TEST_WORKFLOW_PATH,
        JSON.stringify(workflow, null, 2),
        'utf-8'
      );
    });

    it('should allow rollback when specified in allowRollbackTo', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      transitionToNextPhase();
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design');
      transitionToNextPhase();

      expect(() => rollbackToPhase('phase_1')).not.toThrow();

      const status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_1');
    });

    it('should reject rollback when not in allowRollbackTo', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      transitionToNextPhase();
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design');
      transitionToNextPhase();

      expect(() => rollbackToPhase('phase_0')).toThrow(
        'Rollback to phase_0 is not allowed from phase_2'
      );

      const status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_2');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      if (!canRunTests) {
        return;
      }

      clearCache();

      const workflow: WorkflowDefinition = {
        id: 'test_rollback_v1',
        name: 'Error Handling Test',
        version: '1.0.0',
        phases: [
          {
            id: 'phase_0',
            name: 'Start',
            nextPhase: 'phase_1',
          },
          {
            id: 'phase_1',
            name: 'End',
            nextPhase: null,
          },
        ],
      };

      fs.writeFileSync(
        TEST_WORKFLOW_PATH,
        JSON.stringify(workflow, null, 2),
        'utf-8'
      );
    });

    it('should throw error when no active workflow', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      expect(() => rollbackToPhase('phase_0')).toThrow('No active workflow');
    });

    it('should throw error when target phase does not exist', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      expect(() => rollbackToPhase('phase_nonexistent')).toThrow(
        'Phase phase_nonexistent not found in workflow'
      );
    });
  });

  describe('deletion failure safety (改善計画 Phase 2-2)', () => {
    const LOCKED_DIR = path.join(TEST_FILES_DIR, 'locked');
    const LOCKED_ARTIFACT = path.join(LOCKED_DIR, 'code.txt');

    beforeEach(() => {
      if (!canRunTests) {
        return;
      }

      clearCache();

      const workflow: WorkflowDefinition = {
        id: 'test_rollback_v1',
        name: 'Deletion Failure Test',
        version: '1.0.0',
        phases: [
          {
            id: 'phase_0',
            name: 'Planning',
            nextPhase: 'phase_1',
          },
          {
            id: 'phase_1',
            name: 'Design',
            requiredArtifacts: [path.join(TEST_FILES_DIR, 'design.txt')],
            nextPhase: 'phase_2',
          },
          {
            id: 'phase_2',
            name: 'Implementation',
            requiredArtifacts: [LOCKED_ARTIFACT],
            nextPhase: null,
          },
        ],
      };

      fs.writeFileSync(
        TEST_WORKFLOW_PATH,
        JSON.stringify(workflow, null, 2),
        'utf-8'
      );
    });

    afterEach(() => {
      // chmod を元に戻してからクリーンアップ（rmSync が失敗しないように）
      try {
        if (fs.existsSync(LOCKED_DIR)) {
          fs.chmodSync(LOCKED_DIR, 0o755);
        }
      } catch {
        // 無視
      }
    });

    it('aborts rollback and keeps state unchanged when artifact is undeletable', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }
      if (process.platform === 'win32' || typeof process.getuid !== 'function' || process.getuid() === 0) {
        // Windows / root では POSIX 権限による削除拒否を再現できない
        console.log('Skipped: POSIX permission simulation unavailable');
        return;
      }

      startWorkflow('test_rollback_v1', false);

      transitionToNextPhase(); // phase_0 → phase_1
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design');
      transitionToNextPhase(); // phase_1 → phase_2

      fs.mkdirSync(LOCKED_DIR, { recursive: true });
      fs.writeFileSync(LOCKED_ARTIFACT, 'code');

      const before = getStatus();
      expect(before.state?.currentPhase).toBe('phase_2');

      // 親ディレクトリを読み取り専用にして unlink を不能にする
      fs.chmodSync(LOCKED_DIR, 0o555);

      try {
        expect(() => rollbackToPhase('phase_1')).toThrow(
          /ロールバックを中断しました（state・成果物とも変更されていません）/
        );
        // エラーメッセージに手動手順が含まれる
        expect(() => rollbackToPhase('phase_1')).toThrow(/手動対応手順/);

        // state は一切変化していない
        const after = getStatus();
        expect(after.state?.currentPhase).toBe('phase_2');
        expect(after.state?.completedPhases).toEqual(before.state?.completedPhases);
        expect(after.state?.rollbackHistory ?? []).toHaveLength(0);

        // 成果物も削除されていない
        expect(fs.existsSync(LOCKED_ARTIFACT)).toBe(true);
      } finally {
        fs.chmodSync(LOCKED_DIR, 0o755);
      }
    });

    it('rolls back normally once permission is restored', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      transitionToNextPhase();
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design');
      transitionToNextPhase();

      fs.mkdirSync(LOCKED_DIR, { recursive: true });
      fs.writeFileSync(LOCKED_ARTIFACT, 'code');

      const result = rollbackToPhase('phase_1');
      expect(result.deletedArtifacts).toContain(LOCKED_ARTIFACT);
      expect(fs.existsSync(LOCKED_ARTIFACT)).toBe(false);

      const status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_1');
    });
  });

  describe('directory artifact safety (Codex R1 指摘1)', () => {
    const DIR_ARTIFACT = path.join(TEST_FILES_DIR, 'assets');

    beforeEach(() => {
      if (!canRunTests) {
        return;
      }

      clearCache();

      const workflow: WorkflowDefinition = {
        id: 'test_rollback_v1',
        name: 'Directory Artifact Test',
        version: '1.0.0',
        phases: [
          {
            id: 'phase_0',
            name: 'Planning',
            nextPhase: 'phase_1',
          },
          {
            id: 'phase_1',
            name: 'Design',
            requiredArtifacts: [path.join(TEST_FILES_DIR, 'design.txt')],
            nextPhase: 'phase_2',
          },
          {
            id: 'phase_2',
            name: 'Asset Generation',
            // video_generation_v1 の assets/images/ のようなディレクトリ成果物を再現
            requiredArtifacts: [
              DIR_ARTIFACT,
              path.join(TEST_FILES_DIR, 'code.txt'),
            ],
            nextPhase: null,
          },
        ],
      };

      fs.writeFileSync(
        TEST_WORKFLOW_PATH,
        JSON.stringify(workflow, null, 2),
        'utf-8'
      );
    });

    it('aborts rollback without deleting anything when an artifact is a directory', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      transitionToNextPhase(); // phase_0 → phase_1
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design');
      transitionToNextPhase(); // phase_1 → phase_2

      fs.mkdirSync(DIR_ARTIFACT, { recursive: true });
      fs.writeFileSync(path.join(DIR_ARTIFACT, 'image.png'), 'binary');
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'code.txt'), 'code');

      const before = getStatus();
      expect(before.state?.currentPhase).toBe('phase_2');

      // 旧実装は precheck（親dir W_OK）を通過後 unlinkSync で EISDIR になり
      // all-or-nothing 保証が破れていた。現在は preflight で中断する
      expect(() => rollbackToPhase('phase_1')).toThrow(
        /ロールバックを中断しました（state・成果物とも変更されていません）/
      );
      expect(() => rollbackToPhase('phase_1')).toThrow(
        /ディレクトリのため、安全のため自動削除しません/
      );
      expect(() => rollbackToPhase('phase_1')).toThrow(/手動対応手順/);

      // state は一切変化していない
      const after = getStatus();
      expect(after.state?.currentPhase).toBe('phase_2');
      expect(after.state?.completedPhases).toEqual(before.state?.completedPhases);
      expect(after.state?.rollbackHistory ?? []).toHaveLength(0);

      // ディレクトリも通常ファイルも削除されていない（all-or-nothing）
      expect(fs.existsSync(DIR_ARTIFACT)).toBe(true);
      expect(fs.existsSync(path.join(DIR_ARTIFACT, 'image.png'))).toBe(true);
      expect(fs.existsSync(path.join(TEST_FILES_DIR, 'code.txt'))).toBe(true);
    });

    it('rolls back normally after the directory artifact is removed manually', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      transitionToNextPhase();
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'design.txt'), 'design');
      transitionToNextPhase();

      fs.mkdirSync(DIR_ARTIFACT, { recursive: true });
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'code.txt'), 'code');

      expect(() => rollbackToPhase('phase_1')).toThrow(/ディレクトリ/);

      // 手動対応手順どおりディレクトリを削除して再実行
      fs.rmSync(DIR_ARTIFACT, { recursive: true, force: true });

      const result = rollbackToPhase('phase_1');
      expect(result.deletedArtifacts).toContain(
        path.join(TEST_FILES_DIR, 'code.txt')
      );

      const status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_1');
    });
  });

  describe('shared artifact across phases (dedupe regression)', () => {
    const SHARED_ARTIFACT = path.join(TEST_FILES_DIR, 'shared.txt');

    beforeEach(() => {
      if (!canRunTests) {
        return;
      }

      clearCache();

      const workflow: WorkflowDefinition = {
        id: 'test_rollback_v1',
        name: 'Shared Artifact Test',
        version: '1.0.0',
        phases: [
          {
            id: 'phase_0',
            name: 'Planning',
            nextPhase: 'phase_1',
          },
          {
            id: 'phase_1',
            name: 'Design',
            requiredArtifacts: [SHARED_ARTIFACT],
            nextPhase: 'phase_2',
          },
          {
            id: 'phase_2',
            name: 'Implementation',
            // 後続フェーズが前フェーズの成果物を自分の requiredArtifacts に
            // 再掲する自然なパターン。収集時に一意化しないと削除ループの
            // 2回目の unlink が ENOENT で中断する（collect-then-delete 化の回帰）
            requiredArtifacts: [
              SHARED_ARTIFACT,
              path.join(TEST_FILES_DIR, 'code.txt'),
            ],
            nextPhase: null,
          },
        ],
      };

      fs.writeFileSync(
        TEST_WORKFLOW_PATH,
        JSON.stringify(workflow, null, 2),
        'utf-8'
      );
    });

    it('rolls back successfully when the same artifact is listed in multiple phases', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      startWorkflow('test_rollback_v1', false);

      transitionToNextPhase(); // phase_0 → phase_1
      fs.writeFileSync(SHARED_ARTIFACT, 'shared');
      transitionToNextPhase(); // phase_1 → phase_2
      fs.writeFileSync(path.join(TEST_FILES_DIR, 'code.txt'), 'code');

      const result = rollbackToPhase('phase_0');

      // 重複は一意化され、deletedArtifacts に1回だけ現れる
      expect(
        result.deletedArtifacts.filter((a) => a === SHARED_ARTIFACT)
      ).toHaveLength(1);
      expect(result.deletedArtifacts).toContain(
        path.join(TEST_FILES_DIR, 'code.txt')
      );

      expect(fs.existsSync(SHARED_ARTIFACT)).toBe(false);
      expect(fs.existsSync(path.join(TEST_FILES_DIR, 'code.txt'))).toBe(false);

      const status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_0');
      expect(status.state?.rollbackHistory).toHaveLength(1);
    });
  });

  describe('backward compatibility', () => {
    it('should work with workflows without rollback features', () => {
      if (!canRunTests) {
        console.log(`Skipped: ${skipReason}`);
        return;
      }

      clearCache();

      const workflow: WorkflowDefinition = {
        id: 'test_rollback_v1',
        name: 'Old Style Workflow',
        version: '1.0.0',
        phases: [
          {
            id: 'phase_0',
            name: 'Start',
            nextPhase: 'phase_1',
          },
          {
            id: 'phase_1',
            name: 'End',
            nextPhase: null,
          },
        ],
      };

      fs.writeFileSync(
        TEST_WORKFLOW_PATH,
        JSON.stringify(workflow, null, 2),
        'utf-8'
      );

      startWorkflow('test_rollback_v1', false);
      transitionToNextPhase();

      // Rollback should work even without allowRollbackTo
      expect(() => rollbackToPhase('phase_0')).not.toThrow();

      const status = getStatus();
      expect(status.state?.currentPhase).toBe('phase_0');
    });
  });
});
