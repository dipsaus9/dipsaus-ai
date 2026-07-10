# [DIP-31] per-session state store: atomic write, tolerant of missing/corrupt file

Type: deliverable
Status: ready

## Outcome
A tiny per-session state store the two hooks share, which cannot corrupt itself and cannot
throw at its callers.

## Done-when
- `state.ts` exports `readState(dir, sessionId)` and `writeState(dir, sessionId, state)`, keyed per session so concurrent Claude Code sessions never share or clobber state
- `readState` returns a usable default state (not a throw) when the file is missing, empty, truncated, or invalid JSON
- `writeState` is atomic: writes to a temp file in the same directory then renames, so a killed process can never leave a half-written state file
- The state directory is passed in as an argument (never hardcoded), so tests point it at a tmpdir
- `tests/unit/dad-joke-state.test.ts` passes under `bun run test` and covers: missing file, corrupt JSON, round-trip write-then-read, and two session ids not colliding

## Depends-on
- none

## Affected area
- `hooks/dad-joke/state.ts`
- `tests/unit/dad-joke-state.test.ts`

## Verify
- `bun run test`
- `bun run lint && bun run typecheck`

## Technical notes
```ts
export type State = { turnStart: number; lastJokeAt: number | null; recentIds: string[] }
export function readState(dir: string, sessionId: string): State
export function writeState(dir: string, sessionId: string, state: State): void
```

**Per-session keying is not optional.** Two Claude Code sessions run concurrently all the time.
A single shared state file means session A's tool call resets session B's turn clock, and jokes
fire at nonsense times. File path: `<dir>/<sessionId>.json`, with `sessionId` sanitised against
path traversal before it touches the filesystem — it arrives from hook stdin, so treat it as
untrusted input, not as a known-good identifier.

**Atomic write** = `write(tmp)` then `rename(tmp, final)`. `rename` within a single directory is
atomic on POSIX. The temp file must live in the *same directory* as the target, otherwise the
rename can cross filesystems and stop being atomic. This matters because `PostToolUse` hooks get
killed mid-flight when a user hits Esc, and a truncated JSON file that throws on next read would
break every subsequent tool call in that session.

`readState` returning a default rather than throwing is what lets DIP-32 stay simple. Default:
`{ turnStart: now_supplied_by_caller, lastJokeAt: null, recentIds: [] }` — but note `readState`
has no clock either, so the caller supplies the fallback `turnStart`, or the default is `0` and
the caller treats `turnStart === 0` as "no turn recorded". Pick one and be consistent; the second
option keeps `readState` fully pure and is the recommended path.

Bound `recentIds` — cap it at the pool size so the file cannot grow without limit across a long
session. When it reaches the cap, DIP-32 resets it to `[]` (pool exhausted, repeats allowed).

State dir for real use: prefer `${CLAUDE_PLUGIN_DATA}` when set, else `os.tmpdir()/dad-joke/`.
The entrypoint resolves it; `state.ts` just takes the resolved `dir`.

## Open questions
none
