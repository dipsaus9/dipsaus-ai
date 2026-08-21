/**
 * Resolve the directory a Bash command's git invocation actually runs in.
 *
 * The guard entrypoint is handed `payload.cwd`, but a harness may pin that to the main checkout
 * while the command itself `cd`s into a git worktree first (`cd .worktrees/DIP-1.1 && git commit`).
 * Resolving the branch in `payload.cwd` would then read the base branch and wrongly block a commit
 * that lands on a story branch inside the worktree — the worktree lane backlog-run mandates.
 *
 * This replays the leading `cd` segments to compute the effective cwd, stopping at the git segment
 * (later `cd`s don't change where git ran). Pure: only string parsing plus node:path, no fs/process,
 * so it is unit-tested without a real repo. Unresolvable targets (env vars, globs, `~`, subshells,
 * `cd -`) are left as-is — the guard then falls back to the passed cwd, keeping it fail-open.
 */
import { isAbsolute, resolve } from 'node:path'

export function resolveGitCwd(command: string, baseCwd: string): string {
  let cwd = baseCwd
  for (const rawSeg of command.split(/&&|\|\||;/)) {
    const seg = rawSeg.trim()
    // The git command runs here — the cwd is settled; any `cd` after it is irrelevant.
    if (/^git\b/.test(seg)) break
    const m = seg.match(/^cd\s+(?:-[LP]\s+)*(.+)$/)
    if (!m?.[1]) continue
    let target = m[1].trim()
    const quoted = target.match(/^(['"])(.*)\1$/)
    if (quoted?.[2] !== undefined) target = quoted[2]
    // Statically unresolvable — env var, glob, home, subshell, or `cd -`. Leave cwd unchanged.
    if (target === '' || target === '-' || /[$*?~`()<>]/.test(target)) continue
    cwd = isAbsolute(target) ? target : resolve(cwd, target)
  }
  return cwd
}
