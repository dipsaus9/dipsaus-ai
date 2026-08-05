---
id: DIP-6.3
title: Filtered re-measure of slots-over-config and dashboard-panel (billed)
status: Done
assignee: []
created_date: '2026-08-04 17:53'
updated_date: '2026-08-05 09:22'
labels:
  - story
dependencies:
  - DIP-6.1
  - DIP-6.2
references:
  - tests/eval/baseline/review.json
  - tests/eval/baseline/apply.json
  - tests/eval/README.md
parent_task_id: DIP-6
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With the rubric line and anyOf labels in place, slots-over-config and dashboard-panel are re-measured in both modes (~20 review calls + ~10 apply runs) via filtered --update-baseline merges. README records the verdict: did detection recover and did the judge 2-1 concentration dissolve. Epic DIP-6 closes with this story.

Type: deliverable
Branch: DIP-6.3/slots-remeasure
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Review and apply runs with --filter slots-over-config and --filter dashboard-panel executed on the user explicit command, all with --update-baseline; merged baselines approved by the user and committed
- [x] #2 README known-limitations restates slots-over-config from the new data with a verdict on both fixes
- [x] #3 Judge 2-1 instability count of the re-measure recorded in the story implementation notes
- [x] #4 Repo gates green; epic DIP-6 closed on delivery
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Gate on explicit user go (billed). 2. Four filtered runs: review + apply for slots-over-config, review + apply for dashboard-panel. 3. Old-vs-new diff for approval. 4. README verdict, 2-1 count to notes, close epic.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Session-limit vs outage handling per DIP-3.9 notes; retry pass covers transients. anyOf changes what detection scoring MEANS for this fixture — call that out in the baseline-diff presentation so the rate jump is not read as pure model improvement.

Re-measure results (2026-08-05, ~20 review calls + 10 apply runs, zero failures/retries): slots-over-config detection 2/5 -> 5/5 (partly anyOf scoring semantics — regions-as-slots naming now credited; noted in README), apply 3/5 -> 5/5; dashboard-panel apply 3/5 -> 5/5, all three expected rules 5/5 detection. Judge 2-1 instability count: 6 (1 slots fixture run 2, 5 dashboard-panel across regions-as-slots and slots-over-config rubrics) — majorities consistently correct now, splits without wrong outcomes. One review FP noted: config-soup on slots Bad run 3 (not alsoAcceptable there).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Filtered both-modes re-measure delivered on user command (~30 calls, zero failures/retries). Both fixes verified: slots-over-config detection 2/5 -> 5/5 (anyOf semantics caveat in README), apply 3/5 -> 5/5; dashboard-panel apply 3/5 -> 5/5. Judge 2-1 count 6, majorities consistently correct. Baselines approved by the user and committed; epic DIP-6 closes with this story.
<!-- SECTION:FINAL_SUMMARY:END -->
