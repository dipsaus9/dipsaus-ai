/**
 * Env parsing. Pure: the environment is passed in, never read via `process.env` here.
 *
 * Every override degrades to its default rather than throwing. A hook must not be able to
 * break a tool call because someone typo'd an env var.
 */

export type Config = {
  thresholdMs: number
  cooldownMs: number
  disabled: boolean
  apiEnabled: boolean
  apiTimeoutMs: number
  colorEnabled: boolean
}

export const DEFAULT_THRESHOLD_MS = 30_000
export const DEFAULT_COOLDOWN_MS = 60_000
export const DEFAULT_API_TIMEOUT_MS = 800

export type Env = Record<string, string | undefined>

/**
 * Parse a non-negative millisecond override, falling back to `fallback` on anything
 * malformed: absent, blank, non-numeric, negative, NaN, or Infinity.
 */
function parseMs(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback

  const trimmed = raw.trim()
  // Number('') is 0, not NaN — so blank has to be rejected before we coerce.
  if (trimmed === '') return fallback

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback

  return Math.floor(parsed)
}

/**
 * An on/off env flag: true for any non-empty value except `'0'`.
 *
 * The `'0'` carve-out is deliberate: a user who sets `DAD_JOKE_DISABLE=0` means "no, don't
 * disable". Treating any non-empty string as truthy would hand them the exact opposite of
 * what they asked for.
 */
function parseFlag(raw: string | undefined): boolean {
  if (raw === undefined) return false

  const trimmed = raw.trim()
  return trimmed !== '' && trimmed !== '0'
}

/**
 * The no-color.org convention: ANY non-empty value disables colour — including `'0'`.
 *
 * Deliberately NOT `parseFlag`: `NO_COLOR=0` means "no colour" under the convention, the
 * opposite of what this repo's own flags would read. The cross-tool convention beats internal
 * consistency — users set NO_COLOR once, globally, and expect every tool to honour it.
 */
function parseNoColor(raw: string | undefined): boolean {
  return raw !== undefined && raw !== ''
}

export function loadConfig(env: Env): Config {
  return {
    thresholdMs: parseMs(env.DAD_JOKE_THRESHOLD_MS, DEFAULT_THRESHOLD_MS),
    cooldownMs: parseMs(env.DAD_JOKE_COOLDOWN_MS, DEFAULT_COOLDOWN_MS),
    disabled: parseFlag(env.DAD_JOKE_DISABLE),
    apiEnabled: parseFlag(env.DAD_JOKE_API),
    apiTimeoutMs: parseMs(env.DAD_JOKE_API_TIMEOUT_MS, DEFAULT_API_TIMEOUT_MS),
    colorEnabled: !parseNoColor(env.NO_COLOR) && !parseFlag(env.DAD_JOKE_NO_COLOR),
  }
}
