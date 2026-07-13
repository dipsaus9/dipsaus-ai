/**
 * Where the two hooks agree to keep their state.
 *
 * This lives in one place on purpose: if the UserPromptSubmit hook and the PostToolUse hook
 * ever disagreed about the directory, one would write a turn stamp the other never reads, and
 * the feature would fail silently and permanently.
 */

import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { Env } from './config'

/**
 * `CLAUDE_PLUGIN_DATA` is the persistent per-plugin directory Claude Code provides. Fall back
 * to the OS temp dir, which is fine: losing state costs at most one mistimed joke.
 */
export function stateDir(env: Env): string {
  const provided = env.CLAUDE_PLUGIN_DATA?.trim()
  return provided ? join(provided, 'dad-joke') : join(tmpdir(), 'dad-joke')
}
