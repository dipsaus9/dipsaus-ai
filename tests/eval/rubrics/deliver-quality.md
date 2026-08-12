# Rubric: delivery quality

Judge whether a delivered diff is a *good* implementation of its story — not merely one that passed
the gates. The deterministic grader (DIP-10.3) already confirmed the branch, verify, acceptance
criteria, scope and reviewer verdict; you judge what no rule can decide.

Apply ONLY these criteria to the diff, against the story's stated outcome and acceptance criteria.
Be strict: when evidence is ambiguous or the change is padded with unrelated edits, fail.

## Pass requires all of

1. **Solves the story's outcome directly** — the diff implements what the outcome describes, not a
   near-miss that happens to satisfy a literal test. No hard-coding to the test's exact inputs.
2. **Idiomatic for the stack** — the code reads like the surrounding starter repo (naming, style,
   module system); no foreign patterns dragged in.
3. **Minimal and focused** — only what the story needs. No dead code, no speculative abstraction, no
   drive-by refactors of untouched areas.
4. **Correct beyond the test** — the implementation would hold for reasonable inputs the test does
   not cover (e.g. `sum` works for negatives, `slugify` collapses repeated whitespace), not just the
   asserted cases.

## Fail if any of

- The change games the acceptance test (returns a constant, special-cases the asserted inputs).
- It edits files unrelated to the outcome, or leaves debugging/commented-out cruft.
- It is technically green but clearly incomplete against the outcome's intent.
