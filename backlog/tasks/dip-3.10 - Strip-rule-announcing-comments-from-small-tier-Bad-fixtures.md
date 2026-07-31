---
id: DIP-3.10
title: Strip rule-announcing comments from small-tier Bad fixtures
status: Done
assignee: []
created_date: '2026-07-31 13:58'
updated_date: '2026-07-31 14:02'
labels:
  - story
dependencies:
  - DIP-3.6
references:
  - tests/eval/fixtures/srp/
  - tests/eval/fixtures/composition/
  - tests/eval/fixtures/state/
parent_task_id: DIP-3
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Detection measures recognition, not reading: the 18 small-tier Bad.tsx files that still open with a comment naming their violated rule (e.g. Violates state.derived-effect: ...) lose those comments — neutral or no comments instead — so the reviewed source no longer hands the model the answer. Zero behavior change; expected.json line anchors re-pointed where comment removal shifts lines.

Type: deliverable
Branch: DIP-3.10/strip-leak-comments
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No detection-call source file (Bad.tsx and support files across fixtures/srp, fixtures/composition, fixtures/state) contains a comment naming a rule id or announcing its violation; verified by grep for 'Violates' and rule-id patterns with zero hits outside Good exemplars
- [x] #2 Zero behavior change: island suite green, no component code modified, expected.json anchors re-pointed where line numbers shifted
- [x] #3 Repo bun run lint/typecheck/test green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Grep all non-Good fixture sources for rule-naming comments. 2. Strip or neutralise each header/inline comment. 3. Re-anchor expected.json lines. 4. Island suite + gates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Found during DIP-3.6: comments like 'Violates boundary.deep-import: ...' ship verbatim in every detection call — likely the main driver of the ~100% detection ceiling in both A/B arms. The five DIP-3.6 fixtures and the DIP-3.7 hard tier are already clean; this story covers the remaining 18. Good exemplar why-comments (citing rules they satisfy) stay — they ride the separate precision call and were mandated by DIP-3.5.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
18 small-tier Bad.tsx files lost their rule-announcing header comments (Violates <rule.id>: ...) — the text shipped verbatim in every detection call, so detection measured reading the answer, not recognising the violation. Component code untouched; expected.json anchors shifted by each file's removed-line count and spot-verified to land on their trigger constructs (component declarations, offending effects, imports). Grep sweep: zero Violates / rule-id comments in any detection-call source; Good exemplar why-comments untouched by design (separate precision call, DIP-3.5 mandate); fixtures/seed/Bad.tsx keeps its comment as it is never discovered or sent to a model. Island suite 55 green, repo gates green.
<!-- SECTION:FINAL_SUMMARY:END -->
