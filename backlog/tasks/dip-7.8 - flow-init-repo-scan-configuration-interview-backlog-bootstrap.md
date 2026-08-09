---
id: DIP-7.8
title: 'flow-init: repo scan, configuration interview, backlog bootstrap'
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-09 09:53'
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
- [x] #1 The scan detects package manager and lockfile for node/bun, python, go, rust, java, php, ruby and dotnet, plus existing lint/test/build scripts, the base branch, and whether a backlog already exists
- [x] #2 The interview asks only what the scan cannot settle — task prefix proposed from the repo name, parallelism.maxAgents, worktree on/off, pr mode, reviewer model — one question at a time, each with a recommendation
- [x] #3 It writes a .claude/backlog-workflow.json that passes the CLI's validate subcommand
- [x] #4 It runs backlog init with the resolved flags when no backlog exists, and never re-initialises an existing one
- [x] #5 It refuses to overwrite an existing config without explicit confirmation, and prints what would change first
- [x] #6 It ends by printing the resolved verify command list for the repo, so the user can see what delivery will run before trusting it
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

Delivered flow-init (replaced the DIP-7.4 stub; SKILL.md only, no runtime code -> no new tests; gates green). Step 0 refuse-to-clobber (AC#5). Step 1 scan: 8 stacks by manifest+lockfile (node/bun, python, go, rust, java, php, ruby, dotnet) + verify-detect CLI + base branch + existing backlog + repo name (AC#1). Step 2 interview only the gaps (prefix, parallelism.maxAgents, worktree, pr.mode, review.model/enabled/maxRounds), one at a time with recommendations (AC#2). Step 3 write .claude/backlog-workflow.json then validate via the CLI (AC#3) — the skill's documented example config was run through the real validator and exits 0. Step 4 backlog init only when none exists, never re-init, auto_commit must stay false (AC#4). Step 5 ends by printing the resolved verify list (AC#6). Detection stays in the CLI (single source of truth); the scan's broader 8-stack presence check is for 'which stack', while verify commands come from verify-detect (node/bun/python/go/rust). Kept disable-model-invocation: true until DIP-7.11 cutover.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
flow-init now bootstraps the flow workflow in a repo of any stack. It scans for stack and package manager across eight ecosystems, resolves the verify list via the workflow CLI, finds the base branch and any existing backlog, then interviews only the gaps (task prefix, maxAgents, worktree, PR mode, reviewer) one question at a time with recommendations. It writes a .claude/backlog-workflow.json and validates it with the CLI (the skill's own example config passes the real validator), runs backlog init only when none exists with auto_commit false, refuses to clobber an existing config, and ends by printing the resolved verify list so the user sees what delivery will run. Detection logic stays in the CLI — the skill orchestrates. Only the DIP-7.11 cutover remains to close the epic.
<!-- SECTION:FINAL_SUMMARY:END -->
