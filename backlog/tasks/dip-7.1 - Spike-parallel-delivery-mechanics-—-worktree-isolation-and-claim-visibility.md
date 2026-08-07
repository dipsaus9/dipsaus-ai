---
id: DIP-7.1
title: 'Spike: parallel delivery mechanics — worktree isolation and claim visibility'
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 12:13'
labels:
  - story
dependencies: []
references:
  - skills/flow-deliver/reference/parallel-delivery.md
parent_task_id: DIP-7
priority: high
type: spike
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Decide, with evidence gathered in this repo, how a story claim made by one agent becomes visible to another agent working in a separate git worktree, and what the rewritten readiness gate must therefore check. Everything DIP-7.5 implements depends on these answers; without them the gate is a guess.

Backlog.md stores task state as files in the repo, so a claim committed on a story branch is invisible to a second checkout unless cross-branch scanning picks it up. config.yml has check_active_branches, remote_operations and active_branch_days for exactly this, but their behaviour across worktrees sharing one .git is unverified.

Type: spike
Branch: DIP-7.1/parallel-delivery-mechanics
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Documented answer, with the commands run and their raw output, to: does a status change committed on a story branch become visible to `backlog task list --plain` run from a second worktree before that branch is pushed
- [x] #2 Effect of check_active_branches, remote_operations and active_branch_days on cross-branch task state recorded, including whether stale story branches reintroduce the duplicate-task-ID error
- [x] #3 Worktree lifecycle decided and written down: path convention, per-stack install step, which gitignored files get copied, and the teardown rule for a worktree holding uncommitted changes
- [x] #4 The rewritten readiness-gate rules are specified as an ordered checklist precise enough for DIP-7.5 to implement without further research
- [x] #5 Decision and rationale recorded in skills/flow-deliver/reference/parallel-delivery.md, and explicitly approved by the user before the story closes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create two throwaway worktrees on this repo and drive a real claim from one; observe what the other sees, before and after push.
2. Toggle check_active_branches / remote_operations and repeat, recording each combination.
3. Test teardown behaviour with clean and dirty worktrees.
4. Decide the install and gitignored-file policy per stack.
5. Write the reference doc, present findings, get approval, close.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Type: spike, so the code loop does not apply — the deliverable is the recorded decision.

Prior art in memory: stale story branches have already caused duplicate-task-ID errors in the Backlog.md browser, which is direct evidence that cross-branch scanning is live and sensitive to branch hygiene. Include a branch-hygiene rule in the decision.

Use throwaway branches for the experiment and delete them; do not leave DIP-7.* branches behind that a later readiness gate would read as in-flight claims.

Verify: the reference doc answers every acceptance criterion with the command output that proves it.

Findings (experiments run in this repo, two worktrees off main):
- AC#1: claim committed on a story branch, unpushed, is INVISIBLE to a second worktree — B read DIP-7.2 as 'To Do' while A had committed 'In Progress' on exp/wt-A. Stayed 'To Do' in B even after A pushed and B fetched.
- AC#2: cross-branch scan (check_active_branches:true, remote_operations:true, active_branch_days:30) is a union-for-EXISTENCE, not a merge of state; the local checkout's copy of an existing task's status wins. Duplicate-task-ID = existence-union over stale branches; fix is branch hygiene (delete merged story branches), not a config toggle.
- Consequence: the CLAIM is the <id>/<slug> branch ref (shared across worktrees via the one .git, visible with git branch --list '<id>/*' without a push), NOT task status.
- AC#3: worktree at .worktrees/<id> created with -b <id>/<slug>; install per detected stack; gitignored files copied only from an explicit include list (never .env unless named); teardown 'git worktree remove' REFUSES a dirty tree (measured) — rule is remove-after-push, never --force, branch retained.
- AC#4: rewritten gate keys on branch/worktree refs + a References-collision check instead of 'clean tree on base branch'.
Full record with raw output: skills/flow-deliver/reference/parallel-delivery.md
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Spike resolved by experiment in this repo (two worktrees off main). Key decision: a story claim is the <id>/<slug> branch ref (shared across all worktrees via the single .git, visible with git branch --list '<id>/*' without a push), NOT task status — a status change committed on one branch is invisible to another worktree's backlog reads (measured before and after push+fetch). The cross-branch scan is an existence-union, not a state-merge; the duplicate-task-id risk is a branch-hygiene problem fixed by deleting merged story branches. Worktrees live at .worktrees/<id>/ (git-ignored, user-approved), created with -b <id>/<slug>, installed per detected stack, gitignored files copied only from an explicit include list, torn down after push without --force (dirty tree refuses; stop and surface). The readiness gate is rewritten to key on branch/worktree refs plus a References-collision check instead of 'clean tree on the base branch'. Full record with raw command output: skills/flow-deliver/reference/parallel-delivery.md. Feeds DIP-7.5.
<!-- SECTION:FINAL_SUMMARY:END -->
