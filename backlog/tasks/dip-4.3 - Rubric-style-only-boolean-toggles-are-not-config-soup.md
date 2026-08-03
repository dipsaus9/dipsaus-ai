---
id: DIP-4.3
title: 'Rubric: style-only boolean toggles are not config-soup'
status: To Do
assignee: []
created_date: '2026-08-03 05:52'
labels:
  - story
dependencies:
  - DIP-3.9
references:
  - tests/eval/rubrics/comp.config-soup.md
  - tests/eval/rubrics/README.md
parent_task_id: DIP-4
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The comp.config-soup rubric gains an explicit NOT-a-violation line: a boolean prop whose only effect is toggling a CSS class or style on an existing element — gating no part, no layout branch, no shared state — passes. This traces to the SKILL.md rule text (flags that gate optional parts, render-config props, >6 props, shared part state) and removes the sole cause of hard/support-inbox 1/5 in the DIP-3.8 refresh, where judges split 2-1 three times on a compact className toggle.

Type: deliverable
Branch: DIP-4.3/style-boolean-rubric
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 tests/eval/rubrics/comp.config-soup.md carries an explicit NOT-a-violation criterion for style-only boolean toggles, with wording traceable to the SKILL.md comp.config-soup rule text
- [ ] #2 tests/eval/rubrics/README.md records the dated reset rationale per the rubric-change policy
- [ ] #3 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Mirror the DIP-3.4 shared-shell pattern: add an Explicitly NOT required/NOT a violation block. 2. Cite the skill text boundary: banned booleans gate parts or layouts; pure className modifiers do not. 3. Dated rationale entry in rubrics/README.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Same DIP-3.9 gate as DIP-4.2: rubric text changes how the deferred A/B judge scores refactors, so it must land after the A/B answer is archived to keep the arms symmetric. Baseline reset happens in DIP-4.4, not here — policy says rubric change + reset belong to a deliberate story pair.
<!-- SECTION:NOTES:END -->
