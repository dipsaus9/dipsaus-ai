---
id: DIP-10.2
title: 'Fixture corpus: backlog-deliver eval cases across stacks'
status: To Do
assignee: []
created_date: '2026-08-12 06:51'
updated_date: '2026-08-12 06:51'
labels:
  - story
dependencies:
  - DIP-10.1
references:
  - tests/eval/deliver/fixtures/
parent_task_id: DIP-10
priority: medium
type: feature
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A corpus of self-contained deliver cases, each a starter git repo + a ready story + the expected outcome, spanning ~2-3 stacks (e.g. node/bun, python, a no-pipeline repo). Each case is built to the DIP-10.1 fixture shape.

Type: deliverable
Branch: DIP-10.2/deliver-eval-fixtures
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 At least 4 deliver fixture cases exist, each a self-contained starter repo + one ready story + a recorded expected outcome (branch, which ACs, declared References)
- [ ] #2 The corpus spans at least two stacks plus one no-pipeline repo (verify degrades to per-story checks)
- [ ] #3 Each fixture is loadable by the runner and torn down cleanly after a run
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Author 4+ fixture repos to the 10.1 shape. 2. Vary stack + difficulty (single-file vs multi-file story). 3. Record expected outcomes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Keep fixtures deliberately small but real. Fixtures live under tests/eval/ so they are fenced from CI gates.
<!-- SECTION:NOTES:END -->
