import { setTimeout as sleep } from 'node:timers/promises'

const APIFY_BASE_URL = 'https://api.apify.com/v2'

export interface ApifyRuntime {
  fetch: typeof fetch
  now: () => number
  sleep: (milliseconds: number) => Promise<void>
}

export interface ApifyRunOptions {
  maxItems: number
  maxTotalChargeUsd?: number
  timeoutMs?: number
  pollIntervalMs?: number
}

const DEFAULT_RUNTIME: ApifyRuntime = {
  fetch: globalThis.fetch,
  now: Date.now,
  sleep,
}

function validateOptions(options: ApifyRunOptions): void {
  if (!Number.isInteger(options.maxItems) || options.maxItems <= 0) {
    throw new Error('Apify maxItems must be a positive integer')
  }
  if (
    options.maxTotalChargeUsd !== undefined
    && (!Number.isFinite(options.maxTotalChargeUsd) || options.maxTotalChargeUsd <= 0)
  ) {
    throw new Error('Apify maxTotalChargeUsd must be a positive number')
  }
}

function authorizationHeaders(apiToken: string): HeadersInit {
  if (!apiToken.trim()) {
    throw new Error('Apify API token is required')
  }
  return {
    Authorization: `Bearer ${apiToken}`,
    Accept: 'application/json',
  }
}

async function errorBody(response: Response): Promise<string> {
  return (await response.text()).slice(0, 200)
}

export async function runApifyActor<T>(
  actorId: string,
  input: object,
  apiToken: string,
  options: ApifyRunOptions,
  runtime: ApifyRuntime = DEFAULT_RUNTIME
): Promise<T[]> {
  validateOptions(options)
  const headers = authorizationHeaders(apiToken)
  const timeoutMs = options.timeoutMs ?? 60000
  const pollIntervalMs = options.pollIntervalMs ?? 3000
  const runUrl = new URL(`${APIFY_BASE_URL}/acts/${encodeURIComponent(actorId)}/runs`)
  if (options.maxTotalChargeUsd !== undefined) {
    runUrl.searchParams.set('maxTotalChargeUsd', String(options.maxTotalChargeUsd))
  }

  const runResponse = await runtime.fetch(runUrl, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...input, maxItems: options.maxItems }),
    signal: AbortSignal.timeout(Math.min(timeoutMs, 15000)),
  })
  if (!runResponse.ok) {
    throw new Error(
      `Apify run failed ${runResponse.status}: ${await errorBody(runResponse)}`
    )
  }

  const runData = await runResponse.json() as { data?: { id?: string } }
  const runId = runData.data?.id
  if (!runId) {
    throw new Error('Apify run ID not returned')
  }

  const deadline = runtime.now() + timeoutMs
  let datasetId: string | undefined
  while (runtime.now() < deadline) {
    await runtime.sleep(pollIntervalMs)
    const statusResponse = await runtime.fetch(
      `${APIFY_BASE_URL}/actor-runs/${encodeURIComponent(runId)}`,
      {
        headers,
        signal: AbortSignal.timeout(Math.min(timeoutMs, 8000)),
      }
    )
    if (!statusResponse.ok) {
      throw new Error(
        `Apify status failed ${statusResponse.status}: ${await errorBody(statusResponse)}`
      )
    }

    const statusData = await statusResponse.json() as {
      data?: {
        status?: string
        defaultDatasetId?: string
      }
    }
    const runStatus = statusData.data?.status
    if (runStatus === 'SUCCEEDED') {
      datasetId = statusData.data?.defaultDatasetId
      break
    }
    if (runStatus && ['FAILED', 'TIMED-OUT', 'ABORTED'].includes(runStatus)) {
      throw new Error(`Apify run ${runStatus}`)
    }
  }

  if (!datasetId) {
    throw new Error('Apify timeout waiting for run')
  }

  const itemsResponse = await runtime.fetch(
    `${APIFY_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/items?format=json`,
    {
      headers,
      signal: AbortSignal.timeout(Math.min(timeoutMs, 10000)),
    }
  )
  if (!itemsResponse.ok) {
    throw new Error(
      `Apify dataset fetch failed ${itemsResponse.status}: ${await errorBody(itemsResponse)}`
    )
  }

  const items = await itemsResponse.json()
  if (!Array.isArray(items)) {
    throw new Error('Apify dataset response must be an array')
  }
  return items as T[]
}
