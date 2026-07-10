# [DIP-32] two hook entrypoints wiring picker + trigger + state, always exit 0

Type: deliverable
Status: ready

## Outcome
The two executable hook scripts. Thin glue over DIP-29/30/31 that reads stdin, decides, and
prints a joke — and that can never, under any failure, break a tool call.

## Done-when
- `on-user-prompt-submit.ts` reads the hook JSON from stdin, takes `session_id`, and writes state `{turnStart: now, lastJokeAt: null, recentIds: []}` via DIP-31's `writeState`, printing nothing
- `on-post-tool-use.ts` reads stdin `session_id`, loads state + config, and when `shouldTellJoke()` is true prints exactly `{"systemMessage": "<setup>\n<punchline>"}` to stdout, then persists `lastJokeAt = now` and the joke id appended to `recentIds`
- When `shouldTellJoke()` is false the hook prints nothing at all to stdout
- Both entrypoints wrap their whole body so that ANY thrown error, malformed stdin, missing state dir, or unreadable `jokes.json` results in exit code 0 and no stdout: a broken hook must never block or fail a tool call
- Neither entrypoint emits `additionalContext` or `hookSpecificOutput`, so the joke text never enters Claude's context

## Depends-on
- DIP-28 (the mechanism must be proven before it is built on)
- DIP-29, DIP-30, DIP-31

## Affected area
- `hooks/dad-joke/on-user-prompt-submit.ts`
- `hooks/dad-joke/on-post-tool-use.ts`

## Verify
- `bun run lint && bun run typecheck && bun run test`
- Pipe a fake hook payload straight into each entrypoint and assert behaviour without Claude Code:
  - `echo '{"session_id":"t1"}' | bun hooks/dad-joke/on-user-prompt-submit.ts` → exit 0, no stdout
  - with a state file whose `turnStart` is 60s in the past:
    `echo '{"session_id":"t1"}' | bun hooks/dad-joke/on-post-tool-use.ts` → exit 0, stdout is one JSON object with a `systemMessage` key
  - `echo 'not json' | bun hooks/dad-joke/on-post-tool-use.ts` → exit 0, no stdout
  - `echo '{"session_id":"t1"}' | DAD_JOKE_DISABLE=1 bun hooks/dad-joke/on-post-tool-use.ts` → exit 0, no stdout

## Technical notes
The whole body of each entrypoint sits inside one `try { ... } catch { process.exit(0) }`. This
is the most important line in the epic. A `PostToolUse` hook that throws, or that writes garbage
to stdout, degrades or blocks the user's actual work — and it would do so on *every tool call*.
A missing joke is worth nothing; a broken session is worth a lot. Fail silent, always.

Wiring, `on-post-tool-use.ts`:

```
stdin -> {session_id}
now = Date.now()                       // the ONLY clock read
cfg = loadConfig(process.env)          // DIP-30
state = readState(dir, session_id)     // DIP-31
if (!shouldTellJoke(now, state, cfg)) exit 0 silently   // DIP-30
joke = await getJoke(cfg, deps)        // DIP-29 pool today; DIP-34 swaps in the API path
print JSON.stringify({ systemMessage: `${joke.setup}\n${joke.punchline}` })
writeState(dir, session_id, { ...state, lastJokeAt: now, recentIds: [...state.recentIds, joke.id] })
```

Note the ordering: **print before you persist.** If `writeState` fails, the user still got their
joke; the worst case is a duplicate joke next tool call. The inverse ordering risks persisting
`lastJokeAt` and then dying before printing, which silently eats a joke and starts a cooldown for
a joke nobody saw.

`recentIds` reset lives here, not in `pickJoke`: when `recentIds.length >= jokes.length`, reset to
`[]` before picking. That is the "pool exhausted, repeats allowed" boundary from DIP-29.

`on-user-prompt-submit.ts` unconditionally resets `turnStart` and clears `lastJokeAt`. A new user
prompt is a new turn; the cooldown must not leak across turns, or the first long turn after a
short one starts already-cooled-down.

Until DIP-34 lands, `getJoke` is just "read `jokes.json`, call `pickJoke`". DIP-34 replaces the
body without changing this call site — which is why the entrypoint should call `getJoke(cfg, deps)`
from the start rather than reaching for `pickJoke` directly.

## Open questions
none
