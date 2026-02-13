/**
 * Intent Parser Type Definitions
 *
 * ユーザーの自然言語コマンドから意図を抽出するシステムの型定義
 */

/**
 * 意図タイプ（35+ パターン）
 */
export enum IntentType {
  // Core Workflow Intents
  WORKFLOW_REUSE = 'WORKFLOW_REUSE',
  SKILL_INVOCATION = 'SKILL_INVOCATION',
  SESSION_CONTINUATION = 'SESSION_CONTINUATION',
  EXISTING_FILE_REFERENCE = 'EXISTING_FILE_REFERENCE',
  DEVIATION_REQUEST = 'DEVIATION_REQUEST',

  // File Operations
  FILE_CREATE = 'FILE_CREATE',
  FILE_EDIT = 'FILE_EDIT',
  FILE_DELETE = 'FILE_DELETE',
  FILE_READ = 'FILE_READ',

  // Code Operations
  CODE_REFACTOR = 'CODE_REFACTOR',
  CODE_REVIEW = 'CODE_REVIEW',
  CODE_IMPLEMENTATION = 'CODE_IMPLEMENTATION',
  CODE_BUGFIX = 'CODE_BUGFIX',

  // Testing
  TEST_CREATE = 'TEST_CREATE',
  TEST_RUN = 'TEST_RUN',
  TEST_FIX = 'TEST_FIX',

  // Documentation
  DOC_CREATE = 'DOC_CREATE',
  DOC_UPDATE = 'DOC_UPDATE',

  // Analysis
  ANALYSIS_CODE = 'ANALYSIS_CODE',
  ANALYSIS_PERFORMANCE = 'ANALYSIS_PERFORMANCE',
  ANALYSIS_SECURITY = 'ANALYSIS_SECURITY',

  // Project Management
  PROJECT_SETUP = 'PROJECT_SETUP',
  PROJECT_BUILD = 'PROJECT_BUILD',
  PROJECT_DEPLOY = 'PROJECT_DEPLOY',

  // Search & Navigation
  SEARCH_CODE = 'SEARCH_CODE',
  SEARCH_FILE = 'SEARCH_FILE',
  NAVIGATE_PROJECT = 'NAVIGATE_PROJECT',

  // Agent & Skills
  AGENT_RUN = 'AGENT_RUN',
  SKILL_LIST = 'SKILL_LIST',
  SKILL_EXECUTE = 'SKILL_EXECUTE',

  // Misc
  QUESTION = 'QUESTION',
  CONFIRMATION = 'CONFIRMATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * リスクレベル
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * エンティティ型
 */
export interface Entity {
  type: string;
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

/**
 * コンテキスト情報
 */
export interface IntentContext {
  sessionContinuation: boolean;
  existingFilesDetected: string[];
  skillRequested?: string;
  deviationDetected: boolean;
  workflowReuseDetected: boolean;
  baselineFileModification: boolean;
}

/**
 * Intent 分析結果
 */
export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: Entity[];
  context: IntentContext;
  riskLevel: RiskLevel;
  shouldSkipLayers: number[];
  reasoning: string;
}

/**
 * トークン情報
 */
export interface Token {
  surface: string;
  pos: string;
  base?: string;
  reading?: string;
}

/**
 * パターンマッチ結果
 */
export interface PatternMatch {
  pattern: string;
  confidence: number;
  matched: string;
  position: {
    start: number;
    end: number;
  };
}

/**
 * Intent Parser 設定
 */
export interface IntentParserConfig {
  enableJapaneseTokenizer: boolean;
  confidenceThreshold: number;
  maxProcessingTimeMs: number;
  enableContextResolution: boolean;
  enableRiskEvaluation: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Intent Parser のデフォルト設定
 */
export const DEFAULT_CONFIG: IntentParserConfig = {
  enableJapaneseTokenizer: true,
  confidenceThreshold: 50,
  maxProcessingTimeMs: 50,
  enableContextResolution: true,
  enableRiskEvaluation: true,
  logLevel: 'info',
};

/**
 * パターン定義
 */
export interface Pattern {
  name: string;
  regex: RegExp;
  intent: IntentType;
  confidence: number;
  examples: string[];
}

/**
 * コンテキストソース
 */
export interface ContextSource {
  sessionHandoffExists: boolean;
  workflowStateExists: boolean;
  baselineFiles: string[];
  currentPhase?: string;
}
