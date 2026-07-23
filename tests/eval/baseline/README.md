# Committed eval baseline

`review.json` holds the approved per-rule detection rates (rule × fixture × file × model,
`detected`/`runs`) from an eval run someone explicitly blessed with `--update-baseline`.
It is canonical and diff-stable — sorted entries, no timestamps — so every ground-truth
change shows up as a reviewable PR diff.

- Plain runs compare against this file: any rate drop is a named regression and fails the
  run; entries the run no longer produces (in scope) demand an explicit refresh.
- New rules/fixtures are reported as additions, never regressions.
- A `--filter` run only compares and (on update) only replaces entries inside its own
  scope — it can never fail or clobber the rest of the baseline.

No file here yet: the first approved baseline lands with the epic's final wiring story
after a full, human-approved run.
