---
id: DIP-2.7
title: Committed baseline and regression diff for eval results
status: To Do
assignee: []
created_date: '2026-07-17 14:18'
labels:
  - story
dependencies:
  - DIP-2.6
references:
  - tests/eval/runner/
  - tests/eval/baseline/
parent_task_id: DIP-2
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An approved eval run's per-rule rates (rule×fixture×model) are written to tests/eval/baseline/ and committed. Subsequent runs diff against the baseline: any rate drop is a named regression ('state.derived-effect on fixtures/state/DerivedBad.tsx @ sonnet: 5/5 -> 3/5') and fails the run. Baseline updates only via --update-baseline, so every ground-truth change is visible in a PR diff.

Type: deliverable
Branch: DIP-2.7/baseline-diff
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Runner writes a canonical, diff-stable baseline JSON (sorted keys, no timestamps in the comparable body) under tests/eval/baseline/ only when --update-baseline is passed
- [ ] #2 Without the flag, results are compared to the committed baseline; any per-rule rate drop fails with a named regression naming rule, fixture, model, old and new rate
- [ ] #3 New fixtures/rules absent from the baseline are reported as additions, not regressions; removed ones flagged for explicit baseline refresh
- [ ] #4 Diff logic has CI-safe unit tests (canned result sets)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Model list mismatch between run and baseline: compare intersection, report the rest — a --filter run must not fail the whole baseline. Store K alongside rates; a rate from a different K is comparable as a proportion but flag it.
<!-- SECTION:NOTES:END -->
