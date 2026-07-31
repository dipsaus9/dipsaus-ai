---
id: DIP-3.1
title: 'Review-mode leak split: Bad+Demo and Good in separate calls'
status: Done
assignee: []
created_date: '2026-07-31 08:19'
updated_date: '2026-07-31 10:08'
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
- [x] #1 buildUserPrompt (or successor) never places a fixture Good.tsx in the same prompt as its Bad.tsx; fixtures without a Good twin keep a single call
- [x] #2 Matcher/report attribute detection to the Bad-call and false positives to the Good-call with unchanged score schema (rule, fixture, file, detected, runs)
- [x] #3 A/B review path (skill and control arms) uses the same split; --verbose prints both call prompts
- [x] #4 Unit tests cover the split prompt building and per-call score attribution; bun run lint/typecheck/test green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. prompt.ts: splitReviewCalls(fixture) -> [{kind: detection, sources minus Good*}, {kind: precision, Good* only}] (single call when no Good twin); buildUserPrompt takes a sources map. 2. run.ts: worker invokes each call sequentially inside the pool slot and merges findings into ONE RunRecord per (fixture, run) — ok = all calls parsed, raw = concatenated transcripts; matcher/aggregate untouched so schema and runs-count stay identical. 3. ab.ts: --verbose additionally prints the detection and precision user prompts for the first Good-twin fixture. 4. Unit tests in eval-runner-parser.test.ts for split + subset prompt + merge. 5. Gates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Call count rises ~40% (Good-only calls are small — token cost roughly flat). Review baseline invalidated — refreshed in DIP-3.8, not here. Line anchors in expected.json untouched (matcher scores rule+file only).

Precision-call failure conservatively fails the whole run record (single ok flag on RunRecord) — doubled failure surface vs before, visible in failedRuns. Support files (e.g. deep-import/billing/) ride with the detection call only, so a Good twin importing them is reviewed without them — the fixed rule vocabulary makes unresolved-import FPs unlikely. Cost-table README update deliberately left to DIP-3.2 (its AC).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Review mode now measures detection and precision in separate model calls: splitReviewCalls partitions a fixture into a detection call (Bad + Demo + support files) and a precision call (Good.tsx or Good/ alone); buildUserPrompt takes a sources map. runReview merges both calls into one RunRecord per (fixture, run), so aggregate(), the score schema and K-run counting are untouched; any call failing marks the run failed. A/B arms inherit the split through runReview, and --verbose additionally prints both call user-prompts for a sample Good-twin fixture. Six new unit tests cover the split, the subset prompt and merged-record attribution.
<!-- SECTION:FINAL_SUMMARY:END -->
