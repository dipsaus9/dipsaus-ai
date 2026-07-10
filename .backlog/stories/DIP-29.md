# [DIP-29] jokes.json pool + seeded picker with no repeat until pool exhausts

Type: deliverable
Status: ready

## Outcome
A bundled dad-joke pool and a deterministic picker that will not repeat a joke until the pool
is exhausted.

## Done-when
- `hooks/dad-joke/jokes.json` holds >= 40 dad jokes, each an object with `setup` and `punchline` string fields, valid JSON, no duplicate setups
- `pick.ts` exports `pickJoke(jokes, recentIds, rand)` returning a joke never present in `recentIds` unless every joke is in `recentIds` (pool exhausted), in which case it may repeat
- `pickJoke` takes its randomness as an injected `rand: () => number` argument and never calls `Math.random()` internally, so tests are deterministic
- `tests/unit/dad-joke-pick.test.ts` passes under `bun run test` and covers: no-repeat across a full pool cycle, exhaustion wraparound, and a single-joke pool

## Depends-on
- none

## Affected area
- `hooks/dad-joke/jokes.json`
- `hooks/dad-joke/pick.ts`
- `tests/unit/dad-joke-pick.test.ts`

## Verify
- `bun run test` (the new unit test file must be green)
- `bun run lint && bun run typecheck`
- `bun -e 'JSON.parse(await Bun.file("hooks/dad-joke/jokes.json").text())'` exits 0

## Technical notes
Shape:

```ts
export type Joke = { id: string; setup: string; punchline: string }
export function pickJoke(jokes: Joke[], recentIds: string[], rand: () => number): Joke
```

`rand` is injected so tests pass `() => 0` or a seeded sequence and assert an exact joke.
This is the same injection discipline DIP-30 uses for `now` and DIP-31 uses for the state dir:
push the nondeterminism to the caller, keep the core pure.

`recentIds` is a bounded list owned by the state file (DIP-31), not by the picker. The picker is
stateless — it is handed the history and returns a choice. When `recentIds` covers the whole
pool, reset semantics live in the *caller* (DIP-32), but `pickJoke` must still return a valid
joke rather than throwing or returning `undefined`.

Give each joke a stable `id` (a slug of the setup is fine) — `recentIds` persists across process
invocations, so an array index would silently break the moment a joke is inserted into the pool.

Keep the jokes genuinely dad-shaped: groan-inducing, pun-based, clean. Developer-flavoured ones
are welcome ("Why did the dev go broke? He used up all his cache.") but the pool should not be
exclusively about programming.

## Open questions
none
