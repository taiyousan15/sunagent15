#!/usr/bin/env node
/**
 * Model Auto-Switch Hook - タスク複雑度ベースのモデル自動推奨
 *
 * UserPromptSubmit で実行され、ユーザー入力を解析して
 * 最適なモデルを推奨します。
 *
 * ModelRouter.ts のルーティングルールを JS で再実装。
 * Claude Code の /model コマンドとの連携を推奨出力で実現。
 */

const fs = require('fs')
const path = require('path')

// ルーティングルール（ModelRouter.ts と同期）
const ROUTING_RULES = [
  {
    complexity: 'trivial',
    model: 'haiku',
    claudeModel: 'haiku',
    maxCost: 0.01,
    description: '単純タスク',
  },
  {
    complexity: 'simple',
    model: 'haiku',
    claudeModel: 'haiku',
    maxCost: 0.05,
    description: '簡単なタスク',
  },
  {
    complexity: 'moderate',
    model: 'sonnet',
    claudeModel: 'sonnet',
    maxCost: 0.20,
    description: '中程度のタスク',
  },
  {
    complexity: 'complex',
    model: 'sonnet',
    claudeModel: 'sonnet',
    maxCost: 0.50,
    description: '複雑なタスク',
  },
  {
    complexity: 'expert',
    model: 'opus',
    claudeModel: 'opus',
    maxCost: 2.00,
    description: 'エキスパートタスク',
  },
]

// 複雑度判定キーワード
const COMPLEXITY_KEYWORDS = {
  expert: [
    'アーキテクチャ', 'architecture', 'リファクタリング', 'refactor',
    'セキュリティ監査', 'security audit', 'パフォーマンス最適化',
    'performance optimization', '設計', 'design system',
    'マイクロサービス', 'microservice', '分散システム', 'distributed',
    'スケーリング', 'scaling', 'インフラ', 'infrastructure',
    '統合実装', 'full implementation', 'ゼロから構築', 'build from scratch',
    '移行', 'migration', 'セキュリティ', 'security review',
    'threat model', '脅威モデル',
  ],
  complex: [
    '新機能', 'new feature', '実装して', 'implement',
    'テスト作成', 'write tests', 'API', 'エンドポイント', 'endpoint',
    'データベース', 'database', 'CI/CD', 'デプロイ', 'deploy',
    'ワークフロー', 'workflow', 'パイプライン', 'pipeline',
    '統合', 'integration', 'フック', 'hook', 'MCP',
    'エージェント', 'agent', 'スキル', 'skill',
    '複数ファイル', 'multi-file', 'バグ修正', 'bug fix',
  ],
  moderate: [
    '修正', 'fix', '更新', 'update', '変更', 'change',
    '追加', 'add', '編集', 'edit', '改善', 'improve',
    'コンポーネント', 'component', '関数', 'function',
    'テスト', 'test', 'ドキュメント', 'document',
    'リファクタ', 'refactor', 'リネーム', 'rename',
  ],
  simple: [
    '確認', 'check', '表示', 'show', '状況', 'status',
    '読んで', 'read', '見て', 'look', '教えて', 'tell',
    'ヘルプ', 'help', '説明', 'explain', 'どう', 'how',
    '一覧', 'list', '検索', 'search', '探して', 'find',
  ],
  trivial: [
    'こんにちは', 'hello', 'hi', 'ありがとう', 'thanks',
    'はい', 'yes', 'いいえ', 'no', 'ok', 'OK',
    '了解', '承知', 'わかった', '次', 'next', '進めて', 'proceed',
  ],
}

// 複雑度スコアの重み
const COMPLEXITY_WEIGHTS = {
  expert: 5,
  complex: 4,
  moderate: 3,
  simple: 2,
  trivial: 1,
}

function estimateComplexity(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return { complexity: 'moderate', confidence: 0.3, reason: 'デフォルト（入力なし）' }
  }

  const input = userInput.toLowerCase()
  const scores = { expert: 0, complex: 0, moderate: 0, simple: 0, trivial: 0 }
  const matchedKeywords = {}

  for (const [level, keywords] of Object.entries(COMPLEXITY_KEYWORDS)) {
    const matches = keywords.filter(kw => input.includes(kw.toLowerCase()))
    if (matches.length > 0) {
      scores[level] = matches.length * COMPLEXITY_WEIGHTS[level]
      matchedKeywords[level] = matches
    }
  }

  // 入力長による補正
  const inputLength = userInput.length
  if (inputLength > 500) {
    scores.complex += 2
    scores.expert += 1
  } else if (inputLength > 200) {
    scores.moderate += 1
  } else if (inputLength < 20) {
    scores.trivial += 2
    scores.simple += 1
  }

  // 最高スコアの複雑度を選択
  let maxScore = 0
  let bestComplexity = 'moderate'
  for (const [level, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      bestComplexity = level
    }
  }

  // 信頼度計算
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const confidence = totalScore > 0 ? Math.min(maxScore / totalScore + 0.3, 1.0) : 0.3

  const topKeywords = matchedKeywords[bestComplexity] || []
  const reason = topKeywords.length > 0
    ? `キーワード検出: ${topKeywords.slice(0, 3).join(', ')}`
    : `入力長 ${inputLength}文字による推定`

  return { complexity: bestComplexity, confidence, reason }
}

function getRecommendedModel(complexity) {
  const rule = ROUTING_RULES.find(r => r.complexity === complexity)
  return rule || ROUTING_RULES[2] // default: moderate → sonnet
}

function getCurrentModel() {
  try {
    const userSettingsPath = path.join(process.env.HOME, '.claude', 'settings.json')
    if (fs.existsSync(userSettingsPath)) {
      const settings = JSON.parse(fs.readFileSync(userSettingsPath, 'utf8'))
      return settings.model || null
    }
  } catch {
    // ignore
  }
  return null
}

function getSessionContext() {
  try {
    const handoffPath = path.join(process.cwd(), 'SESSION_HANDOFF.md')
    if (fs.existsSync(handoffPath)) {
      const content = fs.readFileSync(handoffPath, 'utf8')
      // 最初の200文字からコンテキストを取得
      return content.slice(0, 200)
    }
  } catch {
    // ignore
  }
  return ''
}

async function main() {
  const startTime = Date.now()

  let input = {}
  try {
    const stdinData = await readStdin()
    if (stdinData) {
      input = JSON.parse(stdinData)
    }
  } catch {
    process.exit(0)
    return
  }

  const userPrompt = input.user_prompt || input.prompt || ''

  // 空入力はスキップ
  if (!userPrompt.trim()) {
    process.exit(0)
    return
  }

  // 複雑度推定
  const { complexity, confidence, reason } = estimateComplexity(userPrompt)
  const recommendation = getRecommendedModel(complexity)
  const currentModel = getCurrentModel()

  // モデル切替が不要な場合はスキップ
  if (currentModel === recommendation.claudeModel) {
    process.exit(0)
    return
  }

  // 低信頼度の場合はスキップ
  if (confidence < 0.4) {
    process.exit(0)
    return
  }

  const elapsed = Date.now() - startTime

  // 推奨出力（stderrで表示、hookをブロックしない）
  const output = []
  output.push(`[Model Auto-Switch] 複雑度: ${complexity} (信頼度: ${(confidence * 100).toFixed(0)}%)`)
  output.push(`  推奨モデル: ${recommendation.claudeModel} | 現在: ${currentModel || '不明'}`)
  output.push(`  理由: ${reason}`)

  if (currentModel && currentModel !== recommendation.claudeModel) {
    output.push(`  💡 /model ${recommendation.claudeModel} で切替可能`)
  }

  output.push(`  (${elapsed}ms)`)

  // stderr出力（ブロックしない）
  process.stderr.write(output.join('\n') + '\n')

  // メトリクス記録
  logMetric({
    timestamp: new Date().toISOString(),
    type: 'model-recommendation',
    complexity,
    confidence,
    recommendedModel: recommendation.claudeModel,
    currentModel: currentModel || 'unknown',
    switched: false,
    reason,
    processingTimeMs: elapsed,
  })

  process.exit(0)
}

function logMetric(data) {
  try {
    const logDir = path.join(__dirname, 'data')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    const logPath = path.join(logDir, 'model-switch.log')
    fs.appendFileSync(logPath, JSON.stringify(data) + '\n')
  } catch {
    // メトリクス記録失敗は無視
  }
}

function readStdin(timeout = 1000) {
  return new Promise((resolve) => {
    let data = ''
    let resolved = false

    const finish = () => {
      if (!resolved) {
        resolved = true
        resolve(data)
      }
    }

    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => { data += chunk })
    process.stdin.on('end', finish)
    setTimeout(finish, timeout)

    if (process.stdin.isTTY) finish()
  })
}

// エクスポート（テスト用）
if (typeof module !== 'undefined') {
  module.exports = {
    estimateComplexity,
    getRecommendedModel,
    ROUTING_RULES,
    COMPLEXITY_KEYWORDS,
  }
}

main().catch(() => process.exit(0))
