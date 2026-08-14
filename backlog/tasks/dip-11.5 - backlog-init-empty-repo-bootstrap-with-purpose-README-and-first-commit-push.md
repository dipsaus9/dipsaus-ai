---
id: DIP-11.5
title: 'backlog-init: empty-repo bootstrap with purpose README and first commit/push'
status: Done
assignee: []
created_date: '2026-08-14 11:07'
updated_date: '2026-08-14 13:13'
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
- [x] #1 On an unborn-HEAD repo, init interviews the repo purpose/goal and writes a README capturing it
- [x] #2 init makes exactly one bootstrap commit bundling README, .claude/backlog-workflow.json and the backlog scaffold, on the base branch
- [x] #3 init pushes the bootstrap commit only when the remote branch is absent; a repo with existing history is never committed to or pushed by init
- [x] #4 The interview no longer asks worktree.enabled and the written config example omits it
- [x] #5 Both the empty-repo path and the existing-repo hands-off path are documented
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add unborn-HEAD detection, a purpose interview, a README write, a single bootstrap commit and a conditional first push to the init flow. Remove the worktree.enabled question in Step 2 and the enabled key in the Step 3 JSON. Cross-reference the guard exceptions (DIP-11.2).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The bootstrap commit is guard-permitted only because HEAD is unborn / no remote branch (DIP-11.2). Existing-repo behaviour is unchanged from today. Verify: none automated; self-review.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
backlog-init gained an empty-repo bootstrap. Step 1.6 detects an unborn HEAD and whether the remote base branch exists. On an unborn HEAD, init interviews the repo purpose/goal (new Step 2 question, empty-repo only), writes a README.md capturing it, and makes exactly one bootstrap commit on the base branch bundling the README, .claude/backlog-workflow.json and the Backlog.md scaffold — pushing only when git ls-remote shows the remote base branch is absent. Both the commit and the push are guard-permitted solely by the DIP-11.2 empty-repo exceptions. A repo that already has history stays fully hands-off: init writes its files but never commits or pushes. The worktree.enabled interview question and the enabled key in the config example were removed (isolation is auto-detected since DIP-11.1). The report (Step 6), the one-file note, and the SKILL description were updated to cover the bootstrap and hands-off paths.
<!-- SECTION:FINAL_SUMMARY:END -->
