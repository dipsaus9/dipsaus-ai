# Judge rubrics

One rubric per rule the LLM judge grades — the composition rules whose quality an AST
cannot measure. Each rubric carries explicit pass/fail criteria and worked examples (at
least one passing, one failing) and is injected verbatim into the judge prompt together
with the refactored code, and nothing else.

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
