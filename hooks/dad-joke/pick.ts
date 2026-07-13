/**
 * Joke selection. Pure: no clock, no env, no I/O, no Math.random.
 *
 * The picker is stateless — it is handed the history (`recentIds`, owned by the state
 * file) and returns a choice. Reset semantics live in the caller.
 */

export type Joke = { id: string; setup: string; punchline: string }

/**
 * Pick a joke that is not in `recentIds`, falling back to the whole pool once every
 * joke has been seen.
 *
 * `rand` is injected and must behave like `Math.random` (return `[0, 1)`). It is treated
 * as untrusted: an out-of-range value is clamped rather than indexing off the end.
 *
 * @throws if `jokes` is empty — there is no joke to return, and returning `undefined`
 * would push the empty check onto every caller. Callers are hook entrypoints that already
 * swallow errors to guarantee exit 0, so a throw is contained.
 */
export function pickJoke(jokes: Joke[], recentIds: string[], rand: () => number): Joke {
  if (jokes.length === 0) {
    throw new Error('pickJoke: joke pool is empty')
  }

  const recent = new Set(recentIds)
  const fresh = jokes.filter((joke) => !recent.has(joke.id))
  const pool = fresh.length > 0 ? fresh : jokes

  const index = Math.min(Math.max(Math.floor(rand() * pool.length), 0), pool.length - 1)

  const joke = pool[index]
  if (joke === undefined) {
    // Unreachable: pool is non-empty and index is clamped into range. Present because
    // noUncheckedIndexedAccess types this as Joke | undefined, and a hook must not crash.
    throw new Error('pickJoke: index out of range')
  }

  return joke
}
