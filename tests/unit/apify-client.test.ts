import {
  runApifyActor,
  type ApifyRuntime,
} from '../../src/intelligence/collectors/apify-client'

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function runtimeWith(
  responses: Response[],
  now: () => number = () => 0
): ApifyRuntime {
  return {
    fetch: async () => {
      const response = responses.shift()
      if (!response) throw new Error('unexpected request')
      return response
    },
    now,
    sleep: async () => undefined,
  }
}

describe('Apify client boundaries', () => {
  test('validates caps and credentials before fetching', async () => {
    expect.assertions(3)

    await expect(
      runApifyActor('actor', {}, 'token', { maxItems: 0 })
    ).rejects.toThrow('maxItems')
    await expect(
      runApifyActor('actor', {}, 'token', {
        maxItems: 1,
        maxTotalChargeUsd: 0,
      })
    ).rejects.toThrow('maxTotalChargeUsd')
    await expect(
      runApifyActor('actor', {}, ' ', { maxItems: 1 })
    ).rejects.toThrow('API token')
  })

  test('reports a failed Actor start without exposing the token', async () => {
    expect.assertions(1)
    const runtime = runtimeWith([
      new Response('upstream unavailable', { status: 503 }),
    ])

    await expect(
      runApifyActor('actor', {}, 'test-token', { maxItems: 1 }, runtime)
    ).rejects.toThrow('Apify run failed 503: upstream unavailable')
  })

  test('requires an Actor run ID', async () => {
    expect.assertions(1)
    const runtime = runtimeWith([jsonResponse({ data: {} }, 201)])

    await expect(
      runApifyActor('actor', {}, 'test-token', { maxItems: 1 }, runtime)
    ).rejects.toThrow('run ID not returned')
  })

  test('reports failed status requests and terminal Actor runs', async () => {
    expect.assertions(2)
    const statusFailure = runtimeWith([
      jsonResponse({ data: { id: 'run-1' } }, 201),
      new Response('status unavailable', { status: 503 }),
    ])
    const failedRun = runtimeWith([
      jsonResponse({ data: { id: 'run-2' } }, 201),
      jsonResponse({ data: { status: 'FAILED' } }),
    ])

    await expect(
      runApifyActor('actor', {}, 'test-token', { maxItems: 1 }, statusFailure)
    ).rejects.toThrow('Apify status failed 503: status unavailable')
    await expect(
      runApifyActor('actor', {}, 'test-token', { maxItems: 1 }, failedRun)
    ).rejects.toThrow('Apify run FAILED')
  })

  test('stops polling at the configured timeout', async () => {
    expect.assertions(1)
    let nowCalls = 0
    const runtime = runtimeWith(
      [jsonResponse({ data: { id: 'run-1' } }, 201)],
      () => {
        nowCalls += 1
        return nowCalls === 1 ? 0 : 2
      }
    )

    await expect(
      runApifyActor(
        'actor',
        {},
        'test-token',
        { maxItems: 1, timeoutMs: 1 },
        runtime
      )
    ).rejects.toThrow('timeout waiting for run')
  })

  test('validates dataset failures and response shape', async () => {
    expect.assertions(2)
    const datasetFailure = runtimeWith([
      jsonResponse({ data: { id: 'run-1' } }, 201),
      jsonResponse({
        data: { status: 'SUCCEEDED', defaultDatasetId: 'dataset-1' },
      }),
      new Response('dataset unavailable', { status: 502 }),
    ])
    const invalidDataset = runtimeWith([
      jsonResponse({ data: { id: 'run-2' } }, 201),
      jsonResponse({
        data: { status: 'SUCCEEDED', defaultDatasetId: 'dataset-2' },
      }),
      jsonResponse({ data: [] }),
    ])

    await expect(
      runApifyActor('actor', {}, 'test-token', { maxItems: 1 }, datasetFailure)
    ).rejects.toThrow('Apify dataset fetch failed 502: dataset unavailable')
    await expect(
      runApifyActor('actor', {}, 'test-token', { maxItems: 1 }, invalidDataset)
    ).rejects.toThrow('dataset response must be an array')
  })
})
