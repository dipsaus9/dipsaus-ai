---
id: DIP-10.6
title: First measured deliver baseline (billed)
status: Done
assignee: []
created_date: '2026-08-12 06:52'
updated_date: '2026-08-12 09:54'
labels:
  - story
dependencies:
  - DIP-10.5
references:
  - tests/eval/baseline/
  - tests/eval/README.md
  - tests/eval/runner/deliver.ts
parent_task_id: DIP-10
priority: medium
type: feature
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On explicit user command (billed), run test:eval --mode deliver over the corpus, approve the results, and commit the first deliver baseline with a README verdict on where backlog-deliver stands.

Type: deliverable
Branch: DIP-10.6/deliver-first-baseline
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Deliver eval run over the full corpus executed on the user's explicit command, results approved and committed as the first baseline
- [x] #2 README records the first-baseline verdict: per-dimension pass rates and any weak fixtures
- [x] #3 Repo gates green; epic closed on delivery
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Gate on explicit user go (billed). 2. Full deliver run. 3. Approve + commit baseline. 4. README verdict, close epic.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Billed + agentic. Session-limit vs outage handling per the eval-run-failure-modes memory; retry pass covers transients.

First baseline measured on user command (4 real headless backlog-deliver runs via --plugin-dir, concurrent). Result: 4/4 fixtures PASS every deterministic dimension (branch/verify/acs/scope/review) AND quality:pass. baseline/deliver.json committed; README verdict added. The two prior billed smokes caught real capture bugs (fixed): captureRun read task state from main not the story branch (DIP-7.1), scope wrongly flagged the story's own task file, setupCase left backlog/config uncommitted so worktrees didn't inherit them, and the judge got filenames instead of the real diff. verify/review are contract-based proxies (pushed branch implies green-per-commit + passed review gate); quality is a 3-vote judge majority; K=1. Headless nesting (worker spawns story-reviewer) + guard hooks confirmed working under --plugin-dir — the review.enabled:false fallback was not needed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Measured the first backlog-deliver baseline on the user's billed command: 4 real headless deliveries (node single-file, node multi-file, python, no-pipeline) loaded via --plugin-dir, all 4 passing every deterministic dimension and the quality judge. baseline/deliver.json committed with a README verdict. The billed smokes paid for themselves by exposing four real capture/setup bugs (task state read from the wrong branch, scope flagging the task file, uncommitted backlog in the sandbox, filenames-not-diff to the judge) — all fixed before the measured run. Headless backlog-deliver, its nested reviewer subagent and guard hooks all work under --plugin-dir; no fallback needed. Closes epic DIP-10.
<!-- SECTION:FINAL_SUMMARY:END -->
