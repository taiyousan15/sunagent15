/**
 * Internal MCP Registry - Manages internal MCP definitions
 */

import * as fs from 'fs';
import * as path from 'path';
import { InternalMcpDefinition, InternalMcpsConfig, RouterConfig } from '../router/types';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'proxy-mcp', 'internal-mcps.json');

let cachedConfig: InternalMcpsConfig | null = null;

/**
 * Load internal MCPs config from file
 */
export function loadConfig(configPath: string = CONFIG_PATH): InternalMcpsConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    if (!fs.existsSync(configPath)) {
      // Return default empty config if file doesn't exist
      return {
        version: '1.0.0',
        mcps: [],
        routerConfig: {
          ruleFirst: true,
          semanticThreshold: 0.7,
          topK: 5,
          fallback: 'require_clarify',
        },
      };
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    cachedConfig = JSON.parse(content) as InternalMcpsConfig;
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load internal MCPs config:', error);
    return {
      version: '1.0.0',
      mcps: [],
      routerConfig: {
        ruleFirst: true,
        semanticThreshold: 0.7,
        topK: 5,
        fallback: 'require_clarify',
      },
    };
  }
}

/**
 * Clear cached config (for testing)
 */
export function clearCache(): void {
  cachedConfig = null;
}

/**
 * Get all registered MCPs
 */
export function getAllMcps(): InternalMcpDefinition[] {
  const config = loadConfig();
  return config.mcps;
}

/**
 * Get enabled MCPs only
 */
export function getEnabledMcps(): InternalMcpDefinition[] {
  return getAllMcps().filter((mcp) => mcp.enabled);
}

/**
 * Get MCP by name
 */
export function getMcpByName(name: string): InternalMcpDefinition | undefined {
  return getAllMcps().find((mcp) => mcp.name === name);
}

/**
 * Get MCPs by tag
 */
export function getMcpsByTag(tag: string): InternalMcpDefinition[] {
  const tagLower = tag.toLowerCase();
  return getAllMcps().filter((mcp) => mcp.tags.some((t) => t.toLowerCase() === tagLower));
}

/**
 * Get router config
 */
export function getRouterConfig(): RouterConfig {
  const config = loadConfig();
  return config.routerConfig;
}

/**
 * Check if an MCP is enabled
 */
export function isMcpEnabled(name: string): boolean {
  const mcp = getMcpByName(name);
  return mcp?.enabled ?? false;
}

/**
 * Get MCP summary (for Claude context)
 */
export function getMcpSummary(): string {
  const mcps = getAllMcps();
  if (mcps.length === 0) {
    return 'No internal MCPs registered.';
  }

  const lines = ['Available internal MCPs:'];
  for (const mcp of mcps) {
    const status = mcp.enabled ? 'enabled' : 'disabled';
    lines.push(`  - ${mcp.name} [${status}]: ${mcp.shortDescription}`);
  }
  return lines.join('\n');
}
