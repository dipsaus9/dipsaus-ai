---
id: DIP-1.1
title: 'styled inline joke: render check, stdout guard, two-tier formatter, docs'
status: To Do
assignee: []
created_date: '2026-07-17 13:17'
updated_date: '2026-07-17 13:33'
labels:
  - story
dependencies: []
references:
  - hooks/dad-joke/format.ts
  - hooks/dad-joke/source.ts
  - hooks/dad-joke/config.ts
  - hooks/dad-joke/on-post-tool-use.ts
  - tests/unit/dad-joke-entrypoints.test.ts
  - tests/unit/dad-joke-format.test.ts
  - README.md
parent_task_id: DIP-1
priority: medium
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The joke reads as a joke, not as another log line — in any terminal. Structure and an emoji marker always; colour on top only where it actually renders. Self-contained story: it starts by finding out what systemMessage can render, guards the fragile stdout glue before touching it, and documents the result in the same PR.

This is the whole epic: the render spike, the regression guard, and the README update are folded in here; the desktop notification was cut (reach-when-away, not visibility-while-watching).

Type: deliverable
Branch: DIP-1.1/two-tier-joke-formatter
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Render findings recorded in implementation notes: does ANSI colour (CSI SGR, e.g. \x1b[33m) inside a systemMessage string render as colour, get stripped, or print literally? Do an emoji prefix and a multi-line body render correctly? Observed via a temporary manual hook; the user reports what they see. Decides whether Tier 2 exists
- [ ] #2 tests/unit/dad-joke-entrypoints.test.ts lands as the FIRST commit, before the formatter rewrite, and guards the raw stdout bytes: exit 0 and newline-terminated valid JSON with a systemMessage key — the trailing newline asserted specifically, since dropping it makes Claude Code silently ignore the payload
- [ ] #3 The same test asserts on-user-prompt-submit.ts exits 0 and writes nothing to stdout, both entrypoints exit 0 on malformed stdin, and no additionalContext / hookSpecificOutput key is ever emitted; runs under bun run test with no network, state dir injected via CLAUDE_PLUGIN_DATA pointed at a tmpdir
- [ ] #4 format.ts exports pure formatJoke(joke, cfg) returning the rendered systemMessage string — no env reads, no capability probing inside. Tier 1 always: emoji marker + setup/punchline structure, identical in a terminal with zero ANSI support. Tier 2 conditional: ANSI colour only when the render check proved it AND colour is enabled; colour-off output byte-identical to Tier 1
- [ ] #5 NO_COLOR (any non-empty value, per no-color.org) disables Tier 2, as does DAD_JOKE_NO_COLOR=1; both parsed in loadConfig. If the render check kills colour: Tier 1 only, colour behaviour dropped and recorded in implementation notes rather than shipped as dead code
- [ ] #6 A one-liner joke from the API (empty punchline) still renders on a single line; tests/unit/dad-joke-format.test.ts covers both tiers, NO_COLOR, and the one-liner case
- [ ] #7 README dad-joke env knob table documents the colour behaviour and knobs (NO_COLOR, DAD_JOKE_NO_COLOR), matches loadConfig exactly, and describes only what actually renders
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Ordered — the order is part of the contract:
1. Render check FIRST (manual, before formatter code): temporary PostToolUse hook in .claude/settings.local.json (git-ignored) with DAD_JOKE_THRESHOLD_MS=0, emit a payload matrix (plain, emoji, multi-line, ANSI-coloured). Run a turn, ask the user what they observed — Claude cannot see their terminal. Record findings in implementation notes. Remove the temp registration afterwards. This decides whether Tier 2 (colour) exists.
2. Entrypoint guard as the FIRST commit: tests/unit/dad-joke-entrypoints.test.ts spawns on-post-tool-use.ts as a subprocess (bun <path>), writes a fake stdin payload, seeds the state file directly (turnStart well in the past, lastJokeAt: null — never sleep), asserts on raw stdout BYTES not a parsed object (the trailing newline is invisible to JSON.parse). Point CLAUDE_PLUGIN_DATA at a mkdtemp dir.
3. Formatter: move formatJoke out of source.ts into new format.ts and grow it there — source.ts is about where a joke comes from, not how it looks. Pure: capability decision (is colour on?) resolved in loadConfig, formatJoke just receives cfg. Exhaustively testable, no env mocking.
4. README last, in the same PR: document only what actually renders.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prior art, not to be re-litigated: systemMessage renders to the human and never enters Claude context; hook stdout MUST be newline-terminated or Claude Code silently ignores valid JSON (proven the hard way — valid JSON, exit 0, joke never appeared, every unit test stayed green because they all test pure modules, never the glue).

Honest prior on colour: Claude Code renders systemMessage in its own UI chrome, so ANSI is more likely stripped or literalised than honoured. If it prints literally the user sees \x1b[33m garbage — worse than plain text. If the render check kills colour, ship Tier 1 only and record that here; no dead code behind a flag that can never fire.

NO_COLOR is a cross-tool convention (no-color.org): ANY non-empty value means no colour, including NO_COLOR=0. Deliberately NOT the same rule as this repo's own flags where '0' means off. Do not unify them — the convention beats internal consistency.

Byte-identical output when colour is off is a real requirement: a stray \x1b[0m reset in a terminal that does not interpret it is visible garbage on every joke.

Verify (beyond bun run lint/typecheck/test): deliberately break the guard — drop the \n from on-post-tool-use.ts writeSync and confirm the entrypoint test FAILS, then restore (a guard that cannot fail is not a guard). By hand: low threshold, joke renders styled; NO_COLOR=1 renders plain with no stray escapes. Read the README dad-joke section against loadConfig: every knob documented exists, every knob that exists is documented.
<!-- SECTION:NOTES:END -->
