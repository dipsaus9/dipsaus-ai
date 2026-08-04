---
id: DIP-6.3
title: Filtered re-measure of slots-over-config and dashboard-panel (billed)
status: To Do
assignee: []
created_date: '2026-08-04 17:53'
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
- [ ] #1 Review and apply runs with --filter slots-over-config and --filter dashboard-panel executed on the user explicit command, all with --update-baseline; merged baselines approved by the user and committed
- [ ] #2 README known-limitations restates slots-over-config from the new data with a verdict on both fixes
- [ ] #3 Judge 2-1 instability count of the re-measure recorded in the story implementation notes
- [ ] #4 Repo gates green; epic DIP-6 closed on delivery
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Gate on explicit user go (billed). 2. Four filtered runs: review + apply for slots-over-config, review + apply for dashboard-panel. 3. Old-vs-new diff for approval. 4. README verdict, 2-1 count to notes, close epic.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Session-limit vs outage handling per DIP-3.9 notes; retry pass covers transients. anyOf changes what detection scoring MEANS for this fixture — call that out in the baseline-diff presentation so the rate jump is not read as pure model improvement.
<!-- SECTION:NOTES:END -->
