---
id: DIP-3.6
title: Enrich the thinnest fixtures with distractor code
status: To Do
assignee: []
created_date: '2026-07-31 08:20'
labels:
  - story
dependencies:
  - DIP-3.2
  - DIP-3.5
references:
  - tests/eval/fixtures/srp/hardwired-render/
  - tests/eval/fixtures/srp/deep-import/
  - tests/eval/fixtures/srp/internal-state/
  - tests/eval/fixtures/srp/foreign-logic/
  - tests/eval/fixtures/srp/jsx-depth-cap/
parent_task_id: DIP-3
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The 5-6 smallest Bad.tsx files (20-30 lines: hardwired-render, deep-import, internal-state, foreign-logic, jsx-depth-cap) grow realistic distractor code — working, rule-clean logic surrounding the buried violation — so detection stops being spot-the-only-thing-in-the-file. Labels re-anchored, behavior tests extended to pin the added behavior.

Type: deliverable
Branch: DIP-3.6/enrich-thin-fixtures
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each enriched Bad.tsx is at least ~60 lines with the seeded violation no longer the sole content; distractors violate no rule (checked with measureComponents/bannedPatterns)
- [ ] #2 expected.json line anchors updated; expected rule set unchanged per fixture
- [ ] #3 Behavior tests cover the added distractor behavior and pass pre-refactor; island suite green
- [ ] #4 Corresponding Good.tsx enriched equivalently (same distractors, violation fixed) so the pair stays a fair precision target
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Per fixture: design distractor feature, extend Bad and Good symmetrically. 2. Re-anchor labels. 3. Extend behavior tests. 4. Island suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC4 overlaps DIP-3.5 Good rewrites on these five dirs — hard dependency on DIP-3.5 (it lands first; this story enriches the already-upgraded Goods). Token cost of review calls rises with fixture size — acceptable, that is the point.
<!-- SECTION:NOTES:END -->
