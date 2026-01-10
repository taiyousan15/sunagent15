#!/usr/bin/env node
/**
 * Context Monitor Hook
 *
 * Automatically monitors context usage and suggests optimization
 * Runs after each tool use to check context consumption
 */

const CONTEXT_THRESHOLDS = {
  WARNING: 60,  // 60% - suggest /compact
  CRITICAL: 75, // 75% - strongly recommend /compact
  EMERGENCY: 85 // 85% - must /compact before continuing
};

const FILE_SIZE_THRESHOLDS = {
  SMALL: 5 * 1024,      // 5KB - direct Write OK
  MEDIUM: 20 * 1024,    // 20KB - consider Agent
  LARGE: 50 * 1024      // 50KB - must use Agent
};

async function checkContextUsage() {
  // This would integrate with Claude Code's context API
  // For now, this is a template for future implementation

  console.log('[Context Monitor] Checking usage...');

  // Example logic:
  // const usage = await getContextUsage();
  // if (usage.percentage > CONTEXT_THRESHOLDS.WARNING) {
  //   suggestCompact(usage);
  // }
}

function suggestCompact(usage) {
  if (usage.percentage > CONTEXT_THRESHOLDS.EMERGENCY) {
    console.log('🚨 EMERGENCY: Context at ' + usage.percentage + '%');
    console.log('   Please run: /compact');
    console.log('   Cannot continue without compaction');
  } else if (usage.percentage > CONTEXT_THRESHOLDS.CRITICAL) {
    console.log('⚠️  CRITICAL: Context at ' + usage.percentage + '%');
    console.log('   Strongly recommend: /compact');
  } else if (usage.percentage > CONTEXT_THRESHOLDS.WARNING) {
    console.log('💡 INFO: Context at ' + usage.percentage + '%');
    console.log('   Consider: /compact after 2-3 more files');
  }
}

function checkFileSize(filePath, contentSize) {
  if (contentSize > FILE_SIZE_THRESHOLDS.LARGE) {
    console.log('🚫 File too large (' + Math.round(contentSize / 1024) + 'KB)');
    console.log('   Recommendation: Use Agent delegation');
    console.log('   Example: /Task [agent] "generate ' + filePath + '"');
    return 'agent-required';
  } else if (contentSize > FILE_SIZE_THRESHOLDS.MEDIUM) {
    console.log('⚠️  Large file (' + Math.round(contentSize / 1024) + 'KB)');
    console.log('   Recommendation: Consider Agent or run /compact after');
    return 'agent-suggested';
  } else if (contentSize > FILE_SIZE_THRESHOLDS.SMALL) {
    console.log('💡 Medium file (' + Math.round(contentSize / 1024) + 'KB)');
    console.log('   Tip: Run /compact after 3-5 similar files');
    return 'compact-later';
  }
  return 'ok';
}

// Export for use in hooks
module.exports = {
  checkContextUsage,
  suggestCompact,
  checkFileSize,
  CONTEXT_THRESHOLDS,
  FILE_SIZE_THRESHOLDS
};

// Run check if called directly
if (require.main === module) {
  checkContextUsage().catch(console.error);
}
