---
id: DIP-11.3
title: 'backlog-plan: challenge-the-goal step, opt-out spikes, plan-branch materialize'
status: To Do
assignee: []
created_date: '2026-08-14 11:07'
labels:
  - story
dependencies: []
references:
  - skills/backlog-plan/SKILL.md
  - skills/backlog-plan/reference/story-standard.md
  - skills/backlog-plan/reference/story-template.md
parent_task_id: DIP-11
type: feature
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sharpen backlog-plan: add a mandatory challenge-the-goal step, flip spikes to a justification-gated opt-out (resolve unknowns in-session by default), and materialize the backlog on a plan/<epic-id> branch (PR per pr.mode) instead of leaving tasks on base. The interview runs with no isolation; materialize uses a worktree when the main checkout is busy.

Type: deliverable
Branch: DIP-11.3/plan-sharper-interview
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Step 1 includes a required challenge-the-goal step: at least one alternative approach is surfaced and the chosen approach is justified on the epic before decomposition
- [ ] #2 Spike policy is opt-out: the default is to resolve unknowns in-session (interview + web search); a Type: spike story is created only when the unknown needs delivery-time code experimentation
- [ ] #3 Every spike story records a one-line justification for why planning could not settle it
- [ ] #4 Materialize commits the new backlog tasks on a plan/<epic-id> branch and pushes per pr.mode; it never commits on base
- [ ] #5 The interview needs no worktree; materialize creates its own worktree when the main checkout is busy
- [ ] #6 story-standard.md and story-template.md reflect the spike-justification requirement
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add challenge-the-goal to Step 1. Rewrite the spike guidance in Step 2 and story-standard section Optional to opt-out with a justification line. Replace the 'leaves tasks on base, never commits' rule in Golden rules and Step 5 with the plan/<epic-id> branch + PR model and the busy-checkout worktree rule. State the interview is isolation-free.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Larger story (two facets: interview sharpness + git model) kept as one because both rewrite SKILL.md and cannot parallelize. Guard stays clean: the plan branch is non-base. Verify: none automated (prose skill); self-review against the story standard.
<!-- SECTION:NOTES:END -->
