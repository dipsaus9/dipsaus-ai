---
id: DIP-3.7
title: 'Hard-tier fixtures: realistic multi-file feature folders'
status: In Progress
assignee: []
created_date: '2026-07-31 08:20'
updated_date: '2026-07-31 13:53'
labels:
  - story
dependencies:
  - DIP-3.2
  - DIP-3.5
references:
  - tests/eval/fixtures/hard/
  - tests/eval/README.md
parent_task_id: DIP-3
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A new fixtures/hard/ tier with 2-3 multi-file feature-folder fixtures (~200-400 lines each: component plus hooks plus utils across files), 2-4 buried violations spanning categories, plausible distractors, Demo seam, behavior tests, Good exemplar, and labels — the corpus segment where skill-vs-control can actually separate.

Type: deliverable
Branch: DIP-3.7/hard-tier-fixtures
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 2-3 directories under tests/eval/fixtures/hard/, each multi-file with expected.json (2-4 expected rules across at least 2 categories), Demo.tsx seam, behavior.test.tsx passing pre-refactor, Good exemplars to DIP-3.5 standard
- [ ] #2 discoverCases picks them up unmodified (hard/ is just another category dir); labels follow the README schema; no behavior test imports Good
- [ ] #3 README layout section documents the tier; cost table updated for the larger corpus (~26 cases)
- [ ] #4 Island suite green; distractor code violates no rule
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Design 2-3 realistic features (e.g. checkout form, settings page, data-table with filters). 2. Author Bad tree with violations, Good tree, Demo, tests. 3. Labels (AI-drafted, user PR approval). 4. README.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
README collision with DIP-3.8 (known-limitations rewrite) resolved by dependency: 3.8 depends on this story. Judge coverage: any comp.* expected rules here get rubric plus Good exemplar via DIP-3.4 automatically.
<!-- SECTION:NOTES:END -->
