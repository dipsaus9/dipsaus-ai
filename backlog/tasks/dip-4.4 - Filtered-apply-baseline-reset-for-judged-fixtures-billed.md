---
id: DIP-4.4
title: Filtered apply-baseline reset for judged fixtures (billed)
status: To Do
assignee: []
created_date: '2026-08-03 05:53'
labels:
  - story
dependencies:
  - DIP-4.1
  - DIP-4.2
  - DIP-4.3
references:
  - tests/eval/baseline/apply.json
  - tests/eval/README.md
parent_task_id: DIP-4
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With the judge parser fixed and the config-soup rubric clarified, the apply baseline entries for judge-scored fixtures (composition and hard tiers, 7 fixtures, ~35 agentic runs) are re-measured and merged over the baseline. srp and state fixtures grade mechanically and are untouched. Expected movement: hard/support-inbox up from 1/5, composition/variant-compound up from 2/5.

Type: deliverable
Branch: DIP-4.4/judged-baseline-reset
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Apply runs with --filter composition and --filter hard executed on the user explicit command with --update-baseline; merged baseline approved by the user and committed
- [ ] #2 tests/eval/README.md known-limitations updated: support-inbox and variant-compound entries restated from the new data
- [ ] #3 Judge 2-1 instability count of the re-run recorded in the story implementation notes
- [ ] #4 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Gate on explicit user go (billed). 2. Run apply mode twice with --filter composition and --filter hard, both --update-baseline (filtered merge). 3. Diff old vs new entries, present for approval. 4. README known-limitations restated; 2-1 count to notes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cost: ~35 agentic runs + judge votes (about a quarter of a full apply matrix). Retry pass (DIP-4.1) protects the run from outage windows. Filtered-update merge policy per tests/eval/baseline/README.md.
<!-- SECTION:NOTES:END -->
