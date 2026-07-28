import {
  createXquikFollowerPlan,
  createXquikTweetPlan,
  executeXquikPlan,
  type XquikActorPlan,
  type XquikExecutionOptions,
  type XquikFollowerRelation,
  type XquikTweetMode,
} from './collectors/xquik-actors'

type ExecutePlan = (
  plan: XquikActorPlan,
  options: XquikExecutionOptions
) => Promise<unknown[]>

export interface XquikCliDependencies {
  env?: Record<string, string | undefined>
  write?: (line: string) => void
  execute?: ExecutePlan
}

interface ParsedArguments {
  positionals: string[]
  maxItems?: number
  maxTotalChargeUsd?: number
  targetType: 'handles' | 'userIds'
  planOnly: boolean
  approved: boolean
}

const TWEET_MODES: XquikTweetMode[] = [
  'tweet',
  'tweets',
  'search',
  'profileTweets',
  'thread',
]
const FOLLOWER_RELATIONS: XquikFollowerRelation[] = [
  'followers',
  'following',
  'verified_followers',
]

function requiredValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1]
  if (!value) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

function parseNumber(value: string, flag: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`${flag} requires a number`)
  }
  return parsed
}

function parseArguments(args: string[]): ParsedArguments {
  const parsed: ParsedArguments = {
    positionals: [],
    targetType: 'handles',
    planOnly: false,
    approved: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    switch (argument) {
      case '--max-items':
        parsed.maxItems = parseNumber(
          requiredValue(args, index, argument),
          argument
        )
        index += 1
        break
      case '--max-charge':
        parsed.maxTotalChargeUsd = parseNumber(
          requiredValue(args, index, argument),
          argument
        )
        index += 1
        break
      case '--target-type': {
        const targetType = requiredValue(args, index, argument)
        if (targetType !== 'handles' && targetType !== 'userIds') {
          throw new Error('--target-type must be handles or userIds')
        }
        parsed.targetType = targetType
        index += 1
        break
      }
      case '--plan':
        parsed.planOnly = true
        break
      case '--approve-paid-run':
        parsed.approved = true
        break
      default:
        if (argument.startsWith('--')) {
          throw new Error(`Unknown option: ${argument}`)
        }
        parsed.positionals.push(argument)
    }
  }
  return parsed
}

function isTweetMode(value: string): value is XquikTweetMode {
  return TWEET_MODES.includes(value as XquikTweetMode)
}

function isFollowerRelation(value: string): value is XquikFollowerRelation {
  return FOLLOWER_RELATIONS.includes(value as XquikFollowerRelation)
}

function targetsFrom(value: string | undefined): string[] {
  if (!value) {
    throw new Error('Actor route requires a target')
  }
  return value.split(',')
}

function buildPlan(parsed: ParsedArguments): XquikActorPlan {
  if (parsed.positionals.length !== 3) {
    throw new Error('Actor route requires exactly 3 positional arguments')
  }
  const [route, modeOrRelation, target] = parsed.positionals
  if (parsed.maxItems === undefined || parsed.maxTotalChargeUsd === undefined) {
    throw new Error('--max-items and --max-charge are required')
  }
  const options = {
    maxItems: parsed.maxItems,
    maxTotalChargeUsd: parsed.maxTotalChargeUsd,
  }

  if (route === 'tweet') {
    if (!modeOrRelation || !isTweetMode(modeOrRelation)) {
      throw new Error(`Tweet mode must be one of: ${TWEET_MODES.join(', ')}`)
    }
    return createXquikTweetPlan(
      {
        mode: modeOrRelation,
        targets: targetsFrom(target),
      },
      options
    )
  }

  if (route === 'followers') {
    if (!modeOrRelation || !isFollowerRelation(modeOrRelation)) {
      throw new Error(
        `Follower relation must be one of: ${FOLLOWER_RELATIONS.join(', ')}`
      )
    }
    return createXquikFollowerPlan(
      {
        relation: modeOrRelation,
        targetType: parsed.targetType,
        targets: targetsFrom(target),
      },
      options
    )
  }

  throw new Error('Route must be tweet or followers')
}

export async function runXquikCli(
  args: string[],
  dependencies: XquikCliDependencies = {}
): Promise<void> {
  const parsed = parseArguments(args)
  const plan = buildPlan(parsed)
  const write = dependencies.write
    ?? (line => process.stdout.write(`${line}\n`))

  if (parsed.planOnly) {
    write(JSON.stringify(plan, null, 2))
    return
  }
  if (!parsed.approved) {
    throw new Error('Add --plan or --approve-paid-run')
  }

  const apiToken = (dependencies.env ?? process.env).APIFY_TOKEN
  if (!apiToken) {
    throw new Error('APIFY_TOKEN is required for an approved Actor run')
  }
  const execute = dependencies.execute
    ?? ((actorPlan, executionOptions) =>
      executeXquikPlan<unknown>(actorPlan, executionOptions))
  const result = await execute(plan, {
    apiToken,
    approved: true,
  })
  write(JSON.stringify(result, null, 2))
}

if (require.main === module) {
  runXquikCli(process.argv.slice(2)).catch(error => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`Xquik Actor request failed: ${message}\n`)
    process.exitCode = 1
  })
}
