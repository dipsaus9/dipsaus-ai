/**
 * Pure decision logic for the backlog-guard PreToolUse hook. Given a Bash command plus the minimal
 * repo context the entrypoint gathers, decide whether to allow the command or block it with a reason.
 *
 * Pure: no filesystem, no git, no process — every input is passed in, so every rule is unit-tested
 * without a real repo.
 *
 * The guard no longer polices the base branch: commit-on-base and push-base are allowed. What
 * remains are command-shape rules that need no git state — scoped staging, never `--no-verify`, and
 * no host CLI (gh/glab) while PRs are link-only.
 *
 * Fail-open: the entrypoint exits 0 on any error, and `decide` returns `allow` for anything it does
 * not explicitly forbid.
 */

export interface GuardInput {
  /** True when .claude/backlog-workflow.json exists in the repo — else the guard no-ops. */
  configPresent: boolean
  /** The Bash command string from the tool call. */
  command: string
  /** pr.mode from the workflow config; governs whether host CLIs are allowed. */
  prMode: 'link' | 'create'
}

export type GuardDecision =
  | { block: false }
  | { block: true; rule: string; reason: string }

const ALLOW: GuardDecision = { block: false }

function isGit(command: string): boolean {
  return /(^|\s|;|&&|\|)git(\s|$)/.test(command)
}

function usesHostCli(command: string): boolean {
  return /(^|\s|;|&&|\|)(gh|glab)(\s|$)/.test(command)
}

/** Decide allow vs block for one Bash command. See GuardInput for the context fields. */
export function decide(input: GuardInput): GuardDecision {
  // No workflow config → this repo is not under the flow workflow; never interfere.
  if (!input.configPresent) return ALLOW

  const { command, prMode } = input

  // Host CLIs (gh/glab) are blocked while PRs are link-only, whatever the git state.
  if (usesHostCli(command) && prMode === 'link') {
    const tool = /\bglab\b/.test(command) ? 'glab' : 'gh'
    return {
      block: true,
      rule: 'no-host-cli-in-link-mode',
      reason: `${tool} is blocked while pr.mode is "link". Set pr.mode="create" in .claude/backlog-workflow.json to allow it (rule: no-host-cli-in-link-mode).`,
    }
  }

  if (!isGit(command)) return ALLOW

  // Blanket staging — force scoped staging of the story's References only.
  if (/\bgit\s+add\s+(-A\b|--all\b|\.(\s|$))/.test(command)) {
    return {
      block: true,
      rule: 'scoped-staging',
      reason: `git add -A/./--all is blocked: stage only this story's declared References (rule: scoped-staging). No config key relaxes this.`,
    }
  }

  // --no-verify would skip the very hooks that keep every commit green.
  if (/--no-verify\b/.test(command)) {
    return {
      block: true,
      rule: 'never-no-verify',
      reason: `--no-verify is blocked: every commit must run the hooks (rule: never-no-verify). No config key relaxes this.`,
    }
  }

  return ALLOW
}
