---
id: DIP-11.5
title: 'backlog-init: empty-repo bootstrap with purpose README and first commit/push'
status: To Do
assignee: []
created_date: '2026-08-14 11:07'
labels:
  - story
dependencies:
  - DIP-11.1
  - DIP-11.2
references:
  - skills/backlog-init/SKILL.md
parent_task_id: DIP-11
type: feature
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Give backlog-init an empty-repo bootstrap: when HEAD is unborn, interview the repo purpose/goal, write a README, and make one init commit (README + .claude/backlog-workflow.json + backlog scaffold) on main, pushing only when the remote has no such branch. A repo that already has history stays hands-off (write files, no commit/push). Drop the worktree.enabled interview question and config-example key.

Type: deliverable
Branch: DIP-11.5/init-empty-repo-bootstrap
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 On an unborn-HEAD repo, init interviews the repo purpose/goal and writes a README capturing it
- [ ] #2 init makes exactly one bootstrap commit bundling README, .claude/backlog-workflow.json and the backlog scaffold, on the base branch
- [ ] #3 init pushes the bootstrap commit only when the remote branch is absent; a repo with existing history is never committed to or pushed by init
- [ ] #4 The interview no longer asks worktree.enabled and the written config example omits it
- [ ] #5 Both the empty-repo path and the existing-repo hands-off path are documented
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add unborn-HEAD detection, a purpose interview, a README write, a single bootstrap commit and a conditional first push to the init flow. Remove the worktree.enabled question in Step 2 and the enabled key in the Step 3 JSON. Cross-reference the guard exceptions (DIP-11.2).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The bootstrap commit is guard-permitted only because HEAD is unborn / no remote branch (DIP-11.2). Existing-repo behaviour is unchanged from today. Verify: none automated; self-review.
<!-- SECTION:NOTES:END -->
