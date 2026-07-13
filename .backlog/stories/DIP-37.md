# [DIP-37] two-tier joke formatter: emoji + structure always, ANSI colour when supported, NO_COLOR honoured

Type: deliverable
Status: ready

## Outcome
The joke reads as a joke, not as another log line — in any terminal. Structure and an emoji marker
always; colour on top only where it actually renders.

## Done-when
- `format.ts` exports `formatJoke(joke, cfg)` returning the rendered `systemMessage` string, and is pure: no env reads, no terminal capability probing inside — the capability comes in via `cfg`
- Tier 1 (always): the joke is visually distinct from a log line via an emoji marker and setup/punchline structure, and renders identically in a terminal with zero ANSI support
- Tier 2 (conditional): ANSI colour is applied only when DIP-35 proved it renders AND colour is enabled; when disabled the output is **byte-identical** to Tier 1 (no stray escape codes)
- `NO_COLOR` (any non-empty value, per no-color.org) disables Tier 2, as does `DAD_JOKE_NO_COLOR=1`; `loadConfig` parses both
- A one-liner joke from the API (empty punchline) still renders on a single line, preserving DIP-34's behaviour, and `tests/unit/dad-joke-format.test.ts` covers both tiers, `NO_COLOR`, and the one-liner case

## Depends-on
- DIP-35 (whether ANSI survives at all decides whether Tier 2 exists)
- DIP-36 (the guard on the stdout bytes this story rewrites)

## Affected area
- `hooks/dad-joke/format.ts` (new — takes over `formatJoke` from `source.ts`)
- `hooks/dad-joke/source.ts` (remove `formatJoke`; it moves)
- `hooks/dad-joke/config.ts` (parse `NO_COLOR` / `DAD_JOKE_NO_COLOR`)
- `hooks/dad-joke/on-post-tool-use.ts` (call the new formatter)
- `tests/unit/dad-joke-format.test.ts`

## Verify
- `bun run test` (new format tests + DIP-36's smoke test still green)
- `bun run lint && bun run typecheck`
- By hand: register the hook with a low threshold, confirm the joke renders styled; set
  `NO_COLOR=1` and confirm it renders plain with **no** stray escape characters

## Technical notes
`formatJoke` currently lives in `source.ts` (DIP-34) and is one line: `setup\npunchline`, or just
`setup` when the punchline is empty (the API returns one-liners). Move it to its own module and
grow it there — `source.ts` is about *where a joke comes from*, not how it looks.

Purity matters for the same reason it did in DIP-30: the capability decision (`is colour on?`) is
resolved in `loadConfig` from the environment, and `formatJoke` just receives the answer. That keeps
it exhaustively testable with no env mocking.

**If DIP-35 finds ANSI does not survive**, Tier 2 does not exist: implement Tier 1 only, delete the
colour done-when, and say so in the story doc rather than shipping dead code behind a flag that can
never do anything.

`NO_COLOR` is a cross-tool convention (no-color.org): *any* non-empty value means "no colour",
including `NO_COLOR=0`. That is deliberately **not** the same rule as this repo's own flags, where
`'0'` means off. Do not unify them — a user who sets `NO_COLOR=0` per the convention expects colour
suppressed, and honouring the convention beats internal consistency here.

Byte-identical output when colour is off is a real requirement, not a nicety: a stray `\x1b[0m`
reset in a terminal that does not interpret it is visible garbage in the user's face on every joke.

## Open questions
none
