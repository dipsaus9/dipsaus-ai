---
id: DIP-10.4
title: Quality judge for the delivered diff
status: To Do
assignee: []
created_date: '2026-08-12 06:52'
updated_date: '2026-08-12 06:52'
labels:
  - story
dependencies:
  - DIP-10.1
references:
  - tests/eval/runner/deliver-judge.ts
  - tests/eval/rubrics/
parent_task_id: DIP-10
priority: medium
type: feature
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An LLM judge that scores the delivered diff against the story's intent on a rubric (is the implementation correct, idiomatic, complete beyond just passing the gates?), reusing the existing judge.ts vote machinery. Complements the deterministic grader for what no rule can decide.

Type: deliverable
Branch: DIP-10.4/deliver-quality-judge
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A rubric scores the delivered diff vs story outcome/ACs for implementation quality, emitting a structured verdict reusing judge.ts
- [ ] #2 The judge runs only on runs that pass the deterministic gate (no point judging a failed delivery), and its cost is documented
- [ ] #3 Judge output is recorded per case alongside the deterministic scorecard
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rubric for delivery quality. 2. Wire judge.ts vote machinery. 3. Gate the judge behind a deterministic pass.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reuse judge.ts (3-vote majority pattern already exists). Billed — keep it behind the deterministic gate and document per-run cost.
<!-- SECTION:NOTES:END -->
