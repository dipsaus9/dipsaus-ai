#!/usr/bin/env bun
/**
 * UserPromptSubmit hook. Stamps the start of a new turn. Prints nothing, ever.
 *
 * A new user prompt is a new turn, so `turnStart` is reset and `lastJokeAt` cleared — the
 * cooldown must not leak across turns, or the first long turn after a short one would start
 * already cooled-down.
 *
 * `recentIds` is deliberately carried FORWARD, not cleared: no-repeat is a session-level
 * promise, not a per-turn one. Clearing it here would make the same joke recur every turn and
 * render the pool-exhaustion reset dead code.
 *
 * The entire body is wrapped so that any failure exits 0 silently. A hook must never break the
 * user's turn.
 */
import { readFileSync } from 'node:fs'

import { readState, writeState } from './state'
import { stateDir } from './paths'

try {
  const payload: unknown = JSON.parse(readFileSync(0, 'utf8'))
  const sessionId = (payload as { session_id?: unknown }).session_id

  if (typeof sessionId === 'string' && sessionId.length > 0) {
    const dir = stateDir(process.env)
    const previous = readState(dir, sessionId)

    writeState(dir, sessionId, {
      turnStart: Date.now(),
      lastJokeAt: null,
      recentIds: previous.recentIds,
    })
  }
} catch {
  // Fail silent. A missing joke is worth nothing; a broken turn is worth a lot.
}

process.exit(0)
