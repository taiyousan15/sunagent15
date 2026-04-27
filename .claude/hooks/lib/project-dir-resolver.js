/**
 * Project Directory Resolver
 *
 * Resolves the multi-project search root used by SessionStart hooks
 * (session-continue-guard, workflow-sessionstart-injector, etc.) to
 * locate sibling project directories such as SESSION_HANDOFF.md and
 * .workflow_state.json.
 *
 * Priority:
 *   1. CLAUDE_PROJECTS_DIR — explicit override for multi-project parent dir
 *   2. HOME/Desktop          — legacy fallback (preserves prior behavior)
 *
 * Returns null when neither is available, so callers can fail-open
 * (skip cross-project scanning) instead of throwing on undefined HOME.
 *
 * Why a separate "projects root" (vs. CLAUDE_PROJECT_DIR which is
 * Claude Code's single-project env var): these hooks scan for SIBLING
 * projects, not the current one. Using CLAUDE_PROJECT_DIR's parent is
 * brittle when projects live outside a common parent.
 */

const path = require('path');

function resolveProjectsRoot() {
  const explicit = process.env.CLAUDE_PROJECTS_DIR;
  if (explicit && explicit.trim().length > 0) {
    return explicit;
  }

  const home = process.env.HOME;
  if (home && home.trim().length > 0) {
    return path.join(home, 'Desktop');
  }

  return null;
}

module.exports = { resolveProjectsRoot };
