# [DIP-30] pure shouldTellJoke(now, state, cfg) + env config parsing

Type: deliverable
Status: ready

## Outcome
The trigger decision, as a pure function, plus the env parsing that feeds it. No clock reads,
no env reads, no I/O — so it is testable without mocking anything.

## Done-when
- `trigger.ts` exports `shouldTellJoke(now: number, state: {turnStart, lastJokeAt}, cfg: {thresholdMs, cooldownMs, disabled}): boolean` and reads no clock and no env internally
- Returns false when `cfg.disabled`, false when `now - state.turnStart < thresholdMs`, false when `state.lastJokeAt` is set and `now - state.lastJokeAt < cooldownMs`, true otherwise
- `config.ts` exports `loadConfig(env)` parsing `DAD_JOKE_THRESHOLD_MS` (default 30000), `DAD_JOKE_COOLDOWN_MS` (default 60000), `DAD_JOKE_DISABLE` (any non-empty value except `'0'` disables)
- `loadConfig` falls back to the default for a non-numeric, negative, or NaN override rather than throwing
- `tests/unit/dad-joke-trigger.test.ts` passes under `bun run test` and covers each false branch, the true branch, both threshold and cooldown boundaries at exactly `==`, and malformed env values

## Depends-on
- none

## Affected area
- `hooks/dad-joke/trigger.ts`
- `hooks/dad-joke/config.ts`
- `tests/unit/dad-joke-trigger.test.ts`

## Verify
- `bun run test`
- `bun run lint && bun run typecheck`

## Technical notes
The trigger semantics, decided during planning: **first joke once the turn passes the threshold,
then at most one joke per cooldown for the remainder of the turn.**

```
turn start ...30s... [JOKE] ...60s... [JOKE] ...60s... [JOKE]
```

So a 5-minute turn yields roughly 5 jokes, not 50.

```ts
export function shouldTellJoke(now: number, state: State, cfg: Config): boolean {
  if (cfg.disabled) return false
  if (now - state.turnStart < cfg.thresholdMs) return false
  if (state.lastJokeAt !== null && now - state.lastJokeAt < cfg.cooldownMs) return false
  return true
}
```

`now` is a parameter, not `Date.now()`. That is the whole reason this story is separate from
DIP-32: the decision logic gets exhaustive unit tests, and the glue that calls `Date.now()` stays
thin enough not to need them.

Boundary conventions to pin in tests — `<` not `<=`, so at *exactly* `thresholdMs` elapsed the
joke fires, and at exactly `cooldownMs` since the last joke it fires again. Off-by-one here is
the single most likely bug in this story.

`loadConfig(env)` takes the environment as an argument (`process.env` is passed in by the
entrypoint) for the same reason. `DAD_JOKE_DISABLE=0` must **not** disable — otherwise a user
setting it to `0` to mean "off, don't disable" gets the opposite of what they asked for.

## Open questions
none
