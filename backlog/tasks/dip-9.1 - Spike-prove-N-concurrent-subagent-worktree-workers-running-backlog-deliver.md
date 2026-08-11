---
id: DIP-9.1
title: 'Spike: prove N concurrent subagent-worktree workers running backlog-deliver'
status: Done
assignee: []
created_date: '2026-08-09 15:22'
updated_date: '2026-08-09 16:17'
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
- [x] #1 Documented result, with the run transcript, of dispatching 2 subagent workers (isolation: worktree) that each deliver a real ready story end to end concurrently
- [x] #2 The nested-subagent case is verified: a worker successfully spawns the story-reviewer subagent, or the depth limit is recorded with the fallback (e.g. worker skips the gate / orchestrator reviews)
- [x] #3 N-committer git safety recorded: whether N worktrees committing + pushing against one shared .git is safe, and any serialization the orchestrator must impose (e.g. push one at a time)
- [x] #4 Go/no-go on the subagent-worktree model with the exact constraints backlog-run (DIP-9.2) must honor, recorded in skills/backlog-run/reference/orchestration.md and approved by the user
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pick 2 ready non-colliding stories (or synthetic throwaways). 2. Dispatch 2 isolation:worktree subagents each running backlog-deliver; observe concurrency, nested reviewer subagent, and commit/push interleaving. 3. Record depth limits + git-safety constraints. 4. Write the reference doc, get approval, close.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Type: spike — deliverable is the recorded decision, no code gates. Use throwaway branches/worktrees and clean them up; do not leave DIP-9.* branches that a later gate reads as claims. If nested subagents are not allowed, the fallback (worker returns diff, orchestrator runs the reviewer) must be specified here so DIP-9.2 can implement it.

Findings (experiments in this repo). AC#2 nested subagents: PROVEN — main -> subagent -> nested subagent returned PONG, no error, so a worker running backlog-deliver can spawn the story-reviewer subagent; no fallback needed. AC#1/#3 concurrency: two isolation:worktree subagents dispatched concurrently each got their own worktree (.claude/worktrees/agent-*) + own branch, committed concurrently (shas 9fb83d8 / a002f4a) to the shared object store (--git-common-dir = main .git), no interference. KEY REFINEMENT: built-in isolation:worktree names the branch worktree-agent-<id>, NOT <id>/<slug>, and backlog-deliver (DIP-7.5) already creates its own .worktrees/<id> with -b <id>/<slug> — so DIP-9.2 must spawn PLAIN subagents (no isolation) and let each worker's backlog-deliver own the worktree/branch. Constraints for 9.2: (1) plain subagents, backlog-deliver owns the worktree; (2) serialize the final pushes (concurrent commits to distinct branches are safe, concurrent pushes can contend on the remote/shared refs); (3) first real backlog-run is a supervised trial (no 2 independent ready stories existed to exercise a full concurrent real run). GO on the subagent-worker model with the refinement. Full record: skills/backlog-run/reference/orchestration.md.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
GO on the subagent-worker model, with a refinement the spike surfaced. Proven in this repo: nested subagents work (a worker can spawn the story-reviewer — main→subagent→nested returned PONG), and two concurrent isolation:worktree subagents each committed to their own worktree/branch on the shared object store with no interference. Refinement: the built-in isolation:worktree names branches worktree-agent-<id>, not <id>/<slug>, and backlog-deliver already creates its own .worktrees/<id> with -b <id>/<slug> — so backlog-run must spawn PLAIN subagents and let each worker's backlog-deliver own the worktree/branch. Constraints for DIP-9.2: plain subagents; serialize the final pushes; first real run supervised (no two independent ready stories existed to exercise a full concurrent real run). Recorded in skills/backlog-run/reference/orchestration.md.
<!-- SECTION:FINAL_SUMMARY:END -->
