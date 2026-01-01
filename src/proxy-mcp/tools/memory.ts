/**
 * Memory Tools - Store and retrieve data without cluttering conversation
 */

import { MemoryEntry, ToolResult } from '../types';
import * as crypto from 'crypto';

// In-memory storage (MVP - will be replaced with persistent storage)
const memoryStore: Map<string, MemoryEntry> = new Map();

function generateId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Add content to memory and return a reference ID
 */
export function memoryAdd(
  content: string,
  type: 'short-term' | 'long-term' = 'short-term',
  metadata?: Record<string, unknown>
): ToolResult {
  try {
    const id = generateId();
    const entry: MemoryEntry = {
      id,
      content,
      type,
      timestamp: Date.now(),
      metadata,
    };

    memoryStore.set(id, entry);

    // Return only the reference ID to keep conversation light
    return {
      success: true,
      referenceId: id,
      data: {
        id,
        type,
        contentLength: content.length,
        timestamp: entry.timestamp,
        message: `Stored ${content.length} chars. Use memory.search("${id}") to retrieve.`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to add to memory: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Search memory by ID or keyword
 */
export function memorySearch(query: string): ToolResult {
  try {
    // First, check if query is a direct ID
    if (memoryStore.has(query)) {
      const entry = memoryStore.get(query)!;
      return {
        success: true,
        data: {
          found: true,
          entry: {
            id: entry.id,
            type: entry.type,
            content: entry.content,
            timestamp: entry.timestamp,
            metadata: entry.metadata,
          },
        },
      };
    }

    // Otherwise, search by keyword
    const results: Array<{
      id: string;
      type: string;
      preview: string;
      timestamp: number;
    }> = [];

    const queryLower = query.toLowerCase();
    for (const [id, entry] of memoryStore.entries()) {
      if (entry.content.toLowerCase().includes(queryLower)) {
        results.push({
          id,
          type: entry.type,
          preview: entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
          timestamp: entry.timestamp,
        });
      }
    }

    return {
      success: true,
      data: {
        found: results.length > 0,
        results: results.slice(0, 10),
        total: results.length,
        query,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search memory: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get memory statistics
 */
export function memoryStats(): ToolResult {
  const shortTerm = Array.from(memoryStore.values()).filter((e) => e.type === 'short-term').length;
  const longTerm = Array.from(memoryStore.values()).filter((e) => e.type === 'long-term').length;

  return {
    success: true,
    data: {
      total: memoryStore.size,
      shortTerm,
      longTerm,
    },
  };
}

/**
 * Clear short-term memory (cleanup)
 */
export function memoryClearShortTerm(): ToolResult {
  let cleared = 0;
  for (const [id, entry] of memoryStore.entries()) {
    if (entry.type === 'short-term') {
      memoryStore.delete(id);
      cleared++;
    }
  }

  return {
    success: true,
    data: {
      cleared,
      remaining: memoryStore.size,
    },
  };
}

/**
 * Clear all memory (for testing)
 */
export function memoryClearAll(): ToolResult {
  const cleared = memoryStore.size;
  memoryStore.clear();

  return {
    success: true,
    data: {
      cleared,
    },
  };
}
