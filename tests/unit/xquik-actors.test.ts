import {
  createXquikFollowerPlan,
  createXquikTweetPlan,
  executeXquikPlan,
} from '../../src/intelligence/collectors/xquik-actors'
import type { ApifyRuntime } from '../../src/intelligence/collectors/apify-client'

interface FetchCall {
  input: string
  init?: RequestInit
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Xquik Actor plans', () => {
  test('builds a bounded Tweet Scraper search plan', () => {
    expect.assertions(1)

    const plan = createXquikTweetPlan(
      { mode: 'search', targets: ['AI agents'] },
      { maxItems: 25, maxTotalChargeUsd: 0.1 }
    )

    expect(plan).toEqual({
      actor: 'xquik~x-tweet-scraper',
      actorUrl: 'https://apify.com/xquik/x-tweet-scraper',
      input: {
        mode: 'search',
        searchTerms: ['AI agents'],
        maxItems: 25,
        includeSearchTerms: true,
        queryType: 'Latest + Top',
        outputVariant: 'rich',
        fieldStyle: 'camelCase',
        outputPreset: 'nested',
      },
      maxTotalChargeUsd: 0.1,
    })
  })

  test('builds a bounded Follower Scraper plan', () => {
    expect.assertions(1)

    const plan = createXquikFollowerPlan(
      {
        relation: 'verified_followers',
        targetType: 'handles',
        targets: ['nasa'],
      },
      { maxItems: 10, maxTotalChargeUsd: 0.05 }
    )

    expect(plan).toEqual({
      actor: 'xquik~x-follower-scraper',
      actorUrl: 'https://apify.com/xquik/x-follower-scraper',
      input: {
        twitterHandles: ['nasa'],
        relation: 'verified_followers',
        maxItems: 10,
        outputMode: 'compact',
        includeTargetMetadata: true,
        dedupeMode: 'none',
      },
      maxTotalChargeUsd: 0.05,
    })
  })

  test('maps every supported Tweet Actor target shape', () => {
    expect.assertions(4)
    const options = { maxItems: 10, maxTotalChargeUsd: 0.1 }

    expect(
      createXquikTweetPlan(
        { mode: 'tweets', targets: ['123', '456'] },
        options
      ).input
    ).toMatchObject({ mode: 'tweets', tweetIds: ['123', '456'] })
    expect(
      createXquikTweetPlan(
        { mode: 'profileTweets', targets: ['@nasa'] },
        options
      ).input
    ).toMatchObject({ mode: 'profileTweets', twitterHandles: ['nasa'] })
    expect(
      createXquikTweetPlan(
        { mode: 'thread', targets: ['123'] },
        options
      ).input
    ).toMatchObject({ mode: 'thread', threadTweetIds: ['123'] })
    expect(
      createXquikTweetPlan(
        { mode: 'tweet', targets: ['123'] },
        options
      ).input
    ).toMatchObject({ mode: 'tweet', tweetId: '123' })
  })

  test('rejects execution before any request without exact approval', async () => {
    expect.assertions(2)
    let fetchCount = 0
    const runtime: ApifyRuntime = {
      fetch: async () => {
        fetchCount += 1
        throw new Error('fetch must not run')
      },
      now: () => 0,
      sleep: async () => undefined,
    }
    const plan = createXquikTweetPlan(
      { mode: 'tweet', targets: ['123'] },
      { maxItems: 1, maxTotalChargeUsd: 0.01 }
    )

    await expect(
      executeXquikPlan(plan, {
        apiToken: 'test-token',
        approved: false,
        runtime,
      })
    ).rejects.toThrow('Exact paid Actor plan approval required')
    expect(fetchCount).toBe(0)
  })

  test('executes an approved plan without putting credentials in URLs', async () => {
    expect.assertions(6)
    const calls: FetchCall[] = []
    const responses = [
      jsonResponse({ data: { id: 'run-1' } }, 201),
      jsonResponse({
        data: {
          status: 'SUCCEEDED',
          defaultDatasetId: 'dataset-1',
        },
      }),
      jsonResponse([{ id: '123', text: 'Example' }]),
    ]
    const runtime: ApifyRuntime = {
      fetch: async (input, init) => {
        calls.push({ input: String(input), init })
        const response = responses.shift()
        if (!response) throw new Error('unexpected request')
        return response
      },
      now: () => 0,
      sleep: async () => undefined,
    }
    const plan = createXquikTweetPlan(
      { mode: 'tweet', targets: ['123'] },
      { maxItems: 1, maxTotalChargeUsd: 0.25 }
    )

    const result = await executeXquikPlan(plan, {
      apiToken: 'test-token',
      approved: true,
      runtime,
    })

    expect(result).toEqual([{ id: '123', text: 'Example' }])
    expect(calls).toHaveLength(3)
    expect(calls[0].input).toContain('maxTotalChargeUsd=0.25')
    expect(calls.every(call => !call.input.includes('test-token'))).toBe(true)
    expect(
      calls.every(call =>
        new Headers(call.init?.headers).get('Authorization') === 'Bearer test-token'
      )
    ).toBe(true)
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      mode: 'tweet',
      tweetId: '123',
      maxItems: 1,
      outputVariant: 'rich',
      fieldStyle: 'camelCase',
      outputPreset: 'nested',
    })
  })

  test('rejects invalid caps and empty targets', () => {
    expect.assertions(3)

    expect(() =>
      createXquikTweetPlan(
        { mode: 'search', targets: [] },
        { maxItems: 10, maxTotalChargeUsd: 0.1 }
      )
    ).toThrow('at least one target')
    expect(() =>
      createXquikTweetPlan(
        { mode: 'search', targets: ['AI'] },
        { maxItems: 0, maxTotalChargeUsd: 0.1 }
      )
    ).toThrow('maxItems')
    expect(() =>
      createXquikFollowerPlan(
        { relation: 'followers', targetType: 'handles', targets: ['nasa'] },
        { maxItems: 10, maxTotalChargeUsd: Number.NaN }
      )
    ).toThrow('maxTotalChargeUsd')
  })

  test('rejects invalid target shapes', () => {
    expect.assertions(3)
    const options = { maxItems: 10, maxTotalChargeUsd: 0.1 }

    expect(() =>
      createXquikTweetPlan(
        { mode: 'tweet', targets: ['123', '456'] },
        options
      )
    ).toThrow('exactly one tweet ID')
    expect(() =>
      createXquikTweetPlan(
        { mode: 'thread', targets: ['not-an-id'] },
        options
      )
    ).toThrow('numeric IDs')
    expect(() =>
      createXquikFollowerPlan(
        {
          relation: 'followers',
          targetType: 'handles',
          targets: ['invalid handle'],
        },
        options
      )
    ).toThrow('valid X handles')
  })
})
