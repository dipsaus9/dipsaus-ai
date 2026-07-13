/**
 * Per-session state store. The only module here that touches the filesystem.
 *
 * Two properties it must have, because a PostToolUse hook runs on every tool call and must
 * never break one:
 *   - it cannot corrupt itself (atomic write), and
 *   - it cannot throw at its callers (reads and writes degrade, never raise).
 *
 * No clock: `turnStart: 0` is the "no turn recorded" sentinel, and the caller decides what
 * that means. That keeps this module testable without faking time.
 */

import { mkdirSync, renameSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

export type State = {
  turnStart: number
  lastJokeAt: number | null
  recentIds: string[]
}

export const DEFAULT_STATE: State = { turnStart: 0, lastJokeAt: null, recentIds: [] }

/**
 * Hard ceiling on persisted history, so a long-running session cannot grow the file without
 * bound even if a caller forgets to reset. This is a safety net, not the semantic cap — the
 * "pool exhausted, allow repeats" reset lives in the entrypoint that knows the pool size.
 */
export const MAX_RECENT_IDS = 500

/**
 * `sessionId` arrives from hook stdin, so it is untrusted input on its way into a filesystem
 * path. Whitelist the characters rather than blacklisting `..` — path blacklists get bypassed
 * (encoded separators, `....//`), whereas nothing outside `[A-Za-z0-9_-]` can traverse.
 */
function safeSessionId(sessionId: string): string {
  const cleaned = sessionId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 128)
  return cleaned.length > 0 ? cleaned : 'unknown-session'
}

function statePath(dir: string, sessionId: string): string {
  return join(dir, `${safeSessionId(sessionId)}.json`)
}

/** Narrow unknown parsed JSON to State, rejecting anything of the wrong shape. */
function parseState(raw: unknown): State | null {
  if (typeof raw !== 'object' || raw === null) return null

  const { turnStart, lastJokeAt, recentIds } = raw as Record<string, unknown>

  if (typeof turnStart !== 'number' || !Number.isFinite(turnStart)) return null
  if (lastJokeAt !== null && (typeof lastJokeAt !== 'number' || !Number.isFinite(lastJokeAt))) {
    return null
  }
  if (!Array.isArray(recentIds) || !recentIds.every((id) => typeof id === 'string')) return null

  return { turnStart, lastJokeAt, recentIds }
}

/**
 * Read this session's state, or `DEFAULT_STATE` if it is missing, empty, truncated, invalid
 * JSON, or structurally wrong. Never throws.
 */
export function readState(dir: string, sessionId: string): State {
  try {
    const parsed: unknown = JSON.parse(readFileSync(statePath(dir, sessionId), 'utf8'))
    return parseState(parsed) ?? DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

/**
 * Write this session's state atomically: write a temp file in the *same* directory, then
 * rename over the target. `rename` within one directory is atomic on POSIX; a temp file in
 * another directory could cross filesystems and silently lose that guarantee.
 *
 * This matters because a PostToolUse hook gets killed mid-flight when the user hits Esc, and a
 * truncated state file that threw on the next read would break every later tool call.
 *
 * Never throws — a hook may not fail a tool call because the disk was full.
 */
export function writeState(dir: string, sessionId: string, state: State): void {
  const target = statePath(dir, sessionId)
  const tmp = `${target}.${process.pid}.tmp`

  const bounded: State = {
    ...state,
    recentIds: state.recentIds.slice(-MAX_RECENT_IDS),
  }

  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(tmp, JSON.stringify(bounded), 'utf8')
    renameSync(tmp, target)
  } catch {
    // Best effort: don't leave the temp file behind, and never raise at the caller.
    try {
      unlinkSync(tmp)
    } catch {
      // Nothing left to do.
    }
  }
}
