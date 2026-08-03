---
id: DIP-3.9
title: 'One-time A/B answer, control arm only (billed)'
status: To Do
assignee: []
created_date: '2026-07-31 08:21'
updated_date: '2026-08-03 05:53'
labels:
  - story
dependencies:
  - DIP-3.8
  - DIP-4.1
references:
  - tests/eval/runner/ab.ts
  - tests/eval/ab/
  - tests/eval/README.md
  - tests/unit/eval-runner-ab.test.ts
parent_task_id: DIP-3
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
--mode ab gains --reuse-skill-arm <results-file>: the skill arm is read from the DIP-3.8 archived run, only the control arm executes (about half cost). The resulting report is archived under tests/eval/ab/, README gets the per-category summary, and the epic closes with the headline answer to does-the-skill-help.

Type: deliverable
Branch: DIP-3.9/ab-rerun-answer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 --reuse-skill-arm loads a prior full run (review, apply and judge data) as the skill arm; validation rejects files from a mismatched corpus/config; unit-tested
- [ ] #2 Control-arm run executed on the user explicit command; deltas computed per category; report JSON committed under tests/eval/ab/
- [ ] #3 README per-category A/B summary added; epic DIP-3 final summary quotes the headline answer
- [ ] #4 Repo gates green; epic closed on delivery of this story
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reuse is legitimate here because arms share harness, corpus, skill text and config within one epic window; the flag warns when the reused file is older than N days. Deferred-judge path must judge control-arm comp refactors with the same exemplar prompt (DIP-3.4).
<!-- SECTION:NOTES:END -->
