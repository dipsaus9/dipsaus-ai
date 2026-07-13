/**
 * The trigger decision. Pure: `now` is a parameter, never `Date.now()`.
 *
 * That is the whole point of keeping this separate from the entrypoint — the decision gets
 * exhaustive unit tests, and the glue that reads the clock stays thin enough not to need them.
 */

import type { Config } from './config'

/** The slice of persisted state the decision depends on. Owned by the state store. */
export type TriggerState = {
  turnStart: number
  lastJokeAt: number | null
}

/**
 * First joke once the turn passes `thresholdMs`, then at most one per `cooldownMs` for the
 * remainder of the turn:
 *
 *     turn start ...30s... [JOKE] ...60s... [JOKE] ...60s... [JOKE]
 *
 * So a 5-minute turn yields roughly 5 jokes, not 50.
 *
 * Boundaries are `<`, not `<=`: at *exactly* `thresholdMs` elapsed the joke fires, and at
 * exactly `cooldownMs` since the last one it fires again.
 */
export function shouldTellJoke(now: number, state: TriggerState, cfg: Config): boolean {
  if (cfg.disabled) return false
  if (now - state.turnStart < cfg.thresholdMs) return false
  if (state.lastJokeAt !== null && now - state.lastJokeAt < cfg.cooldownMs) return false
  return true
}
