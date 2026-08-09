---
id: DIP-7.10
title: 'Guard hooks: enforce the git contract instead of trusting prose'
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-09 09:23'
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
- [x] #1 hooks/backlog-guard/ ships a PreToolUse guard that blocks committing on the base branch, `git add -A` and `git add .`, pushing the base branch, `--no-verify`, and gh/glab invocations when the repo's pr mode is link
- [x] #2 The guard exits 0 and blocks nothing in any repo with no .claude/backlog-workflow.json
- [x] #3 The guard does not block the delivery skill's own legitimate commands, using the discriminating condition established in DIP-7.2
- [x] #4 A blocked call returns an explanation naming both the rule that blocked it and the config key that would relax it, if any
- [x] #5 The guard is wired into hooks/hooks.json alongside the existing dad-joke hooks with no change to their behaviour
- [x] #6 Unit tests cover the block/allow decision for each rule; bun run lint, typecheck and test are green
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

Delivered. hooks/backlog-guard/decision.ts (pure, unit-tested) + on-pre-tool-use.ts (entrypoint) + hooks.json PreToolUse/Bash wiring. Rules (frozen DIP-7.2 set): no-commit-on-base, no-push-base, scoped-staging (add -A/./--all), never-no-verify, no-host-cli-in-link-mode. Discriminator = branch identity (commit/push blocked only on/targeting base; story-branch commits pass) — AC#3. Fail-open (try/catch -> exit 0) and no-op when .claude/backlog-workflow.json absent (AC#2, first check in decide). Deny reason names the rule + the relaxing config key where one exists (AC#4). 12 new unit tests incl. the mainline-vs-main substring edge (\b word boundary); 210 total green; lint+typecheck clean. E2E on the real entrypoint confirmed: commit-on-base + gh-in-link denied with reasons, non-git allowed, no-config no-op. plugin.json still says 'skills, hooks + MCP' — no 'agents'/guard mention needed; manifest-description refresh owned by DIP-7.11. dad-joke hooks untouched (AC#5).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the guard hooks that make the git contract enforceable instead of prose-only. hooks/backlog-guard/ ships a pure, unit-tested decide() and a fail-open PreToolUse entrypoint wired into hooks.json (Bash matcher, alongside the untouched dad-joke hooks). It blocks committing on the base branch, git add -A/./--all, pushing the base branch, --no-verify, and gh/glab while pr.mode is link — keyed on branch identity so the delivery skill's own story-branch commits always pass, and no-ops entirely in any repo without a .claude/backlog-workflow.json. Blocked calls explain the rule and the config key that relaxes it. 12 new tests (210 total green), lint and typecheck clean, and the real entrypoint verified end-to-end. Only DIP-7.11 (cutover) remains.
<!-- SECTION:FINAL_SUMMARY:END -->
