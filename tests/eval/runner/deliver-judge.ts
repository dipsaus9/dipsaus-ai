/**
 * Quality judge for a delivered diff (DIP-10.4). The deterministic grader (deliver-grade.ts) scores
 * the machine-checkable dimensions; this judge scores what no rule can decide — is the
 * implementation a good solution to the story, or merely green? It reuses the vote/parse/majority
 * machinery in judge.ts and the `deliver-quality` rubric under ../rubrics.
 *
 * Gated: per AC#2 the judge only runs on a delivery that passed the deterministic gate — there is
 * no point (and no cheap dollars) judging the quality of a run that failed its branch/verify/ACs.
 */
import { invokeClaude } from './claude'
import type { EvalConfig } from './config'
import {
  majorityVerdict,
  parseJudgeVote,
  readRubric,
  type JudgeVerdict,
  type JudgeVote,
} from './judge'

export const DELIVER_QUALITY_RULE = 'deliver-quality'

/** What the judge sees: the story's intent and the delivered diff. No run metadata, no model id. */
export interface DeliverJudgeInput {
  storyOutcome: string
  acs: string[]
  /** `git diff <base>...HEAD` for the delivered branch. */
  diff: string
}

export type DeliverJudgeResult =
  | { judged: false; reason: string }
  | { judged: true; verdict: JudgeVerdict }

/** Blind prompt: the quality rubric + the story intent + the diff, in the judge.ts VERDICT format. */
export function buildDeliverJudgePrompt(rubric: string, input: DeliverJudgeInput): string {
  const acs = input.acs.map((ac, i) => `${i + 1}. ${ac}`).join('\n')
  return [
    'You are judging whether a delivered code change is a GOOD implementation of its story.',
    'Apply ONLY the rubric below. Be strict: when evidence is ambiguous, fail.',
    '',
    'Answer in exactly this format and nothing else:',
    'VERDICT: pass|fail',
    'REASONING: <one short paragraph citing the rubric criteria>',
    '',
    '--- RUBRIC',
    rubric,
    '--- STORY OUTCOME',
    input.storyOutcome,
    '--- ACCEPTANCE CRITERIA',
    acs,
    '--- DELIVERED DIFF',
    '```diff',
    input.diff,
    '```',
  ].join('\n')
}

export interface DeliverJudgeOptions {
  config: EvalConfig
  input: DeliverJudgeInput
  /** The deterministic grader's overall pass. The judge is skipped when this is false. */
  deterministicPass: boolean
  log?: (message: string) => void
}

/** 3 votes via the pinned judge model; majority decides. Skipped unless the deterministic gate passed. */
export async function judgeDelivery(options: DeliverJudgeOptions): Promise<DeliverJudgeResult> {
  const { config, input, deterministicPass } = options
  const log = options.log ?? (() => {})
  if (!deterministicPass) {
    return { judged: false, reason: 'deterministic gate failed — quality judge skipped' }
  }
  const prompt = buildDeliverJudgePrompt(readRubric(DELIVER_QUALITY_RULE), input)
  const votes: JudgeVote[] = []
  for (let vote = 1; vote <= config.judgeVotes; vote += 1) {
    log(`judge ${DELIVER_QUALITY_RULE} — vote ${vote}/${config.judgeVotes}`)
    const result = await invokeClaude({
      bin: config.claudeBin,
      model: config.judgeModel,
      systemAppend: '',
      prompt,
      timeoutMs: config.timeoutMs,
    })
    votes.push(
      result.ok
        ? parseJudgeVote(result.stdout)
        : { verdict: 'fail', reasoning: `judge CLI failure: ${result.error ?? ''}`, parsed: false },
    )
  }
  return { judged: true, verdict: majorityVerdict(DELIVER_QUALITY_RULE, votes) }
}
