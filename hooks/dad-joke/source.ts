/**
 * Where a joke comes from: the bundled pool by default, or an opt-in live fetch.
 *
 * This runs inside a hook that fires on EVERY tool call, which is why the API is opt-in and
 * hard-bounded. An unbounded fetch here would add latency to every single tool the user runs.
 *
 * Fallback is silent by design. Offline, behind a proxy, rate-limited — the user gets a
 * bundled joke and no error text. There is no failure mode here worth telling anyone about;
 * the feature is a joke.
 */

import type { Config } from './config'
import { pickJoke, type Joke } from './pick'

const API_URL = 'https://icanhazdadjoke.com/'

/** Their API terms ask for a descriptive User-Agent with a contact URL. Cheap courtesy. */
const USER_AGENT = 'dipsaus-ai (https://github.com/dipsaus9/dipsaus-ai)'

export type Deps = {
  fetch: typeof globalThis.fetch
  jokes: Joke[]
  rand: () => number
  recentIds?: string[]
}

/**
 * icanhazdadjoke returns `{ id, joke }` — a single string, not a setup/punchline pair. It is
 * normalised into `Joke` with an empty `punchline`; the printer skips the newline when the
 * punchline is empty, so one-liners render as one line.
 */
function parseApiJoke(raw: unknown): Joke | null {
  if (typeof raw !== 'object' || raw === null) return null

  const { id, joke } = raw as Record<string, unknown>
  if (typeof id !== 'string' || typeof joke !== 'string') return null

  const text = joke.trim()
  if (text.length === 0) return null

  return { id: `api-${id}`, setup: text, punchline: '' }
}

/**
 * Fetch one joke, bounded by `cfg.apiTimeoutMs`. Returns null on timeout, a non-2xx status, a
 * malformed body, or any thrown error — every one of which means "use the pool instead".
 */
async function fetchJoke(cfg: Config, deps: Deps): Promise<Joke | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), cfg.apiTimeoutMs)

  try {
    const response = await deps.fetch(API_URL, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      signal: controller.signal,
    })

    if (!response.ok) return null

    return parseApiJoke(await response.json())
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The single call site the entrypoint uses. With `apiEnabled` false this makes zero network
 * calls — `deps.fetch` is never even touched.
 */
export async function getJoke(cfg: Config, deps: Deps): Promise<Joke> {
  if (cfg.apiEnabled) {
    const fresh = await fetchJoke(cfg, deps)
    if (fresh !== null) return fresh
  }

  return pickJoke(deps.jokes, deps.recentIds ?? [], deps.rand)
}

/** Render a joke for the terminal. One-liners (empty punchline) stay on one line. */
export function formatJoke(joke: Joke): string {
  return joke.punchline.length > 0 ? `${joke.setup}\n${joke.punchline}` : joke.setup
}
