/**
 * Skill Tools - Search and run skills from .claude/skills
 */

import * as fs from 'fs';
import * as path from 'path';
import { SkillDefinition, ToolResult } from '../types';

const SKILLS_DIR = path.join(process.cwd(), '.claude', 'skills');

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
 */
export function skillRun(skillName: string, _params?: Record<string, unknown>): ToolResult {
  try {
    const skillPath = path.join(SKILLS_DIR, skillName);
    const skillMdPath = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
      return {
        success: false,
        error: `Skill not found: ${skillName}`,
      };
    }

    // For MVP, just return the skill content
    // In future versions, this will invoke internal MCPs
    const content = fs.readFileSync(skillMdPath, 'utf-8');

    return {
      success: true,
      data: {
        skill: skillName,
        status: 'loaded',
        contentPreview: content.substring(0, 500),
        message: 'Skill loaded. Full execution requires internal MCP integration (M2+)',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to run skill: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
