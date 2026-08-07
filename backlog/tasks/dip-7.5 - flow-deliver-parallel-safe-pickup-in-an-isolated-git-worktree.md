---
id: DIP-7.5
title: 'flow-deliver: parallel-safe pickup in an isolated git worktree'
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 14:08'
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
- [x] #1 flow-deliver creates the story's checkout with `git worktree add <path> -b <id>/<slug>` from an up-to-date base, so the branch matches the story's frozen Branch line verbatim
- [x] #2 The stack's install step runs inside the new worktree, resolved from the workflow config rather than guessed
- [x] #3 Gitignored files named in the config are copied into the worktree before the first verify runs
- [x] #4 Teardown after push removes the worktree and keeps the branch, and refuses to remove a worktree holding uncommitted changes
- [x] #5 The readiness gate is rewritten per DIP-7.1: it no longer requires standing on the base branch, and instead requires an up-to-date base, a clean own worktree, an unclaimed story, and a clean `collisions <id>` result
- [x] #6 The claim protocol is documented in the skill and enforced at the gate: what constitutes a claim, and how a second agent detects one made by the first
- [x] #7 Worktree mode is config-gated — with worktree disabled, the skill delivers on a branch in place exactly as it does today
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

Delivered as flow-deliver skill behaviour (no runtime code -> no new tests; repo gates green). Step 1 gate rewritten per reference/parallel-delivery.md: base current+fetched, well-formed, deps Done, not-claimed via branch refs (git branch/ls-remote/worktree list — NOT task status), collisions via bun ${CLAUDE_PLUGIN_ROOT}/bin/backlog-workflow.ts collisions <id>, worktree-creatable; main-checkout cleanliness no longer required. Step 2 creates the worktree with git worktree add <path>/<id> -b <id>/<slug> <base> (branch ref = the claim), installs worktree.install inside it, copies worktree.includeGitignored (never .env unless named). Step 6 tears down after push with git worktree remove (refuses dirty; never --force; keeps branch) + branch-hygiene note. All worktree behaviour config-gated on worktree.enabled; disabled = classic in-place branch delivery. git-contract.md § Branch updated to note the worktree cut so it doesn't contradict Step 2. Claim protocol (AC#6): claim = <id>/<slug> branch ref, detected by a second agent via git branch --list '<id>/*'.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
flow-deliver now picks up a story in its own git worktree and is safe to run in parallel. The readiness gate is rewritten per the DIP-7.1 decision: it keys on branch refs (the real cross-worktree claim signal) plus a backlog-workflow collisions check, and drops the impossible 'clean tree on the base branch' requirement. Step 2 creates the worktree and cuts <id>/<slug> in one command, installs deps inside it from worktree.install, and copies only the gitignored files the config names. Step 6 tears the worktree down after push with git worktree remove — which refuses a dirty tree (never --force) and keeps the branch. Everything worktree is gated on worktree.enabled, so a repo with the feature off delivers in place exactly as before. Unblocks DIP-7.6.
<!-- SECTION:FINAL_SUMMARY:END -->
