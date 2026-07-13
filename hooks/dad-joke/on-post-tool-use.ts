#!/usr/bin/env bun
/**
 * PostToolUse hook. Fires on every tool call; prints a joke only when the turn has run long
 * enough and the cooldown has elapsed.
 *
 * The entire body sits inside one try/catch that exits 0. This is the most important property
 * in the epic: this hook runs on EVERY tool call, so a throw here — or garbage on stdout —
 * would degrade the user's actual work over and over. A missing joke is worth nothing; a
 * broken session is worth a lot. Fail silent, always.
 *
 * Only `systemMessage` is emitted. `additionalContext` / `hookSpecificOutput` would feed the
 * text to Claude instead of the human, which is the wrong channel (proven in DIP-28).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { loadConfig, type Config } from './config'
import { stateDir } from './paths'
import { pickJoke, type Joke } from './pick'
import { readState, writeState } from './state'
import { shouldTellJoke } from './trigger'

type Deps = { rand: () => number }

/**
 * Today: read the bundled pool and pick from it. DIP-34 swaps in the opt-in live API behind
 * this same signature, so the call site below does not change.
 */
function getJoke(_cfg: Config, deps: Deps, recentIds: string[]): { joke: Joke; recentIds: string[] } {
  const path = fileURLToPath(new URL('./jokes.json', import.meta.url))
  const jokes = JSON.parse(readFileSync(path, 'utf8')) as Joke[]

  // Pool exhausted: allow repeats again. This reset lives here, not in pickJoke, because only
  // the caller knows the pool size.
  const history = recentIds.length >= jokes.length ? [] : recentIds

  return { joke: pickJoke(jokes, history, deps.rand), recentIds: history }
}

try {
  const payload: unknown = JSON.parse(readFileSync(0, 'utf8'))
  const sessionId = (payload as { session_id?: unknown }).session_id

  if (typeof sessionId === 'string' && sessionId.length > 0) {
    const now = Date.now() // the only clock read in the feature
    const dir = stateDir(process.env)
    const cfg = loadConfig(process.env)
    const state = readState(dir, sessionId)

    if (state.turnStart === 0) {
      // No turn recorded — the UserPromptSubmit hook never ran (fresh install, or state was
      // lost). Seed the turn and stay silent, otherwise `now - 0` is enormous and we would
      // fire a joke on the very first tool call of the session.
      writeState(dir, sessionId, { ...state, turnStart: now })
    } else if (shouldTellJoke(now, state, cfg)) {
      const { joke, recentIds } = getJoke(cfg, { rand: Math.random }, state.recentIds)

      // Print BEFORE persisting. If writeState fails the user still got their joke, and the
      // worst case is a duplicate next call. The inverse order risks starting a cooldown for
      // a joke nobody ever saw.
      process.stdout.write(JSON.stringify({ systemMessage: `${joke.setup}\n${joke.punchline}` }))

      writeState(dir, sessionId, {
        turnStart: state.turnStart,
        lastJokeAt: now,
        recentIds: [...recentIds, joke.id],
      })
    }
  }
} catch {
  // Fail silent. Never block, never fail, never garble a tool call.
}

process.exit(0)
