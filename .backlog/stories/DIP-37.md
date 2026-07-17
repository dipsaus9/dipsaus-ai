# [DIP-37] styled inline joke: render check, stdout guard, two-tier formatter, docs

Type: deliverable
Status: ready

## Outcome
The joke reads as a joke, not as another log line — in any terminal. Structure and an emoji marker
always; colour on top only where it actually renders. The story is self-contained: it starts by
finding out what `systemMessage` can render, guards the fragile stdout glue before touching it,
and documents the result in the same PR.

This is the whole epic (task_008): the spike, the regression guard, and the README update were
folded in here, and the desktop notification was cut — it solves reach-when-away, not
visibility-while-watching, which is the problem actually observed.

## Done-when
- Render findings recorded in this doc's Findings section: does ANSI colour (CSI SGR, e.g. `\x1b[33m`) inside a `systemMessage` string render as colour, get stripped, or print literally as escape garbage? Do an emoji prefix and a multi-line body render correctly? Observed via a temporary manual hook; the user reports what they see. This decides whether Tier 2 exists
- `tests/unit/dad-joke-entrypoints.test.ts` lands as the **first commit**, before the formatter rewrite, and guards the raw stdout bytes: spawns `on-post-tool-use.ts` with a fake stdin payload and a seeded state file, asserting exit 0 and newline-terminated valid JSON with a `systemMessage` key — the trailing `\n` asserted **specifically**, since dropping it makes Claude Code silently ignore the payload
- The same test asserts `on-user-prompt-submit.ts` exits 0 and writes nothing to stdout, both entrypoints exit 0 on malformed stdin, and no `additionalContext` / `hookSpecificOutput` key is ever emitted; runs under `bun run test` with no network and the state dir injected via `CLAUDE_PLUGIN_DATA` pointed at a tmpdir
- `format.ts` exports `formatJoke(joke, cfg)` returning the rendered `systemMessage` string, pure: no env reads, no capability probing inside — capability comes in via `cfg`. Tier 1 (always): emoji marker + setup/punchline structure, identical in a terminal with zero ANSI support. Tier 2 (conditional): ANSI colour only when the render check proved it AND colour is enabled; colour-off output **byte-identical** to Tier 1
- `NO_COLOR` (any non-empty value, per no-color.org) disables Tier 2, as does `DAD_JOKE_NO_COLOR=1`; both parsed in `loadConfig`. If the render check kills colour, ship Tier 1 only, drop the colour behaviour, and record that here rather than shipping dead code
- A one-liner joke from the API (empty punchline) still renders on a single line, preserving DIP-34's behaviour; `tests/unit/dad-joke-format.test.ts` covers both tiers, `NO_COLOR`, and the one-liner case
- README's dad-joke env knob table documents the colour behaviour and knobs (`NO_COLOR`, `DAD_JOKE_NO_COLOR`), matches `loadConfig` exactly, and describes only what actually renders

## Depends-on
- none

## Affected area
- `hooks/dad-joke/format.ts` (new — takes over `formatJoke` from `source.ts`)
- `hooks/dad-joke/source.ts` (remove `formatJoke`; it moves)
- `hooks/dad-joke/config.ts` (parse `NO_COLOR` / `DAD_JOKE_NO_COLOR`)
- `hooks/dad-joke/on-post-tool-use.ts` (call the new formatter)
- `tests/unit/dad-joke-entrypoints.test.ts`
- `tests/unit/dad-joke-format.test.ts`
- `README.md`

## Branch
DIP-37/two-tier-joke-formatter

## Verify
- `bun run test` — entrypoint smoke test + format tests green
- `bun run lint && bun run typecheck`
- Deliberately break the guard to prove it works: drop the `\n` from `on-post-tool-use.ts`'s
  `writeSync` and confirm the entrypoint test **fails**. Restore it. A guard that cannot fail is
  not a guard
- By hand: register the hook with a low threshold, confirm the joke renders styled; set
  `NO_COLOR=1` and confirm it renders plain with **no** stray escape characters
- Read the README's dad-joke section against `loadConfig`: every knob documented exists, every
  knob that exists is documented

## Technical notes
**Order inside the story is part of the contract.** Commit 1 is the entrypoint guard; only then
touch the formatter. The glue already failed silently once (valid JSON, exit 0, joke never
appeared — a dropped trailing newline), and every existing unit test stayed green because they
test the pure modules, never the glue. Spawn the entrypoint as a subprocess (`bun <path>`), write
the payload to its stdin, and assert on the raw stdout **bytes**, not a parsed object — the
trailing newline is invisible to `JSON.parse`. Seed the state file directly (`turnStart` well in
the past, `lastJokeAt: null`) rather than sleeping.

**The render check comes before formatter code.** What DIP-28 already established, not to be
re-litigated: `systemMessage` renders to the human and never enters Claude's context; hook stdout
must be newline-terminated. The open question is only whether ANSI survives *inside the
`systemMessage` string*. Honest prior: Claude Code renders `systemMessage` in its own UI chrome,
so ANSI is more likely stripped or literalised than honoured — if it prints literally the user
sees `\x1b[33m` garbage, worse than plain text. Method that worked for DIP-28: temporary
`PostToolUse` hook in `.claude/settings.local.json` (git-ignored) with `DAD_JOKE_THRESHOLD_MS=0`,
emit a payload matrix (plain, emoji, multi-line, ANSI-coloured), run a turn, **ask the user what
they observed** — Claude cannot see their terminal. Remove the temp registration afterwards.

`formatJoke` currently lives in `source.ts` (DIP-34) and is one line: `setup\npunchline`, or just
`setup` when the punchline is empty. Move it to its own module and grow it there — `source.ts` is
about *where a joke comes from*, not how it looks. Purity matters as in DIP-30: the capability
decision (`is colour on?`) is resolved in `loadConfig` from the environment; `formatJoke` just
receives the answer, keeping it exhaustively testable with no env mocking.

`NO_COLOR` is a cross-tool convention (no-color.org): *any* non-empty value means "no colour",
including `NO_COLOR=0`. Deliberately **not** the same rule as this repo's own flags, where `'0'`
means off. Do not unify them — honouring the convention beats internal consistency.

Byte-identical output when colour is off is a real requirement: a stray `\x1b[0m` reset in a
terminal that does not interpret it is visible garbage on every joke.

## Open questions
none

## Findings
<!-- filled in during delivery: the render matrix, what the user observed, which tier shipped -->
