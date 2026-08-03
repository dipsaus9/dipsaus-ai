---
id: DIP-4.1
title: End-of-run retry pass for failed eval runs
status: To Do
assignee: []
created_date: '2026-08-03 05:52'
labels:
  - story
dependencies: []
references:
  - tests/eval/runner/run.ts
  - tests/eval/runner/config.ts
  - tests/unit/eval-runner-retry.test.ts
  - tests/eval/README.md
parent_task_id: DIP-4
priority: high
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The runner queues runs that fail on timeout or CLI error and retries each once after the full matrix has drained, so a transient API outage window no longer poisons results or baselines. A successful retry replaces the failed record and is marked retried: true; a second failure keeps the run failed with both errors recorded.

Type: deliverable
Branch: DIP-4.1/retry-pass
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Runs failing on timeout or CLI error are queued and retried exactly once after the matrix completes; a successful retry replaces the failed record and carries retried: true in the results JSON
- [ ] #2 A run that fails twice stays failed with both error messages recorded; retry covers review and apply modes
- [ ] #3 Unit tests cover the replace-and-flag path and the double-failure path; repo gates green
- [ ] #4 tests/eval/README.md documents the retry pass and replaces the manual re-run-filtered advice for timeout clusters
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add retries: 1 to config. 2. Collect failed (fixture, run) pairs in the run.ts worker loop; after pool drains, re-execute them through the same worker path. 3. Replace records on success, tag retried: true; append second error on repeat failure. 4. New tests/unit/eval-runner-retry.test.ts with stubbed workers. 5. README: retry-pass paragraph in the timeout section.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Motivation: DIP-3.8 lost 16 review calls and 9 apply runs to two consecutive-timeout outage windows; every one succeeded on manual filtered re-run (40-106s). End-of-run spacing outlasts an outage window without explicit backoff. Keep retry out of ab.ts: DIP-3.9 owns that file; the shared run.ts worker path should cover A/B arms implicitly.
<!-- SECTION:NOTES:END -->
