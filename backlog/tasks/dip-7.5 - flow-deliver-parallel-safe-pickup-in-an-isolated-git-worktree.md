---
id: DIP-7.5
title: 'flow-deliver: parallel-safe pickup in an isolated git worktree'
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
labels:
  - story
dependencies:
  - DIP-7.1
  - DIP-7.3
  - DIP-7.4
references:
  - skills/flow-deliver/SKILL.md
  - skills/flow-deliver/reference/parallel-delivery.md
  - skills/flow-deliver/reference/git-contract.md
parent_task_id: DIP-7
priority: high
type: feature
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
flow-deliver stops assuming it is the only agent in the repo. It creates its own worktree for the story, installs dependencies there, and replaces the readiness gate that currently demands a clean tree on the base branch — the exact condition a parallel run cannot satisfy. Pickup is refused when another in-flight story's References collide with this one.

This is the worktree story: creation, install, gitignored-file copying and teardown all land here.

Type: deliverable
Branch: DIP-7.5/worktree-pickup
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 flow-deliver creates the story's checkout with `git worktree add <path> -b <id>/<slug>` from an up-to-date base, so the branch matches the story's frozen Branch line verbatim
- [ ] #2 The stack's install step runs inside the new worktree, resolved from the workflow config rather than guessed
- [ ] #3 Gitignored files named in the config are copied into the worktree before the first verify runs
- [ ] #4 Teardown after push removes the worktree and keeps the branch, and refuses to remove a worktree holding uncommitted changes
- [ ] #5 The readiness gate is rewritten per DIP-7.1: it no longer requires standing on the base branch, and instead requires an up-to-date base, a clean own worktree, an unclaimed story, and a clean `collisions <id>` result
- [ ] #6 The claim protocol is documented in the skill and enforced at the gate: what constitutes a claim, and how a second agent detects one made by the first
- [ ] #7 Worktree mode is config-gated — with worktree disabled, the skill delivers on a branch in place exactly as it does today
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Implement the rewritten readiness gate from DIP-7.1's checklist, including the collisions call.
2. Add worktree creation and the branch cut in one step.
3. Add install + gitignored-file copying.
4. Add teardown with the dirty-worktree refusal.
5. Add the config gate for worktree-disabled repos and document the claim protocol.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DIP-7.1's reference doc is the specification for this story — implement it rather than re-deciding it. If reality contradicts the spike, stop and amend the spike's decision rather than silently diverging.

The old gate's "clean tree, on the base branch" rule was what made autonomous commits safe. Whatever replaces it must preserve that guarantee at the worktree level, not drop it.

Verify: cut two worktrees for two ready stories and confirm the second is refused when References collide and accepted when they do not.
<!-- SECTION:NOTES:END -->
