---
id: DIP-7.1
title: 'Spike: parallel delivery mechanics — worktree isolation and claim visibility'
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
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
- [ ] #1 Documented answer, with the commands run and their raw output, to: does a status change committed on a story branch become visible to `backlog task list --plain` run from a second worktree before that branch is pushed
- [ ] #2 Effect of check_active_branches, remote_operations and active_branch_days on cross-branch task state recorded, including whether stale story branches reintroduce the duplicate-task-ID error
- [ ] #3 Worktree lifecycle decided and written down: path convention, per-stack install step, which gitignored files get copied, and the teardown rule for a worktree holding uncommitted changes
- [ ] #4 The rewritten readiness-gate rules are specified as an ordered checklist precise enough for DIP-7.5 to implement without further research
- [ ] #5 Decision and rationale recorded in skills/flow-deliver/reference/parallel-delivery.md, and explicitly approved by the user before the story closes
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
<!-- SECTION:NOTES:END -->
