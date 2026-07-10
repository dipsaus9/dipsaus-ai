# [DIP-34] opt-in DAD_JOKE_API=1 live fetch with timeout and fallback to bundled pool

Type: deliverable
Status: ready

## Outcome
An opt-in live joke source, so the pool never gets stale for users who want fresh material —
without putting a network call in the default hot path.

## Done-when
- `source.ts` exports `getJoke(cfg, deps)` returning a joke from icanhazdadjoke.com only when `cfg.apiEnabled`, otherwise straight from the bundled pool with zero network access
- The fetch sends an `Accept: application/json` header and a `User-Agent` identifying this repo, per the icanhazdadjoke API terms
- The fetch is bounded by a timeout (default 800ms, override `DAD_JOKE_API_TIMEOUT_MS`) via `AbortController`, and any timeout, non-2xx status, or malformed body falls back silently to the bundled pool
- `fetch` is injected through `deps` (never imported globally) so `tests/unit/dad-joke-source.test.ts` covers success, timeout, non-2xx, and malformed-body fallback with no real network call

## Depends-on
- DIP-29 (the pool it falls back to)
- DIP-32 (the `getJoke(cfg, deps)` call site it slots into)

## Affected area
- `hooks/dad-joke/source.ts`
- `tests/unit/dad-joke-source.test.ts`

## Verify
- `bun run test` — all four paths (success, timeout, non-2xx, malformed) covered with an injected fake `fetch`
- `bun run lint && bun run typecheck`
- `bun run test` must make **no real network call**; the suite passes with networking disabled
- By hand: `DAD_JOKE_API=1` with the threshold lowered yields a joke not present in `jokes.json`

## Technical notes
This runs inside a hook that fires on **every tool call**, which is why the API is opt-in and
hard-bounded. An unbounded fetch here would add latency to every tool the user runs. The 800ms
default timeout is already generous for this position in the hot path.

```ts
type Deps = { fetch: typeof globalThis.fetch; jokes: Joke[]; rand: () => number }
export async function getJoke(cfg: Config, deps: Deps): Promise<Joke>
```

`cfg.apiEnabled` comes from `DAD_JOKE_API` parsed in DIP-30's `loadConfig` — extend it there
rather than reading `process.env` in this file.

Fallback must be **silent**. A user who is offline, or behind a proxy, or hitting a rate limit,
should get a bundled joke and no error text. There is no failure mode here worth telling anyone
about; the feature is a joke.

`icanhazdadjoke.com` returns `{ id, joke }` — one string, not a setup/punchline pair. Normalise
it into the `Joke` shape (`punchline: ''`, and have DIP-32's formatter skip the newline when
`punchline` is empty), or reshape the printed string. Decide when implementing; note the choice
in the PR.

Their API terms ask for a descriptive `User-Agent` with a contact URL. Use the repo URL:
`dipsaus-ai (https://github.com/dipsaus9/dipsaus-ai)`. This is a courtesy, and cheap.

Injecting `fetch` through `deps` keeps `bun run test` hermetic and CI-safe. The unit suite runs in
CI, and a test that hits a real third-party API is a test that fails on someone else's outage.

## Open questions
none
