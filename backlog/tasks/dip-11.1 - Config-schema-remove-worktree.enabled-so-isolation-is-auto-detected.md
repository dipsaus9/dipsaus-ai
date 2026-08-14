---
id: DIP-11.1
title: 'Config schema: remove worktree.enabled so isolation is auto-detected'
status: To Do
assignee: []
created_date: '2026-08-14 11:07'
labels:
  - story
dependencies: []
references:
  - src/workflow/schema.ts
  - tests/unit/workflow-schema.test.ts
  - bin/backlog-workflow.ts
  - skills/backlog-plan/reference/config.md
parent_task_id: DIP-11
type: feature
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove worktree.enabled from the workflow config schema so isolation is auto-detected, not configured. Update the CLI validate path and the config reference doc. A config that still carries worktree.enabled fails validation with a clear removal message (the schema is .strict()).

Type: deliverable
Branch: DIP-11.1/config-drop-worktree-enabled
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 WorkflowConfig no longer defines worktree.enabled; the remaining worktree keys (path, install, includeGitignored) are unchanged
- [ ] #2 A config object containing worktree.enabled fails parseConfig with a field-level issue naming worktree.enabled as an unknown key
- [ ] #3 tests/unit/workflow-schema.test.ts covers both the accepted shape (no enabled) and the rejected shape (enabled present)
- [ ] #4 skills/backlog-plan/reference/config.md documents that isolation is auto-detected and no longer configured
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Delete the enabled field from the worktree object in schema.ts; rely on .strict() to reject it as an unknown key. Add/adjust workflow-schema tests for accepted and rejected shapes. Update config.md prose. Confirm bin validate output still reads cleanly.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Migration option (i) hard-remove approved: no soft-deprecation. This repo has no own .claude/backlog-workflow.json so nothing local breaks. Verify: bun run test, bun run typecheck, bun run lint.
<!-- SECTION:NOTES:END -->
