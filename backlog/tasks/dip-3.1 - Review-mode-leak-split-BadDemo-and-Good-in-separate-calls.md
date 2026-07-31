---
id: DIP-3.1
title: 'Review-mode leak split: Bad+Demo and Good in separate calls'
status: To Do
assignee: []
created_date: '2026-07-31 08:19'
labels:
  - story
dependencies:
  - DIP-2.12
references:
  - tests/eval/runner/run.ts
  - tests/eval/runner/prompt.ts
  - tests/eval/runner/ab.ts
  - tests/unit/eval-runner-parser.test.ts
parent_task_id: DIP-3
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Review mode measures detection and precision independently: per fixture, one call carries Bad.tsx (plus Demo.tsx where present) for detection, a second call carries Good.tsx alone for the false-positive check — the model can no longer diff Bad against Good. Both A/B arms use the identical split.

Type: deliverable
Branch: DIP-3.1/review-leak-split
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 buildUserPrompt (or successor) never places a fixture Good.tsx in the same prompt as its Bad.tsx; fixtures without a Good twin keep a single call
- [ ] #2 Matcher/report attribute detection to the Bad-call and false positives to the Good-call with unchanged score schema (rule, fixture, file, detected, runs)
- [ ] #3 A/B review path (skill and control arms) uses the same split; --verbose prints both call prompts
- [ ] #4 Unit tests cover the split prompt building and per-call score attribution; bun run lint/typecheck/test green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Split FixtureCase sources into detection-set/precision-set in fixtures.ts or at call site. 2. Prompt builder takes a file subset. 3. run.ts loops two invocations per Good-twin fixture; K applies per call pair. 4. ab.ts reuses the same loop for both arms. 5. Unit tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Call count rises ~40% (Good-only calls are small — token cost roughly flat). Review baseline invalidated — refreshed in DIP-3.8, not here. Line anchors in expected.json untouched (matcher scores rule+file only).
<!-- SECTION:NOTES:END -->
