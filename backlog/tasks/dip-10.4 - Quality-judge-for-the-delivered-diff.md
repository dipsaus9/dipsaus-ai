---
id: DIP-10.4
title: Quality judge for the delivered diff
status: Done
assignee: []
created_date: '2026-08-12 06:52'
updated_date: '2026-08-12 07:50'
labels:
  - story
dependencies:
  - DIP-10.1
references:
  - tests/eval/runner/deliver-judge.ts
  - tests/eval/rubrics/
  - tests/unit/
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
- [x] #1 A rubric scores the delivered diff vs story outcome/ACs for implementation quality, emitting a structured verdict reusing judge.ts
- [x] #2 The judge runs only on runs that pass the deterministic gate (no point judging a failed delivery), and its cost is documented
- [x] #3 Judge output is recorded per case alongside the deterministic scorecard
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rubric for delivery quality. 2. Wire judge.ts vote machinery. 3. Gate the judge behind a deterministic pass.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reuse judge.ts (3-vote majority pattern already exists). Billed — keep it behind the deterministic gate and document per-run cost.

Delivered tests/eval/runner/deliver-judge.ts + tests/eval/rubrics/deliver-quality.md + tests/unit/deliver-judge.test.ts (3 tests). Reuses judge.ts parseJudgeVote/majorityVerdict/invokeClaude + readRubric('deliver-quality'). buildDeliverJudgePrompt emits the VERDICT/REASONING format parseJudgeVote expects, blind (no run metadata/model id), carrying the rubric + story outcome + numbered ACs + the diff. judgeDelivery is GATED (AC#2): deterministicPass:false -> {judged:false} with NO model call (unit-tested); else config.judgeVotes (default 3) votes via config.judgeModel -> majorityVerdict. Cost (AC#2): 3 judge calls per delivered run that passed the deterministic gate. AC#3: returns a structured DeliverJudgeResult {judged, verdict|reason} for DIP-10.5 to record alongside the scorecard. 222 tests green; lint+typecheck clean. NOTE: backlog task edit --ref REPLACES the ref set (not additive like --ac) — hit while adding tests/unit/ here; DIP-7.7's amend-mode doc says '--ref adds', which is wrong and needs correcting.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the delivery quality judge: tests/eval/runner/deliver-judge.ts scores a delivered diff against the story's outcome/ACs on the deliver-quality rubric, reusing judge.ts's vote/parse/majority machinery (3 votes, pinned judge model, majority decides). It is gated per AC#2 — skipped with no model call unless the deterministic grader passed — and returns a structured verdict DIP-10.5 records alongside the scorecard. 3 unit tests cover the prompt builder and the skip gate (222 total green). Surfaced a tooling gotcha: backlog task edit --ref replaces rather than appends, so DIP-7.7's amend-mode note needs a fix.
<!-- SECTION:FINAL_SUMMARY:END -->
