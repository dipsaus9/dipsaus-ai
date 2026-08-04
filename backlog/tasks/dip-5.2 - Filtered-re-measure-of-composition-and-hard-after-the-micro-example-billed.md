---
id: DIP-5.2
title: Filtered re-measure of composition and hard after the micro-example (billed)
status: Done
assignee: []
created_date: '2026-08-04 11:53'
updated_date: '2026-08-04 14:50'
labels:
  - story
dependencies:
  - DIP-5.1
references:
  - tests/eval/baseline/review.json
  - tests/eval/baseline/apply.json
  - tests/eval/README.md
parent_task_id: DIP-5
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With the micro-example in the skill, composition and hard baselines are re-measured in both modes (review ~70 calls, apply ~40 agentic runs) via filtered --update-baseline merges. README records the verdict: did variant-compound and dashboard-panel move. Epic DIP-5 closes with this story.

Type: deliverable
Branch: DIP-5.2/microexample-remeasure
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Review and apply runs with --filter composition and --filter hard executed on the user explicit command, all with --update-baseline; merged baselines approved by the user and committed
- [x] #2 README known-limitations restates variant-compound and dashboard-panel from the new data with an explicit verdict on the micro-example's effect
- [x] #3 Judge 2-1 instability count of the re-measure recorded in the story implementation notes
- [x] #4 Repo gates green; epic DIP-5 closed on delivery
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Gate on explicit user go (billed). 2. Four filtered runs: review then apply for composition, review then apply for hard, each --update-baseline. 3. Old-vs-new entry diff presented for approval. 4. README verdict, 2-1 count to notes, close epic.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The hard filter also matches srp/hardwired-render by substring — harmless, its runs merge as-is (seen in DIP-4.4). Retry pass covers transient failures; a session-limit wall needs waiting for the stated reset then re-running filtered (see DIP-3.9 notes).

Re-measure results (2026-08-04, ~70 review calls + ~40 apply runs, zero failures, zero retries): micro-example verdict POSITIVE — variant-compound apply 3/5 -> 5/5, dashboard-panel 3/5 -> 4/5, checkout-review 4/5 -> 5/5; targeted rubrics now judge with zero 2-1 splits. Judge 2-1 instability count: 8, ALL on comp.slots-over-config (+1 regions-as-slots on dashboard-panel) — that rubric is the next ambiguity candidate (borderline calls like internal events.length conditionals read as gating; one genuine lazy refactor left renderX thunk props). slots-over-config apply 5/5 -> 3/5, detection 3/5 -> 2/5. Variance moves: config-soup 5/5 -> 4/5, support-inbox 5/5 -> 4/5, hardwired-render detection 4/5 -> 5/5.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Filtered both-modes re-measure delivered on user command (~70 review calls + ~40 apply runs, zero failures or retries). Micro-example verdict positive: variant-compound apply 3/5 -> 5/5, dashboard-panel 3/5 -> 4/5, targeted rubrics judge with zero 2-1 splits. slots-over-config surfaced as the next weak spot (apply 3/5, detection 2/5, all 8 judge 2-1 verdicts on its rubric) — recorded in README as the next DIP-4.3-style rubric candidate. Baselines approved by the user and committed; epic DIP-5 closes with this story.
<!-- SECTION:FINAL_SUMMARY:END -->
