---
id: DIP-6.1
title: 'Rubric: data-driven slot selection is not flag-gating (slots-over-config)'
status: Done
assignee: []
created_date: '2026-08-04 17:52'
updated_date: '2026-08-04 18:23'
labels:
  - story
dependencies: []
references:
  - tests/eval/rubrics/comp.slots-over-config.md
  - tests/eval/rubrics/README.md
parent_task_id: DIP-6
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The comp.slots-over-config rubric gains an explicit NOT-a-violation criterion: a component choosing between its own slots based on data state (events.length === 0 rendering the empty slot) is normal conditional rendering — the rubric's pass worked example does exactly this and judges must not read it as flag-configuration. Fail stays reserved for zero-arg thunks on the API and boolean flags replacing slot presence.

Type: deliverable
Branch: DIP-6.1/slots-rubric-conditionals
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 tests/eval/rubrics/comp.slots-over-config.md carries an explicit NOT-a-violation criterion for data-driven slot selection, referencing the pass example's events.length pattern
- [x] #2 tests/eval/rubrics/README.md records the dated reset rationale; rubric text contains no occurrence of the substring skill (judge-prompt blindness test)
- [x] #3 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. NOT-a-violation block mirroring DIP-4.3's shape, citing the pass example. 2. Dated entry in rubrics/README.md. 3. Grep-check for the skill substring before verify.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Motivating data (DIP-5.2 re-measure): all 8 judge 2-1 verdicts on this rubric; observed vote fails an internal events.length conditional as gating while the pass worked example uses the identical pattern. Blindness constraint learned in DIP-4.3: the word skill anywhere in rubric text fails tests/unit/eval-runner-judge.test.ts.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
comp.slots-over-config rubric gained the NOT-a-violation criterion for data-driven slot selection, explicitly anchored to the pass worked example's events.length pattern and distinguishing caller-facing configuration from internal conditional rendering. rubrics/README.md records the dated 2026-08-04 rationale citing the 8-of-8 2-1 concentration. Zero occurrences of the blindness-forbidden substring (grep-verified); gates green (174 tests).
<!-- SECTION:FINAL_SUMMARY:END -->
