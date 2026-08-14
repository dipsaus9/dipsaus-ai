/**
 * Pure decision logic for the backlog-guard PreToolUse hook. Given a Bash command plus the repo
 * context the entrypoint gathers, decide whether to allow the command or block it with a reason.
 *
 * Pure: no filesystem, no git, no process — every input is passed in, so every rule is unit-tested
 * without a real repo. The frozen rule set is DIP-7.2's decision (skills/backlog-deliver/reference/
 * review-and-pr.md § 1). The discriminating condition that keeps the guard off the delivery skill's
 * own commands is branch identity: commit/push are blocked only on (or targeting) the base branch,
 * never on an `<id>/<slug>` story branch.
 *
 * Fail-open: the entrypoint exits 0 on any error, and `decide` returns `allow` for anything it does
 * not explicitly forbid. A guard that blocked on uncertainty would break the stories that fix it.
 */

export interface GuardInput {
  /** True when .claude/backlog-workflow.json exists in the repo — else the guard no-ops. */
  configPresent: boolean
  /** The Bash command string from the tool call. */
  command: string
  /** Current git branch. */
  branch: string
  /** The repo's base branch (remote default). */
  base: string
  /** pr.mode from the workflow config; governs whether host CLIs are allowed. */
  prMode: 'link' | 'create'
  /** True when HEAD has no commits yet — the empty-repo bootstrap may commit on base. */
  headUnborn: boolean
  /** True when the base branch already exists on the remote — a second base push is blocked. */
  remoteBranchExists: boolean
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

  const { command, branch, base, prMode, headUnborn, remoteBranchExists } = input

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

  // Commit on the base branch — the story must land on its own <id>/<slug> branch.
  // Exception: the empty-repo bootstrap — with an unborn HEAD there is no history to branch from,
  // so the first commit is allowed on base (backlog-init's bootstrap commit).
  if (/\bgit\s+commit\b/.test(command) && branch === base && !headUnborn) {
    return {
      block: true,
      rule: 'no-commit-on-base',
      reason: `Refusing to commit on the base branch "${base}" (rule: no-commit-on-base). Cut the story branch <id>/<slug> first. No config key relaxes this.`,
    }
  }

  // Push the base branch — only the story branch is ever pushed.
  // Exception: the empty-repo bootstrap first push, when the base branch does not yet exist on the
  // remote (backlog-init establishing the remote base). Every later base push still fires.
  if (
    /\bgit\s+push\b/.test(command) &&
    new RegExp(`\\b${base}\\b`).test(command) &&
    remoteBranchExists
  ) {
    return {
      block: true,
      rule: 'no-push-base',
      reason: `Refusing to push the base branch "${base}" (rule: no-push-base). Push the story branch <id>/<slug> only. No config key relaxes this.`,
    }
  }

  return ALLOW
}
