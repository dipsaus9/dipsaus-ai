/**
 * Schema for `.claude/backlog-workflow.json` — the per-repo workflow config the flow-* suite
 * reads. This module is the single source of truth for what a valid config looks like; every
 * other reader (the CLI, the guard hook, the deliver skill) keys off the shape defined here.
 *
 * Pure: no filesystem, no process. `parseConfig` takes already-parsed JSON and returns a
 * discriminated result so callers decide how to report. Unknown keys are rejected (`.strict()`)
 * so a typo in a config key fails loudly instead of being silently ignored.
 */
import { z } from 'zod'

/** How a delivered story turns into a pull request. */
export const PrMode = z.enum(['link', 'create'])

export const WorkflowConfig = z
  .object({
    parallelism: z
      .object({
        /** How many stories may be in flight at once. */
        maxAgents: z.number().int().min(1),
      })
      .strict(),
    worktree: z
      .object({
        enabled: z.boolean(),
        /** Where per-story worktrees are created, relative to the repo root. */
        path: z.string().min(1),
        /** Install command run inside a fresh worktree; empty string = skip. */
        install: z.string(),
        /** Gitignored paths copied into a fresh worktree (never blanket). */
        includeGitignored: z.array(z.string()),
      })
      .strict(),
    /** Ordered verify commands; empty = degrade to the story's own Verify + self-review. */
    verify: z.array(z.string()),
    pr: z
      .object({
        mode: PrMode,
      })
      .strict(),
    review: z
      .object({
        enabled: z.boolean(),
        /** Agent model for the reviewer; empty = inherit the session default. */
        model: z.string(),
        /** Max review rounds before escalating to a human. */
        maxRounds: z.number().int().min(1),
      })
      .strict(),
    backlog: z
      .object({
        /** Backlog.md task directory (usually "backlog"). */
        dir: z.string().min(1),
        /** Task id prefix (e.g. "DIP"). */
        prefix: z.string().min(1),
      })
      .strict(),
  })
  .strict()

export type WorkflowConfig = z.infer<typeof WorkflowConfig>

/** One human-readable validation problem: `field.path: message`. */
export interface ConfigIssue {
  path: string
  message: string
}

export type ParseResult =
  | { ok: true; config: WorkflowConfig }
  | { ok: false; issues: ConfigIssue[] }

/**
 * Validate already-parsed JSON against the schema. Returns every issue (not just the first)
 * with a dotted field path, so `validate` can print field-level errors.
 */
export function parseConfig(input: unknown): ParseResult {
  const result = WorkflowConfig.safeParse(input)
  if (result.success) return { ok: true, config: result.data }
  const issues: ConfigIssue[] = []
  for (const issue of result.error.issues) {
    const base = issue.path.map(String)
    if (issue.code === 'unrecognized_keys') {
      // Surface each unknown key as its own field-level path (e.g. `pr.extra`), rather than a
      // single root-level "unrecognized key(s)" message.
      for (const key of issue.keys) {
        issues.push({ path: [...base, key].join('.'), message: `unknown key "${key}"` })
      }
      continue
    }
    issues.push({ path: base.length > 0 ? base.join('.') : '(root)', message: issue.message })
  }
  return { ok: false, issues }
}
