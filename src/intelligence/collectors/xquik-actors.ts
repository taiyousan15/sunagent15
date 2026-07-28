/**
 * Optional, bounded X research through Xquik's Apify Actors.
 *
 * Xquik is an independent third-party service. Not affiliated with X Corp.
 * "Twitter" and "X" are trademarks of X Corp.
 */

import {
  runApifyActor,
  type ApifyRuntime,
} from './apify-client'

const XQUIK_TWEET_ACTOR = 'xquik~x-tweet-scraper'
const XQUIK_FOLLOWER_ACTOR = 'xquik~x-follower-scraper'
const XQUIK_TWEET_URL = 'https://apify.com/xquik/x-tweet-scraper'
const XQUIK_FOLLOWER_URL = 'https://apify.com/xquik/x-follower-scraper'

export type XquikTweetMode =
  | 'tweet'
  | 'tweets'
  | 'search'
  | 'profileTweets'
  | 'thread'

export type XquikFollowerRelation =
  | 'followers'
  | 'following'
  | 'verified_followers'

export interface XquikTweetRequest {
  mode: XquikTweetMode
  targets: string[]
}

export interface XquikFollowerRequest {
  relation: XquikFollowerRelation
  targetType: 'handles' | 'userIds'
  targets: string[]
}

export interface XquikPlanOptions {
  maxItems: number
  maxTotalChargeUsd: number
}

interface XquikTweetInput {
  mode: XquikTweetMode
  maxItems: number
  outputVariant: 'rich'
  fieldStyle: 'camelCase'
  outputPreset: 'nested'
  tweetId?: string
  tweetIds?: string[]
  searchTerms?: string[]
  twitterHandles?: string[]
  threadTweetIds?: string[]
  includeSearchTerms?: true
  queryType?: 'Latest + Top'
}

interface XquikFollowerInput {
  relation: XquikFollowerRelation
  maxItems: number
  outputMode: 'compact'
  includeTargetMetadata: true
  dedupeMode: 'none'
  twitterHandles?: string[]
  userIds?: string[]
}

export interface XquikActorPlan {
  actor: typeof XQUIK_TWEET_ACTOR | typeof XQUIK_FOLLOWER_ACTOR
  actorUrl: typeof XQUIK_TWEET_URL | typeof XQUIK_FOLLOWER_URL
  input: XquikTweetInput | XquikFollowerInput
  maxTotalChargeUsd: number
}

export interface XquikExecutionOptions {
  apiToken: string
  approved: boolean
  runtime?: ApifyRuntime
}

function validatePlanOptions(options: XquikPlanOptions): void {
  if (
    !Number.isInteger(options.maxItems)
    || options.maxItems < 1
    || options.maxItems > 100
  ) {
    throw new Error('Xquik maxItems must be an integer from 1 to 100')
  }
  if (
    !Number.isFinite(options.maxTotalChargeUsd)
    || options.maxTotalChargeUsd <= 0
  ) {
    throw new Error('Xquik maxTotalChargeUsd must be a positive number')
  }
}

function normalizedTargets(targets: string[]): string[] {
  const normalized = targets.map(target => target.trim()).filter(Boolean)
  if (normalized.length === 0) {
    throw new Error('Xquik request needs at least one target')
  }
  return [...new Set(normalized)]
}

function numericIds(targets: string[], label: string): string[] {
  if (targets.some(target => !/^\d+$/.test(target))) {
    throw new Error(`${label} targets must be numeric IDs`)
  }
  return targets
}

function handles(targets: string[]): string[] {
  const normalized = targets.map(target => target.replace(/^@/, ''))
  if (normalized.some(target => !/^[A-Za-z0-9_]{1,15}$/.test(target))) {
    throw new Error('Xquik handle targets must be valid X handles')
  }
  return normalized
}

export function createXquikTweetPlan(
  request: XquikTweetRequest,
  options: XquikPlanOptions
): XquikActorPlan {
  validatePlanOptions(options)
  const targets = normalizedTargets(request.targets)
  const input: XquikTweetInput = {
    mode: request.mode,
    maxItems: options.maxItems,
    outputVariant: 'rich',
    fieldStyle: 'camelCase',
    outputPreset: 'nested',
  }

  switch (request.mode) {
    case 'tweet':
      if (targets.length !== 1) {
        throw new Error('Xquik tweet mode needs exactly one tweet ID')
      }
      input.tweetId = numericIds(targets, 'Tweet')[0]
      break
    case 'tweets':
      input.tweetIds = numericIds(targets, 'Tweet')
      break
    case 'search':
      input.searchTerms = targets
      input.includeSearchTerms = true
      input.queryType = 'Latest + Top'
      break
    case 'profileTweets':
      input.twitterHandles = handles(targets)
      break
    case 'thread':
      input.threadTweetIds = numericIds(targets, 'Thread')
      break
  }

  return {
    actor: XQUIK_TWEET_ACTOR,
    actorUrl: XQUIK_TWEET_URL,
    input,
    maxTotalChargeUsd: options.maxTotalChargeUsd,
  }
}

export function createXquikFollowerPlan(
  request: XquikFollowerRequest,
  options: XquikPlanOptions
): XquikActorPlan {
  validatePlanOptions(options)
  const targets = normalizedTargets(request.targets)
  const input: XquikFollowerInput = {
    relation: request.relation,
    maxItems: options.maxItems,
    outputMode: 'compact',
    includeTargetMetadata: true,
    dedupeMode: 'none',
  }

  if (request.targetType === 'handles') {
    input.twitterHandles = handles(targets)
  } else {
    input.userIds = numericIds(targets, 'User')
  }

  return {
    actor: XQUIK_FOLLOWER_ACTOR,
    actorUrl: XQUIK_FOLLOWER_URL,
    input,
    maxTotalChargeUsd: options.maxTotalChargeUsd,
  }
}

export async function executeXquikPlan<T>(
  plan: XquikActorPlan,
  options: XquikExecutionOptions
): Promise<T[]> {
  if (!options.approved) {
    throw new Error('Exact paid Actor plan approval required')
  }

  return runApifyActor<T>(
    plan.actor,
    plan.input,
    options.apiToken,
    {
      maxItems: plan.input.maxItems,
      maxTotalChargeUsd: plan.maxTotalChargeUsd,
    },
    options.runtime
  )
}
