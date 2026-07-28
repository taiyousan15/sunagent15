import { runXquikCli } from '../../src/intelligence/xquik-actors-cli'
import type {
  XquikActorPlan,
  XquikExecutionOptions,
} from '../../src/intelligence/collectors/xquik-actors'

describe('Xquik Actor CLI', () => {
  test('prints a Tweet Actor plan without reading a token or executing', async () => {
    expect.assertions(2)
    const output: string[] = []
    let executionCount = 0

    await runXquikCli(
      [
        'tweet',
        'search',
        'AI agents',
        '--max-items',
        '12',
        '--max-charge',
        '0.1',
        '--plan',
      ],
      {
        env: {},
        write: line => output.push(line),
        execute: async () => {
          executionCount += 1
          return []
        },
      }
    )

    expect(JSON.parse(output[0])).toEqual({
      actor: 'xquik~x-tweet-scraper',
      actorUrl: 'https://apify.com/xquik/x-tweet-scraper',
      input: {
        mode: 'search',
        searchTerms: ['AI agents'],
        maxItems: 12,
        includeSearchTerms: true,
        queryType: 'Latest + Top',
        outputVariant: 'rich',
        fieldStyle: 'camelCase',
        outputPreset: 'nested',
      },
      maxTotalChargeUsd: 0.1,
    })
    expect(executionCount).toBe(0)
  })

  test('prints a plan through the default standard output writer', async () => {
    expect.assertions(1)

    await expect(
      runXquikCli([
        'tweet',
        'tweet',
        '123',
        '--max-items',
        '1',
        '--max-charge',
        '0.01',
        '--plan',
      ])
    ).resolves.toBeUndefined()
  })

  test('rejects an unapproved paid run before execution', async () => {
    expect.assertions(2)
    let executionCount = 0

    await expect(
      runXquikCli(
        [
          'followers',
          'followers',
          'nasa',
          '--max-items',
          '5',
          '--max-charge',
          '0.05',
        ],
        {
          env: { APIFY_TOKEN: 'test-token' },
          write: () => undefined,
          execute: async () => {
            executionCount += 1
            return []
          },
        }
      )
    ).rejects.toThrow('Add --plan or --approve-paid-run')
    expect(executionCount).toBe(0)
  })

  test('rejects extra positional arguments before execution', async () => {
    expect.assertions(2)
    let executionCount = 0

    await expect(
      runXquikCli(
        [
          'tweet',
          'search',
          'AI agents',
          'unexpected',
          '--max-items',
          '5',
          '--max-charge',
          '0.05',
          '--approve-paid-run',
        ],
        {
          env: { APIFY_TOKEN: 'test-token' },
          write: () => undefined,
          execute: async () => {
            executionCount += 1
            return []
          },
        }
      )
    ).rejects.toThrow('exactly 3 positional arguments')
    expect(executionCount).toBe(0)
  })

  test('validates option syntax before plan creation', async () => {
    expect.assertions(4)
    const dependencies = {
      env: {},
      write: () => undefined,
      execute: async (): Promise<unknown[]> => [],
    }

    await expect(
      runXquikCli(['--max-items'], dependencies)
    ).rejects.toThrow('--max-items requires a value')
    await expect(
      runXquikCli(['--max-items', 'many'], dependencies)
    ).rejects.toThrow('--max-items requires a number')
    await expect(
      runXquikCli(['--target-type', 'names'], dependencies)
    ).rejects.toThrow('--target-type must be handles or userIds')
    await expect(
      runXquikCli(['--unknown'], dependencies)
    ).rejects.toThrow('Unknown option: --unknown')
  })

  test('validates route syntax and credentials before execution', async () => {
    expect.assertions(6)
    const dependencies = {
      env: {},
      write: () => undefined,
      execute: async (): Promise<unknown[]> => [],
    }
    const caps = ['--max-items', '5', '--max-charge', '0.05']

    await expect(
      runXquikCli(['tweet', 'search', 'AI'], dependencies)
    ).rejects.toThrow('--max-items and --max-charge are required')
    await expect(
      runXquikCli(['unknown', 'search', 'AI', ...caps], dependencies)
    ).rejects.toThrow('Route must be tweet or followers')
    await expect(
      runXquikCli(['tweet', 'unknown', 'AI', ...caps], dependencies)
    ).rejects.toThrow('Tweet mode must be one of')
    await expect(
      runXquikCli(['followers', 'unknown', 'nasa', ...caps], dependencies)
    ).rejects.toThrow('Follower relation must be one of')
    await expect(
      runXquikCli(['tweet', 'search', '', ...caps], dependencies)
    ).rejects.toThrow('Actor route requires a target')
    await expect(
      runXquikCli(
        ['tweet', 'search', 'AI', ...caps, '--approve-paid-run'],
        dependencies
      )
    ).rejects.toThrow('APIFY_TOKEN is required')
  })

  test('executes an approved Follower Actor plan', async () => {
    expect.assertions(3)
    const output: string[] = []
    let receivedPlan: XquikActorPlan | undefined
    let receivedOptions: XquikExecutionOptions | undefined

    await runXquikCli(
      [
        'followers',
        'verified_followers',
        '44196397',
        '--target-type',
        'userIds',
        '--max-items',
        '5',
        '--max-charge',
        '0.05',
        '--approve-paid-run',
      ],
      {
        env: { APIFY_TOKEN: 'test-token' },
        write: line => output.push(line),
        execute: async (plan, options) => {
          receivedPlan = plan
          receivedOptions = options
          return [{ id: '1' }]
        },
      }
    )

    expect(receivedPlan?.input).toEqual({
      userIds: ['44196397'],
      relation: 'verified_followers',
      maxItems: 5,
      outputMode: 'compact',
      includeTargetMetadata: true,
      dedupeMode: 'none',
    })
    expect(receivedOptions).toEqual({
      apiToken: 'test-token',
      approved: true,
    })
    expect(JSON.parse(output[0])).toEqual([{ id: '1' }])
  })
})
