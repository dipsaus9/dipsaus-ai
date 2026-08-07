---
id: DIP-7.8
title: 'flow-init: repo scan, configuration interview, backlog bootstrap'
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
labels:
  - story
dependencies:
  - DIP-7.3
  - DIP-7.4
references:
  - skills/flow-init/
parent_task_id: DIP-7
priority: medium
type: feature
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A repo with no backlog gets one, and any repo gets a valid workflow config, without the user answering questions the repo already answers. flow-init scans for stack, scripts, base branch and existing backlog, interviews only for what the scan cannot settle, and writes a schema-valid .claude/backlog-workflow.json.

This is what makes the suite usable outside this repo — today verify detection assumes package.json exists.

Type: deliverable
Branch: DIP-7.8/init-repo-scan
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The scan detects package manager and lockfile for node/bun, python, go, rust, java, php, ruby and dotnet, plus existing lint/test/build scripts, the base branch, and whether a backlog already exists
- [ ] #2 The interview asks only what the scan cannot settle — task prefix proposed from the repo name, parallelism.maxAgents, worktree on/off, pr mode, reviewer model — one question at a time, each with a recommendation
- [ ] #3 It writes a .claude/backlog-workflow.json that passes the CLI's validate subcommand
- [ ] #4 It runs backlog init with the resolved flags when no backlog exists, and never re-initialises an existing one
- [ ] #5 It refuses to overwrite an existing config without explicit confirmation, and prints what would change first
- [ ] #6 It ends by printing the resolved verify command list for the repo, so the user can see what delivery will run before trusting it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Write the scan step against verify-detect from the CLI rather than duplicating detection logic.
2. Write the interview, one question per decision, recommendations included.
3. Config write + validate call.
4. backlog init invocation with resolved flags.
5. Overwrite guard and the closing verify-list print.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Detection logic belongs in the CLI (DIP-7.3), not in this skill — the skill orchestrates and interviews, the CLI decides. Two copies of stack detection would drift immediately.

auto_commit must stay false in any backlog this initialises; the git contract cannot hold if the backlog tool commits by itself.

Verify: run init against a scratch repo of a non-node stack and confirm the resulting config validates and the verify list is non-empty.
<!-- SECTION:NOTES:END -->
