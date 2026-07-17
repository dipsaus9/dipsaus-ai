---
id: DIP-2.1
title: Stable rule ids in react-architecture skill output
status: To Do
assignee: []
created_date: '2026-07-17 14:16'
labels:
  - story
dependencies: []
references:
  - skills/react-architecture/SKILL.md
parent_task_id: DIP-2
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every rule in the skill gets a stable kebab id (e.g. srp.loc-cap, boundary.deep-import, comp.config-soup, state.derived-effect) and review-mode output includes the id per finding, so eval grading matches on id + file instead of fragile prose. Ids are the contract between skill and harness; renaming one later is itself a regression-relevant change.

Type: deliverable
Branch: DIP-2.1/skill-rule-ids
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every rule in SKILL.md Standards carries a unique stable id, visible in a rules table; ids are kebab, category-prefixed (srp., boundary., comp., state.)
- [ ] #2 Review-mode output format requires the rule id in each finding entry, and the format example in SKILL.md shows it
- [ ] #3 Apply-mode summary format references the same ids
- [ ] #4 No rule's substance (caps, severities, wording of what is checked) changes in this story — ids only; diff shows additions, not semantic edits
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Assign ids per rule in place, in a table per category. 2. Extend review output spec + example with id field. 3. Extend apply summary spec. 4. Self-review diff for accidental semantic drift.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verify: bun run lint/typecheck/test (doc-only change, suite must stay green). Manual: read the diff — the only allowed changes are added id tokens and format spec lines.
<!-- SECTION:NOTES:END -->
