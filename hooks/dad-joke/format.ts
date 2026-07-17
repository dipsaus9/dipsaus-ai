/**
 * How a joke looks in the terminal. Pure: the colour decision arrives via `cfg`, resolved in
 * `loadConfig` — no env reads, no capability probing here.
 *
 * Two tiers:
 *   - Tier 1, always: an emoji marker + setup/punchline structure. Identical in a terminal
 *     with zero ANSI support.
 *   - Tier 2, on top: ANSI colour on the punchline, only when `cfg.colorEnabled`. Verified to
 *     render in Claude Code's systemMessage UI (DIP-1.1 render check) — not stripped, not
 *     literalised.
 *
 * With colour off the output is byte-identical to Tier 1: a stray `\x1b[0m` in a terminal
 * that does not interpret it is visible garbage on every joke.
 */

import type { Config } from './config'
import type { Joke } from './pick'

const MARKER = '🥁'

/** Bold yellow — the punchline is the punch. */
const PUNCH_ON = '\x1b[1;33m'
const PUNCH_OFF = '\x1b[0m'

/**
 * Render a joke as the systemMessage string. One-liners (empty punchline) stay on a single
 * line; there the whole text is the punch, so it takes the punchline styling.
 */
export function formatJoke(joke: Joke, cfg: Config): string {
  const punch = (text: string): string =>
    cfg.colorEnabled ? `${PUNCH_ON}${text}${PUNCH_OFF}` : text

  if (joke.punchline.length === 0) return `${MARKER} ${punch(joke.setup)}`

  return `${MARKER} ${joke.setup}\n${punch(joke.punchline)}`
}
