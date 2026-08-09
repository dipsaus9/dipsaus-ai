---
id: DIP-9.1
title: 'Spike: prove N concurrent subagent-worktree workers running backlog-deliver'
status: To Do
assignee: []
created_date: '2026-08-09 15:22'
updated_date: '2026-08-09 15:22'
labels:
  - story
dependencies: []
references:
  - skills/backlog-run/reference/orchestration.md
parent_task_id: DIP-9
priority: high
type: spike
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prove the subagent-worktree worker model at N>1 before backlog-run is built on it. DIP-7.1/7.2 proved a single worktree worker and a single reviewer subagent; unverified is the parallel case: N subagents each running backlog-deliver (which itself spawns the story-reviewer subagent — a NESTED subagent) while N of them commit and push at once against one shared .git.

Type: spike
Branch: DIP-9.1/orchestrator-parallel-spike
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Documented result, with the run transcript, of dispatching 2 subagent workers (isolation: worktree) that each deliver a real ready story end to end concurrently
- [ ] #2 The nested-subagent case is verified: a worker successfully spawns the story-reviewer subagent, or the depth limit is recorded with the fallback (e.g. worker skips the gate / orchestrator reviews)
- [ ] #3 N-committer git safety recorded: whether N worktrees committing + pushing against one shared .git is safe, and any serialization the orchestrator must impose (e.g. push one at a time)
- [ ] #4 Go/no-go on the subagent-worktree model with the exact constraints backlog-run (DIP-9.2) must honor, recorded in skills/backlog-run/reference/orchestration.md and approved by the user
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pick 2 ready non-colliding stories (or synthetic throwaways). 2. Dispatch 2 isolation:worktree subagents each running backlog-deliver; observe concurrency, nested reviewer subagent, and commit/push interleaving. 3. Record depth limits + git-safety constraints. 4. Write the reference doc, get approval, close.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Type: spike — deliverable is the recorded decision, no code gates. Use throwaway branches/worktrees and clean them up; do not leave DIP-9.* branches that a later gate reads as claims. If nested subagents are not allowed, the fallback (worker returns diff, orchestrator runs the reviewer) must be specified here so DIP-9.2 can implement it.
<!-- SECTION:NOTES:END -->
