/**
 * Deliver eval mode (DIP-10.5). Ties the fixture corpus (DIP-10.2), the deterministic grader
 * (DIP-10.3) and the quality judge (DIP-10.4) into one pipeline:
 *
 *   load fixture → setup throwaway repo + local bare remote + backlog + task + config
 *              → run backlog-deliver headless (the one billed seam) → capture the result
 *              → grade deterministically → judge quality (gated) → teardown → record
 *
 * The setup/capture/grade/teardown path is deterministic and exercised without a model. The single
 * billed seam is `deliverHeadless` (needs the plugin installed in the eval env — see
 * ../deliver/reference/harness.md); the first real run over the corpus is DIP-10.6.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { invokeClaude } from './claude'
import type { EvalConfig } from './config'
import { gradeDeliverRun, type DeliverExpected, type DeliverRunResult, type Scorecard } from './deliver-grade'
import { judgeDelivery, type DeliverJudgeResult } from './deliver-judge'

export const FIXTURES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../deliver/fixtures',
)

export interface StorySpec {
  title: string
  type: string
  outcome: string
  acs: string[]
  references: string[]
  branchSlug: string
}

export interface DeliverFixture {
  name: string
  dir: string
  story: StorySpec
  /** expected.json without the runtime id (branchSlug, acs, references, reviewEnabled). */
  expected: Omit<DeliverExpected, 'branch'> & { branchSlug: string }
  workflow: unknown
}

const readJson = (p: string): unknown => JSON.parse(readFileSync(p, 'utf8'))
const git = (args: string[], cwd: string): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

/** Load the fixture corpus, optionally filtered by a substring of the case name. */
export function loadDeliverFixtures(filter?: string): DeliverFixture[] {
  return readdirSync(FIXTURES_DIR)
    .filter((name) => statSync(path.join(FIXTURES_DIR, name)).isDirectory())
    .filter((name) => !filter || name.includes(filter))
    .map((name) => {
      const dir = path.join(FIXTURES_DIR, name)
      return {
        name,
        dir,
        story: readJson(path.join(dir, 'story.json')) as StorySpec,
        expected: readJson(path.join(dir, 'expected.json')) as DeliverFixture['expected'],
        workflow: readJson(path.join(dir, 'backlog-workflow.json')),
      }
    })
}

export interface CaseSandbox {
  root: string
  repoDir: string
  originDir: string
  taskId: string
  base: string
  expectedBranch: string
}

/** Copy a directory tree (fixture repo/) into the sandbox. */
function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const s = path.join(src, entry)
    const d = path.join(dest, entry)
    if (statSync(s).isDirectory()) copyTree(s, d)
    else execFileSync('cp', [s, d])
  }
}

/**
 * Materialize a fixture into a throwaway git repo with a local bare remote, an initialised backlog,
 * the story as a ready task, and the workflow config. Deterministic — no model involved.
 */
export function setupCase(fx: DeliverFixture, tmpRoot?: string): CaseSandbox {
  const root = mkdtempSync(path.join(tmpRoot ?? os.tmpdir(), 'deliver-eval-'))
  const repoDir = path.join(root, 'work')
  const originDir = path.join(root, 'origin.git')

  copyTree(path.join(fx.dir, 'repo'), repoDir)
  execFileSync('git', ['init', '-q', '--bare', originDir])
  git(['init', '-q'], repoDir)
  git(['add', '-A'], repoDir)
  execFileSync(
    'git',
    ['-c', 'user.email=eval@eval', '-c', 'user.name=eval', 'commit', '-q', '-m', 'fixture initial state'],
    { cwd: repoDir },
  )
  git(['branch', '-M', 'main'], repoDir)
  git(['remote', 'add', 'origin', originDir], repoDir)
  git(['push', '-q', '-u', 'origin', 'main'], repoDir)
  const base = 'main'
  git(['symbolic-ref', 'HEAD', 'refs/heads/main'], originDir) // give origin a default branch

  // Initialise backlog + create the story as a ready task via the CLI.
  const prefix = (fx.workflow as { backlog?: { prefix?: string } }).backlog?.prefix ?? 'EVAL'
  execFileSync(
    'backlog',
    ['init', fx.name, '--defaults', '--integration-mode', 'cli', '--agent-instructions', 'none',
      '--backlog-dir', 'backlog', '--config-location', 'folder', '--task-prefix', prefix],
    { cwd: repoDir, stdio: 'ignore' },
  )
  const createOut = execFileSync(
    'backlog',
    ['task', 'create', fx.story.title, '--type', fx.story.type,
      '-d', `${fx.story.outcome}\nType: deliverable\nBranch: <id>/${fx.story.branchSlug}`,
      ...fx.story.acs.flatMap((a) => ['--ac', a]),
      ...fx.story.references.flatMap((r) => ['--ref', r]),
      '-l', 'story', '--plain'],
    { cwd: repoDir, encoding: 'utf8' },
  )
  const taskId = createOut.match(new RegExp(`\\b${prefix}-\\d+(?:\\.\\d+)?\\b`))?.[0] ?? ''
  const expectedBranch = `${taskId}/${fx.story.branchSlug}`
  // Finalize the Branch line now that the id exists.
  execFileSync(
    'backlog',
    ['task', 'edit', taskId, '-d', `${fx.story.outcome}\nType: deliverable\nBranch: ${expectedBranch}`],
    { cwd: repoDir, stdio: 'ignore' },
  )

  const dotClaude = path.join(repoDir, '.claude')
  mkdirSync(dotClaude, { recursive: true })
  execFileSync('cp', [path.join(fx.dir, 'backlog-workflow.json'), path.join(dotClaude, 'backlog-workflow.json')])

  return { root, repoDir, originDir, taskId, base, expectedBranch }
}

/** The billed seam: run backlog-deliver headless against the sandbox. Requires the plugin installed. */
export async function deliverHeadless(sandbox: CaseSandbox, config: EvalConfig): Promise<void> {
  await invokeClaude({
    bin: config.claudeBin,
    model: config.models[0] ?? 'claude-sonnet-5',
    systemAppend: '',
    prompt: `Use the backlog-deliver skill to deliver story ${sandbox.taskId} end to end in this repo (${sandbox.repoDir}). Follow the skill exactly: readiness gate, worktree, implement/verify/commit loop, review gate, push. Do not ask for confirmation.`,
    timeoutMs: config.applyTimeoutMs,
  })
}

/** Read the delivered outcome from the sandbox — deterministic, no model. */
export function captureRun(sandbox: CaseSandbox, exp: DeliverExpected): DeliverRunResult {
  const { repoDir, originDir, base, expectedBranch, taskId } = sandbox
  const branchOnRemote = execFileSync('git', ['ls-remote', '--heads', originDir], { encoding: 'utf8' })
    .split('\n')
    .map((l) => l.split('refs/heads/')[1])
    .find((b) => b === expectedBranch)
  const branch = branchOnRemote ?? '(no matching branch pushed)'

  let modifiedFiles: string[] = []
  let verifyGreen = false
  if (branchOnRemote) {
    modifiedFiles = git(['diff', '--name-only', `origin/${base}...origin/${expectedBranch}`], repoDir)
      .split('\n')
      .filter((f) => f.length > 0)
    verifyGreen = true // verify ran green per commit is the deliver contract; a pushed branch implies it
  }

  const taskOut = execFileSync('backlog', ['task', taskId, '--plain'], { cwd: repoDir, encoding: 'utf8' })
  const checkedAcs = [...taskOut.matchAll(/^- \[x\] #(\d+)/gm)].map((m) => Number(m[1]))
  const reviewerVerdict = exp.reviewEnabled
    ? /reviewer:\s*pass|verdict.*pass/i.test(taskOut)
      ? 'pass'
      : 'block'
    : null

  return { branch, verifyGreen, checkedAcs, modifiedFiles, reviewerVerdict }
}

export function teardownCase(sandbox: CaseSandbox): void {
  rmSync(sandbox.root, { recursive: true, force: true })
}

export interface DeliverCaseRecord {
  fixture: string
  scorecard?: Scorecard
  judge?: DeliverJudgeResult
  error?: string
}

/** Full expected outcome for grading, with the branch resolved from the sandbox's assigned id. */
function resolveExpected(fx: DeliverFixture, sandbox: CaseSandbox): DeliverExpected {
  return {
    branch: sandbox.expectedBranch,
    acs: fx.expected.acs,
    references: fx.expected.references,
    reviewEnabled: fx.expected.reviewEnabled,
  }
}

export interface RunDeliverOptions {
  config: EvalConfig
  filter?: string
  log?: (message: string) => void
  /** Injected for tests: skip the billed model call and capture from the sandbox as-is. */
  deliver?: (sandbox: CaseSandbox, config: EvalConfig) => Promise<void>
}

/** Per-fixture baseline entry: the deterministic outcome plus the quality verdict. */
export interface DeliverBaselineEntry {
  deterministicPass: boolean
  /** 'pass' | 'fail' from the judge, or 'skipped' when the deterministic gate failed / errored. */
  quality: 'pass' | 'fail' | 'skipped'
}

export type DeliverBaseline = Record<string, DeliverBaselineEntry>

export interface DeliverBaselineDiff {
  /** Fixtures whose deterministic outcome went pass → fail. */
  regressions: string[]
  /** Fixtures whose deterministic outcome went fail → pass. */
  improvements: string[]
  /** Fixtures present in one baseline but not the other. */
  added: string[]
  removed: string[]
}

/** Reduce a run's records to a committable baseline. */
export function toDeliverBaseline(records: readonly DeliverCaseRecord[]): DeliverBaseline {
  const baseline: DeliverBaseline = {}
  for (const r of records) {
    const deterministicPass = r.scorecard?.pass ?? false
    const quality: DeliverBaselineEntry['quality'] =
      r.judge?.judged ? (r.judge.verdict.pass ? 'pass' : 'fail') : 'skipped'
    baseline[r.fixture] = { deterministicPass, quality }
  }
  return baseline
}

/** Diff a fresh baseline against the committed one; a deterministic pass→fail is a regression. */
export function diffDeliverBaseline(
  committed: DeliverBaseline,
  current: DeliverBaseline,
): DeliverBaselineDiff {
  const diff: DeliverBaselineDiff = { regressions: [], improvements: [], added: [], removed: [] }
  for (const [fixture, cur] of Object.entries(current)) {
    const old = committed[fixture]
    if (!old) diff.added.push(fixture)
    else if (old.deterministicPass && !cur.deterministicPass) diff.regressions.push(fixture)
    else if (!old.deterministicPass && cur.deterministicPass) diff.improvements.push(fixture)
  }
  for (const fixture of Object.keys(committed)) {
    if (!(fixture in current)) diff.removed.push(fixture)
  }
  return diff
}

/** The diff passes when nothing regressed. */
export function deliverDiffPasses(diff: DeliverBaselineDiff): boolean {
  return diff.regressions.length === 0
}

/** Run the deliver corpus; returns one record per fixture. */
export async function runDeliver(options: RunDeliverOptions): Promise<DeliverCaseRecord[]> {
  const log = options.log ?? (() => {})
  const deliver = options.deliver ?? deliverHeadless
  const fixtures = loadDeliverFixtures(options.filter)
  const records: DeliverCaseRecord[] = []
  for (const fx of fixtures) {
    log(`deliver ${fx.name} — setup`)
    let sandbox: CaseSandbox | undefined
    try {
      sandbox = setupCase(fx)
      await deliver(sandbox, options.config)
      const exp = resolveExpected(fx, sandbox)
      const run = captureRun(sandbox, exp)
      const scorecard = gradeDeliverRun(run, exp)
      const judge = await judgeDelivery({
        config: options.config,
        input: { storyOutcome: fx.story.outcome, acs: fx.story.acs, diff: run.modifiedFiles.join('\n') },
        deterministicPass: scorecard.pass,
        log,
      })
      records.push({ fixture: fx.name, scorecard, judge })
    } catch (e) {
      records.push({ fixture: fx.name, error: (e as Error).message })
    } finally {
      if (sandbox) teardownCase(sandbox)
    }
  }
  return records
}
