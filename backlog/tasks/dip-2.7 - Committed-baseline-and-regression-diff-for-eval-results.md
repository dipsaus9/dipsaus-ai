---
id: DIP-2.7
title: Committed baseline and regression diff for eval results
status: Done
assignee: []
created_date: '2026-07-17 14:18'
updated_date: '2026-07-23 09:43'
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
- [x] #1 Runner writes a canonical, diff-stable baseline JSON (sorted keys, no timestamps in the comparable body) under tests/eval/baseline/ only when --update-baseline is passed
- [x] #2 Without the flag, results are compared to the committed baseline; any per-rule rate drop fails with a named regression naming rule, fixture, model, old and new rate
- [x] #3 New fixtures/rules absent from the baseline are reported as additions, not regressions; removed ones flagged for explicit baseline refresh
- [x] #4 Diff logic has CI-safe unit tests (canned result sets)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. runner/baseline.ts: toBaseline(report) — canonical {kind, entries[]} sorted by model|fixture|file|rule, detected+runs stored (K kept per entry), no timestamps; diffBaseline(baseline, current) — keys compared as rate proportions, regressions (rate drop) named rule+fixture+file+model+old/new counts, additions (new keys) informational, removed flagged ONLY when in current scope (model AND fixture present in current run — a --filter run never fails out-of-scope baseline), K-mismatch warning when proportions compared across different runs counts. 2. run.ts: --update-baseline writes tests/eval/baseline/review.json by MERGING current-scope entries over existing out-of-scope ones (filtered update cannot clobber the full baseline); without flag and baseline present -> diff, print, regressions+removals fail exit; baseline absent -> informational note, no failure. 3. Diff section in terminal report + JSON. 4. tests/eval/baseline/README.md — dir purpose; actual first baseline lands in DIP-2.11 via approved billed run. 5. tests/unit/eval-runner-baseline.test.ts: canned sets — drop=regression, improvement=pass, addition, in-scope removal, out-of-scope ignored, K-mismatch flag, canonical sort stability, merge-on-filtered-update.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Model list mismatch between run and baseline: compare intersection, report the rest — a --filter run must not fail the whole baseline. Store K alongside rates; a rate from a different K is comparable as a proportion but flag it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Baseline + regression diff: runner/baseline.ts produces a canonical diff-stable body (kind + entries sorted by model|fixture|file|rule, detected/runs per entry, no timestamps) written to tests/eval/baseline/review.json only via --update-baseline, which merges the run's scope over existing entries so filtered updates never clobber the rest. Plain runs with a committed baseline diff against it: rate drops fail as named regressions (rule on fixture/file @ model: old -> new), in-scope removals fail demanding explicit refresh, additions are informational, out-of-scope baseline entries (other models/fixtures than the run covers) are ignored, and K mismatches compare as proportions but are flagged. Diff lands in terminal output and the results JSON; exit code reflects verdict AND diff. 9 CI-safe unit tests on canned result sets (116 unit total). No baseline file committed yet — first approved baseline is DIP-2.11's job after a blessed billed run.
<!-- SECTION:FINAL_SUMMARY:END -->
