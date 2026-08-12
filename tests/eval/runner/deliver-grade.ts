/**
 * Deterministic grader for a headless backlog-deliver run (DIP-10.3). Scores a completed run
 * against its fixture's expected outcome across five machine-checkable dimensions; the LLM quality
 * judge (DIP-10.4) covers what no rule can decide.
 *
 * Pure: takes the captured run result + the fixture's expected outcome and returns a scorecard.
 * The scope dimension reuses the segment-based prefix rule from src/workflow/collisions.ts — the
 * same rule the delivery gate uses — rather than a second definition.
 */
import { pathsCollide } from '../../../src/workflow/collisions'

/** Expected outcome of delivering a fixture story, from the case's `expected.json`. */
export interface DeliverExpected {
  /** The branch delivery must produce: `<id>/<slug>`. */
  branch: string
  /** 1-based acceptance-criterion indices that should end up checked off. */
  acs: number[]
  /** The story's declared References (paths the diff is allowed to touch). */
  references: string[]
  /** Whether the review gate was enabled for this fixture. */
  reviewEnabled: boolean
}

/** What the harness captures from a completed deliver run. */
export interface DeliverRunResult {
  /** The branch actually produced. */
  branch: string
  /** Did the resolved verify pass on the final commit. */
  verifyGreen: boolean
  /** 1-based AC indices actually checked off. */
  checkedAcs: number[]
  /** Files changed on the branch (git diff <base>...HEAD name-only). */
  modifiedFiles: string[]
  /** Reviewer verdict, or null when the gate was disabled. */
  reviewerVerdict: 'pass' | 'block' | null
}

export interface DimResult {
  pass: boolean
  detail: string
}

export interface Scorecard {
  branch: DimResult
  verify: DimResult
  acs: DimResult
  scope: DimResult
  review: DimResult
  /** True only when every graded dimension passes. */
  pass: boolean
}

/** A modified file is in scope when some declared Reference covers it (segment-prefix rule). */
export function fileInScope(file: string, references: readonly string[]): boolean {
  return references.some((ref) => pathsCollide(ref, file))
}

/** Files changed outside every declared Reference — scope violations. */
export function scopeViolations(
  modifiedFiles: readonly string[],
  references: readonly string[],
): string[] {
  return modifiedFiles.filter((f) => !fileInScope(f, references))
}

function gradeBranch(run: DeliverRunResult, exp: DeliverExpected): DimResult {
  const pass = run.branch === exp.branch
  return { pass, detail: pass ? run.branch : `expected ${exp.branch}, got ${run.branch}` }
}

function gradeVerify(run: DeliverRunResult): DimResult {
  return { pass: run.verifyGreen, detail: run.verifyGreen ? 'verify green' : 'verify not green' }
}

function gradeAcs(run: DeliverRunResult, exp: DeliverExpected): DimResult {
  const checked = new Set(run.checkedAcs)
  const missing = exp.acs.filter((n) => !checked.has(n))
  return {
    pass: missing.length === 0,
    detail: missing.length === 0 ? `all ${exp.acs.length} ACs checked` : `unchecked: ${missing.join(', ')}`,
  }
}

function gradeScope(run: DeliverRunResult, exp: DeliverExpected): DimResult {
  const violations = scopeViolations(run.modifiedFiles, exp.references)
  return {
    pass: violations.length === 0,
    detail: violations.length === 0 ? 'in scope' : `outside References: ${violations.join(', ')}`,
  }
}

function gradeReview(run: DeliverRunResult, exp: DeliverExpected): DimResult {
  // Review disabled for this fixture → the dimension is not applicable and passes.
  if (!exp.reviewEnabled) return { pass: true, detail: 'review disabled (n/a)' }
  const pass = run.reviewerVerdict === 'pass'
  return { pass, detail: `reviewer: ${run.reviewerVerdict ?? 'none'}` }
}

/** Grade a completed deliver run against its fixture's expected outcome. */
export function gradeDeliverRun(run: DeliverRunResult, exp: DeliverExpected): Scorecard {
  const branch = gradeBranch(run, exp)
  const verify = gradeVerify(run)
  const acs = gradeAcs(run, exp)
  const scope = gradeScope(run, exp)
  const review = gradeReview(run, exp)
  return {
    branch,
    verify,
    acs,
    scope,
    review,
    pass: branch.pass && verify.pass && acs.pass && scope.pass && review.pass,
  }
}
