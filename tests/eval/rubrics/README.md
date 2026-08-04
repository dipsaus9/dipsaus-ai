# Judge rubrics

One rubric per rule the LLM judge grades — the composition rules whose quality an AST
cannot measure. Each rubric carries explicit pass/fail criteria and worked examples (at
least one passing, one failing) and is injected verbatim into the judge prompt together
with the refactored code and — when the fixture has a Good twin — that twin as a
REFERENCE exemplar, framed as *one acceptable shape, not the only one*: it calibrates
the criteria and never demands an exact match. Fixtures without a Good stay
rubric-only. Nothing else enters the prompt (no arm, labels, or run metadata).

**2026-07-31 reset (DIP-3.4):** `comp.variant-compound` dropped its shared-shell
criterion — the skill teaches one compound part-set per shape, not shell extraction, so
the rubric graded beyond the skill's text (baseline showed structural 0/5). Every
criterion now traces to SKILL.md. This change plus the exemplar addition ships with the
epic's deliberate baseline reset (DIP-3.8).

**2026-08-04 reset (DIP-4.3):** `comp.config-soup` gained an explicit NOT-a-violation
criterion for style-only boolean toggles (a prop that only switches CSS class/style on
an always-rendered element). The skill's text bans part-gating flags, render-config
props and prop-threaded shared state — not styling modifiers — yet judges split 2–1
three times on `hard/support-inbox`'s `compact` className toggle and failed every
otherwise-sound compound refactor on it (1/5 in the DIP-3.8 baseline, sole cause).
Ships with the DIP-4.4 filtered baseline reset for judged fixtures.

**Drift containment (these are part of the eval's ground truth):**

- The judge model is pinned by exact id in `tests/eval/runner/config.ts`
  (`judgeModel`). Changing it invalidates comparability — a deliberate baseline reset
  (`--update-baseline` runs, reviewed in a PR) is required.
- Editing any rubric's text is regression-relevant the same way: rubric changes ship
  with a baseline reset in the same PR.
- Every verdict is 3 votes, majority decides; individual votes and reasoning are
  recorded in the results JSON. Non-unanimous (2–1) verdicts are surfaced as
  judge-instability warnings — if those accumulate, the epic demotes the judge to
  advisory.
