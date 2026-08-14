---
id: DIP-11.4
title: 'backlog-deliver: auto-detect isolation (A''), stop reading worktree.enabled'
status: To Do
assignee: []
created_date: '2026-08-14 11:07'
labels:
  - story
dependencies:
  - DIP-11.1
references:
  - skills/backlog-deliver/SKILL.md
  - skills/backlog-deliver/reference/parallel-delivery.md
parent_task_id: DIP-11
type: feature
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make backlog-deliver auto-detect isolation (A'): deliver in the main checkout when the repo is quiet, in a worktree when it is busy (a live <id>/* branch or an existing worktree). Cut the story branch as the atomic claim. Remove every read of worktree.enabled.

Type: deliverable
Branch: DIP-11.4/deliver-auto-isolation
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The readiness/start steps choose the main checkout when no other story is claimed and a worktree when a live <id>/* branch or an existing worktree is detected
- [ ] #2 The story branch cut is the atomic claim; a duplicate branch causes a clean fallback to a worktree
- [ ] #3 No step reads worktree.enabled; worktree.path, install and includeGitignored are still used when a worktree is taken
- [ ] #4 Both the in-place clean-base path and the worktree path are documented under the new auto-detect rule
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rewrite Step 1.6 and Step 2 to branch on detected concurrency rather than config. Replace the 'Worktree disabled (worktree.enabled:false)' prose with 'repo quiet' vs 'repo busy'. Update parallel-delivery.md to match.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Detection commands already exist: git branch --list '<id>/*', git worktree list. Verify: none automated; self-review.
<!-- SECTION:NOTES:END -->
