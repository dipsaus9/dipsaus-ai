---
id: DIP-8.3
title: 'CI-side review: open the PR and review it in GitHub Actions'
status: To Do
assignee: []
created_date: '2026-08-09 12:20'
updated_date: '2026-08-12 12:48'
labels:
  - needs-refinement
dependencies: []
references:
  - .github/
parent_task_id: DIP-8
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A GitHub Actions workflow that, on push of a story branch, opens the PR and runs a Claude review against the story's acceptance criteria (claude-code-action), keeping the agent itself off host APIs. GitHub-specific; needs a repo secret / API key. Deferred from DIP-7 (chosen there: opt-in gh create in the skill, review via shipped subagent).

Type: deliverable
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A CI workflow opens the PR on story-branch push and posts a Claude review keyed to the story's acceptance criteria
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Refined 2026-08-12: dropped as already-covered. Local review is provided by the story-reviewer subagent gate that backlog-deliver runs before every push (DIP-7.6/7.9), plus Claude Code's own /code-review for on-demand local review. The user chose local-only review over a CI/GitHub-Actions workflow, and no separate skill is needed. Archived.
<!-- SECTION:NOTES:END -->
