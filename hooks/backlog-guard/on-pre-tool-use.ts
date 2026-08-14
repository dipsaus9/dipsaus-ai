#!/usr/bin/env bun
/**
 * PreToolUse hook. Enforces the flow git contract that prose can only ask for: no commit on the
 * base branch, no blanket staging, no base-branch push, no --no-verify, and no gh/glab while PRs
 * are link-only. The block/allow logic is the pure `decide` in ./decision.ts; this entrypoint only
 * gathers repo context and speaks the hook protocol.
 *
 * Two invariants, both load-bearing (see hooks/dad-joke/on-post-tool-use.ts for the same posture):
 * - **Fail-open.** Everything is wrapped in try/catch that exits 0. A guard that throws — or that
 *   blocked on uncertainty — would break every delivery, including the stories that fix it.
 * - **No-config no-op.** With no .claude/backlog-workflow.json in cwd, `decide` returns allow, so
 *   installing the plugin never interferes with a repo that is not under the flow workflow.
 *
 * Blocks via the PreToolUse deny channel: hookSpecificOutput.permissionDecision = "deny" with a
 * reason that names the rule and the config key (if any) that would relax it.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

import { decide } from './decision'

function gitOut(args: string[], cwd: string): string {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return ''
  }
}

try {
  const payload = JSON.parse(readFileSync(0, 'utf8')) as {
    tool_name?: string
    tool_input?: { command?: string }
    cwd?: string
  }

  // Only Bash carries git/host-CLI commands.
  if (payload.tool_name === 'Bash') {
    const cwd = payload.cwd ?? process.cwd()
    const command = payload.tool_input?.command ?? ''
    const configPresent = existsSync(`${cwd}/.claude/backlog-workflow.json`)

    let prMode: 'link' | 'create' = 'link'
    if (configPresent) {
      try {
        const cfg = JSON.parse(readFileSync(`${cwd}/.claude/backlog-workflow.json`, 'utf8')) as {
          pr?: { mode?: unknown }
        }
        if (cfg.pr?.mode === 'create') prMode = 'create'
      } catch {
        // Unreadable/invalid config → treat as link (most restrictive that still fails open on git).
      }
    }

    const branch = gitOut(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)
    const base =
      gitOut(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], cwd).replace(/^origin\//, '') ||
      'main'

    // Empty-repo bootstrap signals. Both fail toward the allow side: a git error yields '' →
    // headUnborn true / remoteBranchExists false, which only ever relaxes the base guard, never
    // tightens it, keeping the hook fail-open.
    const headUnborn = gitOut(['rev-parse', '--verify', 'HEAD'], cwd) === ''
    const remoteBranchExists = gitOut(['ls-remote', '--heads', 'origin', base], cwd) !== ''

    const decision = decide({
      configPresent,
      command,
      branch,
      base,
      prMode,
      headUnborn,
      remoteBranchExists,
    })
    if (decision.block) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: decision.reason,
          },
        }) + '\n',
      )
    }
  }
} catch {
  // Fail-open: never block real work because the guard itself errored.
}

process.exit(0)
