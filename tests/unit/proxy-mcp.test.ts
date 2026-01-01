/**
 * Proxy MCP Unit Tests
 */

import { systemHealth } from '../../src/proxy-mcp/tools/system';
import { memoryAdd, memorySearch, memoryStats, memoryClearShortTerm, memoryClearAll } from '../../src/proxy-mcp/tools/memory';
import { skillSearch, skillRun } from '../../src/proxy-mcp/tools/skill';

describe('Proxy MCP', () => {
  describe('system.health', () => {
    it('should return healthy status', () => {
      const result = systemHealth();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as { status: string }).status).toBe('healthy');
      expect((result.data as { version: string }).version).toBe('0.1.0');
      expect((result.data as { uptime: number }).uptime).toBeGreaterThanOrEqual(0);
      expect((result.data as { timestamp: string }).timestamp).toBeDefined();
    });
  });

  describe('memory tools', () => {
    beforeEach(() => {
      // Clear all memory before each test
      memoryClearAll();
    });

    describe('memory.add', () => {
      it('should store content and return reference ID', () => {
        const result = memoryAdd('Test content', 'short-term');

        expect(result.success).toBe(true);
        expect(result.referenceId).toBeDefined();
        expect(typeof result.referenceId).toBe('string');
        expect((result.data as { contentLength: number }).contentLength).toBe(12);
      });

      it('should store with metadata', () => {
        const result = memoryAdd('Content with meta', 'long-term', { source: 'test' });

        expect(result.success).toBe(true);
        expect(result.referenceId).toBeDefined();
      });
    });

    describe('memory.search', () => {
      it('should find content by ID', () => {
        const addResult = memoryAdd('Searchable content', 'short-term');
        const id = addResult.referenceId!;

        const searchResult = memorySearch(id);

        expect(searchResult.success).toBe(true);
        expect((searchResult.data as { found: boolean }).found).toBe(true);
        expect((searchResult.data as { entry: { content: string } }).entry.content).toBe('Searchable content');
      });

      it('should find content by keyword', () => {
        memoryAdd('The quick brown fox', 'short-term');
        memoryAdd('Lazy dog sleeps', 'short-term');

        const result = memorySearch('fox');

        expect(result.success).toBe(true);
        expect((result.data as { found: boolean }).found).toBe(true);
        expect((result.data as { results: unknown[] }).results.length).toBe(1);
      });

      it('should return empty results for non-matching query', () => {
        memoryAdd('Some content', 'short-term');

        const result = memorySearch('nonexistent');

        expect(result.success).toBe(true);
        expect((result.data as { found: boolean }).found).toBe(false);
        expect((result.data as { results: unknown[] }).results.length).toBe(0);
      });
    });

    describe('memory.stats', () => {
      it('should return memory statistics', () => {
        memoryAdd('Short term 1', 'short-term');
        memoryAdd('Short term 2', 'short-term');
        memoryAdd('Long term 1', 'long-term');

        const result = memoryStats();

        expect(result.success).toBe(true);
        expect((result.data as { total: number }).total).toBe(3);
        expect((result.data as { shortTerm: number }).shortTerm).toBe(2);
        expect((result.data as { longTerm: number }).longTerm).toBe(1);
      });
    });

    describe('memoryClearShortTerm', () => {
      it('should clear only short-term memory', () => {
        memoryAdd('Short term', 'short-term');
        memoryAdd('Long term', 'long-term');

        const clearResult = memoryClearShortTerm();
        const statsResult = memoryStats();

        expect(clearResult.success).toBe(true);
        expect((clearResult.data as { cleared: number }).cleared).toBe(1);
        expect((statsResult.data as { total: number }).total).toBe(1);
        expect((statsResult.data as { longTerm: number }).longTerm).toBe(1);
      });
    });
  });

  describe('skill tools', () => {
    describe('skill.search', () => {
      it('should return empty array when skills directory does not exist', () => {
        const result = skillSearch('test');

        expect(result.success).toBe(true);
        expect((result.data as { skills: unknown[] }).skills).toEqual([]);
      });

      it('should search with empty query', () => {
        const result = skillSearch('');

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });
    });

    describe('skill.run', () => {
      it('should return error for non-existent skill', () => {
        const result = skillRun('nonexistent-skill');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Skill not found');
      });
    });
  });
});
