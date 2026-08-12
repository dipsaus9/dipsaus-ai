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
import { mapPool } from './pool'

const RUNNER_DIR = path.dirname(fileURLToPath(import.meta.url))
export const FIXTURES_DIR = path.resolve(RUNNER_DIR, '../deliver/fixtures')
/** Repo root = the plugin dir; passed to the headless run via --plugin-dir so ${CLAUDE_PLUGIN_ROOT} resolves. */
export const PLUGIN_ROOT = path.resolve(RUNNER_DIR, '../../..')

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

  const base = 'main'
  copyTree(path.join(fx.dir, 'repo'), repoDir)
  execFileSync('git', ['init', '-q', '--bare', originDir])
  git(['init', '-q'], repoDir)
  git(['branch', '-M', 'main'], repoDir)

  // Initialise backlog + create the story as a ready task via the CLI (before the first commit, so
  // everything — repo, backlog, config — lands on main and a story-branch worktree inherits it).
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
  execFileSync(
    'backlog',
    ['task', 'edit', taskId, '-d', `${fx.story.outcome}\nType: deliverable\nBranch: ${expectedBranch}`],
    { cwd: repoDir, stdio: 'ignore' },
  )

  const dotClaude = path.join(repoDir, '.claude')
  mkdirSync(dotClaude, { recursive: true })
  execFileSync('cp', [path.join(fx.dir, 'backlog-workflow.json'), path.join(dotClaude, 'backlog-workflow.json')])

  // One commit with everything, then publish to the local bare remote.
  git(['add', '-A'], repoDir)
  execFileSync(
    'git',
    ['-c', 'user.email=eval@eval', '-c', 'user.name=eval', 'commit', '-q', '-m', 'fixture initial state + backlog'],
    { cwd: repoDir },
  )
  git(['remote', 'add', 'origin', originDir], repoDir)
  git(['push', '-q', '-u', 'origin', 'main'], repoDir)
  git(['symbolic-ref', 'HEAD', 'refs/heads/main'], originDir) // give origin a default branch

  return { root, repoDir, originDir, taskId, base, expectedBranch }
}

/**
 * The billed seam: run backlog-deliver headless against the sandbox. The plugin is loaded for the
 * session via `--plugin-dir PLUGIN_ROOT` (so `${CLAUDE_PLUGIN_ROOT}` resolves — DIP-10.1), rather
 * than installed into `~/.claude`. Broad tool allowance because delivery edits files, runs git /
 * verify / the backlog CLI (Bash), and spawns the story-reviewer subagent (Task).
 */
export async function deliverHeadless(sandbox: CaseSandbox, config: EvalConfig): Promise<void> {
  const result = await invokeClaude({
    bin: config.claudeBin,
    model: config.models[0] ?? 'claude-sonnet-5',
    systemAppend: '',
    prompt: `Use the backlog-deliver skill to deliver story ${sandbox.taskId} end to end in this repo. Follow the skill exactly: readiness gate, worktree, implement/verify/commit loop, review gate, push. Do not ask for confirmation.`,
    timeoutMs: config.applyTimeoutMs,
    cwd: sandbox.repoDir,
    extraArgs: [
      '--plugin-dir',
      PLUGIN_ROOT,
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'Read,Edit,Write,Glob,Grep,Bash,Task',
    ],
  })
  if (!result.ok) throw new Error(`headless deliver failed: ${result.error ?? result.stderr.slice(0, 200)}`)
}

/** Paths delivery is always allowed to touch beyond its References (git contract): its own task file. */
const SCOPE_EXEMPT = [/^backlog\//, /^\.claude\//, /^\.worktrees\//]

/**
 * Read the delivered outcome from the sandbox — deterministic, no model. Task state (checked ACs,
 * reviewer note) is read from the STORY BRANCH via `git show`, never the main checkout: a status
 * change committed on the branch is invisible on main (DIP-7.1). The diff excludes the story's own
 * task file and workflow scaffolding, which the git contract permits.
 */
export function captureRun(sandbox: CaseSandbox, exp: DeliverExpected): DeliverRunResult {
  const { repoDir, originDir, base, expectedBranch } = sandbox
  const branchRef = `origin/${expectedBranch}`
  const branchOnRemote = execFileSync('git', ['ls-remote', '--heads', originDir], { encoding: 'utf8' })
    .split('\n')
    .map((l) => l.split('refs/heads/')[1])
    .find((b) => b === expectedBranch)
  const branch = branchOnRemote ?? '(no matching branch pushed)'

  let modifiedFiles: string[] = []
  let checkedAcs: number[] = []
  if (branchOnRemote) {
    const allChanged = git(['diff', '--name-only', `origin/${base}...${branchRef}`], repoDir)
      .split('\n')
      .filter((f) => f.length > 0)
    modifiedFiles = allChanged.filter((f) => !SCOPE_EXEMPT.some((re) => re.test(f)))

    // Read the task file as it stands on the story branch (checked ACs live there, not on main).
    const taskFile = git(['ls-tree', '-r', '--name-only', branchRef, 'backlog/tasks/'], repoDir)
      .split('\n')
      .find((f) => f.length > 0)
    if (taskFile) {
      const taskMd = git(['show', `${branchRef}:${taskFile}`], repoDir)
      checkedAcs = [...taskMd.matchAll(/^- \[x\] #(\d+)/gm)].map((m) => Number(m[1]))
    }
  }

  // A pushed branch implies verify was green per commit (the deliver contract) and — when review is
  // enabled — that the review gate passed, since a blocking verdict stops the push (DIP-7.6).
  const verifyGreen = branchOnRemote !== undefined
  const reviewerVerdict = exp.reviewEnabled ? (branchOnRemote ? 'pass' : 'block') : null

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

/** Deliver one fixture end to end: setup → deliver → capture → grade → judge → teardown. */
async function runDeliverCase(
  fx: DeliverFixture,
  options: RunDeliverOptions,
): Promise<DeliverCaseRecord> {
  const log = options.log ?? (() => {})
  const deliver = options.deliver ?? deliverHeadless
  let sandbox: CaseSandbox | undefined
  try {
    log(`deliver ${fx.name} — setup`)
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
    return { fixture: fx.name, scorecard, judge }
  } catch (e) {
    return { fixture: fx.name, error: (e as Error).message }
  } finally {
    if (sandbox) teardownCase(sandbox)
  }
}

/**
 * Run the deliver corpus; one record per fixture. Cases are fully isolated (separate temp repos +
 * bare remotes), so they run concurrently through the shared pool at config.concurrency. A failed
 * case is captured as an error record and re-run via `--filter <case>` (its own retry path), the
 * same way the apply mode treats a stuck agentic run.
 */
export async function runDeliver(options: RunDeliverOptions): Promise<DeliverCaseRecord[]> {
  const fixtures = loadDeliverFixtures(options.filter)
  return mapPool(fixtures, options.config.concurrency, (fx) => runDeliverCase(fx, options))
}
