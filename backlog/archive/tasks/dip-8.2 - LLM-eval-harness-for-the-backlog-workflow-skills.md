---
id: DIP-8.2
title: LLM eval harness for the backlog workflow skills
status: To Do
assignee: []
created_date: '2026-08-09 12:20'
updated_date: '2026-08-12 06:52'
labels:
  - needs-refinement
dependencies: []
references:
  - tests/eval/
parent_task_id: DIP-8
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend tests/eval/ to the init/plan/deliver skills: fixture repos across stacks, headless claude runs of plan and deliver, graded against rubrics like the react-architecture harness, with a committed baseline. Billed, on-command only. Deferred from DIP-7 (validation there was manual dogfooding).

Type: deliverable
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fixture repos + a runner that scores plan/deliver headless runs against rubrics, with a committed baseline and a README verdict
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Superseded by epic DIP-10 (refined 2026-08-12): the deliver eval harness is epic-sized, decomposed into DIP-10.1 (spike) through DIP-10.6 (first baseline). plan-eval remains a future epic. Archived.
<!-- SECTION:NOTES:END -->
