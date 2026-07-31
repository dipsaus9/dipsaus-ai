---
id: DIP-3.5
title: Good fixtures upgraded to true exemplars
status: To Do
assignee: []
created_date: '2026-07-31 08:20'
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
- [ ] #1 Each existing Good.tsx carries why-comments tied to the rule ids it demonstrates; no Good.tsx exceeds any cap (LOC cap counts comment lines — verified via the harness measureComponents)
- [ ] #2 Island suite green; expected.json entries for Good files remain expected-clean
- [ ] #3 A spot review-mode smoke (--filter, K=1, on the user command) shows no new false positives on upgraded Good files
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inventory Goods (which rules each demonstrates). 2. Rewrite with why-comments/docs, cap-checked. 3. Island suite plus optional billed smoke.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Comments must not name the eval, labels, or the Bad counterpart — Good files reach the precision call and the judge; meta-references would leak harness context. Fixtures without Good (dashboard-panel, god-component) stay Good-less; rubric-only fallback covers them.
<!-- SECTION:NOTES:END -->
