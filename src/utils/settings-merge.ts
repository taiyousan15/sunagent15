/**
 * Settings.json merge utility for TAISUN Agent installer.
 *
 * Merges a template mcpServers object into an existing settings object using
 * the "user-value priority, additive-only" strategy:
 *   - Existing keys: user value wins (template is ignored, no overwrite)
 *   - New keys: added with disabled:true (safe default; user explicitly enables)
 *   - _comment* keys in template: skipped
 *
 * Reference: ccsettings community-tool pattern (Existing Settings Priority).
 */

export interface McpServerEntry {
  command?: string;
  args?: unknown[];
  env?: Record<string, string>;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface SettingsLike {
  mcpServers?: Record<string, McpServerEntry>;
  [key: string]: unknown;
}

export interface MergeResult {
  merged: SettingsLike;
  added: string[];
  preserved: string[];
}

/**
 * Additive merge: user values always win, new MCPs added disabled.
 * Does NOT mutate inputs.
 */
export function additiveMerge(
  existing: SettingsLike | null | undefined,
  template: SettingsLike | null | undefined
): MergeResult {
  const merged: SettingsLike = JSON.parse(JSON.stringify(existing ?? {}));
  if (!merged.mcpServers) merged.mcpServers = {};
  const existingMcp = merged.mcpServers;

  const templateMcp = template?.mcpServers ?? {};

  const added: string[] = [];
  const preserved: string[] = [];

  for (const [key, val] of Object.entries(templateMcp)) {
    if (key.startsWith('_comment')) continue;
    if (!(key in existingMcp)) {
      const cloned = JSON.parse(JSON.stringify(val)) as McpServerEntry;
      cloned.disabled = true;
      existingMcp[key] = cloned;
      added.push(key);
    } else {
      preserved.push(key);
    }
  }

  return { merged, added, preserved };
}

/**
 * Fresh merge: template wins (old REPLACE behavior, for setup:fresh).
 * Only when the user explicitly opts into a destructive reset.
 */
export function freshMerge(
  existing: SettingsLike | null | undefined,
  template: SettingsLike | null | undefined
): MergeResult {
  const merged: SettingsLike = JSON.parse(JSON.stringify(existing ?? {}));
  if (!merged.mcpServers) merged.mcpServers = {};
  const existingMcp = merged.mcpServers;

  const templateMcp = template?.mcpServers ?? {};

  const added: string[] = [];
  const preserved: string[] = [];

  for (const [key, val] of Object.entries(templateMcp)) {
    if (key.startsWith('_comment')) continue;
    if (!(key in existingMcp)) {
      existingMcp[key] = JSON.parse(JSON.stringify(val));
      added.push(key);
    } else {
      existingMcp[key] = JSON.parse(JSON.stringify(val));
      preserved.push(key);
    }
  }

  return { merged, added, preserved };
}
