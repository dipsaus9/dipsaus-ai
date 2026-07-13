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
}

export const DEFAULT_THRESHOLD_MS = 30_000
export const DEFAULT_COOLDOWN_MS = 60_000

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
 * `DAD_JOKE_DISABLE` disables on any non-empty value except `'0'`.
 *
 * The `'0'` carve-out is deliberate: a user who sets `DAD_JOKE_DISABLE=0` means "no, don't
 * disable". Treating any non-empty string as truthy would hand them the exact opposite of
 * what they asked for.
 */
function parseDisabled(raw: string | undefined): boolean {
  if (raw === undefined) return false

  const trimmed = raw.trim()
  return trimmed !== '' && trimmed !== '0'
}

export function loadConfig(env: Env): Config {
  return {
    thresholdMs: parseMs(env.DAD_JOKE_THRESHOLD_MS, DEFAULT_THRESHOLD_MS),
    cooldownMs: parseMs(env.DAD_JOKE_COOLDOWN_MS, DEFAULT_COOLDOWN_MS),
    disabled: parseDisabled(env.DAD_JOKE_DISABLE),
  }
}
