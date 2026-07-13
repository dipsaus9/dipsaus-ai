# [DIP-49] correct the stale 'no test files' claim in CLAUDE.md and DIP-48

Type: deliverable
Status: queued

## Outcome
The repo stops telling every agent that its test suite is empty when it is not.

## Done-when
- `CLAUDE.md`'s Commands section no longer claims the suite was removed in `968212f`, or that a green
  `bun run test` "proves nothing" — it states the suite that actually exists
- The rule that **any story adding runtime code must add unit tests** SURVIVES the rewrite. It is
  still correct, and it is the reason the note was written in the first place
- `DIP-48`'s technical notes drop the "a green light over an empty room" caveat. The required CI check
  now guards a real suite, which **strengthens** its argument rather than weakening it
- Verified by running the suite and using its actual output, not a remembered number

## Depends-on
- none

## Affected area
- `.claude/CLAUDE.md`
- `.backlog/stories/DIP-48.md`

## Verify
- `bun run test` — read the real count off the output and confirm the docs match it
- `grep -rn "968212f\|passWithNoTests\|empty room" .claude/CLAUDE.md .backlog/stories/` returns nothing
- `bun run lint && bun run typecheck && bun run test`

## Technical notes

Found while delivering DIP-40. `CLAUDE.md` says:

> Note `test` currently passes with **no test files** (`--passWithNoTests`) — the suite was removed in
> `968212f`, so `bun run test` green currently proves nothing.

It is not true. As of `fbd1295`:

```
tests/unit/dad-joke-pick.test.ts
tests/unit/dad-joke-source.test.ts
tests/unit/dad-joke-state.test.ts
tests/unit/dad-joke-trigger.test.ts

Test Files  4 passed (4)
     Tests  76 passed (76)
```

The dad-joke hook epic (`task_007`) landed tests with its runtime code, exactly as the rule demanded —
and nobody updated the note that the rule was attached to.

This matters beyond tidiness. `DIP-48` argues for making CI a **required status check** on `main`, and
its own notes undercut that argument by saying the check "is a green light over an empty room". That
was true when written and is now false. An agent picking up DIP-48 reads a weaker case for the story
than the facts support.

Keep the **rule** ("any story that adds runtime code must add unit tests with it"). Delete only the
claim about the suite being empty. The rule is what kept the suite honest; the factoid is what went
stale.

Note the meta-lesson, which is the same failure this repo has hit before with the README's phantom
eval harness: **a doc that describes state rots; a doc that describes a rule does not.** Prefer
writing the rule.

## Open questions
none
