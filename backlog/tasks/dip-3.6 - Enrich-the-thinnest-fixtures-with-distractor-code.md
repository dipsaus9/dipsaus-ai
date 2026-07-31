---
id: DIP-3.6
title: Enrich the thinnest fixtures with distractor code
status: Done
assignee: []
created_date: '2026-07-31 08:20'
updated_date: '2026-07-31 13:37'
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
- [x] #1 Each enriched Bad.tsx is at least ~60 lines with the seeded violation no longer the sole content; distractors violate no rule (checked with measureComponents/bannedPatterns)
- [x] #2 expected.json line anchors updated; expected rule set unchanged per fixture
- [x] #3 Behavior tests cover the added distractor behavior and pass pre-refactor; island suite green
- [x] #4 Corresponding Good.tsx enriched equivalently (same distractors, violation fixed) so the pair stays a fair precision target
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Per fixture: design distractor feature, extend Bad and Good symmetrically. 2. Re-anchor labels. 3. Extend behavior tests. 4. Island suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC4 overlaps DIP-3.5 Good rewrites on these five dirs — hard dependency on DIP-3.5 (it lands first; this story enriches the already-upgraded Goods). Token cost of review calls rises with fixture size — acceptable, that is the point.

SCOPE FLAG for the epic: the other 18 Bad fixtures still open with comments naming their rule id (e.g. Violates state.derived-effect) — the same answer leak, sent verbatim in every detection call. Likely the main driver of the ~100% detection ceiling in both A/B arms. Deserves a small dedicated story (strip/neutralise headers, re-anchor nothing, zero behavior change) before the DIP-3.8 baseline refresh, or the new baseline bakes the leak in.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Five thinnest Bad.tsx files (20-26 lines) enriched to 57-62 lines of working code: profile mastheads with initials/date helpers, contact lists, itemised order lines with a free-shipping threshold, tier badges and notification copy, a filter+sort directory UI — all rule-clean distractors around the unchanged seeded violation. Good twins enriched symmetrically (same features, violation fixed). Violation-announcing header comments removed from these five Bad files: they named the rule id inside the reviewed source, handing the model the answer. expected.json anchors re-pointed (56/1/34/38/48); harness cap-check shows the seeded jsx-depth violation as the only trip across all ten files. Behavior tests extended to pin the new behavior (filtering, sorting, formatted rows) and good.test.tsx parity kept; island suite 48 green, both tsconfigs clean, unit 161 green.
<!-- SECTION:FINAL_SUMMARY:END -->
