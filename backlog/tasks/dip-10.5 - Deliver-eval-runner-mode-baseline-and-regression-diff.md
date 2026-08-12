---
id: DIP-10.5
title: 'Deliver eval runner mode, baseline and regression diff'
status: To Do
assignee: []
created_date: '2026-08-12 06:52'
updated_date: '2026-08-12 06:52'
labels:
  - story
dependencies:
  - DIP-10.2
  - DIP-10.3
  - DIP-10.4
references:
  - tests/eval/runner/run.ts
  - tests/eval/runner/config.ts
  - tests/eval/baseline/
  - tests/eval/README.md
parent_task_id: DIP-10
priority: medium
type: feature
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wire the fixtures, grader and judge into the runner as test:eval --mode deliver: run the corpus, produce a scorecard + judge report, diff against a committed baseline, and document it in the eval README. --update-baseline rewrites the committed baseline.

Type: deliverable
Branch: DIP-10.5/deliver-eval-runner
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 test:eval --mode deliver runs the deliver corpus end to end and prints a per-case scorecard + judge summary
- [ ] #2 Results diff against a committed baseline; --update-baseline rewrites it; the flow is documented in tests/eval/README.md
- [ ] #3 The mode reuses the existing retry/pool/report machinery and stays out of the CI unit run
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add the deliver mode to run.ts dispatch. 2. Wire fixtures->deliver->grade->judge->report. 3. Baseline read/write + diff. 4. README section.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Depends on 10.2/10.3/10.4. Edits shared run.ts/config.ts so it serializes after them. Baseline is committed (deterministic parts); billed measurement is DIP-10.6.
<!-- SECTION:NOTES:END -->
