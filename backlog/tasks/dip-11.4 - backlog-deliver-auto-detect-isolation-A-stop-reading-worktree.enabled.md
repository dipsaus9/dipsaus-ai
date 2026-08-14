---
id: DIP-11.4
title: 'backlog-deliver: auto-detect isolation (A''), stop reading worktree.enabled'
status: Done
assignee: []
created_date: '2026-08-14 11:07'
updated_date: '2026-08-14 13:08'
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
- [x] #1 The readiness/start steps choose the main checkout when no other story is claimed and a worktree when a live <id>/* branch or an existing worktree is detected
- [x] #2 The story branch cut is the atomic claim; a duplicate branch causes a clean fallback to a worktree
- [x] #3 No step reads worktree.enabled; worktree.path, install and includeGitignored are still used when a worktree is taken
- [x] #4 Both the in-place clean-base path and the worktree path are documented under the new auto-detect rule
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rewrite Step 1.6 and Step 2 to branch on detected concurrency rather than config. Replace the 'Worktree disabled (worktree.enabled:false)' prose with 'repo quiet' vs 'repo busy'. Update parallel-delivery.md to match.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Detection commands already exist: git branch --list '<id>/*', git worktree list. Verify: none automated; self-review.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
backlog-deliver now auto-detects isolation (A') from live repo state instead of a config flag. Step 1.6 picks the lane: repo quiet (no live <id>/* story branch, no existing worktree, clean base) -> deliver in the main checkout in place; repo busy (a live <id>/* branch, an existing worktree, or a dirty main checkout) -> deliver in an isolated worktree so in-flight work is untouched. Step 2 makes the atomic <id>/<slug> branch cut the claim in either lane, and a duplicate-branch failure in the in-place lane is treated as a lost race that falls back cleanly to a worktree rather than committing over it. Every read of worktree.enabled is removed (the key was dropped in DIP-11.1); worktree.path/install/includeGitignored still configure a worktree when one is taken. parallel-delivery.md's old config-gate prose and the SKILL frontmatter description were rewritten to the auto-detect model.
<!-- SECTION:FINAL_SUMMARY:END -->
