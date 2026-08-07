---
id: DIP-7.10
title: 'Guard hooks: enforce the git contract instead of trusting prose'
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
labels:
  - story
dependencies:
  - DIP-7.2
  - DIP-7.3
references:
  - hooks/backlog-guard/
  - hooks/hooks.json
  - tests/unit/
parent_task_id: DIP-7
priority: medium
type: feature
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The rules the skill currently only asks for become unbreakable: no commits on the base branch, no blanket staging, no base-branch push, no --no-verify, and no host-API PR commands when the repo is in link mode. The guard is inert in any repo without a workflow config, so installing the plugin cannot interfere with unrelated work.

This is the determinism win — the guard does not depend on the model remembering anything on a long run.

Type: deliverable
Branch: DIP-7.10/git-guard-hooks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 hooks/backlog-guard/ ships a PreToolUse guard that blocks committing on the base branch, `git add -A` and `git add .`, pushing the base branch, `--no-verify`, and gh/glab invocations when the repo's pr mode is link
- [ ] #2 The guard exits 0 and blocks nothing in any repo with no .claude/backlog-workflow.json
- [ ] #3 The guard does not block the delivery skill's own legitimate commands, using the discriminating condition established in DIP-7.2
- [ ] #4 A blocked call returns an explanation naming both the rule that blocked it and the config key that would relax it, if any
- [ ] #5 The guard is wired into hooks/hooks.json alongside the existing dad-joke hooks with no change to their behaviour
- [ ] #6 Unit tests cover the block/allow decision for each rule; bun run lint, typecheck and test are green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Write the decision function as a pure, testable unit first, with its tests.
2. Add the no-config short circuit as the very first check.
3. Wrap it in the hook entrypoint and wire hooks.json.
4. Manually confirm a legitimate story commit still passes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
A guard that blocks a legitimate delivery commit breaks every remaining story in the epic, including this one. The no-config short circuit and the legitimate-command test are the two criteria that prevent that — treat them as the story's real risk, not paperwork.

The blocked-call message matters: an agent that gets an opaque denial will try a workaround. Naming the rule and the escape hatch is what makes it stop instead.

Verify: bun run test, plus a manual attempt at each blocked command in this repo and one in a repo without a config.
<!-- SECTION:NOTES:END -->
