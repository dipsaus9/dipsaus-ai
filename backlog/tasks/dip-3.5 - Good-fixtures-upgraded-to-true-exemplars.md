---
id: DIP-3.5
title: Good fixtures upgraded to true exemplars
status: Done
assignee: []
created_date: '2026-07-31 08:20'
updated_date: '2026-07-31 13:19'
labels:
  - story
dependencies:
  - DIP-3.2
references:
  - tests/eval/fixtures/**/Good.tsx
parent_task_id: DIP-3
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every Good.tsx reads as a genuine improvement a reviewer would sign off: code comments explaining why the shape is right (which rule it satisfies and how), richer documentation, realistic naming — while staying within every skill cap and passing the island suite. These files are now judge exemplars (DIP-3.4) and precision targets (DIP-3.1); their quality directly shapes both measurements.

Type: deliverable
Branch: DIP-3.5/good-exemplar-upgrade
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each existing Good.tsx carries why-comments tied to the rule ids it demonstrates; no Good.tsx exceeds any cap (LOC cap counts comment lines — verified via the harness measureComponents)
- [x] #2 Island suite green; expected.json entries for Good files remain expected-clean
- [x] #3 A spot review-mode smoke (--filter, K=1, on the user command) shows no new false positives on upgraded Good files
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inventory Goods (which rules each demonstrates). 2. Rewrite with why-comments/docs, cap-checked. 3. Island suite plus optional billed smoke.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Comments must not name the eval, labels, or the Bad counterpart — Good files reach the precision call and the judge; meta-references would leak harness context. Fixtures without Good (dashboard-panel, god-component) stay Good-less; rubric-only fallback covers them.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All 20 Good.tsx files rewritten as genuine exemplars: file-level docs plus targeted inline comments explaining WHY the shape satisfies the rule ids each demonstrates, written as natural developer documentation. The previous meta-language (clean twin / false-positive trap) leaked harness context into precision review calls and judge exemplar prompts — removed entirely. Cap safety proven with the harness's own measureComponents/capViolations: 20 files, 0 violations (loc-cap keeps its exactly-150-line component and carries header-only docs). Island suite 45 green, island tsc clean, repo gates green. Billed AC3 smoke on user command (4 fixtures x detection+precision, K=1): all PASS, detection 1/1 each, zero false positives on the upgraded Good files.
<!-- SECTION:FINAL_SUMMARY:END -->
