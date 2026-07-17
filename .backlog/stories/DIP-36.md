# [DIP-36] entrypoint smoke test: exit 0 + newline-terminated valid JSON on stdout

Type: deliverable
Status: ready

## Outcome
An automated guard on the exact bytes the hook writes to stdout, so the failure that already
happened once — valid JSON, exit 0, and the joke silently never appears — fails CI instead of
shipping.

## Done-when
- `tests/unit/dad-joke-entrypoints.test.ts` spawns `on-post-tool-use.ts` with a fake stdin payload and a state file whose `turnStart` is past the threshold, asserting exit code 0 and that stdout is newline-terminated valid JSON with a `systemMessage` key
- The test asserts stdout ends with a trailing newline **specifically** — a dropped `\n` makes Claude Code silently ignore the payload (no error, exit 0, joke never appears), which is the failure this guard exists to catch
- The test asserts `on-user-prompt-submit.ts` exits 0 and writes NOTHING to stdout, and that both entrypoints exit 0 on malformed stdin
- The test asserts no `additionalContext` and no `hookSpecificOutput` key is ever emitted, so the joke text can never leak into Claude's context
- Runs under `bun run test` with no real network and no dependence on the user's real state dir (state dir injected via `CLAUDE_PLUGIN_DATA` pointed at a tmpdir)

## Depends-on
- none

## Affected area
- `tests/unit/dad-joke-entrypoints.test.ts`

## Branch
DIP-36/entrypoint-smoke-test

## Verify
- `bun run test` — the new file is green
- `bun run lint && bun run typecheck`
- Deliberately break it to prove the guard works: drop the `\n` from `on-post-tool-use.ts`'s
  `writeSync` and confirm the test **fails**. Restore it. A guard that cannot fail is not a guard.

## Technical notes
This is the regression guard `task_007` shipped without, and it is now urgent rather than nice to
have: DIP-37 and DIP-38 both rewrite the exact stdout bytes that failed silently before.

The failure mode, for whoever picks this up: `on-post-tool-use.ts` writes
`writeSync(1, JSON.stringify({...}) + '\n')`. Remove that trailing `\n` and Claude Code accepts the
payload, exits 0, logs nothing, warns nothing — and renders nothing. Every one of the 76 existing
unit tests still passes, because they all test the pure modules and never the glue. That is the
hole.

Spawn the entrypoint as a subprocess (`bun <path>`), write the payload to its stdin, and assert on
the raw stdout **bytes**, not on a parsed object — the trailing newline is invisible to
`JSON.parse`, so a test that only parses would pass against the broken version and prove nothing.

Point `CLAUDE_PLUGIN_DATA` at a `mkdtemp` directory so the test never touches the developer's real
`/tmp/dad-joke` state and cannot be perturbed by a concurrent Claude Code session.

To make the joke fire deterministically, seed the state file directly (`turnStart` well in the
past, `lastJokeAt: null`) rather than sleeping — the trigger is a pure function of `now`, so there
is nothing to wait for.

## Open questions
none
