---
id: DIP-11.6
title: 'backlog-run: drop worktree.enabled precondition, clarify run-vs-deliver'
status: Done
assignee: []
created_date: '2026-08-14 11:07'
updated_date: '2026-08-14 13:20'
labels:
  - story
dependencies:
  - DIP-11.1
references:
  - skills/backlog-run/SKILL.md
  - skills/backlog-run/reference/orchestration.md
parent_task_id: DIP-11
type: feature
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update backlog-run for auto-isolation: drop the Step 0 precondition that required worktree.enabled:true (the key is gone); state that run always isolates by its own orchestration; and clarify the run-vs-deliver boundary (deliver auto-isolates only when busy, run always).

Type: deliverable
Branch: DIP-11.6/run-worktree-precondition
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Step 0 no longer requires or reads worktree.enabled; the precondition is a present workflow config plus a clean, fetched base
- [x] #2 The skill states that run always isolates workers in worktrees regardless of the removed toggle
- [x] #3 The run-vs-deliver distinction is stated: deliver isolates only under detected concurrency; run always isolates
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Edit the Step 0 precondition wording; add a run-vs-deliver clarity note; scrub orchestration.md references to worktree.enabled.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verify: none automated; self-review.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
backlog-run updated for auto-isolation. Step 0's precondition no longer requires or reads worktree.enabled (the key was removed in DIP-11.1); it is now simply a present workflow config plus a clean, fetched base branch. The Authority section and Step 0 state that backlog-run always isolates every worker in its own git worktree regardless of the removed toggle, because parallel workers cannot share the main checkout. A new run-vs-deliver note makes the boundary explicit: backlog-deliver auto-detects isolation and takes a worktree only under detected concurrency (DIP-11.4), whereas backlog-run dispatches N workers at once and therefore always isolates. orchestration.md needed no change — it only references the Agent-tool isolation flag, never the removed config key.
<!-- SECTION:FINAL_SUMMARY:END -->
