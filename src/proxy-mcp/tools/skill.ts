/**
 * Skill Tools - Search and run skills from .claude/skills
 *
 * M2 Update: Added routing support for internal MCP selection
 */

import * as fs from 'fs';
import * as path from 'path';
import { SkillDefinition, ToolResult } from '../types';
import { route, RouteResult } from '../router';
import { getAllMcps, getRouterConfig } from '../internal/registry';

const SKILLS_DIR = path.join(process.cwd(), '.claude', 'skills');

export type SkillRunMode = 'preview' | 'route' | 'execute';

/**
 * Search for skills matching a query
 */
export function skillSearch(query: string): ToolResult {
  try {
    if (!fs.existsSync(SKILLS_DIR)) {
      return {
        success: true,
        data: {
          skills: [],
          message: 'Skills directory not found',
        },
      };
    }

    const skills: SkillDefinition[] = [];
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(SKILLS_DIR, entry.name);
        const skillMdPath = path.join(skillPath, 'SKILL.md');

        if (fs.existsSync(skillMdPath)) {
          const content = fs.readFileSync(skillMdPath, 'utf-8');
          const descMatch = content.match(/^#\s+(.+)/m);
          const description = descMatch ? descMatch[1] : entry.name;

          // Simple query matching
          const queryLower = query.toLowerCase();
          const nameMatch = entry.name.toLowerCase().includes(queryLower);
          const descMatch2 = description.toLowerCase().includes(queryLower);

          if (!query || nameMatch || descMatch2) {
            skills.push({
              name: entry.name,
              description: description.substring(0, 100),
              path: skillPath,
            });
          }
        }
      }
    }

    return {
      success: true,
      data: {
        skills: skills.slice(0, 10), // Limit to 10 results
        total: skills.length,
        query: query || '(all)',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search skills: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Run a skill by name
 *
 * @param skillName - Name of the skill to run
 * @param params - Optional parameters
 * @param params.mode - 'preview' (default), 'route', or 'execute'
 * @param params.input - Input for routing (used when mode='route')
 */
export function skillRun(
  skillName: string,
  params?: Record<string, unknown>
): ToolResult {
  const mode = (params?.mode as SkillRunMode) || 'preview';

  try {
    // Mode: route - Use hybrid router to find best MCP
    if (mode === 'route') {
      return skillRoute(params?.input as string);
    }

    // Mode: preview or execute - Load skill content
    const skillPath = path.join(SKILLS_DIR, skillName);
    const skillMdPath = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
      return {
        success: false,
        error: `Skill not found: ${skillName}`,
      };
    }

    const content = fs.readFileSync(skillMdPath, 'utf-8');

    // Mode: execute - Will be implemented in M3+
    if (mode === 'execute') {
      return {
        success: true,
        data: {
          skill: skillName,
          status: 'pending_execution',
          contentPreview: content.substring(0, 300),
          message: 'Execution mode requires M3+ integration. Use mode=route to see MCP candidates.',
        },
      };
    }

    // Mode: preview (default) - Return skill content
    return {
      success: true,
      data: {
        skill: skillName,
        status: 'loaded',
        contentPreview: content.substring(0, 500),
        message: 'Skill loaded. Use mode=route to see which internal MCP would handle this.',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to run skill: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Route an input to find the best internal MCP
 */
export function skillRoute(input: string | undefined): ToolResult {
  if (!input) {
    return {
      success: false,
      error: 'Input is required for routing. Use params.input to specify the task.',
    };
  }

  try {
    const mcps = getAllMcps();
    const config = getRouterConfig();
    const result: RouteResult = route(input, mcps, config);

    return {
      success: true,
      data: {
        action: result.action,
        reason: result.reason,
        matchedRule: result.matchedRule,
        confidence: result.confidence,
        candidates: result.candidates?.map((c) => ({
          name: c.name,
          score: `${(c.score * 100).toFixed(1)}%`,
          description: c.shortDescription,
          tags: c.tags,
        })),
        message: getActionMessage(result),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Routing failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get human-readable message for route action
 */
function getActionMessage(result: RouteResult): string {
  switch (result.action) {
    case 'allow':
      return `Ready to proceed with ${result.candidates?.[0]?.name || 'matched MCP'}.`;
    case 'require_human':
      return 'This operation requires human confirmation before proceeding.';
    case 'require_clarify':
      return 'Please clarify your intent or provide more details.';
    case 'deny':
      return 'This operation is not permitted.';
    default:
      return 'Unknown action.';
  }
}
