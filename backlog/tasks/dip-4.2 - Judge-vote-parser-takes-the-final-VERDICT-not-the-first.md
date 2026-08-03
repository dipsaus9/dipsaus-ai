---
id: DIP-4.2
title: 'Judge vote parser takes the final VERDICT, not the first'
status: To Do
assignee: []
created_date: '2026-08-03 05:52'
labels:
  - story
dependencies:
  - DIP-3.9
references:
  - tests/eval/runner/judge.ts
  - tests/unit/eval-runner-judge.test.ts
parent_task_id: DIP-4
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
parseJudgeVote in tests/eval/runner/judge.ts matches the first VERDICT: token in the judge's output, so a judge that deliberates and self-corrects gets its draft verdict recorded instead of its final one — observed costing composition/variant-compound run 2 its pass in the DIP-3.8 refresh (two votes with verdict fail whose reasoning concludes VERDICT: pass). The parser takes the last VERDICT: occurrence; the observed transcript becomes a regression test.

Type: deliverable
Branch: DIP-4.2/judge-final-verdict
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 parseJudgeVote returns the verdict of the last VERDICT: pass|fail occurrence in the raw output; reasoning extraction stays consistent with that final block
- [ ] #2 A unit test replays the observed DIP-3.8 deliberation transcript (early fail wording, final VERDICT: pass) and asserts verdict pass
- [ ] #3 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Regression test first from the apply-2026-07-31T18-32-00-658Z.json variant-compound run 2 vote text. 2. Switch the regex exec to a global match taking the last occurrence; align REASONING extraction to the final block. 3. Verify existing judge tests still pass.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Depends on DIP-3.9 deliberately: the A/B reuses the DIP-3.8 skill arm judged with the current parser — fixing parsing before the control arm runs would judge the two arms differently and bias the comparison against the skill. Deliver only after the A/B answer is archived.
<!-- SECTION:NOTES:END -->
