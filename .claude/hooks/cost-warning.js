/**
 * Cost Warning Hook
 * APIコストが発生するMCP/スキル使用前に警告を表示
 *
 * @version 1.0.0
 * @updated 2026-02-03
 */

const COST_MCPS = [
  'gpt-researcher',
  'apify',
  'tavily',
];

const COST_SKILLS = [
  'gpt-researcher',
  'mega-research',
  'apify-research',
];

const COST_INFO = {
  'gpt-researcher': {
    name: 'GPT Researcher',
    estimate: '$0.10-1.00/クエリ',
    free_tier: 'なし（OpenAI + Tavily APIキー必要）'
  },
  'apify': {
    name: 'Apify',
    estimate: '$0.01-0.50/リクエスト',
    free_tier: '月$5無料クレジット'
  },
  'tavily': {
    name: 'Tavily',
    estimate: '$0.01/検索',
    free_tier: '月1,000回無料'
  },
  'mega-research': {
    name: 'Mega Research',
    estimate: '$0.50-5.00/レポート',
    free_tier: 'なし（複数API使用）'
  },
  'apify-research': {
    name: 'Apify Research',
    estimate: '$0.01-0.50/スクレイピング',
    free_tier: '月$5無料クレジット'
  }
};

module.exports = {
  name: 'cost-warning',
  description: 'APIコスト発生前に警告を表示',
  event: 'PreToolUse',
  version: '1.0.0',

  /**
   * ツール使用前にコスト警告をチェック
   */
  // eslint-disable-next-line no-unused-vars
  async run({ tool, input, session }) {
    // MCP名をチェック
    const mcpMatch = COST_MCPS.find(mcp =>
      tool.toLowerCase().includes(mcp.toLowerCase())
    );

    // スキル名をチェック（input内にスキル呼び出しがある場合）
    const skillMatch = COST_SKILLS.find(skill => {
      const inputStr = JSON.stringify(input || {}).toLowerCase();
      return inputStr.includes(skill.toLowerCase());
    });

    const match = mcpMatch || skillMatch;

    if (match) {
      const info = COST_INFO[match] || {
        name: match,
        estimate: '不明',
        free_tier: '確認してください'
      };

      console.log('');
      console.log('┌─────────────────────────────────────────────────────────┐');
      console.log('│  💰 コスト警告 - APIコストが発生します                   │');
      console.log('├─────────────────────────────────────────────────────────┤');
      console.log(`│  サービス: ${info.name.padEnd(44)}│`);
      console.log(`│  推定コスト: ${info.estimate.padEnd(42)}│`);
      console.log(`│  無料枠: ${info.free_tier.padEnd(46)}│`);
      console.log('├─────────────────────────────────────────────────────────┤');
      console.log('│  ⏳ 3秒後に続行します... (Ctrl+C でキャンセル)          │');
      console.log('└─────────────────────────────────────────────────────────┘');
      console.log('');

      // 3秒待機（ユーザーがキャンセルできる時間）
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 使用ログを記録
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: match,
        tool: tool,
        estimated_cost: info.estimate
      };

      // ログファイルに追記（オプション）
      try {
        const fs = await import('fs/promises');
        const logPath = '.claude/logs/cost-usage.jsonl';
        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
      } catch (e) {
        // ログ記録失敗は無視（重要ではない）
      }
    }

    // 常に続行を許可
    return { continue: true };
  }
};
