---
id: DIP-8.1
title: 'Orchestrator: dispatch N parallel workers over the ready backlog'
status: To Do
assignee: []
created_date: '2026-08-09 12:20'
labels:
  - needs-refinement
dependencies: []
references:
  - skills/
  - bin/
parent_task_id: DIP-8
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A session-level orchestrator that reads the backlog, picks the N ready non-colliding stories (backlog-workflow collisions + dependency graph), spawns N workers (subagents with isolation: worktree, or background sessions) each running backlog-deliver on one story, and reports N compare links. This is the 'full agentic mode' — the human stops being the scheduler. Deferred from DIP-7 (chosen there: 'you dispatch, skill keeps it safe'). Type: spike-then-build.

Type: deliverable
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Design decided: subagent isolation:worktree vs background sessions vs agent teams, with the concurrency + git-safety model proven
- [ ] #2 Orchestrator picks only ready, non-colliding stories and never double-claims
<!-- AC:END -->
